const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * AssessmentKnowledgeAudit.js — Component 15: Audit Trail
 * Implements an immutable, tamper-resistant audit registry tracking every lifecycle mutation,
 * creation, version bump, archive, disable, restore, and import event within the Question Knowledge Base.
 */
const assessmentKnowledgeAuditSchema = new mongoose.Schema(
  {
    auditId: {
      type: String,
      unique: true,
      index: true,
      default: () => `AUDIT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    },
    knowledgeBaseId: {
      type: String,
      required: true,
      index: true,
      // Target item Knowledge ID (KB-Q-...)
    },
    questionObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentQuestion",
      default: null,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "Created",
        "Updated",
        "Archived",
        "Disabled",
        "Restored",
        "Imported",
        "Version Created",
        "Status Changed",
        "Deprecated",
      ],
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      default: null,
    },
    newStatus: {
      type: String,
      default: null,
    },
    versionAffected: {
      type: Number,
      default: 1,
    },
    actor: {
      type: String,
      required: true,
      default: "system_intelligence_gate",
    },
    reason: {
      type: String,
      default: "Standard knowledge management operation",
    },
    metadataSnapshot: {
      type: Object,
      default: {},
      // Contains summary telemetry (qualityScore, bloomLevel, source, fingerprint)
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { 
    timestamps: false,
    versionKey: false,
  }
);

// Prevent modifications or deletions of audit records after creation to preserve tamper resistance
assessmentKnowledgeAuditSchema.pre("findOneAndUpdate", function (next) {
  next(new Error("[KnowledgeAudit] Immutable audit records cannot be modified or tampered with after creation."));
});
assessmentKnowledgeAuditSchema.pre("findOneAndDelete", function (next) {
  next(new Error("[KnowledgeAudit] Immutable audit records cannot be deleted."));
});

// Indexes for analytical slicing by knowledge item, chronological trail, or action type
assessmentKnowledgeAuditSchema.index({ knowledgeBaseId: 1, timestamp: -1 });
assessmentKnowledgeAuditSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model("AssessmentKnowledgeAudit", assessmentKnowledgeAuditSchema);
