const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const AuditStat = require('../models/AuditStat');
const UniqueIP = require('../models/UniqueIP');
const auth = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/verifyAdmin');
const auditLogger = require('../utils/auditLogger');

// Get summary metrics
router.get('/summary', auth, verifyAdmin, async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Find today's visits (NEW_VISITOR and STUDENT_LOGIN could both count as visits, but we'll use NEW_VISITOR to match the generic visits. Or we can just sum all 'NEW_VISITOR' stats)
    // Actually, let's just sum all NEW_VISITOR counts
    const todayStats = await AuditStat.findOne({ date: todayStr, action: 'NEW_VISITOR' });
    const yesterdayStats = await AuditStat.findOne({ date: yesterdayStr, action: 'NEW_VISITOR' });

    const todaysVisits = todayStats ? todayStats.count : 0;
    const yesterdaysVisits = yesterdayStats ? yesterdayStats.count : 0;

    let growth = 0;
    if (yesterdaysVisits > 0) {
      growth = Math.round(((todaysVisits - yesterdaysVisits) / yesterdaysVisits) * 100);
    } else if (todaysVisits > 0) {
      growth = 100;
    }

    const totalUniqueIps = await UniqueIP.countDocuments();

    res.json({
      todaysVisits,
      yesterdaysVisits,
      growth,
      totalUniqueIps
    });
  } catch (error) {
    console.error("Error fetching summary stats:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all audit stats (aggregated)
router.get('/stats', auth, verifyAdmin, async (req, res) => {
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
router.get('/recent', auth, verifyAdmin, async (req, res) => {
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

// Public endpoint to track unauthenticated page visits
router.post('/track', async (req, res) => {
  try {
    const { action, details } = req.body;
    // Track page visits or other public actions
    // Only allow specific actions to avoid abuse
    if (action === 'PAGE_VISIT' || action === 'NEW_VISITOR') {
      const ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.ip;
      await auditLogger.log(action, {
        ipAddress: ip,
        ...(details || {})
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking public audit log:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
