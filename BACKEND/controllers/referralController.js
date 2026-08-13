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
    let user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") }
    });

    // If user account doesn't exist yet, create a pre-registered ambassador record so admin can assign anyone
    if (!user) {
      const usernameFromEmail = normalizedEmail.split('@')[0];
      const defaultName = req.body.name || (usernameFromEmail.charAt(0).toUpperCase() + usernameFromEmail.slice(1));
      user = new User({
        name: defaultName,
        email: normalizedEmail,
        mobile: "Pending Registration",
        isAmbassador: true,
        ambassadorCollege: college || "N/A",
        ambassadorName: req.body.name || defaultName,
        status: "Pending Registration",
        roles: ["student", "campus_ambassador"],
      });
    } else {
      if (req.body.name) {
        user.ambassadorName = req.body.name;
        user.name = req.body.name; // Keep main name in sync for dashboard display
      }
    }

    let code = customCode
      ? customCode.trim().toUpperCase()
      : user.ambassadorCode;

    if (!code) {
      const basePrefix = (user.name?.split(" ")[0] || "CAM").replace(/[^a-zA-Z]/g, "").toUpperCase() || "CAM";
      let isUnique = false;
      let tempCode = "";
      while (!isUnique) {
        tempCode = `AMB-${basePrefix}${Math.floor(100 + Math.random() * 900)}`;
        const exists = await Referral.findOne({ code: tempCode });
        if (!exists) isUnique = true;
      }
      code = tempCode;
    }

    user.isAmbassador = true;
    user.ambassadorCode = code;
    user.ambassadorCollege = college || user.ambassadorCollege || "N/A";
    if (!user.roles) user.roles = ["student"];
    if (!user.roles.includes("campus_ambassador")) user.roles.push("campus_ambassador");
    await user.save();

    // Create or update referral document for ambassador
    let referral = await Referral.findOne({ code });
    if (!referral) {
      referral = new Referral({
        code,
        createdBy: req.user?.email || "admin",
        targetEmail: user.email,
        featureTarget: "General",
        notes: `Campus Ambassador - ${user.name} (${user.ambassadorCollege || "N/A"})`,
        isAmbassador: true,
        ambassadorEmail: user.email,
      });
    } else {
      referral.isAmbassador = true;
      referral.ambassadorEmail = user.email;
      referral.notes = `Campus Ambassador - ${user.name} (${user.ambassadorCollege || "N/A"})`;
    }
    await referral.save();

    // Send notification email if nodemailer credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && typeof mailTransporter !== "undefined") {
      const mailOptions = {
        from: `"Code-A-Nova" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "🎉 You have been designated as a Campus Ambassador at Code-A-Nova!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #4f46e5; margin: 0;">Code-A-Nova Campus Ambassador Program</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Represent. Inspire. Innovate.</p>
            </div>
            <p style="color: #334155; font-size: 16px;">Dear <strong>${user.name}</strong>,</p>
            <p style="color: #334155; line-height: 1.6;">
              You have been directly designated as a <strong>Campus Ambassador at Code-A-Nova</strong>! 🎉
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; color: #1e293b; font-weight: bold;">Your Official Ambassador Details:</p>
              <p style="margin: 4px 0; color: #475569;">College: <strong>${user.ambassadorCollege || "N/A"}</strong></p>
              <p style="margin: 4px 0; color: #475569;">Ambassador Code: <strong style="color: #4f46e5; font-family: monospace; font-size: 16px;">${user.ambassadorCode}</strong></p>
            </div>
            <p style="color: #334155; line-height: 1.6;">
              When you log in or sign up with this email address, your dedicated <strong>Campus Ambassador Tab</strong> and all stats will automatically merge into your Student Dashboard!
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="https://code-a-nova.online/student-login" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Log In / Sign Up to Student Dashboard</a>
            </div>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-top: 24px;">
              Welcome aboard,<br />
              <strong>Team Code-A-Nova</strong>
            </p>
          </div>
        `,
      };
      mailTransporter.sendMail(mailOptions).catch((err) => console.error("Error sending ambassador notification email:", err));
    }

    res.json({
      success: true,
      message: `${user.name} is now designated as Campus Ambassador with code ${code}${user.mobile === "Pending Registration" ? " (Pre-registered account created & ready to merge upon user signup)" : ""}`,
      ambassador: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isAmbassador: user.isAmbassador,
        ambassadorCode: user.ambassadorCode,
        ambassadorName: String(user.ambassadorName || ""),
        ambassadorLinkedInPost: String(user.ambassadorLinkedInPost || ""),
        ambassadorCollege: user.ambassadorCollege,
      },
    });
  } catch (error) {
    console.error("Error assigning ambassador:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete/remove a Campus Ambassador
exports.deleteAmbassador = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Ambassador user not found" });
    }

    const code = user.ambassadorCode;
    user.isAmbassador = false;
    user.ambassadorCode = null;
    user.ambassadorCollege = null;
    
    // Remove "campus_ambassador" role to prevent UI fetch errors
    if (user.roles && user.roles.includes("campus_ambassador")) {
      user.roles = user.roles.filter(role => role !== "campus_ambassador");
    }
    
    await user.save();

    if (code) {
      await Referral.deleteOne({ code });
    }

    // Mark their application as Rejected so they do not auto-rejoin upon login
    const AmbassadorAppModel = require("../models/AmbassadorApplication");
    await AmbassadorAppModel.updateMany(
      { email: new RegExp(`^${user.email}$`, "i") },
      { $set: { status: "Rejected" } }
    );

    res.json({ success: true, message: `${user.name || "Ambassador"} removed successfully` });
  } catch (error) {
    console.error("Error deleting ambassador:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all Campus Ambassadors and their referral stats
exports.getAmbassadors = async (req, res) => {
  try {
    const ambassadors = await User.find({
      isAmbassador: true,
      ambassadorCode: { $nin: [null, ""] }
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

    const Settings = require("../models/Settings");
    const groupSetting = await Settings.findOne({ key: "ambassadorGroupUrl" });
    const ambassadorGroupUrl = groupSetting?.value || "";

    res.json({
      success: true,
      ambassadors: ambList,
      ambassadorGroupUrl
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
    const [interviewSetting, regSetting, jobSetting, groupSetting] = await Promise.all([
      Settings.findOne({ key: "interviewEnabled" }),
      Settings.findOne({ key: "registrationEnabled" }),
      Settings.findOne({ key: "jobPortalEnabled" }),
      Settings.findOne({ key: "ambassadorGroupUrl" }),
    ]);

    const ambassadorGroupUrl = groupSetting?.value || "https://chat.whatsapp.com/";

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

    // Calculate brand-new user signups strictly (who created their ID via this ambassador link)
    const brandNewUserSignupsCount = await User.countDocuments({
      referredByCode: codeRegex,
      isExistingUserReferred: { $ne: true }
    });

    res.json({
      success: true,
      ambassadorCode: code,
      ambassadorCollege: user.ambassadorCollege || "",
      ambassadorName: user.ambassadorName || user.name || "",
      ambassadorLinkedInPost: user.ambassadorLinkedInPost || "",
      isActive: refData ? refData.isActive !== false : true,
      clicks: refData?.clicks || 0,
      totalSignups: brandNewUserSignupsCount,
      ambassadorGroupUrl,
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

const AmbassadorApplication = require("../models/AmbassadorApplication");
const nodemailer = require("nodemailer");

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// --- Student: Save LinkedIn Post Link ---
exports.saveAmbassadorLinkedInPost = async (req, res) => {
  try {
    const { linkedInUrl } = req.body;
    if (!linkedInUrl) {
      return res.status(400).json({ success: false, message: "LinkedIn URL is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isAmbassador) {
      return res.status(403).json({ success: false, message: "Only ambassadors can save LinkedIn post" });
    }

    user.ambassadorLinkedInPost = linkedInUrl;
    await user.save();

    res.json({ success: true, message: "LinkedIn post saved successfully" });
  } catch (err) {
    console.error("Error saving LinkedIn post:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Student: Submit Campus Ambassador Application
exports.submitAmbassadorApplication = async (req, res) => {
  try {
    const { name, email, mobile, college, yearBranch, reason } = req.body;
    if (!name || !email || !mobile || !college || !yearBranch) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await AmbassadorApplication.findOne({
      email: cleanEmail,
      status: "Pending"
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending Campus Ambassador application under review!"
      });
    }

    const application = new AmbassadorApplication({
      name: name.trim(),
      email: cleanEmail,
      mobile: mobile.trim(),
      college: college.trim(),
      yearBranch: yearBranch.trim(),
      reason: reason ? reason.trim() : "",
      status: "Pending"
    });

    await application.save();

    res.json({
      success: true,
      message: "Your Campus Ambassador application has been submitted successfully! Admin will review and notify you via email."
    });
  } catch (error) {
    console.error("Error submitting ambassador application:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all Campus Ambassador Applications
exports.getAmbassadorApplications = async (req, res) => {
  try {
    const applications = await AmbassadorApplication.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, applications });
  } catch (error) {
    console.error("Error getting ambassador applications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Approve Campus Ambassador Application
exports.approveAmbassadorApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await AmbassadorApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    application.status = "Approved";
    application.approvedAt = new Date();
    await application.save();

    // Check or find user by email
    let user = await User.findOne({
      email: { $regex: new RegExp(`^${application.email}$`, "i") }
    });

    const code = `AMB-${application.name.split(" ")[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

    if (user) {
      user.isAmbassador = true;
      user.ambassadorCode = user.ambassadorCode || code;
      user.ambassadorCollege = application.college;
      await user.save();
    } else {
      user = new User({
        name: application.name,
        email: application.email,
        mobile: application.mobile,
        isAmbassador: true,
        ambassadorCode: code,
        ambassadorCollege: application.college
      });
      await user.save();
    }

    // Create or update referral record
    let referral = await Referral.findOne({ code: user.ambassadorCode });
    if (!referral) {
      referral = new Referral({
        code: user.ambassadorCode,
        createdBy: user.email,
        targetEmail: user.email,
        featureTarget: "General",
        notes: `Campus Ambassador - ${user.name} (${application.college})`,
        isAmbassador: true,
        ambassadorEmail: user.email,
      });
      await referral.save();
    }

    // Send Welcome Email to Ambassador
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      const mailOptions = {
        from: `"Code-A-Nova" <${process.env.EMAIL_USER}>`,
        to: application.email,
        subject: "🎉 Congratulations! You are now a Campus Ambassador at Code-A-Nova",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #4f46e5; margin: 0;">Code-A-Nova Campus Ambassador Program</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Represent. Inspire. Innovate.</p>
            </div>
            
            <p style="color: #334155; font-size: 16px;">Dear <strong>${application.name}</strong>,</p>

            <p style="color: #334155; line-height: 1.6;">
              We are thrilled to inform you that your application for the <strong>Campus Ambassador Program at Code-A-Nova</strong> has been <strong>APPROVED</strong>! 🎉
            </p>

            <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; color: #1e293b; font-weight: bold;">Your Official Ambassador Details:</p>
              <p style="margin: 4px 0; color: #475569;">College: <strong>${application.college}</strong></p>
              <p style="margin: 4px 0; color: #475569;">Ambassador Code: <strong style="color: #4f46e5; font-family: monospace; font-size: 16px;">${user.ambassadorCode}</strong></p>
            </div>

            <p style="color: #334155; line-height: 1.6;">
              Your dedicated <strong>Campus Ambassador Tab</strong> is now unlocked in your Student Dashboard! You can log in anytime to copy your unique referral links, track student signups, and access exclusive ambassador perks.
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="https://code-a-nova.online/student-login" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Log In to Student Dashboard</a>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-top: 24px;">
              Welcome aboard,<br />
              <strong>Team Code-A-Nova</strong>
            </p>
          </div>
        `,
      };
      mailTransporter.sendMail(mailOptions).catch((err) => console.error("Error sending ambassador approval email:", err));
    }

    res.json({
      success: true,
      message: `${application.name} has been approved as Campus Ambassador and welcome email sent!`
    });
  } catch (error) {
    console.error("Error approving ambassador application:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Reject Campus Ambassador Application
exports.rejectAmbassadorApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await AmbassadorApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    application.status = "Rejected";
    await application.save();

    res.json({ success: true, message: "Application status updated to Rejected" });
  } catch (error) {
    console.error("Error rejecting ambassador application:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Seamlessly link & merge any pre-assigned or approved Campus Ambassador data into a user account upon signup/login
exports.syncAndMergeAmbassadorData = async (user, email) => {
  try {
    if (!user || !email) return user;
    const cleanEmail = email.trim().toLowerCase();
    let updated = false;

    const AmbassadorAppModel = require("../models/AmbassadorApplication");
    const ReferralModel = require("../models/Referral");

    // Check if there is a Referral record designated for this email as ambassador
    const referral = await ReferralModel.findOne({
      ambassadorEmail: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
      isAmbassador: true
    });

    // Check if there is an approved Ambassador Application for this email
    const application = await AmbassadorAppModel.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
      status: "Approved"
    });

    if (referral || application) {
      if (!user.isAmbassador) {
        user.isAmbassador = true;
        updated = true;
      }
      if (!user.ambassadorCode && referral?.code) {
        user.ambassadorCode = referral.code;
        updated = true;
      } else if (!user.ambassadorCode && application) {
        const basePrefix = (application.name?.split(" ")[0] || "CAM").replace(/[^a-zA-Z]/g, "").toUpperCase() || "CAM";
        const code = `AMB-${basePrefix}${Math.floor(100 + Math.random() * 900)}`;
        user.ambassadorCode = code;
        updated = true;
        let refDoc = await ReferralModel.findOne({ code });
        if (!refDoc) {
          refDoc = new ReferralModel({
            code,
            createdBy: cleanEmail,
            targetEmail: cleanEmail,
            featureTarget: "General",
            notes: `Campus Ambassador - ${application.name} (${application.college})`,
            isAmbassador: true,
            ambassadorEmail: cleanEmail,
          });
          await refDoc.save();
        }
      }
      if ((!user.ambassadorCollege || user.ambassadorCollege === "N/A") && (application?.college || referral?.notes?.match(/\(([^)]+)\)/)?.[1])) {
        user.ambassadorCollege = application?.college || referral?.notes?.match(/\(([^)]+)\)/)?.[1] || "N/A";
        updated = true;
      }
    }

    if (user.status === "Pending Registration") {
      user.status = "Registered";
      if (user.mobile === "Pending Registration") {
        user.mobile = "Registered";
      }
      updated = true;
    }

    if (!user.roles) user.roles = ["student"];
    if (!user.roles.includes("student")) {
      user.roles.push("student");
      updated = true;
    }
    if (user.internships && user.internships.length > 0 && !user.roles.includes("intern")) {
      user.roles.push("intern");
      updated = true;
    }
    if (user.isAmbassador && !user.roles.includes("campus_ambassador")) {
      user.roles.push("campus_ambassador");
      updated = true;
    }

    if (updated) {
      await user.save();
      console.log(`[Ambassador & RBAC Merge] Seamlessly synced status and roles for user ${cleanEmail}: ${user.roles}`);
    }
    return user;
  } catch (error) {
    console.error("[Ambassador Merge] Error syncing ambassador data:", error);
    return user;
  }
};

