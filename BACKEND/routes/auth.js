const express = require('express');
const { loginStudent, setupPassword, forgotPassword, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginStudent);
router.post('/setup-password', authMiddleware, setupPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
