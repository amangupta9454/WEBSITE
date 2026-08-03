const mongoose = require("mongoose");

/**
 * Phase 11 — Credential & Certificate Engine (Component 5: Credential Repository)
 * Permanent repository for verifiable digital credentials converted from Phase 10 Result Objects.
 * Strictly guarantees traceability, versioning (V1 -> V2 -> V3), non-destructive archiving, and cryptographic verification.
 * Does NOT generate emails, leaderboard rankings, or student dashboard alerts (Phase 12+).
 */
const assessmentCertificateSchema = new mongoose.Schema(
  {
    // Component 3: Globally unique readable ID (e.g., CAN-2026-ASMT-000001)
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    // Reference to Phase 10 Result & Phase 9 Session
    resultId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    candidateId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    candidateName: {
      type: String,
      default: "Candidate"
    },
    assessmentName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    subcategory: {
      type: String,
      required: true,
      trim: true
    },
    // Component 4: Versioning support (V1 -> V2 -> V3)
    version: {
      type: Number,
      required: true,
      default: 1
    },
    isCurrentActive: {
      type: Boolean,
      default: true,
      index: true
    },
    // Component 9: Credential Status
    status: {
      type: String,
      enum: ["Draft", "Issued", "Revoked", "Reissued", "Expired", "Archived"],
      default: "Issued",
      index: true
    },
    // Component 2: Immutable Credential Snapshot
    snapshot: {
      candidateName: { type: String },
      candidateId: { type: String },
      assessmentName: { type: String },
      category: { type: String },
      subcategory: { type: String },
      assessmentType: { type: String, default: "MCQ / Hybrid Domain Competency" },
      score: { type: Number, required: true },
      percentage: { type: Number, required: true },
      passingPercentage: { type: Number, required: true },
      resultId: { type: String },
      resultHash: { type: String },
      evaluationHash: { type: String },
      blueprintVersion: { type: Number, default: 1 },
      configVersion: { type: Number, default: 1 },
      runtimeVersion: { type: String, default: "v1.0.0" },
      issueTimestamp: { type: Date, default: Date.now }
    },
    // Component 6: PDF Reference (Modular storage for generated certificates)
    pdfAsset: {
      templateVersion: { type: String, default: "CAN-ENTERPRISE-v1" },
      fileLocation: { type: String, default: "" }, // local URI, cloud storage URL, or internal cache path
      contentLength: { type: Number, default: 0 },
      generatedAt: { type: Date }
    },
    // Component 7: QR Verification Assets (No sensitive data)
    qrData: {
      certificateId: { type: String },
      verificationUrl: { type: String },
      verificationHash: { type: String },
      qrCodeBase64: { type: String } // SVG or Base64 URI representation for embeddable rendering
    },
    // Component 8: Verification Hash Suite
    hashes: {
      certificateHash: { type: String, required: true, index: true },
      snapshotHash: { type: String, required: true },
      resultHash: { type: String },
      evaluationHash: { type: String }
    },
    // Component 10: Revocation Engine state
    revocation: {
      isRevoked: { type: Boolean, default: false },
      reason: { type: String, default: null },
      revokedAt: { type: Date, default: null },
      revokedBy: { type: String, default: null },
      restoredAt: { type: Date, default: null },
      restoredBy: { type: String, default: null },
      history: [
        {
          action: { type: String, enum: ["REVOKED", "RESTORED", "REISSUED"] },
          reason: { type: String },
          performedBy: { type: String },
          timestamp: { type: Date, default: Date.now }
        }
      ]
    },
    // Component 17: Comprehensive Audit Trail
    auditTrail: [
      {
        action: {
          type: String,
          enum: [
            "Generated",
            "Downloaded",
            "Verified",
            "Revoked",
            "Restored",
            "Reissued",
            "Version Created"
          ],
          required: true
        },
        performedBy: { type: String, default: "SYSTEM" },
        details: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    // Handoff to Phase 12 (Student Dashboard)
    handoffToPhase12Status: {
      type: String,
      enum: ["QUEUED", "SYNCED", "FAILED"],
      default: "QUEUED"
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast administrative search and candidate retrieval (Component 15)
assessmentCertificateSchema.index({ candidateId: 1, status: 1 });
assessmentCertificateSchema.index({ assessmentName: 1, status: 1 });
assessmentCertificateSchema.index({ resultId: 1, version: 1 });

// Guard against destructive overwrites of issued active snapshots (Component 2 & 14)
assessmentCertificateSchema.pre("findOneAndUpdate", function(next) {
  const update = this.getUpdate() || {};
  if (update.$set && update.$set.snapshot) {
    return typeof next === "function" ? next(new Error("SECURITY VIOLATION: Credential Snapshot is strictly immutable once synthesized. Use versioned Reissue instead of overwrite.")) : null;
  }
  if (typeof next === "function") next();
});

module.exports = mongoose.models.AssessmentCertificate || mongoose.model("AssessmentCertificate", assessmentCertificateSchema);
