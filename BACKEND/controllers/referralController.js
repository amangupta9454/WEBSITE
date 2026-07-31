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
