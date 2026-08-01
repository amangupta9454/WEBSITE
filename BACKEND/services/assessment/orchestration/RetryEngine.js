const AssessmentOrchestrationJob = require("../../../models/assessment/AssessmentOrchestrationJob");
const NotificationEventService = require("./NotificationEventService");
const WorkerHealthMonitor = require("./WorkerHealthMonitor");

/**
 * Component 6: Retry Engine & Component 9: Dead Letter Queue (DLQ)
 * Implements configurable automated retry policies (Attempt 1 -> 5 min -> 15 min -> 30 min -> Dead Letter Queue)
 * without hardcoded dependencies.
 */
class RetryEngine {
  /**
   * Evaluates a failed orchestration job and applies configurable retry escalation rules.
   * @param {string} jobId - Failed Job ID.
   * @param {string} errorReason - Description of runtime failure.
   * @param {string} workerId - Worker that attempted execution.
   */
  static async handleJobFailure(jobId, errorReason, workerId = "System") {
    try {
      const job = await AssessmentOrchestrationJob.findOne({ jobId });
      if (!job) return null;

      const maxRetries = job.maxRetries ?? 3;
      const delays = job.retryDelays?.length ? job.retryDelays : [5, 15, 30];

      if (job.retries < maxRetries) {
        // Schedule retry
        const nextAttempt = job.retries + 1;
        const delayMinutes = delays[Math.min(job.retries, delays.length - 1)] || 15;
        const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        job.retries = nextAttempt;
        job.status = "Retrying";
        job.nextRetryAt = nextRetryAt;
        job.failureReason = errorReason;
        job.recoveryAction = `Scheduled Attempt #${nextAttempt} in ${delayMinutes} minutes (${nextRetryAt.toISOString()}).`;

        job.logs.push({
          workerId,
          action: `Execution failed: ${errorReason}. Scheduling retry #${nextAttempt} after ${delayMinutes}m.`,
          retries: nextAttempt,
          failureReason: errorReason,
          recoveryAction: job.recoveryAction,
          timestamp: new Date(),
        });

        await job.save();

        if (workerId !== "System") {
          await WorkerHealthMonitor.registerHeartbeat(workerId, "Healthy", { retryCount: 1, jobsFailed: 0 });
        }

        await NotificationEventService.createEvent(
          "Job Failed",
          `Job ${jobId} failed (${errorReason}). Scheduling retry #${nextAttempt} in ${delayMinutes}m.`,
          job.targetName || "Job",
          "WARNING",
          { jobId, retries: nextAttempt, delayMinutes }
        );

        return { action: "RETRY_SCHEDULED", job };
      } else {
        // Exceeded maximum retry threshold -> transition directly to Dead Letter Queue (DLQ)
        job.status = "Dead Letter Queue";
        job.failureReason = `${errorReason} (Exceeded max ${maxRetries} retries)`;
        job.recoveryAction = "Routed to independent Dead Letter Queue for manual admin investigation.";

        job.logs.push({
          workerId,
          action: `Exceeded maximum ${maxRetries} retry attempts. Transferred to Dead Letter Queue.`,
          retries: job.retries,
          failureReason: job.failureReason,
          recoveryAction: job.recoveryAction,
          timestamp: new Date(),
        });

        await job.save();

        if (workerId !== "System") {
          await WorkerHealthMonitor.registerHeartbeat(workerId, "Healthy", { jobsFailed: 1 });
        }

        await NotificationEventService.createEvent(
          "DLQ Alert",
          `Job ${jobId} exceeded ${maxRetries} retries and moved to Dead Letter Queue: ${errorReason}`,
          job.targetName || "DLQ",
          "CRITICAL",
          { jobId, maxRetries, failureReason: errorReason }
        );

        return { action: "MOVED_TO_DLQ", job };
      }
    } catch (err) {
      console.error("[RetryEngine:handleJobFailure] Error:", err.message);
      return null;
    }
  }

  /**
   * Scans for retrying jobs whose nextRetryAt timeout has elapsed and requeues them for execution.
   */
  static async requeueReadyRetries() {
    try {
      const now = new Date();
      const readyJobs = await AssessmentOrchestrationJob.find({
        status: "Retrying",
        nextRetryAt: { $lte: now },
      });

      for (const job of readyJobs) {
        job.status = "Queued";
        job.nextRetryAt = null;
        job.logs.push({
          workerId: "Scheduler-Engine",
          action: `Retry timer elapsed. Requeued job into active processing queue (Attempt #${job.retries}).`,
          retries: job.retries,
          timestamp: new Date(),
        });
        await job.save();
      }
      return { checked: true, requeued: readyJobs.length };
    } catch (err) {
      console.error("[RetryEngine:requeueReadyRetries] Error:", err.message);
      return { checked: false, error: err.message };
    }
  }

  /**
   * Retrieves all jobs residing in the Dead Letter Queue for admin review.
   */
  static async getDeadLetterQueue(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await AssessmentOrchestrationJob.countDocuments({ status: "Dead Letter Queue" });
    const jobs = await AssessmentOrchestrationJob.find({ status: "Dead Letter Queue" })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: jobs,
    };
  }

  /**
   * Admin manual intervention: Manually retries or restores a Dead Letter Queue job back to Queued status.
   */
  static async restoreFromDLQ(jobId, resetRetries = true) {
    try {
      const job = await AssessmentOrchestrationJob.findOne({ jobId });
      if (!job || job.status !== "Dead Letter Queue") {
        return { success: false, error: "Job is not in Dead Letter Queue." };
      }

      if (resetRetries) {
        job.retries = 0;
      }
      job.status = "Queued";
      job.failureReason = "";
      job.recoveryAction = "Manually restored from DLQ by Administrator.";
      job.logs.push({
        workerId: "Admin_Portal",
        action: "Manually restored from Dead Letter Queue into active execution queue.",
        retries: job.retries,
        timestamp: new Date(),
      });
      await job.save();

      await NotificationEventService.createEvent(
        "Optimization Complete",
        `Job ${jobId} manually restored from Dead Letter Queue by admin.`,
        job.targetName,
        "INFO"
      );

      return { success: true, data: job };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Archives or deletes an unrecoverable job from the DLQ.
   */
  static async archiveDLQJob(jobId) {
    try {
      const job = await AssessmentOrchestrationJob.findOneAndUpdate(
        { jobId, status: "Dead Letter Queue" },
        {
          $set: {
            status: "Cancelled",
            recoveryAction: "Permanently archived / cancelled from Dead Letter Queue by admin.",
          },
          $push: {
            logs: {
              workerId: "Admin_Portal",
              action: "Archived from Dead Letter Queue.",
              timestamp: new Date(),
            },
          },
        },
        { new: true }
      );
      if (!job) return { success: false, error: "Job not found in DLQ." };
      return { success: true, data: job };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = RetryEngine;
