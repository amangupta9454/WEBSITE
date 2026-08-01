/**
 * QualityScoringEngine.js — Component 11 of the Question Intelligence Engine
 * Computes a holistic quality index across 6 foundational quality dimensions using
 * modular mathematical weighting arrays and strict penalty bounds.
 */
class QualityScoringEngine {
  constructor() {
    // Modular default weighting coefficients (sum = 1.0)
    this.defaultWeights = {
      structure: 0.25,
      grammar: 0.20,
      completeness: 0.20,
      topicMatch: 0.15,
      difficulty: 0.10,
      duplicateFreedom: 0.10
    };
  }

  /**
   * Evaluates the multi-dimensional composite quality scores for a question item.
   * 
   * @param {Object} input - Collected evaluation scores from validation pipeline components
   * @param {Object} customWeights - Optional overrides for dimensional calculation weights
   * @returns {Object} Complete modular scoring breakdown including Overall Quality Score (0–100)
   */
  calculate(input = {}, customWeights = null) {
    const weights = customWeights || this.defaultWeights;

    // Retrieve pillar scores with robust defaults
    const structureScore = Number(input.structureScore ?? 100);
    const grammarScore = Number(input.grammarScore ?? 100);
    const completenessScore = Number(input.completenessScore ?? 100);
    const difficultyScore = Number(input.difficultyScore ?? 100);
    const duplicateRisk = Number(input.duplicateRisk ?? 0);

    // Compute Topic Match score based on hierarchical classification confidence & hits
    let topicMatchScore = Number(input.topicMatchScore ?? 95);
    if (input.detectedDomain && input.detectedDomain === "General Computer Science" && input.requestedTopic && input.requestedTopic !== "General") {
      topicMatchScore = 75; // Moderate penalty if only generic fallback keywords were triggered
    }

    // Invert duplicate risk into a positive freedom index for additive weighted average
    const duplicateFreedomScore = Math.max(0, 100 - duplicateRisk);

    // Calculate baseline weighted average
    let overallScore = 
      (structureScore * weights.structure) +
      (grammarScore * weights.grammar) +
      (completenessScore * weights.completeness) +
      (topicMatchScore * weights.topicMatch) +
      (difficultyScore * weights.difficulty) +
      (duplicateFreedomScore * weights.duplicateFreedom);

    // Apply strict non-linear penalty overrides for catastrophic quality breaks
    if (input.hasCriticalStructureError) {
      overallScore = Math.min(60, overallScore * 0.6);
    }
    if (duplicateRisk >= 90) {
      // If Level 1 or Level 2 duplicate found, cap overall quality score severely below approval threshold
      overallScore = Math.min(45, overallScore * 0.5);
    }

    // Round scores to clean whole integers
    return {
      grammarScore: Math.round(grammarScore),
      difficultyScore: Math.round(difficultyScore),
      topicMatchScore: Math.round(topicMatchScore),
      structureScore: Math.round(structureScore),
      duplicateRiskScore: Math.round(duplicateRisk),
      completenessScore: Math.round(completenessScore),
      overallQualityScore: Math.max(0, Math.min(100, Math.round(overallScore)))
    };
  }
}

module.exports = new QualityScoringEngine();
