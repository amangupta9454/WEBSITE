const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/verifyAdmin');

const {
  getPublicHackathonInfo,
  getMyTeam,
  getAdminOverview,
  getAdminSettings,
  updateAdminSettings,
  getAdminAuditLogs,
} = require('../controllers/hackathonController');

/**
 * Public Routes
 */
router.get('/info', getPublicHackathonInfo);

/**
 * Participant Protected Routes (Reuses existing Student/User JWT authentication)
 */
router.get('/my-team', auth, getMyTeam);

/**
 * Admin Hackathon Management Workspace Routes
 */
router.get('/admin/overview', auth, verifyAdmin, getAdminOverview);
router.get('/admin/settings', auth, verifyAdmin, getAdminSettings);
router.put('/admin/settings', auth, verifyAdmin, updateAdminSettings);
router.get('/admin/audit-logs', auth, verifyAdmin, getAdminAuditLogs);

module.exports = router;
