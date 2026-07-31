const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { emailSendLimiter } = require('../middleware/emailLimiter');

// Protect all email routing endpoints with API Key security middleware
router.use(apiKeyAuth);

// Single email transmission API (Primary target for Google Apps Script replacement)
// POST /api/email/send
router.post('/send', emailSendLimiter, mailController.sendEmail);

// Batch email transmission API (Future target for internships, quizzes, certificates & newsletters)
// POST /api/email/batch
router.post('/batch', emailSendLimiter, mailController.sendBatchEmails);

module.exports = router;
