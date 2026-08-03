/**
 * Phase 14 — Recruiter Verification Platform
 * Service: VerificationAuditService.js
 * 
 * STRICT RULES:
 * - Every verification must create an immutable audit log.
 * - Never modify history or delete audit records.
 * - Read only queries for history retrieval with pagination.
 */
const AssessmentVerificationAudit = require("../../../models/assessment/AssessmentVerificationAudit");
const crypto = require("crypto");

class VerificationAuditService {
  /**
   * Log an immutable verification event
   */
  async logVerification({
    certificateId,
    candidateId = null,
    verifiedBy = "Public Employer / Recruiter",
    companyName = "External Verifier",
    verificationMethod = "CERTIFICATE_ID",
    ipAddress = "0.0.0.0",
    userAgent = "Unknown Client",
    location = "Global / Web",
    verificationStatus = "Unknown"
  }) {
    try {
      const verificationId = `VRF-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      
      const auditLog = await AssessmentVerificationAudit.create({
        verificationId,
        certificateId: String(certificateId).trim(),
        candidateId: candidateId ? String(candidateId).trim() : null,
        verifiedBy,
        companyName,
        verificationMethod,
        ipAddress,
        userAgent,
        location,
        verificationStatus,
        timestamp: new Date()
      });

      return { success: true, auditLog };
    } catch (err) {
      console.error("[VerificationAuditService] Error logging verification:", err.message);
      // Fail open: never break candidate verification if audit database hits an issue
      return { success: false, error: err.message };
    }
  }

  /**
   * Retrieve verification history with pagination & filtering
   */
  async getVerificationHistory({ page = 1, limit = 20, status = null, method = null, search = null }) {
    try {
      const query = {};
      
      if (status && status !== "ALL") {
        query.verificationStatus = status;
      }
      if (method && method !== "ALL") {
        query.verificationMethod = method;
      }
      if (search) {
        query.$or = [
          { certificateId: { $regex: search, $options: "i" } },
          { verifiedBy: { $regex: search, $options: "i" } },
          { companyName: { $regex: search, $options: "i" } },
          { verificationId: { $regex: search, $options: "i" } }
        ];
      }

      const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
      
      const total = await AssessmentVerificationAudit.countDocuments(query);
      const logs = await AssessmentVerificationAudit.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      return {
        success: true,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)) || 1,
        logs
      };
    } catch (err) {
      console.error("[VerificationAuditService] getVerificationHistory error:", err);
      return { success: false, error: "Failed to retrieve verification history", logs: [] };
    }
  }
}

module.exports = new VerificationAuditService();
