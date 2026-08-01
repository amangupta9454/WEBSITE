const mongoose = require("mongoose");
const AssessmentOptimizationReport = require("../../../models/assessment/AssessmentOptimizationReport");
const NotificationEventService = require("./NotificationEventService");

/**
 * Component 13: Knowledge Optimizer
 * Performs non-destructive, high-performance analytical scans over the permanent Question Knowledge Base
 * to identify optimization opportunities across duplicates, low-quality items, schema deprecations, blueprint drifts,
 * and metadata inconsistencies. STRICT ARCHITECTURAL MANDATE: Does NOT modify questions.
 */
class KnowledgeOptimizer {
  /**
   * Executes a comprehensive optimization scan over the entire Question Knowledge Base.
   *
   * @param {Object} filter - Optional query filter to scope scans to specific domains or categories.
   * @param {string} triggeredBy - Worker or actor triggering scan.
   */
  static async runOptimizationScan(filter = {}, triggeredBy = "Worker-Node-Beta") {
    const startTime = Date.now();
    const reportId = `OPT-REP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const Question = mongoose.model("AssessmentQuestion");
    const AIBlueprint = mongoose.model("AssessmentAIBlueprint");

    console.log(`[KnowledgeOptimizer] 🔍 Initiating diagnostic optimization scan [${reportId}] initiated by ${triggeredBy}...`);

    const activeQuestions = await Question.find({ isDeleted: false, ...filter }).lean();
    const activeBlueprints = await AIBlueprint.find({ isDeleted: false }).lean();

    // Map blueprints by subcategory ID for fast drift checking
    const blueprintMap = {};
    for (const bp of activeBlueprints) {
      if (bp.subcategoryId) {
        blueprintMap[bp.subcategoryId.toString()] = bp.versionNumber || 1;
      }
    }

    const duplicateScan = { totalScanned: activeQuestions.length, duplicatesFound: 0, flaggedItems: [] };
    const lowQualityScan = { totalScanned: activeQuestions.length, lowQualityFound: 0, flaggedItems: [] };
    const deprecatedScan = { totalScanned: activeQuestions.length, deprecatedFound: 0, flaggedItems: [] };
    const blueprintDriftScan = { totalScanned: activeQuestions.length, driftFound: 0, flaggedItems: [] };
    const metadataConsistency = { totalScanned: activeQuestions.length, inconsistenciesFound: 0, flaggedItems: [] };

    const hashMap = {};
    const textMap = {};

    for (const q of activeQuestions) {
      const qId = q.knowledgeBaseId || q._id?.toString() || "UNKNOWN_ID";
      const stem = q.questionText || "No stem provided";

      // 1. Duplicate Scan
      const hash = q.fingerprint || q.hash;
      const cleanText = stem.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

      if (hash && hashMap[hash]) {
        duplicateScan.duplicatesFound++;
        if (duplicateScan.flaggedItems.length < 50) {
          duplicateScan.flaggedItems.push({
            questionId: qId,
            stem: stem.substring(0, 80) + "...",
            matchType: "Exact Fingerprint Hash Match",
            duplicateOfId: hashMap[hash],
          });
        }
      } else if (cleanText.length > 20 && textMap[cleanText]) {
        duplicateScan.duplicatesFound++;
        if (duplicateScan.flaggedItems.length < 50) {
          duplicateScan.flaggedItems.push({
            questionId: qId,
            stem: stem.substring(0, 80) + "...",
            matchType: "Normalized Semantic Similarity Match (100%)",
            duplicateOfId: textMap[cleanText],
          });
        }
      } else {
        if (hash) hashMap[hash] = qId;
        if (cleanText.length > 20) textMap[cleanText] = qId;
      }

      // 2. Low Quality Scan (e.g., qualityScore below threshold or poor option variety)
      const score = typeof q.qualityScore === "number" ? q.qualityScore : 85;
      if (score < 80 || !Array.isArray(q.options) || q.options.length < 2) {
        lowQualityScan.lowQualityFound++;
        if (lowQualityScan.flaggedItems.length < 50) {
          lowQualityScan.flaggedItems.push({
            questionId: qId,
            stem: stem.substring(0, 80) + "...",
            score,
            issue: score < 80 ? `Sub-optimal validation score (${score}/100)` : "Insufficient distractor options count",
          });
        }
      }

      // 3. Deprecated Question Scan
      if (q.status === "Deprecated" || q.status === "Archived" || q.schemaVersion === "v1_legacy") {
        deprecatedScan.deprecatedFound++;
        if (deprecatedScan.flaggedItems.length < 50) {
          deprecatedScan.flaggedItems.push({
            questionId: qId,
            stem: stem.substring(0, 80) + "...",
            schemaVersion: q.schemaVersion || "Standard_V1",
            recommendation: "Review for archival replacement or modernize schema format to active v2 specification.",
          });
        }
      }

      // 4. Blueprint Version Drift Detection
      if (q.subcategoryId) {
        const subcatIdStr = q.subcategoryId._id?.toString() || q.subcategoryId.toString();
        const activeVersion = blueprintMap[subcatIdStr] || 1;
        const qVersion = q.generatorBlueprintVersion || q.blueprintVersion || 1;
        if (qVersion < activeVersion) {
          blueprintDriftScan.driftFound++;
          if (blueprintDriftScan.flaggedItems.length < 50) {
            blueprintDriftScan.flaggedItems.push({
              questionId: qId,
              stem: stem.substring(0, 80) + "...",
              questionBlueprintVersion: qVersion,
              activeBlueprintVersion: activeVersion,
            });
          }
        }
      }

      // 5. Metadata Consistency
      const missingFields = [];
      if (!q.difficulty) missingFields.push("difficulty");
      if (!q.bloomLevel) missingFields.push("bloomLevel");
      if (!q.tags || q.tags.length === 0) missingFields.push("tags");
      if (!q.correctAnswer && q.assessmentType === "MCQ") missingFields.push("correctAnswer");

      if (missingFields.length > 0) {
        metadataConsistency.inconsistenciesFound++;
        if (metadataConsistency.flaggedItems.length < 50) {
          metadataConsistency.flaggedItems.push({
            questionId: qId,
            stem: stem.substring(0, 80) + "...",
            missingField: missingFields.join(", "),
          });
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const report = await AssessmentOptimizationReport.create({
      reportId,
      scanDate: new Date(),
      status: "Completed",
      durationMs,
      duplicateScan,
      lowQualityScan,
      deprecatedScan,
      blueprintDriftScan,
      metadataConsistency,
    });

    const totalFindings =
      duplicateScan.duplicatesFound +
      lowQualityScan.lowQualityFound +
      deprecatedScan.deprecatedFound +
      blueprintDriftScan.driftFound +
      metadataConsistency.inconsistenciesFound;

    await NotificationEventService.createEvent(
      "Optimization Complete",
      `Knowledge Optimizer scan complete in ${durationMs}ms: Found ${totalFindings} optimization opportunities across ${activeQuestions.length} items.`,
      "Knowledge Repository",
      totalFindings > 0 ? "WARNING" : "SUCCESS",
      { reportId, totalFindings }
    );

    console.log(`[KnowledgeOptimizer] ✅ Completed optimization report [${reportId}] with ${totalFindings} total recommendations.`);
    return { success: true, data: report };
  }

  /**
   * Retrieves paginated optimization scan reports for admin dashboard analytics.
   */
  static async getOptimizationReports(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await AssessmentOptimizationReport.countDocuments();
    const reports = await AssessmentOptimizationReport.find()
      .sort({ scanDate: -1 })
      .skip(skip)
      .limit(limit);

    return {
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: reports,
    };
  }

  /**
   * Fetches full detail of a specific optimization report.
   */
  static async getReportDetail(reportId) {
    const report = await AssessmentOptimizationReport.findOne({ reportId });
    if (!report) return { success: false, error: "Report not found." };
    return { success: true, data: report };
  }
}

module.exports = KnowledgeOptimizer;
