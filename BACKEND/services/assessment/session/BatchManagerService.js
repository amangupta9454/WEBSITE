const AssessmentSession = require("../../../models/assessment/AssessmentSession");

/**
 * Component 4: Batch Manager
 * Questions are delivered in batches (default 5 questions per batch) with background prefetch coordination.
 * Coordinates question delivery ONLY; strictly does NOT calculate results or expose correct answer metadata.
 */
class BatchManagerService {
  /**
   * Retrieves a structured question delivery batch for an active session.
   * Strip any sensitive correct answer evaluation fields from the payload before sending to client.
   *
   * @param {string} sessionId - Unique session reference identifier
   * @param {number} requestedBatch - Batch sequence index (1, 2, 3...)
   * @param {string} candidateId - Security verification of requesting user
   */
  static async getQuestionBatch(sessionId, requestedBatch = 1, candidateId = null) {
    try {
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) {
        return { success: false, error: `Assessment session [${sessionId}] not found.` };
      }

      if (candidateId && session.candidateId !== candidateId && session.userId?.toString() !== candidateId) {
        return { success: false, error: "SECURITY_UNAUTHORIZED: Requester does not match session candidate identity." };
      }

      if (session.status === "Expired" || session.status === "Cancelled" || session.isLocked) {
        return { success: false, error: `Session is locked or terminated (${session.status}). Cannot deliver further batches.` };
      }

      const batchSize = session.configSnapshot?.batchSize || 5;
      const totalQuestions = session.questionSnapshot?.length || session.totalQuestions || 15;
      const maxBatches = Math.ceil(totalQuestions / batchSize);
      const batchNumber = Math.max(1, Math.min(requestedBatch, maxBatches));

      const startIndex = (batchNumber - 1) * batchSize;
      const endIndex = Math.min(totalQuestions, startIndex + batchSize);

      // Slice the frozen immutable question snapshot for the current batch
      const rawBatchSlice = (session.questionSnapshot || []).slice(startIndex, endIndex);

      // Map cleanly and securely, stripping any evaluating metadata
      const cleanBatchQuestions = rawBatchSlice.map((q) => {
        const matchingAnswer = (session.answers || []).find(
          (a) => a.sequenceOrder === q.sequenceOrder || a.questionId?.toString() === q.questionId?.toString()
        );

        return {
          questionId: q.questionId,
          sequenceOrder: q.sequenceOrder,
          questionText: q.questionText || `Question #${q.sequenceOrder}: Synthesized architectural problem scenario.`,
          options: q.options || ["Option A", "Option B", "Option C", "Option D"],
          difficulty: q.difficulty || "medium",
          bloomLevel: q.bloomLevel || "Apply",
          tags: q.tags || [],
          // Attach current candidate response state (no correctness evaluation!)
          savedState: {
            selectedIndex: matchingAnswer ? matchingAnswer.selectedIndex : null,
            selectedAnswer: matchingAnswer ? matchingAnswer.selectedAnswer : null,
            isAnswered: matchingAnswer ? matchingAnswer.isAnswered : false,
            isMarkedForReview: matchingAnswer ? matchingAnswer.isMarkedForReview : false,
            timeTakenSeconds: matchingAnswer ? matchingAnswer.timeTakenSeconds : 0,
          },
        };
      });

      // Advance current batch tracking if progressive
      if (batchNumber > session.currentBatch) {
        session.currentBatch = batchNumber;
        await session.save();
      }

      // Check if there is a next batch available for background prefetching (Component 4)
      const hasNextBatch = batchNumber < maxBatches;
      let prefetchBatchSummary = null;
      if (hasNextBatch) {
        const prefetchStart = batchNumber * batchSize;
        const prefetchEnd = Math.min(totalQuestions, prefetchStart + batchSize);
        const prefetchSlice = (session.questionSnapshot || []).slice(prefetchStart, prefetchEnd);
        prefetchBatchSummary = {
          batchNumber: batchNumber + 1,
          count: prefetchSlice.length,
          sequenceRange: [prefetchStart + 1, prefetchEnd],
        };
      }

      return {
        success: true,
        sessionId: session.sessionId,
        currentBatch: batchNumber,
        totalBatches: maxBatches,
        batchSize: batchSize,
        totalQuestions: totalQuestions,
        questions: cleanBatchQuestions,
        hasNextBatch,
        prefetchBatchSummary,
        deliveredSource: "Frozen Immutable Snapshot (AI-First / DB Fallback)",
      };
    } catch (err) {
      console.error("[BatchManagerService] Error retrieving batch:", err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = BatchManagerService;
