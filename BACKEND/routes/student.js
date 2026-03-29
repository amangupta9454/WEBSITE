const express = require('express');
const { getDashboardInfo, updateProfile, markAlertRead } = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authMiddleware, getDashboardInfo);
router.post('/profile', authMiddleware, updateProfile);
router.post('/mark-alert', authMiddleware, markAlertRead);

module.exports = router;
