/**
 * Component 9: Strength & Weakness Engine
 * Automatically classifies candidate capability patterns into strong/weak topic domains and complexity strata.
 * STRICT POLICY: Rule-based heuristic evaluation only. Zero AI inference network calls required or performed.
 */
class StrengthWeaknessEngine {
  /**
   * Evaluates candidate analytical summaries using rule-based thresholds to extract competency profiles.
   *
   * @param {Object} params
   * @param {Array<Object>} params.topicAnalysis
   * @param {Object} params.difficultyAnalysis
   * @returns {Object} strengthsAndWeaknesses breakdown
   */
  static evaluate({ topicAnalysis = [], difficultyAnalysis = {} }) {
    const strongTopics = [];
    const weakTopics = [];
    const mostMissedTopics = [];

    // Rule 1: Topic Domain Stratification
    topicAnalysis.forEach((item) => {
      // Strong topic if accuracy >= 70% with at least 1 attempted item
      if (item.attempted > 0 && item.accuracy >= 70.0) {
        strongTopics.push(item.topic);
      }
      // Weak topic if accuracy < 50% or if more than half items were skipped/unanswered
      else if (item.attempted > 0 && item.accuracy < 50.0) {
        weakTopics.push(item.topic);
      } else if (item.total > 0 && item.attemptRate < 50.0) {
        weakTopics.push(`${item.topic} (High Skip Rate: ${100 - item.attemptRate}%)`);
      }
    });

    // Rule 2: Most Missed Topics sorted by aggregate incorrect responses
    const sortedByMisses = [...topicAnalysis].sort((a, b) => {
      const missesA = (a.incorrect || 0) + (a.total - a.attempted);
      const missesB = (b.incorrect || 0) + (b.total - b.attempted);
      return missesB - missesA;
    });

    sortedByMisses.forEach((item) => {
      const totalMissed = (item.incorrect || 0) + (item.total - item.attempted);
      if (totalMissed > 0) {
        mostMissedTopics.push(item.topic);
      }
    });

    // Rule 3: Difficulty Band Classification
    const strongDifficulties = [];
    const weakDifficulties = [];

    Object.keys(difficultyAnalysis).forEach((band) => {
      const stats = difficultyAnalysis[band];
      if (stats && stats.attempted > 0) {
        if (stats.accuracy >= 75.0) {
          strongDifficulties.push(band);
        } else if (stats.accuracy < 45.0) {
          weakDifficulties.push(band);
        }
      }
    });

    // Ensure clean defaults if lists are empty
    if (strongTopics.length === 0 && topicAnalysis.length > 0) {
      const topTopic = [...topicAnalysis].sort((a, b) => b.accuracy - a.accuracy)[0];
      if (topTopic && topTopic.accuracy >= 50) strongTopics.push(topTopic.topic);
    }

    return {
      strongTopics,
      weakTopics,
      strongDifficulties,
      weakDifficulties,
      mostMissedTopics: mostMissedTopics.slice(0, 3), // return top 3 most missed domains
      policy: "Rule-Based Deterministic Evaluation (Zero AI Inference)",
    };
  }
}

module.exports = StrengthWeaknessEngine;
