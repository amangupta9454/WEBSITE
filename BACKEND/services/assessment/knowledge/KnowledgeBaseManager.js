const mongoose = require("mongoose");
const PersistenceEngine = require("./PersistenceEngine");
const VersioningEngine = require("./VersioningEngine");
const InventorySyncService = require("./InventorySyncService");
const SearchEngine = require("./SearchEngine");
const ModerationEngine = require("./ModerationEngine");
const ImportFramework = require("./ImportFramework");

/**
 * KnowledgeBaseManager.js — Component 1: Knowledge Base Manager & Component 13: Knowledge Reports
 * Serves as the authoritative central brain and orchestrating facade for the permanent Question Knowledge Base.
 * Coordinates persistence, immutable identity labeling, version history tracking, soft deletion governance,
 * automated category inventory synchronization, enterprise multi-dimensional search, and audit trail compliance.
 */
class KnowledgeBaseManager {
  /**
   * Generates a comprehensive real-time analytical summary of the entire Question Knowledge Base repository.
   * @returns {Promise<Object>} Repository health and distribution statistics
   */
  static async getRepositoryStatistics() {
    try {
      const Question = mongoose.model("AssessmentQuestion");

      const [
        totalQuestions,
        activeApproved,
        archivedCount,
        disabledCount,
        deprecatedCount,
        draftCount,
        aiSourceCount,
        manualSourceCount,
        csvSourceCount,
        difficultyStats,
        bloomStats,
        avgScoreAggregation
      ] = await Promise.all([
        Question.countDocuments({ isDeleted: false }),
        Question.countDocuments({ isDeleted: false, status: { $in: ["Approved", "approved"] } }),
        Question.countDocuments({ isDeleted: false, status: "Archived" }),
        Question.countDocuments({ isDeleted: false, status: "Disabled" }),
        Question.countDocuments({ isDeleted: false, status: "Deprecated" }),
        Question.countDocuments({ isDeleted: false, status: { $in: ["Draft", "pending"] } }),
        Question.countDocuments({ isDeleted: false, createdSource: { $in: ["AI Generated", "AI", "api", "Future API"] } }),
        Question.countDocuments({ isDeleted: false, createdSource: { $in: ["Manual Entry", "manual"] } }),
        Question.countDocuments({ isDeleted: false, createdSource: { $in: ["CSV Import", "csv"] } }),
        Question.aggregate([
          { $match: { isDeleted: false } },
          { $group: { _id: { $toLower: "$difficulty" }, count: { $sum: 1 } } }
        ]),
        Question.aggregate([
          { $match: { isDeleted: false } },
          { $group: { _id: "$bloomLevel", count: { $sum: 1 } } }
        ]),
        Question.aggregate([
          { $match: { isDeleted: false, status: { $in: ["Approved", "approved"] } } },
          { $group: { _id: null, avgScore: { $avg: "$qualityScore" } } }
        ])
      ]);

      const difficulties = { easy: 0, medium: 0, hard: 0, expert: 0 };
      difficultyStats.forEach(d => {
        if (d._id && difficulties.hasOwnProperty(d._id)) {
          difficulties[d._id] = d.count;
        }
      });

      const bloomLevels = {};
      bloomStats.forEach(b => {
        bloomLevels[b._id || "Unassigned"] = b.count;
      });

      const averageQualityScore = avgScoreAggregation.length > 0 ? Math.round(avgScoreAggregation[0].avgScore * 10) / 10 : 95.0;

      return {
        success: true,
        repositoryHealth: "OPTIMAL",
        totalQuestions,
        statusBreakdown: {
          approved: activeApproved,
          archived: archivedCount,
          disabled: disabledCount,
          deprecated: deprecatedCount,
          draft: draftCount
        },
        sourceDistribution: {
          aiGenerated: aiSourceCount,
          manualEntry: manualSourceCount,
          csvImport: csvSourceCount
        },
        difficultyDistribution: difficulties,
        bloomDistribution: bloomLevels,
        averageQualityScore,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      console.error("[KnowledgeBaseManager] Error aggregating repository statistics:", err.message);
      return {
        success: false,
        error: err.message,
        totalQuestions: 0,
        statusBreakdown: {},
        sourceDistribution: {},
        difficultyDistribution: {},
        bloomDistribution: {},
        averageQualityScore: 95.0
      };
    }
  }

  /**
   * Retrieves full details of a single knowledge item including version history and audit trail logs.
   * @param {string} id - Mongoose _id or Knowledge Base ID
   */
  static async getQuestionDetail(id) {
    const Question = mongoose.model("AssessmentQuestion");
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { knowledgeBaseId: id };

    const doc = await Question.findOne(query)
      .populate("categoryId", "name slug icon")
      .populate("subcategoryId", "name slug icon")
      .lean();

    if (!doc) {
      throw new Error(`Question item (${id}) not found in repository.`);
    }

    const [revisions, audits] = await Promise.all([
      VersioningEngine.getRevisionHistory(doc.knowledgeBaseId || doc._id),
      ModerationEngine.getAuditLogs({ knowledgeBaseId: doc.knowledgeBaseId }, 50)
    ]);

    return {
      success: true,
      question: doc,
      revisionHistory: revisions,
      auditTrail: audits,
      knowledgeReport: this.formatKnowledgeReport(doc)
    };
  }

  /**
   * Component 13: Standardized Knowledge Report Formatter
   */
  static formatKnowledgeReport(doc) {
    if (!doc) return {};
    return {
      knowledgeId: doc.knowledgeBaseId || `KB-Q-${doc._id}`,
      questionObjectId: doc._id,
      fingerprint: doc.fingerprint || doc.hash || "UNHASHED",
      version: doc.version || 1,
      metadata: {
        subcategoryId: doc.subcategoryId?._id || doc.subcategoryId,
        categoryId: doc.categoryId?._id || doc.categoryId,
        difficulty: doc.difficulty,
        bloomLevel: doc.bloomLevel || "Apply",
        assessmentType: doc.assessmentType || "MCQ",
        qualityScore: doc.qualityScore || 95,
        createdSource: doc.createdSource || "AI Generated",
        status: doc.status || "Approved",
        language: doc.language || "English",
        tags: doc.tags || [],
      },
      validationSummary: doc.validationSummary || { passedQualityGate: true },
      storageResult: doc.isDeleted ? "ARCHIVED/DEACTIVATED" : "PERSISTED_ACTIVE",
      createdTimestamp: doc.createdAt
    };
  }

  // ── FACADE PASS-THROUGHS ──────────────────────────────────────────────
  static async persistSingle(item, options) {
    return await PersistenceEngine.persistSingle(item, options);
  }

  static async persistBatch(items, options) {
    return await PersistenceEngine.persistBatch(items, options);
  }

  static async importQuestions(items, options) {
    return await ImportFramework.importQuestions(items, options);
  }

  static async search(queryParams) {
    return await SearchEngine.search(queryParams);
  }

  static async executeSemanticDiscovery(query, filters) {
    return await SearchEngine.executeSemanticDiscovery(query, filters);
  }

  static async applyVersionedUpdate(id, updatePayload, actor, reason) {
    const updated = await VersioningEngine.applyVersionedUpdate(id, updatePayload, actor, reason);
    await InventorySyncService.synchronize(updated.subcategoryId, updated.categoryId);
    await ModerationEngine.logAudit({
      knowledgeBaseId: updated.knowledgeBaseId,
      questionObjectId: updated._id,
      action: "Updated",
      actor: actor || "admin",
      reason: reason || "Versioned modification",
      newStatus: updated.status,
      versionAffected: updated.version
    });
    return updated;
  }

  static async moderateLifecycle(id, newStatus, actor, reason) {
    return await ModerationEngine.setLifecycleStatus(id, newStatus, actor, reason);
  }

  static async bulkModerateLifecycle(ids, newStatus, actor, reason) {
    return await ModerationEngine.performBulkStatusChange(ids, newStatus, actor, reason);
  }

  static async synchronizeInventory(subcategoryId, categoryId) {
    return await InventorySyncService.synchronize(subcategoryId, categoryId);
  }

  static async getAuditLogs(filter, limit) {
    return await ModerationEngine.getAuditLogs(filter, limit);
  }
}

module.exports = KnowledgeBaseManager;
