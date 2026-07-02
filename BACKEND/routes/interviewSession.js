const express = require('express');
const { createSession, endSession, getUserSessions, getUserCredits } = require('../controllers/interviewSessionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/create', authMiddleware, createSession);
router.post('/end', authMiddleware, endSession);
router.get('/my-sessions', authMiddleware, getUserSessions);
router.get('/my-credits', authMiddleware, getUserCredits);

module.exports = router;
