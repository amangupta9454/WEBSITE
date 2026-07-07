// api/index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const auditLogger = require("./utils/auditLogger");
require("dotenv").config();
const { validateEnv } = require('./utils/envValidator');
validateEnv(); // Fail fast if missing required environment variables

const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

const registerRoutes = require("./routes/register");
const adminRoutes = require("./routes/admin");
const verifyRoutes = require("./routes/verify");
const projectRoutes = require("./routes/project");
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const cronRoutes = require("./routes/cron");
const contactRoutes = require("./routes/contact");
const interviewAuthRoutes = require("./routes/interviewAuth");
const interviewSessionRoutes = require("./routes/interviewSession");
const interviewPaymentRoutes = require("./routes/interviewPayment");
const resumeRoutes = require("./routes/resume");
const adminResumeRoutes = require("./routes/adminResume");
const jobRoutes = require("./routes/jobs");
const otpRoutes = require("./routes/otp");
const interviewConfigRoutes = require("./routes/interviewConfigRoutes");
const InterviewConfigInitializer = require("./initializers/InterviewConfigInitializer");

// Global cached connection (very important for serverless!)
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10, // Tuned for Vercel Serverless
      minPoolSize: 1,  // Allow connections to scale to 0 when idle
      socketTimeoutMS: 20000,
    });
    cachedDb = db;
    console.log("MongoDB connected (cached)");
    
    // Seed default interview configurations if none exist
    await InterviewConfigInitializer.seedDefaultConfigs();

    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

// Create Express app
const app = express();

// Sentry Initialization
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0, 
    profilesSampleRate: 1.0,
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Security Headers
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.disable('x-powered-by');

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate Limiting Config
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

const interviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: { success: false, message: 'Too many interview requests, please try again later.' }
});

// Apply General Rate Limiter globally
app.use(generalLimiter);

// Connect DB before routes (but Vercel runs per request → we connect lazily)
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Routes
app.use("/api/register", authLimiter, registerRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/interview-auth", authLimiter, interviewAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/interview-session", interviewLimiter, interviewSessionRoutes);
app.use("/api/interview-payment", interviewPaymentRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/admin/resume", adminResumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/interview-config", interviewConfigRoutes);

// Production Health Endpoint
app.get("/healthz", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    mongodb: dbStatus
  });
});

app.get("/", (req, res) => {
  res.send("API is running on Vercel...");
});

// Sentry Error Handler (must be before any other error middleware)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Initialize WhatsApp Web JS Client (Delegated to external microservice)
const { initializeWhatsApp, queueWhatsAppMessage } = require('./utils/whatsappClient');
try {
  initializeWhatsApp();
} catch (error) {
  console.error("Failed to initialize WhatsApp delegation:", error);
}


// Export for Vercel serverless
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Test WhatsApp Endpoint (Remove in production)
app.post("/api/test-wa", (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: "Missing phone or message" });
  queueWhatsAppMessage(phone, message);
  res.json({ success: true, message: "Message added to queue!" });
});

module.exports = app;
