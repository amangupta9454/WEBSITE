const JobManager = require("../../services/assessment/orchestration/JobManager");
const RetryEngine = require("../../services/assessment/orchestration/RetryEngine");
const WorkerHealthMonitor = require("../../services/assessment/orchestration/WorkerHealthMonitor");
const InventoryMonitor = require("../../services/assessment/orchestration/InventoryMonitor");
const KnowledgeOptimizer = require("../../services/assessment/orchestration/KnowledgeOptimizer");
const NotificationEventService = require("../../services/assessment/orchestration/NotificationEventService");
const SchedulerService = require("../../services/assessment/orchestration/SchedulerService");

/**
 * Component 17: Security & Component 18: APIs
 * Admin-only controller governing the Autonomous Knowledge Orchestration Engine.
 * Enforces strict job payload validation and prevents unauthorized orchestration access.
 */
class OrchestrationController {
  // ── 1. Job List & Management APIs ──────────────────────────────────────────
  static async getJobsList(req, res) {
    try {
      const result = await JobManager.listJobs(req.query);
      res.json(result);
    } catch (err) {
      console.error("[OrchestrationController:getJobsList] Error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getJobDetail(req, res) {
    try {
      const result = await JobManager.getJobDetails(req.params.jobId);
      if (!result.success) return res.status(404).json(result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createNewJob(req, res) {
    try {
      const { type, priority, targetType, targetId, targetName, payload, maxRetries, retryDelays } = req.body;
      const actor = req.user?.email || "Admin_Portal";

      if (!type) {
        return res.status(400).json({ success: false, error: "SECURITY: Job type is required in payload validation." });
      }

      const result = await JobManager.createJob({
        type,
        priority: priority || "Medium",
        targetType: targetType || "Subcategory",
        targetId,
        targetName: targetName || "Domain Target",
        payload: payload || {},
        maxRetries: maxRetries !== undefined ? maxRetries : 3,
        retryDelays: retryDelays || [5, 15, 30],
        createdBy: actor,
      });

      // Automatically tick scheduler to dispatch if idle
      SchedulerService.executeTick().catch(() => {});
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async retryJob(req, res) {
    try {
      const actor = req.user?.email || "Admin_Portal";
      const result = await JobManager.retryJobNow(req.params.jobId, actor);
      if (!result.success) return res.status(400).json(result);
      SchedulerService.executeTick().catch(() => {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async cancelJob(req, res) {
    try {
      const actor = req.user?.email || "Admin_Portal";
      const result = await JobManager.cancelJob(req.params.jobId, actor);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 2. Worker Fleet & Status APIs ──────────────────────────────────────────
  static async getWorkerStatus(req, res) {
    try {
      const status = await WorkerHealthMonitor.getWorkerFleetStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async manageWorkerState(req, res) {
    try {
      const { action } = req.body; // "pause", "resume", "offline"
      const result = await WorkerHealthMonitor.toggleWorkerState(req.params.workerId, action);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 3. Inventory Status & Auto-Recovery Trigger ─────────────────────────────
  static async getInventoryHealth(req, res) {
    try {
      const status = await InventoryMonitor.getInventoryStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async triggerInventoryRecovery(req, res) {
    try {
      const report = await SchedulerService.triggerManualInventoryCycle();
      res.json(report);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 4. Dead Letter Queue (DLQ) Management APIs ──────────────────────────────
  static async getDLQList(req, res) {
    try {
      const result = await RetryEngine.getDeadLetterQueue(req.query);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async restoreDLQItem(req, res) {
    try {
      const { resetRetries } = req.body;
      const result = await RetryEngine.restoreFromDLQ(req.params.jobId, resetRetries);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async archiveDLQItem(req, res) {
    try {
      const result = await RetryEngine.archiveDLQJob(req.params.jobId);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 5. Knowledge Optimizer APIs ──────────────────────────────────────────────
  static async getOptimizerReports(req, res) {
    try {
      const reports = await KnowledgeOptimizer.getOptimizationReports(req.query);
      res.json(reports);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async triggerOptimizationScan(req, res) {
    try {
      const actor = req.user?.email || "Admin_Portal_Manual_Scan";
      const result = await KnowledgeOptimizer.runOptimizationScan(req.body?.filter || {}, actor);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 6. Notification Events & Scheduler Controls ─────────────────────────────
  static async getOrchestrationEvents(req, res) {
    try {
      const result = await NotificationEventService.getEvents(req.query);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getSchedulerState(req, res) {
    try {
      res.json(SchedulerService.getSchedulerStatus());
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async toggleSchedulerState(req, res) {
    try {
      const { action, customIntervalMs } = req.body; // "start" | "stop"
      if (action === "start") {
        res.json(SchedulerService.startScheduler(customIntervalMs || 15000));
      } else {
        res.json(SchedulerService.stopScheduler());
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = OrchestrationController;
