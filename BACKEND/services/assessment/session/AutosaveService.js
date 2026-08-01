const AssessmentSession = require("../../../models/assessment/AssessmentSession");

/**
 * Component 6: Autosave & Component 13: Offline Resilience
 * Handles real-time automatic saving of answer selections, question review tags, and time durations.
 * Supports processing batches of locally queued autosave responses to guarantee zero answer loss during temporary network disconnects.
 * STRICTLY does NOT evaluate answers or calculate scores (deferred to Phase 10).
 */
class AutosaveService {
  /**
   * Autosaves one or more candidate answer actions into the active session.
   *
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.candidateId
   * @param {Array|Object} params.updates - Array of { sequenceOrder, questionId, selectedIndex, selectedAnswer, isMarkedForReview, timeTakenSeconds }
   * @param {number} params.currentQuestionIndex - Navigation pointer index (Component 9)
   */
  static async executeAutosave({ sessionId, candidateId, updates, currentQuestionIndex = null }) {
    try {
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) {
        return { success: false, error: `Session [${sessionId}] not found.` };
      }

      if (candidateId && session.candidateId !== candidateId && session.userId?.toString() !== candidateId) {
        return { success: false, error: "SECURITY_UNAUTHORIZED: Candidate ID mismatch." };
      }

      // Component 17: Security — Prevent answer tampering after Submission Lock
      if (session.isLocked || ["Completed", "Expired", "Cancelled"].includes(session.status)) {
        return {
          success: false,
          code: "SESSION_LOCKED",
          error: "Session has already been locked or submitted. Further answer modifications are forbidden by security policy.",
          isLocked: true,
        };
      }

      const updatesArray = Array.isArray(updates) ? updates : [updates];
      if (!updatesArray.length || !updatesArray[0]) {
        return { success: false, error: "No valid answer update payload provided." };
      }

      let changesCount = 0;
      const now = new Date();

      updatesArray.forEach((upd) => {
        const idx = session.answers.findIndex(
          (ans) => ans.sequenceOrder === upd.sequenceOrder || ans.questionId?.toString() === upd.questionId
        );

        if (idx !== -1) {
          const target = session.answers[idx];
          const previousSelected = target.selectedIndex;

          if (upd.selectedIndex !== undefined && upd.selectedIndex !== null) {
            target.selectedIndex = Number(upd.selectedIndex);
            target.selectedAnswer = upd.selectedAnswer || `Option ${target.selectedIndex + 1}`;
            target.isAnswered = true;
          } else if (upd.selectedIndex === null && upd.selectedAnswer === null) {
            target.selectedIndex = null;
            target.selectedAnswer = null;
            target.isAnswered = false;
          }

          if (upd.isMarkedForReview !== undefined) {
            target.isMarkedForReview = Boolean(upd.isMarkedForReview);
          }

          if (upd.timeTakenSeconds !== undefined) {
            target.timeTakenSeconds = Math.max(0, (target.timeTakenSeconds || 0) + Number(upd.timeTakenSeconds));
          }

          target.lastUpdated = now;
          changesCount++;

          // Log timeline event if selection shifted (Component 11)
          if (previousSelected !== target.selectedIndex) {
            session.timeline.push({
              eventId: `EVT-${Date.now()}-ANS-${target.sequenceOrder}`,
              eventType: "Answer Changed",
              timestamp: now,
              details: {
                sequenceOrder: target.sequenceOrder,
                fromIndex: previousSelected,
                toIndex: target.selectedIndex,
                isMarkedForReview: target.isMarkedForReview,
              },
            });
          }
        }
      });

      // Update active navigation state if provided (Component 9)
      if (currentQuestionIndex !== null && !isNaN(currentQuestionIndex)) {
        const oldIndex = session.currentQuestionIndex;
        session.currentQuestionIndex = Number(currentQuestionIndex);
        if (oldIndex !== session.currentQuestionIndex) {
          session.timeline.push({
            eventId: `EVT-${Date.now()}-NAV`,
            eventType: "Question Changed",
            timestamp: now,
            details: { fromIndex: oldIndex, toIndex: session.currentQuestionIndex },
          });
        }
      }

      if (session.status === "Created" || session.status === "Initializing") {
        session.status = "Running";
      }
      session.lastHeartbeatAt = now;
      session.connectionStatus = "Healthy";

      await session.save();

      // Return real-time progress summary without evaluation
      const totalAnswered = session.answers.filter((a) => a.isAnswered).length;
      const totalMarked = session.answers.filter((a) => a.isMarkedForReview).length;

      return {
        success: true,
        sessionId: session.sessionId,
        updatedCount: changesCount,
        progress: {
          totalQuestions: session.totalQuestions || session.answers.length,
          answered: totalAnswered,
          unanswered: (session.totalQuestions || session.answers.length) - totalAnswered,
          markedForReview: totalMarked,
        },
        lastUpdated: now,
        offlineResilienceSync: true,
      };
    } catch (err) {
      console.error("[AutosaveService] Autosave failure:", err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = AutosaveService;
