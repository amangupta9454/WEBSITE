const questionParser = require("./intelligence/QuestionParser");
const structureValidator = require("./intelligence/StructureValidator");
const duplicateDetector = require("./intelligence/DuplicateDetector");
const heuristicClassifier = require("./intelligence/HeuristicClassifier");
const contentValidator = require("./intelligence/ContentValidator");
const qualityScoringEngine = require("./intelligence/QualityScoringEngine");
const approvalDecisionEngine = require("./intelligence/ApprovalDecisionEngine");

/**
 * QuestionIntelligenceEngine.js — Master AI Quality Gate & Analytics Pipeline (Phase 6)
 * Coordinates parsing, structure verification, duplicate detection, Bloom taxonomy classification,
 * quality scoring, and automated decision making across bulk item batches (1 to 200 questions).
 * STRICT ARCHITECTURAL MANDATE: Operates exclusively in temporary memory; ZERO database saving (Phase 7).
 */
class QuestionIntelligenceEngine {
  constructor() {
    // Component 15: Runtime Validation Metrics Tracker (In-Memory Telemetry)
    this.runtimeMetrics = {
      totalValidated: 0,
      approvedCount: 0,
      needsReviewCount: 0,
      rejectedCount: 0,
      cumulativeQualityScore: 0,
      cumulativeValidationTimeMs: 0,
      totalDuplicatesDetected: 0,
      topicDistribution: {},
      difficultyDistribution: {},
      bloomDistribution: {}
    };

    // Component 18: Performance caching
    this.MAX_BATCH_SIZE = 250; // Safeguard ceiling for batch invocations
  }

  /**
   * Executes the full Phase 6 Question Intelligence evaluation pipeline on raw AI or normalized items.
   * 
   * @param {Object|Array} payload - Raw or normalized question dataset from AI Runtime Engine (Phase 5)
   * @param {Object} options - Pipeline configuration overrides (schemas, decision thresholds, requested difficulty)
   * @returns {Object} Comprehensive batch summary including Approved Question Set, validation reports, and live metrics.
   */
  async analyzeAndValidate(payload, options = {}) {
    const startTime = Date.now();

    // ── Security & Payload Integrity Guardrails (Component 19) ─────────────────
    if (!payload) {
      return {
        success: false,
        error: "SECURITY_REJECTED: Received empty or undefined evaluation payload.",
        approvedQuestions: [],
        intelligenceReports: []
      };
    }

    try {
      // 1. Parse raw output into standard in-memory Question items (Component 1)
      const parsedQuestions = questionParser.parse(payload, options.fallbackModality || "MCQ");
      
      if (parsedQuestions.length > this.MAX_BATCH_SIZE) {
        throw new Error(`Batch size limit exceeded (${parsedQuestions.length} > ${this.MAX_BATCH_SIZE} items). Component 18 protection triggered.`);
      }

      // 2. Initialize high-performance batch tracking structures (Component 14 & 18)
      const batchFingerprints = new Map();
      const intelligenceReports = [];
      const validationReports = [];
      const approvedQuestionSet = [];
      const needsReviewQuestionSet = [];
      const rejectedQuestionSet = [];

      let batchQualitySum = 0;
      let batchDuplicates = 0;

      // 3. Sequential evaluation loop optimized for batch performance
      for (const item of parsedQuestions) {
        // A. Structural & Reusable Schema Validation (Components 2, 3, 4, 5)
        const structRes = structureValidator.validate(item, options.schema || null, {
          requireExplanation: options.requireExplanation ?? true
        });

        // B. Duplicate Detection Pipeline (Component 6)
        const dupRes = duplicateDetector.detect(item, batchFingerprints);
        if (dupRes.isDuplicate) batchDuplicates++;

        // C. Heuristic Domain, Difficulty & Bloom Classification (Components 7, 8, 9)
        const classRes = heuristicClassifier.classify(item, options.requestedDifficulty || item.difficulty || "Medium");

        // D. Grammar & Syntax Content Validation (Component 10)
        const contentRes = contentValidator.validate(item);

        // E. Quality Scoring Engine Calculation (Component 11)
        const combinedErrors = [...structRes.errors, ...contentRes.contentErrors];
        const combinedWarnings = [...structRes.warnings, ...contentRes.contentWarnings];

        const scoreInput = {
          structureScore: structRes.structureScore,
          grammarScore: contentRes.grammarScore,
          completenessScore: contentRes.completenessScore,
          difficultyScore: classRes.difficultyScore,
          topicMatchScore: classRes.difficultyMatch ? 95 : 85,
          duplicateRisk: dupRes.duplicateRisk,
          hasCriticalStructureError: combinedErrors.length > 0,
          detectedDomain: classRes.detectedDomain,
          requestedTopic: options.requestedTopic || item.topic
        };

        const qualityScores = qualityScoringEngine.calculate(scoreInput, options.customWeights || null);
        batchQualitySum += qualityScores.overallQualityScore;

        // F. Automated Approval Decision Engine (Component 12 & 16)
        const decisionRes = approvalDecisionEngine.evaluate(
          qualityScores,
          combinedErrors,
          combinedWarnings,
          options.thresholdConfig || {}
        );

        // ── Component 13: Detailed Validation Report (Ephemereal Memory Only) ────
        const validationReport = {
          temporaryId: item.temporaryId,
          validationStatus: decisionRes.decision,
          reasons: decisionRes.decisionReasons,
          warnings: combinedWarnings,
          errors: combinedErrors,
          qualityScores,
          detectedTopic: classRes.topicHierarchy,
          difficulty: classRes.verifiedDifficulty,
          bloomLevel: classRes.bloomLevel,
          fingerprint: dupRes.fingerprint,
          duplicateMatchLevel: dupRes.matchLevel
        };
        validationReports.push(validationReport);

        // ── Component 17: Standard Intelligence Report (Output Contract) ────────
        const intelligenceReport = {
          questionId: item.temporaryId, // Strictly temporary (TMP-Q-...)
          fingerprint: dupRes.fingerprint,
          topic: classRes.detectedDomain,
          subtopic: classRes.detectedSubtopic,
          difficulty: classRes.verifiedDifficulty,
          bloomLevel: classRes.bloomLevel,
          grammarScore: qualityScores.grammarScore,
          qualityScore: qualityScores.overallQualityScore,
          duplicateRisk: qualityScores.duplicateRiskScore,
          approvalStatus: decisionRes.decision,
          validationNotes: decisionRes.decisionReasons.concat(classRes.difficultyNotes).join(" | ")
        };
        intelligenceReports.push(intelligenceReport);

        // Attach intelligence report directly onto memory item for immediate delivery
        const enhancedQuestion = {
          ...item,
          intelligenceReport,
          validationReport
        };

        if (decisionRes.decision === "Approved") {
          approvedQuestionSet.push(enhancedQuestion);
        } else if (decisionRes.decision === "Needs Review") {
          needsReviewQuestionSet.push(enhancedQuestion);
        } else {
          rejectedQuestionSet.push(enhancedQuestion);
        }

        // ── Update Component 15 In-Memory Telemetry Metrics ─────────────────────
        this.runtimeMetrics.totalValidated++;
        if (decisionRes.decision === "Approved") this.runtimeMetrics.approvedCount++;
        else if (decisionRes.decision === "Needs Review") this.runtimeMetrics.needsReviewCount++;
        else this.runtimeMetrics.rejectedCount++;

        if (dupRes.isDuplicate) this.runtimeMetrics.totalDuplicatesDetected++;

        // Tally distribution analytics
        const domainKey = classRes.detectedDomain || "General";
        this.runtimeMetrics.topicDistribution[domainKey] = (this.runtimeMetrics.topicDistribution[domainKey] || 0) + 1;

        const diffKey = classRes.verifiedDifficulty || "Medium";
        this.runtimeMetrics.difficultyDistribution[diffKey] = (this.runtimeMetrics.difficultyDistribution[diffKey] || 0) + 1;

        const bloomKey = classRes.bloomLevel || "Remember";
        this.runtimeMetrics.bloomDistribution[bloomKey] = (this.runtimeMetrics.bloomDistribution[bloomKey] || 0) + 1;
      }

      const elapsedMs = Date.now() - startTime;
      this.runtimeMetrics.cumulativeValidationTimeMs += elapsedMs;
      this.runtimeMetrics.cumulativeQualityScore += batchQualitySum;

      // Calculate batch statistics
      const totalCount = parsedQuestions.length || 1;
      const batchAvgQuality = Math.round(batchQualitySum / totalCount);
      const batchAvgTimePerItem = (elapsedMs / totalCount).toFixed(2);
      const batchDuplicateRate = Math.round((batchDuplicates / totalCount) * 100);

      // Return complete analysis without ever writing to MongoDB Question Bank
      return {
        success: true,
        pipelineStatus: "QUALITY_GATE_VERIFIED",
        persistenceNote: "Temporary Memory Only. No Database Question Saving occurred (Reserved for Phase 7).",
        batchMetrics: {
          itemsProcessed: totalCount,
          approved: approvedQuestionSet.length,
          needsReview: needsReviewQuestionSet.length,
          rejected: rejectedQuestionSet.length,
          avgQualityScore: batchAvgQuality,
          duplicateRate: batchDuplicateRate,
          totalExecutionTimeMs: elapsedMs,
          avgTimePerItemMs: Number(batchAvgTimePerItem)
        },
        approvedQuestionSet,
        needsReviewQuestionSet,
        rejectedQuestionSet,
        intelligenceReports,
        validationReports
      };

    } catch (err) {
      console.error("QuestionIntelligenceEngine execution exception:", err);
      return {
        success: false,
        error: "ENGINE_EXECUTION_FAILURE: Unable to complete validation pipeline.",
        details: err.message || "Internal validation exception occurred.",
        approvedQuestionSet: [],
        intelligenceReports: []
      };
    }
  }

  /**
   * Retrieves real-time runtime metrics computed by Component 15 across all evaluations.
   */
  getRuntimeMetrics() {
    const total = this.runtimeMetrics.totalValidated || 1;
    const avgQuality = Math.round(this.runtimeMetrics.cumulativeQualityScore / total);
    const avgTime = Number((this.runtimeMetrics.cumulativeValidationTimeMs / total).toFixed(2));
    const dupRate = Math.round((this.runtimeMetrics.totalDuplicatesDetected / total) * 100);

    return {
      totalValidated: this.runtimeMetrics.totalValidated,
      approved: this.runtimeMetrics.approvedCount,
      needsReview: this.runtimeMetrics.needsReviewCount,
      rejected: this.runtimeMetrics.rejectedCount,
      averageQuality: avgQuality,
      averageValidationTimeMs: avgTime,
      duplicateRate: `${dupRate}%`,
      topicDistribution: this.runtimeMetrics.topicDistribution,
      difficultyDistribution: this.runtimeMetrics.difficultyDistribution,
      bloomDistribution: this.runtimeMetrics.bloomDistribution,
      status: "Active (InMemory Quality Gate Telemetry)"
    };
  }

  /**
   * Simulates Component 16 human admin review action on a temporary memory report.
   */
  processReviewAction(questionId, actionState, reason) {
    return approvalDecisionEngine.simulateAdminAction(questionId, actionState, reason);
  }

  /**
   * Reset runtime telemetry and fingerprint memory cache (for testing harnesses).
   */
  resetRuntimeMemory() {
    duplicateDetector.resetRuntimeMemory();
    this.runtimeMetrics = {
      totalValidated: 0,
      approvedCount: 0,
      needsReviewCount: 0,
      rejectedCount: 0,
      cumulativeQualityScore: 0,
      cumulativeValidationTimeMs: 0,
      totalDuplicatesDetected: 0,
      topicDistribution: {},
      difficultyDistribution: {},
      bloomDistribution: {}
    };
    return { success: true, message: "Question Intelligence Engine ephemeral memory state completely reset." };
  }
}

module.exports = new QuestionIntelligenceEngine();
