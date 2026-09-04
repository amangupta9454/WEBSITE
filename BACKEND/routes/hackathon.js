const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const auth = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/verifyAdmin');

const {
  getPublicHackathonInfo,
  getMyTeam,
  getAdminOverview,
  getAdminSettings,
  updateAdminSettings,
  getAdminAuditLogs,
  previewUnstopExcel,
  commitUnstopImport,
  getAdminTeams,
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
router.get('/admin/teams', auth, verifyAdmin, getAdminTeams);

/**
 * Phase 2: Unstop Excel Import Routes
 */
router.post('/admin/unstop/preview', auth, verifyAdmin, upload.single('excelFile'), previewUnstopExcel);
router.post('/admin/unstop/commit', auth, verifyAdmin, commitUnstopImport);

module.exports = router;
