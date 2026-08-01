/**
 * Admin Assessment Routes
 * All routes require admin authentication.
 * Phase 2: Category & Subcategory management, Wizard, and Dashboard stats.
 */
const express = require("express");
const router  = express.Router();
const { verifyAdmin } = require("../../middleware/verifyAdmin");
const groqManager     = require("../../services/assessment/GroqManager");

// Controllers
const categoryController    = require("../../controllers/assessment/categoryController");
const subcategoryController = require("../../controllers/assessment/subcategoryController");
const configController      = require("../../controllers/assessment/configController");
const aiBlueprintController = require("../../controllers/assessment/aiBlueprintController");
const aiRuntimeController   = require("../../controllers/assessment/aiRuntimeController");

// Models for Dashboard analytics
const AssessmentCategory    = require("../../models/assessment/AssessmentCategory");
const AssessmentSubcategory = require("../../models/assessment/AssessmentSubcategory");
const AssessmentQuestion    = require("../../models/assessment/AssessmentQuestion");
const AssessmentAIJob       = require("../../models/assessment/AssessmentAIJob");
const AssessmentCertificate = require("../../models/assessment/AssessmentCertificate");
const AssessmentSession     = require("../../models/assessment/AssessmentSession");

// ── Health Check & AI Status ───────────────────────────────────────────────
router.get("/groq/health", verifyAdmin, (req, res) => {
  res.json({
    success:     true,
    totalKeys:   groqManager.totalKeyCount,
    healthyKeys: groqManager.healthyKeyCount,
    keys:        groqManager.getHealthStatus(),
  });
});

// ── Dashboard Overview (Comprehensive Stats) ───────────────────────────────
router.get("/dashboard/stats", verifyAdmin, async (req, res) => {
  try {
    const totalCategories    = await AssessmentCategory.countDocuments();
    const totalSubcategories = await AssessmentSubcategory.countDocuments();
    const totalQuestions     = await AssessmentQuestion.countDocuments({ status: "approved" });
    const aiQuestions        = await AssessmentQuestion.countDocuments({ status: "approved", source: "AI" });
    const manualQuestions    = await AssessmentQuestion.countDocuments({ status: "approved", source: "manual" });
    const csvQuestions       = await AssessmentQuestion.countDocuments({ status: "approved", source: "csv" });

    const pendingAiJobs      = await AssessmentAIJob.countDocuments({ status: "queued" });
    const runningAiJobs      = await AssessmentAIJob.countDocuments({ status: "running" });
    const certificatesIssued = await AssessmentCertificate.countDocuments({ isRevoked: false });

    const assessmentsCompleted = await AssessmentSession.countDocuments({ status: "completed" });
    const passedSessions       = await AssessmentSession.countDocuments({ status: "completed", passed: true });

    let passRate = 0;
    let failRate = 0;
    if (assessmentsCompleted > 0) {
      passRate = Math.round((passedSessions / assessmentsCompleted) * 100);
      failRate = 100 - passRate;
    }

    res.json({
      success: true,
      stats: {
        totalCategories,
        totalSubcategories,
        totalQuestions,
        questionSources: {
          ai: aiQuestions,
          manual: manualQuestions,
          csv: csvQuestions,
        },
        aiJobs: {
          pending: pendingAiJobs,
          running: runningAiJobs,
        },
        certificatesIssued,
        assessments: {
          completed: assessmentsCompleted,
          passRate,
          failRate,
        },
        liveAiStatus: {
          healthy: groqManager.healthyKeyCount > 0,
          totalKeys: groqManager.totalKeyCount,
          healthyKeys: groqManager.healthyKeyCount,
          poolDetails: groqManager.getHealthStatus(),
        },
      },
    });
  } catch (err) {
    console.error("Error fetching assessment dashboard stats:", err);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats." });
  }
});

// ── Category Routes ────────────────────────────────────────────────────────
router.get("/categories",             verifyAdmin, categoryController.listCategories);
router.post("/categories/wizard",     verifyAdmin, categoryController.createCategoryWizard);
router.post("/categories/bulk-status",verifyAdmin, categoryController.bulkUpdateStatus);
router.post("/categories/bulk-delete",verifyAdmin, categoryController.bulkDelete);
router.post("/categories",            verifyAdmin, categoryController.createCategory);
router.get("/categories/:id",         verifyAdmin, categoryController.getCategoryById);
router.put("/categories/:id",         verifyAdmin, categoryController.updateCategory);
router.delete("/categories/:id",      verifyAdmin, categoryController.deleteCategory);
router.patch("/categories/:id/status",verifyAdmin, categoryController.toggleStatus);
router.post("/categories/:id/copy",   verifyAdmin, categoryController.duplicateCategory);

// ── Subcategory Routes ─────────────────────────────────────────────────────
router.get("/subcategories",             verifyAdmin, subcategoryController.listSubcategories);
router.post("/subcategories/bulk-status",verifyAdmin, subcategoryController.bulkUpdateStatus);
router.post("/subcategories/bulk-delete",verifyAdmin, subcategoryController.bulkDelete);
router.post("/subcategories",            verifyAdmin, subcategoryController.createSubcategory);
router.get("/subcategories/:id",         verifyAdmin, subcategoryController.getSubcategoryById);
router.put("/subcategories/:id",         verifyAdmin, subcategoryController.updateSubcategory);
router.delete("/subcategories/:id",      verifyAdmin, subcategoryController.deleteSubcategory);
router.patch("/subcategories/:id/status",verifyAdmin, subcategoryController.toggleStatus);
router.post("/subcategories/:id/copy",   verifyAdmin, subcategoryController.duplicateSubcategory);

// ── Assessment Configuration Routes (Phase 3 & 3.1) ────────────────────────
router.get("/configs",                      verifyAdmin, configController.listConfigs);
router.get("/configs/global",               verifyAdmin, configController.getGlobalConfigEndpoint);
router.put("/configs/global",               verifyAdmin, configController.updateGlobalConfigEndpoint);
router.post("/configs/bulk-update",         verifyAdmin, configController.bulkUpdateConfigs);
router.get("/configs/:subcategoryId",       verifyAdmin, configController.getConfigBySubcategory);
router.put("/configs/:subcategoryId",       verifyAdmin, configController.updateConfig);
router.post("/configs/:subcategoryId/reset",verifyAdmin, configController.resetConfig);
router.post("/configs/:subcategoryId/clone",verifyAdmin, configController.cloneConfig);

// ── AI Blueprint Management & Prompt Studio Routes (Phase 4) ───────────────
router.get("/blueprints",                             verifyAdmin, aiBlueprintController.listBlueprints);
router.post("/blueprints/validate",                   verifyAdmin, aiBlueprintController.validateBlueprint);
router.post("/blueprints/import",                     verifyAdmin, aiBlueprintController.importBlueprint);
router.post("/blueprints",                            verifyAdmin, aiBlueprintController.createBlueprint);
router.get("/blueprints/:id",                         verifyAdmin, aiBlueprintController.getBlueprintById);
router.put("/blueprints/:id",                         verifyAdmin, aiBlueprintController.updateBlueprint);
router.delete("/blueprints/:id",                      verifyAdmin, aiBlueprintController.deleteBlueprint);
router.post("/blueprints/:id/test",                   verifyAdmin, aiBlueprintController.testBlueprint);
router.post("/blueprints/:id/clone",                  verifyAdmin, aiBlueprintController.cloneBlueprint);
router.get("/blueprints/:id/export",                  verifyAdmin, aiBlueprintController.exportBlueprint);
router.get("/blueprints/:id/compare",                 verifyAdmin, aiBlueprintController.compareVersions);
router.post("/blueprints/:id/versions/:versionNumber/activate", verifyAdmin, aiBlueprintController.activateVersion);
router.post("/blueprints/:id/rollback",               verifyAdmin, (req, res) => {
  req.params.versionNumber = req.body.version || req.query.version || "1";
  return aiBlueprintController.activateVersion(req, res);
});

// ── Phase 4.1 AI Runtime Decoupled Architecture & Reusable Libraries ─────────
router.get("/runtime/libraries",                      verifyAdmin, aiRuntimeController.getRuntimeLibraries);
router.post("/runtime/resolve",                       verifyAdmin, aiRuntimeController.resolveRuntimePreview);
router.post("/runtime/variables",                     verifyAdmin, aiRuntimeController.saveLibraryVariable);
router.post("/runtime/schemas",                       verifyAdmin, aiRuntimeController.saveLibrarySchema);
router.post("/runtime/assignments",                   verifyAdmin, aiRuntimeController.saveBlueprintAssignment);
router.post("/runtime/configs",                       verifyAdmin, aiRuntimeController.saveRuntimeConfig);

// ── Phase 5 AI Runtime Engine & Groq Key Pool Router Routes ──────────────────
router.get("/runtime-engine/health",                  verifyAdmin, aiRuntimeController.getRuntimeEngineHealth);
router.post("/runtime-engine/test",                   verifyAdmin, aiRuntimeController.testRuntimeEngine);
router.post("/runtime-engine/cooldown-reset",          verifyAdmin, aiRuntimeController.resetPoolCooldowns);
router.get("/runtime-engine/logs",                    verifyAdmin, aiRuntimeController.getRuntimeEngineLogs);

// ── Placeholders (Future Phases) ───────────────────────────────────────────
router.get("/questions",    verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 7" }));
router.get("/jobs",         verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 8" }));
router.get("/certificates", verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 11" }));
router.get("/analytics/overview", verifyAdmin, (req, res) => res.json({ success: true, data: {}, message: "Phase 13" }));

module.exports = router;
