const mongoose = require("mongoose");

/**
 * AssessmentQuestionRevision.js — Component 4: Question Versioning
 * Stores complete revision history whenever an assessment item is modified in the Question Knowledge Base.
 * Enforces zero overwriting of historical knowledge: modifications create Version 1 -> Version 2 -> Version 3.
 * Includes restore architecture placeholders without executing immediate fallback rollbacks.
 */
const assessmentQuestionRevisionSchema = new mongoose.Schema(
  {
    knowledgeBaseId: {
      type: String,
      required: true,
      index: true,
      // Canonical Knowledge ID (e.g. KB-Q-20260801-123456)
    },
    questionObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentQuestion",
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    changeDescription: {
      type: String,
      required: true,
      default: "Initial knowledge base persistence or version update",
    },
    modifiedBy: {
      type: String,
      required: true,
      default: "admin_knowledge_manager",
    },
    snapshotData: {
      type: Object,
      required: true,
      // Complete immutable payload of the question stem, options, explanations, and metadata at this version boundary
    },
    restorable: {
      type: Boolean,
      default: true,
      // Architecture ready for one-click future rollback restoration
    },
    createdTimestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for rapid revision history retrieval and chronological sequencing
assessmentQuestionRevisionSchema.index({ knowledgeBaseId: 1, versionNumber: -1 });
assessmentQuestionRevisionSchema.index({ questionObjectId: 1, versionNumber: -1 });

module.exports = mongoose.model("AssessmentQuestionRevision", assessmentQuestionRevisionSchema);
