const express = require('express');
const router = express.Router();
const { runDailyCron, runWeeklySocialCron } = require('../controllers/cronController');

// GET /api/cron/daily
router.get('/daily', runDailyCron);

// GET /api/cron/weekly-social
router.get('/weekly-social', runWeeklySocialCron);

module.exports = router;
