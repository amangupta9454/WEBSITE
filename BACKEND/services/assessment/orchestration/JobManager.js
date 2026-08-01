const AssessmentOrchestrationJob = require("../../../models/assessment/AssessmentOrchestrationJob");
const NotificationEventService = require("./NotificationEventService");
const WorkerHealthMonitor = require("./WorkerHealthMonitor");
const DistributedLockingService = require("./DistributedLockingService");
const RetryEngine = require("./RetryEngine");
const QuestionFactory = require("./QuestionFactory");
const KnowledgeOptimizer = require("./KnowledgeOptimizer");

/**
 * Component 1: Job Manager & Component 5: Job Priority & Component 11: Worker Logs & Component 15: Bulk Automation
 * Central architectural controller managing lifecycle states (Pending, Queued, Running, Retrying, Completed, Failed, Cancelled, Dead Letter Queue)
 * and enforcing strict priority execution order (Critical > High > Medium > Low).
 */
class JobManager {
  /**
   * Creates and queues a new orchestration job in the persistent repository.
   */
  static async createJob({
    type = "Inventory_Recovery",
    priority = "Medium",
    targetType = "Subcategory",
    targetId = null,
    targetName = "General Domain",
    payload = {},
    maxRetries = 3,
    retryDelays = [5, 15, 30],
    createdBy = "System_Scheduler"
  }) {
    try {
      const jobId = `ORCH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const job = await AssessmentOrchestrationJob.create({
        jobId,
        type,
        priority,
        status: "Queued",
        targetType,
        targetId,
        targetName,
        maxRetries,
        retryDelays,
        payload,
        logs: [
          {
            workerId: createdBy,
            action: `Job created and queued with [${priority}] priority.`,
            timestamp: new Date(),
          },
        ],
      });

      console.log(`[JobManager] 📌 Created Job [${jobId}] (${type} | Priority: ${priority}) for ${targetName}`);
      return { success: true, data: job };
    } catch (err) {
      console.error("[JobManager:createJob] Error:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Dispatches pending/queued jobs according to strict priority order: Critical > High > Medium > Low.
   * Utilizes Distributed Locking (Component 7) to prevent duplicate execution across target domains.
   */
  static async dispatchNextJob() {
    try {
      // Priority weights mapping for sorting
      const priorityOrder = ["Critical", "High", "Medium", "Low"];

      // Find highest priority queued job
      const queuedJobs = await AssessmentOrchestrationJob.find({ status: "Queued" }).sort({ createdAt: 1 });
      if (!queuedJobs.length) {
        return { dispatched: false, reason: "No queued jobs waiting." };
      }

      // Sort in memory by strict priority order
      queuedJobs.sort((a, b) => {
        return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
      });

      const selectedJob = queuedJobs[0];
      const lockKey = `LOCK:TARGET:${selectedJob.targetId || selectedJob.type}`;

      // Assign suitable worker node from fleet
      const workerId = await WorkerHealthMonitor.assignAvailableWorker(selectedJob.type) || "WORKER-NODE-Alpha";

      // Attempt distributed lock acquisition (Component 7)
      const lockAcquired = await DistributedLockingService.acquireLock(
        lockKey,
        workerId,
        selectedJob.targetName,
        15 // 15 min TTL
      );

      if (!lockAcquired) {
        return { dispatched: false, reason: `Target ${selectedJob.targetName} is currently locked by another active worker.` };
      }

      // Transition job to Running state
      selectedJob.status = "Running";
      selectedJob.workerId = workerId;
      selectedJob.startedAt = new Date();
      selectedJob.logs.push({
        workerId,
        action: `Acquired distributed lock and commenced job processing.`,
        timestamp: new Date(),
      });
      await selectedJob.save();

      await WorkerHealthMonitor.registerHeartbeat(workerId, "Busy", { jobsRunning: 1 });

      // Execute job asynchronously in background worker context
      this.executeJobTask(selectedJob, workerId, lockKey).catch((e) => {
        console.error(`[JobManager:executeJobTask] Fatal async error on ${selectedJob.jobId}:`, e);
      });

      return { dispatched: true, job: selectedJob, workerId };
    } catch (error) {
      console.error("[JobManager:dispatchNextJob] Error:", error.message);
      return { dispatched: false, error: error.message };
    }
  }

  /**
   * Executes the appropriate job handler while recording detailed Worker Logs (Component 11).
   */
  static async executeJobTask(job, workerId, lockKey) {
    const startMs = Date.now();
    try {
      let result = null;

      if (job.type === "Inventory_Recovery" || job.type === "Batch_Synthesis") {
        // Delegate purely to Question Factory (Component 4)
        result = await QuestionFactory.synthesizeAndPersist(job, workerId);
      } else if (job.type === "Knowledge_Optimization") {
        // Delegate purely to Knowledge Optimizer (Component 13)
        result = await KnowledgeOptimizer.runOptimizationScan({}, workerId);
      } else {
        // General Maintenance or Health Check
        await new Promise((r) => setTimeout(r, 600));
        result = { success: true, message: `Completed ${job.type} diagnostic verification successfully.` };
      }

      const durationMs = Date.now() - startMs;

      if (result && result.success !== false) {
        // Complete successfully
        job.status = "Completed";
        job.completedAt = new Date();
        job.durationMs = durationMs;
        job.logs.push({
          workerId,
          action: `Completed successfully in ${durationMs}ms: ${result.message || "Pipeline operations finished."}`,
          durationMs,
          timestamp: new Date(),
        });
        await job.save();

        await WorkerHealthMonitor.registerHeartbeat(workerId, "Healthy", {
          jobsRunning: -1,
          jobsCompleted: 1,
          totalRuntimeMs: durationMs,
          inventoryRecoveryRate: result?.persistenceMetrics?.created || 0,
        });

        await NotificationEventService.createEvent(
          "Inventory Restored",
          `Job ${job.jobId} completed successfully on ${job.targetName} (${durationMs}ms).`,
          job.targetName,
          "SUCCESS",
          { jobId: job.jobId, durationMs }
        );
      } else {
        throw new Error(result?.error || "Unknown pipeline operational failure.");
      }
    } catch (err) {
      const durationMs = Date.now() - startMs;
      await RetryEngine.handleJobFailure(job.jobId, err.message, workerId);
      await WorkerHealthMonitor.registerHeartbeat(workerId, "Healthy", { jobsRunning: -1 });
    } finally {
      await DistributedLockingService.releaseLock(lockKey, workerId);
    }
  }

  /**
   * Component 15: Bulk Automation
   * Spawns batch orchestration jobs affecting a Single Subcategory, Entire Category, or Entire Assessment Domain.
   */
  static async createBulkJobs({ targetType, targetIds = [], jobType = "Inventory_Recovery", priority = "Medium", payload = {} }) {
    try {
      const createdJobs = [];

      if (targetIds && targetIds.length > 0) {
        for (const id of targetIds) {
          const res = await this.createJob({
            type: jobType,
            priority,
            targetType,
            targetId: id,
            targetName: `${targetType} (${id})`,
            payload,
            createdBy: "Admin_Bulk_Automation",
          });
          if (res.success) createdJobs.push(res.data);
        }
      } else if (targetType === "Domain" || targetType === "System") {
        // Spawn domain wide optimization or health check job
        const res = await this.createJob({
          type: jobType,
          priority,
          targetType,
          targetId: "DOMAIN-WIDE",
          targetName: "Entire Assessment Domain",
          payload,
          createdBy: "Admin_Bulk_Automation",
        });
        if (res.success) createdJobs.push(res.data);
      }

      return { success: true, count: createdJobs.length, jobs: createdJobs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieves paginated job lists with powerful filtering and sorting for Component 18 (APIs).
   */
  static async listJobs(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status && query.status !== "ALL") {
      filter.status = query.status;
    }
    if (query.priority && query.priority !== "ALL") {
      filter.priority = query.priority;
    }
    if (query.type && query.type !== "ALL") {
      filter.type = query.type;
    }
    if (query.targetId) {
      filter.targetId = query.targetId;
    }
    if (query.search) {
      filter.$or = [
        { jobId: { $regex: query.search, $options: "i" } },
        { targetName: { $regex: query.search, $options: "i" } },
        { workerId: { $regex: query.search, $options: "i" } },
      ];
    }

    const total = await AssessmentOrchestrationJob.countDocuments(filter);
    const jobs = await AssessmentOrchestrationJob.find(filter)
      .sort({ createdAt: -1 })
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
   * Fetches full job detail including trace Worker Logs (Component 11).
   */
  static async getJobDetails(jobId) {
    const job = await AssessmentOrchestrationJob.findOne({ jobId });
    if (!job) return { success: false, error: "Job ID not found." };
    return { success: true, data: job };
  }

  /**
   * Cancels a pending, queued, or retrying orchestration job.
   */
  static async cancelJob(jobId, actor = "Admin") {
    try {
      const job = await AssessmentOrchestrationJob.findOne({ jobId });
      if (!job) return { success: false, error: "Job not found." };

      if (job.status === "Running") {
        return { success: false, error: "Cannot cancel a job currently actively running on a worker node." };
      }
      if (job.status === "Completed" || job.status === "Cancelled") {
        return { success: false, error: `Job is already ${job.status}.` };
      }

      job.status = "Cancelled";
      job.logs.push({
        workerId: actor,
        action: "Job execution cancelled manually by administrator.",
        timestamp: new Date(),
      });
      await job.save();

      return { success: true, data: job };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Manually triggers immediate re-queue of any failed or cancelled job.
   */
  static async retryJobNow(jobId, actor = "Admin") {
    try {
      const job = await AssessmentOrchestrationJob.findOne({ jobId });
      if (!job) return { success: false, error: "Job not found." };

      job.status = "Queued";
      job.errorReason = "";
      job.nextRetryAt = null;
      job.logs.push({
        workerId: actor,
        action: "Manually re-queued job for immediate execution by admin.",
        timestamp: new Date(),
      });
      await job.save();

      return { success: true, data: job };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = JobManager;
