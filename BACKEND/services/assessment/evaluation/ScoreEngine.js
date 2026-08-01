/**
 * Component 4: Score Engine & Component 5: Pass/Fail Engine
 * Computes authoritative candidate performance metrics (Correct, Incorrect, Unanswered, Raw Score, Negative Marking)
 * and determines evaluation status (Passed, Failed, Borderline) strictly utilizing immutable config snapshots.
 */
class ScoreEngine {
  /**
   * Calculates exhaustive scoring and pass/fail classification from graded items and package configuration.
   *
   * @param {Array<Object>} gradedItems
   * @param {Object} configSnapshot - Immutable test rules frozen at attempt start in Phase 9
   * @returns {Object} Structured score summary object
   */
  static calculateScore(gradedItems, configSnapshot = {}) {
    const totalQuestions = gradedItems.length;
    let attempted = 0;
    let unanswered = 0;
    let correct = 0;
    let incorrect = 0;
    let rawScore = 0;
    let maxPossibleScore = 0;

    gradedItems.forEach((item) => {
      maxPossibleScore += Number(item.maxScore || 1);
      if (item.isAnswered) {
        attempted += 1;
        if (item.isCorrect) {
          correct += 1;
          rawScore += Number(item.scoreEarned || item.maxScore || 1);
        } else {
          incorrect += 1;
        }
      } else {
        unanswered += 1;
      }
    });

    // Component 4: Negative Marking calculation
    const isNegativeMarkingEnabled = Boolean(configSnapshot.negativeMarkingEnabled || configSnapshot.negativeMarking);
    const negativePenaltyPerWrong = Number(configSnapshot.negativePenaltyPerWrong || configSnapshot.negativePenalty || 0.25);
    let negativeDeductions = 0;

    if (isNegativeMarkingEnabled && incorrect > 0) {
      negativeDeductions = parseFloat((incorrect * negativePenaltyPerWrong).toFixed(2));
    }

    // Final score cannot drop below 0 unless explicitly configured
    let finalScore = parseFloat((rawScore - negativeDeductions).toFixed(2));
    if (finalScore < 0 && !configSnapshot.allowNegativeTotal) {
      finalScore = 0;
    }

    // Percentage computation against max possible marks
    const percentage = maxPossibleScore > 0 ? parseFloat(((finalScore / maxPossibleScore) * 100).toFixed(2)) : 0;

    // Component 5: Pass / Fail Engine (Strictly utilizing config snapshot)
    const passingPercentage = Number(configSnapshot.passingPercentage || configSnapshot.passPercentage || 60.0);
    const borderlineThreshold = Number(configSnapshot.borderlineThreshold || 3.0); // e.g. within 3% of passing mark

    let status = "Failed";
    const gap = passingPercentage - percentage;

    if (percentage >= passingPercentage) {
      status = "Passed";
    } else if (gap > 0 && gap <= borderlineThreshold) {
      // e.g. passing is 60%, candidate scored 57% to 59.99% -> Borderline
      status = "Borderline";
    } else {
      status = "Failed";
    }

    return {
      totalQuestions,
      attempted,
      unanswered,
      correct,
      incorrect,
      rawScore,
      negativeMarkingDeductions: negativeDeductions,
      finalScore,
      maxPossibleScore,
      percentage,
      passingPercentage,
      status,
      borderlineThreshold,
      isNegativeMarkingEnabled,
      evaluatedAt: new Date(),
    };
  }
}

module.exports = ScoreEngine;
