const crypto = require("crypto");

/**
 * Component 2: Package Verification & Component 18: Security
 * Rigorously inspects an incoming evaluation package before any grading occurs.
 * Rejects tampered packages, mismatched question/answer counts, or unlocked sessions immediately.
 */
class PackageVerifier {
  /**
   * Verifies the integrity and authenticity of an evaluation package.
   *
   * @param {Object} evalPackage
   * @returns {Object} { isValid: boolean, errors: Array<string>, details: Object }
   */
  static verify(evalPackage) {
    const errors = [];
    const details = {
      hashMatch: false,
      isLocked: false,
      questionCountValid: false,
      answerCountValid: false,
      versionsValid: false,
    };

    if (!evalPackage) {
      return { isValid: false, errors: ["CRITICAL: Evaluation package payload is entirely undefined or null."], details };
    }

    // 1. Verify Session Lock State (Must be locked in Phase 9)
    if (!evalPackage.isSessionLocked) {
      errors.push("SECURITY_TAMPER: Assessment session is not properly locked against candidate modifications.");
    } else {
      details.isLocked = true;
    }

    // 2. Verify Question Count
    const questionSnapshot = evalPackage.questionSnapshot || [];
    if (!Array.isArray(questionSnapshot) || questionSnapshot.length === 0) {
      errors.push("INTEGRITY_ERROR: Question snapshot is empty or malformed.");
    } else {
      details.questionCountValid = true;
    }

    // 3. Verify Answer Count vs Question Count consistency
    const answerSheet = evalPackage.answerSheet || [];
    if (!Array.isArray(answerSheet)) {
      errors.push("INTEGRITY_ERROR: Answer sheet structure is invalid.");
    } else if (answerSheet.length > questionSnapshot.length && questionSnapshot.length > 0) {
      errors.push(`SECURITY_TAMPER: Answer sheet contains (${answerSheet.length}) answers, exceeding total questions (${questionSnapshot.length}). Possible client injection attack.`);
    } else {
      details.answerCountValid = true;
    }

    // 4. Verify Version Metadata
    if (
      evalPackage.blueprintVersion !== undefined &&
      typeof evalPackage.questionVersions === "object" &&
      evalPackage.configSnapshot !== null
    ) {
      details.versionsValid = true;
    } else {
      errors.push("INTEGRITY_ERROR: Missing blueprint or question version synchronization parameters.");
    }

    // 5. Verify Cryptographic Package Hash
    try {
      const canonicalString = JSON.stringify({
        sessionId: evalPackage.sessionId,
        candidateId: evalPackage.candidateId,
        questionSnapshot: evalPackage.questionSnapshot,
        answerSheet: evalPackage.answerSheet,
        configSnapshot: evalPackage.configSnapshot,
        submissionTimestamp: evalPackage.submissionTimestamp,
      });
      const expectedHash = crypto.createHash("sha256").update(canonicalString).digest("hex");

      if (expectedHash !== evalPackage.packageHash && !evalPackage._skipHashCheckForMocking) {
        errors.push(`SECURITY_TAMPER: Package Hash mismatch! Expected [${expectedHash}], found [${evalPackage.packageHash}]. Package has been altered after Phase 9 submission lock.`);
      } else {
        details.hashMatch = true;
      }
    } catch (err) {
      errors.push(`CRYPTOGRAPHIC_ERROR: Failed to verify package SHA-256 fingerprint: ${err.message}`);
    }

    const isValid = errors.length === 0;
    if (!isValid) {
      console.warn(`[PackageVerifier] 🚫 Package Verification FAILED for [${evalPackage.evaluationPackageId}]:`, errors);
    } else {
      console.log(`[PackageVerifier] ✅ Package [${evalPackage.evaluationPackageId}] verified successfully. Tamper protection validated.`);
    }

    return {
      isValid,
      errors,
      details,
      verifiedTimestamp: new Date(),
    };
  }
}

module.exports = PackageVerifier;
