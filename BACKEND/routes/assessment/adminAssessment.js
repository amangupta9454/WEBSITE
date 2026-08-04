/**
 * Admin Assessment Routes
 * All routes require admin authentication.
 * Phase 2: Category & Subcategory management, Wizard, and Dashboard stats.
 */
const express = require("express");
const router  = express.Router();
const authMiddleware  = require("../../middleware/auth");        // ← CRITICAL: Populates req.user via JWT decode
const { verifyAdmin } = require("../../middleware/verifyAdmin"); // ← Requires req.user to be set first
const groqManager     = require("../../services/assessment/GroqManager");

// Controllers
const categoryController    = require("../../controllers/assessment/categoryController");
const subcategoryController = require("../../controllers/assessment/subcategoryController");
const configController      = require("../../controllers/assessment/configController");
const aiBlueprintController = require("../../controllers/assessment/aiBlueprintController");
const aiRuntimeController   = require("../../controllers/assessment/aiRuntimeController");
const intelligenceController = require("../../controllers/assessment/questionIntelligenceController");
const questionBankController = require("../../controllers/assessment/questionBankController");
const orchestrationController = require("../../controllers/assessment/orchestrationController");
const sessionController       = require("../../controllers/assessment/sessionController");
const evaluationController    = require("../../controllers/assessment/evaluationController");
const certificateController   = require("../../controllers/assessment/certificateController");
const analyticsController     = require("../../controllers/assessment/analyticsController");
const recruiterController     = require("../../controllers/assessment/recruiterController");

// Models for Dashboard analytics
const AssessmentCategory    = require("../../models/assessment/AssessmentCategory");
const AssessmentSubcategory = require("../../models/assessment/AssessmentSubcategory");
const AssessmentQuestion    = require("../../models/assessment/AssessmentQuestion");
const AssessmentAIJob       = require("../../models/assessment/AssessmentAIJob");
const AssessmentCertificate = require("../../models/assessment/AssessmentCertificate");
const AssessmentSession     = require("../../models/assessment/AssessmentSession");

// ═══════════════════════════════════════════════════════════════════════════
// CRITICAL: Apply JWT auth middleware globally to ALL routes in this router.
// authMiddleware decodes the JWT and populates req.user BEFORE verifyAdmin
// attempts to read req.user.id. Without this, all routes return HTTP 500.
// ═══════════════════════════════════════════════════════════════════════════
router.use(authMiddleware);

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

// ── Phase 6 Question Intelligence Engine (AI Quality Gate) Routes ──────────────
router.post("/intelligence/validate-batch",             verifyAdmin, intelligenceController.validateBatch);
router.get("/intelligence/metrics",                     verifyAdmin, intelligenceController.getMetrics);
router.post("/intelligence/review-action",              verifyAdmin, intelligenceController.simulateReviewAction);
router.post("/intelligence/reset",                      verifyAdmin, intelligenceController.resetMemory);

// ── Phase 7 Question Knowledge Base Engine Routes ──────────────────────────────
router.get("/knowledge-base/stats",                     verifyAdmin, questionBankController.getRepositoryStatistics);
router.get("/knowledge-base/questions",                 verifyAdmin, questionBankController.searchQuestions);
router.get("/knowledge-base/questions/:id",             verifyAdmin, questionBankController.getQuestionDetail);
router.post("/knowledge-base/questions",                verifyAdmin, questionBankController.createQuestion);
router.put("/knowledge-base/questions/:id",             verifyAdmin, questionBankController.updateQuestion);
router.patch("/knowledge-base/questions/:id/status",    verifyAdmin, questionBankController.moderateStatus);
router.post("/knowledge-base/bulk-status",              verifyAdmin, questionBankController.bulkModerateStatus);
router.post("/knowledge-base/import",                   verifyAdmin, questionBankController.importQuestions);
router.post("/knowledge-base/semantic-test",            verifyAdmin, questionBankController.testSemanticDiscovery);
router.get("/knowledge-base/audits",                    verifyAdmin, questionBankController.getAudits);
// Legacy compatibility mapping:
router.get("/questions",                                verifyAdmin, questionBankController.searchQuestions);
// ── Phase 8 Autonomous Knowledge Orchestration Engine Routes ────────────────────
router.get("/orchestration/jobs",                       verifyAdmin, orchestrationController.getJobsList);
router.post("/orchestration/jobs",                      verifyAdmin, orchestrationController.createNewJob);
router.get("/orchestration/jobs/:jobId",                verifyAdmin, orchestrationController.getJobDetail);
router.post("/orchestration/jobs/:jobId/retry",         verifyAdmin, orchestrationController.retryJob);
router.post("/orchestration/jobs/:jobId/cancel",        verifyAdmin, orchestrationController.cancelJob);

router.get("/orchestration/workers",                    verifyAdmin, orchestrationController.getWorkerStatus);
router.post("/orchestration/workers/:workerId/state",   verifyAdmin, orchestrationController.manageWorkerState);

router.get("/orchestration/inventory",                  verifyAdmin, orchestrationController.getInventoryHealth);
router.post("/orchestration/inventory/trigger-recovery", verifyAdmin, orchestrationController.triggerInventoryRecovery);

router.get("/orchestration/dlq",                        verifyAdmin, orchestrationController.getDLQList);
router.post("/orchestration/dlq/:jobId/restore",        verifyAdmin, orchestrationController.restoreDLQItem);
router.delete("/orchestration/dlq/:jobId",              verifyAdmin, orchestrationController.archiveDLQItem);

router.get("/orchestration/optimization-reports",       verifyAdmin, orchestrationController.getOptimizerReports);
router.post("/orchestration/optimization-scan",         verifyAdmin, orchestrationController.triggerOptimizationScan);

router.get("/orchestration/events",                     verifyAdmin, orchestrationController.getOrchestrationEvents);
router.get("/orchestration/scheduler",                  verifyAdmin, orchestrationController.getSchedulerState);
router.post("/orchestration/scheduler/state",           verifyAdmin, orchestrationController.toggleSchedulerState);
// Legacy mapping:
router.get("/jobs",                                     verifyAdmin, orchestrationController.getJobsList);

// ── Phase 9 Assessment Session Engine & Monitoring Routes ──────────────────────
router.get("/sessions",                                 verifyAdmin, sessionController.adminListSessions);
router.get("/sessions/:sessionId",                      verifyAdmin, sessionController.adminGetSessionAudit);
// Also bind test harness start/resume for admins directly testing in admin panel:
router.post("/sessions/start",                          verifyAdmin, sessionController.createSession);
router.post("/sessions/:sessionId/resume",              verifyAdmin, sessionController.resumeSession);
router.get("/sessions/:sessionId/batch/:batchNumber",   verifyAdmin, sessionController.getNextBatch);
router.post("/sessions/:sessionId/autosave",            verifyAdmin, sessionController.autosave);
router.post("/sessions/:sessionId/submit",              verifyAdmin, sessionController.submitSession);
router.post("/sessions/:sessionId/anti-cheat",          verifyAdmin, sessionController.recordAntiCheatEvent);
router.post("/sessions/:sessionId/heartbeat",           verifyAdmin, sessionController.heartbeat);

// ── Phase 10 Result Evaluation & Scoring Engine Routes ─────────────────────────
router.post("/evaluate/:sessionId",                     verifyAdmin, evaluationController.evaluateSession);
router.get("/evaluations/queue",                        verifyAdmin, evaluationController.adminGetEvaluationQueue);
router.post("/evaluations/bulk",                        verifyAdmin, evaluationController.adminTriggerBulkEvaluation);
router.get("/results/:identifier",                      verifyAdmin, evaluationController.getResult);
router.get("/results/:identifier/topics",               verifyAdmin, evaluationController.getTopicAnalysis);
router.get("/results/:identifier/difficulty",            verifyAdmin, evaluationController.getDifficultyAnalysis);
router.get("/results/:identifier/bloom",                verifyAdmin, evaluationController.getBloomAnalysis);
router.get("/results/:identifier/anti-cheat",           verifyAdmin, evaluationController.getAntiCheatSummary);
router.get("/results/:identifier/metadata",             verifyAdmin, evaluationController.getEvaluationMetadata);

// ── Phase 11 Credential & Certificate Engine Routes ────────────────────────────
router.get("/certificates",                           verifyAdmin, certificateController.listCertificates);
router.get("/certificates/stats/overview",            verifyAdmin, certificateController.getStatistics);
router.post("/certificates/generate/:sessionIdOrResultId", verifyAdmin, certificateController.generateCertificate);
router.post("/certificates/bulk-generate",            verifyAdmin, certificateController.bulkGenerate);

// Category Level AI Generation
router.post("/categories/:categoryId/generate-ai-questions", verifyAdmin, questionBankController.generateOnDemandAIQuestions);
router.get("/certificates/:id",                       verifyAdmin, certificateController.getCertificate);
router.post("/certificates/:id/revoke",               verifyAdmin, certificateController.revokeCertificate);
router.post("/certificates/:id/restore",              verifyAdmin, certificateController.restoreCertificate);
router.post("/certificates/:id/reissue",              verifyAdmin, certificateController.reissueCertificate);

// ── Phase 13 Enterprise Analytics & Intelligence Platform (Read-Only) ────────
router.get("/analytics/overview",                     verifyAdmin, analyticsController.getGlobalDashboard);
router.get("/analytics/assessments",                  verifyAdmin, analyticsController.getAssessmentAnalytics);
router.get("/analytics/assessments/:id",              verifyAdmin, analyticsController.getAssessmentDetail);
router.get("/analytics/students",                     verifyAdmin, analyticsController.getStudentAnalytics);
router.get("/analytics/students/:candidateId",          verifyAdmin, analyticsController.getStudentDetail);
router.get("/analytics/categories",                   verifyAdmin, analyticsController.getCategoryAnalytics);
router.get("/analytics/questions",                    verifyAdmin, analyticsController.getQuestionAnalytics);
router.get("/analytics/runtime",                      verifyAdmin, analyticsController.getRuntimeAnalytics);
router.get("/analytics/certificates",                 verifyAdmin, analyticsController.getCertificateAnalytics);
router.get("/analytics/trends",                       verifyAdmin, analyticsController.getTrendAnalytics);
router.get("/analytics/export",                       verifyAdmin, analyticsController.exportAnalytics);

// ── Phase 14 Recruiter Verification Platform (Read-Only) ─────────────────────
router.get("/recruiter/dashboard",                      verifyAdmin, (req, res) => recruiterController.getDashboard(req, res));
router.get("/recruiter/search",                         verifyAdmin, (req, res) => recruiterController.search(req, res));
router.get("/recruiter/history",                        verifyAdmin, (req, res) => recruiterController.getHistory(req, res));
router.get("/recruiter/export",                         verifyAdmin, (req, res) => recruiterController.exportReport(req, res));
router.get("/recruiter/candidate/:id",                  verifyAdmin, (req, res) => recruiterController.getCandidate(req, res));
router.get("/recruiter/certificate/:id",                verifyAdmin, (req, res) => recruiterController.getCertificate(req, res));

module.exports = router;
