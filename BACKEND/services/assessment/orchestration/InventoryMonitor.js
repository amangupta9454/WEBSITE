const mongoose = require("mongoose");
const NotificationEventService = require("./NotificationEventService");
const JobManager = require("./JobManager");

/**
 * Component 3: Inventory Monitor & Component 14: Inventory Dashboard Data Feeder
 * Continuously monitors every Category and Subcategory across Target Question Count vs Current Question Count to compute Inventory Health.
 * STRICT ARCHITECTURAL MANDATE: Never generate questions directly. If inventory falls below threshold, automatically create Inventory Jobs via Job Manager.
 */
class InventoryMonitor {
  /**
   * Scans all subcategories to calculate real-time inventory health and triggers high/critical priority replenishment jobs where deficits exist.
   * @param {Object} options - { triggerJobs: true, healthThreshold: 80 }
   */
  static async scanInventoryAndReplenish(options = { triggerJobs: false, healthThreshold: 80 }) {
    const Subcategory = mongoose.model("AssessmentSubcategory");
    const Question = mongoose.model("AssessmentQuestion");
    const OrchestrationJob = mongoose.model("AssessmentOrchestrationJob");

    try {
      const subcats = await Subcategory.find({ isArchived: false, status: "Active" }).populate("categoryId", "name").lean();
      if (!subcats || subcats.length === 0) {
        // Fallback or seed default targets if repository empty
        return {
          success: true,
          totalSubcategories: 0,
          averageHealth: 100,
          items: [],
          jobsCreated: 0,
        };
      }

      const inventoryItems = [];
      let totalHealthSum = 0;
      let jobsCreatedCount = 0;

      for (const sub of subcats) {
        const subId = sub._id.toString();
        const targetCount = sub.targetQuestionCount || sub.questionCount || 20;

        // Count verified active approved items
        const currentCount = await Question.countDocuments({
          subcategoryId: subId,
          isDeleted: false,
          status: { $in: ["Approved", "approved"] },
        });

        const healthPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));
        totalHealthSum += healthPercent;

        let status = "OPTIMAL";
        if (healthPercent < 40) status = "CRITICAL";
        else if (healthPercent < (options.healthThreshold || 80)) status = "LOW";

        const item = {
          subcategoryId: subId,
          subcategoryName: sub.name,
          categoryName: sub.categoryId?.name || "Unassigned",
          targetCount,
          currentCount,
          deficit: Math.max(0, targetCount - currentCount),
          healthPercent,
          status,
          hasActiveJob: false,
        };

        // Check if an active recovery job is already running or queued for this target
        const existingJob = await OrchestrationJob.findOne({
          targetId: subId,
          status: { $in: ["Pending", "Queued", "Running", "Retrying"] },
        });

        if (existingJob) {
          item.hasActiveJob = true;
          item.activeJobId = existingJob.jobId;
        } else if (status === "LOW" || status === "CRITICAL") {
          await NotificationEventService.createEvent(
            "Inventory Low",
            `Subcategory [${sub.name}] inventory fell below target threshold (${currentCount}/${targetCount} items | Health: ${healthPercent}%).`,
            sub.name,
            status === "CRITICAL" ? "CRITICAL" : "WARNING",
            { subcategoryId: subId, currentCount, targetCount, healthPercent }
          );

          // If auto-triggering is enabled, create high/critical priority inventory recovery job
          if (options.triggerJobs) {
            const priority = status === "CRITICAL" ? "Critical" : "High";
            const res = await JobManager.createJob({
              type: "Inventory_Recovery",
              priority,
              targetType: "Subcategory",
              targetId: subId,
              targetName: sub.name,
              payload: {
                targetCount: item.deficit || 5,
                categoryId: sub.categoryId?._id || sub.categoryId,
                difficulty: "mixed",
              },
              createdBy: "InventoryMonitor_Automaton",
            });
            if (res.success) {
              item.hasActiveJob = true;
              item.activeJobId = res.data.jobId;
              jobsCreatedCount++;
            }
          }
        }

        inventoryItems.push(item);
      }

      const averageHealth = subcats.length > 0 ? Math.round(totalHealthSum / subcats.length) : 100;

      return {
        success: true,
        totalSubcategories: subcats.length,
        averageHealth,
        items: inventoryItems,
        jobsCreated: jobsCreatedCount,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error("[InventoryMonitor:scan] Error scanning inventory:", err.message);
      return { success: false, error: err.message, items: [], averageHealth: 0 };
    }
  }

  /**
   * Retrieves live inventory monitor feed and summary analytics for Admin Dashboard (Component 14).
   */
  static async getInventoryStatus() {
    return await this.scanInventoryAndReplenish({ triggerJobs: false });
  }
}

module.exports = InventoryMonitor;
