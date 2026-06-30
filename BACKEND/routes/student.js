const express = require('express');
const { getDashboardInfo, updateProfile, markAlertRead, submitProjectRepo, finalSubmitProjectRepo, dismissNotification, getPublicLeaderboard } = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authMiddleware, getDashboardInfo);
router.post('/profile', authMiddleware, updateProfile);
router.post('/mark-alert', authMiddleware, markAlertRead);
router.post('/submit-repo', authMiddleware, submitProjectRepo);
router.post('/final-submit-repo', authMiddleware, finalSubmitProjectRepo);
router.post('/dismiss-notification', authMiddleware, dismissNotification);
router.get('/leaderboard', getPublicLeaderboard);

module.exports = router;
