const EmailLog = require('../../models/email/EmailLog');
const mailService = require('../../services/mailService');

/**
 * Enterprise Email Center Controller
 * Provides complete administrative visibility, analytics, server-side pagination, search, filters, and re-dispatch capabilities.
 */

// 1. Get paginated email logs with advanced search and multi-attribute filtering
exports.getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { search, status, campaign, source, startDate, endDate, domain } = req.query;
    const query = {};

    // Apply status filter
    if (status && status !== 'ALL' && status !== 'All') {
      query.status = status.toUpperCase();
    }

    // Apply campaign filter
    if (campaign && campaign !== 'All' && campaign !== 'ALL') {
      query.campaign = campaign;
    }

    // Apply source filter
    if (source && source !== 'All') {
      query.source = source;
    }

    // Apply domain filter (e.g., @gmail.com or gmail)
    if (domain && domain.trim() !== '') {
      const dom = domain.startsWith('@') ? domain : `@${domain}`;
      query.recipientEmail = { $regex: dom, $options: 'i' };
    }

    // Apply date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    // Apply instant keyword search across multiple attributes
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { recipientName: regex },
        { recipientEmail: regex },
        { subject: regex },
        { campaign: regex },
        { messageId: regex },
      ];
    }

    // Query DB with pagination & ordering (Excluding bulky HTML/text payloads in list queries for high speed performance)
    const [logs, total] = await Promise.all([
      EmailLog.find(query)
        .select('-html -text')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmailLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[EmailLogController] ❌ Error fetching email logs:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving email logs.' });
  }
};

// 2. Get specific email log details by ID
exports.getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await EmailLog.findById(id).lean();

    if (!log) {
      return res.status(404).json({ success: false, message: 'Email log not found.' });
    }

    return res.status(200).json({ success: true, log });
  } catch (error) {
    console.error('[EmailLogController] ❌ Error fetching log details:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching email details.' });
  }
};

// 3. Get comprehensive Dashboard Analytics & Charts
exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    // Accurately compute Indian Standard Time (IST, UTC+5:30) day boundaries
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffsetMs);

    // Midnight today in IST converted back to UTC epoch timestamp for MongoDB query
    const startOfTodayIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()));
    const startOfToday = new Date(startOfTodayIST.getTime() - istOffsetMs);

    // Start of the week (last 7 days from today midnight in IST)
    const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

    // Start of current IST month converted back to UTC epoch
    const startOfMonthIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1));
    const startOfMonth = new Date(startOfMonthIST.getTime() - istOffsetMs);

    // Run parallel counts and aggregation pipelines for high-speed computation
    const [
      totalEmails,
      successEmails,
      failedEmails,
      todayEmails,
      weekEmails,
      monthEmails,
      campaignStats,
      dailyStatsRaw,
      monthlyStatsRaw,
    ] = await Promise.all([
      EmailLog.countDocuments(),
      EmailLog.countDocuments({ status: 'SUCCESS' }),
      EmailLog.countDocuments({ status: 'FAILED' }),
      EmailLog.countDocuments({ createdAt: { $gte: startOfToday } }),
      EmailLog.countDocuments({ createdAt: { $gte: startOfWeek } }),
      EmailLog.countDocuments({ createdAt: { $gte: startOfMonth } }),
      // Campaign wise distribution
      EmailLog.aggregate([
        {
          $group: {
            _id: '$campaign',
            total: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
            lastSent: { $max: '$createdAt' },
          },
        },
        { $sort: { total: -1 } },
      ]),
      // Daily emails for the last 14 days
      EmailLog.aggregate([
        {
          $match: { createdAt: { $gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            count: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Monthly emails for the last 12 months
      EmailLog.aggregate([
        {
          $match: { createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const successRate = totalEmails > 0 ? ((successEmails / totalEmails) * 100).toFixed(1) : '100.0';

    // Format daily chart series cleanly using IST keys
    const dailyEmails = {};
    for (let i = 13; i >= 0; i--) {
      const dIST = new Date(nowIST.getTime() - i * 24 * 60 * 60 * 1000);
      const key = dIST.toISOString().split('T')[0];
      dailyEmails[key] = 0;
    }
    dailyStatsRaw.forEach((item) => {
      dailyEmails[item._id] = item.count;
    });

    // Format monthly chart series cleanly
    const monthlyEmails = {};
    monthlyStatsRaw.forEach((item) => {
      monthlyEmails[item._id] = item.count;
    });

    // Format campaign breakdown
    const campaigns = campaignStats.map((item) => ({
      campaign: item._id || 'General',
      total: item.total,
      success: item.success,
      failed: item.failed,
      lastSent: item.lastSent,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalEmails,
        todayEmails,
        thisWeek: weekEmails,
        thisMonth: monthEmails,
        success: successEmails,
        failed: failedEmails,
        successRate: parseFloat(successRate),
      },
      charts: {
        dailyEmails,
        monthlyEmails,
        campaigns,
      },
    });
  } catch (error) {
    console.error('[EmailLogController] ❌ Error processing analytics aggregation:', error);
    return res.status(500).json({ success: false, message: 'Server error generating email analytics.' });
  }
};

// 4. Resend an email using stored HTML and attachments without overwriting previous historical log
exports.resendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delegate entirely to service layer to keep controller thin (Fix 10)
    const result = await mailService.resendStoredEmail(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to resend email via SMTP gateway.',
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email successfully resent and logged as a new delivery record.',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('[EmailLogController] ❌ Error in resend endpoint:', error.message);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error executing email resend.',
    });
  }
};

// 5. Delete email log (optional admin cleanliness capability)
exports.deleteLog = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await EmailLog.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Log record not found.' });
    }

    return res.status(200).json({ success: true, message: 'Email log deleted successfully.' });
  } catch (error) {
    console.error('[EmailLogController] ❌ Error deleting log:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting email log.' });
  }
};
