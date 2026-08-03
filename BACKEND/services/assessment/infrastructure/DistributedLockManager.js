/**
 * Phase 15 — Assessment Module Infrastructure
 * Service: DistributedLockManager.js
 * 
 * OBJECTIVE:
 * - Prevents race conditions and duplicate executions in horizontally scaled Kubernetes / PM2 / Vercel cluster environments.
 * - Provides atomic mutual exclusion (Mutex) locks for background workers (InventoryMonitor, QuestionFactory, Schedulers).
 * - Uses MongoDB atomic findOneAndUpdate with lease expiration as zero-infrastructure distributed mutex, with BullMQ/Redis readiness.
 */
const mongoose = require("mongoose");
const crypto = require("crypto");

// Minimal atomic Mongoose Schema for cluster locking
const LockSchema = new mongoose.Schema({
  lockName: { type: String, required: true, unique: true, index: true },
  ownerId:  { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });

// Avoid duplicate model compiler error in serverless reloads
const LockModel = mongoose.models.AssessmentClusterLock || mongoose.model("AssessmentClusterLock", LockSchema);

class DistributedLockManager {
  constructor() {
    this.workerInstanceId = `can-worker-${crypto.randomUUID().slice(0, 8)}-${process.pid || 1}`;
    this.activeLocks = new Set();
  }

  /**
   * Acquire atomic distributed lock for specified resource name
   */
  async acquireLock(lockName, leaseDurationSec = 60) {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (leaseDurationSec * 1000));

      // Attempt to acquire lock if it doesn't exist OR if previous lock expired (dead worker recovery)
      const result = await LockModel.findOneAndUpdate(
        {
          lockName: String(lockName),
          $or: [
            { expiresAt: { $lt: now } },
            { ownerId: this.workerInstanceId }
          ]
        },
        {
          $set: {
            ownerId: this.workerInstanceId,
            expiresAt
          }
        },
        {
          upsert: true,
          new: true,
          rawResult: true
        }
      );

      if (result && (result.value || result.lastErrorObject?.updatedExisting === false)) {
        this.activeLocks.add(lockName);
        return true;
      }
      return false;
    } catch (err) {
      // Duplicate key error (E11000) implies another active worker instance holds the non-expired lock
      if (err.code === 11000 || (err.message && err.message.includes("E11000"))) {
        return false;
      }
      console.warn(`[DistributedLockManager] Notice during acquireLock (${lockName}):`, err.message);
      return false;
    }
  }

  /**
   * Release previously acquired lock cleanly on completion
   */
  async releaseLock(lockName) {
    try {
      if (!this.activeLocks.has(lockName)) {
        return false;
      }
      const res = await LockModel.deleteOne({
        lockName: String(lockName),
        ownerId: this.workerInstanceId
      });
      this.activeLocks.delete(lockName);
      return (res.deletedCount || 0) > 0;
    } catch (err) {
      console.error(`[DistributedLockManager] Error releasing lock (${lockName}):`, err.message);
      return false;
    }
  }

  /**
   * Execute a critical section inside an automated lock boundary
   */
  async withLock(lockName, leaseSec, workerCallback) {
    const acquired = await this.acquireLock(lockName, leaseSec);
    if (!acquired) {
      // Another worker is processing this task; safely skip
      return { executed: false, reason: "LOCKED_BY_ANOTHER_CLUSTER_NODE" };
    }

    try {
      const result = await workerCallback();
      return { executed: true, result };
    } finally {
      await this.releaseLock(lockName);
    }
  }

  /**
   * Get operational diagnostics of active distributed locks
   */
  async getLockDiagnostics() {
    try {
      const activeInDb = await LockModel.find({ expiresAt: { $gte: new Date() } }).lean();
      return {
        instanceId: this.workerInstanceId,
        strategy: "MONGO_ATOMIC_LEASE (REDIS_CLUSTER_READY)",
        instanceActiveLocks: Array.from(this.activeLocks),
        clusterActiveLocksCount: activeInDb.length,
        locks: activeInDb.map(l => ({ name: l.lockName, owner: l.ownerId, expiresAt: l.expiresAt }))
      };
    } catch (err) {
      return { 
        instanceId: this.workerInstanceId, 
        strategy: "MONGO_ATOMIC_LEASE (REDIS_CLUSTER_READY)",
        status: "OFFLINE_NO_DB", 
        error: err.message 
      };
    }
  }
}

module.exports = new DistributedLockManager();
