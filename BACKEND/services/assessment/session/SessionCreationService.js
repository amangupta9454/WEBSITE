const mongoose = require("mongoose");
const AssessmentSession = require("../../../models/assessment/AssessmentSession");
const AssessmentQuestion = require("../../../models/assessment/AssessmentQuestion");
const AssessmentConfig = require("../../../models/assessment/AssessmentConfig");
const AssessmentAIBlueprint = require("../../../models/assessment/AssessmentAIBlueprint");
const AssessmentRuntimeConfig = require("../../../models/assessment/AssessmentRuntimeConfig");
const aiRuntimeEngine = require("../../assessment/AIRuntimeEngine");
const questionIntelligenceEngine = require("../../assessment/QuestionIntelligenceEngine");
const KnowledgeBaseManager = require("../../assessment/knowledge/KnowledgeBaseManager");

/**
 * Component 1: Session Creation, Component 2: Configuration Snapshot & Component 3: Question Snapshot
 * Enforces immutable session creation with frozen configuration versions and question datasets.
 * Prevents multiple active concurrent attempts per target subcategory (Component 17 Security).
 */
class SessionCreationService {
  /**
   * Creates a new immutable assessment session for a given candidate and subcategory.
   *
   * @param {Object} params
   * @param {string} params.userId - Mongoose ObjectId or User string ID
   * @param {string} params.candidateId - Email or unique user designation
   * @param {string} params.subcategoryId - Target Assessment Subcategory ID
   * @param {string} params.categoryId - Optional Category reference ID
   * @param {Object} params.options - { forceNew: false, simulatedAiFirst: true }
   */
  static async createSession({ userId, candidateId, subcategoryId, categoryId, options = {} }) {
    const startTime = Date.now();
    try {
      // 1. Component 17: Security — Prevent multiple active concurrent sessions for same candidate & domain
      const activeStates = ["Created", "Initializing", "Running", "Paused", "in_progress"];
      const existingSession = await AssessmentSession.findOne({
        userId,
        subcategoryId,
        status: { $in: activeStates },
        isLocked: false,
      }).sort({ createdAt: -1 });

      if (existingSession) {
        // If an active attempt exists and hasn't expired, return error directing to Resume Engine
        const now = new Date();
        if (new Date(existingSession.expiresAt) > now) {
          return {
            success: false,
            code: "ACTIVE_SESSION_EXISTS",
            message: `Candidate already has an active session [${existingSession.sessionId}] for this assessment domain. Use Resume Engine instead of creating a duplicate attempt.`,
            sessionId: existingSession.sessionId,
          };
        } else {
          // Auto-expire obsolete unsubmitted session
          existingSession.status = "Expired";
          existingSession.connectionStatus = "Expired";
          existingSession.isLocked = true;
          existingSession.timeline.push({
            eventId: `EVT-${Date.now()}-EXP`,
            eventType: "Session Expired",
            timestamp: now,
            details: { reason: "Expired before submission; marked by creation guardrail." },
          });
          await existingSession.save();
        }
      }

      // Calculate sequential Attempt Number (do not reuse previous session IDs or records)
      const priorAttemptsCount = await AssessmentSession.countDocuments({ userId, subcategoryId });
      const attemptNumber = priorAttemptsCount + 1;
      const sessionId = `SES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Component 2: Configuration Snapshot (Immutable snapshot of Config, Runtime, and Blueprint)
      let config = await AssessmentConfig.findOne({ subcategoryId: subcategoryId }).lean();
      if (!config && categoryId) {
        config = await AssessmentConfig.findOne({ categoryId: categoryId }).lean();
      }
      if (!config) {
        config = await AssessmentConfig.findOne({ isGlobal: true }).lean() || {
          totalQuestions: 15,
          passingPercentage: 70,
          timeLimitMinutes: 30,
          version: 1,
          allowPrevious: true,
          allowReview: true,
        };
      }

      const runtimeConfig = await AssessmentRuntimeConfig.findOne({ status: "Active" }).lean() || { versionNumber: 1 };
      const blueprint = await AssessmentAIBlueprint.findOne({ subcategoryId }).lean() || { versionNumber: 1 };

      const totalQuestions = config.totalQuestions || 15;
      const timeLimitMinutes = config.timeLimitMinutes || 30;
      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + timeLimitMinutes * 60 * 1000);

      const configSnapshot = {
        assessmentConfigVersion: config.version || 1,
        runtimeConfigVersion: runtimeConfig.versionNumber || 1,
        blueprintVersion: blueprint.versionNumber || 1,
        passingPercentage: config.passingPercentage || 70,
        timeLimitMinutes: timeLimitMinutes,
        assessmentType: "MCQ",
        totalQuestions: totalQuestions,
        batchSize: 5, // Default batch delivery size (Component 4)
        allowReview: config.allowReview !== undefined ? config.allowReview : true,
        allowPrevious: config.allowPrevious !== undefined ? config.allowPrevious : true,
        questionTimerSeconds: config.questionTimerSeconds || 7, // 7-second per-question rule
      };

      // 3. Component 3: Question Snapshot (AI-First / DB Fallback immutable set generation)
      // Never fetch questions dynamically during evaluation; freeze complete question set now.
      let approvedQuestions = await AssessmentQuestion.find({
        subcategoryId,
        isDeleted: false,
        status: { $in: ["Approved", "approved"] },
      }).limit(totalQuestions * 2).lean();

      let aiQuestionsCount = 0;
      let dbQuestionsCount = 0;

      // If DB repository lacks enough questions, trigger automated real-time synthesis via AI engines
      if (approvedQuestions.length < totalQuestions && options.simulatedAiFirst !== false) {
        try {
          const deficit = totalQuestions - approvedQuestions.length;
          const synthesisRes = await aiRuntimeEngine.execute({
            subcategoryId,
            categoryId,
            dynamicVariables: { questionCount: Math.min(10, deficit + 3) },
            options: { simulationOnly: true },
          });

          if (!synthesisRes.success) {
            console.warn(`[SessionCreationService] AI Synthesis failed: ${synthesisRes.error?.message || synthesisRes.status}`);
          }
          let synthesizedItems = Array.isArray(synthesisRes?.parsedData) 
            ? synthesisRes.parsedData 
            : (synthesisRes?.parsedData?.questions || []);
          if (synthesizedItems.length > 0) {
            const normalized = synthesizedItems.map((q) => ({
              ...q,
              subcategoryId,
              categoryId: categoryId || subcategoryId,
              createdSource: "AI Generated",
              status: "Approved",
            }));
            const vetted = await questionIntelligenceEngine.analyzeAndValidate(normalized, { fallbackModality: "MCQ" });
            if (vetted.approvedQuestions && vetted.approvedQuestions.length > 0) {
              await KnowledgeBaseManager.persistBatch(vetted.approvedQuestions, { actor: "Session_Creation_Engine" });
              approvedQuestions = await AssessmentQuestion.find({
                subcategoryId,
                isDeleted: false,
                status: { $in: ["Approved", "approved"] },
              }).limit(totalQuestions * 2).lean();
            }
          }
        } catch (e) {
          console.warn("[SessionCreationService] AI On-Demand synthesis fallback to existing inventory:", e.message);
        }
      }

      // Shuffle and select exact target count
      const shuffled = [...approvedQuestions].sort(() => 0.5 - Math.random());
      const selectedDocs = shuffled.slice(0, totalQuestions);

      // Construct Question Snapshot and empty Answers framework
      const questionSnapshot = [];
      const questionIds = [];
      const answers = [];

      selectedDocs.forEach((doc, idx) => {
        const source = doc.createdSource?.includes("AI") ? "AI Generated" : "Database Fallback";
        if (source === "AI Generated") aiQuestionsCount++;
        else dbQuestionsCount++;

        const seqOrder = idx + 1;
        questionIds.push(doc._id);

        questionSnapshot.push({
          questionId: doc._id,
          knowledgeBaseId: doc.knowledgeBaseId || `KB-Q-${doc._id}`,
          versionNumber: doc.version || 1,
          fingerprint: doc.fingerprint || doc.hash || `HASH-${doc._id}`,
          sequenceOrder: seqOrder,
          source: source,
          questionText: doc.questionText || doc.text,
          options: doc.options || [],
          difficulty: doc.difficulty || "medium",
          bloomLevel: doc.bloomLevel || "Apply",
          tags: doc.tags || [],
          correctIndex: doc.correctIndex !== undefined ? doc.correctIndex : (doc.correctOptionIndex !== undefined ? doc.correctOptionIndex : doc.correctOption),
          correctAnswer: doc.correctAnswer,
          explanation: doc.explanation,
        });

        answers.push({
          questionId: doc._id,
          sequenceOrder: seqOrder,
          selectedIndex: null,
          selectedAnswer: null,
          isAnswered: false,
          isMarkedForReview: false,
          timeTakenSeconds: 0,
          lastUpdated: new Date(),
          isCorrect: false, // Strictly evaluated ONLY in Phase 10
        });
      });

      // 4. Instantiate Session Record
      const initialTimelineEvent = {
        eventId: `EVT-${Date.now()}-INIT`,
        eventType: "Session Created",
        timestamp: new Date(),
        details: {
          attemptNumber,
          totalQuestions: selectedDocs.length,
          timeLimitMinutes,
          message: "Immutable configuration and frozen question snapshot established.",
        },
      };

      const newSession = await AssessmentSession.create({
        sessionId,
        attemptNumber,
        candidateId: candidateId || "candidate@portal.com",
        userId,
        categoryId: categoryId || null,
        subcategoryId,
        configId: config._id || null,
        configSnapshot,
        questionSnapshot,
        questionIds,
        status: "Created",
        startedAt,
        expiresAt,
        lastHeartbeatAt: startedAt,
        connectionStatus: "Healthy",
        totalQuestions: selectedDocs.length,
        currentBatch: 1,
        currentQuestionIndex: 0,
        answers,
        timeline: [initialTimelineEvent],
        isLocked: false,
        aiQuestionsCount,
        dbQuestionsCount,
      });

      console.log(`[SessionCreationService] ✅ Created immutable session [${sessionId}] (Attempt #${attemptNumber}) in ${Date.now() - startTime}ms.`);

      return {
        success: true,
        sessionId: newSession.sessionId,
        attemptNumber: newSession.attemptNumber,
        status: newSession.status,
        startedAt: newSession.startedAt,
        expiresAt: newSession.expiresAt,
        configSnapshot: newSession.configSnapshot,
        totalQuestions: newSession.totalQuestions,
        currentBatch: newSession.currentBatch,
      };
    } catch (err) {
      console.error("[SessionCreationService] Error during creation:", err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = SessionCreationService;
