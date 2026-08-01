/**
 * ContentValidator.js — Component 10 of the Question Intelligence Engine
 * Enforces automated grammar heuristics, spell check approximations, Markdown
 * structure integrity, code block syntax balance, and explanation quality without external AI calls.
 */
class ContentValidator {
  constructor() {
    // Common repetitive typography mistakes & basic typo patterns
    this.doubledWordsRegex = /\b(the|a|an|of|in|is|and|for|to|with|by|on|at|that|from)\s+\1\b/gi;
    
    // Tautological reasoning indicators in explanations
    this.tautologyPhrases = [
      "is correct because it is correct",
      "is right because it is right",
      "is option a because option a",
      "is the answer because it is the answer",
      "no explanation needed",
      "self explanatory"
    ];
  }

  /**
   * Evaluates text grammar, formatting syntax, code structure, and explanation completeness.
   * 
   * @param {Object} question - Parsed question item
   * @returns {Object} { grammarScore, completenessScore, contentErrors: [], contentWarnings: [] }
   */
  validate(question) {
    const contentErrors = [];
    const contentWarnings = [];
    let grammarDeduction = 0;
    let completenessDeduction = 0;

    const stem = question.questionText || "";
    const explanation = question.explanation || question.sampleAnswer || "";

    // ── 1. Grammar Basics & Repetitions (Component 10) ────────────────────────
    if (stem.length > 0 && !/^[A-Z0-9'"(]/i.test(stem[0]) && !stem.startsWith("```")) {
      contentWarnings.push("GRAMMAR_WARNING: Question stem does not commence with a standard uppercase character or symbol.");
      grammarDeduction += 5;
    }

    // Check doubled word errors (e.g. "in in the database")
    let match;
    this.doubledWordsRegex.lastIndex = 0;
    while ((match = this.doubledWordsRegex.exec(stem + " " + explanation)) !== null) {
      contentWarnings.push(`GRAMMAR_DEFECT: Detected repeated sequential vocabulary word: "${match[0]}".`);
      grammarDeduction += 10;
    }

    // Check unbalanced basic quotes or dangling delimiters in stem (excluding code blocks)
    const withoutCode = stem.replace(/```[\s\S]*?```/g, "");
    const backticks = (withoutCode.match(/`/g) || []).length;
    if (backticks % 2 !== 0) {
      contentWarnings.push("FORMAT_DEFECT: Mismatched inline backtick Markdown formatting observed in question text.");
      grammarDeduction += 15;
    }

    // ── 2. Markdown & Code Block Syntax Verification ─────────────────────────
    const codeBlocks = stem.match(/```[\s\S]*?```/g) || [];
    const totalFences = (stem.match(/```/g) || []).length;
    if (totalFences % 2 !== 0) {
      contentErrors.push("MARKDOWN_ERROR: Unclosed or unescaped Markdown code block (```) found in question stem.");
      grammarDeduction += 35;
    }

    // Check code blocks for basic structural brace balancing
    for (const block of codeBlocks) {
      const openBraces = (block.match(/\{/g) || []).length;
      const closeBraces = (block.match(/\}/g) || []).length;
      if (openBraces !== closeBraces && block.includes("function") || block.includes("class")) {
        contentWarnings.push(`CODE_SYNTAX_WARNING: Potential unbalanced curly braces ({: ${openBraces}, }: ${closeBraces}) detected inside formatted code block.`);
        grammarDeduction += 15;
      }
    }

    // ── 3. Explanation & Completeness Quality ─────────────────────────────────
    if (question.modality === "MCQ") {
      if (!explanation || explanation.trim().length === 0) {
        contentWarnings.push("COMPLETENESS_WARNING: Question explanation is entirely empty.");
        completenessDeduction += 40;
      } else {
        const expLower = explanation.toLowerCase();
        for (const tp of this.tautologyPhrases) {
          if (expLower.includes(tp)) {
            contentErrors.push(`CONTENT_DEFECT: Explanation displays low-value circular tautology ("${tp}").`);
            completenessDeduction += 35;
            break;
          }
        }
        if (explanation.length < 25) {
          contentWarnings.push(`COMPLETENESS_WARNING: Explanation brevity may be insufficient for pedagogical comprehension (${explanation.length} chars).`);
          completenessDeduction += 15;
        }
      }
    }

    // Additional checks for coding problems
    if (question.modality === "Coding") {
      if (!question.constraints || question.constraints.length === 0) {
        contentWarnings.push("COMPLETENESS_WARNING: Missing execution boundary constraint statements (Time/Memory Limits).");
        completenessDeduction += 20;
      }
    }

    const grammarScore = Math.max(0, Math.min(100, 100 - grammarDeduction));
    const completenessScore = Math.max(0, Math.min(100, 100 - completenessDeduction));

    return {
      grammarScore,
      completenessScore,
      contentErrors,
      contentWarnings
    };
  }
}

module.exports = new ContentValidator();
