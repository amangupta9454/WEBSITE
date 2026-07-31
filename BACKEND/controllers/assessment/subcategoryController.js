const AssessmentSubcategory = require("../../models/assessment/AssessmentSubcategory");
const AssessmentCategory = require("../../models/assessment/AssessmentCategory");
const AssessmentConfig = require("../../models/assessment/AssessmentConfig");
const AssessmentAIBlueprint = require("../../models/assessment/AssessmentAIBlueprint");
const AssessmentQuestion = require("../../models/assessment/AssessmentQuestion");
const mongoose = require("mongoose");

// ── List Subcategories with Filtering, Search, Pagination ─────────────────────
exports.listSubcategories = async (req, res) => {
  try {
    const {
      categoryId = "all",
      page = 1,
      limit = 20,
      search = "",
      status = "all",
      sort = "newest"
    } = req.query;

    const query = {};

    if (categoryId !== "all" && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categoryId = categoryId;
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { slug: regex }, { description: regex }];
    }

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    let sortObj = {};
    switch (sort) {
      case "newest":          sortObj = { createdAt: -1 }; break;
      case "oldest":          sortObj = { createdAt: 1 }; break;
      case "mostQuestions":   sortObj = { currentQuestionCount: -1 }; break;
      case "leastQuestions":  sortObj = { currentQuestionCount: 1 }; break;
      case "alphabetical":    sortObj = { name: 1 }; break;
      case "recentlyUpdated": sortObj = { updatedAt: -1 }; break;
      default:                sortObj = { displayOrder: 1, createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const subcategories = await AssessmentSubcategory.find(query)
      .populate("categoryId", "name color icon slug")
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AssessmentSubcategory.countDocuments(query);

    res.json({
      success: true,
      data: subcategories,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Error in listSubcategories:", err);
    res.status(500).json({ success: false, message: "Failed to fetch subcategories." });
  }
};

// ── Get Single Subcategory by ID ──────────────────────────────────────────────
exports.getSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Subcategory ID." });
    }

    const subcategory = await AssessmentSubcategory.findById(id)
      .populate("categoryId", "name color slug")
      .populate("configId")
      .populate("blueprintId");

    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found." });
    }

    // Get question count breakdown by difficulty for this subcategory
    const questions = await AssessmentQuestion.find({ subcategoryId: id, status: "approved" }, "difficulty");
    const diffCount = { easy: 0, medium: 0, hard: 0, expert: 0 };
    questions.forEach(q => { if (diffCount[q.difficulty] !== undefined) diffCount[q.difficulty]++; });

    res.json({
      success: true,
      data: {
        subcategory,
        difficultyStats: diffCount,
        healthStatus: subcategory.healthStatus,
        inventoryPercentage: subcategory.inventoryPercentage
      }
    });
  } catch (err) {
    console.error("Error in getSubcategoryById:", err);
    res.status(500).json({ success: false, message: "Failed to fetch subcategory details." });
  }
};

// ── Create Subcategory ────────────────────────────────────────────────────────
exports.createSubcategory = async (req, res) => {
  try {
    const {
      categoryId,
      name,
      description,
      icon,
      isActive,
      displayOrder,
      supportedDifficulties,
      targetQuestionCount,
      createDefaults
    } = req.body;

    if (!categoryId || !name) {
      return res.status(400).json({ success: false, message: "Category ID and Name are required." });
    }

    const parentCategory = await AssessmentCategory.findById(categoryId);
    if (!parentCategory) {
      return res.status(404).json({ success: false, message: "Parent category not found." });
    }

    const newSubcat = new AssessmentSubcategory({
      categoryId,
      name,
      description,
      icon,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0,
      supportedDifficulties: supportedDifficulties || ["easy", "medium", "hard", "expert"],
      targetQuestionCount: targetQuestionCount || 250,
      createdBy: req.admin ? req.admin.email : "admin"
    });

    await newSubcat.save();

    // If requested or default, create linked config and blueprint
    if (createDefaults !== false) {
      const config = new AssessmentConfig({
        subcategoryId: newSubcat._id,
        totalQuestions: 20,
        passingPercentage: 70,
        timeLimitMinutes: 30,
        aiFirst: parentCategory.aiEnabled,
        certificateEnabled: true,
        isActive: true
      });
      await config.save();

      const blueprint = new AssessmentAIBlueprint({
        subcategoryId: newSubcat._id,
        systemPrompt: `You are an expert AI interviewer generating high-quality questions for ${name}. Focus on practical scenarios and conceptual depth.`,
        topics: [name, "Core Concepts", "Best Practices", "Troubleshooting"],
        isActive: true
      });
      await blueprint.save();

      newSubcat.configId = config._id;
      newSubcat.blueprintId = blueprint._id;
      await newSubcat.save();
    }

    const populated = await AssessmentSubcategory.findById(newSubcat._id).populate("categoryId", "name color icon");
    res.status(201).json({ success: true, data: populated, message: "Subcategory created successfully." });
  } catch (err) {
    console.error("Error in createSubcategory:", err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Subcategory slug/name already exists." });
    }
    res.status(500).json({ success: false, message: "Failed to create subcategory." });
  }
};

// ── Update Subcategory ────────────────────────────────────────────────────────
exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedBy: req.admin ? req.admin.email : "admin" };
    delete updateData.currentQuestionCount;

    const updated = await AssessmentSubcategory.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate("categoryId", "name color");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Subcategory not found." });
    }

    res.json({ success: true, data: updated, message: "Subcategory updated successfully." });
  } catch (err) {
    console.error("Error in updateSubcategory:", err);
    res.status(500).json({ success: false, message: "Failed to update subcategory." });
  }
};

// ── Delete Subcategory ────────────────────────────────────────────────────────
exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const questionCount = await AssessmentQuestion.countDocuments({ subcategoryId: id });

    if (questionCount > 0 && req.query.force !== "true") {
      return res.status(400).json({
        success: false,
        message: `Subcategory has ${questionCount} questions. Use force delete if required.`
      });
    }

    if (req.query.force === "true") {
      await AssessmentQuestion.deleteMany({ subcategoryId: id });
    }

    const deleted = await AssessmentSubcategory.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Subcategory not found." });
    }

    // Clean up config and blueprint
    await AssessmentConfig.deleteMany({ subcategoryId: id });
    await AssessmentAIBlueprint.deleteMany({ subcategoryId: id });

    res.json({ success: true, message: "Subcategory deleted successfully." });
  } catch (err) {
    console.error("Error in deleteSubcategory:", err);
    res.status(500).json({ success: false, message: "Failed to delete subcategory." });
  }
};

// ── Toggle Subcategory Status ────────────────────────────────────────────────
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const subcat = await AssessmentSubcategory.findById(id);
    if (!subcat) return res.status(404).json({ success: false, message: "Subcategory not found." });

    subcat.isActive = !subcat.isActive;
    subcat.updatedBy = req.admin ? req.admin.email : "admin";
    await subcat.save();

    res.json({ success: true, data: subcat, message: `Subcategory ${subcat.isActive ? "enabled" : "disabled"}.` });
  } catch (err) {
    console.error("Error in toggleStatus:", err);
    res.status(500).json({ success: false, message: "Failed to toggle status." });
  }
};

// ── Duplicate Subcategory ─────────────────────────────────────────────────────
exports.duplicateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subcat = await AssessmentSubcategory.findById(id);
    if (!subcat) return res.status(404).json({ success: false, message: "Subcategory not found." });

    const duplicated = new AssessmentSubcategory({
      categoryId: subcat.categoryId,
      name: `${subcat.name} (Copy)`,
      description: subcat.description,
      icon: subcat.icon,
      isActive: subcat.isActive,
      displayOrder: subcat.displayOrder + 1,
      supportedDifficulties: subcat.supportedDifficulties,
      targetQuestionCount: subcat.targetQuestionCount,
      createdBy: req.admin ? req.admin.email : "admin"
    });
    await duplicated.save();

    res.status(201).json({ success: true, data: duplicated, message: "Subcategory duplicated successfully." });
  } catch (err) {
    console.error("Error in duplicateSubcategory:", err);
    res.status(500).json({ success: false, message: "Failed to duplicate subcategory." });
  }
};

// ── Bulk Status Update ───────────────────────────────────────────────────────
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ success: false, message: "Array of IDs required." });

    await AssessmentSubcategory.updateMany({ _id: { $in: ids } }, { $set: { isActive: !!isActive } });
    res.json({ success: true, message: `Updated ${ids.length} subcategories.` });
  } catch (err) {
    console.error("Error in bulkUpdateStatus:", err);
    res.status(500).json({ success: false, message: "Bulk update failed." });
  }
};

// ── Bulk Delete ──────────────────────────────────────────────────────────────
exports.bulkDelete = async (req, res) => {
  try {
    const { ids, force } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ success: false, message: "Array of IDs required." });

    if (force === true) {
      await AssessmentQuestion.deleteMany({ subcategoryId: { $in: ids } });
      await AssessmentConfig.deleteMany({ subcategoryId: { $in: ids } });
      await AssessmentAIBlueprint.deleteMany({ subcategoryId: { $in: ids } });
    }

    await AssessmentSubcategory.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `Deleted ${ids.length} subcategories.` });
  } catch (err) {
    console.error("Error in bulkDelete:", err);
    res.status(500).json({ success: false, message: "Bulk delete failed." });
  }
};
