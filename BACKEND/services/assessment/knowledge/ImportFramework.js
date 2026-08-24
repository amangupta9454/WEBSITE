const questionIntelligenceEngine = require("../QuestionIntelligenceEngine");
const PersistenceEngine = require("./PersistenceEngine");

/**
 * ImportFramework.js — Component 6: Knowledge Sources & Component 14: Import Framework
 * Provides a standardized ingestion pipeline across diverse origins: AI Generated, Manual Entry, CSV Import, and Future API.
 * GUARANTEED GOVERNANCE: All items, regardless of origin, MUST pass through the Phase 6 AI Quality Gate
 * (QuestionIntelligenceEngine) for structural, semantic, duplicate, and Bloom validation prior to persistence in the Knowledge Base.
 */
class ImportFramework {
  /**
   * Imports a batch of raw question items from any recognized origin source into the permanent Question Knowledge Base.
   * 
   * @param {Array<Object>} items - Raw or structured question items
   * @param {Object} options - Configuration: { source, categoryId, subcategoryId, actor, requestId, provider, model }
   * @returns {Promise<Object>} Import execution summary and detailed item reports
   */
  static async importQuestions(items, options = {}) {
    const startTime = Date.now();
    const source = options.source || "Manual Entry";
    const validSources = ["AI Generated", "Manual Entry", "CSV Import", "Future API", "AI", "manual", "csv", "api"];

    if (!validSources.includes(source)) {
      throw new Error(`[ImportFramework] Unrecognized source origin "${source}". Allowed: ${validSources.join(", ")}`);
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("[ImportFramework] Import failed: No evaluation questions provided in ingestion payload.");
    }

    if (!options.categoryId || !options.subcategoryId) {
      throw new Error("[ImportFramework] Ingestion blocked: Target Category ID and Subcategory ID must be specified for canonical storage.");
    }

    // 1. RUN PHASE 6 QUALITY GATE VALIDATION (Component 14)
    // Every question, whether manual or AI or CSV, goes through the exact same 7-stage validation pipeline
    const validationResults = await questionIntelligenceEngine.analyzeAndValidate(items, {
      fallbackModality: options.modality || "MCQ",
      requestedDifficulty: options.difficulty || "Medium",
    });

    if (!validationResults.success && (!validationResults.approvedQuestions || validationResults.approvedQuestions.length === 0)) {
      return {
        success: false,
        source,
        totalSubmitted: items.length,
        totalApprovedByGate: 0,
        totalPersisted: 0,
        gateRejections: validationResults.intelligenceReports?.filter(r => r.approvalStatus !== "Approved").length || items.length,
        message: "Quality Gate rejected all submitted items due to formatting, structural, or quality deficiencies.",
        reports: validationResults.intelligenceReports || []
      };
    }

    const approvedItems = validationResults.approvedQuestions || [];
    const rejectedItems = (validationResults.intelligenceReports || []).filter(r => r.approvalStatus !== "Approved" && r.approvalStatus !== "Force Approved");

    // 2. ENRICH APPROVED ITEMS WITH REQUIRED SOURCE & PARENT METADATA (Component 5 & 6)
    const enrichedQuestions = approvedItems.map(q => {
      const rep = (validationResults.intelligenceReports || []).find(r => r.id === q.id || r.stem === q.question) || {};
      return {
        ...q,
        categoryId: options.categoryId,
        subcategoryId: options.subcategoryId,
        createdSource: source,
        requestId: options.requestId || null,
        provider: options.provider || (source.includes("AI") ? "Groq" : "Human-Verified"),
        model: options.model || (source.includes("AI") ? "openai/gpt-oss-20b" : "expert-curator"),
        bloomLevel: rep.bloomLevel || q.bloomLevel || "Apply",
        qualityScore: rep.qualityScore || q.qualityScore || 95,
        fingerprint: rep.fingerprint || null,
        validationSummary: rep,
        status: "Approved",
      };
    });

    // 3. TRANSACTIONAL PERSISTENCE VIA PERSISTENCE ENGINE (Component 2 & 9)
    let persistenceReport = { successfullyPersisted: 0, rejectedOrFailed: 0, reports: [], errors: [] };
    if (enrichedQuestions.length > 0) {
      persistenceReport = await PersistenceEngine.persistBatch(enrichedQuestions, {
        actor: options.actor || `admin_importer_${source.toLowerCase().replace(/\s+/g, "_")}`,
        reason: `Batch ingestion from ${source} origin`
      });
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      source,
      totalSubmitted: items.length,
      qualityGateSummary: {
        passed: approvedItems.length,
        rejectedOrNeedsReview: rejectedItems.length,
        averageScore: Math.round(
          approvedItems.reduce((acc, c) => acc + (c.qualityScore || 95), 0) / (approvedItems.length || 1)
        ),
      },
      persistenceSummary: {
        totalPersisted: persistenceReport.successfullyPersisted,
        persistenceErrors: persistenceReport.rejectedOrFailed,
        reports: persistenceReport.reports,
        errors: persistenceReport.errors,
      },
      rejectedReports: rejectedItems,
      executionTimeMs,
      message: `Successfully validated and persisted ${persistenceReport.successfullyPersisted} questions from ${source} into Knowledge Base.`
    };
  }
}

module.exports = ImportFramework;
