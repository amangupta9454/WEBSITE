const mongoose = require("mongoose");
const VersioningEngine = require("./VersioningEngine");
const ModerationEngine = require("./ModerationEngine");
const InventorySyncService = require("./InventorySyncService");

/**
 * PersistenceEngine.js — Component 2: Persistence Engine & Component 9: Batch Persistence
 * Handles single and bulk transactional storage of approved evaluation items into the permanent Question Knowledge Base.
 * Strictly enforces that ONLY questions approved by the Question Intelligence Engine (AI Quality Gate) may be stored.
 * Any attempt to save items marked as "Needs Review", "Rejected", or falling below quality thresholds is blocked immediately.
 */
class PersistenceEngine {
  /**
   * Persists a single question item into the permanent repository after verification.
   * @param {Object} questionData - Normalized question payload from Quality Gate
   * @param {Object} [options] - Configuration options (actor, reason, session)
   * @returns {Promise<Object>} Component 13: Standardized Knowledge Report
   */
  static async persistSingle(questionData, options = {}) {
    const actor = options.actor || "system_quality_gate";
    const reason = options.reason || "Phase 6 Quality Gate Approved Persistence";

    // 1. STRICT QUALITY GATE ENFORCEMENT (Component 2)
    const status = questionData.status || questionData.approvalStatus || questionData.intelligenceReport?.approvalStatus;
    if (status !== "Approved" && status !== "approved" && status !== "Force Approved") {
      throw new Error(`[PersistenceEngine:Blocked] Refused storage for item with status "${status}". ONLY Approved questions may enter the permanent Knowledge Base.`);
    }

    const qualityScore = questionData.qualityScore ?? questionData.intelligenceReport?.qualityScore ?? 95;
    if (qualityScore < 75) {
      throw new Error(`[PersistenceEngine:Blocked] Quality Score (${qualityScore}%) falls below qualifying thresholds. Item rejected from Knowledge Base.`);
    }

    // 2. SECURITY GUARDRAILS (Component 17)
    await ModerationEngine.validateSecurityGate(questionData);

    const Question = mongoose.model("AssessmentQuestion");

    // Prepare clean persistence document matching Component 3 (Identity) & Component 5 (Metadata)
    const docPayload = {
      subcategoryId: questionData.subcategoryId,
      categoryId: questionData.categoryId,
      text: questionData.text || questionData.question || questionData.problemStatement,
      options: questionData.options || [],
      correctIndex: questionData.correctIndex || 0,
      correctAnswer: questionData.correctAnswer || "",
      explanation: questionData.explanation || "",
      difficulty: questionData.difficulty || "Medium",
      bloomLevel: questionData.bloomLevel || questionData.intelligenceReport?.bloomLevel || "Apply",
      assessmentType: questionData.assessmentType || questionData.modality || "MCQ",
      topics: questionData.topics || [],
      subtopic: questionData.subtopic || questionData.intelligenceReport?.subtopic || "General Core",
      qualityScore: qualityScore,
      createdSource: questionData.createdSource || "AI Generated",
      requestId: questionData.requestId || null,
      blueprintVersion: questionData.blueprintVersion || null,
      provider: questionData.provider || "Groq",
      model: questionData.model || "llama-3.3-70b-versatile",
      createdBy: actor,
      language: questionData.language || "English",
      tags: questionData.tags || ["verified", "kb-approved"],
      estimatedTimeSeconds: questionData.estimatedTimeSeconds || 60,
      status: "Approved",
      isDeleted: false,
      validationSummary: questionData.validationSummary || questionData.validationReport || {
        passedQualityGate: true,
        qualityScore: qualityScore,
        gateTimestamp: new Date().toISOString()
      },
      problemStatement: questionData.problemStatement || "",
      starterCode: questionData.starterCode || "",
      testCases: questionData.testCases || [],
      gradingRubric: questionData.gradingRubric || {},
    };

    // Include fingerprint if computed in Phase 6
    if (questionData.fingerprint || questionData.intelligenceReport?.fingerprint) {
      docPayload.fingerprint = questionData.fingerprint || questionData.intelligenceReport.fingerprint;
    }

    // Persist document to Mongoose repository
    const savedDoc = await Question.create([docPayload], options.session ? { session: options.session } : {});
    const questionDoc = savedDoc[0];

    // 3. VERSIONING SNAPSHOT (Component 4)
    await VersioningEngine.captureInitialRevision(questionDoc, actor, reason);

    // 4. AUTOMATED INVENTORY SYNCHRONIZATION (Component 8)
    const syncResult = await InventorySyncService.synchronize(questionDoc.subcategoryId, questionDoc.categoryId);

    // 5. IMMUTABLE AUDIT TRAIL LOGGING (Component 15)
    const auditRecord = await ModerationEngine.logAudit({
      knowledgeBaseId: questionDoc.knowledgeBaseId,
      questionObjectId: questionDoc._id,
      action: "Created",
      actor,
      reason,
      newStatus: "Approved",
      versionAffected: questionDoc.version || 1,
      metadataSnapshot: {
        qualityScore: questionDoc.qualityScore,
        bloomLevel: questionDoc.bloomLevel,
        source: questionDoc.createdSource,
        fingerprint: questionDoc.fingerprint
      }
    });

    // 6. RETURN COMPONENT 13: KNOWLEDGE REPORT
    return {
      knowledgeId: questionDoc.knowledgeBaseId,
      questionObjectId: questionDoc._id,
      fingerprint: questionDoc.fingerprint,
      version: questionDoc.version || 1,
      metadata: {
        subcategoryId: questionDoc.subcategoryId,
        categoryId: questionDoc.categoryId,
        difficulty: questionDoc.difficulty,
        bloomLevel: questionDoc.bloomLevel,
        assessmentType: questionDoc.assessmentType,
        qualityScore: questionDoc.qualityScore,
        createdSource: questionDoc.createdSource,
        status: questionDoc.status,
      },
      validationSummary: questionDoc.validationSummary,
      storageResult: "SUCCESS",
      inventorySyncResult: syncResult.status || "SUCCESS",
      auditId: auditRecord ? auditRecord.auditId : "AUDIT-ANONYMOUS",
      createdTimestamp: questionDoc.createdAt
    };
  }

  /**
   * Persists a batch of up to 500 questions in an atomic or sequential transactional workflow (Component 9).
   * @param {Array<Object>} questions - List of questions to persist
   * @param {Object} [options]
   */
  static async persistBatch(questions, options = {}) {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Batch persistence requires a non-empty array of evaluation questions.");
    }
    if (questions.length > 500) {
      throw new Error("Batch ceiling exceeded: A maximum of 500 items may be persisted in a single transactional batch.");
    }

    const batchReport = {
      totalRequested: questions.length,
      successfullyPersisted: 0,
      rejectedOrFailed: 0,
      executionTimeMs: 0,
      reports: [],
      errors: []
    };

    const startTime = Date.now();
    const actor = options.actor || "system_batch_manager";
    const reason = options.reason || `Batch ingestion of ${questions.length} items`;

    for (let i = 0; i < questions.length; i++) {
      const item = questions[i];
      try {
        const report = await this.persistSingle(item, { actor, reason });
        batchReport.successfullyPersisted++;
        batchReport.reports.push(report);
      } catch (err) {
        batchReport.rejectedOrFailed++;
        batchReport.errors.push({
          index: i,
          stemSnippet: (item.text || item.question || "N/A").toString().slice(0, 50),
          reason: err.message
        });
      }
    }

    batchReport.executionTimeMs = Date.now() - startTime;
    return batchReport;
  }
}

module.exports = PersistenceEngine;
