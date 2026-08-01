const crypto = require("crypto");

/**
 * Phase 11.5 — Component 7: Reusable Integrity & Validation Utility
 * Consolidates SHA-256 cryptographic hashing, tamper checking, and uniform response structure
 * across all Assessment engines (Session, Evaluation, Credential, Orchestration) without altering behavior.
 */
class IntegrityUtil {
  /**
   * Generates a deterministic uppercase SHA-256 hex string from any input object or string.
   * @param {string|Object} input
   * @returns {string} SHA-256 hex string
   */
  static generateSHA256(input) {
    try {
      const payload = typeof input === "string" ? input : JSON.stringify(input);
      return crypto.createHash("sha256").update(payload).digest("hex").toUpperCase();
    } catch (err) {
      console.error("[IntegrityUtil] SHA-256 generation error:", err.message);
      return "0000000000000000000000000000000000000000000000000000000000000000";
    }
  }

  /**
   * Verifies whether target data matches an expected SHA-256 seal.
   * @param {string|Object} input
   * @param {string} expectedHash
   * @returns {boolean} True if intact and untampered
   */
  static verifySHA256(input, expectedHash) {
    if (!expectedHash || typeof expectedHash !== "string") return false;
    const computed = this.generateSHA256(input);
    return computed === expectedHash.trim().toUpperCase();
  }

  /**
   * Standardized success API response builder for consistent contract conformance.
   * @param {string} message
   * @param {Object} data
   * @param {Object} extras
   * @returns {Object}
   */
  static successResponse(message = "Success", data = null, extras = {}) {
    return {
      success: true,
      message,
      ...(data !== null && { data }),
      ...extras,
    };
  }

  /**
   * Standardized error API response builder.
   * @param {string} error
   * @param {string} code
   * @param {number} status
   * @returns {Object}
   */
  static errorResponse(error = "Operation failed", code = "INTEGRATION_ERROR", status = 400) {
    return {
      success: false,
      code,
      error,
      status,
    };
  }
}

module.exports = IntegrityUtil;
