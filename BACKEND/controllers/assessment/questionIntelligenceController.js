const questionIntelligenceEngine = require("../../services/assessment/QuestionIntelligenceEngine");

/**
 * questionIntelligenceController.js — Admin API Controller for Phase 6 Question Intelligence Engine
 * Exposes endpoints for real-time batch validation, Quality Gate supervision, live telemetry metrics,
 * and human review readiness state simulation without persisting questions into any database.
 */
class QuestionIntelligenceController {
  /**
   * POST /api/admin/assessment/intelligence/validate-batch
   * Runs the complete Phase 6 Question Intelligence evaluation pipeline over a payload of questions.
   * If a "simulateBatchSize" parameter is supplied (e.g. 1, 10, 50, 100, 200), generates an ephemeral
   * diagnostic test sample containing realistic valid questions, subtle duplicates, and syntax flaws.
   */
  async validateBatch(req, res) {
    try {
      const { questions, simulateBatchSize = 0, thresholdConfig, fallbackModality, requestedDifficulty } = req.body || {};

      let samplePayload = [];

      // If simulated diagnostic testing is requested, synthesize ephemeral memory test dataset
      if (simulateBatchSize && Number(simulateBatchSize) > 0) {
        const count = Math.min(200, Number(simulateBatchSize));
        samplePayload = QuestionIntelligenceController.generateDiagnosticBatch(count);
      } else if (Array.isArray(questions) && questions.length > 0) {
        samplePayload = questions;
      } else {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ABORTED: You must provide a 'questions' array or specify a 'simulateBatchSize' (1, 10, 50, 100, 200)."
        });
      }

      // Execute master engine analysis
      const analysisResult = await questionIntelligenceEngine.analyzeAndValidate(samplePayload, {
        thresholdConfig: thresholdConfig || {},
        fallbackModality: fallbackModality || "MCQ",
        requestedDifficulty: requestedDifficulty || "Medium"
      });

      return res.status(200).json({
        success: true,
        pipelineStatus: "QUALITY_GATE_COMPLETED",
        memoryNotice: "All evaluation occurred strictly in temporary RAM. No Question Bank database persistence executed.",
        report: analysisResult
      });

    } catch (error) {
      console.error("Error executing question intelligence validation:", error);
      return res.status(500).json({
        success: false,
        error: "INTERNAL_ENGINE_ERROR",
        message: error.message || "Failed to complete Question Intelligence validation batch."
      });
    }
  }

  /**
   * GET /api/admin/assessment/intelligence/metrics
   * Returns real-time cumulative runtime metrics computed by Component 15 across the active server instance.
   */
  async getMetrics(req, res) {
    try {
      const metrics = questionIntelligenceEngine.getRuntimeMetrics();
      return res.status(200).json({
        success: true,
        telemetry: metrics
      });
    } catch (error) {
      console.error("Error retrieving question intelligence metrics:", error);
      return res.status(500).json({
        success: false,
        error: "METRICS_RETRIEVAL_FAILURE",
        message: error.message || "Unable to retrieve real-time validation metrics."
      });
    }
  }

  /**
   * POST /api/admin/assessment/intelligence/review-action
   * Simulates Component 16 Human Review state model transitions (Pending Review -> Approved / Rejected / Force Approved).
   */
  async simulateReviewAction(req, res) {
    try {
      const { questionId, actionState, reason } = req.body || {};
      if (!questionId || !actionState) {
        return res.status(400).json({
          success: false,
          error: "MISSING_PARAMETERS: Required fields 'questionId' and 'actionState' missing."
        });
      }

      const reviewResult = questionIntelligenceEngine.processReviewAction(questionId, actionState, reason);
      return res.status(200).json({
        success: true,
        humanReviewSimulation: reviewResult
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "REVIEW_TRANSITION_FAILED",
        message: error.message
      });
    }
  }

  /**
   * POST /api/admin/assessment/intelligence/reset
   * Clears in-memory telemetry and fingerprint indices for diagnostic test harness cycling.
   */
  async resetMemory(req, res) {
    try {
      const result = questionIntelligenceEngine.resetRuntimeMemory();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Helper utility generating realistic diagnostic test items for proving Quality Gate resilience.
   */
  static generateDiagnosticBatch(count) {
    const batch = [];
    const topics = [
      { domain: "Programming", topic: "Java Collections", stem: "Which Java collection interface guarantees unique element insertion and maintains iteration ascending order?", opt: ["TreeSet", "HashSet", "ArrayList", "LinkedHashMap"], ans: "TreeSet", exp: "TreeSet implements NavigableSet and stores elements using a Red-Black tree in ascending sorted order with zero duplicates." },
      { domain: "Programming", topic: "Python Data Structures", stem: "What is the primary architectural difference between a Python tuple and a standard Python list when optimizing memory performance?", opt: ["Tuples are immutable and fixed in memory size", "Lists cannot hold heterogeneous objects", "Tuples use linked lists under the hood", "Lists do not support indexing operations"], ans: "Tuples are immutable and fixed in memory size", exp: "Because tuples are immutable, Python allocates a precise fixed-size memory slab without overhead for dynamic growth capacity." },
      { domain: "Database & Storage", topic: "SQL Indexing", stem: "When executing an SQL SELECT query over a 10 million row user table, why would an indexed column scan degrade to a full table scan?", opt: ["Wrapping the indexed column inside a SQL scalar function in the WHERE clause", "Selecting fewer columns in the output projection", "Ordering results by the primary key", "Using an INNER JOIN with another indexed table"], ans: "Wrapping the indexed column inside a SQL scalar function in the WHERE clause", exp: "Applying functions (such as LOWER(email) or YEAR(created_at)) directly to an indexed column invalidates B-Tree traversal, forcing a sequential linear table scan." },
      { domain: "Web Development", topic: "React & Frontend", stem: "Why does React require developers to include an array of dependencies when invoking the useEffect custom lifecycle hook?", opt: ["To control side-effect firing execution exclusively when dependent reactive values undergo shallow equality changes", "To initialize Component state variables in Redux store", "To bypass virtual DOM diffing algorithm completely", "To automatically bind methods to class components"], ans: "To control side-effect firing execution exclusively when dependent reactive values undergo shallow equality changes", exp: "The dependency array informs React's fiber reconciler whether values captured inside the effect closure have mutated since the previous commit cycle." },
      { domain: "Aptitude & Logical Reasoning", topic: "Probability & Permutations", stem: "Calculate the exact probability of drawing two consecutive aces from a standard shuffled 52-card poker deck without replacement.", opt: ["1/221", "1/169", "4/52", "2/52"], ans: "1/221", exp: "The probability of the first Ace is 4/52 (1/13). Without replacement, the probability of the second Ace is 3/51 (1/17). The product is (1/13) * (1/17) = 1/221." }
    ];

    for (let i = 0; i < count; i++) {
      const base = topics[i % topics.length];
      let modItem = {
        id: `DIAG-${i + 1}-${Date.now().toString(36)}`,
        type: "MCQ",
        question: base.stem,
        options: [...base.opt],
        correctAnswer: base.ans,
        explanation: base.exp,
        difficulty: i % 3 === 0 ? "Hard" : i % 2 === 0 ? "Medium" : "Easy",
        topic: base.topic
      };

      // Invalidate approximately 10% of items to demonstrate automated rejection & review filters
      if (i > 0 && i % 8 === 0) {
        // Force an intentional duplicate signature (Level 1/2 Duplicate Detection validation)
        modItem.question = topics[0].stem; 
        modItem.explanation = topics[0].exp;
      } else if (i > 0 && i % 15 === 0) {
        // Force a missing explanation & grammatical warning (Needs Review threshold validation)
        modItem.explanation = "";
        modItem.question = "what is the default value of boolean in java?"; // lowercase grammar flaw
      } else if (i > 0 && i % 25 === 0) {
        // Force a fatal structural flaw (Rejected threshold validation)
        modItem.options = ["Single Option Only"];
        modItem.correctAnswer = "Non-existent Option X";
      } else if (i === count - 1 && count > 5) {
        // Inject a Coding problem to demonstrate multi-modality batch parsing
        modItem = {
          id: `DIAG-CODE-${i + 1}`,
          type: "Coding",
          title: "Optimize Two-Sum Algorithm with O(1) Lookup",
          problemStatement: "Design a high-performance algorithm to calculate whether two integers in an array sum to a given target value in O(N) time complexity.",
          inputFormat: "First line contains N and Target. Second line contains N integers.",
          outputFormat: "Print the indices of the two complementary values.",
          constraints: ["1 <= N <= 10^5", "Time Limit: 1.0s"],
          testCases: [{ input: "4 9\n2 7 11 15", output: "0 1", isPublic: true }],
          difficulty: "Hard",
          topic: "Data Structures & Algorithms"
        };
      } else {
        // Vary stem slightly to prevent unintended deduplication on valid items
        if (i >= topics.length) {
          modItem.question = `[Variant ${Math.floor(i / topics.length)}] ${base.stem}`;
        }
      }

      batch.push(modItem);
    }

    return batch;
  }
}

module.exports = new QuestionIntelligenceController();
