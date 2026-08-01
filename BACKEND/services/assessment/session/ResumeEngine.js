const AssessmentSession = require("../../../models/assessment/AssessmentSession");
const TimerEngine = require("./TimerEngine");
const BatchManagerService = require("./BatchManagerService");

/**
 * Component 7: Resume Engine
 * Handles session restoration after browser crashes, accidental tabs closing, or connection loss.
 * Restores exact candidate state: current question index, authoritative remaining duration, saved answer selections, and review flags.
 * Enforces NO RESTART policy; timer ticks from server initial commencement.
 */
class ResumeEngine {
  /**
   * Resumes an existing uncompleted assessment session for a candidate.
   *
   * @param {string} sessionId
   * @param {string} candidateId
   */
  static async resumeSession({ sessionId, candidateId }) {
    try {
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) {
        return { success: false, error: `Session [${sessionId}] not found in records.` };
      }

      if (candidateId && session.candidateId !== candidateId && session.userId?.toString() !== candidateId) {
        return { success: false, error: "SECURITY_UNAUTHORIZED: Requester does not match session ownership." };
      }

      if (session.isLocked || session.status === "Completed" || session.status === "Cancelled") {
        return {
          success: false,
          code: "SESSION_ENDED",
          error: `Cannot resume session because it is already locked or finalized with status [${session.status}].`,
          isLocked: session.isLocked,
          status: session.status,
        };
      }

      // Check authoritative server clock (Component 5)
      const timerCheck = await TimerEngine.checkTimerAndHeartbeat(sessionId, { registerHeartbeat: true, candidateId });
      if (!timerCheck.success || timerCheck.timer.isExpired) {
        return {
          success: false,
          code: "SESSION_EXPIRED",
          error: "Assessment timer has expired while disconnected. Answers have been locked and submitted automatically.",
          status: "Expired",
          timer: timerCheck.timer,
        };
      }

      // Transition state back to Running if paused or idle (Component 8)
      const previousStatus = session.status;
      session.status = "Running";
      session.connectionStatus = "Recovered";

      // Log Resume event on immutable timeline (Component 11)
      session.timeline.push({
        eventId: `EVT-${Date.now()}-RES`,
        eventType: "Resume",
        timestamp: new Date(),
        details: {
          previousStatus,
          currentQuestionIndex: session.currentQuestionIndex || 0,
          remainingSeconds: timerCheck.timer.remainingSeconds,
          message: "Candidate resumed session. State and answer flags restored.",
        },
      });

      await session.save();

      // Retrieve first/current question batch to deliver to client interface
      const batchNumber = session.currentBatch || 1;
      const batchData = await BatchManagerService.getQuestionBatch(sessionId, batchNumber, candidateId);

      // Extract saved answers state map for Question Palette (Component 9)
      const paletteSummary = (session.answers || []).map((a) => ({
        sequenceOrder: a.sequenceOrder,
        questionId: a.questionId,
        isAnswered: a.isAnswered,
        isMarkedForReview: a.isMarkedForReview,
        selectedIndex: a.selectedIndex,
        timeTakenSeconds: a.timeTakenSeconds,
      }));

      return {
        success: true,
        sessionId: session.sessionId,
        status: session.status,
        attemptNumber: session.attemptNumber,
        currentQuestionIndex: session.currentQuestionIndex || 0,
        timer: timerCheck.timer,
        configSnapshot: session.configSnapshot,
        questionPalette: paletteSummary,
        currentBatchData: batchData.success ? batchData : null,
        message: "Session successfully restored. No timer reset performed.",
      };
    } catch (err) {
      console.error("[ResumeEngine] Error resuming session:", err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = ResumeEngine;
