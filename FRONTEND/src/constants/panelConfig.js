/**
 * Configuration for the AI Panel Interview Intelligence Engine
 * Centralizes thresholds, behavior rules, and difficulty progression.
 */

export const PANEL_CONFIG = {
  DIFFICULTY_LEVELS: ["Easy", "Medium", "Hard", "Advanced", "FAANG", "Bar Raiser"],
  
  CONFIDENCE_THRESHOLDS: {
    LOW: 40,
    HIGH: 80
  },
  
  // Programmatic Good Cop / Bad Cop Rules applied in the system prompt
  MOOD_RULES: {
    SUPPORTIVE: "Supportive and encouraging. Reassure the candidate and ask simpler foundational questions.",
    NEUTRAL: "Professional and objective. Keep a steady pace.",
    CHALLENGING: "Aggressive and challenging. Drill deep into edge cases, optimization, and system scale."
  },
  
  // Helper to map metrics to an interviewer mood
  determineMood: (confidenceScore, technicalScore, difficulty, speakerName) => {
    // If Sarah (HR), she usually defaults to supportive or neutral.
    if (speakerName === "Sarah") {
      if (confidenceScore < PANEL_CONFIG.CONFIDENCE_THRESHOLDS.LOW) {
        return PANEL_CONFIG.MOOD_RULES.SUPPORTIVE;
      }
      return PANEL_CONFIG.MOOD_RULES.NEUTRAL;
    }
    
    // If David (Tech Lead), he dynamically increases pressure.
    if (speakerName === "David") {
      if (confidenceScore < PANEL_CONFIG.CONFIDENCE_THRESHOLDS.LOW) {
        return PANEL_CONFIG.MOOD_RULES.NEUTRAL; // David tones it down
      }
      if (confidenceScore >= PANEL_CONFIG.CONFIDENCE_THRESHOLDS.HIGH || 
          ["Advanced", "FAANG", "Bar Raiser"].includes(difficulty)) {
        return PANEL_CONFIG.MOOD_RULES.CHALLENGING;
      }
      return PANEL_CONFIG.MOOD_RULES.NEUTRAL;
    }
    
    return PANEL_CONFIG.MOOD_RULES.NEUTRAL;
  }
};
