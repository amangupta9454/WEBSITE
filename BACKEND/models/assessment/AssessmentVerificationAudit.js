/**
 * Phase 14 — Recruiter Verification Platform
 * Immutable Audit Repository: AssessmentVerificationAudit.js
 * 
 * STRICT RULES:
 * - This repository ONLY stores verification audit telemetry.
 * - Records are IMMUTABLE. Never modify historical verification logs or existing certificates.
 * - Indexed for fast employer analytics and security tracking.
 */
const mongoose = require("mongoose");

const assessmentVerificationAuditSchema = new mongoose.Schema(
  {
    verificationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    certificateId: {
      type: String,
      required: true,
      index: true
    },
    candidateId: {
      type: String,
      default: null,
      index: true
    },
    verifiedBy: {
      type: String,
      default: "Public Employer / Recruiter"
    },
    companyName: {
      type: String,
      default: "External Verifier"
    },
    verificationMethod: {
      type: String,
      enum: ["CERTIFICATE_ID", "QR_CODE", "PUBLIC_URL", "CANDIDATE_SEARCH"],
      default: "CERTIFICATE_ID",
      index: true
    },
    ipAddress: {
      type: String,
      default: "0.0.0.0"
    },
    userAgent: {
      type: String,
      default: "Unknown Client"
    },
    location: {
      type: String,
      default: "Global / Web"
    },
    verificationStatus: {
      type: String,
      enum: ["Verified", "Revoked", "Expired", "Archived", "Unknown", "Failed"],
      default: "Unknown",
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// High performance indexes for recruiter aggregations
assessmentVerificationAuditSchema.index({ timestamp: -1 });
assessmentVerificationAuditSchema.index({ certificateId: 1, verificationStatus: 1 });
assessmentVerificationAuditSchema.index({ companyName: 1, timestamp: -1 });

module.exports = mongoose.model("AssessmentVerificationAudit", assessmentVerificationAuditSchema);
