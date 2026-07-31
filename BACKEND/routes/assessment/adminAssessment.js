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

// ── Placeholders (Future Phases) ───────────────────────────────────────────
router.get("/questions",    verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 4" }));
router.get("/jobs",         verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 6" }));
router.get("/certificates", verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 9" }));
router.get("/analytics/overview", verifyAdmin, (req, res) => res.json({ success: true, data: {}, message: "Phase 11" }));

module.exports = router;
