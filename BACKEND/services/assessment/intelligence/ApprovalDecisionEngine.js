/**
 * ApprovalDecisionEngine.js — Components 12 and 16 of the Question Intelligence Engine
 * Enforces dynamic configuration-based quality governance decisions (Approved, Needs Review, Rejected)
 * and prepares structured architectural state model hooks for human review workflows in future phases.
 */
class ApprovalDecisionEngine {
  constructor() {
    // Configurable default thresholds (Component 12) — can be overridden by system settings
    this.defaultConfig = {
      approvedThreshold: 90,     // Overall Quality Score >= 90
      needsReviewThreshold: 75,  // 75 <= Overall Quality Score < 90
      maxDuplicateRiskAllowed: 70, // Any duplicate risk > 70 automatically forces review or rejection
      autoRejectCriticalErrors: true
    };

    // Human Review Readiness State Model (Component 16)
    this.validReviewStates = [
      "Pending Review",
      "Approved",
      "Rejected",
      "Force Approved",
      "Revalidate"
    ];
  }

  /**
   * Evaluates the validation scores and structural diagnostics to make an automated decision.
   * 
   * @param {Object} itemScores - Output from QualityScoringEngine (overallQualityScore, etc.)
   * @param {Array<string>} errors - Critical structural or validation errors
   * @param {Array<string>} warnings - Non-critical diagnostic warnings
   * @param {Object} customConfig - Optional dynamic threshold settings
   * @returns {Object} { decision: string, reviewState: string, decisionReasons: Array<string>, thresholdsUsed: Object }
   */
  evaluate(itemScores, errors = [], warnings = [], customConfig = {}) {
    const config = { ...this.defaultConfig, ...customConfig };
    const score = Number(itemScores.overallQualityScore ?? 0);
    const dupRisk = Number(itemScores.duplicateRiskScore ?? 0);

    const decisionReasons = [];
    let decision = "Approved";
    let reviewState = "Approved"; // Mapped directly to Component 16 state model

    // 1. Check for immediate critical rejection flags
    if (config.autoRejectCriticalErrors && errors.length > 0) {
      decision = "Rejected";
      reviewState = "Rejected";
      decisionReasons.push(`Rejected due to ${errors.length} critical structural/schema errors: ${errors[0]}`);
    } else if (dupRisk >= 90) {
      decision = "Rejected";
      reviewState = "Rejected";
      decisionReasons.push(`Rejected due to high duplicate signature risk (${dupRisk}% >= 90% tolerance limit).`);
    } else {
      // 2. Apply configurable numeric quality thresholds
      if (score >= config.approvedThreshold && dupRisk < 50 && warnings.length === 0) {
        decision = "Approved";
        reviewState = "Approved";
        decisionReasons.push(`Passed automated Quality Gate with overall score ${score}% (>= threshold ${config.approvedThreshold}%).`);
      } else if (score >= config.needsReviewThreshold) {
        decision = "Needs Review";
        reviewState = "Pending Review"; // Component 16 ready state
        if (score < config.approvedThreshold) {
          decisionReasons.push(`Score ${score}% falls in manual review window (${config.needsReviewThreshold}%–${config.approvedThreshold - 1}%).`);
        }
        if (warnings.length > 0) {
          decisionReasons.push(`Flagged for review due to ${warnings.length} diagnostic warnings.`);
        }
        if (dupRisk >= 50) {
          decisionReasons.push(`Moderate duplicate resemblance (${dupRisk}%) warrants human verification.`);
        }
      } else {
        decision = "Rejected";
        reviewState = "Rejected";
        decisionReasons.push(`Overall quality score ${score}% falls below minimal qualifying floor (< ${config.needsReviewThreshold}%).`);
      }
    }

    return {
      decision,
      reviewState,
      decisionReasons,
      thresholdsUsed: {
        approved: config.approvedThreshold,
        needsReview: config.needsReviewThreshold
      },
      humanReviewReadiness: {
        supportedStateTransitions: this.validReviewStates,
        canForceApprove: decision !== "Approved",
        requiresAdminAction: decision === "Needs Review"
      }
    };
  }

  /**
   * Component 16 helper: simulates an admin governance status transition on an in-memory item
   * without creating persistent database storage yet.
   */
  simulateAdminAction(questionId, actionState, reason = "Admin manual override via UI") {
    if (!this.validReviewStates.includes(actionState)) {
      throw new Error(`Invalid review state transition: "${actionState}". Allowed states: ${this.validReviewStates.join(", ")}`);
    }
    return {
      questionId,
      updatedState: actionState,
      actionReason: reason,
      actedAt: new Date().toISOString(),
      databaseStatus: "Temporary Memory Modified (Persistence reserved for Phase 7)"
    };
  }
}

module.exports = new ApprovalDecisionEngine();
