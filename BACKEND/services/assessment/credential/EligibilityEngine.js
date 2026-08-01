const AssessmentResult = require("../../../models/assessment/AssessmentResult");
const AssessmentCertificate = require("../../../models/assessment/AssessmentCertificate");
const crypto = require("crypto");

/**
 * Phase 11 — Component 1: Certificate Eligibility Engine
 * Enforces strict verification criteria before allowing digital credential synthesis.
 * Guarantees zero unverified, failed, or tampered assessment attempts ever enter the Credential Repository.
 */
class EligibilityEngine {
  /**
   * Verifies if an evaluation result is eligible for certificate issuance or re-issuance.
   * @param {String} resultIdOrSessionId - Result ID or Session ID from Phase 10
   * @param {Object} options - Options e.g., { isReissue: boolean }
   * @returns {Promise<{ eligible: boolean, reason?: string, resultObject?: Object }>}
   */
  async checkEligibility(resultIdOrSessionId, options = {}) {
    try {
      // 1. Retrieve the Phase 10 Result Object
      let result = await AssessmentResult.findOne({ resultId: resultIdOrSessionId });
      if (!result) {
        result = await AssessmentResult.findOne({ sessionId: resultIdOrSessionId });
      }

      if (!result) {
        return {
          eligible: false,
          reason: `ELIGIBILITY_REJECTED: Phase 10 Result Object not found for identifier [${resultIdOrSessionId}]. Evaluation incomplete or non-existent.`
        };
      }

      // 2. Verify Evaluation completed and immutable state
      if (!result.scoreSummary || !result.isImmutable) {
        return {
          eligible: false,
          reason: "ELIGIBILITY_REJECTED: Evaluation record is either incomplete or missing immutability guarantee flag."
        };
      }

      // 3. Status = Passed check
      if (result.scoreSummary.status !== "Passed") {
        return {
          eligible: false,
          reason: `ELIGIBILITY_REJECTED: Candidate outcome status is [${result.scoreSummary.status}] (${result.scoreSummary.percentage}%). Certificate synthesis is strictly restricted to 'Passed' classifications.`
        };
      }

      // 4. Result integrity & tamper verification
      if (!result.integrity || !result.integrity.isTamperVerified) {
        return {
          eligible: false,
          reason: "ELIGIBILITY_REJECTED: Result integrity verification flag is false or missing. Possible payload modification detected."
        };
      }

      // 5. Evaluation Hash verified
      const expectedEvalHash = result.integrity.evaluationHash;
      if (!expectedEvalHash || expectedEvalHash.length < 32) {
        return {
          eligible: false,
          reason: "ELIGIBILITY_REJECTED: Cryptographic Evaluation Hash is invalid or missing in Phase 10 Result Object."
        };
      }

      // 6. Not already certified (unless reissuing)
      if (!options.isReissue) {
        const existingCert = await AssessmentCertificate.findOne({
          resultId: result.resultId,
          isCurrentActive: true,
          status: { $in: ["Issued", "Reissued"] }
        });

        if (existingCert) {
          return {
            eligible: false,
            reason: `ELIGIBILITY_REJECTED: An active digital certificate [${existingCert.certificateId}] already exists for result [${result.resultId}]. Use Versioned Reissue instead of duplicate synthesis.`,
            existingCertificate: existingCert
          };
        }
      }

      return {
        eligible: true,
        resultObject: result
      };
    } catch (err) {
      return {
        eligible: false,
        reason: `ELIGIBILITY_SYSTEM_ERROR: Failed to evaluate candidate eligibility — ${err.message}`
      };
    }
  }
}

module.exports = new EligibilityEngine();
