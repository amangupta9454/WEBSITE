const express = require('express');
const { createOrder, verifyPayment, webhookHandler } = require('../controllers/interviewPaymentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/create-order', authMiddleware, createOrder);
router.post('/verify', authMiddleware, verifyPayment);
router.post('/webhook', webhookHandler);

module.exports = router;
