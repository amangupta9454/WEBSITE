/**
 * Phase 13 — Enterprise Analytics & Intelligence Platform
 * Master Orchestrator: AnalyticsEngine
 * 
 * STRICT ARCHITECTURAL RULES:
 * - READ ONLY: Never edits or deletes records, calculates marks again, generates certificates, or regenerates results.
 * - Consumes existing data from Phase 1-12 engines as ground truth.
 * - Supports Mongo aggregation pipelines, pagination, and multi-dimensional date/category filters.
 */
const DashboardAggregator = require("./DashboardAggregator");
const AssessmentAnalytics = require("./AssessmentAnalytics");
const StudentAnalytics = require("./StudentAnalytics");
const CategoryAnalytics = require("./CategoryAnalytics");
const QuestionAnalytics = require("./QuestionAnalytics");
const RuntimeAnalytics = require("./RuntimeAnalytics");
const CertificateAnalytics = require("./CertificateAnalytics");
const TrendEngine = require("./TrendEngine");
const ExportService = require("./ExportService");

class AnalyticsEngine {
  // Module 1: Global Dashboard
  static getGlobalDashboard(filter = {}) {
    return DashboardAggregator.getGlobalStats(filter);
  }

  // Module 2: Assessment Analytics
  static getAssessmentAnalytics(filter = {}, page = 1, limit = 10) {
    return AssessmentAnalytics.getAssessmentListAnalytics(filter, page, limit);
  }
  static getAssessmentDetail(subcategoryId) {
    return AssessmentAnalytics.getAssessmentDetail(subcategoryId);
  }

  // Module 3: Student Analytics
  static getStudentAnalytics(filter = {}, page = 1, limit = 10) {
    return StudentAnalytics.getStudentListAnalytics(filter, page, limit);
  }
  static getStudentDetail(candidateId) {
    return StudentAnalytics.getStudentDetail(candidateId);
  }

  // Module 4: Category Analytics
  static getCategoryAnalytics(filter = {}, page = 1, limit = 10) {
    return CategoryAnalytics.getCategoryAnalytics(filter, page, limit);
  }

  // Module 5: Question Analytics
  static getQuestionAnalytics(filter = {}) {
    return QuestionAnalytics.getQuestionInventoryStats(filter);
  }

  // Module 6: AI Runtime Analytics
  static getRuntimeAnalytics(filter = {}) {
    return RuntimeAnalytics.getRuntimeAnalytics(filter);
  }

  // Module 7: Certificate Analytics
  static getCertificateAnalytics(filter = {}) {
    return CertificateAnalytics.getCertificateAnalytics(filter);
  }

  // Module 8: Trend Analytics
  static getTrendAnalytics(period = "monthly", filter = {}) {
    return TrendEngine.getTrendAnalytics(period, filter);
  }

  // Module 10: Export Service
  static exportAnalytics(reportType = "overview", format = "csv", filter = {}) {
    return ExportService.exportAnalytics(reportType, format, filter);
  }
}

module.exports = AnalyticsEngine;
