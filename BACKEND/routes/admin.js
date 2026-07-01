const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
  adminLogin,
  getInternships,
  markDownloaded,
  updateInternshipDetails,
  uploadCertificates,
  updateOfferStatus,
  setStartDate,
  updateBatch,
  updateInternshipType,
  updatePaidStatus,
  updateCertificateSent,
  markPaidExported,
  markProjectExported,
  getPaymentSetting,
  togglePaymentSetting,
} = require("../controllers/adminController");
const {
  getRegistrationSetting,
  toggleRegistrationSetting,
  createSummerProject,
  getSummerProjects,
  deleteSummerProject,
  updateAssignedRepo,
  reviewSummerProject,
  assignNormalTasks,
  getNormalTasks,
  createNormalTask,
  deleteNormalTask,
  bulkUpdate,
  createNotification,
  getAdminNotifications,
  deleteNotification,
  syncRefunds,
  getLeaderboardSetting,
  toggleLeaderboardSetting,
  manualAcceptAssignment,
  getAllSubmissions,
  overrideSP,
  evaluatePendingAI,
  getRecentPayments,
  sendEvaluationEmails,
  resetAIEvaluations,
  migrateDates
} = require("../controllers/adminController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/internships", auth, getInternships);
router.get("/recent-payments", auth, getRecentPayments);
router.post("/mark-downloaded", auth, markDownloaded);
router.post("/update-internship", auth, updateInternshipDetails);
router.post(
  "/upload-certificates",
  auth,
  upload.single("excelFile"),
  uploadCertificates,
);
router.post("/update-offer-status", auth, updateOfferStatus);
router.post("/set-start-date", auth, setStartDate);
router.post("/update-batch", auth, updateBatch);
router.post("/update-internship-type", auth, updateInternshipType);
router.post("/update-paid-status", auth, updatePaidStatus);
router.post("/update-certificate-sent", auth, updateCertificateSent);
router.post("/mark-paid-exported", auth, markPaidExported);
router.post("/mark-project-exported", auth, markProjectExported);
router.post("/bulk-update", auth, bulkUpdate);

// Summer Projects management routes
router.get("/summer-projects", auth, getSummerProjects);
router.post("/summer-projects", auth, upload.single("pdf"), createSummerProject);
router.delete("/summer-projects/:id", auth, deleteSummerProject);

// Student repository tracking route
router.post("/update-assigned-repo", auth, updateAssignedRepo);
router.post("/review-summer-project", auth, reviewSummerProject);
router.post("/assign-normal-tasks", auth, assignNormalTasks);
router.post("/manual-accept-assignment", auth, manualAcceptAssignment);

router.get("/normal-tasks", auth, getNormalTasks);
router.post("/normal-tasks", auth, upload.single("pdf"), createNormalTask);
router.delete("/normal-tasks/:id", auth, deleteNormalTask);

router.get("/settings/payment", getPaymentSetting);
router.post("/settings/payment", auth, togglePaymentSetting);
router.get("/settings/registration", getRegistrationSetting);
router.post("/settings/registration", auth, toggleRegistrationSetting);
router.get("/settings/leaderboard", getLeaderboardSetting);
router.post("/settings/leaderboard", auth, toggleLeaderboardSetting);

// Submissions
router.get("/all-submissions", auth, getAllSubmissions);
router.post("/override-sp", auth, overrideSP);
router.post("/evaluate-pending-ai", auth, evaluatePendingAI);
router.post("/send-evaluation-emails", auth, sendEvaluationEmails);
router.post("/reset-ai-evaluations", auth, resetAIEvaluations);
router.get("/migrate-dates", migrateDates);

router.post("/sync-refunds", auth, syncRefunds);

// Admin Notification Routes
router.post("/notifications", auth, createNotification);
router.get("/notifications", auth, getAdminNotifications);
router.delete("/notifications/:id", auth, deleteNotification);

module.exports = router;
