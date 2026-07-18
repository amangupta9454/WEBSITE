const express = require('express');
const { getDashboardInfo, updateProfile, markAlertRead, submitProjectRepo, finalSubmitProjectRepo, dismissNotification, getPublicLeaderboard, updateProjectLink } = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authMiddleware, getDashboardInfo);
router.post('/profile', authMiddleware, updateProfile);
router.post('/mark-alert', authMiddleware, markAlertRead);
router.post('/submit-repo', authMiddleware, submitProjectRepo);
router.post('/final-submit-repo', authMiddleware, finalSubmitProjectRepo);
router.post('/update-project-link', authMiddleware, updateProjectLink);
router.post('/dismiss-notification', authMiddleware, dismissNotification);
router.get('/leaderboard', getPublicLeaderboard);

const { getV2Projects, submitV2Project } = require('../controllers/studentControllerV2');
router.get('/v2-projects', authMiddleware, getV2Projects);
router.post('/submit-v2-project', authMiddleware, submitV2Project);

module.exports = router;
