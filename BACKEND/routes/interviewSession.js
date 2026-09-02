const express = require('express');
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 } // 4 MB limit
});
const { createSession, endSession, getUserSessions, getUserCredits, deleteSession, processEvaluation, getSessionStatus, retryEvaluation } = require('../controllers/interviewSessionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/create', authMiddleware, upload.single('resume'), createSession);
router.post('/end', authMiddleware, endSession);
router.post('/process-evaluation/:id', authMiddleware, processEvaluation);
router.post('/retry-evaluation/:id', authMiddleware, retryEvaluation);
router.post('/panel-router', authMiddleware, require('../controllers/interviewSessionController').panelRouter);
router.post('/chat', authMiddleware, require('../controllers/interviewSessionController').generateInterviewChat);
router.get('/status/:id', authMiddleware, getSessionStatus);
router.get('/my-sessions', authMiddleware, getUserSessions);
router.get('/my-credits', authMiddleware, getUserCredits);
router.delete('/:id', authMiddleware, deleteSession);

module.exports = router;
