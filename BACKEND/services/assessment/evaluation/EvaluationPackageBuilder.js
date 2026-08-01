const crypto = require("crypto");
const AssessmentSession = require("../../../models/assessment/AssessmentSession");

/**
 * Component 1: Evaluation Package & Component 11: Package Fingerprint
 * Constructs an immutable, self-contained evaluation package from a completed and locked assessment session.
 * Never evaluate directly from raw mutable DB models; this read-only package isolates evaluation from ongoing session mutations.
 */
class EvaluationPackageBuilder {
  /**
   * Builds an immutable evaluation package for a given session.
   *
   * @param {string} sessionId
   * @returns {Promise<Object>} Read-only Evaluation Package
   */
  static async buildPackage(sessionId) {
    try {
      const session = await AssessmentSession.findOne({ sessionId }).lean();
      if (!session) {
        return { success: false, error: `AssessmentSession [${sessionId}] not found in database.` };
      }

      // Ensure session is locked (Phase 9 Component 12 requirement)
      if (!session.isLocked && !["Completed", "Expired"].includes(session.status)) {
        return {
          success: false,
          code: "SESSION_NOT_LOCKED",
          error: `Cannot build evaluation package: Session [${sessionId}] is still active or unlocked (Status: ${session.status}). Candidate must finalize submission in Phase 9 first.`,
        };
      }

      const packageId = `EVAL-PKG-${sessionId}-${Date.now()}`;

      // Extract question version mappings and blueprints from snapshot
      const questionVersions = {};
      const questionSnapshot = session.questionSnapshot || [];
      questionSnapshot.forEach((q) => {
        questionVersions[q.questionId || q.sequenceOrder] = q.version || 1;
      });

      // Compute Timeline Hash to freeze event occurrences
      const timelineStr = JSON.stringify(session.timeline || []);
      const timelineHash = crypto.createHash("sha256").update(timelineStr).digest("hex");

      const rawPackage = {
        evaluationPackageId: packageId,
        sessionId: session.sessionId,
        candidateId: session.candidateId || "anonymous-candidate",
        userId: session.userId || null,
        subcategoryId: session.subcategoryId || null,
        attemptNumber: session.attemptNumber || 1,
        questionSnapshot: questionSnapshot,
        answerSheet: session.answers || [],
        configSnapshot: session.configSnapshot || {},
        runtimeSnapshot: {
          timeLimitMinutes: session.configSnapshot?.timeLimitMinutes || 30,
          batchSize: session.configSnapshot?.batchSize || 5,
          allowPrevious: session.configSnapshot?.allowPrevious ?? true,
        },
        blueprintVersion: session.configSnapshot?.blueprintVersion || 1,
        questionVersions: questionVersions,
        submissionTimestamp: session.submittedAt || session.completedAt || new Date(),
        timelineHash: timelineHash,
        antiCheatSummary: session.antiCheatSummary || {},
        isSessionLocked: Boolean(session.isLocked || ["Completed", "Expired"].includes(session.status)),
      };

      // Compute SHA-256 Package Hash across the stable representation of the package (Component 2 & 11)
      const canonicalString = JSON.stringify({
        sessionId: rawPackage.sessionId,
        candidateId: rawPackage.candidateId,
        questionSnapshot: rawPackage.questionSnapshot,
        answerSheet: rawPackage.answerSheet,
        configSnapshot: rawPackage.configSnapshot,
        submissionTimestamp: rawPackage.submissionTimestamp,
      });
      const packageHash = crypto.createHash("sha256").update(canonicalString).digest("hex");

      const finalPackage = {
        ...rawPackage,
        packageHash,
        createdAt: new Date(),
      };

      // Freeze object completely in memory to enforce immutability
      Object.freeze(finalPackage);

      return {
        success: true,
        package: finalPackage,
        message: "Immutable Evaluation Package constructed successfully.",
      };
    } catch (err) {
      console.error("[EvaluationPackageBuilder] Error building package:", err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = EvaluationPackageBuilder;
