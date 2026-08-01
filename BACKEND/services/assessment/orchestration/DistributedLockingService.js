const AssessmentOrchestrationLock = require("../../../models/assessment/AssessmentOrchestrationLock");

/**
 * Component 7: Distributed Locking
 * Ensures exclusive job execution per target across independent worker nodes to prevent duplicate AI calls or race conditions.
 */
class DistributedLockingService {
  /**
   * Attempts to acquire a lock for a target key.
   * @param {string} lockKey - Unique target key (e.g. "LOCK:SUBCAT:64f...").
   * @param {string} workerId - Worker attempting acquisition.
   * @param {string} targetName - Human readable target designation.
   * @param {number} ttlMinutes - Expiry timeout in minutes (default 15).
   * @returns {Promise<boolean>} True if locked successfully, false if blocked by another active worker.
   */
  static async acquireLock(lockKey, workerId, targetName = "Target", ttlMinutes = 15) {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

      const existing = await AssessmentOrchestrationLock.findOne({ lockKey });
      if (existing) {
        // If existing lock has expired or was previously released, reacquire it
        if (existing.status === "RELEASED" || new Date(existing.expiresAt) < now) {
          existing.workerId = workerId;
          existing.targetName = targetName;
          existing.status = "LOCKED";
          existing.lockedAt = now;
          existing.expiresAt = expiresAt;
          await existing.save();
          return true;
        }

        // Lock is active and held by another running worker
        return false;
      }

      // Create new lock
      await AssessmentOrchestrationLock.create({
        lockKey,
        workerId,
        targetName,
        status: "LOCKED",
        lockedAt: now,
        expiresAt,
      });

      return true;
    } catch (error) {
      console.error(`[DistributedLockingService:acquireLock] Error on key ${lockKey}:`, error.message);
      return false;
    }
  }

  /**
   * Releases an acquired lock upon job completion or termination.
   * @param {string} lockKey - Target key to release.
   * @param {string} workerId - Worker releasing the lock.
   */
  static async releaseLock(lockKey, workerId) {
    try {
      const lock = await AssessmentOrchestrationLock.findOne({ lockKey });
      if (lock && (lock.workerId === workerId || new Date(lock.expiresAt) < new Date())) {
        lock.status = "RELEASED";
        await lock.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[DistributedLockingService:releaseLock] Error releasing ${lockKey}:`, error.message);
      return false;
    }
  }

  /**
   * Forcefully clears all stale or released locks for maintenance.
   */
  static async cleanupStaleLocks() {
    try {
      const now = new Date();
      await AssessmentOrchestrationLock.deleteMany({
        $or: [{ status: "RELEASED" }, { expiresAt: { $lt: now } }],
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = DistributedLockingService;
