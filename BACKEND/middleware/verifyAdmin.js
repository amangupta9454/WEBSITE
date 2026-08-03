const Admin = require("../models/Admin");

const verifyAdmin = async (req, res, next) => {
  try {
    // Guard: req.user is populated by auth.js middleware that MUST run before this.
    // If req.user is undefined, auth.js either didn't run or rejected the token.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "401 Unauthorized: No authenticated session. Ensure a valid admin JWT is provided in the Authorization header.",
        hint: "auth.js middleware must execute before verifyAdmin to decode the JWT token into req.user."
      });
    }

    const adminId = req.user.id || req.user.unifiedUserId;

    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing user ID in token payload" });
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
    res.status(500).json({ success: false, message: "Internal server error during authorization", detail: error.message });
  }
};

module.exports = { verifyAdmin };
