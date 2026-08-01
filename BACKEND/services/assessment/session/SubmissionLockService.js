const AssessmentSession = require("../../../models/assessment/AssessmentSession");
const TimerEngine = require("./TimerEngine");

/**
 * Component 12: Submission Lock & Component 8: Session States
 * Finalizes assessment attempt by freezing all candidate answers, locking session records against any further modification,
 * and preparing a structured evaluation payload for Phase 10 handoff.
 * STRICTLY DOES NOT calculate score, evaluate correctness, or generate certificates (reserved for Phase 10).
 */
class SubmissionLockService {
  /**
   * Locks and finalizes an active assessment session upon candidate submission or timer expiration.
   *
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.candidateId
   * @param {string} params.reason - "CANDIDATE_SUBMISSION" or "TIMER_EXPIRATION"
   */
  static async submitAndLock({ sessionId, candidateId = null, reason = "CANDIDATE_SUBMISSION" }) {
    try {
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) {
        return { success: false, error: `Session [${sessionId}] not found.` };
      }

      if (candidateId && session.candidateId !== candidateId && session.userId?.toString() !== candidateId) {
        return { success: false, error: "SECURITY_UNAUTHORIZED: Requester does not match session ownership." };
      }

      // Component 8: State validation — verify session isn't already closed
      if (session.isLocked || session.status === "Completed") {
        return {
          success: false,
          code: "ALREADY_SUBMITTED",
          error: `Session [${sessionId}] is already finalized and locked against modification.`,
          status: session.status,
          submittedAt: session.submittedAt,
        };
      }

      const now = new Date();

      // Validate transition through 'Submitting' state before locking
      const validOriginStates = ["Created", "Initializing", "Running", "Paused", "in_progress", "Expired"];
      if (!validOriginStates.includes(session.status)) {
        return {
          success: false,
          error: `INVALID_STATE_TRANSITION: Cannot transition from [${session.status}] to [Completed].`,
        };
      }

      // Transition to Submitting and calculate final elapsed timing
      session.status = "Submitting";
      const timerCheck = await TimerEngine.checkTimerAndHeartbeat(sessionId, { registerHeartbeat: false });
      const finalElapsedSeconds = timerCheck.success ? timerCheck.timer.elapsedSeconds : 0;

      // Freeze Answers & Lock Session (Component 12)
      session.status = reason === "TIMER_EXPIRATION" ? "Expired" : "Completed";
      session.connectionStatus = reason === "TIMER_EXPIRATION" ? "Expired" : "Healthy";
      session.isLocked = true;
      session.submittedAt = now;
      session.completedAt = now;

      // Append immutable timeline event (Component 11)
      session.timeline.push({
        eventId: `EVT-${now.getTime()}-SUB`,
        eventType: "Submit",
        timestamp: now,
        details: {
          reason: reason,
          elapsedSeconds: finalElapsedSeconds,
          totalAnswered: session.answers.filter((a) => a.isAnswered).length,
          message: "Session locked and frozen. Handoff to Phase 10 (Result Evaluation) queued.",
        },
      });

      await session.save();

      console.log(`[SubmissionLockService] ✅ Session [${sessionId}] submitted, frozen, and locked. Ready for Phase 10 evaluation.`);

      // Construct Phase 10 Handoff Payload (Strictly NO calculation performed here!)
      const phase10HandoffPayload = {
        sessionId: session.sessionId,
        userId: session.userId,
        candidateId: session.candidateId,
        subcategoryId: session.subcategoryId,
        attemptNumber: session.attemptNumber,
        configSnapshot: session.configSnapshot,
        submittedAt: session.submittedAt,
        timeTakenSeconds: finalElapsedSeconds,
        answers: session.answers,
        questionSnapshot: session.questionSnapshot,
        antiCheatSummary: session.antiCheatSummary,
        evaluationStatus: "AWAITING_PHASE_10_EVALUATION",
      };

      return {
        success: true,
        sessionId: session.sessionId,
        status: session.status,
        isLocked: session.isLocked,
        submittedAt: session.submittedAt,
        timeTakenSeconds: finalElapsedSeconds,
        summary: {
          totalQuestions: session.totalQuestions || session.answers.length,
          answeredCount: session.answers.filter((a) => a.isAnswered).length,
          unansweredCount: session.answers.filter((a) => !a.isAnswered).length,
          antiCheatInfractions: Object.values(session.antiCheatSummary || {}).reduce((a, b) => a + (Number(b) || 0), 0),
        },
        phase10Handoff: phase10HandoffPayload,
        message: "Assessment attempt completed and locked. Results evaluation will take place in Phase 10.",
      };
    } catch (err) {
      console.error("[SubmissionLockService] Error during final submission lock:", err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = SubmissionLockService;
