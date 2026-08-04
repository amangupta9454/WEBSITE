const crypto = require("crypto");

/**
 * QuestionParser.js — Component 1 of the Question Intelligence Engine (Phase 6)
 * Converts raw or normalized runtime outputs into standardized internal Question memory objects.
 * Strictly operates in temporary memory; zero database persistence.
 * Supports extensible adapters for 5 evaluation modalities: MCQ, Coding, Mixed, AI Viva, Subjective.
 */
class QuestionParser {
  constructor() {
    this.supportedModalities = ["MCQ", "Coding", "Mixed", "AI Viva", "Subjective"];
  }

  /**
   * Generates a temporary in-memory trace ID for a question object.
   * @returns {string} Temporary ID formatted as TMP-Q-timestamp-hex
   */
  generateTemporaryId() {
    const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `TMP-Q-${Date.now()}-${hex}`;
  }

  /**
   * Parses an input payload (array or individual object) from Phase 5 AI Runtime Engine
   * into standardized memory objects.
   * 
   * @param {Object|Array} rawData - Input data from LLM response parser
   * @param {string} fallbackModality - Default modality if missing (default: MCQ)
   * @returns {Array<Object>} Array of standard internal Question memory objects
   */
  parse(rawData, fallbackModality = "MCQ") {
    if (!rawData) {
      throw new Error("QuestionParser received null or undefined input payload.");
    }

    // Extract questions array from common wrapping keys if present
    let items = [];
    if (Array.isArray(rawData)) {
      items = rawData;
    } else if (typeof rawData === "object") {
      if (Array.isArray(rawData.questions)) items = rawData.questions;
      else if (Array.isArray(rawData.items)) items = rawData.items;
      else if (Array.isArray(rawData.data)) items = rawData.data;
      else items = [rawData]; // Single question object
    } else {
      throw new Error("QuestionParser expected JSON array or object structure.");
    }

    // Process each item through specialized modality adapters
    return items.map((item, index) => {
      const temporaryId = item.id && String(item.id).startsWith("TMP-") ? item.id : this.generateTemporaryId();
      const rawType = item.type || item.modality || fallbackModality;
      const modality = this.normalizeModality(rawType);

      const baseMeta = {
        temporaryId,
        modality,
        originalIndex: index,
        parsedAt: new Date().toISOString(),
        rawInput: item
      };

      try {
        switch (modality) {
          case "MCQ":
            return this.parseMCQ(item, baseMeta);
          case "Coding":
            return this.parseCoding(item, baseMeta);
          case "AI Viva":
            return this.parseAIViva(item, baseMeta);
          case "Subjective":
            return this.parseSubjective(item, baseMeta);
          case "Mixed":
            return this.parseMixed(item, baseMeta);
          default:
            return this.parseMCQ(item, baseMeta);
        }
      } catch (err) {
        // Graceful error recovery: attach parsing defect flags without halting entire batch
        return {
          ...baseMeta,
          parseError: true,
          parseErrorMessage: err.message || "Failed to parse question parameters.",
          questionText: item.question || item.title || item.stem || "[Malformed Question Stem]",
          difficulty: item.difficulty || "Medium"
        };
      }
    });
  }

  normalizeModality(val) {
    if (!val || typeof val !== "string") return "MCQ";
    const clean = val.trim().toLowerCase();
    if (clean.includes("mcq") || clean.includes("choice") || clean.includes("objective")) return "MCQ";
    if (clean.includes("code") || clean.includes("coding") || clean.includes("programming")) return "Coding";
    if (clean.includes("viva") || clean.includes("voice") || clean.includes("interview")) return "AI Viva";
    if (clean.includes("subjective") || clean.includes("essay") || clean.includes("theory")) return "Subjective";
    if (clean.includes("mix")) return "Mixed";
    return "MCQ";
  }

  /**
   * Modality Adapter: Multiple Choice Questions (MCQ)
   */
  parseMCQ(item, baseMeta) {
    const questionText = String(item.question || item.stem || item.prompt || item.title || "").trim();
    let options = [];
    
    if (Array.isArray(item.options)) {
      options = item.options.map(opt => {
        if (typeof opt === "string") return opt.trim();
        if (typeof opt === "object" && opt !== null) return (opt.text || opt.label || opt.value || "").trim();
        return String(opt).trim();
      });
    } else if (typeof item.options === "object" && item.options !== null) {
      // Handle { A: "option 1", B: "option 2" } structure
      options = Object.values(item.options).map(v => String(v).trim());
    }

    const correctAnswer = String(item.correctAnswer || item.answer || item.correct || (item.correctIndex !== undefined ? item.correctIndex : "")).trim();
    const explanation = String(item.explanation || item.rationale || item.solution || "").trim();
    const difficulty = this.normalizeDifficulty(item.difficulty || item.level || "Medium");
    const topic = String(item.topic || item.category || item.domain || "General Tech").trim();

    return {
      ...baseMeta,
      modality: "MCQ",
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      topic,
      tags: Array.isArray(item.tags) ? item.tags.map(t => String(t).trim()) : []
    };
  }

  /**
   * Modality Adapter: Coding & Problem Solving
   */
  parseCoding(item, baseMeta) {
    const title = String(item.title || item.question || item.name || "Untitled Problem").trim();
    const problemStatement = String(item.problemStatement || item.description || item.questionText || item.question || "").trim();
    const inputFormat = String(item.inputFormat || item.input || "Standard input via console / stdin").trim();
    const outputFormat = String(item.outputFormat || item.output || "Standard output via console / stdout").trim();
    const constraints = Array.isArray(item.constraints) ? item.constraints : [String(item.constraints || "Time Limit: 2.0s, Memory Limit: 256MB").trim()];
    
    let testCases = [];
    if (Array.isArray(item.testCases || item.samples)) {
      testCases = (item.testCases || item.samples).map(tc => ({
        input: String(tc.input || "").trim(),
        output: String(tc.output || "").trim(),
        isPublic: Boolean(tc.isPublic ?? tc.public ?? true),
        explanation: tc.explanation ? String(tc.explanation).trim() : undefined
      }));
    }

    return {
      ...baseMeta,
      modality: "Coding",
      questionText: problemStatement, // Unified pointer for duplicate & vocabulary scanners
      title,
      problemStatement,
      inputFormat,
      outputFormat,
      constraints,
      testCases,
      referenceSolution: item.referenceSolution || item.solution || item.code || null,
      difficulty: this.normalizeDifficulty(item.difficulty || "Medium"),
      topic: String(item.topic || item.category || "Data Structures & Algorithms").trim(),
      supportedLanguages: Array.isArray(item.supportedLanguages) ? item.supportedLanguages : ["javascript", "python", "java", "cpp"]
    };
  }

  /**
   * Modality Adapter: AI Viva & Voice Conversational Probes
   */
  parseAIViva(item, baseMeta) {
    const scenario = String(item.scenario || item.context || item.prompt || item.questionText || item.question || "").trim();
    const initialProbe = String(item.initialProbe || item.question || item.stem || item.firstQuestion || "").trim();
    const evaluationFocus = Array.isArray(item.evaluationFocus) ? item.evaluationFocus : [String(item.evaluationFocus || item.topic || "Conceptual explanation and practical depth").trim()];
    const expectedKeywords = Array.isArray(item.expectedKeywords) ? item.expectedKeywords : [];
    const rubric = item.rubric || { conceptualDepth: 40, technicalCommunication: 30, scenarioAnalysis: 30 };

    return {
      ...baseMeta,
      modality: "AI Viva",
      questionText: `${scenario} | Probe: ${initialProbe}`, // Unified pointer for analysis
      scenario,
      initialProbe,
      evaluationFocus,
      expectedKeywords,
      rubric,
      difficulty: this.normalizeDifficulty(item.difficulty || "Medium"),
      topic: String(item.topic || "Technical Interview Probing").trim()
    };
  }

  /**
   * Modality Adapter: Subjective & Architectural Essays
   */
  parseSubjective(item, baseMeta) {
    const questionText = String(item.question || item.prompt || item.statement || item.questionText || "").trim();
    const wordLimit = Number(item.wordLimit || item.maxWords || 500);
    const rubric = Array.isArray(item.rubric) ? item.rubric : [
      { criterion: "Technical Correctness & Architecture", weight: 50 },
      { criterion: "Clarity of Explanation & Examples", weight: 30 },
      { criterion: "Edge Cases & Optimization Considerations", weight: 20 }
    ];
    const sampleAnswer = String(item.sampleAnswer || item.referenceAnswer || item.explanation || "").trim();

    return {
      ...baseMeta,
      modality: "Subjective",
      questionText,
      wordLimit,
      rubric,
      sampleAnswer,
      difficulty: this.normalizeDifficulty(item.difficulty || "Medium"),
      topic: String(item.topic || "System Architecture & Design").trim()
    };
  }

  /**
   * Modality Adapter: Mixed Modality (Polymorphic Delegation)
   */
  parseMixed(item, baseMeta) {
    // Determine specific internal sub-type if available
    if (item.options || item.correctAnswer) {
      return this.parseMCQ(item, { ...baseMeta, modality: "MCQ (Mixed)" });
    } else if (item.testCases || item.problemStatement || item.inputFormat) {
      return this.parseCoding(item, { ...baseMeta, modality: "Coding (Mixed)" });
    } else if (item.initialProbe || item.scenario || item.evaluationFocus) {
      return this.parseAIViva(item, { ...baseMeta, modality: "AI Viva (Mixed)" });
    } else {
      return this.parseSubjective(item, { ...baseMeta, modality: "Subjective (Mixed)" });
    }
  }

  normalizeDifficulty(val) {
    if (!val || typeof val !== "string") return "Medium";
    const clean = val.trim().toLowerCase();
    if (clean === "easy" || clean.includes("basic") || clean === "1" || clean === "beginner") return "Easy";
    if (clean === "hard" || clean.includes("advanced") || clean === "3" || clean === "senior") return "Hard";
    if (clean === "expert" || clean === "master" || clean === "4" || clean === "architect") return "Expert";
    return "Medium";
  }
}

module.exports = new QuestionParser();
