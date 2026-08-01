/**
 * Assessment Configuration Controller — Phase 3.1 Architecture Refinement
 * Governs zero-code evaluation rules, Question Count distributions, hierarchical inheritance,
 * advanced proctoring parameters, version histories, cloning, and bulk batch execution.
 */
const AssessmentConfig = require("../../models/assessment/AssessmentConfig");
const AssessmentSubcategory = require("../../models/assessment/AssessmentSubcategory");
const AssessmentCategory = require("../../models/assessment/AssessmentCategory");
const mongoose = require("mongoose");

/**
 * System Baseline Defaults (Refinement 1 & 2)
 * Default passing cutoffs set to 75%; difficulty distributions expressed as exact question counts (6/8/4/2 = 20).
 */
const SYSTEM_DEFAULTS = {
  totalQuestions: 20,
  passingPercentage: 75,
  timeLimitMinutes: 20,
  difficultyDistribution: { easy: 6, medium: 8, hard: 4, expert: 2 },
  assessmentType: "MCQ",
  aiFirst: true,
  aiTimeoutSeconds: 7,
  batchSize: 5,
  allowRetake: true,
  cooldownHours: 24,
  maximumAttempts: 3,
  shuffleQuestions: true,
  shuffleOptions: true,
  autoSubmit: true,
  negativeMarking: false,
  certificateEnabled: true,
  leaderboardEnabled: true,
  aiFeedbackEnabled: true,
  fullscreenRequired: true,
  maximumTabSwitches: 3,
  showResultImmediately: true,
  visibility: "Public",
  isActive: true,
  inventoryTarget: { easy: 30, medium: 40, hard: 20, expert: 10 },
  lowInventoryThreshold: 20,
};

/**
 * Helper: Retrieve or Initialize Global Baseline Configuration (Refinement 3)
 */
async function getGlobalConfig() {
  let globalConfig = await AssessmentConfig.findOne({ scope: "global" });
  if (!globalConfig) {
    globalConfig = new AssessmentConfig({
      scope: "global",
      ...SYSTEM_DEFAULTS,
    });
    await globalConfig.save();
  }
  return globalConfig;
}

/**
 * Helper: Ensure a subcategory has an associated AssessmentConfig.
 * If missing, initializes default operational test rules under "subcategory" scope.
 */
async function ensureSubcategoryConfig(subcategoryId, categoryId = null) {
  let config = await AssessmentConfig.findOne({ subcategoryId, scope: "subcategory" });
  if (!config) {
    if (!categoryId) {
      const sub = await AssessmentSubcategory.findById(subcategoryId, "categoryId");
      if (sub) categoryId = sub.categoryId;
    }
    config = new AssessmentConfig({
      scope: "subcategory",
      subcategoryId,
      categoryId,
      ...SYSTEM_DEFAULTS,
    });
    await config.save();

    await AssessmentSubcategory.findByIdAndUpdate(subcategoryId, { configId: config._id });
  }
  return config;
}

/**
 * Helper: Validate operational parameter constraints (Refinement 2 & 11)
 * Enforces Question Count sum parity against Total Questions, and strict numerical boundaries.
 */
function validateConfigParameters(data) {
  const errors = [];

  if (data.totalQuestions !== undefined && (Number(data.totalQuestions) < 5 || Number(data.totalQuestions) > 200)) {
    errors.push("Total questions must be between 5 and 200.");
  }

  if (data.passingPercentage !== undefined && (Number(data.passingPercentage) < 1 || Number(data.passingPercentage) > 100)) {
    errors.push("Passing cutoff percentage must be between 1% and 100%.");
  }

  if (data.timeLimitMinutes !== undefined && (Number(data.timeLimitMinutes) < 5 || Number(data.timeLimitMinutes) > 180)) {
    errors.push("Session time limit must be between 5 and 180 minutes.");
  }

  if (data.aiTimeoutSeconds !== undefined && (Number(data.aiTimeoutSeconds) < 3 || Number(data.aiTimeoutSeconds) > 30)) {
    errors.push("AI generation fallback timeout ceiling must be between 3 and 30 seconds.");
  }

  if (data.maximumAttempts !== undefined && (Number(data.maximumAttempts) < 1 || Number(data.maximumAttempts) > 50)) {
    errors.push("Maximum attempts must be between 1 and 50.");
  }

  if (data.cooldownHours !== undefined && (Number(data.cooldownHours) < 0 || Number(data.cooldownHours) > 720)) {
    errors.push("Cooldown hours must be between 0 and 720 hours.");
  }

  if (data.maximumTabSwitches !== undefined && (Number(data.maximumTabSwitches) < 0 || Number(data.maximumTabSwitches) > 20)) {
    errors.push("Maximum allowable tab switches must be between 0 and 20.");
  }

  if (data.assessmentType !== undefined) {
    const validTypes = ["MCQ", "Coding", "Mixed", "AI Viva", "Subjective"];
    if (!validTypes.includes(data.assessmentType)) {
      errors.push(`Assessment modality must be one of: ${validTypes.join(", ")}.`);
    }
  }

  // Refinement 2 Validation: Question count distribution sum MUST equal totalQuestions
  if (data.difficultyDistribution || data.totalQuestions !== undefined) {
    const totalQ = Number(data.totalQuestions || SYSTEM_DEFAULTS.totalQuestions);
    const diff = data.difficultyDistribution || SYSTEM_DEFAULTS.difficultyDistribution;
    const easy = Number(diff.easy) || 0;
    const medium = Number(diff.medium) || 0;
    const hard = Number(diff.hard) || 0;
    const expert = Number(diff.expert) || 0;
    const countSum = easy + medium + hard + expert;

    if (countSum !== totalQ) {
      errors.push(
        `Question distribution sum (${countSum}: ${easy} Easy, ${medium} Med, ${hard} Hard, ${expert} Exp) does not match Total Questions (${totalQ}). The distribution represents exact item counts.`
      );
    }
  }

  return errors;
}

/**
 * Helper: Record version snapshot before applying modifications (Refinement 8)
 */
function recordVersionHistory(config, updatedByEmail, summaryText) {
  const oldSnapshot = config.toObject();
  delete oldSnapshot.versionHistory;
  delete oldSnapshot._id;
  delete oldSnapshot.createdAt;
  delete oldSnapshot.updatedAt;

  const verNum = config.currentVersion || 1;
  config.versionHistory.push({
    version: verNum,
    updatedAt: new Date(),
    updatedBy: updatedByEmail || "admin",
    summary: summaryText || `Operational rule set modified (v${verNum} -> v${verNum + 1})`,
    snapshot: oldSnapshot,
  });
  config.currentVersion = verNum + 1;
}

// ──────────────────────────────────────────────────────────────────────────────
// ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/admin/assessment/configs/global
 * @desc    Fetch root system Global Configuration defaults.
 * @access  Private (Admin Only)
 */
exports.getGlobalConfigEndpoint = async (req, res) => {
  try {
    const config = await getGlobalConfig();
    res.json({ success: true, data: config, message: "Global baseline configuration retrieved successfully." });
  } catch (err) {
    console.error("Error in getGlobalConfigEndpoint:", err);
    res.status(500).json({ success: false, message: "Failed to fetch global configuration." });
  }
};

/**
 * @route   PUT /api/admin/assessment/configs/global
 * @desc    Update system-wide Global Configuration defaults.
 * @access  Private (Admin Only)
 */
exports.updateGlobalConfigEndpoint = async (req, res) => {
  try {
    const errors = validateConfigParameters(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(" ") });
    }

    let config = await getGlobalConfig();
    recordVersionHistory(config, req.admin ? req.admin.email : "admin", "Updated system global baseline defaults");

    Object.assign(config, req.body, { scope: "global" });
    await config.save();

    res.json({ success: true, data: config, message: "Global baseline configuration updated successfully." });
  } catch (err) {
    console.error("Error in updateGlobalConfigEndpoint:", err);
    res.status(500).json({ success: false, message: "Failed to update global configuration." });
  }
};

/**
 * @route   GET /api/admin/assessment/configs
 * @desc    List all subcategory domains with their attached configurations.
 *          Automatically calculates effective inheritance hierarchy (Refinement 3).
 * @access  Private (Admin Only)
 */
exports.listConfigs = async (req, res) => {
  try {
    const { categoryId = "all", page = 1, limit = 20, search = "", status = "all" } = req.query;
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

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const subcategories = await AssessmentSubcategory.find(query)
      .populate("categoryId", "name color icon slug")
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AssessmentSubcategory.countDocuments(query);
    const globalConfig = await getGlobalConfig();

    const results = await Promise.all(
      subcategories.map(async (sub) => {
        const subConfig = await ensureSubcategoryConfig(sub._id, sub.categoryId ? sub.categoryId._id : null);
        
        // Refinement 3: Compute effective merged configuration
        let categoryConfig = null;
        if (sub.categoryId) {
          categoryConfig = await AssessmentConfig.findOne({ scope: "category", categoryId: sub.categoryId._id });
        }

        const effectiveConfig = Object.assign(
          {},
          globalConfig.toObject(),
          categoryConfig ? categoryConfig.toObject() : {},
          subConfig.toObject()
        );

        return {
          subcategory: sub,
          config: subConfig,
          effectiveConfig,
        };
      })
    );

    res.json({
      success: true,
      data: results,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Error in listConfigs:", err);
    res.status(500).json({ success: false, message: "Failed to fetch assessment configurations." });
  }
};

/**
 * @route   GET /api/admin/assessment/configs/:subcategoryId
 * @desc    Fetch operational test rules and hierarchical overrides for a specific subcategory.
 * @access  Private (Admin Only)
 */
exports.getConfigBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid Subcategory ID." });
    }

    const subcategory = await AssessmentSubcategory.findById(subcategoryId)
      .populate("categoryId", "name color icon slug");

    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found." });
    }

    const config = await ensureSubcategoryConfig(subcategoryId, subcategory.categoryId ? subcategory.categoryId._id : null);
    const globalConfig = await getGlobalConfig();
    
    let categoryConfig = null;
    if (subcategory.categoryId) {
      categoryConfig = await AssessmentConfig.findOne({ scope: "category", categoryId: subcategory.categoryId._id });
    }

    const effectiveConfig = Object.assign(
      {},
      globalConfig.toObject(),
      categoryConfig ? categoryConfig.toObject() : {},
      config.toObject()
    );

    res.json({
      success: true,
      data: {
        subcategory,
        config,
        hierarchy: {
          global: globalConfig,
          category: categoryConfig || null,
          effective: effectiveConfig,
        },
      },
    });
  } catch (err) {
    console.error("Error in getConfigBySubcategory:", err);
    res.status(500).json({ success: false, message: "Failed to fetch operational configuration details." });
  }
};

/**
 * @route   PUT /api/admin/assessment/configs/:subcategoryId
 * @desc    Update operational test rules, count distribution, and proctoring controls for a subcategory.
 * @access  Private (Admin Only)
 */
exports.updateConfig = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid Subcategory ID." });
    }

    const subcategory = await AssessmentSubcategory.findById(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found." });
    }

    // Refinement 11: Validate constraints
    const errors = validateConfigParameters(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(" ") });
    }

    let config = await ensureSubcategoryConfig(subcategoryId, subcategory.categoryId);

    // Refinement 8: Archive version snapshot
    recordVersionHistory(
      config,
      req.admin ? req.admin.email : "admin",
      req.body.versionSummary || "Updated operational rules and proctoring parameters"
    );

    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.subcategoryId;
    delete updateData.scope;
    delete updateData.versionHistory;
    delete updateData.currentVersion;

    Object.assign(config, updateData);
    await config.save();

    // Synchronize subcategory link & target question count
    let subModified = false;
    if (String(subcategory.configId) !== String(config._id)) {
      subcategory.configId = config._id;
      subModified = true;
    }

    if (req.body.inventoryTarget) {
      const targetTotal =
        (Number(req.body.inventoryTarget.easy)   || 0) +
        (Number(req.body.inventoryTarget.medium) || 0) +
        (Number(req.body.inventoryTarget.hard)   || 0) +
        (Number(req.body.inventoryTarget.expert) || 0);
      if (targetTotal > 0 && subcategory.targetQuestionCount !== targetTotal) {
        subcategory.targetQuestionCount = targetTotal;
        subModified = true;
      }
    }

    if (subModified) {
      await subcategory.save();
    }

    res.json({
      success: true,
      data: config,
      message: "Assessment operational rules updated successfully.",
    });
  } catch (err) {
    console.error("Error in updateConfig:", err);
    res.status(500).json({ success: false, message: "Failed to update assessment operational rules." });
  }
};

/**
 * @route   POST /api/admin/assessment/configs/:subcategoryId/reset
 * @desc    Reset operational test rules back to system baseline defaults (75% passing, 20 Qs, etc.).
 * @access  Private (Admin Only)
 */
exports.resetConfig = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid Subcategory ID." });
    }

    const subcategory = await AssessmentSubcategory.findById(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found." });
    }

    let config = await ensureSubcategoryConfig(subcategoryId, subcategory.categoryId);

    recordVersionHistory(config, req.admin ? req.admin.email : "admin", "Reset configuration to system baseline defaults");

    Object.assign(config, SYSTEM_DEFAULTS, {
      scope: "subcategory",
      subcategoryId: subcategory._id,
      categoryId: subcategory.categoryId,
    });
    await config.save();

    subcategory.configId = config._id;
    subcategory.targetQuestionCount = 100;
    await subcategory.save();

    res.json({
      success: true,
      data: config,
      message: "Configuration successfully reset to system default operational rules.",
    });
  } catch (err) {
    console.error("Error in resetConfig:", err);
    res.status(500).json({ success: false, message: "Failed to reset operational configuration." });
  }
};

/**
 * @route   POST /api/admin/assessment/configs/:subcategoryId/clone
 * @desc    Clone operational configuration rules to target subcategory domains (Refinement 9).
 * @access  Private (Admin Only)
 */
exports.cloneConfig = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { targetSubcategoryIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(subcategoryId) || !Array.isArray(targetSubcategoryIds) || targetSubcategoryIds.length === 0) {
      return res.status(400).json({ success: false, message: "Valid source subcategory ID and non-empty target ID array required." });
    }

    const sourceConfig = await AssessmentConfig.findOne({ subcategoryId, scope: "subcategory" });
    if (!sourceConfig) {
      return res.status(404).json({ success: false, message: "Source operational configuration not found." });
    }

    const sourceData = sourceConfig.toObject();
    delete sourceData._id;
    delete sourceData.subcategoryId;
    delete sourceData.categoryId;
    delete sourceData.scope;
    delete sourceData.versionHistory;
    delete sourceData.currentVersion;
    delete sourceData.createdAt;
    delete sourceData.updatedAt;

    let successCount = 0;
    for (const targetId of targetSubcategoryIds) {
      if (!mongoose.Types.ObjectId.isValid(targetId) || String(targetId) === String(subcategoryId)) continue;

      const targetSub = await AssessmentSubcategory.findById(targetId);
      if (!targetSub) continue;

      let targetConfig = await ensureSubcategoryConfig(targetId, targetSub.categoryId);
      recordVersionHistory(
        targetConfig,
        req.admin ? req.admin.email : "admin",
        `Cloned operational parameters from domain subcategoryId: ${subcategoryId}`
      );

      Object.assign(targetConfig, sourceData);
      await targetConfig.save();

      targetSub.configId = targetConfig._id;
      await targetSub.save();
      successCount++;
    }

    res.json({
      success: true,
      message: `Successfully cloned operational test configuration to ${successCount} target domain(s).`,
    });
  } catch (err) {
    console.error("Error in cloneConfig:", err);
    res.status(500).json({ success: false, message: "Failed to clone operational configurations." });
  }
};

/**
 * @route   POST /api/admin/assessment/configs/bulk-update
 * @desc    Apply operational rule overrides across multiple subcategory domains (Refinement 10).
 * @access  Private (Admin Only)
 */
exports.bulkUpdateConfigs = async (req, res) => {
  try {
    const { subcategoryIds, updateData } = req.body;

    if (!Array.isArray(subcategoryIds) || subcategoryIds.length === 0 || !updateData || typeof updateData !== "object") {
      return res.status(400).json({ success: false, message: "Valid subcategory ID array and update data object required." });
    }

    const errors = validateConfigParameters(updateData);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(" ") });
    }

    delete updateData._id;
    delete updateData.subcategoryId;
    delete updateData.categoryId;
    delete updateData.scope;
    delete updateData.versionHistory;
    delete updateData.currentVersion;

    let updatedCount = 0;
    for (const id of subcategoryIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) continue;
      const sub = await AssessmentSubcategory.findById(id);
      if (!sub) continue;

      let config = await ensureSubcategoryConfig(id, sub.categoryId);
      recordVersionHistory(
        config,
        req.admin ? req.admin.email : "admin",
        "Bulk operation batch configuration update"
      );

      Object.assign(config, updateData);
      await config.save();
      updatedCount++;
    }

    res.json({
      success: true,
      message: `Bulk operational test configuration successfully applied to ${updatedCount} domain(s).`,
    });
  } catch (err) {
    console.error("Error in bulkUpdateConfigs:", err);
    res.status(500).json({ success: false, message: "Failed to execute bulk configuration update." });
  }
};
