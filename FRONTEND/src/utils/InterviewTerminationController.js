export class InterviewTerminationController {
  /**
   * Evaluates whether an interview termination request is valid.
   * 
   * @param {string} reason - The reason for termination (e.g., 'USER_CLICKED_END', 'VAPI_COMPLETED_STATE')
   * @param {Object} context - The context object.
   * @param {number} context.elapsedSeconds - The time elapsed in the interview in seconds.
   * @param {boolean} context.isRouterConcluded - Whether the AI or Router explicitly requested to end.
   * @returns {boolean} True if the termination should proceed, False to reject and ignore it.
   */
  static requestTermination(reason, context = {}) {
    const { elapsedSeconds = 0, isRouterConcluded = false } = context;

    console.log(`[TerminationController] Request received. Reason: ${reason}, Elapsed: ${elapsedSeconds}s`);

    if (reason === "USER_CLICKED_END") {
      console.log("[TerminationController] ALLOWED: User explicitly requested termination.");
      return true;
    }

    if (reason === "HARD_TIMEOUT_REACHED") {
      console.log("[TerminationController] ALLOWED: Hard timeout reached.");
      return true;
    }

    if (reason === "ROUTER_CONCLUDED" || isRouterConcluded) {
      console.log("[TerminationController] ALLOWED: Interview explicitly concluded by AI/Router.");
      return true;
    }

    if (reason === "VAPI_COMPLETED_STATE") {
      if (isRouterConcluded) {
         console.log("[TerminationController] ALLOWED: Vapi ended naturally after Router concluded.");
         return true;
      }
      
      if (elapsedSeconds < 60) {
        console.log("[TerminationController] ALLOWED: Early abort detected (<60s). Proceeding.");
        return true;
      }

      // If we reach here, Vapi disconnected or threw a COMPLETED state without explicit router conclusion
      // and it's past the 1-minute mark. This is likely the rogue 10-minute Squad limit bug.
      console.warn(`[TerminationController] REJECTED: Rogue Vapi disconnect/COMPLETED state detected at ${elapsedSeconds}s without explicit AI conclusion. Ignored to prevent premature termination.`);
      return false; 
    }

    console.warn(`[TerminationController] REJECTED: Unknown or invalid termination reason: ${reason}`);
    return false;
  }
}
