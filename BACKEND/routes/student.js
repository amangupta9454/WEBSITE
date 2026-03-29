const express = require('express');
const { getDashboardInfo, updateProfile } = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authMiddleware, getDashboardInfo);
router.post('/profile', authMiddleware, updateProfile);

module.exports = router;
