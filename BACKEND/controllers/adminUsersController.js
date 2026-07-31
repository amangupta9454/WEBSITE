const User = require("../models/User");

// Get all website users with filters and search
exports.getAllUsers = async (req, res) => {
  try {
    const { type, search } = req.query;

    let query = {};
    if (search) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      query = {
        $or: [
          { name: regex },
          { email: regex },
          { mobile: regex }
        ]
      };
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    const formattedUsers = users.map((user) => {
      const internships = user.internships || [];
      const isIntern = user.role === "intern" || internships.length > 0;
      const appliedDomains = Array.from(new Set(internships.map((i) => i.domain).filter(Boolean)));

      return {
        _id: user._id,
        name: user.name || "N/A",
        email: user.email || "N/A",
        mobile: user.mobile || "N/A",
        role: user.role || "user",
        isIntern,
        internshipsCount: internships.length,
        appliedDomains,
        internships: internships.map((i) => ({
          studentId: i.studentId,
          domain: i.domain,
          duration: i.duration,
          batch: i.batch,
          appliedAt: i.appliedAt,
          hasPaid: i.hasPaid,
          certificateUrl: i.certificateUrl
        })),
        interviewCredits: user.interviewCredits || 0,
        referredByCode: user.referredByCode || null,
        createdAt: user.createdAt
      };
    });

    let filteredUsers = formattedUsers;
    if (type === "intern") {
      filteredUsers = formattedUsers.filter((u) => u.isIntern);
    } else if (type === "registered") {
      filteredUsers = formattedUsers.filter((u) => !u.isIntern);
    }

    const stats = {
      total: formattedUsers.length,
      interns: formattedUsers.filter((u) => u.isIntern).length,
      registered: formattedUsers.filter((u) => !u.isIntern).length,
    };

    res.json({
      success: true,
      stats,
      users: filteredUsers,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
