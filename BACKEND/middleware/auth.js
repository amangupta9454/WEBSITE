// backend/middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
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
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};