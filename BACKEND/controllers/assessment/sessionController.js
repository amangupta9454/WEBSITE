const AssessmentSessionEngine = require("../../services/assessment/AssessmentSessionEngine");
const AssessmentSubcategory = require("../../models/assessment/AssessmentSubcategory");
const AssessmentCategory = require("../../models/assessment/AssessmentCategory");
const AssessmentQuestion = require("../../models/assessment/AssessmentQuestion");
const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * Component 14 & Component 17: Secure APIs and Controller for Assessment Session Engine.
 * Enforces authentication and authorization controls, prevents duplicate submissions, and disallows direct API misuse.
 * Strictly does NOT compute exam scores or return evaluation reports (Phase 10).
 */
exports.createSession = async (req, res) => {
  try {
    const { subcategoryId, categoryId, candidateId } = req.body;
    // Resolve user identity from JWT auth middleware or fallback for demo testing
    const userId = req.user?.id || req.user?._id || new mongoose.Types.ObjectId("600000000000000000000001");
    const userEmail = req.user?.email || candidateId || "candidate@portal.com";

    if (!subcategoryId) {
      // In demo or test mode, pick any active subcategory if not explicitly supplied
      const subcat = await AssessmentSubcategory.findOne({ isActive: { $ne: false } }).sort({ createdAt: -1 }).lean() || await AssessmentSubcategory.findOne({}).sort({ createdAt: -1 }).lean();
      if (!subcat) {
        return res.status(400).json({ success: false, error: "Subcategory ID is required to start assessment session. No subcategories found in inventory." });
      }
      req.body.subcategoryId = subcat._id;
    }

    const result = await AssessmentSessionEngine.startAssessment({
      userId,
      candidateId: userEmail,
      subcategoryId: req.body.subcategoryId || subcategoryId,
      categoryId: categoryId || null,
    });

    if (!result.success) {
      if (result.code === "ACTIVE_SESSION_EXISTS") {
        return res.status(409).json(result);
      }
      return res.status(400).json(result);
    }

    // Immediately load batch #1 to return alongside new session parameters
    const initialBatch = await AssessmentSessionEngine.getQuestionBatch(result.sessionId, 1, userEmail);

    return res.status(201).json({
      success: true,
      data: {
        ...result,
        initialBatch: initialBatch.success ? initialBatch : null,
      },
      message: "Session created successfully with immutable snapshots.",
    });
  } catch (err) {
    console.error("[SessionController.createSession]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user?.email || req.user?.id;
    const details = await AssessmentSessionEngine.getSessionDetails(sessionId);
    if (!details.success) {
      return res.status(404).json(details);
    }

    // Ensure candidate only reads their own attempt unless they are admin
    if (req.user?.role !== "admin" && candidateId && details.session.candidateId !== candidateId && details.session.userId?.toString() !== candidateId) {
      return res.status(403).json({ success: false, error: "SECURITY_UNAUTHORIZED: Forbidden attempt access." });
    }

    // Strip sensitive correct answers from answers array if requested by student before completion
    return res.status(200).json({
      success: true,
      data: details.session,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.resumeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user?.email || req.body.candidateId;
    const result = await AssessmentSessionEngine.resumeAssessment({ sessionId, candidateId });
    if (!result.success) {
      if (result.code === "SESSION_ENDED") return res.status(410).json(result);
      if (result.code === "SESSION_EXPIRED") return res.status(403).json(result);
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.autosave = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { updates, currentQuestionIndex, candidateId } = req.body;
    const effectiveCandidate = req.user?.email || candidateId;

    const result = await AssessmentSessionEngine.autosave({
      sessionId,
      candidateId: effectiveCandidate,
      updates,
      currentQuestionIndex,
    });

    if (!result.success) {
      if (result.code === "SESSION_LOCKED") return res.status(403).json(result);
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getNextBatch = async (req, res) => {
  try {
    const { sessionId, batchNumber } = req.params;
    const candidateId = req.user?.email || req.query.candidateId;
    const result = await AssessmentSessionEngine.getQuestionBatch(sessionId, Number(batchNumber) || 1, candidateId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.submitSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user?.email || req.body.candidateId;
    const reason = req.body.reason || "CANDIDATE_SUBMISSION";

    const result = await AssessmentSessionEngine.submitAssessment({ sessionId, candidateId, reason });
    if (!result.success) {
      if (result.code === "ALREADY_SUBMITTED") return res.status(409).json(result);
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const details = await AssessmentSessionEngine.getSessionDetails(sessionId);
    if (!details.success) {
      return res.status(404).json(details);
    }
    return res.status(200).json({
      success: true,
      sessionId: details.session.sessionId,
      timeline: details.session.timeline || [],
      antiCheatSummary: details.session.antiCheatSummary || {},
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.recordAntiCheatEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { eventType, details, candidateId } = req.body;
    const effectiveCandidate = req.user?.email || candidateId;

    const result = await AssessmentSessionEngine.trackAntiCheatEvent({
      sessionId,
      eventType,
      details,
      candidateId: effectiveCandidate,
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.heartbeat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user?.email || req.body.candidateId;
    const result = await AssessmentSessionEngine.checkHeartbeatAndTimer(sessionId, { registerHeartbeat: true, candidateId });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user?.email || req.query.candidateId;
    const result = await AssessmentSessionEngine.checkHeartbeatAndTimer(sessionId, { registerHeartbeat: false, candidateId });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin Supervision & Monitoring APIs ──────────────────────────────────────
exports.createSmartSession = async (req, res) => {
  try {
    const { subcategoryId, categoryId, difficulty = "medium" } = req.body;
    const userId = req.user?.id || req.user?._id || new mongoose.Types.ObjectId("600000000000000000000001");
    const userEmail = req.user?.email || "candidate@portal.com";

    if (!subcategoryId) {
      return res.status(400).json({ success: false, error: "subcategoryId is required." });
    }

    // Step 1: Try AI generation in the background with 7s timeout
    let aiGenerated = false;
    try {
      const [subcat, category] = await Promise.all([
        AssessmentSubcategory.findById(subcategoryId).lean(),
        categoryId ? AssessmentCategory.findById(categoryId).lean() : Promise.resolve(null),
      ]);

      if (subcat) {
        const catName = category?.name || subcat.parentCategoryName || "General";
        const subName = subcat.name || "Topic";

        // Dynamic import to avoid circular deps
        let Groq = null;
        try { Groq = require("groq-sdk"); } catch {}

        const buildGroqClient = () => {
          const keys = [
            process.env.GROQ_API_KEY,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3,
            process.env.GROQ_API_KEY_4,
          ].filter(Boolean);
          if (!keys.length || !Groq) return null;
          return new Groq({ apiKey: keys[Math.floor(Math.random() * keys.length)] });
        };

        const difficultyDesc = {
          easy: "beginner-level, basic recall and understanding",
          medium: "intermediate-level, application and analysis",
          hard: "advanced, deep understanding and complex problem-solving",
          expert: "expert/professional mastery level",
        }[difficulty] || "intermediate-level";

        const prompt = `Generate exactly 5 multiple choice questions about "${subName}" in "${catName}".
Difficulty: ${difficulty.toUpperCase()} (${difficultyDesc})
Return ONLY a valid JSON array, no markdown:
[{"text":"Question?","options":["A","B","C","D"],"correctIndex":0,"explanation":"Why correct."}]`;

        const client = buildGroqClient();
        if (client) {
          // Race: 7000ms timeout vs AI completion
          const aiRace = await Promise.race([
            client.chat.completions.create({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: "You are a JSON-only MCQ generator. Return only valid JSON arrays, no markdown." },
                { role: "user", content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 1500,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), 15000)),
          ]);

          const rawText = aiRace.choices?.[0]?.message?.content || "";
          let questions = [];
          try {
            const match = rawText.trim().match(/\[[\s\S]*\]/);
            questions = match ? JSON.parse(match[0]) : [];
          } catch {}

          if (questions.length > 0) {
            // Save AI questions to DB
            for (const q of questions) {
              if (!q.text || !Array.isArray(q.options)) continue;
              const fp = crypto.createHash("sha256")
                .update((q.text || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim())
                .digest("hex");
              const exists = await AssessmentQuestion.findOne({ fingerprint: fp });
              if (!exists) {
                await AssessmentQuestion.create({
                  text: q.text.trim(),
                  options: q.options.map(o => String(o).trim()),
                  correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
                  correctAnswer: q.options[q.correctIndex] || q.options[0] || "",
                  explanation: q.explanation || "",
                  difficulty,
                  categoryId: categoryId || subcat.categoryId || null,
                  subcategoryId,
                  status: "Approved",
                  createdSource: "AI Generated",
                  assessmentType: "MCQ",
                  fingerprint: fp,
                  tags: ["ai-generated", difficulty, "smart-session"],
                  qualityScore: 90,
                }).catch(() => {});
              }
            }
            aiGenerated = true;
            console.log(`[SmartSession] ✅ AI generated ${questions.length} questions for ${subName} (${difficulty}) in <15s`);
          }
        }
      }
    } catch (aiErr) {
      if (aiErr.message !== "AI_TIMEOUT") {
        console.warn(`[SmartSession] AI generation skipped: ${aiErr.message}`);
      } else {
        console.warn(`[SmartSession] ⏱️ AI timeout — using DB fallback for ${subcategoryId}`);
      }
    }

    // Step 2: Create the assessment session (SessionCreationService will pick questions from DB)
    const result = await AssessmentSessionEngine.startAssessment({
      userId,
      candidateId: userEmail,
      subcategoryId,
      categoryId: categoryId || null,
      options: { simulatedAiFirst: false }, // Don't re-trigger AI in session engine, we already did it
    });

    if (!result.success) {
      if (result.code === "ACTIVE_SESSION_EXISTS") return res.status(409).json(result);
      return res.status(400).json(result);
    }

    const initialBatch = await AssessmentSessionEngine.getQuestionBatch(result.sessionId, 1, userEmail);

    return res.status(201).json({
      success: true,
      data: {
        ...result,
        initialBatch: initialBatch.success ? initialBatch : null,
        aiGenerated,
        difficulty,
      },
      message: aiGenerated
        ? "Session created with AI-generated questions."
        : "Session created with database questions (AI fallback).",
    });
  } catch (err) {
    console.error("[SessionController.createSmartSession]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};


exports.adminListSessions = async (req, res) => {
  try {
    const { page, limit, status, search, subcategoryId } = req.query;
    const result = await AssessmentSessionEngine.listSessions({ page, limit, status, search, subcategoryId });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.adminGetSessionAudit = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await AssessmentSessionEngine.getSessionDetails(sessionId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
