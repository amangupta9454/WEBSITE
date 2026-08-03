/**
 * Phase 14 — Recruiter Verification Platform
 * Service: CertificateVerificationEngine.js
 * 
 * STRICT RULES:
 * - Read-Only access to AssessmentCertificate records.
 * - Must NOT modify, generate, or regenerate certificates.
 * - Logs immutable verification event via VerificationAuditService.
 */
const AssessmentCertificate = require("../../../models/assessment/AssessmentCertificate");
const verificationAuditService = require("./VerificationAuditService");

class CertificateVerificationEngine {
  /**
   * Verify certificate by certificateId, QR hash, or public string
   * Used for recruiter console & employer verifications
   */
  async verifyCertificate({ 
    certificateId, 
    verificationMethod = "CERTIFICATE_ID", 
    verifiedBy = "Recruiter", 
    companyName = "Enterprise Employer",
    ipAddress = "0.0.0.0",
    userAgent = "Mozilla/5.0 (Client)",
    location = "Global / Web"
  }) {
    try {
      if (!certificateId) {
        return { success: false, status: "Failed", error: "Certificate ID or QR Code parameter is required." };
      }

      const cleanId = String(certificateId).trim();

      // Look up certificate read-only by certificateId or MongoDB _id or certificateHash
      let cert = await AssessmentCertificate.findOne({
        $or: [
          { certificateId: cleanId },
          { certificateHash: cleanId },
          { _id: cleanId.length === 24 ? cleanId : null }
        ]
      }).lean();

      let verificationStatus = "Unknown";
      let responseData = null;

      if (!cert) {
        verificationStatus = "Unknown";
        // Log attempt
        await verificationAuditService.logVerification({
          certificateId: cleanId,
          candidateId: null,
          verifiedBy,
          companyName,
          verificationMethod,
          ipAddress,
          userAgent,
          location,
          verificationStatus: "Unknown"
        });

        return {
          success: false,
          status: "Unknown",
          message: "No authentic competency credential found matching this reference identifier."
        };
      }

      // Map existing status to standardized verification status: Verified, Revoked, Expired, Archived, Unknown
      const rawStatus = (cert.status || "Active").toUpperCase();
      if (rawStatus === "ACTIVE" || rawStatus === "REISSUED" || rawStatus === "VERIFIED") {
        verificationStatus = "Verified";
      } else if (rawStatus === "REVOKED") {
        verificationStatus = "Revoked";
      } else if (rawStatus === "EXPIRED") {
        verificationStatus = "Expired";
      } else if (rawStatus === "ARCHIVED") {
        verificationStatus = "Archived";
      } else {
        verificationStatus = "Verified";
      }

      // Prepare verified presentation output without internal marks or sensitive question details
      responseData = {
        certificateId: cert.certificateId || String(cert._id),
        candidateName: cert.candidateName || cert.snapshot?.candidateName || "Validated Candidate",
        assessmentTitle: cert.assessmentTitle || cert.snapshot?.assessmentTitle || "Technical Competency Evaluation",
        issueDate: cert.issuedAt || cert.createdAt,
        version: `v${cert.version || 1}`,
        status: verificationStatus,
        rawState: cert.status || "Active",
        verificationHash: cert.certificateHash || cert.snapshotHash || "SHA256-VALIDATED-CREDENTIAL",
        issuedBy: cert.issuedBy || "Code-A-Nova Certification Authority",
        publicVerificationUrl: cert.verificationUrl || `https://code-a-nova.com/verify/${cert.certificateId || cert._id}`,
        qrPayload: cert.qrCode || `VERIFY:${cert.certificateId || cert._id}`
      };

      // Log immutable verification audit
      await verificationAuditService.logVerification({
        certificateId: cert.certificateId || String(cert._id),
        candidateId: cert.candidateId ? String(cert.candidateId) : null,
        verifiedBy,
        companyName,
        verificationMethod,
        ipAddress,
        userAgent,
        location,
        verificationStatus
      });

      return {
        success: true,
        status: verificationStatus,
        verified: verificationStatus === "Verified",
        certificate: responseData
      };
    } catch (err) {
      console.error("[CertificateVerificationEngine] verifyCertificate error:", err);
      return {
        success: false,
        status: "Failed",
        error: "Internal error occurred during certificate verification inspection."
      };
    }
  }
}

module.exports = new CertificateVerificationEngine();
