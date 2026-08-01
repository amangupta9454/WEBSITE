const JobManager = require("./JobManager");
const RetryEngine = require("./RetryEngine");
const WorkerHealthMonitor = require("./WorkerHealthMonitor");
const InventoryMonitor = require("./InventoryMonitor");
const DistributedLockingService = require("./DistributedLockingService");

/**
 * Component 2: Scheduler & Component 16: Performance Optimization
 * Scheduler architecture supporting future plug-and-play extensions (Cron, BullMQ, Redis, RabbitMQ)
 * while currently implementing an internal event-driven timed execution engine requiring zero external dependencies.
 */
class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.intervalHandle = null;
    this.tickIntervalMs = 15000; // 15 seconds internal processing cadence
    this.driverType = "INTERNAL_MEMORY_ENGINE"; // Prepared for "BULL_MQ", "REDIS_QUEUE", "RABBIT_MQ", "CRON"
  }

  /**
   * Initializes the autonomous scheduler daemon.
   */
  startScheduler(customIntervalMs = 15000) {
    if (this.isRunning) {
      console.log("[SchedulerService] Autonomous orchestrator scheduler is already running.");
      return { success: false, message: "Already active." };
    }

    this.tickIntervalMs = customIntervalMs;
    this.isRunning = true;

    // Proactively initialize worker nodes
    WorkerHealthMonitor.initializeDefaultWorkers().catch((e) => console.error(e));

    // Internal processing loop avoiding unnecessary high-frequency polling (Component 16)
    this.intervalHandle = setInterval(async () => {
      await this.executeTick();
    }, this.tickIntervalMs);

    console.log(`[SchedulerService] 🚀 Autonomous Knowledge Orchestration Engine started (Driver: ${this.driverType} | Cadence: ${this.tickIntervalMs}ms)`);
    return { success: true, status: "RUNNING", driver: this.driverType, cadenceMs: this.tickIntervalMs };
  }

  /**
   * Stops the autonomous internal scheduler.
   */
  stopScheduler() {
    if (!this.isRunning || !this.intervalHandle) {
      return { success: false, message: "Scheduler is currently inactive." };
    }

    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
    this.isRunning = false;
    console.log("[SchedulerService] ⏸️ Autonomous Knowledge Orchestration Engine halted.");
    return { success: true, status: "HALTED" };
  }

  /**
   * Executes a single synchronized operational orchestration tick.
   * Performs Lock Cleanup -> Retry Evaluation -> Job Dispatch -> Worker Fleet Diagnostics.
   */
  async executeTick() {
    try {
      // 1. Clean up stale locks (Component 7 & Component 16 Lock Management)
      await DistributedLockingService.cleanupStaleLocks();

      // 2. Re-queue expired retry attempts (Component 6)
      await RetryEngine.requeueReadyRetries();

      // 3. Dispatch highest priority queued job to available worker node (Component 1 & Component 5)
      await JobManager.dispatchNextJob();

      // 4. Verify worker heartbeat health (Component 8)
      await WorkerHealthMonitor.checkWorkerHealth();
    } catch (error) {
      console.error("[SchedulerService:executeTick] Internal scheduler error:", error.message);
    }
  }

  /**
   * Manually triggers an immediate comprehensive inventory health evaluation and recovery dispatch.
   */
  async triggerManualInventoryCycle() {
    const report = await InventoryMonitor.scanInventoryAndReplenish({ triggerJobs: true });
    // Immediately tick to begin dispatching newly created jobs
    await this.executeTick();
    return { success: true, message: "Manual inventory recovery cycle completed.", inventoryReport: report };
  }

  /**
   * Retrieves operational state and configuration of the scheduler engine.
   */
  getSchedulerStatus() {
    return {
      success: true,
      status: this.isRunning ? "RUNNING" : "STOPPED",
      driver: this.driverType,
      supportedExternalDrivers: ["Cron", "BullMQ", "Redis", "RabbitMQ"],
      intervalMs: this.tickIntervalMs,
      lastTimestamp: new Date().toISOString(),
    };
  }
}

module.exports = new SchedulerService();
