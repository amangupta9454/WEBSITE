const express = require('express');
const { getDashboardInfo, updateProfile, markAlertRead, submitProjectRepo, finalSubmitProjectRepo } = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authMiddleware, getDashboardInfo);
router.post('/profile', authMiddleware, updateProfile);
router.post('/mark-alert', authMiddleware, markAlertRead);
router.post('/submit-repo', authMiddleware, submitProjectRepo);
router.post('/final-submit-repo', authMiddleware, finalSubmitProjectRepo);

module.exports = router;
