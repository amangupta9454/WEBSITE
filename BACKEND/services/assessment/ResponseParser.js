/**
 * ResponseParser Service (Phase 5 — Component 11)
 *
 * Responsibility ONLY:
 * - Intercept raw text completions returned by Groq or fallback providers.
 * - Strip out extraneous markdown code fence formatting (e.g. ```json ... ```).
 * - Perform safe syntactic JSON parsing without throwing unhandled exceptions.
 * - Normalize output into standard immutable structures before passing to Runtime Validator.
 *
 * IMPORTANT ARCHITECTURE RULE:
 * Groq raw response must NEVER go directly to the future Question Engine.
 * The parser should ONLY normalize structure. NO question validation occurs here.
 */

class ResponseParser {
  /**
   * Normalizes and parses raw model output strings into clean structured payloads.
   * @param {string} rawContent - Raw completion output text from LLM provider
   */
  parse(rawContent) {
    const startTime = Date.now();
    const result = {
      success: false,
      parsedData: null,
      rawString: rawContent || "",
      parserLatencyMs: 0,
      errorMessage: null,
      wasSanitized: false
    };

    if (!rawContent || typeof rawContent !== "string") {
      result.errorMessage = "Empty or non-string response content received from AI provider.";
      result.parserLatencyMs = Date.now() - startTime;
      return result;
    }

    let cleanedText = rawContent.trim();

    // 1. Strip Markdown code fences if model wrapped JSON in ```json ... ```
    if (cleanedText.startsWith("```")) {
      result.wasSanitized = true;
      const lines = cleanedText.split("\n");
      // Remove opening fence (e.g., ```json or ```)
      if (lines[0].startsWith("```")) lines.shift();
      // Remove closing fence if present at the end
      if (lines.length > 0 && lines[lines.length - 1].trim().startsWith("```")) {
        lines.pop();
      }
      cleanedText = lines.join("\n").trim();
    }

    // 2. Locate outermost JSON boundaries (Array [ ... ] or Object { ... }) if conversational fluff preceded/succeeded
    const firstBracket = cleanedText.indexOf("[");
    const firstBrace = cleanedText.indexOf("{");
    let startIdx = -1;
    let endIdx = -1;

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      // Primary structure is JSON Array
      startIdx = firstBracket;
      endIdx = cleanedText.lastIndexOf("]");
    } else if (firstBrace !== -1) {
      // Primary structure is JSON Object
      startIdx = firstBrace;
      endIdx = cleanedText.lastIndexOf("}");
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const candidateJson = cleanedText.slice(startIdx, endIdx + 1);
      if (candidateJson !== cleanedText) {
        result.wasSanitized = true;
        cleanedText = candidateJson;
      }
    }

    // 3. Safe syntactic parsing
    try {
      result.parsedData = JSON.parse(cleanedText);
      result.success = true;
    } catch (err) {
      result.success = false;
      result.errorMessage = `JSON Syntax Parsing Exception: ${err.message}. Raw prefix: ${cleanedText.slice(0, 100)}...`;
    }

    result.parserLatencyMs = Date.now() - startTime;
    return result;
  }
}

module.exports = new ResponseParser();
