const AssessmentCertificate = require("../../../models/assessment/AssessmentCertificate");

/**
 * Phase 11 — Component 4: Certificate Versioning & Component 10: Revocation Engine
 * Controls full administrative lifecycle governance: Revoke, Restore, and Versioned Reissue.
 * Strictly guarantees ZERO hard deletes; revoked credentials remain publicly verifiable as 'Revoked'
 * with explicit audit logging and reason preservation.
 */
class RevocationEngine {
  /**
   * Revokes an active digital certificate.
   * @param {String} certificateId - Unique ID e.g., CAN-2026-ASMT-000001
   * @param {String} reason - Detailed administrative justification for revocation
   * @param {String} adminUser - Admin identity performing the action
   */
  async revokeCertificate(certificateId, reason = "Administrative compliance audit review", adminUser = "ADMINISTRATOR") {
    const cert = await AssessmentCertificate.findOne({ certificateId });
    if (!cert) {
      throw new Error(`REVOCATION_ERROR: Certificate [${certificateId}] not found in credential repository.`);
    }
    if (cert.status === "Revoked") {
      throw new Error(`REVOCATION_ERROR: Certificate [${certificateId}] is already in Revoked state.`);
    }

    cert.status = "Revoked";
    cert.isCurrentActive = false;
    cert.revocation = cert.revocation || {};
    cert.revocation.isRevoked = true;
    cert.revocation.reason = reason;
    cert.revocation.revokedAt = new Date();
    cert.revocation.revokedBy = adminUser;
    cert.revocation.history.push({
      action: "REVOKED",
      reason,
      performedBy: adminUser,
      timestamp: new Date()
    });

    // Component 17: Audit Trail
    cert.auditTrail.push({
      action: "Revoked",
      performedBy: adminUser,
      details: `Revocation executed. Reason: ${reason}`,
      timestamp: new Date()
    });

    await cert.save();
    return cert;
  }

  /**
   * Restores a previously revoked certificate to active issued state.
   * @param {String} certificateId - Unique certificate ID
   * @param {String} reason - Justification for clearance and restoration
   * @param {String} adminUser - Admin identity
   */
  async restoreCertificate(certificateId, reason = "Appeal cleared & compliance verified", adminUser = "ADMINISTRATOR") {
    const cert = await AssessmentCertificate.findOne({ certificateId });
    if (!cert) {
      throw new Error(`RESTORE_ERROR: Certificate [${certificateId}] not found in repository.`);
    }
    if (cert.status !== "Revoked") {
      throw new Error(`RESTORE_ERROR: Certificate [${certificateId}] is not currently revoked (current status: ${cert.status}).`);
    }

    cert.status = "Issued";
    cert.isCurrentActive = true;
    cert.revocation.isRevoked = false;
    cert.revocation.restoredAt = new Date();
    cert.revocation.restoredBy = adminUser;
    cert.revocation.history.push({
      action: "RESTORED",
      reason,
      performedBy: adminUser,
      timestamp: new Date()
    });

    // Component 17: Audit Trail
    cert.auditTrail.push({
      action: "Restored",
      performedBy: adminUser,
      details: `Credential restored to active status. Reason: ${reason}`,
      timestamp: new Date()
    });

    await cert.save();
    return cert;
  }

  /**
   * Reissues a certificate by archiving the old record and generating a new version (V1 -> V2).
   * Note: Actual synthesis of the new V2 doc is triggered by CredentialEngine; this method archives the predecessor.
   * @param {String} existingCertId - Predecessor certificate ID
   * @param {String} reason - Reissue reason e.g., candidate name correction or score update
   * @param {String} adminUser - Admin identity
   */
  async prepareVersionedReissue(existingCertId, reason = "Versioned upgrade / metadata correction", adminUser = "ADMINISTRATOR") {
    const oldCert = await AssessmentCertificate.findOne({ certificateId: existingCertId });
    if (!oldCert) {
      throw new Error(`REISSUE_ERROR: Base certificate [${existingCertId}] not found.`);
    }

    const newVersionNum = (oldCert.version || 1) + 1;

    // Transition old certificate to archived predecessor state without deleting or overwriting its data
    oldCert.status = "Reissued";
    oldCert.isCurrentActive = false;
    oldCert.revocation.history.push({
      action: "REISSUED",
      reason: `Superceded by Version V${newVersionNum}: ${reason}`,
      performedBy: adminUser,
      timestamp: new Date()
    });
    oldCert.auditTrail.push({
      action: "Reissued",
      performedBy: adminUser,
      details: `Superceded by new version V${newVersionNum}. Status transitioned to Reissued (Archived).`,
      timestamp: new Date()
    });
    await oldCert.save();

    return {
      previousCertificate: oldCert,
      nextVersion: newVersionNum,
      resultId: oldCert.resultId,
      sessionId: oldCert.sessionId
    };
  }
}

module.exports = new RevocationEngine();
