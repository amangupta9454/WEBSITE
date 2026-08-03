/**
 * Phase 13 — Enterprise Analytics & Intelligence Platform
 * Controller: analyticsController.js
 * 
 * STRICT RULES:
 * - Read-Only operations ONLY. Never modifies database records or re-computes historical marks.
 * - Protected by verifyAdmin, JWT auth, and rate limiters at route layer.
 */
const AnalyticsEngine = require("../../services/assessment/analytics/AnalyticsEngine");

exports.getGlobalDashboard = async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      categoryId: req.query.categoryId,
      subcategoryId: req.query.subcategoryId
    };
    const stats = await AnalyticsEngine.getGlobalDashboard(filter);
    return res.status(200).json({ success: true, data: stats, timestamp: new Date() });
  } catch (error) {
    console.error("Analytics Dashboard Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to compile executive analytics." });
  }
};

exports.getAssessmentAnalytics = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const filter = {
      search: req.query.search,
      categoryId: req.query.categoryId
    };
    const data = await AnalyticsEngine.getAssessmentAnalytics(filter, page, limit);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Assessment Analytics Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to load assessment telemetry." });
  }
};

exports.getAssessmentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await AnalyticsEngine.getAssessmentDetail(id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(error.message === "Assessment not found." ? 404 : 500).json({ success: false, message: error.message });
  }
};

exports.getStudentAnalytics = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const data = await AnalyticsEngine.getStudentAnalytics(filter, page, limit);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Student Analytics Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to load student analytical timelines." });
  }
};

exports.getStudentDetail = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const data = await AnalyticsEngine.getStudentDetail(candidateId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to load candidate drilldown." });
  }
};

exports.getCategoryAnalytics = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const data = await AnalyticsEngine.getCategoryAnalytics(req.query, page, limit);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Category Analytics Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getQuestionAnalytics = async (req, res) => {
  try {
    const filter = {
      categoryId: req.query.categoryId,
      subcategoryId: req.query.subcategoryId
    };
    const data = await AnalyticsEngine.getQuestionAnalytics(filter);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Question Analytics Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRuntimeAnalytics = async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const data = await AnalyticsEngine.getRuntimeAnalytics(filter);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Runtime Analytics Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCertificateAnalytics = async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const data = await AnalyticsEngine.getCertificateAnalytics(filter);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Certificate Analytics Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTrendAnalytics = async (req, res) => {
  try {
    const period = req.query.period || "monthly";
    const data = await AnalyticsEngine.getTrendAnalytics(period, req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Trend Analytics Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportAnalytics = async (req, res) => {
  try {
    const reportType = req.query.reportType || "overview";
    const format = req.query.format || "csv";
    const result = await AnalyticsEngine.exportAnalytics(reportType, format, req.query);

    if (result.format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.send(result.content);
    }

    return res.status(200).json({ success: true, exportData: result });
  } catch (error) {
    console.error("Export Analytics Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
