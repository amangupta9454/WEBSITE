/**
 * Public Assessment Routes (no auth required)
 * Phase 14 & 15 — Recruiter Verification Platform Gateway & Production Health Probes
 */
const express = require("express");
const router  = express.Router();
const recruiterController = require("../../controllers/assessment/recruiterController");

// Phase 15 Infrastructure & Security imports
const { publicVerifyLimiter, sanitizeInput } = require("../../middleware/assessmentSecurity");
const AssessmentMonitoringEngine = require("../../services/assessment/infrastructure/AssessmentMonitoringEngine");
const AssessmentCacheEngine = require("../../services/assessment/infrastructure/AssessmentCacheEngine");
const DistributedLockManager = require("../../services/assessment/infrastructure/DistributedLockManager");

// Apply NoSQL query injection & ReDoS sanitization across all public assessment gateways
router.use(sanitizeInput);
router.use(AssessmentMonitoringEngine.requestTracingMiddleware());

// Phase 15 Enterprise Liveness and Readiness Probes (Kubernetes / PM2 / Vercel compatibility)
router.get("/health/live", (req, res) => AssessmentMonitoringEngine.getLivenessProbe(req, res));
router.get("/health/ready", async (req, res) => await AssessmentMonitoringEngine.getReadinessProbe(req, res));

// Diagnostic infrastructure status (Cache hit ratios & Lock mutex counts)
router.get("/infrastructure/diagnostics", async (req, res) => {
  try {
    const cacheStatus = AssessmentCacheEngine.getDiagnostics();
    const lockStatus = await DistributedLockManager.getLockDiagnostics();
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      cache: cacheStatus,
      distributedLocks: lockStatus,
      status: "Operational & Optimized"
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Phase 14 Public digital credential verification (rate limited, read-only caching, zero sensitive personal info)
router.get(
  "/verify/:certificateId", 
  publicVerifyLimiter, 
  AssessmentCacheEngine.routeCache("pub_verify", 300), 
  (req, res) => recruiterController.publicVerifyCertificate(req, res)
);

module.exports = router;
