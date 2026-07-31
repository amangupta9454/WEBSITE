const AssessmentCategory = require("../../models/assessment/AssessmentCategory");
const AssessmentSubcategory = require("../../models/assessment/AssessmentSubcategory");
const AssessmentConfig = require("../../models/assessment/AssessmentConfig");
const AssessmentAIBlueprint = require("../../models/assessment/AssessmentAIBlueprint");
const AssessmentQuestion = require("../../models/assessment/AssessmentQuestion");
const AssessmentSession = require("../../models/assessment/AssessmentSession");
const AssessmentAIJob = require("../../models/assessment/AssessmentAIJob");
const mongoose = require("mongoose");

// ── List Categories with Search, Filtering, Sorting, Pagination ──────────────
exports.listCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      aiEnabled = "all",
      sort = "newest",
      health = "all"
    } = req.query;

    const query = {};

    // Global search on name, slug, description
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { description: searchRegex }
      ];
    }

    // Status filter
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    // AI Enabled filter
    if (aiEnabled === "true") query.aiEnabled = true;
    if (aiEnabled === "false") query.aiEnabled = false;

    // Sorting logic
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

    // Fetch matching categories
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let categories = await AssessmentCategory.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AssessmentCategory.countDocuments(query);

    // Filter by health status in JS if requested (since healthStatus is virtual)
    if (health && health !== "all") {
      categories = categories.filter((c) => c.healthStatus.toLowerCase() === health.toLowerCase());
    }

    res.json({
      success: true,
      data: categories,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Error in listCategories:", err);
    res.status(500).json({ success: false, message: "Failed to fetch categories." });
  }
};

// ── Get Category Detail Page (Comprehensive Stats & Linked Data) ─────────────
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Category ID." });
    }

    const category = await AssessmentCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    // Fetch linked subcategories with their counts and health
    const subcategories = await AssessmentSubcategory.find({ categoryId: id }).sort({ displayOrder: 1, name: 1 });

    // Question Statistics & Difficulty distribution for this category
    const questions = await AssessmentQuestion.find({ categoryId: id, status: "approved" }, "difficulty source");
    
    const difficultyDistribution = {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0
    };

    let aiCount = 0;
    let manualCount = 0;
    let csvCount = 0;

    questions.forEach((q) => {
      if (difficultyDistribution[q.difficulty] !== undefined) {
        difficultyDistribution[q.difficulty]++;
      }
      if (q.source === "AI") aiCount++;
      else if (q.source === "manual") manualCount++;
      else if (q.source === "csv") csvCount++;
    });

    // Recent AI Jobs for this category's subcategories
    const subcatIds = subcategories.map(s => s._id);
    const recentAiJobs = await AssessmentAIJob.find({ subcategoryId: { $in: subcatIds } })
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent completed assessments
    const recentAssessments = await AssessmentSession.find({ 
      subcategoryId: { $in: subcatIds },
      status: "completed" 
    })
    .sort({ completedAt: -1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        category,
        subcategories,
        statistics: {
          totalQuestions: questions.length,
          difficultyDistribution,
          sources: {
            ai: aiCount,
            manual: manualCount,
            csv: csvCount
          },
          targetCount: category.targetQuestionCount,
          currentCount: category.currentQuestionCount,
          healthStatus: category.healthStatus,
          inventoryPercentage: category.inventoryPercentage
        },
        recentAiJobs,
        recentAssessments
      }
    });
  } catch (err) {
    console.error("Error in getCategoryById:", err);
    res.status(500).json({ success: false, message: "Failed to retrieve category details." });
  }
};

// ── Create Category (Single) ─────────────────────────────────────────────────
exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      banner,
      color,
      displayOrder,
      isActive,
      aiEnabled,
      dbFallbackEnabled,
      targetQuestionCount
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required." });
    }

    const newCategory = new AssessmentCategory({
      name,
      description,
      icon,
      banner,
      color,
      displayOrder,
      isActive: isActive !== undefined ? isActive : true,
      aiEnabled: aiEnabled !== undefined ? aiEnabled : true,
      dbFallbackEnabled: dbFallbackEnabled !== undefined ? dbFallbackEnabled : true,
      targetQuestionCount: targetQuestionCount || 1000,
      createdBy: req.admin ? req.admin.email : "admin"
    });

    await newCategory.save();
    res.status(201).json({ success: true, data: newCategory, message: "Category created successfully." });
  } catch (err) {
    console.error("Error in createCategory:", err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "A category with this slug or name already exists." });
    }
    res.status(500).json({ success: false, message: "Error creating category." });
  }
};

// ── Update Category ──────────────────────────────────────────────────────────
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedBy: req.admin ? req.admin.email : "admin" };
    delete updateData.currentQuestionCount; // Never manually modified

    const updated = await AssessmentCategory.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    res.json({ success: true, data: updated, message: "Category updated successfully." });
  } catch (err) {
    console.error("Error in updateCategory:", err);
    res.status(500).json({ success: false, message: "Failed to update category." });
  }
};

// ── Delete Category ──────────────────────────────────────────────────────────
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if subcategories or questions exist
    const subcatCount = await AssessmentSubcategory.countDocuments({ categoryId: id });
    const questionCount = await AssessmentQuestion.countDocuments({ categoryId: id });

    if (subcatCount > 0 || questionCount > 0) {
      if (req.query.force !== "true") {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category: it has ${subcatCount} subcategory(s) and ${questionCount} question(s). Enable force delete if required.`
        });
      }
      // If force delete, clean up subcategories and questions
      await AssessmentSubcategory.deleteMany({ categoryId: id });
      await AssessmentQuestion.deleteMany({ categoryId: id });
    }

    const deleted = await AssessmentCategory.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    res.json({ success: true, message: "Category and associated assets deleted successfully." });
  } catch (err) {
    console.error("Error in deleteCategory:", err);
    res.status(500).json({ success: false, message: "Failed to delete category." });
  }
};

// ── Toggle Status (Enable/Disable) ──────────────────────────────────────────
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await AssessmentCategory.findById(id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });

    category.isActive = !category.isActive;
    category.updatedBy = req.admin ? req.admin.email : "admin";
    await category.save();

    res.json({ success: true, data: category, message: `Category ${category.isActive ? "enabled" : "disabled"}.` });
  } catch (err) {
    console.error("Error in toggleStatus:", err);
    res.status(500).json({ success: false, message: "Failed to toggle status." });
  }
};

// ── Duplicate Category ───────────────────────────────────────────────────────
exports.duplicateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await AssessmentCategory.findById(id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });

    const duplicated = new AssessmentCategory({
      name: `${category.name} (Copy)`,
      description: category.description,
      icon: category.icon,
      banner: category.banner,
      color: category.color,
      displayOrder: category.displayOrder + 1,
      isActive: category.isActive,
      aiEnabled: category.aiEnabled,
      dbFallbackEnabled: category.dbFallbackEnabled,
      targetQuestionCount: category.targetQuestionCount,
      createdBy: req.admin ? req.admin.email : "admin"
    });

    await duplicated.save();

    // Optionally duplicate subcategories without questions
    const subcats = await AssessmentSubcategory.find({ categoryId: id });
    for (const sub of subcats) {
      const newSub = new AssessmentSubcategory({
        categoryId: duplicated._id,
        name: sub.name,
        description: sub.description,
        icon: sub.icon,
        isActive: sub.isActive,
        displayOrder: sub.displayOrder,
        supportedDifficulties: sub.supportedDifficulties,
        targetQuestionCount: sub.targetQuestionCount,
        createdBy: req.admin ? req.admin.email : "admin"
      });
      await newSub.save();
    }

    res.status(201).json({ success: true, data: duplicated, message: "Category duplicated successfully." });
  } catch (err) {
    console.error("Error in duplicateCategory:", err);
    res.status(500).json({ success: false, message: "Failed to duplicate category." });
  }
};

// ── Bulk Status Update ───────────────────────────────────────────────────────
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Array of Category IDs is required." });
    }

    await AssessmentCategory.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive: !!isActive, updatedBy: req.admin ? req.admin.email : "admin" } }
    );

    res.json({ success: true, message: `Successfully updated ${ids.length} categories.` });
  } catch (err) {
    console.error("Error in bulkUpdateStatus:", err);
    res.status(500).json({ success: false, message: "Bulk update failed." });
  }
};

// ── Bulk Delete ──────────────────────────────────────────────────────────────
exports.bulkDelete = async (req, res) => {
  try {
    const { ids, force } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Array of Category IDs is required." });
    }

    if (force === true) {
      await AssessmentSubcategory.deleteMany({ categoryId: { $in: ids } });
      await AssessmentQuestion.deleteMany({ categoryId: { $in: ids } });
    }

    await AssessmentCategory.deleteMany({ _id: { $in: ids } });

    res.json({ success: true, message: `Successfully deleted ${ids.length} categories.` });
  } catch (err) {
    console.error("Error in bulkDelete:", err);
    res.status(500).json({ success: false, message: "Bulk deletion failed." });
  }
};

// ── Category Creation Wizard (Multi-Step Atomic Publishing) ──────────────────
exports.createCategoryWizard = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { categoryData = {}, subcategoriesData = [] } = req.body;

    if (!categoryData.name) {
      return res.status(400).json({ success: false, message: "Category name is required in wizard." });
    }

    // Step 1: Save Category
    const newCategory = new AssessmentCategory({
      name: categoryData.name,
      description: categoryData.description || "",
      icon: categoryData.icon || "FolderTree",
      color: categoryData.color || "#6366f1",
      aiEnabled: categoryData.aiEnabled !== undefined ? categoryData.aiEnabled : true,
      dbFallbackEnabled: categoryData.dbFallbackEnabled !== undefined ? categoryData.dbFallbackEnabled : true,
      targetQuestionCount: categoryData.targetQuestionCount || 1000,
      isActive: true, // Auto-published immediately!
      createdBy: req.admin ? req.admin.email : "admin-wizard"
    });

    await newCategory.save({ session });

    const createdSubcategories = [];

    // Step 2, 3 & 4: Save Subcategories, Assessment Configs, and AI Blueprints
    for (const sub of subcategoriesData) {
      const subcatDoc = new AssessmentSubcategory({
        categoryId: newCategory._id,
        name: sub.name || "General Topic",
        description: sub.description || "",
        icon: sub.icon || "Layers",
        isActive: true,
        supportedDifficulties: sub.supportedDifficulties || ["easy", "medium", "hard", "expert"],
        targetQuestionCount: sub.targetQuestionCount || 250,
        createdBy: req.admin ? req.admin.email : "admin-wizard"
      });
      await subcatDoc.save({ session });

      // Step 3: Create default Assessment Configuration for subcategory
      const configDoc = new AssessmentConfig({
        subcategoryId: subcatDoc._id,
        totalQuestions: sub.totalQuestions || 20,
        passingPercentage: sub.passingPercentage || 70,
        timeLimitMinutes: sub.timeLimitMinutes || 30,
        difficultyDistribution: sub.difficultyDistribution || { easy: 30, medium: 40, hard: 20, expert: 10 },
        aiFirst: newCategory.aiEnabled,
        aiTimeoutSeconds: 7,
        certificateEnabled: true,
        isActive: true
      });
      await configDoc.save({ session });

      // Step 4: Create AI Prompt Blueprint
      const blueprintDoc = new AssessmentAIBlueprint({
        subcategoryId: subcatDoc._id,
        systemPrompt: sub.systemPrompt || `You are an expert evaluator in ${sub.name}. Generate enterprise-grade multiple choice questions with deep conceptual clarity, strictly validating exact options and practical application.`,
        topics: sub.topics || [sub.name, "Core Architecture", "Best Practices", "Debugging & Real-world Scenarios"],
        isActive: true
      });
      await blueprintDoc.save({ session });

      // Link references in subcategory
      subcatDoc.configId = configDoc._id;
      subcatDoc.blueprintId = blueprintDoc._id;
      await subcatDoc.save({ session });

      createdSubcategories.push(subcatDoc);
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Category and all subcategories published atomized via Wizard!",
      data: {
        category: newCategory,
        subcategoriesCount: createdSubcategories.length
      }
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in createCategoryWizard:", err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "A category or subcategory with this name/slug already exists." });
    }
    res.status(500).json({ success: false, message: "Wizard publishing failed." });
  }
};
