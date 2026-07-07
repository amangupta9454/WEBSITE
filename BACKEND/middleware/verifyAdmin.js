const Admin = require("../models/Admin");

const verifyAdmin = async (req, res, next) => {
  try {
    // req.user is populated by the auth.js middleware that runs before this
    const adminId = req.user.id || req.user.unifiedUserId;

    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing user ID" });
    }

    // Verify against the existing Admin collection
    const adminExists = await Admin.findById(adminId);
    if (!adminExists) {
      return res.status(403).json({ success: false, message: "Forbidden: Admin privileges required" });
    }

    // Pass execution to the next handler
    next();
  } catch (error) {
    console.error("verifyAdmin Middleware Error:", error);
    res.status(500).json({ success: false, message: "Internal server error during authorization" });
  }
};

module.exports = { verifyAdmin };
