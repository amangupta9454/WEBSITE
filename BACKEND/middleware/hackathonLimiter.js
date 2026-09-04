const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware for Hackathon Operations
 * Prevents DDoS, brute-force enumeration of certificates, and excessive export dumps.
 */

// Public verification, public results & health rate limiter: 120 requests per 15 minutes per IP
const hackathonPublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: {
    success: false,
    message: 'Too many public requests from this IP. Please wait a few minutes before retrying.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sensitive auth actions rate limiter (editorial login, credential actions): 25 requests per 15 minutes per IP
const hackathonAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin data export rate limiter: 35 exports per 15 minutes per IP to avoid server resource exhaustion
const hackathonExportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 35,
  message: {
    success: false,
    message: 'Export rate limit exceeded. Please wait a few minutes before downloading additional datasets.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  hackathonPublicLimiter,
  hackathonAuthLimiter,
  hackathonExportLimiter,
};
