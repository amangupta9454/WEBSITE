/**
 * RuntimeValidator Service (Phase 5 — Component 12)
 *
 * Responsibilities ONLY:
 * - Validate provider normalized JSON response structure against Expected Output Schema.
 * - Detect structural discrepancies: Missing required keys and Unexpected extraneous fields.
 * - Enforce JSON typing constraints (e.g. confirming arrays vs objects).
 * - Return a structured runtime validation evaluation result.
 *
 * IMPORTANT ARCHITECTURE RULE:
 * Do NOT validate assessment questions! (e.g., semantic accuracy, correct index bounds, distractor plausibility,
 * or topic relevance). All candidate question evaluation strictly belongs to the Question Validation Engine (Phase 6).
 */

class RuntimeValidator {
  /**
   * Validates structural conformity of parsed response data against expected schema specifications.
   *
   * @param {Object|Array} parsedData - Normalized JavaScript data from ResponseParser
   * @param {string|Object} expectedSchema - JSON schema definition from AIRequestBuilder / RuntimeResolver
   */
  validateStructure(parsedData, expectedSchema = null) {
    const startTime = Date.now();
    const result = {
      isValid: true,
      validationScore: 100,
      missingFields: [],
      unexpectedFields: [],
      errors: [],
      validationLatencyMs: 0,
      checkedItemsCount: 0
    };

    // 1. Initial Structural Presence Check
    if (!parsedData) {
      result.isValid = false;
      result.validationScore = 0;
      result.errors.push("Null or undefined parsed response structure.");
      result.validationLatencyMs = Date.now() - startTime;
      return result;
    }

    // 2. Parse expected Schema representation if passed as JSON string
    let schemaObj = null;
    if (typeof expectedSchema === "string") {
      try {
        schemaObj = JSON.parse(expectedSchema);
      } catch (e) {
        // Expected schema string might be instructional text or informal JSON representation
      }
    } else if (typeof expectedSchema === "object" && expectedSchema !== null) {
      schemaObj = expectedSchema;
    }

    // 3. Evaluate Array vs Object container expectation
    const isArrayExpected = Array.isArray(schemaObj) || (typeof expectedSchema === "string" && expectedSchema.trim().startsWith("["));
    const isReceivedArray = Array.isArray(parsedData);

    if (isArrayExpected && !isReceivedArray) {
      result.isValid = false;
      result.validationScore -= 50;
      result.errors.push(`Container mismatch: Expected a JSON Array structure [ ... ], but received a standard JSON Object.`);
      result.validationLatencyMs = Date.now() - startTime;
      return result;
    }

    // 4. Perform field level conformance checking across items (if schema sample provided)
    if (schemaObj && (isArrayExpected ? schemaObj.length > 0 : Object.keys(schemaObj).length > 0)) {
      const templateItem = isArrayExpected ? schemaObj[0] : schemaObj;
      const receivedItems = isReceivedArray ? parsedData : [parsedData];

      if (typeof templateItem === "object" && templateItem !== null) {
        const expectedKeys = new Set(Object.keys(templateItem));

        receivedItems.forEach((item, index) => {
          result.checkedItemsCount++;
          if (typeof item !== "object" || item === null) {
            result.errors.push(`Item at index [${index}] is not a valid JSON Object.`);
            result.isValid = false;
            result.validationScore -= 20;
            return;
          }

          const actualKeys = new Set(Object.keys(item));

          // Detect Missing Required Fields
          expectedKeys.forEach((k) => {
            if (!actualKeys.has(k)) {
              const msg = `Item [${index}] missing required structural schema field: "${k}"`;
              if (!result.missingFields.includes(msg)) {
                result.missingFields.push(msg);
                result.isValid = false;
                result.validationScore = Math.max(0, result.validationScore - 15);
              }
            }
          });

          // Detect Unexpected / Undocumented Fields (Warning / non-fatal unless excessive)
          actualKeys.forEach((k) => {
            if (!expectedKeys.has(k) && k !== "meta" && k !== "_id") {
              const msg = `Item [${index}] contains undocumented schema field: "${k}"`;
              if (!result.unexpectedFields.includes(msg)) {
                result.unexpectedFields.push(msg);
                // Subtle penalty for schema drift
                result.validationScore = Math.max(0, result.validationScore - 5);
              }
            }
          });
        });
      }
    } else {
      // Default fallback verification if informal schema was passed
      result.checkedItemsCount = isReceivedArray ? parsedData.length : 1;
    }

    if (result.validationScore < 70) {
      result.isValid = false;
      result.errors.push(`Structural validation score dropped below acceptable SLA boundary (Score: ${result.validationScore}%)`);
    }

    result.validationLatencyMs = Date.now() - startTime;
    return result;
  }
}

module.exports = new RuntimeValidator();
