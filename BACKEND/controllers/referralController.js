const Referral = require("../models/Referral");
const User = require("../models/User");

// Generate unique referral code
const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REF-${random}`;
};

// Create a new referral code
exports.createReferralCode = async (req, res) => {
  try {
    const { customCode, targetEmail, featureTarget, notes } = req.body;
    let code = customCode ? customCode.trim().toUpperCase() : generateCode();

    // Check duplicate
    const existing = await Referral.findOne({ code });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Referral code already exists. Please use another code.",
      });
    }

    const referral = new Referral({
      code,
      createdBy: req.user?.email || "admin",
      targetEmail: targetEmail ? targetEmail.trim().toLowerCase() : "",
      featureTarget: featureTarget || "General",
      notes: notes || "",
    });

    await referral.save();

    res.json({
      success: true,
      message: "Referral code created successfully",
      referral,
    });
  } catch (error) {
    console.error("Error creating referral code:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all referral codes & summary stats
exports.getReferralCodes = async (req, res) => {
  try {
    const referrals = await Referral.find().sort({ createdAt: -1 }).lean();

    const stats = {
      totalCodes: referrals.length,
      totalClicks: referrals.reduce((sum, r) => sum + (r.clicks || 0), 0),
      totalUses: referrals.reduce((sum, r) => sum + (r.usesCount || 0), 0),
    };

    res.json({
      success: true,
      stats,
      referrals,
    });
  } catch (error) {
    console.error("Error getting referral codes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle active/inactive status
exports.toggleReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({ success: false, message: "Referral code not found" });
    }

    referral.isActive = !referral.isActive;
    await referral.save();

    res.json({
      success: true,
      message: `Referral code is now ${referral.isActive ? "Active" : "Inactive"}`,
      isActive: referral.isActive,
    });
  } catch (error) {
    console.error("Error toggling referral status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete referral code
exports.deleteReferralCode = async (req, res) => {
  try {
    const { id } = req.params;
    await Referral.findByIdAndDelete(id);
    res.json({ success: true, message: "Referral code deleted" });
  } catch (error) {
    console.error("Error deleting referral code:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get detailed list of users who joined via referral codes
exports.getReferredUsers = async (req, res) => {
  try {
    const { search, code } = req.query;

    let query = {
      referredByCode: { $ne: null, $exists: true, $ne: "" },
    };

    if (code) {
      query.referredByCode = code.trim().toUpperCase();
    }

    if (search) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      query = {
        ...query,
        $or: [
          { name: regex },
          { email: regex },
          { mobile: regex },
          { referredByCode: regex },
        ],
      };
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    // Map referral codes metadata
    const allReferrals = await Referral.find().lean();
    const referralMap = {};
    allReferrals.forEach((ref) => {
      referralMap[ref.code] = ref;
    });

    const conversions = users.map((user) => {
      const internships = user.internships || [];
      const appliedFeatures = [];

      if (internships.length > 0) {
        internships.forEach((i) => {
          appliedFeatures.push(`Internship (${i.domain || "General"})`);
        });
      }

      if (user.resumeData && Object.keys(user.resumeData).length > 0) {
        appliedFeatures.push("AI Resume Created");
      }

      if (user.interviewCredits !== undefined) {
        appliedFeatures.push(`Interview Access (${user.interviewCredits} credits)`);
      }

      if (appliedFeatures.length === 0) {
        appliedFeatures.push("Account Registered / Signed In");
      }

      const refMeta = referralMap[user.referredByCode] || {};

      return {
        _id: user._id,
        name: user.name || "N/A",
        email: user.email || "N/A",
        mobile: user.mobile || "N/A", // Phone number
        referredByCode: user.referredByCode,
        featureTarget: refMeta.featureTarget || "General",
        notes: refMeta.notes || "",
        appliedFeatures: appliedFeatures.join(", "),
        appliedItems: appliedFeatures,
        registeredAt: user.referredAt || user.createdAt,
      };
    });

    res.json({
      success: true,
      total: conversions.length,
      conversions,
    });
  } catch (error) {
    console.error("Error in getReferredUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Track link click (Public Endpoint)
exports.trackClick = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code required" });

    const referral = await Referral.findOne({ code: code.trim().toUpperCase() });
    if (referral && referral.isActive) {
      referral.clicks = (referral.clicks || 0) + 1;
      await referral.save();
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Assign or update a Campus Ambassador
exports.assignAmbassador = async (req, res) => {
  try {
    const { email, customCode, college } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "User email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email" });
    }

    const code = customCode
      ? customCode.trim().toUpperCase()
      : user.ambassadorCode || `AMB-${user.name?.split(" ")[0]?.toUpperCase() || "CAM"}${Math.floor(100 + Math.random() * 900)}`;

    user.isAmbassador = true;
    user.ambassadorCode = code;
    user.ambassadorCollege = college || user.ambassadorCollege || "";
    await user.save();

    // Create or update referral document for ambassador
    let referral = await Referral.findOne({ code });
    if (!referral) {
      referral = new Referral({
        code,
        createdBy: user.email,
        targetEmail: user.email,
        featureTarget: "General",
        notes: `Campus Ambassador - ${user.name} (${college || "N/A"})`,
        isAmbassador: true,
        ambassadorEmail: user.email,
      });
    } else {
      referral.isAmbassador = true;
      referral.ambassadorEmail = user.email;
      referral.notes = `Campus Ambassador - ${user.name} (${college || "N/A"})`;
    }
    await referral.save();

    res.json({
      success: true,
      message: `${user.name} is now designated as Campus Ambassador with code ${code}`,
      ambassador: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isAmbassador: user.isAmbassador,
        ambassadorCode: user.ambassadorCode,
        ambassadorCollege: user.ambassadorCollege,
      },
    });
  } catch (error) {
    console.error("Error assigning ambassador:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all Campus Ambassadors and their referral stats
exports.getAmbassadors = async (req, res) => {
  try {
    const ambassadors = await User.find({
      $or: [{ isAmbassador: true }, { ambassadorCode: { $ne: null, $exists: true, $ne: "" } }]
    }).sort({ createdAt: -1 }).lean();

    const referralCodes = ambassadors.map((a) => a.ambassadorCode).filter(Boolean);
    const referrals = await Referral.find({ code: { $in: referralCodes } }).lean();
    const refMap = {};
    referrals.forEach((r) => {
      refMap[r.code] = r;
    });

    const conversions = await User.find({
      referredByCode: { $in: referralCodes },
      isExistingUserReferred: { $ne: true }
    }).lean();

    const attemptedRejoins = await User.find({
      $or: [
        { attemptedReferredByCode: { $in: referralCodes } },
        { referredByCode: { $in: referralCodes }, isExistingUserReferred: true }
      ]
    }).lean();

    const ambList = ambassadors.map((amb) => {
      const code = amb.ambassadorCode;
      const refData = refMap[code] || {};
      const referredUsers = conversions.filter((c) => c.referredByCode === code);
      const existingAttempted = attemptedRejoins.filter((c) => c.attemptedReferredByCode === code || c.referredByCode === code);

      return {
        _id: amb._id,
        name: amb.name,
        email: amb.email,
        mobile: amb.mobile,
        ambassadorCode: amb.ambassadorCode,
        ambassadorCollege: amb.ambassadorCollege || "N/A",
        referralId: refData._id || null,
        isActive: refData ? refData.isActive !== false : true,
        clicks: refData.clicks || 0,
        usesCount: referredUsers.length,
        referredUsers: referredUsers.map((u) => {
          let appliedLabel = u.referredFeature;
          if (!appliedLabel) {
            if (u.internships && u.internships.length > 0) {
              const lastIntern = u.internships[u.internships.length - 1];
              appliedLabel = `Internship (${lastIntern.domain || "General"})`;
            } else {
              appliedLabel = "Account Registered";
            }
          }

          return {
            _id: u._id,
            name: u.name,
            email: u.email,
            mobile: u.mobile, // Phone number
            appliedFeatures: appliedLabel,
            registeredAt: u.referredAt || u.createdAt
          };
        }),
        existingAttemptedUsers: existingAttempted.map((u) => ({
          _id: u._id,
          name: u.name || "N/A",
          email: u.email || "N/A",
          mobile: u.mobile || "N/A",
          attemptedAt: u.attemptedReferredAt || u.updatedAt
        }))
      };
    });

    res.json({
      success: true,
      ambassadors: ambList
    });
  } catch (error) {
    console.error("Error getting ambassadors:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const ReferralActivity = require('../models/ReferralActivity');

const recordReferralActivity = async (userDoc, ambassadorCode, featureName) => {
  try {
    if (!userDoc || !ambassadorCode || !featureName) return;
    const cleanCode = ambassadorCode.trim().toUpperCase();

    const refDoc = await Referral.findOne({ code: new RegExp(`^${cleanCode}$`, 'i') });
    if (!refDoc) return;

    await ReferralActivity.findOneAndUpdate(
      {
        user: userDoc._id,
        ambassadorCode: cleanCode,
        featureName: featureName
      },
      {
        $set: {
          userName: userDoc.name || 'N/A',
          userEmail: userDoc.email || 'N/A',
          userMobile: userDoc.mobile || 'N/A',
          performedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    refDoc.usesCount = (refDoc.usesCount || 0) + 1;
    await refDoc.save();
  } catch (e) {
    console.error("Error recording referral activity:", e);
  }
};

exports.recordReferralActivity = recordReferralActivity;

// Student Dashboard: Get Ambassador stats for logged-in ambassador
exports.getStudentAmbassadorStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const user = await User.findById(userId).lean();

    if (!user || (!user.isAmbassador && !user.ambassadorCode)) {
      return res.status(403).json({ success: false, message: "User is not a Campus Ambassador" });
    }

    const code = user.ambassadorCode;
    const codeRegex = new RegExp(`^${code.trim()}$`, "i");
    const refData = await Referral.findOne({ code: codeRegex }).lean();

    // Query feature-level referral activities
    const activities = await ReferralActivity.find({ ambassadorCode: codeRegex })
      .sort({ createdAt: -1 })
      .lean();

    const referredUsers = await User.find({ 
      referredByCode: codeRegex,
      isExistingUserReferred: { $ne: true }
    }).sort({ createdAt: -1 }).lean();

    let conversions = [];

    if (activities.length > 0) {
      conversions = activities.map((act) => ({
        _id: act._id,
        name: act.userName || "N/A",
        email: act.userEmail || "N/A",
        mobile: act.userMobile || "N/A",
        appliedFeatures: act.featureName,
        appliedItems: [act.featureName],
        registeredAt: act.performedAt || act.createdAt
      }));
    } else {
      conversions = referredUsers.map((u) => {
        let appliedLabel = u.referredFeature;
        if (!appliedLabel) {
          if (u.internships && u.internships.length > 0) {
            const lastIntern = u.internships[u.internships.length - 1];
            appliedLabel = `Internship (${lastIntern.domain || "General"})`;
          } else {
            appliedLabel = "Account Registered";
          }
        }

        return {
          _id: u._id,
          name: u.name || "N/A",
          email: u.email || "N/A",
          mobile: u.mobile || "N/A",
          appliedFeatures: appliedLabel,
          appliedItems: [appliedLabel],
          registeredAt: u.referredAt || u.createdAt
        };
      });
    }

    const Settings = require("../models/Settings");
    const [interviewSetting, regSetting, jobSetting] = await Promise.all([
      Settings.findOne({ key: "interviewEnabled" }),
      Settings.findOne({ key: "registrationEnabled" }),
      Settings.findOne({ key: "jobPortalEnabled" }),
    ]);

    const featureFlags = {
      interviewEnabled: interviewSetting ? Boolean(interviewSetting.value) : true,
      registrationEnabled: regSetting ? Boolean(regSetting.value) : true,
      jobPortalEnabled: jobSetting ? Boolean(jobSetting.value) : true,
    };

    const availableFeatures = [
      {
        id: "general",
        title: "General Website Referral Link (Main)",
        path: "/",
        isFullWidth: true,
        isDefault: true,
        enabled: true,
      },
      {
        id: "internship",
        title: "Internship Application Program",
        path: "/registration",
        isFullWidth: false,
        enabled: featureFlags.registrationEnabled,
      },
      {
        id: "resume",
        title: "AI Resume Builder",
        path: "/my-resumes",
        isFullWidth: false,
        enabled: true,
      },
      {
        id: "interview",
        title: "AI Mock Interview Portal",
        path: "/my-interviews",
        isFullWidth: false,
        enabled: featureFlags.interviewEnabled,
      },
      {
        id: "jobs",
        title: "Job Portal & Opportunities",
        path: "/jobs",
        isFullWidth: false,
        enabled: featureFlags.jobPortalEnabled,
      },
    ];

    // Also fetch existing users who attempted rejoin via this ambassador link
    const attemptedRejoins = await User.find({
      $or: [
        { attemptedReferredByCode: codeRegex },
        { referredByCode: codeRegex, isExistingUserReferred: true }
      ]
    }).sort({ updatedAt: -1 }).lean();

    const existingAccountAttempts = attemptedRejoins.map((u) => ({
      _id: u._id,
      name: u.name || "N/A",
      email: u.email || "N/A",
      mobile: u.mobile || "N/A",
      attemptedAt: u.attemptedReferredAt || u.updatedAt
    }));

    res.json({
      success: true,
      ambassadorCode: code,
      ambassadorCollege: user.ambassadorCollege || "",
      isActive: refData ? refData.isActive !== false : true,
      clicks: refData?.clicks || 0,
      totalSignups: Math.max(refData?.usesCount || 0, conversions.length),
      featureFlags,
      availableFeatures,
      conversions,
      existingAccountAttempts
    });
  } catch (error) {
    console.error("Error in getStudentAmbassadorStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Student Dashboard: Track real-time feature usage activity
exports.trackUserActivity = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { featureName, referralCode } = req.body;
    if (userId && featureName) {
      const user = await User.findById(userId);
      if (user) {
        user.referredFeature = featureName;
        await user.save();

        const activeCode = referralCode || user.referredByCode;
        if (activeCode) {
          await recordReferralActivity(user, activeCode, featureName);
        }
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error in trackUserActivity:", error);
    res.json({ success: false, message: error.message });
  }
};
