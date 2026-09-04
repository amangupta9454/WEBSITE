const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const auth = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/verifyAdmin');
const { verifyEditorial } = require('../middleware/verifyEditorial');

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
  getMySubmission,
  saveSubmissionDraft,
  finalSubmitProject,
  getAdminSubmissions,
  getAdminSubmissionByTeamId,
  unlockAdminSubmission,
  getAdminEditorialMembers,
  createAdminEditorialMember,
  updateAdminEditorialMember,
  resetAdminEditorialMemberPassword,
  getAdminEditorialAssignments,
  createAdminEditorialAssignment,
  deleteAdminEditorialAssignment,
  getAdminEditorialEvaluations,
  reopenAdminEditorialEvaluation,
  editorialLogin,
  editorialLogout,
  getEditorialMe,
  changeEditorialPassword,
  getEditorialDashboard,
  getEditorialProjects,
  getEditorialProjectDetail,
  auditEditorialLinkClick,
  saveEditorialEvaluationDraft,
  finalizeEditorialEvaluation,
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
 * Phase 5: Participant Project Submission Routes
 */
router.get('/submission/my-submission', auth, getMySubmission);
router.post('/submission/save-draft', auth, saveSubmissionDraft);
router.post('/submission/final-submit', auth, finalSubmitProject);

/**
 * Admin Hackathon Management Workspace Routes
 */
router.get('/admin/overview', auth, verifyAdmin, getAdminOverview);
router.get('/admin/settings', auth, verifyAdmin, getAdminSettings);
router.put('/admin/settings', auth, verifyAdmin, updateAdminSettings);
router.get('/admin/audit-logs', auth, verifyAdmin, getAdminAuditLogs);
router.get('/admin/teams', auth, verifyAdmin, getAdminTeams);

/**
 * Phase 5: Admin Submissions Management Routes
 */
router.get('/admin/submissions', auth, verifyAdmin, getAdminSubmissions);
router.get('/admin/submissions/team/:teamId', auth, verifyAdmin, getAdminSubmissionByTeamId);
router.post('/admin/submissions/:id/unlock', auth, verifyAdmin, unlockAdminSubmission);

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

/**
 * Phase 6: Admin Editorial & Evaluation Management Routes
 */
router.get('/admin/editorial-members', auth, verifyAdmin, getAdminEditorialMembers);
router.post('/admin/editorial-members', auth, verifyAdmin, createAdminEditorialMember);
router.put('/admin/editorial-members/:id', auth, verifyAdmin, updateAdminEditorialMember);
router.post('/admin/editorial-members/:id/reset-password', auth, verifyAdmin, resetAdminEditorialMemberPassword);

router.get('/admin/editorial-assignments', auth, verifyAdmin, getAdminEditorialAssignments);
router.post('/admin/editorial-assignments', auth, verifyAdmin, createAdminEditorialAssignment);
router.delete('/admin/editorial-assignments/:id', auth, verifyAdmin, deleteAdminEditorialAssignment);

router.get('/admin/editorial-evaluations', auth, verifyAdmin, getAdminEditorialEvaluations);
router.post('/admin/editorial-evaluations/:id/reopen', auth, verifyAdmin, reopenAdminEditorialEvaluation);

/**
 * Phase 6: Editorial / Judge Portal Routes
 */
router.post('/editorial/login', editorialLogin);
router.post('/editorial/logout', auth, verifyEditorial, editorialLogout);
router.get('/editorial/me', auth, verifyEditorial, getEditorialMe);
router.put('/editorial/password', auth, verifyEditorial, changeEditorialPassword);

router.get('/editorial/dashboard', auth, verifyEditorial, getEditorialDashboard);
router.get('/editorial/projects', auth, verifyEditorial, getEditorialProjects);
router.get('/editorial/projects/:teamId', auth, verifyEditorial, getEditorialProjectDetail);
router.post('/editorial/projects/:teamId/audit-link-click', auth, verifyEditorial, auditEditorialLinkClick);
router.post('/editorial/projects/:teamId/evaluation/draft', auth, verifyEditorial, saveEditorialEvaluationDraft);
router.post('/editorial/projects/:teamId/evaluation/finalize', auth, verifyEditorial, finalizeEditorialEvaluation);

module.exports = router;


