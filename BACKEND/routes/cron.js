const express = require('express');
const router = express.Router();
const { runDailyCron } = require('../controllers/cronController');

// GET /api/cron/daily
router.get('/daily', runDailyCron);

module.exports = router;
