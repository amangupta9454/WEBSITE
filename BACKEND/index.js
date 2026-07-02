// api/index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const registerRoutes = require("./routes/register");
const adminRoutes = require("./routes/admin");
const verifyRoutes = require("./routes/verify");
const projectRoutes = require("./routes/project");
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const cronRoutes = require("./routes/cron");
const contactRoutes = require("./routes/contact");
const interviewSessionRoutes = require("./routes/interviewSession");
const interviewPaymentRoutes = require("./routes/interviewPayment");

// Global cached connection (very important for serverless!)
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10, // reasonable for serverless
      minPoolSize: 2,
      socketTimeoutMS: 20000,
    });
    cachedDb = db;
    console.log("MongoDB connected (cached)");
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

// Create Express app
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

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
app.use("/api/register", registerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/interview-session", interviewSessionRoutes);
app.use("/api/interview-payment", interviewPaymentRoutes);

app.get("/", (req, res) => {
  res.send("API is running on Vercel...");
});

// Export for Vercel serverless
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
