const crypto = require("crypto");

/**
 * Phase 11 — Component 2: Credential Snapshot & Component 8: Verification Hash Suite
 * Synthesizes an immutable, frozen credential snapshot from a Phase 10 Result Object
 * and generates cryptographic SHA-256 integrity verification hashes.
 */
class CredentialSnapshotBuilder {
  /**
   * Builds the immutable snapshot and hash suite for a credential candidate.
   * @param {Object} result - Evaluated Phase 10 Result Object
   * @param {Object} overrideMeta - Optional metadata like candidateName or explicit version tags
   * @returns {Object} { snapshot: Object, hashes: Object }
   */
  buildSnapshotAndHashes(result, overrideMeta = {}) {
    const scoreSummary = result.scoreSummary || {};
    const integrity = result.integrity || {};
    const metadata = result.evaluationMetadata || {};

    // Component 2: Construct all required snapshot data points
    const snapshot = {
      candidateName: overrideMeta.candidateName || result.candidateName || "Code-A-Nova Candidate",
      candidateId: result.candidateId || "unknown-candidate",
      assessmentName: overrideMeta.assessmentName || result.assessmentName || `Assessment Domain Test (${result.sessionId || "Standard"})`,
      category: overrideMeta.category || result.category || "Software Engineering & Cloud Computing",
      subcategory: overrideMeta.subcategory || result.subcategory || "Core Competency Evaluation",
      assessmentType: "Proctored Server-Authoritative Competency Test",
      score: scoreSummary.finalScore || scoreSummary.rawScore || 0,
      percentage: scoreSummary.percentage || 0,
      passingPercentage: scoreSummary.passingPercentage || 60.0,
      resultId: result.resultId || "RES-UNKNOWN",
      resultHash: integrity.packageFingerprint || "HASH-PKG-UNSET",
      evaluationHash: integrity.evaluationHash || "HASH-EVAL-UNSET",
      blueprintVersion: metadata.blueprintVersion || 1,
      configVersion: metadata.configVersion || 1,
      runtimeVersion: integrity.evaluatorVersion || "v1.0.0-Phase10",
      issueTimestamp: new Date()
    };

    // Freeze snapshot object against in-memory modification during synthesis
    Object.freeze(snapshot);

    // Component 8: Generate Cryptographic Verification Hashes
    const snapshotString = JSON.stringify({
      candidateId: snapshot.candidateId,
      assessmentName: snapshot.assessmentName,
      percentage: snapshot.percentage,
      resultId: snapshot.resultId,
      evaluationHash: snapshot.evaluationHash,
      timestamp: snapshot.issueTimestamp.toISOString()
    });

    const snapshotHash = crypto
      .createHash("sha256")
      .update(snapshotString)
      .digest("hex")
      .toUpperCase();

    // Combined Certificate Hash covering result hash, eval hash, and snapshot hash
    const certInput = `${snapshot.resultHash}:${snapshot.evaluationHash}:${snapshotHash}`;
    const certificateHash = crypto
      .createHash("sha256")
      .update(certInput)
      .digest("hex")
      .toUpperCase();

    const hashes = {
      certificateHash,
      snapshotHash,
      resultHash: snapshot.resultHash,
      evaluationHash: snapshot.evaluationHash
    };

    Object.freeze(hashes);

    return { snapshot, hashes };
  }

  /**
   * Verifies if a stored snapshot matches its cryptographic snapshot hash.
   * @param {Object} snapshot - Stored credential snapshot
   * @param {String} expectedHash - Stored snapshotHash
   * @returns {Boolean} true if integrity verified without tampering
   */
  verifySnapshotIntegrity(snapshot, expectedHash) {
    if (!snapshot || !expectedHash) return false;
    try {
      const snapshotString = JSON.stringify({
        candidateId: snapshot.candidateId,
        assessmentName: snapshot.assessmentName,
        percentage: snapshot.percentage,
        resultId: snapshot.resultId,
        evaluationHash: snapshot.evaluationHash,
        timestamp: new Date(snapshot.issueTimestamp).toISOString()
      });
      const computedHash = crypto
        .createHash("sha256")
        .update(snapshotString)
        .digest("hex")
        .toUpperCase();
      return computedHash === expectedHash;
    } catch (err) {
      return false;
    }
  }
}

module.exports = new CredentialSnapshotBuilder();
