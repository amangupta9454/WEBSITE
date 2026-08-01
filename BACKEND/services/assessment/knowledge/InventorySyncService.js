const mongoose = require("mongoose");

/**
 * InventorySyncService.js — Component 8: Inventory Synchronization
 * Responsible for maintaining real-time, zero-latency consistency across Category question counts,
 * Subcategory counts, inventory health statuses, and knowledge repository source statistics.
 * Automatically triggered on persistence, lifecycle status modifications, and restorations without manual counters.
 */
class InventorySyncService {
  /**
   * Synchronizes inventory metrics for a target subcategory and category.
   * @param {string|ObjectId} subcategoryId 
   * @param {string|ObjectId} categoryId 
   * @returns {Promise<Object>} Summary of synchronization results
   */
  static async synchronize(subcategoryId, categoryId) {
    const result = {
      subcategoryId: subcategoryId || null,
      categoryId: categoryId || null,
      subcategoryUpdated: false,
      categoryUpdated: false,
      timestamp: new Date().toISOString(),
      status: "SUCCESS"
    };

    try {
      const Question    = mongoose.model("AssessmentQuestion");
      const Subcategory = mongoose.model("AssessmentSubcategory");
      const Category    = mongoose.model("AssessmentCategory");

      const activeQuery = { 
        status: { $in: ["Approved", "approved"] }, 
        isDeleted: false 
      };

      if (subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId)) {
        const count = await Question.countDocuments({ subcategoryId, ...activeQuery });
        await Subcategory.findByIdAndUpdate(subcategoryId, { currentQuestionCount: count });
        result.subcategoryUpdated = true;
        result.currentSubcategoryCount = count;
      }

      if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
        const totalCount = await Question.countDocuments({ categoryId, ...activeQuery });
        const aiCount    = await Question.countDocuments({ categoryId, ...activeQuery, createdSource: { $in: ["AI Generated", "AI", "api", "Future API"] } });
        const manualCount= await Question.countDocuments({ categoryId, ...activeQuery, createdSource: { $in: ["Manual Entry", "manual"] } });
        const csvCount   = await Question.countDocuments({ categoryId, ...activeQuery, createdSource: { $in: ["CSV Import", "csv"] } });

        await Category.findByIdAndUpdate(categoryId, {
          currentQuestionCount: totalCount,
          totalAiQuestions: aiCount,
          totalManualQuestions: manualCount,
          totalCsvQuestions: csvCount,
        });
        result.categoryUpdated = true;
        result.currentCategoryCount = totalCount;
        result.sourceDistribution = { ai: aiCount, manual: manualCount, csv: csvCount };
      }

      return result;
    } catch (err) {
      console.error("[InventorySyncService] Sync error:", err.message);
      result.status = "ERROR";
      result.error = err.message;
      return result;
    }
  }

  /**
   * Performs a comprehensive inventory re-sync across all active categories in the repository.
   */
  static async syncAllCategories() {
    try {
      const Category = mongoose.model("AssessmentCategory");
      const Subcategory = mongoose.model("AssessmentSubcategory");

      const subcategories = await Subcategory.find({ isActive: true }).select("_id categoryId");
      for (const sub of subcategories) {
        await this.synchronize(sub._id, sub.categoryId);
      }
      return { success: true, count: subcategories.length, message: "Global inventory synchronization completed." };
    } catch (err) {
      console.error("[InventorySyncService] Global sync failed:", err);
      return { success: false, error: err.message };
    }
  }
}

module.exports = InventorySyncService;
