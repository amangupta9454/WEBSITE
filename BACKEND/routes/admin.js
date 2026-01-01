// backend/routes/admin.js

const express = require('express');
const { adminLogin, getInternships, markDownloaded } = require('../controllers/adminController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/login', adminLogin);
router.get('/internships', auth, getInternships);
router.post('/mark-downloaded', auth, markDownloaded);

module.exports = router;