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

// Interview Admin Route
const InterviewUser = require("../models/InterviewUser");
const InterviewSession = require("../models/InterviewSession");
const Settings = require("../models/Settings");

// Get/toggle the interview feature flag
router.get("/interview-settings", async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "interviewEnabled" });
    res.json({ success: true, enabled: setting ? setting.value : true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/interview-settings/toggle", auth, async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: "interviewEnabled" });
    if (!setting) {
      setting = await Settings.create({ key: "interviewEnabled", value: false });
    } else {
      setting.value = !setting.value;
      await setting.save();
    }
    res.json({ success: true, enabled: setting.value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/interview-data", auth, async (req, res) => {
  try {
    const users = await InterviewUser.find().lean();
    const sessions = await InterviewSession.find().populate("userId", "name email").lean();

    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = { ...u, sessions: [] }; });
    sessions.forEach(s => {
      const uid = s.userId?._id?.toString() || s.userId?.toString();
      if (uid && userMap[uid]) userMap[uid].sessions.push(s);
    });

    // Earnings stats - only real payments
    const allPayments = users.flatMap(u => (u.payments || []).map(p => ({ ...p, userName: u.name, userEmail: u.email })));
    const totalEarnings = allPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysEarnings = allPayments
      .filter(p => new Date(p.paidAt) >= sevenDaysAgo)
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    // Last 7 days breakdown (one entry per day)
    const dailyEarnings = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyEarnings[key] = 0;
    }
    allPayments
      .filter(p => new Date(p.paidAt) >= sevenDaysAgo)
      .forEach(p => {
        const key = new Date(p.paidAt).toISOString().split('T')[0];
        if (dailyEarnings[key] !== undefined) dailyEarnings[key] += (p.amount || 0);
      });

    res.json({
      success: true,
      data: Object.values(userMap),
      earnings: { totalEarnings, last7DaysEarnings, dailyEarnings, recentPayments: allPayments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)).slice(0, 10) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
