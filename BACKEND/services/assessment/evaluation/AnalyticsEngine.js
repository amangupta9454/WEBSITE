/**
 * Component 6, 7, 8 & 17: Analytics Engine (Topic, Difficulty, Bloom Taxonomy & High-Performance Single-Pass Reduction)
 * Aggregates candidate performance metrics across domain topics, difficulty bands, and Bloom's cognitive taxonomy levels
 * in an highly optimized single-pass linear scan over graded items.
 */
class AnalyticsEngine {
  /**
   * Performs exhaustive multi-dimensional performance analysis over graded assessment items.
   *
   * @param {Array<Object>} gradedItems
   * @returns {Object} { topicAnalysis, difficultyAnalysis, bloomAnalysis }
   */
  static analyzePerformance(gradedItems) {
    // 1. Initialize data accumulators
    const topicMap = new Map();
    const difficultyMap = {
      Easy: { total: 0, attempted: 0, correct: 0, incorrect: 0 },
      Medium: { total: 0, attempted: 0, correct: 0, incorrect: 0 },
      Hard: { total: 0, attempted: 0, correct: 0, incorrect: 0 },
      Expert: { total: 0, attempted: 0, correct: 0, incorrect: 0 },
    };
    const bloomMap = {
      Remember: { total: 0, attempted: 0, correct: 0 },
      Understand: { total: 0, attempted: 0, correct: 0 },
      Apply: { total: 0, attempted: 0, correct: 0 },
      Analyze: { total: 0, attempted: 0, correct: 0 },
      Evaluate: { total: 0, attempted: 0, correct: 0 },
      Create: { total: 0, attempted: 0, correct: 0 },
    };

    // Single-pass reduction over all items for optimum runtime efficiency (Component 17)
    for (let i = 0; i < gradedItems.length; i++) {
      const item = gradedItems[i];
      const topic = item.topic || "General Domain";
      const diff = ["Easy", "Medium", "Hard", "Expert"].includes(item.difficulty) ? item.difficulty : "Medium";
      const bloom = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"].includes(item.bloomLevel) ? item.bloomLevel : "Apply";

      const isAns = Boolean(item.isAnswered);
      const isCorr = Boolean(item.isCorrect);

      // --- Topic Accumulation (Component 6) ---
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { topic, total: 0, attempted: 0, correct: 0, incorrect: 0 });
      }
      const tData = topicMap.get(topic);
      tData.total += 1;
      if (isAns) {
        tData.attempted += 1;
        if (isCorr) tData.correct += 1;
        else tData.incorrect += 1;
      }

      // --- Difficulty Accumulation (Component 7) ---
      difficultyMap[diff].total += 1;
      if (isAns) {
        difficultyMap[diff].attempted += 1;
        if (isCorr) difficultyMap[diff].correct += 1;
        else difficultyMap[diff].incorrect += 1;
      }

      // --- Bloom Accumulation (Component 8) ---
      bloomMap[bloom].total += 1;
      if (isAns) {
        bloomMap[bloom].attempted += 1;
        if (isCorr) bloomMap[bloom].correct += 1;
      }
    }

    // 2. Format final structured breakdowns with percentage ratios
    const topicAnalysis = Array.from(topicMap.values()).map((t) => ({
      topic: t.topic,
      total: t.total,
      attempted: t.attempted,
      correct: t.correct,
      incorrect: t.incorrect,
      accuracy: t.attempted > 0 ? parseFloat(((t.correct / t.attempted) * 100).toFixed(1)) : 0,
      attemptRate: t.total > 0 ? parseFloat(((t.attempted / t.total) * 100).toFixed(1)) : 0,
    }));

    const difficultyAnalysis = {};
    Object.keys(difficultyMap).forEach((key) => {
      const d = difficultyMap[key];
      difficultyAnalysis[key] = {
        total: d.total,
        attempted: d.attempted,
        correct: d.correct,
        accuracy: d.attempted > 0 ? parseFloat(((d.correct / d.attempted) * 100).toFixed(1)) : 0,
        attemptRate: d.total > 0 ? parseFloat(((d.attempted / d.total) * 100).toFixed(1)) : 0,
        successRate: d.total > 0 ? parseFloat(((d.correct / d.total) * 100).toFixed(1)) : 0,
      };
    });

    const bloomAnalysis = {};
    Object.keys(bloomMap).forEach((key) => {
      const b = bloomMap[key];
      bloomAnalysis[key] = {
        total: b.total,
        attempted: b.attempted,
        correct: b.correct,
        accuracy: b.attempted > 0 ? parseFloat(((b.correct / b.attempted) * 100).toFixed(1)) : 0,
        attemptRate: b.total > 0 ? parseFloat(((b.attempted / b.total) * 100).toFixed(1)) : 0,
      };
    });

    return {
      topicAnalysis,
      difficultyAnalysis,
      bloomAnalysis,
    };
  }
}

module.exports = AnalyticsEngine;
