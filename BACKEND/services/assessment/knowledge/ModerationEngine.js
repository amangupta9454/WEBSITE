const mongoose = require("mongoose");
const AssessmentKnowledgeAudit = require("../../../models/assessment/AssessmentKnowledgeAudit");
const InventorySyncService = require("./InventorySyncService");

/**
 * ModerationEngine.js — Component 12: Moderation, Component 15: Audit Trail & Component 17: Security
 * Governs administrative state transitions (Approve, Archive, Disable, Deprecate, Restore, Bulk Status Change).
 * Enforces zero hard deletion from the database and records immutable audit log entries for every operation.
 * Integrates input security checks preventing malformed payloads or duplicated fingerprint ingestion.
 */
class ModerationEngine {
  /**
   * Records an immutable audit trail entry (Component 15).
   */
  static async logAudit({ knowledgeBaseId, questionObjectId, action, actor = "admin", reason = "Governance operation", previousStatus = null, newStatus = null, versionAffected = 1, metadataSnapshot = {} }) {
    try {
      return await AssessmentKnowledgeAudit.create({
        knowledgeBaseId: knowledgeBaseId || "KB-UNKNOWN",
        questionObjectId: questionObjectId || null,
        action,
        actor,
        reason,
        previousStatus,
        newStatus,
        versionAffected,
        metadataSnapshot
      });
    } catch (err) {
      console.error("[ModerationEngine] Audit logging failure:", err.message);
      return null;
    }
  }

  /**
   * Modifies the lifecycle state of a single question item without hard deleting from storage (Component 7 & 12).
   * @param {string} questionId - Mongoose _id or Knowledge Base ID
   * @param {string} newStatus - "Approved" | "Archived" | "Disabled" | "Deprecated" | "Draft" | "Restored"
   * @param {string} actor
   * @param {string} reason
   */
  static async setLifecycleStatus(questionId, newStatus, actor = "admin", reason = "Admin state override") {
    const Question = mongoose.model("AssessmentQuestion");
    const query = mongoose.Types.ObjectId.isValid(questionId) ? { _id: questionId } : { knowledgeBaseId: questionId };
    
    const doc = await Question.findOne(query);
    if (!doc) {
      throw new Error(`Target question item (${questionId}) not found in Knowledge Base.`);
    }

    const previousStatus = doc.status;
    let targetStatus = newStatus;
    let isDeleted = doc.isDeleted;
    let actionType = "Status Changed";

    if (newStatus === "Archived" || newStatus === "Disabled" || newStatus === "Deprecated") {
      actionType = newStatus;
      targetStatus = newStatus;
      // Note: Soft delete flag can be toggled if archived/deprecated to remove from active pools
    } else if (newStatus === "Restored" || newStatus === "Approved") {
      actionType = newStatus === "Restored" ? "Restored" : "Status Changed";
      targetStatus = "Approved";
      isDeleted = false;
    }

    doc.status = targetStatus;
    doc.isDeleted = isDeleted;
    await doc.save();

    // Trigger synchronous inventory update
    await InventorySyncService.synchronize(doc.subcategoryId, doc.categoryId);

    // Record immutable audit entry
    await this.logAudit({
      knowledgeBaseId: doc.knowledgeBaseId,
      questionObjectId: doc._id,
      action: actionType,
      actor,
      reason,
      previousStatus,
      newStatus: targetStatus,
      versionAffected: doc.version,
      metadataSnapshot: { qualityScore: doc.qualityScore, bloomLevel: doc.bloomLevel, difficulty: doc.difficulty }
    });

    return doc;
  }

  /**
   * Executes bulk state mutations across multiple questions simultaneously (Component 12 & 16).
   * @param {Array<string>} ids - Array of _ids or Knowledge Base IDs
   * @param {string} newStatus
   * @param {string} actor
   * @param {string} reason
   */
  static async performBulkStatusChange(ids, newStatus, actor = "admin", reason = "Batch lifecycle transition") {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("Bulk operation requires a valid array of target question IDs.");
    }

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      updatedItems: []
    };

    for (const id of ids) {
      results.processed++;
      try {
        const updated = await this.setLifecycleStatus(id, newStatus, actor, reason);
        results.succeeded++;
        results.updatedItems.push({ id, status: updated.status, knowledgeBaseId: updated.knowledgeBaseId });
      } catch (err) {
        results.failed++;
        results.errors.push({ id, message: err.message });
      }
    }

    return results;
  }

  /**
   * Retrieves recent audit logs from the immutable repository.
   */
  static async getAuditLogs(filter = {}, limit = 100) {
    return await AssessmentKnowledgeAudit.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();
  }

  /**
   * Security Guardrail: Verifies payload purity and fingerprint uniqueness prior to ingestion (Component 17).
   */
  static async validateSecurityGate(questionPayload) {
    const Question = mongoose.model("AssessmentQuestion");

    if (!questionPayload || typeof questionPayload !== "object") {
      throw new Error("[SecurityError] Malformed payload: question data must be an object.");
    }

    if (!questionPayload.text && !questionPayload.question && !questionPayload.problemStatement) {
      throw new Error("[SecurityError] Rejected empty question content or stem.");
    }

    // Check against duplicated SHA-256 fingerprint in the permanent DB repository
    if (questionPayload.fingerprint) {
      const collision = await Question.findOne({ fingerprint: questionPayload.fingerprint, isDeleted: false }).select("knowledgeBaseId text");
      if (collision) {
        throw new Error(`[SecurityError] Duplicate Persistence Rejected: Question fingerprint collides with existing repository item ${collision.knowledgeBaseId}.`);
      }
    }

    return true;
  }
}

module.exports = ModerationEngine;
