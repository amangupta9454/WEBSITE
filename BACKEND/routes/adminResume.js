const express = require('express');
const { getResumeAnalytics, getAllResumes, getUserResumes } = require('../controllers/adminResumeController');
const authMiddleware = require('../middleware/auth'); // Admin auth is handled via the same middleware (it checks token)

const router = express.Router();

// Note: In production, authMiddleware should specifically check for admin role
router.get('/analytics', authMiddleware, getResumeAnalytics);
router.get('/all', authMiddleware, getAllResumes);
router.get('/user/:userId', authMiddleware, getUserResumes);

module.exports = router;
