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
  toggleHackathonActive,
  getAdminAuditLogs,
  previewUnstopExcel,
  commitUnstopImport,
  getAdminTeams,
  getAdminTeamById,
  createManualTeam,
  updateAdminTeam,
  deleteAdminTeam,
  cleanOrphanedRecords,
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
  calculateAdminResults,
  getAdminResults,
  getAdminResultDetail,
  resolveAdminResultTie,
  assignAdminResultWinner,
  approveAdminResults,
  publishAdminResults,
  lockAdminResults,
  reopenAdminResults,
  getParticipantMyResult,
  getPublicResults,
  getAdminCertificates,
  generateAdminCertificates,
  emailAdminCertificate,
  emailBulkAdminCertificates,
  revokeAdminCertificate,
  getAdminCertificateDetail,
  getParticipantMyCertificates,
  downloadCertificate,
  verifyPublicCertificate,
  getAdminPrizes,
  createAdminPrize,
  updateAdminPrize,
  deleteAdminPrize,
  getAdminSponsors,
  createAdminSponsor,
  updateAdminSponsor,
  deleteAdminSponsor,
  getPublicSponsors,
  getAdminPrizeFulfillments,
  createAdminPrizeFulfillment,
  updateAdminPrizeFulfillment,
  notifyAdminPrizeFulfillment,
  getParticipantMyPrizes,
  getPublicHealth,
  getAdminHealth,
  getAdminAlerts,
  getAdminEmailStats,
  getAdminSecuritySummary,
  exportAdminResource,
  operationalSearch,
  getAdminTeam360,
  registerWebsiteTeam,
  getAdminDuplicateQueue,
  resolveAdminDuplicateQueueItem,
} = require('../controllers/hackathonController');
const {
  hackathonPublicLimiter,
  hackathonExportLimiter,
} = require('../middleware/hackathonLimiter');

/**
 * Public Routes
 */
router.get('/info', getPublicHackathonInfo);
router.get('/health', hackathonPublicLimiter, getPublicHealth);

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
router.post('/admin/settings/toggle-active', auth, verifyAdmin, toggleHackathonActive);
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
router.post('/admin/cleanup-orphaned', auth, verifyAdmin, cleanOrphanedRecords);
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

/**
 * Phase 7: Results, Winner Management & Public Leaderboard
 */
router.get('/results/my-result', auth, getParticipantMyResult);
router.get('/public/results', getPublicResults);

// Admin Results Endpoints
router.post('/admin/results/calculate', auth, verifyAdmin, calculateAdminResults);
router.get('/admin/results', auth, verifyAdmin, getAdminResults);
router.get('/admin/results/:teamId', auth, verifyAdmin, getAdminResultDetail);
router.post('/admin/results/resolve-tie', auth, verifyAdmin, resolveAdminResultTie);
router.post('/admin/results/:teamId/assign-winner', auth, verifyAdmin, assignAdminResultWinner);
router.post('/admin/results/approve', auth, verifyAdmin, approveAdminResults);
router.post('/admin/results/publish', auth, verifyAdmin, publishAdminResults);
router.post('/admin/results/lock', auth, verifyAdmin, lockAdminResults);
router.post('/admin/results/reopen', auth, verifyAdmin, reopenAdminResults);

// ==========================================
// Phase 8: Certificates, Prizes & Sponsors
// ==========================================

// Public Endpoints
router.get('/certificates/verify/:verificationCode', verifyPublicCertificate);
router.get('/public/sponsors', getPublicSponsors);

// Participant Endpoints
router.get('/certificates/my-certificates', auth, getParticipantMyCertificates);
router.get('/certificates/:id/download', auth, downloadCertificate);
router.get('/prizes/my-prizes', auth, getParticipantMyPrizes);

// Admin Certificates Endpoints
router.get('/admin/certificates', auth, verifyAdmin, getAdminCertificates);
router.post('/admin/certificates/generate', auth, verifyAdmin, generateAdminCertificates);
router.post('/admin/certificates/generate-bulk', auth, verifyAdmin, generateAdminCertificates);
router.post('/admin/certificates/email-bulk', auth, verifyAdmin, emailBulkAdminCertificates);
router.post('/admin/certificates/:id/email', auth, verifyAdmin, emailAdminCertificate);
router.post('/admin/certificates/:id/revoke', auth, verifyAdmin, revokeAdminCertificate);
router.get('/admin/certificates/:id', auth, verifyAdmin, getAdminCertificateDetail);

// Admin Prizes Endpoints
router.get('/admin/prizes', auth, verifyAdmin, getAdminPrizes);
router.post('/admin/prizes', auth, verifyAdmin, createAdminPrize);
router.put('/admin/prizes/:id', auth, verifyAdmin, updateAdminPrize);
router.patch('/admin/prizes/:id', auth, verifyAdmin, updateAdminPrize);
router.delete('/admin/prizes/:id', auth, verifyAdmin, deleteAdminPrize);

// Admin Sponsors Endpoints
router.get('/admin/sponsors', auth, verifyAdmin, getAdminSponsors);
router.post('/admin/sponsors', auth, verifyAdmin, createAdminSponsor);
router.put('/admin/sponsors/:id', auth, verifyAdmin, updateAdminSponsor);
router.patch('/admin/sponsors/:id', auth, verifyAdmin, updateAdminSponsor);
router.delete('/admin/sponsors/:id', auth, verifyAdmin, deleteAdminSponsor);

// Admin Prize Fulfillment Endpoints
router.get('/admin/prize-fulfillments', auth, verifyAdmin, getAdminPrizeFulfillments);
router.post('/admin/prize-fulfillments', auth, verifyAdmin, createAdminPrizeFulfillment);
router.put('/admin/prize-fulfillments/:id', auth, verifyAdmin, updateAdminPrizeFulfillment);
router.patch('/admin/prize-fulfillments/:id', auth, verifyAdmin, updateAdminPrizeFulfillment);
router.post('/admin/prize-fulfillments/:id/notify', auth, verifyAdmin, notifyAdminPrizeFulfillment);

// ==========================================
// Phase 9: Operations, Health & Analytics
// ==========================================
router.get('/admin/health', auth, verifyAdmin, getAdminHealth);
router.get('/admin/alerts', auth, verifyAdmin, getAdminAlerts);
router.get('/admin/email-stats', auth, verifyAdmin, getAdminEmailStats);
router.get('/admin/security-summary', auth, verifyAdmin, getAdminSecuritySummary);
router.get('/admin/export/:resource', auth, verifyAdmin, hackathonExportLimiter, exportAdminResource);
router.get('/admin/search', auth, verifyAdmin, operationalSearch);
router.get('/admin/team-360/:teamId', auth, verifyAdmin, getAdminTeam360);

// ==========================================
// Team Identity & Duplicate Verification Queue
// ==========================================
router.post('/register', hackathonPublicLimiter, registerWebsiteTeam);
router.post('/teams/register-website', hackathonPublicLimiter, registerWebsiteTeam);
router.get('/admin/duplicates', auth, verifyAdmin, getAdminDuplicateQueue);
router.post('/admin/duplicates/:id/resolve', auth, verifyAdmin, resolveAdminDuplicateQueueItem);

module.exports = router;


