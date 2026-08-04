const KnowledgeBaseManager = require("../../services/assessment/knowledge/KnowledgeBaseManager");

/**
 * questionBankController.js — Component 18: APIs
 * Admin-only administrative controller governing Create, Read, Versioned Update, Archive, Disable,
 * Restore, Advanced Enterprise Search, Filter, Pagination, Bulk Actions, and Ingestion framework for the Question Knowledge Base.
 */
class QuestionBankController {
  /**
   * GET /stats
   * Retrieves high-level analytics, source distributions, Bloom taxonomies, and inventory sync ratios.
   */
  static async getRepositoryStatistics(req, res) {
    try {
      const stats = await KnowledgeBaseManager.getRepositoryStatistics();
      res.json(stats);
    } catch (err) {
      console.error("[QuestionBankController:Stats] Error:", err.message);
      res.status(500).json({ success: false, error: "Failed to load repository statistics." });
    }
  }

  /**
   * GET /questions
   * Performs enterprise searches across categories, difficulty, Bloom levels, keyword queries, and tags with fast pagination.
   */
  static async searchQuestions(req, res) {
    try {
      const results = await KnowledgeBaseManager.search(req.query);
      res.json(results);
    } catch (err) {
      console.error("[QuestionBankController:Search] Error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /questions/:id
   * Fetches full item details including canonical fingerprint, revision history, and immutable audit logs.
   */
  static async getQuestionDetail(req, res) {
    try {
      const detail = await KnowledgeBaseManager.getQuestionDetail(req.params.id);
      res.json(detail);
    } catch (err) {
      res.status(404).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /questions
   * Persists a single approved item into the repository.
   */
  static async createQuestion(req, res) {
    try {
      const actor = req.user?.email || req.user?.name || "admin_portal";
      const report = await KnowledgeBaseManager.persistSingle(req.body, { actor });
      res.status(201).json({ success: true, message: "Question persisted successfully into Knowledge Base.", report });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /questions/:id
   * Executes a versioned revision modification (v1 -> v2 -> v3) without overwriting historical snapshot records.
   */
  static async updateQuestion(req, res) {
    try {
      const actor = req.user?.email || req.user?.name || "admin_portal";
      const reason = req.body.revisionReason || "Admin manual modification";
      // Remove revisionReason from payload before saving
      const updatePayload = { ...req.body };
      delete updatePayload.revisionReason;

      const updated = await KnowledgeBaseManager.applyVersionedUpdate(req.params.id, updatePayload, actor, reason);
      res.json({
        success: true,
        message: `Successfully updated item to version ${updated.version}. Historical snapshot preserved.`,
        question: updated,
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * PATCH /questions/:id/status
   * Adjusts item lifecycle state (Approved, Archived, Disabled, Deprecate, Restore) using soft deletion rules.
   */
  static async moderateStatus(req, res) {
    try {
      const { status, reason } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: "Missing required 'status' parameter." });
      }
      const actor = req.user?.email || req.user?.name || "admin_portal";
      const modReason = reason || `Lifecycle modification to ${status}`;
      
      const result = await KnowledgeBaseManager.moderateLifecycle(req.params.id, status, actor, modReason);
      res.json({ success: true, message: `Status updated to ${status}. Inventory resynced automatically.`, question: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /bulk-status
   * Applies lifecycle state transitions across multiple selected items in one batch execution.
   */
  static async bulkModerateStatus(req, res) {
    try {
      const { ids, status, reason } = req.body;
      const actor = req.user?.email || req.user?.name || "admin_portal";
      const modReason = reason || `Bulk lifecycle mutation to ${status}`;

      const result = await KnowledgeBaseManager.bulkModerateLifecycle(ids, status, actor, modReason);
      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /import
   * Ingests a batch of items from recognized sources (AI Generated, Manual Entry, CSV Import), passing every item
   * through the Phase 6 AI Quality Gate before allowing database persistence.
   */
  static async importQuestions(req, res) {
    try {
      const { items, source, categoryId, subcategoryId, difficulty, modality } = req.body;
      const actor = req.user?.email || req.user?.name || "admin_importer";

      const importResult = await KnowledgeBaseManager.importQuestions(items, {
        source: source || "AI Generated",
        categoryId,
        subcategoryId,
        difficulty,
        modality,
        actor
      });

      res.status(200).json(importResult);
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /semantic-test
   * Demonstrates semantic search architecture readiness without invoking live embeddings.
   */
  static async testSemanticDiscovery(req, res) {
    try {
      const { query, filters } = req.body;
      const output = await KnowledgeBaseManager.executeSemanticDiscovery(query, filters);
      res.json({ success: true, discovery: output });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /audits
   * Returns immutable audit trail records from the system registry.
   */
  static async getAudits(req, res) {
    try {
      const limit = Math.min(200, parseInt(req.query.limit || 50, 10));
      const filter = {};
      if (req.query.knowledgeBaseId) filter.knowledgeBaseId = req.query.knowledgeBaseId;
      if (req.query.action) filter.action = req.query.action;

      const logs = await KnowledgeBaseManager.getAuditLogs(filter, limit);
      res.json({ success: true, logs, count: logs.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
  /**
   * POST /categories/:categoryId/generate-ai-questions
   * Admin bulk generation of AI questions in "Draft" state
   */
  static async generateOnDemandAIQuestions(req, res) {
    try {
      const { categoryId } = req.params;
      const { questionCount = 5 } = req.body;
      const actor = req.user?.email || req.user?.name || "admin_on_demand_generator";

      const aiRuntimeEngine = require("../../services/assessment/AIRuntimeEngine");
      const questionIntelligenceEngine = require("../../services/assessment/QuestionIntelligenceEngine");

      // 1. Synthesize Questions via Runtime Engine
      const synthesisRes = await aiRuntimeEngine.execute({
        categoryId,
        dynamicVariables: { questionCount: parseInt(questionCount) || 5 },
        options: { simulationOnly: true }
      });

      if (!synthesisRes.success && synthesisRes.status !== "VALIDATION_WARNING") {
        return res.status(400).json({ success: false, error: `AI Synthesis failed: ${synthesisRes.error?.message || synthesisRes.status}` });
      }

      let synthesizedItems = Array.isArray(synthesisRes?.parsedData) 
        ? synthesisRes.parsedData 
        : (synthesisRes?.parsedData?.questions || []);
        
      if (!synthesizedItems || synthesizedItems.length === 0) {
        return res.status(400).json({ success: false, error: "AI Engine returned zero questions." });
      }

      // 2. Normalize and Force Status to Draft
      const normalized = synthesizedItems.map((q) => ({
        ...q,
        categoryId,
        createdSource: "AI Generated Bulk",
        status: "Draft", // Force draft state pending admin approval
      }));

      // 3. Vet through Intelligence Engine
      const vetted = await questionIntelligenceEngine.analyzeAndValidate(normalized, { fallbackModality: "MCQ", requireExplanation: false });
      
      // 4. Persist to Database - Save both Approved and Needs Review as Drafts
      const itemsToSave = [...(vetted.approvedQuestions || []), ...(vetted.needsReviewQuestions || [])];

      if (itemsToSave.length > 0) {
        // Force status to Draft since this is an admin bulk generation workflow
        const finalDrafts = itemsToSave.map(q => ({ ...q, status: "Draft" }));

        // Persist via KnowledgeBaseManager (Component 22)
        const persistResult = await KnowledgeBaseManager.persistBatch(finalDrafts, {
          allowPartialSuccess: true,
          userId: req.user?._id
        });
        return res.status(200).json({ success: true, count: finalDrafts.length, message: `Successfully generated ${finalDrafts.length} questions. They are now pending approval.` });
      } else {
        return res.status(400).json({ success: false, error: "AI generated questions failed intelligence vetting." });
      }
    } catch (err) {
      console.error("[QuestionBankController:GenerateOnDemand] Error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = QuestionBankController;
