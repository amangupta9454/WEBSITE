const express = require('express');
const router = express.Router();
const emailLogController = require('../controllers/email/emailLogController');
const auth = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/verifyAdmin');
const { emailResendLimiter } = require('../middleware/emailLimiter');

// Secure all Email Management System routes with Admin JWT Role-Based Access Control (RBAC)
router.use(auth, verifyAdmin);

// Dashboard Analytics & Campaign Statistics
// GET /api/email/logs/analytics (placed before /:id to avoid ID conflict)
router.get('/logs/analytics', emailLogController.getAnalytics);

// Server-side paginated email historical audit logs with filtering & searching
// GET /api/email/logs
router.get('/logs', emailLogController.getLogs);

// Single email inspection endpoint (includes un-sanitized HTML and attachment metadata)
// GET /api/email/logs/:id
router.get('/logs/:id', emailLogController.getLogById);

// Re-dispatch stored email payload via SMTP gateway (creates brand new log entry)
// POST /api/email/resend/:id
router.post('/resend/:id', emailResendLimiter, emailLogController.resendEmail);

// Delete historical record
// DELETE /api/email/logs/:id
router.delete('/logs/:id', emailLogController.deleteLog);

module.exports = router;
