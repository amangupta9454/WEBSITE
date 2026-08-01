const AssessmentCertificate = require("../models/assessment/AssessmentCertificate");
const eligibilityEngine = require("./credential/EligibilityEngine");
const snapshotBuilder = require("./credential/CredentialSnapshotBuilder");
const idGenerator = require("./credential/CertificateIdGenerator");
const qrService = require("./credential/QRGeneratorService");
const pdfService = require("./credential/PDFGeneratorService");
const revocationEngine = require("./credential/RevocationEngine");

/**
 * Phase 11 — Master Facade: Credential & Certificate Engine
 * Converts immutable Phase 10 Result Objects into globally unique, verifiable digital credentials.
 * Enforces strict eligibility rules, versioning, tamper-proof hashes, and audit logs.
 * STRICTLY AVOIDS sending emails, generating student dashboards, or calculating leaderboards (Phase 12+).
 */
class CredentialEngine {
  /**
   * Generates a verifiable digital certificate for a qualifying Phase 10 Result Object.
   * @param {String} resultOrSessionId - Phase 10 Result ID or Session ID
   * @param {Object} options - { candidateName, templateName, isReissue, nextVersion, performedBy }
   */
  async generateCertificate(resultOrSessionId, options = {}) {
    const performedBy = options.performedBy || "SYSTEM_ORCHESTRATOR";

    // Component 1: Eligibility check
    const eligibility = await eligibilityEngine.checkEligibility(resultOrSessionId, { isReissue: options.isReissue });
    if (!eligibility.eligible) {
      const err = new Error(eligibility.reason);
      err.code = "INELIGIBLE_FOR_CERTIFICATE";
      err.existingCertificate = eligibility.existingCertificate;
      throw err;
    }

    const resultObject = eligibility.resultObject;

    // Component 3: Generate Globally Unique Readable ID
    const certificateId = await idGenerator.generateUniqueId("ASMT");

    // Component 2 & 8: Build Immutable Credential Snapshot and Cryptographic Verification Hashes
    const { snapshot, hashes } = snapshotBuilder.buildSnapshotAndHashes(resultObject, {
      candidateName: options.candidateName,
      assessmentName: options.assessmentName,
      category: options.category,
      subcategory: options.subcategory
    });

    // Component 7: Synthesize QR Verification Assets (Zero Sensitive Metadata)
    const qrData = qrService.generateQRAssets(certificateId, hashes.certificateHash);

    const versionNum = options.nextVersion || 1;

    // Instantiate credential repository document
    const newCert = new AssessmentCertificate({
      certificateId,
      resultId: resultObject.resultId || "RES-UNMAPPED",
      sessionId: resultObject.sessionId || "SESS-UNMAPPED",
      candidateId: resultObject.candidateId || snapshot.candidateId,
      candidateName: snapshot.candidateName,
      assessmentName: snapshot.assessmentName,
      category: snapshot.category,
      subcategory: snapshot.subcategory,
      version: versionNum,
      isCurrentActive: true,
      status: "Issued",
      snapshot,
      qrData,
      hashes,
      auditTrail: [
        {
          action: options.isReissue ? "Version Created" : "Generated",
          performedBy,
          details: `Digital credential synthesized (V${versionNum}) against Phase 10 Result [${resultObject.resultId}]. SHA-256 Seal: ${hashes.certificateHash.slice(0, 16)}...`,
          timestamp: new Date()
        }
      ],
      handoffToPhase12Status: "QUEUED"
    });

    // Component 6: Generate Enterprise PDF representation
    const pdfPayload = await pdfService.generatePDF(newCert, options.templateName || "CAN-ENTERPRISE-v1");
    newCert.pdfAsset = {
      templateVersion: pdfPayload.templateVersion,
      fileLocation: pdfPayload.fileLocation,
      contentLength: pdfPayload.contentLength,
      generatedAt: new Date()
    };

    await newCert.save();

    return {
      success: true,
      certificateId: newCert.certificateId,
      version: newCert.version,
      status: newCert.status,
      verificationUrl: qrData.verificationUrl,
      pdfLocation: newCert.pdfAsset.fileLocation,
      htmlPreview: pdfPayload.htmlContent,
      hashes: newCert.hashes,
      message: "Certificate generated successfully. Queued for Phase 12 handoff."
    };
  }

  /**
   * Reissues an existing certificate (V1 -> V2 -> V3) while preserving the archived original.
   */
  async reissueCertificate(oldCertificateId, reason = "Metadata update / corrective reissue", adminUser = "ADMINISTRATOR", options = {}) {
    // 1. Archive predecessor version via Revocation Engine (Component 4)
    const prepareData = await revocationEngine.prepareVersionedReissue(oldCertificateId, reason, adminUser);

    // 2. Synthesize superceding V(n+1) credential
    const generateOpts = {
      ...options,
      isReissue: true,
      nextVersion: prepareData.nextVersion,
      performedBy: adminUser
    };

    const reissuedResult = await this.generateCertificate(prepareData.resultId, generateOpts);

    return {
      success: true,
      previousCertificateId: oldCertificateId,
      newCertificateId: reissuedResult.certificateId,
      newVersion: reissuedResult.version,
      message: `Successfully superceded V${prepareData.nextVersion - 1} (${oldCertificateId}) with new Version V${reissuedResult.version} (${reissuedResult.certificateId}).`
    };
  }

  /**
   * Component 14: Secure PDF Download Stream
   * Validates cryptographic snapshot integrity before permitting retrieval.
   */
  async getSecurePDFPayload(certificateId, requesterId = "ANONYMOUS_VERIFY", templateOverride = null) {
    const cert = await AssessmentCertificate.findOne({ certificateId });
    if (!cert) {
      throw new Error(`CERTIFICATE_NOT_FOUND: Record [${certificateId}] does not exist in repository.`);
    }

    // Security check: Verify snapshot integrity against tamper before delivery
    const isValid = snapshotBuilder.verifySnapshotIntegrity(cert.snapshot, cert.hashes.snapshotHash);
    if (!isValid) {
      throw new Error("SECURITY ALERT: Cryptographic snapshot integrity verification failed. Potential tampering detected during retrieval.");
    }

    const pdfData = await pdfService.generatePDF(cert, templateOverride || cert.pdfAsset?.templateVersion || "CAN-ENTERPRISE-v1");

    // Component 17: Log download audit event
    cert.auditTrail.push({
      action: "Downloaded",
      performedBy: requesterId,
      details: `High-fidelity document exported by [${requesterId}]. Integrity hash confirmed.`,
      timestamp: new Date()
    });
    await cert.save();

    return {
      certificateId: cert.certificateId,
      candidateName: cert.candidateName,
      assessmentName: cert.assessmentName,
      htmlContent: pdfData.htmlContent,
      fileLocation: pdfData.fileLocation,
      status: cert.status,
      isRevoked: cert.status === "Revoked"
    };
  }

  /**
   * Component 11: Read-Only Public Verification Engine
   * Validates credentials without exposing sensitive internal score deductions, algorithms, or emails.
   */
  async publicVerify(certificateIdOrUrl) {
    // Extract ID if a full QR verification URL was submitted
    let targetId = certificateIdOrUrl;
    if (certificateIdOrUrl && certificateIdOrUrl.includes("/verify/")) {
      targetId = certificateIdOrUrl.split("/verify/").pop().trim();
    }

    const cert = await AssessmentCertificate.findOne({ certificateId: targetId }).lean();
    if (!cert) {
      return {
        verificationStatus: "Invalid",
        isValid: false,
        message: "Digital certificate ID not found in authorized Code-A-Nova registry."
      };
    }

    // Check Revoked state (Revoked certificates remain verifiable as Revoked per Component 10/11 rules)
    if (cert.status === "Revoked") {
      return {
        verificationStatus: "Revoked",
        isValid: false,
        certificateId: cert.certificateId,
        candidateName: cert.candidateName,
        assessmentName: cert.assessmentName,
        category: cert.category,
        subcategory: cert.subcategory,
        version: `V${cert.version}`,
        issueDate: cert.snapshot?.issueTimestamp || cert.createdAt,
        revokedAt: cert.revocation?.revokedAt,
        message: "This digital credential has been officially revoked by Code-A-Nova compliance governance."
      };
    }

    if (cert.status === "Expired") {
      return {
        verificationStatus: "Expired",
        isValid: false,
        certificateId: cert.certificateId,
        message: "This digital credential has surpassed its valid authorization lifecycle."
      };
    }

    if (cert.status === "Reissued" || cert.status === "Archived") {
      return {
        verificationStatus: "Superceded (Old Version)",
        isValid: false,
        certificateId: cert.certificateId,
        version: `V${cert.version}`,
        message: `This certificate is an archived historical version (V${cert.version}) and has been superceded by a newer active version.`
      };
    }

    // Asynchronously append Verified audit event without slowing down public responses
    AssessmentCertificate.updateOne(
      { _id: cert._id },
      {
        $push: {
          auditTrail: {
            action: "Verified",
            performedBy: "PUBLIC_VERIFY_GATEWAY",
            details: "Public QR/ID status validation scan performed.",
            timestamp: new Date()
          }
        }
      }
    ).catch(() => {});

    // Return sanitized public credential information (Zero internal sensitive data)
    return {
      verificationStatus: "Valid",
      isValid: true,
      certificateId: cert.certificateId,
      candidateName: cert.candidateName,
      assessmentName: cert.assessmentName,
      category: cert.category,
      subcategory: cert.subcategory,
      issueDate: cert.snapshot?.issueTimestamp || cert.createdAt,
      version: `V${cert.version}`,
      digitalSealHash: cert.hashes?.certificateHash ? cert.hashes.certificateHash.slice(0, 24) + "..." : "VERIFIED-SEAL",
      qrCodeBase64: cert.qrData?.qrCodeBase64 || "",
      message: "Authoritative digital credential verified against immutable Code-A-Nova registry."
    };
  }

  /**
   * Component 15: High-Speed Bulk Certificate Generation
   */
  async bulkGenerateCertificates(identifiers = [], adminUser = "BULK_ADMIN") {
    const results = { total: identifiers.length, succeeded: 0, failed: 0, details: [] };
    for (const id of identifiers) {
      try {
        const res = await this.generateCertificate(id, { performedBy: adminUser });
        results.succeeded++;
        results.details.push({ id, status: "SUCCESS", certificateId: res.certificateId });
      } catch (err) {
        results.failed++;
        results.details.push({ id, status: "FAILED", error: err.message });
      }
    }
    return results;
  }
}

module.exports = new CredentialEngine();
