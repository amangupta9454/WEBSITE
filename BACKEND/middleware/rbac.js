const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * Enterprise Role-Based Access Control (RBAC) Middleware for backend API protection.
 * Ensures strict role evaluation and returns 403 Forbidden on unauthorized API requests.
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?.unifiedUserId || req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "401 Unauthorized: Missing user authentication token." });
      }

      // Check if caller exists in Admin collection
      const adminExists = await Admin.findById(userId).catch(() => null);
      if (adminExists) {
        req.userRoles = ["admin", ...allowedRoles];
        return next();
      }

      // Locate user in User collection
      const user = await User.findById(userId).catch(() => null);
      if (!user) {
        return res.status(401).json({ success: false, message: "401 Unauthorized: User account record not found in database." });
      }

      // Guard against impersonating or invoking endpoints on inactive or pending registration users
      if (user.status === "Inactive" || user.status === "Pending Registration") {
        return res.status(403).json({ 
          success: false, 
          error: "INVALID_ACCOUNT_STATUS",
          message: `403 Forbidden: Your account status is currently '${user.status || "Inactive"}'. Access is denied.` 
        });
      }

      const userRoles = typeof user.getUserRoles === "function" ? user.getUserRoles() : (user.roles || ["student"]);
      req.userRoles = userRoles;

      // Admin possess complete architectural clearance
      if (userRoles.includes("admin")) {
        return next();
      }

      const hasPermission = allowedRoles.some(role => userRoles.includes(role));
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          error: "INSUFFICIENT_ROLES",
          message: `403 Forbidden: Insufficient role permissions for this module. Required roles: [${allowedRoles.join(", ")}]. Your assigned roles: [${userRoles.join(", ")}].` 
        });
      }

      next();
    } catch (error) {
      console.error("RBAC Authorization Error:", error);
      res.status(500).json({ success: false, message: "Internal server error during role authorization verification." });
    }
  };
};

module.exports = { requireRole };
