const mongoose = require("mongoose");
const AssessmentQuestionRevision = require("../../../models/assessment/AssessmentQuestionRevision");

/**
 * VersioningEngine.js — Component 4: Question Versioning
 * Enforces zero historical data destruction by ensuring every modification to an assessment question
 * bumps its version number (Version 1 -> Version 2 -> Version 3) and creates an immutable snapshot record.
 * Integrates architectural hooks for future version restore and state inspection.
 */
class VersioningEngine {
  /**
   * Records an initial snapshot when a newly approved question enters the repository (Version 1).
   * @param {Object} questionDoc - The persisted Mongoose question document
   * @param {string} actor - Identity performing the operation
   * @param {string} reason - Justification note
   */
  static async captureInitialRevision(questionDoc, actor = "system_quality_gate", reason = "Initial Quality Gate Approved Persistence") {
    try {
      const snapshot = questionDoc.toObject ? questionDoc.toObject() : { ...questionDoc };
      const revision = await AssessmentQuestionRevision.create({
        knowledgeBaseId: questionDoc.knowledgeBaseId || `KB-Q-${Date.now()}`,
        questionObjectId: questionDoc._id,
        versionNumber: questionDoc.version || 1,
        changeDescription: reason,
        modifiedBy: actor,
        snapshotData: snapshot,
        restorable: true,
      });
      return revision;
    } catch (err) {
      console.error("[VersioningEngine] Failed to capture initial revision:", err.message);
      return null;
    }
  }

  /**
   * Bumps the version number and records a snapshot prior to applying modifications to an existing question.
   * @param {string|ObjectId} questionId - Mongoose ID or Knowledge Base ID
   * @param {Object} updatePayload - Fields being modified
   * @param {string} actor - Identity modifying the question
   * @param {string} reason - Rationale for modification
   */
  static async applyVersionedUpdate(questionId, updatePayload, actor = "admin", reason = "Administrative question metadata refinement") {
    const Question = mongoose.model("AssessmentQuestion");
    const query = mongoose.Types.ObjectId.isValid(questionId) ? { _id: questionId } : { knowledgeBaseId: questionId };
    
    const existing = await Question.findOne(query);
    if (!existing) {
      throw new Error(`Knowledge base question not found for ID: ${questionId}`);
    }

    // Bump version number
    const nextVersion = (existing.version || 1) + 1;
    updatePayload.version = nextVersion;

    // Apply update
    const updated = await Question.findOneAndUpdate(
      query,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    // Record complete snapshot of the updated state
    const snapshot = updated.toObject ? updated.toObject() : { ...updated };
    await AssessmentQuestionRevision.create({
      knowledgeBaseId: updated.knowledgeBaseId,
      questionObjectId: updated._id,
      versionNumber: nextVersion,
      changeDescription: reason,
      modifiedBy: actor,
      snapshotData: snapshot,
      restorable: true,
    });

    return updated;
  }

  /**
   * Retrieves full revision history for a target question by Knowledge Base ID or MongoDB ID.
   * @param {string} id
   */
  static async getRevisionHistory(id) {
    const query = mongoose.Types.ObjectId.isValid(id) 
      ? { questionObjectId: id } 
      : { knowledgeBaseId: id };
    
    return await AssessmentQuestionRevision.find(query)
      .sort({ versionNumber: -1 })
      .lean();
  }

  /**
   * Restore Architecture Placeholder (Component 4)
   * Validates state readiness and constructs restore execution plan without forcing immediate rollback execution.
   */
  static async inspectRestoreReadiness(knowledgeBaseId, targetVersion) {
    const revision = await AssessmentQuestionRevision.findOne({ knowledgeBaseId, versionNumber: Number(targetVersion) });
    if (!revision) {
      return { restorable: false, reason: `Target revision version ${targetVersion} not found in historical vaults.` };
    }
    return {
      restorable: revision.restorable,
      targetVersion: revision.versionNumber,
      capturedTimestamp: revision.createdTimestamp,
      restorePayload: revision.snapshotData,
      notice: "Restore Architecture Ready (No rollback implementation yet per Phase 7 criteria)."
    };
  }
}

module.exports = VersioningEngine;
