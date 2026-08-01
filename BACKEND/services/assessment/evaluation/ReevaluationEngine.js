const AssessmentResult = require("../../../models/assessment/AssessmentResult");
const EvaluationPackageBuilder = require("./EvaluationPackageBuilder");
const PackageVerifier = require("./PackageVerifier");

/**
 * Component 13: Re-evaluation Ready Architecture
 * Provides internal backend service methods to audit historical evaluation results against updated blueprints,
 * modified question version tags, or revised pass percentage cutoffs.
 * STRICT POLICY: Architecture only; no graphical management UI or automated background scheduled jobs required.
 */
class ReevaluationEngine {
  /**
   * Compares an existing evaluated result against live repository version increments.
   *
   * @param {string} sessionId or resultId
   * @param {Object} latestVersions - { blueprintVersion: number, questionVersions: Object, configVersion: number }
   * @returns {Promise<Object>} Comparison audit report
   */
  static async checkReevaluationEligibility({ sessionId, resultId, latestVersions = {} }) {
    try {
      const query = resultId ? { resultId } : { sessionId };
      const existingResult = await AssessmentResult.findOne(query).lean();

      if (!existingResult) {
        return { success: false, error: "Result record not found for comparison." };
      }

      const meta = existingResult.evaluationMetadata || {};
      const currentBpVersion = meta.blueprintVersion || 1;
      const currentConfigVer = meta.configVersion || 1;
      const currentQVersions = meta.questionVersions || {};

      const blueprintDrift = latestVersions.blueprintVersion ? latestVersions.blueprintVersion !== currentBpVersion : false;
      const configDrift = latestVersions.configVersion ? latestVersions.configVersion !== currentConfigVer : false;

      let questionDriftCount = 0;
      const mismatchedQuestions = [];
      if (latestVersions.questionVersions) {
        Object.keys(latestVersions.questionVersions).forEach((qId) => {
          const newVer = latestVersions.questionVersions[qId];
          const oldVer = currentQVersions[qId] || 1;
          if (newVer > oldVer) {
            questionDriftCount += 1;
            mismatchedQuestions.push({ questionId: qId, evaluatedVersion: oldVer, currentVersion: newVer });
          }
        });
      }

      const isReevaluationRecommended = blueprintDrift || configDrift || questionDriftCount > 0;

      return {
        success: true,
        resultId: existingResult.resultId,
        sessionId: existingResult.sessionId,
        isReevaluationRecommended,
        comparison: {
          blueprint: { evaluated: currentBpVersion, current: latestVersions.blueprintVersion || currentBpVersion, drift: blueprintDrift },
          config: { evaluated: currentConfigVer, current: latestVersions.configVersion || currentConfigVer, drift: configDrift },
          questions: { totalChecked: Object.keys(currentQVersions).length, driftCount: questionDriftCount, mismatchedQuestions },
        },
        architectureStatus: "Re-evaluation pipeline hooks ready for future administrative batch triggers.",
      };
    } catch (err) {
      console.error("[ReevaluationEngine] Error checking eligibility:", err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = ReevaluationEngine;
