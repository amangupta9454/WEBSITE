/**
 * StructureValidator.js — Components 2, 3, 4, 5, and 19 of Question Intelligence Engine
 * Enforces JSON integrity, reusable schema conformancy, structural item validity,
 * modality-specific answer verification, and zero-trust input security guardrails.
 */
class StructureValidator {
  constructor() {
    // Security limits (Component 19)
    this.MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5MB limit for bulk batches
    this.MAX_QUESTION_LENGTH = 5000;          // Max stem length characters
    this.MIN_QUESTION_LENGTH = 15;            // Min stem length characters
    this.MAX_OPTIONS_COUNT = 10;
  }

  /**
   * Performs complete structural and schema validation on a parsed question item.
   * 
   * @param {Object} question - Parsed internal question memory object
   * @param {Object} schema - Optional Phase 4.1 Reusable Schema object from Prompt Studio
   * @param {Object} options - Validation configs (e.g. requireExplanation: true)
   * @returns {Object} { isValid: boolean, errors: Array<string>, warnings: Array<string>, structureScore: number }
   */
  validate(question, schema = null, options = { requireExplanation: true }) {
    const errors = [];
    const warnings = [];
    let deduction = 0;

    // ── 1. Security & Malformed Input Guardrails (Component 19) ──────────────────
    if (!question || typeof question !== "object") {
      return {
        isValid: false,
        errors: ["SECURITY_DEFECT: Invalid memory object or malformed payload structure."],
        warnings: [],
        structureScore: 0
      };
    }

    if (question.parseError) {
      errors.push(`JSON_SYNTAX_ERROR: ${question.parseErrorMessage || "Item failed parser normalization."}`);
      return { isValid: false, errors, warnings: [], structureScore: 0 };
    }

    // Check oversized payloads and script injections
    const rawString = JSON.stringify(question.rawInput || question);
    if (Buffer.byteLength(rawString, "utf8") > 500 * 1024) { // 500KB per item ceiling
      errors.push("SECURITY_DEFECT: Individual question item exceeds 500KB memory security threshold.");
    }
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(question.questionText || "")) {
      errors.push("SECURITY_DEFECT: Detected unsafe <script> HTML injection tag in question stem.");
      deduction += 100;
    }

    // ── 2. Reusable Schema Validation (Component 2 & 3) ─────────────────────────
    if (schema && typeof schema === "object") {
      const schemaValidation = this.validateAgainstSchema(question.rawInput || question, schema);
      if (!schemaValidation.isValid) {
        errors.push(...schemaValidation.errors);
        deduction += schemaValidation.errors.length * 20;
      }
      if (schemaValidation.warnings.length) {
        warnings.push(...schemaValidation.warnings);
        deduction += schemaValidation.warnings.length * 5;
      }
    }

    // ── 3. General Question Stem Validation (Component 4) ───────────────────────
    const stem = question.questionText || "";
    if (!stem || stem.trim().length === 0 || stem === "[Malformed Question Stem]") {
      errors.push("STRUCTURE_ERROR: Question stem text is completely empty or missing.");
      deduction += 50;
    } else {
      if (stem.length < this.MIN_QUESTION_LENGTH) {
        errors.push(`STRUCTURE_ERROR: Question stem is shorter than minimum required length (${stem.length} < ${this.MIN_QUESTION_LENGTH} chars).`);
        deduction += 25;
      }
      if (stem.length > this.MAX_QUESTION_LENGTH) {
        errors.push(`STRUCTURE_ERROR: Question stem exceeds maximum allowed limit (${stem.length} > ${this.MAX_QUESTION_LENGTH} chars).`);
        deduction += 25;
      }
    }

    if (options.requireExplanation && question.modality === "MCQ" && (!question.explanation || question.explanation.trim().length < 10)) {
      warnings.push("STRUCTURE_WARNING: Question explanation/rationale is missing or overly terse (< 10 chars).");
      deduction += 10;
    }

    // ── 4. Modality-Specific Answer Validation (Component 5) ───────────────────
    const modality = question.modality || "MCQ";
    if (modality.includes("MCQ")) {
      const mcqVal = this.validateMCQAnswers(question);
      errors.push(...mcqVal.errors);
      warnings.push(...mcqVal.warnings);
      deduction += mcqVal.deduction;
    } else if (modality.includes("Coding")) {
      const codeVal = this.validateCodingProblem(question);
      errors.push(...codeVal.errors);
      warnings.push(...codeVal.warnings);
      deduction += codeVal.deduction;
    } else if (modality.includes("Viva")) {
      const vivaVal = this.validateAIViva(question);
      errors.push(...vivaVal.errors);
      warnings.push(...vivaVal.warnings);
      deduction += vivaVal.deduction;
    } else if (modality.includes("Subjective")) {
      const subVal = this.validateSubjective(question);
      errors.push(...subVal.errors);
      warnings.push(...subVal.warnings);
      deduction += subVal.deduction;
    }

    const structureScore = Math.max(0, Math.min(100, 100 - deduction));
    const isValid = errors.length === 0;

    return { isValid, errors, warnings, structureScore };
  }

  /**
   * Dynamic Schema Validator against Phase 4.1 Prompt Studio schemas (Component 3)
   */
  validateAgainstSchema(item, schema) {
    const errors = [];
    const warnings = [];

    const expectedProperties = schema.properties || schema.schema || {};
    const requiredKeys = Array.isArray(schema.required) ? schema.required : Object.keys(expectedProperties);

    // Check Required Keys & Correct Types (Component 2)
    for (const key of requiredKeys) {
      if (item[key] === undefined && item[key.toLowerCase()] === undefined) {
        errors.push(`SCHEMA_DEFECT: Missing mandatory schema attribute: "${key}".`);
      }
    }

    // Check Unexpected Keys
    const allowedKeys = new Set([
      ...Object.keys(expectedProperties),
      "id", "type", "modality", "temporaryId", "originalIndex", "parsedAt", "rawInput", "tags", "category", "level"
    ]);
    for (const key of Object.keys(item)) {
      if (!allowedKeys.has(key)) {
        warnings.push(`SCHEMA_WARNING: Detected unexpected non-standard attribute in output: "${key}".`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Component 5: MCQ Answer Verification
   */
  validateMCQAnswers(question) {
    const errors = [];
    const warnings = [];
    let deduction = 0;

    const options = question.options || [];
    if (!Array.isArray(options) || options.length < 2) {
      errors.push("ANSWER_DEFECT: MCQ must contain at least 2 distinct selectable options.");
      deduction += 40;
    } else {
      if (options.length > this.MAX_OPTIONS_COUNT) {
        warnings.push(`ANSWER_WARNING: High option density detected (${options.length} options > standard 4-6).`);
      }
      // Check for empty option strings (Component 4)
      const emptyCount = options.filter(o => !o || o.trim().length === 0).length;
      if (emptyCount > 0) {
        errors.push(`ANSWER_DEFECT: Found ${emptyCount} empty or whitespace-only option choices.`);
        deduction += 20 * emptyCount;
      }
      // Check for duplicate option texts (Component 4)
      const normalizedOpts = options.map(o => o.trim().toLowerCase());
      const uniqueOpts = new Set(normalizedOpts);
      if (uniqueOpts.size < options.length) {
        errors.push("ANSWER_DEFECT: Duplicate options detected in choices list.");
        deduction += 30;
      }
    }

    // Ensure exactly one valid correct answer exists (Component 5)
    const ans = question.correctAnswer || "";
    if (!ans) {
      errors.push("ANSWER_DEFECT: No correctAnswer specified in MCQ parameters.");
      deduction += 50;
    } else if (options.length >= 2) {
      // Check if answer matches one of the option values or indices (like "A", "B", "C", "0", "1" or full string match)
      const cleanAns = ans.trim().toLowerCase();
      const matchFound = options.some(o => o.trim().toLowerCase() === cleanAns) ||
                         /^[a-h]$/i.test(ans.trim()) ||
                         /^\d+$/.test(ans.trim());
      if (!matchFound) {
        warnings.push(`ANSWER_WARNING: correctAnswer "${ans}" does not explicitly match any option strings or A-D indices.`);
        deduction += 15;
      }
    }

    return { errors, warnings, deduction };
  }

  /**
   * Component 5: Coding Problem Answer & Structural Verification
   */
  validateCodingProblem(question) {
    const errors = [];
    const warnings = [];
    let deduction = 0;

    if (!question.inputFormat || question.inputFormat.length < 5) {
      warnings.push("CODING_DEFECT: Input format specifications missing or incomplete.");
      deduction += 15;
    }
    if (!question.outputFormat || question.outputFormat.length < 5) {
      warnings.push("CODING_DEFECT: Output format specifications missing or incomplete.");
      deduction += 15;
    }
    if (!question.testCases || question.testCases.length === 0) {
      errors.push("CODING_DEFECT: Coding problem contains zero verification test cases or samples.");
      deduction += 40;
    } else {
      const validCases = question.testCases.filter(t => t && t.input !== undefined && t.output !== undefined);
      if (validCases.length < question.testCases.length) {
        errors.push("CODING_DEFECT: One or more sample test cases lack required input/output definition keys.");
        deduction += 20;
      }
    }

    return { errors, warnings, deduction };
  }

  /**
   * Component 5: AI Viva Prompt Structure Verification
   */
  validateAIViva(question) {
    const errors = [];
    const warnings = [];
    let deduction = 0;

    if (!question.scenario || question.scenario.length < 20) {
      errors.push("VIVA_DEFECT: Conversational scenario context is missing or too brief (< 20 chars).");
      deduction += 35;
    }
    if (!question.initialProbe || question.initialProbe.length < 10) {
      errors.push("VIVA_DEFECT: Initial candidate probe question is missing or invalid.");
      deduction += 35;
    }
    if (!question.evaluationFocus || question.evaluationFocus.length === 0) {
      warnings.push("VIVA_WARNING: No explicit evaluation focus domains or assessment rubric criteria documented.");
      deduction += 15;
    }

    return { errors, warnings, deduction };
  }

  /**
   * Component 5: Subjective Essay & Rubric Verification
   */
  validateSubjective(question) {
    const errors = [];
    const warnings = [];
    let deduction = 0;

    if (!question.rubric || !Array.isArray(question.rubric) || question.rubric.length === 0) {
      errors.push("SUBJECTIVE_DEFECT: Subjective evaluation question lacks mandatory grading rubric references.");
      deduction += 40;
    } else {
      const totalWeight = question.rubric.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
      if (totalWeight !== 100 && totalWeight > 0) {
        warnings.push(`SUBJECTIVE_WARNING: Rubric scoring criteria weights sum to ${totalWeight}% instead of standard 100%.`);
        deduction += 10;
      }
    }

    if (!question.sampleAnswer && !question.explanation) {
      warnings.push("SUBJECTIVE_WARNING: No reference answer or sample solution provided for automated evaluator.");
      deduction += 15;
    }

    return { errors, warnings, deduction };
  }
}

module.exports = new StructureValidator();
