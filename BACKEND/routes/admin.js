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
  migrateDates,
  makeAllInterns,
  fixMergedAccounts,
  getJobPortalSetting,
  toggleJobPortalSetting,
} = require("../controllers/adminController");
const { assignV2Projects, saveV2GlobalTask, getV2GlobalTasks, deleteV2GlobalTask } = require("../controllers/adminControllerV2");
const { getAllUsers } = require("../controllers/adminUsersController");
const {
  createReferralCode,
  getReferralCodes,
  toggleReferralStatus,
  deleteReferralCode,
  getReferredUsers,
  trackClick,
} = require("../controllers/referralController");
const auth = require("../middleware/auth");
const { verifyAdmin } = require("../middleware/verifyAdmin");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/internships", auth, verifyAdmin, getInternships);

// All Users & Referral routes
router.get("/users", auth, verifyAdmin, getAllUsers);
router.get("/referrals", auth, verifyAdmin, getReferralCodes);
router.post("/referrals/create", auth, verifyAdmin, createReferralCode);
router.post("/referrals/toggle/:id", auth, verifyAdmin, toggleReferralStatus);
router.delete("/referrals/:id", auth, verifyAdmin, deleteReferralCode);
router.get("/referrals/conversions", auth, verifyAdmin, getReferredUsers);
router.post("/referrals/track-click", trackClick);
router.get("/recent-payments", auth, verifyAdmin, getRecentPayments);
router.post("/mark-downloaded", auth, verifyAdmin, markDownloaded);
router.post("/update-internship", auth, verifyAdmin, updateInternshipDetails);
router.post(
  "/upload-certificates",
  auth,
  upload.single("excelFile"),
  uploadCertificates,
);
router.post("/update-offer-status", auth, verifyAdmin, updateOfferStatus);
router.post("/set-start-date", auth, verifyAdmin, setStartDate);
router.post("/update-batch", auth, verifyAdmin, updateBatch);
router.post("/update-internship-type", auth, verifyAdmin, updateInternshipType);
router.post("/update-paid-status", auth, verifyAdmin, updatePaidStatus);
router.post("/update-certificate-sent", auth, verifyAdmin, updateCertificateSent);
router.post("/mark-paid-exported", auth, verifyAdmin, markPaidExported);
router.post("/mark-project-exported", auth, verifyAdmin, markProjectExported);
router.post("/bulk-update", auth, verifyAdmin, bulkUpdate);

// Summer Projects management routes
router.get("/summer-projects", auth, verifyAdmin, getSummerProjects);
router.post("/summer-projects", auth, verifyAdmin, upload.single("pdf"), createSummerProject);
router.delete("/summer-projects/:id", auth, verifyAdmin, deleteSummerProject);

// Student repository tracking route
router.post("/update-assigned-repo", auth, verifyAdmin, updateAssignedRepo);
router.post("/review-summer-project", auth, verifyAdmin, reviewSummerProject);
router.post("/assign-normal-tasks", auth, verifyAdmin, assignNormalTasks);
router.post("/assign-v2-projects", auth, verifyAdmin, assignV2Projects);
router.post("/manual-accept-assignment", auth, verifyAdmin, manualAcceptAssignment);

router.get("/normal-tasks", auth, verifyAdmin, getNormalTasks);
router.post("/normal-tasks", auth, verifyAdmin, upload.single("pdf"), createNormalTask);
router.delete("/normal-tasks/:id", auth, verifyAdmin, deleteNormalTask);

router.get("/v2-global-tasks", auth, verifyAdmin, getV2GlobalTasks);
router.post("/v2-global-tasks", auth, verifyAdmin, saveV2GlobalTask);
router.delete("/v2-global-tasks/:id", auth, verifyAdmin, deleteV2GlobalTask);

router.get("/settings/payment", getPaymentSetting);
router.post("/settings/payment", auth, verifyAdmin, togglePaymentSetting);
router.get("/settings/registration", getRegistrationSetting);
router.post("/settings/registration", auth, verifyAdmin, toggleRegistrationSetting);
router.get("/settings/leaderboard", getLeaderboardSetting);
router.post("/settings/leaderboard", auth, verifyAdmin, toggleLeaderboardSetting);
router.get("/settings/job-portal", getJobPortalSetting);
router.post("/settings/job-portal", auth, verifyAdmin, toggleJobPortalSetting);

// Submissions
router.get("/all-submissions", auth, verifyAdmin, getAllSubmissions);
router.post("/override-sp", auth, verifyAdmin, overrideSP);
router.post("/evaluate-pending-ai", auth, verifyAdmin, evaluatePendingAI);
router.post("/send-evaluation-emails", auth, verifyAdmin, sendEvaluationEmails);
router.post("/summer-projects/reset-ai-evaluations", auth, verifyAdmin, resetAIEvaluations);

router.post("/migrate-dates", auth, verifyAdmin, migrateDates);

// Temporary endpoint to make all existing users interns
router.post("/make-all-interns", auth, verifyAdmin, makeAllInterns);

// Endpoint to fix improperly merged user accounts
router.post("/fix-merged-accounts", auth, verifyAdmin, fixMergedAccounts);

router.post("/sync-refunds", auth, verifyAdmin, syncRefunds);

// Admin Notification Routes
router.post("/notifications", auth, verifyAdmin, createNotification);
router.get("/notifications", auth, verifyAdmin, getAdminNotifications);
router.delete("/notifications/:id", auth, verifyAdmin, deleteNotification);

// Interview Admin Route
const User = require("../models/User");
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

router.post("/interview-settings/toggle", auth, verifyAdmin, async (req, res) => {
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

router.post("/interview-settings/override/:id", auth, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { override } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.interviewAccessOverride = !!override;
    await user.save();
    res.json({ success: true, message: 'Override updated', override: user.interviewAccessOverride });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/interview-settings/override-by-email", auth, verifyAdmin, async (req, res) => {
  try {
    const { email, override } = req.body;
    const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
    if (!user) return res.status(404).json({ success: false, message: 'User not found with this email' });
    user.interviewAccessOverride = !!override;
    await user.save();
    res.json({ success: true, message: 'Override updated', override: user.interviewAccessOverride });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/whitelisted-users", auth, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { interviewAccessOverride: true },
        { resumeAccessOverride: true }
      ]
    }).select('name email interviewAccessOverride resumeAccessOverride');
    
    res.json({
      success: true,
      interview: users.filter(u => u.interviewAccessOverride),
      resume: users.filter(u => u.resumeAccessOverride)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/interview-settings/tokens", auth, verifyAdmin, async (req, res) => {
  try {
    let freeTokens = await Settings.findOne({ key: "interviewFreeTokens" });
    let interviewCost = await Settings.findOne({ key: "interviewCostTokens" });
    
    res.json({
      success: true,
      freeTokens: freeTokens ? parseInt(freeTokens.value) : 30,
      interviewCost: interviewCost ? parseInt(interviewCost.value) : 10
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/interview-settings/tokens", auth, verifyAdmin, async (req, res) => {
  try {
    const { freeTokens, interviewCost } = req.body;
    
    if (freeTokens !== undefined) {
      await Settings.findOneAndUpdate(
        { key: "interviewFreeTokens" },
        { value: freeTokens },
        { upsert: true }
      );
    }
    
    if (interviewCost !== undefined) {
      await Settings.findOneAndUpdate(
        { key: "interviewCostTokens" },
        { value: interviewCost },
        { upsert: true }
      );
    }
    
    res.json({ success: true, message: "Settings updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Adjust tokens manually
router.post("/interview-settings/tokens/adjust", auth, verifyAdmin, async (req, res) => {
  try {
    const { userId, type, amount, reason } = req.body;
    
    if (!userId || !type || !amount) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const adjustAmount = Number(amount);
    if (type === 'ADD') {
      user.interviewCredits = (user.interviewCredits || 0) + adjustAmount;
    } else if (type === 'DEDUCT') {
      user.interviewCredits = Math.max(0, (user.interviewCredits || 0) - adjustAmount);
    }

    if (!user.tokenHistory) user.tokenHistory = [];
    user.tokenHistory.push({
      type,
      amount: adjustAmount,
      reason: reason || (type === 'ADD' ? 'Admin adjusted' : 'Admin deducted'),
      date: new Date()
    });

    await user.save();
    res.json({ success: true, message: "Tokens adjusted successfully", credits: user.interviewCredits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fetch token data specifically for Token Management page
router.get("/token-data", auth, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'name email interviewCredits interviewIsUnlimited tokenHistory interviewPayments').lean();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/interview-data", auth, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { interviewPayments: { $not: { $size: 0 } } },
        { interviewCredits: { $ne: 30 } },
        { interviewIsUnlimited: true },
        { interviewAccessOverride: true }
      ]
    }).lean();
    const sessions = await InterviewSession.find().populate("userId", "name email").lean();

    const userMap = {};
    users.forEach(u => { 
      userMap[u._id.toString()] = { 
        ...u, 
        credits: u.interviewCredits, 
        isUnlimited: u.interviewIsUnlimited,
        sessions: [] 
      }; 
    });
    sessions.forEach(s => {
      const uid = s.userId?._id?.toString() || s.userId?.toString();
      if (uid && userMap[uid]) {
        userMap[uid].sessions.push(s);
      } else if (uid && !userMap[uid]) {
        // If user has sessions but didn't match the query above (e.g. they only used free credits)
        userMap[uid] = {
          _id: uid,
          name: s.userId?.name || "Unknown",
          email: s.userId?.email || "",
          credits: 0,
          isUnlimited: false,
          sessions: [s]
        };
      }
    });

    res.json({
      success: true,
      data: Object.values(userMap),
      earnings: { totalEarnings: 0, last7DaysEarnings: 0, dailyEarnings: {}, recentPayments: [] }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Resume Feature Settings ──────────────────────────────────────────────────

router.get("/resume-settings", async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "resumeEnabled" });
    const isEnabled = setting ? setting.value : true;
    res.json({ success: true, enabled: isEnabled });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/resume-settings/toggle", auth, verifyAdmin, async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: "resumeEnabled" });
    if (!setting) {
      setting = new Settings({ key: "resumeEnabled", value: false });
    } else {
      setting.value = !setting.value;
    }
    await setting.save();
    res.json({ success: true, enabled: setting.value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/resume-settings/override-by-email", auth, verifyAdmin, async (req, res) => {
  try {
    const { email, override } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    
    // Support unified user model search
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    user.resumeAccessOverride = !!override;
    await user.save();
    res.json({ success: true, message: 'Override updated', override: user.resumeAccessOverride, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Banner Management ─────────────────────────────────────────────────────

// Public: anyone can fetch banner settings (used by frontend FeatureBanner)
router.get("/banner", async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "promoBanner" });
    if (!setting || !setting.value) {
      return res.json({ success: true, banner: null });
    }
    res.json({ success: true, banner: setting.value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: save banner settings (imageUrl already uploaded to Cloudinary by frontend)
router.post("/banner", auth, verifyAdmin, async (req, res) => {
  try {
    const { imageUrl, enabled } = req.body;
    const isEnabled = enabled === true || enabled === "true";

    const newValue = {
      imageUrl: imageUrl || null,
      enabled: isEnabled,
    };

    // Use $set with explicit fields for Mixed type — avoids Mongoose caching issues
    await Settings.findOneAndUpdate(
      { key: "promoBanner" },
      { $set: { "value.imageUrl": newValue.imageUrl, "value.enabled": newValue.enabled } },
      { upsert: true, new: true }
    );

    res.json({ success: true, banner: newValue });
  } catch (err) {
    console.error("Banner save error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: remove banner image entirely
router.delete("/banner", auth, verifyAdmin, async (req, res) => {
  try {
    await Settings.findOneAndUpdate(
      { key: "promoBanner" },
      { value: { imageUrl: null, enabled: false } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Impersonate intern using email
const jwt = require("jsonwebtoken");
router.post("/impersonate", auth, verifyAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found with this email" });

    // Extract the first studentId if available
    const studentId = user.internships?.length > 0 ? user.internships[0].studentId : null;

    // Generate token matching normal student login exactly
    const payload = { 
      id: user._id, 
      email: user.email, 
      studentId 
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'codeanova',
      { expiresIn: "5d" },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          success: true, 
          token, 
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            studentId,
            isFirstLogin: user.isFirstLogin === undefined ? true : user.isFirstLogin,
          }
        });
      }
    );
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
