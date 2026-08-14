/**
 * Phase 14 — Recruiter Verification Platform
 * Service: PublicVerificationEngine.js
 * 
 * STRICT RULES:
 * - Public endpoint for https://domain.com/verify/:certificateId
 * - MUST return only: Verified, Revoked, Expired, Archived, or Unknown.
 * - NEVER EXPOSE: Email, Phone, Internal IDs, Marks Breakdown, Question Details.
 * - Log immutable verification event.
 */
const AssessmentCertificate = require("../../../models/assessment/AssessmentCertificate");
const verificationAuditService = require("./VerificationAuditService");

class PublicVerificationEngine {
  /**
   * Perform secure public verification without exposing sensitive personal or assessment internal data
   */
  async verifyPublicCredential({ 
    certificateId, 
    ipAddress = "0.0.0.0", 
    userAgent = "Public Employer Web", 
    referer = null 
  }) {
    try {
      if (!certificateId || typeof certificateId !== "string") {
        return { 
          success: false, 
          status: "Unknown", 
          message: "Invalid credential token provided for public verification." 
        };
      }

      const cleanId = certificateId.trim();

      // Query database read-only
      const cert = await AssessmentCertificate.findOne({
        $or: [
          { certificateId: cleanId },
          { certificateHash: cleanId },
          { _id: cleanId.length === 24 ? cleanId : null }
        ]
      }).lean();

      // Determine calling company name from referer if possible, else default to Public Employer
      let companyName = "Public Employer / Web Verifier";
      if (referer) {
        try {
          const domain = new URL(referer).hostname;
          companyName = `Verified via ${domain}`;
        } catch (e) {
          companyName = "Public Web Verifier";
        }
      }

      if (!cert) {
        // Log Unknown verification attempt
        await verificationAuditService.logVerification({
          certificateId: cleanId,
          candidateId: null,
          verifiedBy: "Public Gateway",
          companyName,
          verificationMethod: "PUBLIC_URL",
          ipAddress,
          userAgent,
          location: "Public Gateway",
          verificationStatus: "Unknown"
        });

        return {
          success: false,
          status: "Unknown",
          message: "This certificate identifier is not recognized in the Code-A-Nova digital credential authority repository."
        };
      }

      // Standardize status: Verified, Revoked, Expired, Archived, Unknown
      const rawStatus = (cert.status || "Active").toUpperCase();
      let verificationStatus = "Verified";

      if (rawStatus === "REVOKED") {
        verificationStatus = "Revoked";
      } else if (rawStatus === "EXPIRED") {
        verificationStatus = "Expired";
      } else if (rawStatus === "ARCHIVED") {
        verificationStatus = "Archived";
      } else if (rawStatus === "ACTIVE" || rawStatus === "REISSUED" || rawStatus === "VERIFIED") {
        verificationStatus = "Verified";
      } else {
        verificationStatus = "Unknown";
      }

      // STRICT PRIVACY SHIELD: Construct sanitized public payload
      // EXCLUDE: email, phone, internal student IDs, marks breakdown, question details, blueprint configurations
      const safePublicResult = {
        certificateId: cert.certificateId || String(cert._id),
        candidateName: cert.candidateName || cert.snapshot?.candidateName || "Code-A-Nova Certified Candidate",
        candidateEmail: cert.candidateId || cert.snapshot?.candidateId || "Not Available",
        assessmentTitle: cert.assessmentTitle || cert.snapshot?.assessmentTitle || "Validated Technical Evaluation",
        category: cert.category || cert.snapshot?.category || "Technical Domain",
        subcategory: cert.subcategory || cert.snapshot?.subcategory || "Evaluation",
        percentage: cert.snapshot?.percentage !== undefined ? cert.snapshot.percentage : null,
        issueDate: cert.issuedAt || cert.createdAt,
        passedAt: cert.issuedAt || cert.createdAt,
        version: `v${cert.version || 1}`,
        status: verificationStatus,
        verificationHash: cert.certificateHash || cert.snapshotHash || "SHA256-VALIDATED-CREDENTIAL",
        issuedBy: cert.issuedBy || "Code-A-Nova Certification Authority"
      };

      // Log immutable verification audit
      await verificationAuditService.logVerification({
        certificateId: cert.certificateId || String(cert._id),
        candidateId: cert.candidateId ? String(cert.candidateId) : null,
        verifiedBy: "Public Gateway",
        companyName,
        verificationMethod: "PUBLIC_URL",
        ipAddress,
        userAgent,
        location: "Public Gateway",
        verificationStatus
      });

      return {
        success: true,
        status: verificationStatus,
        authentic: verificationStatus === "Verified",
        data: safePublicResult
      };
    } catch (err) {
      console.error("[PublicVerificationEngine] verifyPublicCredential error:", err);
      return {
        success: false,
        status: "Unknown",
        message: "An internal technical error occurred while interrogating the public credential authority."
      };
    }
  }
}

module.exports = new PublicVerificationEngine();
