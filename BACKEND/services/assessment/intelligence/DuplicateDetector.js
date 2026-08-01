const crypto = require("crypto");

/**
 * DuplicateDetector.js — Component 6 of the Question Intelligence Engine
 * Implements a 3-tier duplicate detection pipeline:
 *  - Level 1: Exact String Match against batch & runtime memory index
 *  - Level 2: Normalized SHA-256 Fingerprint Match (removes case, punctuation, whitespace)
 *  - Level 3: Semantic Ready Architecture (stub interfaces for vector embedding similarity)
 */
class DuplicateDetector {
  constructor() {
    // In-memory runtime index for current lifecycle checking without database DB saving
    this.runtimeFingerprints = new Map(); // fingerprint -> { temporaryId, stem }
  }

  /**
   * Evaluates a question for duplicate risks against the active batch and runtime index.
   * 
   * @param {Object} question - Parsed internal question object
   * @param {Map} batchFingerprints - Active Map of fingerprints generated in current batch
   * @returns {Object} { fingerprint, duplicateRisk, isDuplicate, matchLevel, matchDetails }
   */
  detect(question, batchFingerprints = new Map()) {
    const stem = (question.questionText || "").trim();
    const normalizedText = this.normalizeText(stem);
    const fingerprint = this.computeFingerprint(normalizedText);

    let matchLevel = "None";
    let isDuplicate = false;
    let duplicateRisk = 0; // 0 (Unique) to 100 (Exact Duplicate)
    let matchedItem = null;

    // ── LEVEL 1: Exact Stem Match ──────────────────────────────────────────────
    for (const [existingFp, meta] of batchFingerprints.entries()) {
      if (meta.rawStem && meta.rawStem === stem && meta.temporaryId !== question.temporaryId) {
        matchLevel = "Level 1 (Exact Match)";
        isDuplicate = true;
        duplicateRisk = 100;
        matchedItem = meta.temporaryId;
        break;
      }
    }

    // ── LEVEL 2: Normalized Fingerprint Match ─────────────────────────────────
    if (!isDuplicate) {
      if (batchFingerprints.has(fingerprint) && batchFingerprints.get(fingerprint).temporaryId !== question.temporaryId) {
        matchLevel = "Level 2 (Normalized Match)";
        isDuplicate = true;
        duplicateRisk = 95;
        matchedItem = batchFingerprints.get(fingerprint).temporaryId;
      } else if (this.runtimeFingerprints.has(fingerprint) && this.runtimeFingerprints.get(fingerprint).temporaryId !== question.temporaryId) {
        matchLevel = "Level 2 (Runtime Memory Pool Match)";
        isDuplicate = true;
        duplicateRisk = 90;
        matchedItem = this.runtimeFingerprints.get(fingerprint).temporaryId;
      }
    }

    // ── LEVEL 3: Semantic Ready Architecture (Stub) ───────────────────────────
    // Prepares infrastructure for future LLM vector embeddings without generating database persistence or calling AI now.
    if (!isDuplicate) {
      const semanticSim = this.evaluateSemanticSimilarityStub(normalizedText, batchFingerprints);
      if (semanticSim.similarityScore > 0.85) {
        matchLevel = "Level 3 (Semantic Proximity Warning - Heuristic)";
        duplicateRisk = Math.min(85, Math.round(semanticSim.similarityScore * 100));
        matchedItem = semanticSim.matchedId || "SIMILAR_CONCEPT";
      } else {
        duplicateRisk = Math.max(0, Math.round(semanticSim.similarityScore * 25)); // Low residual baseline
      }
    }

    // Register fingerprint into current batch tracker
    batchFingerprints.set(fingerprint, {
      temporaryId: question.temporaryId,
      rawStem: stem,
      normalizedText
    });

    // Also cache into general runtime ephemeral memory pool (capped at 5,000 items)
    if (this.runtimeFingerprints.size > 5000) {
      const firstKey = this.runtimeFingerprints.keys().next().value;
      this.runtimeFingerprints.delete(firstKey);
    }
    this.runtimeFingerprints.set(fingerprint, {
      temporaryId: question.temporaryId,
      stem: stem
    });

    return {
      fingerprint,
      duplicateRisk,
      isDuplicate,
      matchLevel,
      matchDetails: matchedItem ? `Matched with signature ${matchedItem}` : "No duplicate collision detected in memory."
    };
  }

  /**
   * Normalizes text by removing punctuation, case differences, Markdown grammar, and superfluous whitespace (Level 2).
   */
  normalizeText(text) {
    if (!text || typeof text !== "string") return "";
    return text
      .toLowerCase()
      .replace(/```[\s\S]*?```/g, " [CODE_BLOCK] ") // Replaces detailed code blocks with token
      .replace(/[^\w\s]|_/g, "")                  // Strips all punctuation characters
      .replace(/\s+/g, " ")                       // Collapses consecutive whitespace to single space
      .trim();
  }

  /**
   * Generates a deterministic SHA-256 hex digest for normalized question strings.
   */
  computeFingerprint(normalizedText) {
    return crypto
      .createHash("sha256")
      .update(normalizedText || "empty_question_signature")
      .digest("hex");
  }

  /**
   * Level 3: Semantic Similarity Readiness Adapter
   * Currently employs Jaccard word intersection heuristics as a lightweight semantic approximation
   * while establishing explicit interface contracts for future Vector Embeddings (OpenAI text-embedding-3 / Gemini).
   */
  evaluateSemanticSimilarityStub(normalizedText, batchMap) {
    if (!normalizedText || batchMap.size === 0) {
      return { similarityScore: 0.0, matchedId: null };
    }

    const wordsA = new Set(normalizedText.split(" ").filter(w => w.length > 3));
    if (wordsA.size === 0) return { similarityScore: 0.0, matchedId: null };

    let highestSim = 0.0;
    let bestMatchId = null;

    for (const [fp, meta] of batchMap.entries()) {
      if (!meta.normalizedText) continue;
      const wordsB = new Set(meta.normalizedText.split(" ").filter(w => w.length > 3));
      if (wordsB.size === 0) continue;

      let intersectCount = 0;
      for (const w of wordsA) {
        if (wordsB.has(w)) intersectCount++;
      }

      const unionSize = new Set([...wordsA, ...wordsB]).size;
      const jaccard = unionSize > 0 ? intersectCount / unionSize : 0;

      if (jaccard > highestSim) {
        highestSim = jaccard;
        bestMatchId = meta.temporaryId;
      }
    }

    return {
      similarityScore: highestSim,
      matchedId: bestMatchId,
      architectureNote: "Ready to swap Jaccard intersection with Dense Vector Embedding Cosine Similarity in future roadmap phase."
    };
  }

  /**
   * Manually clears ephemeral runtime memory index (for automated test suite resets).
   */
  resetRuntimeMemory() {
    this.runtimeFingerprints.clear();
  }
}

module.exports = new DuplicateDetector();
