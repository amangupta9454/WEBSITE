const rateLimit = require('express-rate-limit');

/**
 * Rate limiting configurations for email operations.
 * Protects automated transmission APIs and administrative resend endpoints against abuse and DDoS.
 */

const emailSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute operational window
  max: 300, // Max requests per IP within the timeframe
  message: { success: false, message: 'Too many email transmission requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailResendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute operational window
  max: 50, // Max administrative resend requests per window to prevent accidental mail spamming
  message: { success: false, message: 'Too many email resend attempts. Please slow down and try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { emailSendLimiter, emailResendLimiter };
