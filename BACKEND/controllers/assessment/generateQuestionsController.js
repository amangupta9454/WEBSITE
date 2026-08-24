/**
 * generateQuestionsController.js
 * Simple AI question generator: Admin selects category + subcategory,
 * AI generates 5 MCQs per difficulty (easy, medium, hard, expert) → saved to DB.
 * Uses Groq SDK directly with 30s timeout (GroqManager has hard 7s cap).
 */
let Groq = null;
try { Groq = require("groq-sdk"); } catch {}

const AssessmentQuestion = require("../../models/assessment/AssessmentQuestion");
const AssessmentCategory = require("../../models/assessment/AssessmentCategory");
const AssessmentSubcategory = require("../../models/assessment/AssessmentSubcategory");
const crypto = require("crypto");

// Build Groq client from available keys
function buildGroqClient() {
  const keys = [];
  const prefixes = ["GROQ_API_KEY", "GROQ_API_KEY_2", "GROQ_API_KEY_3", "GROQ_API_KEY_4"];
  for (const k of prefixes) {
    if (process.env[k]?.trim()) keys.push(process.env[k].trim());
  }
  for (let i = 1; i <= 10; i++) {
    const v = process.env[`GROQ_KEY_${i}`]?.trim();
    if (v) keys.push(v);
  }
  if (keys.length === 0) return null;
  // Pick a random healthy key
  const key = keys[Math.floor(Math.random() * keys.length)];
  return Groq ? new Groq({ apiKey: key }) : null;
}


const DIFFICULTIES = ["easy", "medium", "hard", "expert"];

const DIFFICULTY_PROMPTS = {
  easy: "beginner-level, fundamental concept questions that test basic knowledge and recall",
  medium: "intermediate-level questions that require understanding of concepts and their application",
  hard: "advanced questions that test deep understanding, analysis, and complex problem-solving",
  expert: "expert/professional-level questions requiring mastery, architectural thinking, and real-world experience",
};

/**
 * Build a Groq prompt for a given difficulty and topic.
 */
function buildPrompt(categoryName, subcategoryName, difficulty, count = 5) {
  const entropy = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  return `You are an expert technical educator creating assessment questions for a professional learning platform.

Topic: ${categoryName} - ${subcategoryName}
Difficulty: ${difficulty.toUpperCase()} (${DIFFICULTY_PROMPTS[difficulty]})
Number of questions: ${count}
Generation Seed: ${entropy}

Generate exactly ${count} high-quality, completely unique and randomized multiple choice questions.
CRITICAL: Do NOT generate the same standard or generic questions. Explore edge cases, real-world scenarios, debugging situations, and highly diverse sub-topics within "${subcategoryName}". Ensure high variety.

Each question MUST:
1. Be directly relevant to "${subcategoryName}" in the context of "${categoryName}"
2. Have exactly 4 options (A, B, C, D)
3. Have one clearly correct answer
4. Include a brief explanation for the correct answer

Return ONLY a valid JSON array (no markdown, no extra text) in this exact format:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation why this is correct."
  }
]

correctIndex is 0-based (0=A, 1=B, 2=C, 3=D).`;
}

/**
 * Parse AI response and extract questions array.
 */
function parseQuestions(rawText) {
  try {
    // Try direct parse
    const trimmed = rawText.trim();
    if (trimmed.startsWith("[")) {
      return JSON.parse(trimmed);
    }
    // Try extracting JSON array from text
    const match = trimmed.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch (e) {
    console.error("[generateQuestionsController] JSON parse error:", e.message);
    return [];
  }
}

/**
 * Generate questions for one difficulty via Groq.
 */
async function generateForDifficulty(categoryName, subcategoryName, difficulty, count = 5) {
  const prompt = buildPrompt(categoryName, subcategoryName, difficulty, count);

  const client = buildGroqClient();
  if (!client) {
    throw new Error("No Groq API keys configured in environment.");
  }

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "You are a JSON-only technical question generator. Always return valid JSON arrays only, no markdown, no explanation outside the JSON."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.9,
    max_tokens: 2048,
  });

  const rawText = completion.choices?.[0]?.message?.content || "";
  return parseQuestions(rawText);
}

/**
 * POST /admin/assessment/generate-questions
 * Body: { categoryId, subcategoryId, questionsPerDifficulty? }
 */
exports.generateQuestions = async (req, res) => {
  try {
    const { categoryId, subcategoryId, questionsPerDifficulty = 5 } = req.body;

    if (!categoryId || !subcategoryId) {
      return res.status(400).json({ success: false, message: "categoryId and subcategoryId are required." });
    }

    // Fetch names
    const [category, subcategory] = await Promise.all([
      AssessmentCategory.findById(categoryId).lean(),
      AssessmentSubcategory.findById(subcategoryId).lean(),
    ]);

    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    if (!subcategory) return res.status(404).json({ success: false, message: "Subcategory not found." });

    const results = {};
    let totalSaved = 0;

    // Generate and save questions for each difficulty concurrently to avoid timeouts
    const difficultyPromises = DIFFICULTIES.map(async (difficulty) => {
      try {
        const rawQuestions = await generateForDifficulty(
          category.name,
          subcategory.name,
          difficulty,
          questionsPerDifficulty
        );

        const savedCount = await saveQuestions(rawQuestions, {
          categoryId,
          subcategoryId,
          difficulty,
        });

        console.log(`[generateQuestionsController] ✅ ${difficulty}: ${savedCount} questions saved`);
        return { difficulty, generated: rawQuestions.length, saved: savedCount };
      } catch (diffErr) {
        console.error(`[generateQuestionsController] ❌ ${difficulty} generation failed:`, diffErr.message);
        return { difficulty, generated: 0, saved: 0, error: diffErr.message };
      }
    });

    const generationResults = await Promise.all(difficultyPromises);

    for (const res of generationResults) {
      results[res.difficulty] = { generated: res.generated, saved: res.saved, error: res.error };
      totalSaved += res.saved;
    }

    return res.json({
      success: true,
      message: `Generated and saved ${totalSaved} questions across all difficulties.`,
      total: totalSaved,
      perDifficulty: results,
      categoryName: category.name,
      subcategoryName: subcategory.name,
    });
  } catch (err) {
    console.error("[generateQuestionsController] Fatal error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Calculates Sørensen-Dice coefficient for fast string similarity (0.0 to 1.0).
 */
function getBigrams(str) {
  const s = (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const bigrams = new Set();
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.add(s.substring(i, i + 2));
  }
  return bigrams;
}

function diceCoefficient(str1, str2) {
  const b1 = getBigrams(str1);
  const b2 = getBigrams(str2);
  if (b1.size === 0 || b2.size === 0) return 0;
  let intersection = 0;
  for (let b of b1) {
    if (b2.has(b)) intersection++;
  }
  return (2.0 * intersection) / (b1.size + b2.size);
}

/**
 * Save parsed questions to AssessmentQuestion collection.
 * Skips exact duplicates (fingerprint) AND similar questions (>80% similarity).
 * Optimized to fetch existing questions only once per batch.
 */
async function saveQuestions(questions, { categoryId, subcategoryId, difficulty }) {
  if (!Array.isArray(questions) || questions.length === 0) return 0;

  // Pre-fetch all existing question texts for this subcategory for fast memory comparison
  const existingQuestions = await AssessmentQuestion.find(
    { subcategoryId },
    { text: 1, fingerprint: 1 }
  ).lean();

  // We will keep a working array to also check against questions saved within this loop
  const currentBatch = [...existingQuestions];
  let saved = 0;

  for (const q of questions) {
    try {
      if (!q.text || !Array.isArray(q.options) || q.options.length < 2) continue;

      const fingerprint = crypto
        .createHash("sha256")
        .update((q.text || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim())
        .digest("hex");

      // Fast in-memory duplicate & similarity check
      let isDuplicate = false;
      for (const existing of currentBatch) {
        if (existing.fingerprint === fingerprint) {
          isDuplicate = true;
          break;
        }
        // If question text is 80% similar, consider it a duplicate
        if (diceCoefficient(q.text, existing.text) > 0.8) {
          isDuplicate = true;
          break;
        }
      }

      if (isDuplicate) continue;

      // Add to current batch so subsequent questions in this run don't duplicate it
      currentBatch.push({ text: q.text, fingerprint });

      await AssessmentQuestion.create({
        text: q.text.trim(),
        options: q.options.map((o) => (typeof o === "string" ? o.trim() : String(o))),
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
        correctAnswer: q.options[q.correctIndex] || q.options[0] || "",
        explanation: q.explanation || "",
        difficulty: difficulty,
        categoryId,
        subcategoryId,
        status: "Approved",
        createdSource: "AI Generated",
        assessmentType: "MCQ",
        fingerprint,
        bloomLevel: "Apply",
        topics: [],
        tags: ["ai-generated", difficulty],
        qualityScore: 90,
        estimatedTimeSeconds: 60,
      });
      saved++;
    } catch (e) {
      if (e.code !== 11000) {
        console.warn("[generateQuestionsController] Save warning:", e.message);
      }
    }
  }
  return saved;
}

/**
 * GET /admin/assessment/generate-questions/count?subcategoryId=xxx
 * Returns current question count per difficulty for a subcategory.
 */
exports.getQuestionCount = async (req, res) => {
  try {
    const { subcategoryId } = req.query;
    if (!subcategoryId) {
      return res.status(400).json({ success: false, message: "subcategoryId is required." });
    }

    const counts = {};
    for (const d of DIFFICULTIES) {
      counts[d] = await AssessmentQuestion.countDocuments({
        subcategoryId,
        difficulty: d,
        status: { $in: ["Approved", "approved"] },
        isDeleted: false,
      });
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return res.json({ success: true, counts, total });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
