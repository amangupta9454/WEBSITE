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
  getAdminTeamById,
  createManualTeam,
  updateAdminTeam,
  deleteAdminTeam,
  updateTeamReview,
  updateTeamStatus,
  resendShortlistEmail,
  createPaymentOrder,
  verifyPayment,
  handlePaymentWebhook,
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
 * Phase 4: Participant Payment Routes
 */
router.post('/payment/create-order', auth, createPaymentOrder);
router.post('/payment/verify', auth, verifyPayment);
router.post('/payment/webhook', handlePaymentWebhook);

/**
 * Admin Hackathon Management Workspace Routes
 */
router.get('/admin/overview', auth, verifyAdmin, getAdminOverview);
router.get('/admin/settings', auth, verifyAdmin, getAdminSettings);
router.put('/admin/settings', auth, verifyAdmin, updateAdminSettings);
router.get('/admin/audit-logs', auth, verifyAdmin, getAdminAuditLogs);
router.get('/admin/teams', auth, verifyAdmin, getAdminTeams);

/**
 * Phase 3 & 4: Admin Team Management & Review Routes
 */
router.get('/admin/teams/:id', auth, verifyAdmin, getAdminTeamById);
router.post('/admin/teams', auth, verifyAdmin, createManualTeam);
router.put('/admin/teams/:id', auth, verifyAdmin, updateAdminTeam);
router.delete('/admin/teams/:id', auth, verifyAdmin, deleteAdminTeam);
router.put('/admin/teams/:id/review', auth, verifyAdmin, updateTeamReview);
router.put('/admin/teams/:id/status', auth, verifyAdmin, updateTeamStatus);
router.post('/admin/teams/:id/resend-shortlist-email', auth, verifyAdmin, resendShortlistEmail);

/**
 * Phase 2: Unstop Excel Import Routes
 */
router.post('/admin/unstop/preview', auth, verifyAdmin, upload.single('excelFile'), previewUnstopExcel);
router.post('/admin/unstop/commit', auth, verifyAdmin, commitUnstopImport);

module.exports = router;
