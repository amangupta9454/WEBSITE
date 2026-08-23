const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const AuditStat = require('../models/AuditStat');
const { verifyAdmin } = require('../middleware/verifyAdmin'); // Assuming this exists

// Get all audit stats (aggregated)
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    // Filter by days
    if (req.query.days) {
      const days = parseInt(req.query.days);
      if (!isNaN(days) && days > 0) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        const dateStr = dateLimit.toISOString().split('T')[0];
        filter.date = { $gte: dateStr };
      }
    }

    const stats = await AuditStat.find(filter).sort({ date: -1 });
    res.json(stats);
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get recent audit logs with pagination
router.get('/recent', verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Optional filtering
    const filter = {};
    if (req.query.action) {
      filter.action = req.query.action;
    }
    if (req.query.userEmail) {
      filter.userEmail = { $regex: req.query.userEmail, $options: 'i' };
    }
    
    // Filter by days
    if (req.query.days) {
      const days = parseInt(req.query.days);
      if (!isNaN(days) && days > 0) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        filter.createdAt = { $gte: dateLimit };
      }
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');
      
    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
