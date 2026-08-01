/**
 * Component 10: Anti-Cheat Summary Engine
 * Aggregates candidate behavior anomalies tracked in Phase 9 into an administrative risk appraisal.
 * STRICT POLICY: Summarization only. Do NOT execute disqualification or invalidate scores during Phase 10.
 */
class AntiCheatSummaryEngine {
  /**
   * Summarizes anti-cheat telemetry events and calculates a deterministic risk level rating.
   *
   * @param {Object} rawSummary - antiCheatSummary taken from Evaluation Package
   * @returns {Object} Structured risk summary object
   */
  static summarize(rawSummary = {}) {
    const tabSwitches = Number(rawSummary.tabSwitches || 0);
    const fullscreenExits = Number(rawSummary.fullscreenExits || 0);
    const windowBlurs = Number(rawSummary.windowBlurs || 0);
    const copyAttempts = Number(rawSummary.copyAttempts || 0);
    const pasteAttempts = Number(rawSummary.pasteAttempts || 0);
    const devToolsEvents = Number(rawSummary.devToolsDetected || rawSummary.devToolsEvents || 0);

    const totalEvents = tabSwitches + fullscreenExits + windowBlurs + copyAttempts + pasteAttempts + devToolsEvents;

    // Rule-based Risk Level assignment
    let riskLevel = "Low";

    if (devToolsEvents > 0 || copyAttempts >= 3 || pasteAttempts >= 3 || totalEvents >= 6) {
      riskLevel = "High";
    } else if (tabSwitches >= 2 || fullscreenExits >= 2 || totalEvents >= 3) {
      riskLevel = "Medium";
    } else {
      riskLevel = "Low";
    }

    return {
      totalEvents,
      tabSwitches,
      fullscreenExits,
      copyAttempts,
      pasteAttempts,
      devToolsEvents,
      riskLevel,
      policy: "Summary Only — No Disqualification or Automatic Penalization Enforced",
      timestamp: new Date(),
    };
  }
}

module.exports = AntiCheatSummaryEngine;
