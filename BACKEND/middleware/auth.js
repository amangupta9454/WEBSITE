// backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'secret');
    req.user = decoded;
    
    // Unify user ID and role for endpoints that serve both Interns and External users
    req.user.unifiedUserId = decoded.unifiedUserId || decoded.id || decoded.userId;
    req.user.unifiedRole = decoded.unifiedRole || decoded.role || 'intern'; // 'intern' or 'interview_user'

    // Guarantee req.user.email is populated even if token was issued without email (e.g. Google OAuth)
    if (!req.user.email && (req.user.id || req.user.unifiedUserId || req.user.userId)) {
      try {
        const u = await User.findById(req.user.id || req.user.unifiedUserId || req.user.userId).select('email name');
        if (u?.email) {
          req.user.email = u.email;
          if (!req.user.name && u.name) req.user.name = u.name;
        }
      } catch (uErr) {
        // Continue with decoded token if lookup fails
      }
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};