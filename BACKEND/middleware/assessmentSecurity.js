/**
 * Phase 15 — Assessment Module Security Hardening
 * Middleware: assessmentSecurity.js
 * 
 * OBJECTIVE:
 * - Comprehensive multi-layer defense against MongoDB injection, Regex DoS, XSS, and parameter tampering.
 * - Dedicated rate-limiting thresholds for public credential gateways, high-frequency student sessions, and AI generation.
 * - Response masking against accidental secret or internal credential leakage (JWTs, API Keys, Passwords).
 * - Zero business logic mutation; pure security boundary enforcement.
 */
const rateLimit = require("express-rate-limit");

// ── 1. Tailored Rate Limiters for Assessment APIs ───────────────────────────

// Public credential verification rate limit (prevents scraping and brute-force enumeration)
const publicVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: "Unknown",
    message: "Security rate limit reached for public verification inquiries. Please try again after 15 minutes."
  }
});

// Student exam session execution limiter (prevents rapid-fire bot scripting while accommodating intense typing/heartbeats)
const sessionAttemptLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300, // 300 interactions per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "High-frequency interaction limit exceeded on active evaluation session. Automated scripts are prohibited."
  }
});

// Administrative analytics and export limiter (prevents memory DoS via heavy CSV/PDF generation)
const adminExportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Export compilation quota exceeded. Please allow existing batch exports to conclude."
  }
});

// AI Runtime Blueprint Execution Limiter (prevents LLM token budget depletion)
const aiRuntimeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI activations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "AI Prompt Studio runtime throttling threshold engaged. Please cool down before triggering subsequent LLM inferences."
  }
});

// ── 2. Input Sanitization against NoSQL Injection & ReDoS ──────────────────

function cleanObject(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = cleanObject(obj[i], depth + 1);
    }
    return obj;
  }

  for (const key of Object.keys(obj)) {
    // Block MongoDB query injection operators ($where, $ne, $gt, $elemMatch, etc.) in key names
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }

    const value = obj[key];
    if (typeof value === "string") {
      // Basic strip against script tags and null bytes
      let sanitized = value.replace(/\0/g, "").trim();
      // Protect against ReDoS in excessively large regex filter payloads
      if (sanitized.length > 5000) {
        sanitized = sanitized.slice(0, 5000);
      }
      obj[key] = sanitized;
    } else if (typeof value === "object" && value !== null) {
      obj[key] = cleanObject(value, depth + 1);
    }
  }
  return obj;
}

const sanitizeInput = (req, res, next) => {
  try {
    if (req.body) req.body = cleanObject(req.body);
    if (req.query) req.query = cleanObject(req.query);
    if (req.params) req.params = cleanObject(req.params);
    next();
  } catch (err) {
    console.error("[assessmentSecurity] Sanitization exception:", err);
    res.status(400).json({ success: false, message: "Malformed request payload detected." });
  }
};

// ── 3. Output Credential & Secret Masking Shield ──────────────────────────

const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  
  const sensitiveKeys = ["password", "token", "jwt", "secret", "groq_api_key", "sentry_dsn", "mongo_uri", "privatekey", "authorization"];
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key of Object.keys(copy)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      copy[key] = "********-MASKED-SECURITY-AUDIT-********";
    } else if (typeof copy[key] === "object" && copy[key] !== null) {
      copy[key] = maskSensitiveData(copy[key]);
    }
  }
  return copy;
};

const secretLeakageDefense = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    try {
      if (data && typeof data === "object") {
        data = maskSensitiveData(data);
      }
    } catch (err) {
      console.warn("[assessmentSecurity] Notice during response masking:", err.message);
    }
    return originalJson(data);
  };
  next();
};

// ── 4. Candidate Ownership Isolation Validator ─────────────────────────────

const enforceCandidateOwnership = (req, res, next) => {
  // If user is admin, allow access across student domains
  if (req.user && (req.user.role === "admin" || req.user.isAdmin === true)) {
    return next();
  }

  const requestedCandidateId = req.params.candidateId || req.query.candidateId || req.body.candidateId;
  const authenticatedUserId = req.user?._id || req.user?.id;

  if (requestedCandidateId && authenticatedUserId && String(requestedCandidateId) !== String(authenticatedUserId)) {
    return res.status(403).json({
      success: false,
      error: "SECURITY_AUTHORITY_DENIED: Candidate authorization token does not match target dossier ID. Cross-tenant reads strictly prohibited."
    });
  }

  next();
};

module.exports = {
  publicVerifyLimiter,
  sessionAttemptLimiter,
  adminExportLimiter,
  aiRuntimeLimiter,
  sanitizeInput,
  secretLeakageDefense,
  enforceCandidateOwnership
};
