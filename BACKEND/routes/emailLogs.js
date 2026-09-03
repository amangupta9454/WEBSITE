const express = require('express');
const router = express.Router();
const emailLogController = require('../controllers/email/emailLogController');
const auth = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/verifyAdmin');
const { emailResendLimiter } = require('../middleware/emailLimiter');

// Dashboard Analytics & Campaign Statistics
// GET /api/email/logs/analytics (placed before /:id to avoid ID conflict)
router.get('/logs/analytics', auth, verifyAdmin, emailLogController.getAnalytics);

// Server-side paginated email historical audit logs with filtering & searching
// GET /api/email/logs
router.get('/logs', auth, verifyAdmin, emailLogController.getLogs);

// Single email inspection endpoint (includes un-sanitized HTML and attachment metadata)
// GET /api/email/logs/:id
router.get('/logs/:id', auth, verifyAdmin, emailLogController.getLogById);

// Re-dispatch stored email payload via SMTP gateway (creates brand new log entry)
// POST /api/email/resend/:id
router.post('/resend/:id', auth, verifyAdmin, emailResendLimiter, emailLogController.resendEmail);

// Reset Circuit Breaker
// POST /api/email/circuit-breaker/reset
router.post('/circuit-breaker/reset', auth, verifyAdmin, emailLogController.resetCircuitBreaker);

// Delete historical record
// DELETE /api/email/logs/:id
router.delete('/logs/:id', auth, verifyAdmin, emailLogController.deleteLog);

module.exports = router;
