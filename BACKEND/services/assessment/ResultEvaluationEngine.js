const crypto = require("crypto");
const AssessmentResult = require("../../models/assessment/AssessmentResult");
const AssessmentSession = require("../../models/assessment/AssessmentSession");
const EvaluationPackageBuilder = require("./evaluation/EvaluationPackageBuilder");
const PackageVerifier = require("./evaluation/PackageVerifier");
const AnswerEvaluator = require("./evaluation/AnswerEvaluator");
const ScoreEngine = require("./evaluation/ScoreEngine");
const AnalyticsEngine = require("./evaluation/AnalyticsEngine");
const StrengthWeaknessEngine = require("./evaluation/StrengthWeaknessEngine");
const AntiCheatSummaryEngine = require("./evaluation/AntiCheatSummaryEngine");
const ReevaluationEngine = require("./evaluation/ReevaluationEngine");

/**
 * Phase 10 — Result Evaluation & Scoring Engine (Master Facade)
 * Receives the locked assessment attempt from Phase 9 and performs secure, server-authoritative evaluation.
 * STRICTLY PRODUCES ONLY an immutable Result Object queued for Phase 11 handoff.
 * DOES NOT generate certificates, update leaderboards, or dispatch emails.
 */
class ResultEvaluationEngine {
  /**
   * Evaluates a finalized assessment session and produces an immutable Result Object.
   *
   * @param {string} sessionId - Target locked session ID from Phase 9
   * @param {Object} options - Optional flags (e.g. forceReevaluate for admin architecture testing)
   * @returns {Promise<Object>} Final Result Object
   */
  static async evaluateSession(sessionId, options = { forceReevaluate: false }) {
    try {
      // Component 18: Security — Prevent Duplicate Evaluation & Replay Attacks
      if (!options.forceReevaluate) {
        const existingResult = await AssessmentResult.findOne({ sessionId }).lean();
        if (existingResult) {
          console.log(`[ResultEvaluationEngine] ⚠️ Session [${sessionId}] already evaluated. Returning existing immutable Result Object.`);
          return {
            success: true,
            code: "ALREADY_EVALUATED",
            result: existingResult,
            message: "Session evaluation already completed previously; duplicate re-computation avoided.",
          };
        }
      }

      // Step 1: Build Immutable Evaluation Package (Component 1)
      const pkgResult = await EvaluationPackageBuilder.buildPackage(sessionId);
      if (!pkgResult.success) {
        return { success: false, error: pkgResult.error, code: pkgResult.code };
      }
      const evalPackage = pkgResult.package;

      // Step 2: Verify Package Integrity & Tamper Safeguards (Component 2 & 18)
      const verifReport = PackageVerifier.verify(evalPackage);
      if (!verifReport.isValid) {
        return {
          success: false,
          code: "TAMPER_DETECTED",
          error: "Evaluation package verification failed due to cryptographic hash mismatch or unlocked session state.",
          verificationErrors: verifReport.errors,
        };
      }

      // Step 3: Server-Side Answer Evaluation (Component 3 - Zero Trust Client Score)
      const gradedItems = AnswerEvaluator.evaluateAnswers(evalPackage);

      // Step 4 & 5: Score Engine & Pass/Fail Classification (Component 4 & 5)
      const scoreSummary = ScoreEngine.calculateScore(gradedItems, evalPackage.configSnapshot);

      // Step 6, 7 & 8: High-Performance Multi-Dimensional Analytics (Component 6, 7, 8, 17)
      const analytics = AnalyticsEngine.analyzePerformance(gradedItems);

      // Step 9: Rule-Based Strength & Weakness Stratification (Component 9)
      const strengthsAndWeaknesses = StrengthWeaknessEngine.evaluate({
        topicAnalysis: analytics.topicAnalysis,
        difficultyAnalysis: analytics.difficultyAnalysis,
      });

      // Step 10: Anti-Cheat Summary (Component 10 - No Disqualification)
      const riskSummary = AntiCheatSummaryEngine.summarize(evalPackage.antiCheatSummary);

      // Step 11: Evaluation Integrity Hash Generation (Component 11)
      const evaluationTimestamp = new Date();
      const evaluatorVersion = "v1.0.0-Phase10-Authoritative";
      const integrityPayload = JSON.stringify({
        sessionId: evalPackage.sessionId,
        packageHash: evalPackage.packageHash,
        scoreSummary: scoreSummary,
        riskLevel: riskSummary.riskLevel,
        timestamp: evaluationTimestamp.toISOString(),
      });
      const evaluationHash = crypto.createHash("sha256").update(integrityPayload).digest("hex");

      const resultId = `RES-${sessionId}-${Date.now().toString(36).toUpperCase()}`;

      // Step 12: Construct Immutable Result Object (Component 12)
      const newResultDoc = new AssessmentResult({
        resultId: resultId,
        sessionId: evalPackage.sessionId,
        evaluationPackageId: evalPackage.evaluationPackageId,
        candidateId: evalPackage.candidateId,
        userId: evalPackage.userId || null,
        subcategoryId: evalPackage.subcategoryId || null,
        attemptNumber: evalPackage.attemptNumber || 1,
        scoreSummary: scoreSummary,
        topicAnalysis: analytics.topicAnalysis,
        difficultyAnalysis: analytics.difficultyAnalysis,
        bloomAnalysis: analytics.bloomAnalysis,
        strengthsAndWeaknesses: strengthsAndWeaknesses,
        riskSummary: riskSummary,
        integrity: {
          packageFingerprint: evalPackage.packageHash,
          evaluationHash: evaluationHash,
          evaluatorVersion: evaluatorVersion,
          evaluationTimestamp: evaluationTimestamp,
          isTamperVerified: true,
        },
        evaluationMetadata: {
          blueprintVersion: evalPackage.blueprintVersion || 1,
          configVersion: evalPackage.configSnapshot?.version || 1,
          questionVersions: evalPackage.questionVersions,
          reevaluatedCount: options.forceReevaluate ? 1 : 0,
          lastReevaluatedAt: options.forceReevaluate ? evaluationTimestamp : null,
          handOffToPhase11Status: "QUEUED", // STOP — Hand off to Phase 11 queued without generating certificate!
        },
        isImmutable: true,
      });

      await newResultDoc.save();
      console.log(`[ResultEvaluationEngine] ✅ Successfully evaluated session [${sessionId}] and stored immutable Result [${resultId}]. Handoff to Phase 11 queued.`);

      // Also update session status to indicate evaluation completed
      try {
        await AssessmentSession.findOneAndUpdate(
          { sessionId },
          { $set: { "evaluationStatus": "EVALUATED_PHASE_10", "resultId": resultId } }
        );
      } catch (e) {
        console.warn("[ResultEvaluationEngine] Non-fatal notice updating session evaluation status:", e.message);
      }

      return {
        success: true,
        resultId: resultId,
        sessionId: sessionId,
        status: scoreSummary.status,
        percentage: scoreSummary.percentage,
        evaluationHash: evaluationHash,
        result: newResultDoc.toObject(),
        message: "Authoritative evaluation successful. Result Object generated and locked. Ready for Phase 11.",
      };
    } catch (err) {
      console.error("[ResultEvaluationEngine] Fatal evaluation error:", err);
      return { success: false, error: err.message };
    }
  }

  /** Component 14: Retrieve complete immutable Result Object by sessionId or resultId */
  static async getResult(identifier) {
    try {
      const result = await AssessmentResult.findOne({
        $or: [{ sessionId: identifier }, { resultId: identifier }],
      }).lean();
      if (!result) {
        return { success: false, error: `Result not found for identifier [${identifier}].` };
      }
      return { success: true, result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /** Component 13: Check historical reevaluation eligibility */
  static async checkReevaluation(params) {
    return await ReevaluationEngine.checkReevaluationEligibility(params);
  }
}

module.exports = ResultEvaluationEngine;
