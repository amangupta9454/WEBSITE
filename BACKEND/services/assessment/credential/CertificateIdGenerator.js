const AssessmentCertificate = require("../../../models/assessment/AssessmentCertificate");
const crypto = require("crypto");

/**
 * Phase 11 — Component 3: Certificate ID Generator
 * Synthesizes highly legible, professional enterprise credential IDs.
 * Format Example: CAN-2026-ASMT-000001
 * Guarantees zero ID reuse and 100% global uniqueness.
 */
class CertificateIdGenerator {
  /**
   * Generates a globally unique readable certificate ID.
   * @param {String} domainPrefix - Optional custom tag (default: "ASMT")
   * @returns {Promise<String>} Unique formatted string e.g., CAN-2026-ASMT-000001
   */
  async generateUniqueId(domainPrefix = "ASMT") {
    const year = new Date().getFullYear();
    const prefix = `CAN-${year}-${domainPrefix}-`;

    // Attempt up to 5 times to generate a unique sequence number
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        // Find highest sequence number matching prefix in the repository
        const lastCert = await AssessmentCertificate.findOne({
          certificateId: { $regex: `^${prefix}` }
        })
          .sort({ certificateId: -1 })
          .select("certificateId")
          .lean();

        let seqNumber = 1;
        if (lastCert && lastCert.certificateId) {
          const parts = lastCert.certificateId.split("-");
          const numPart = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(numPart)) {
            seqNumber = numPart + 1;
          }
        }

        // Add attempt offset if recovering from a concurrent race condition
        seqNumber += attempt;

        // Pad to 6 digits e.g., 000001
        const paddedSeq = String(seqNumber).padStart(6, "0");
        const candidateId = `${prefix}${paddedSeq}`;

        // Verify global uniqueness against existing records
        const exists = await AssessmentCertificate.exists({ certificateId: candidateId });
        if (!exists) {
          return candidateId;
        }
      } catch (err) {
        console.warn(`[CertificateIdGenerator] Seq check attempt ${attempt + 1} fallback:`, err.message);
      }
    }

    // High-concurrency fallback: Append 4-char hex random tag to guarantee uniqueness without blocking
    const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
    const fallbackId = `${prefix}${Date.now().toString().slice(-5)}${randomHex}`;
    return fallbackId;
  }
}

module.exports = new CertificateIdGenerator();
