const AssessmentWorkerNode = require("../../../models/assessment/AssessmentWorkerNode");
const NotificationEventService = require("./NotificationEventService");

/**
 * Component 8: Worker Health & Component 10: Worker Metrics
 * Manages autonomous worker registration, heartbeat tracking, status states (Healthy, Busy, Paused, Offline, Failed),
 * and computes enterprise performance metrics (Queue Length, Worker Utilization, Inventory Recovery Rate).
 */
class WorkerHealthMonitor {
  /**
   * Initializes default persistent worker nodes if none exist in the repository.
   */
  static async initializeDefaultWorkers() {
    try {
      const count = await AssessmentWorkerNode.countDocuments();
      if (count === 0) {
        const defaultWorkers = [
          {
            workerId: "WORKER-NODE-Alpha",
            status: "Healthy",
            capabilities: ["Inventory_Recovery", "Batch_Synthesis", "Bulk_Automation"],
          },
          {
            workerId: "WORKER-NODE-Beta",
            status: "Healthy",
            capabilities: ["Knowledge_Optimization", "AI_Runtime_Health_Check", "System_Maintenance"],
          },
          {
            workerId: "WORKER-NODE-Gamma",
            status: "Healthy",
            capabilities: ["Inventory_Recovery", "Knowledge_Optimization", "Batch_Synthesis"],
          },
        ];
        await AssessmentWorkerNode.insertMany(defaultWorkers);
        console.log("[WorkerHealthMonitor] Formatted 3 default autonomous worker nodes (Alpha, Beta, Gamma).");
      }
    } catch (error) {
      console.error("[WorkerHealthMonitor:init] Error initializing default workers:", error.message);
    }
  }

  /**
   * Registers a heartbeat timestamp for an active worker node.
   */
  static async registerHeartbeat(workerId, statusOverride = null, metricsUpdate = {}) {
    try {
      const worker = await AssessmentWorkerNode.findOne({ workerId });
      if (!worker) {
        return null;
      }

      worker.lastHeartbeat = new Date();
      if (statusOverride) {
        worker.status = statusOverride;
      } else if (worker.status === "Offline" || worker.status === "Failed") {
        worker.status = "Healthy";
        await NotificationEventService.createEvent(
          "Worker Offline",
          `Worker node ${workerId} restored heartbeat and returned online as Healthy.`,
          workerId,
          "SUCCESS"
        );
      }

      if (metricsUpdate) {
        for (const [key, val] of Object.entries(metricsUpdate)) {
          if (typeof worker.metrics[key] === "number" && typeof val === "number") {
            worker.metrics[key] += val;
          } else {
            worker.metrics[key] = val;
          }
        }
        if (worker.metrics.jobsCompleted > 0) {
          worker.metrics.avgRuntimeMs = Math.round(
            (worker.metrics.totalRuntimeMs || 0) / worker.metrics.jobsCompleted
          );
        }
      }

      await worker.save();
      return worker;
    } catch (error) {
      console.error(`[WorkerHealthMonitor:registerHeartbeat] Error on ${workerId}:`, error.message);
      return null;
    }
  }

  /**
   * Scans all registered worker nodes for expired heartbeats (> 3 minutes without pulse).
   */
  static async checkWorkerHealth() {
    try {
      const threshold = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes ago
      const staleWorkers = await AssessmentWorkerNode.find({
        status: { $in: ["Healthy", "Busy"] },
        lastHeartbeat: { $lt: threshold },
      });

      for (const w of staleWorkers) {
        w.status = "Offline";
        w.currentJobId = null;
        await w.save();
        await NotificationEventService.createEvent(
          "Worker Offline",
          `Worker node ${w.workerId} missed heartbeat window (> 3 min) and marked Offline.`,
          w.workerId,
          "WARNING"
        );
      }
      return { checked: true, staleOfflined: staleWorkers.length };
    } catch (error) {
      console.error("[WorkerHealthMonitor:checkWorkerHealth] Error:", error.message);
      return { checked: false, error: error.message };
    }
  }

  /**
   * Selects an optimal available worker node matching requested capabilities.
   */
  static async assignAvailableWorker(jobType) {
    try {
      const candidates = await AssessmentWorkerNode.find({
        status: "Healthy",
        capabilities: jobType,
      }).sort({ "metrics.jobsRunning": 1, lastHeartbeat: -1 });

      if (candidates.length === 0) {
        // Fallback to any healthy worker
        const anyHealthy = await AssessmentWorkerNode.findOne({ status: "Healthy" });
        if (anyHealthy) return anyHealthy.workerId;
        return null;
      }
      return candidates[0].workerId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Retrieves all worker nodes and compiled fleet-wide orchestration metrics.
   */
  static async getWorkerFleetStatus() {
    await this.initializeDefaultWorkers();
    await this.checkWorkerHealth();

    const workers = await AssessmentWorkerNode.find().sort({ workerId: 1 });
    const aggregateMetrics = {
      jobsCreated: 0,
      jobsRunning: 0,
      jobsCompleted: 0,
      jobsFailed: 0,
      retryCount: 0,
      totalRuntimeMs: 0,
      avgRuntimeMs: 0,
      queueLength: 0,
      workerUtilization: 0,
      inventoryRecoveryRate: 0,
    };

    let activeWorkers = 0;
    for (const w of workers) {
      aggregateMetrics.jobsCreated += w.metrics.jobsCreated || 0;
      aggregateMetrics.jobsRunning += w.metrics.jobsRunning || 0;
      aggregateMetrics.jobsCompleted += w.metrics.jobsCompleted || 0;
      aggregateMetrics.jobsFailed += w.metrics.jobsFailed || 0;
      aggregateMetrics.retryCount += w.metrics.retryCount || 0;
      aggregateMetrics.totalRuntimeMs += w.metrics.totalRuntimeMs || 0;
      aggregateMetrics.inventoryRecoveryRate += w.metrics.inventoryRecoveryRate || 0;

      if (w.status === "Healthy" || w.status === "Busy") {
        activeWorkers++;
      }
    }

    if (aggregateMetrics.jobsCompleted > 0) {
      aggregateMetrics.avgRuntimeMs = Math.round(aggregateMetrics.totalRuntimeMs / aggregateMetrics.jobsCompleted);
    }
    if (workers.length > 0) {
      aggregateMetrics.workerUtilization = Math.round((activeWorkers / workers.length) * 100);
    }

    return {
      success: true,
      workers,
      metrics: aggregateMetrics,
      timestamp: new Date(),
    };
  }

  /**
   * Admin control to toggle worker state (e.g. Pause / Resume / Reset).
   */
  static async toggleWorkerState(workerId, action) {
    try {
      const worker = await AssessmentWorkerNode.findOne({ workerId });
      if (!worker) return { success: false, error: "Worker not found in registry." };

      if (action === "pause") worker.status = "Paused";
      else if (action === "resume" || action === "restart") {
        worker.status = "Healthy";
        worker.lastHeartbeat = new Date();
        worker.currentJobId = null;
      } else if (action === "offline") worker.status = "Offline";

      await worker.save();
      return { success: true, data: worker };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = WorkerHealthMonitor;
