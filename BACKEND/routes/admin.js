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
  getTokenPurchases,
  sendEvaluationEmails,
  resetAIEvaluations,
  migrateDates,
  makeAllInterns,
  fixMergedAccounts,
  getJobPortalSetting,
  toggleJobPortalSetting,
  toggleJobPortalFreeMode,
  updateJobPortalPrice,
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
  assignAmbassador,
  getAmbassadors,
  deleteAmbassador,
  getAmbassadorApplications,
  approveAmbassadorApplication,
  rejectAmbassadorApplication,
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

// Campus Ambassador Admin routes
router.get("/ambassadors", auth, verifyAdmin, getAmbassadors);
router.post("/ambassadors/assign", auth, verifyAdmin, assignAmbassador);
router.delete("/ambassador/:id", auth, verifyAdmin, deleteAmbassador);
router.get("/ambassador-applications", auth, verifyAdmin, getAmbassadorApplications);
router.post("/ambassador-applications/approve/:id", auth, verifyAdmin, approveAmbassadorApplication);
router.post("/ambassador-applications/reject/:id", auth, verifyAdmin, rejectAmbassadorApplication);
router.get("/recent-payments", auth, verifyAdmin, getRecentPayments);
router.get("/token-purchases", auth, verifyAdmin, getTokenPurchases);
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

// Bulk Import & Quiz Routes
const { importInterns, importQuizUsers, sendQuizCertificate, getQuizApplicants, getQuizSponsorDetails, deleteQuizApplicant, deleteApplication, bulkDeleteApplications, updateQuizSponsor, sendDeleteQuizOtp, deleteQuiz } = require("../controllers/adminController");
router.post("/import-interns", auth, verifyAdmin, upload.single("excelFile"), importInterns);
router.post("/import-quiz-users", auth, verifyAdmin, upload.fields([{ name: "excelFile", maxCount: 1 }, { name: "sponsorLogo", maxCount: 1 }, { name: "sponsorSignature", maxCount: 1 }]), importQuizUsers);
router.get("/quiz-applicants", auth, verifyAdmin, getQuizApplicants);
router.get("/quiz-applicants/sponsor-details/:quizName", auth, verifyAdmin, getQuizSponsorDetails);
router.post("/quiz-applicants/send-certificate", auth, verifyAdmin, sendQuizCertificate);
router.post("/quiz-applicants/update-sponsor", auth, verifyAdmin, updateQuizSponsor);
router.delete("/quiz-applicants/:id", auth, verifyAdmin, deleteQuizApplicant);
router.post("/quizzes/:quizName/send-otp", auth, verifyAdmin, sendDeleteQuizOtp);
router.post("/quizzes/:quizName/delete", auth, verifyAdmin, deleteQuiz);
router.delete("/applications/:id", auth, verifyAdmin, deleteApplication);
router.post("/applications/bulk-delete", auth, verifyAdmin, bulkDeleteApplications);

// One-time migration: backfill batch from startDate for all existing intern records
router.post("/migrate-batch-from-startdate", auth, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({ "internships.0": { $exists: true } }).lean();
    let updatedUsers = 0;
    let updatedRecords = 0;

    for (const user of users) {
      let dirty = false;
      const updatedInternships = user.internships.map(intern => {
        // Only backfill if batch is empty/null AND startDate exists
        if ((!intern.batch || intern.batch.trim() === "") && intern.startDate) {
          const d = new Date(intern.startDate);
          if (!isNaN(d.getTime())) {
            const batch = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
            dirty = true;
            updatedRecords++;
            return { ...intern, batch };
          }
        }
        return intern;
      });

      if (dirty) {
        await User.updateOne(
          { _id: user._id },
          { $set: { internships: updatedInternships } }
        );
        updatedUsers++;
      }
    }

    res.json({
      success: true,
      message: `Migration complete! Updated ${updatedRecords} internship record(s) across ${updatedUsers} user(s).`
    });
  } catch (err) {
    console.error("[Admin] Batch migration error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

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
router.post("/normal-tasks", auth, verifyAdmin, upload.array("pdfs", 2), createNormalTask);
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
router.post("/settings/job-portal/free-mode", auth, verifyAdmin, toggleJobPortalFreeMode);
router.put("/settings/job-portal/price", auth, verifyAdmin, updateJobPortalPrice);
router.get("/job-settings", getJobPortalSetting);

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

const User = require("../models/User");
const PreGrantedBonus = require('../models/PreGrantedBonus');
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
    // Fetch ALL interview sessions first
    const sessions = await InterviewSession.find().populate("userId", "name email interviewCredits interviewIsUnlimited interviewAccessOverride interviewPayments").lean();

    // Collect all unique user IDs that have sessions
    const sessionUserIds = [...new Set(
      sessions.map(s => s.userId?._id?.toString() || s.userId?.toString()).filter(Boolean)
    )];

    // Also fetch users with special interview flags (payments, unlimited, override) even if no sessions
    const specialUsers = await User.find({
      $or: [
        { interviewPayments: { $not: { $size: 0 } } },
        { interviewCredits: { $ne: 30 } },
        { interviewIsUnlimited: true },
        { interviewAccessOverride: true }
      ]
    }).lean();

    // Build user map from special users
    const userMap = {};
    specialUsers.forEach(u => {
      userMap[u._id.toString()] = {
        ...u,
        credits: u.interviewCredits,
        isUnlimited: u.interviewIsUnlimited,
        sessions: []
      };
    });

    // Map sessions to users; populate missing users from session's populated userId field
    sessions.forEach(s => {
      const uid = s.userId?._id?.toString() || s.userId?.toString();
      if (!uid) return;

      if (!userMap[uid]) {
        // User only used free credits — still include them since they have sessions
        const u = s.userId || {};
        userMap[uid] = {
          _id: uid,
          name: u.name || "Unknown",
          email: u.email || "",
          credits: u.interviewCredits ?? 30,
          isUnlimited: u.interviewIsUnlimited || false,
          interviewAccessOverride: u.interviewAccessOverride || false,
          interviewPayments: u.interviewPayments || [],
          sessions: []
        };
      }
      userMap[uid].sessions.push(s);
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

router.post("/resume-settings/grant-free", auth, verifyAdmin, async (req, res) => {
  try {
    const { email, freeResumes, freeDownloads } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    
    const formattedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: formattedEmail });
    
    if (user) {
      user.freeResumesGranted = Number(freeResumes) || 0;
      user.freeDownloadsPerResume = Number(freeDownloads) || 0;
      await user.save();
      return res.json({ success: true, message: "Free limits updated successfully for existing user" });
    } else {
      let preGrant = await PreGrantedBonus.findOne({ email: formattedEmail });
      if (!preGrant) {
        preGrant = new PreGrantedBonus({ email: formattedEmail });
      }
      preGrant.freeResumesGranted = Number(freeResumes) || 0;
      preGrant.freeDownloadsPerResume = Number(freeDownloads) || 0;
      await preGrant.save();
      return res.json({ success: true, message: "User not found. Limits pre-granted for future registration." });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/job-settings/grant-premium", auth, verifyAdmin, async (req, res) => {
  try {
    const { email, premiumDays } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    
    const formattedEmail = email.toLowerCase().trim();
    const days = Number(premiumDays) || 0;
    
    const user = await User.findOne({ email: formattedEmail });
    
    if (user) {
      if (days > 0) {
        user.jobPortalPremium = true;
        const baseDate = (user.jobPortalPremiumExpires && new Date(user.jobPortalPremiumExpires) > new Date())
          ? new Date(user.jobPortalPremiumExpires)
          : new Date();
        user.jobPortalPremiumExpires = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      } else {
        user.jobPortalPremium = false;
        user.jobPortalPremiumExpires = null;
      }
      await user.save();
      return res.json({ success: true, message: "Job Portal Premium updated for existing user" });
    } else {
      let preGrant = await PreGrantedBonus.findOne({ email: formattedEmail });
      if (!preGrant) {
        preGrant = new PreGrantedBonus({ email: formattedEmail });
      }
      preGrant.jobPortalPremiumDays = days;
      await preGrant.save();
      return res.json({ success: true, message: "User not found. Job Premium pre-granted for future registration." });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/resume-settings/granted-users", auth, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({ freeResumesGranted: { $gt: 0 } }).select('name email freeResumesGranted freeDownloadsPerResume');
    const preGranted = await PreGrantedBonus.find({ freeResumesGranted: { $gt: 0 } }).select('email freeResumesGranted freeDownloadsPerResume');
    
    const formattedPreGranted = preGranted.map(p => ({
      name: "Unregistered (Pending)",
      email: p.email,
      freeResumesGranted: p.freeResumesGranted,
      freeDownloadsPerResume: p.freeDownloadsPerResume
    }));
    
    res.json({ success: true, users: [...users, ...formattedPreGranted] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/job-settings/granted-users", auth, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({ jobPortalPremium: true, jobPortalPremiumExpires: { $gt: new Date() } }).select('name email jobPortalPremiumExpires');
    const preGranted = await PreGrantedBonus.find({ jobPortalPremiumDays: { $gt: 0 } }).select('email jobPortalPremiumDays');
    
    const formattedPreGranted = preGranted.map(p => ({
      name: "Unregistered (Pending)",
      email: p.email,
      pendingDays: p.jobPortalPremiumDays
    }));
    
    res.json({ success: true, users, preGranted: formattedPreGranted });
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
    const { imageUrl, enabled, targetUrl, buttonText } = req.body;
    const isEnabled = enabled === true || enabled === "true";

    const newValue = {
      imageUrl: imageUrl || null,
      enabled: isEnabled,
      targetUrl: targetUrl ? String(targetUrl).trim() : "",
      buttonText: buttonText ? String(buttonText).trim() : "Click Here",
    };

    // Use $set with explicit fields for Mixed type — avoids Mongoose caching issues
    await Settings.findOneAndUpdate(
      { key: "promoBanner" },
      { 
        $set: { 
          "value.imageUrl": newValue.imageUrl, 
          "value.enabled": newValue.enabled,
          "value.targetUrl": newValue.targetUrl,
          "value.buttonText": newValue.buttonText
        } 
      },
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
    
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email.trim()}$`, "i") } });
    const inviteUrl = `${process.env.FRONTEND_URL || "https://code-a-nova.online"}/student-login?invite=${encodeURIComponent(email)}`;

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        errorType: "USER_NOT_FOUND",
        status: "User account not found.",
        message: "This person has not registered on Code-A-Nova yet.",
        invitationLink: inviteUrl 
      });
    }

    if (user.status === "Pending Registration" || user.mobile === "Pending Registration") {
      return res.status(403).json({
        success: false,
        errorType: "PENDING_REGISTRATION",
        status: "Pending Registration",
        message: "Cannot impersonate.\nThis user hasn't completed registration yet.",
        invitationLink: inviteUrl
      });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({
        success: false,
        errorType: "INACTIVE_ACCOUNT",
        status: "Inactive",
        message: "Cannot impersonate an inactive account."
      });
    }

    // Extract the first studentId if available
    const studentId = user.internships?.length > 0 ? user.internships[0].studentId : null;
    const roles = typeof user.getUserRoles === "function" ? user.getUserRoles() : (user.roles || ["student"]);

    // Generate token matching normal student login exactly
    const payload = { 
      id: user._id, 
      email: user.email, 
      studentId,
      roles
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
            roles,
            status: user.status || "Registered",
            isFirstLogin: user.isFirstLogin === undefined ? true : user.isFirstLogin,
          }
        });
      }
    );
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/impersonate/invite", auth, verifyAdmin, async (req, res) => {
  try {
    const { email, resend } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    
    const nodemailer = require("nodemailer");
    const sendSafeEmail = require("../utils/safeMailSender");
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
      const inviteUrl = `${process.env.FRONTEND_URL || "https://code-a-nova.online"}/student-login?invite=${encodeURIComponent(email)}`;
      const mailOptions = {
        from: `"Code-A-Nova Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${resend ? "[Reminder] " : ""}Invitation to Register on Code-A-Nova Portal`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Welcome to Code-A-Nova!</h2>
            <p>You have been invited to join the Code-A-Nova platform by an administrator.</p>
            <p>Please complete your registration to automatically access all your assigned role portals (such as Campus Ambassador, Internship, or Assessment modules).</p>
            <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete Registration</a></p>
            <p>Or copy this link: <br /><code>${inviteUrl}</code></p>
          </div>
        `
      };
      sendSafeEmail(transporter, mailOptions, 'Admin Invite').catch(err => console.error("Error sending invite email:", err));
    }
    res.json({ success: true, message: resend ? "Invitation resent successfully" : "Invitation email sent successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error sending invitation" });
  }
});

router.post("/ambassador-group-url", auth, verifyAdmin, async (req, res) => {
  try {
    const { url } = req.body;
    const Settings = require("../models/Settings");
    await Settings.findOneAndUpdate(
      { key: "ambassadorGroupUrl" },
      { value: url || "" },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "Ambassador group URL updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Assessment Feature Toggle
router.get("/assessment-settings", async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "assessmentEnabled" });
    res.json({ success: true, enabled: setting ? setting.value : true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/assessment-settings/toggle", auth, verifyAdmin, async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: "assessmentEnabled" });
    if (!setting) {
      setting = await Settings.create({ key: "assessmentEnabled", value: false });
    } else {
      setting.value = !setting.value;
      await setting.save();
    }
    res.json({ success: true, enabled: setting.value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const { getGraphicInterns, updateStipendStatus, updateGraphicSubmissionStatus, uploadGraphicResource, deleteGraphicResource, getGraphicResources, markInternResigned, rejectInternship } = require("../controllers/adminController");
router.get("/graphic-interns", auth, verifyAdmin, getGraphicInterns);
router.post("/update-stipend", auth, verifyAdmin, updateStipendStatus);
router.post("/graphic-submission-status", auth, verifyAdmin, updateGraphicSubmissionStatus);
router.post('/internship-resignation', auth, verifyAdmin, markInternResigned);
router.post('/internship-reject', auth, verifyAdmin, rejectInternship);

router.post("/graphic-resource", auth, verifyAdmin, upload.single('file'), uploadGraphicResource);
router.delete("/graphic-resource/:id", auth, verifyAdmin, deleteGraphicResource);
router.get("/graphic-resources", auth, verifyAdmin, getGraphicResources);

module.exports = router;
