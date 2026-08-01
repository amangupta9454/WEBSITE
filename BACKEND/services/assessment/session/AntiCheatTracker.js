const AssessmentSession = require("../../../models/assessment/AssessmentSession");

/**
 * Component 10: Anti-Cheat Event Tracking & Component 11: Session Timeline
 * Records candidate behavior anomalies (Fullscreen Exit, Tab Switch, Copy/Paste Attempts, DevTools, Right Clicks)
 * into an immutable session event timeline with precise timestamps.
 * STRICT POLICY: Track only. Do NOT automatically disqualify or terminate attempts during Phase 9.
 */
class AntiCheatTracker {
  /**
   * Records an observed anti-cheat event into the session timeline and increments infraction tallies.
   *
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.eventType - e.g., "Fullscreen Exit", "Tab Switch", "Window Blur", "Copy Attempt", "Paste Attempt", "DevTools Detection", "Right Click"
   * @param {Object} params.details - Additional browser context or question sequence info
   * @param {string} params.candidateId
   */
  static async recordEvent({ sessionId, eventType, details = {}, candidateId = null }) {
    try {
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) {
        return { success: false, error: `Session [${sessionId}] not found.` };
      }

      if (candidateId && session.candidateId !== candidateId && session.userId?.toString() !== candidateId) {
        return { success: false, error: "SECURITY_UNAUTHORIZED: Requester does not match session ownership." };
      }

      if (session.isLocked || ["Completed", "Expired", "Cancelled"].includes(session.status)) {
        return { success: false, error: "Session closed; anti-cheat telemetry no longer active." };
      }

      const validEvents = [
        "Fullscreen Exit",
        "Tab Switch",
        "Window Blur",
        "Copy Attempt",
        "Paste Attempt",
        "DevTools Detection",
        "Right Click",
        "Multiple Screens Detected",
      ];

      const cleanEventType = validEvents.includes(eventType) ? eventType : "Window Blur";

      // Increment appropriate antiCheatSummary counter (Component 10)
      if (!session.antiCheatSummary) {
        session.antiCheatSummary = {};
      }

      if (cleanEventType === "Fullscreen Exit") session.antiCheatSummary.fullscreenExits = (session.antiCheatSummary.fullscreenExits || 0) + 1;
      if (cleanEventType === "Tab Switch") session.antiCheatSummary.tabSwitches = (session.antiCheatSummary.tabSwitches || 0) + 1;
      if (cleanEventType === "Window Blur") session.antiCheatSummary.windowBlurs = (session.antiCheatSummary.windowBlurs || 0) + 1;
      if (cleanEventType === "Copy Attempt") session.antiCheatSummary.copyAttempts = (session.antiCheatSummary.copyAttempts || 0) + 1;
      if (cleanEventType === "Paste Attempt") session.antiCheatSummary.pasteAttempts = (session.antiCheatSummary.pasteAttempts || 0) + 1;
      if (cleanEventType === "Right Click") session.antiCheatSummary.rightClicks = (session.antiCheatSummary.rightClicks || 0) + 1;
      if (cleanEventType === "DevTools Detection") session.antiCheatSummary.devToolsDetected = (session.antiCheatSummary.devToolsDetected || 0) + 1;

      const now = new Date();

      // Append immutable timeline record (Component 11)
      session.timeline.push({
        eventId: `EVT-${Date.now()}-ACT`,
        eventType: cleanEventType,
        timestamp: now,
        details: {
          ...details,
          currentQuestionIndex: session.currentQuestionIndex,
          policy: "Track only (No automatic disqualification)",
        },
      });

      await session.save();

      console.log(`[AntiCheatTracker] Recorded [${cleanEventType}] for session [${sessionId}]. Total tab switches: ${session.antiCheatSummary.tabSwitches}`);

      return {
        success: true,
        sessionId: session.sessionId,
        eventType: cleanEventType,
        timestamp: now,
        antiCheatSummary: session.antiCheatSummary,
        action: "LOGGED_NO_DISQUALIFICATION",
      };
    } catch (err) {
      console.error("[AntiCheatTracker] Error recording anti-cheat event:", err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = AntiCheatTracker;
