const express = require('express');
const { getDashboardInfo, updateProfile, markAlertRead, submitProjectRepo, finalSubmitProjectRepo, dismissNotification, getPublicLeaderboard, updateProjectLink, getMyCertificates, getMyQuizzes } = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.get('/dashboard', authMiddleware, requireRole('student', 'intern', 'campus_ambassador', 'admin', 'recruiter', 'mentor'), getDashboardInfo);
router.get('/my-certificates', authMiddleware, getMyCertificates);
router.get('/my-quizzes', authMiddleware, getMyQuizzes);
router.post('/profile', authMiddleware, requireRole('student', 'intern', 'campus_ambassador', 'admin', 'recruiter', 'mentor'), updateProfile);
router.post('/mark-alert', authMiddleware, requireRole('student', 'intern', 'campus_ambassador', 'admin'), markAlertRead);
router.post('/submit-repo', authMiddleware, requireRole('intern', 'admin'), submitProjectRepo);
router.post('/final-submit-repo', authMiddleware, requireRole('intern', 'admin'), finalSubmitProjectRepo);
router.post('/update-project-link', authMiddleware, requireRole('intern', 'admin'), updateProjectLink);
router.post('/dismiss-notification', authMiddleware, requireRole('student', 'intern', 'campus_ambassador', 'admin'), dismissNotification);
router.get('/leaderboard', getPublicLeaderboard);
const { getV2Projects, submitV2Project } = require('../controllers/studentControllerV2');
const { getStudentAmbassadorStats, trackUserActivity, submitAmbassadorApplication, saveAmbassadorLinkedInPost } = require('../controllers/referralController');
router.get('/v2-projects', authMiddleware, requireRole('intern', 'admin'), getV2Projects);
router.post('/submit-v2-project', authMiddleware, requireRole('intern', 'admin'), submitV2Project);
router.get('/ambassador-stats', authMiddleware, requireRole('student', 'campus_ambassador', 'intern', 'admin'), getStudentAmbassadorStats);
router.post('/track-activity', authMiddleware, trackUserActivity);
router.post('/ambassador-apply', submitAmbassadorApplication);
router.post('/ambassador-linkedin-post', authMiddleware, requireRole('campus_ambassador', 'admin'), saveAmbassadorLinkedInPost);

module.exports = router;
