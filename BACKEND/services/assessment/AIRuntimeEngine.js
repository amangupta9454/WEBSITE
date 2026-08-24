/**
 * AIRuntimeEngine — Master AI Execution Pipeline Orchestrator (Phase 5)
 *
 * Enforces the immutable 10-step Code-A-Nova AI execution pipeline:
 * Assessment Input
 * ↓ Runtime Resolver (Hierarchical domain configuration & Blueprint resolution)
 * ↓ AI Request Builder (Variable token injection & schema assembly)
 * ↓ Provider Manager (Provider abstraction, error mapping & overrides)
 * ↓ Groq Manager (Multi-key Round-Robin router & Retry failover engine)
 * ↓ Groq API (7000ms SLA hardware inference execution)
 * ↓ Response Parser (Markdown stripping & syntax normalization)
 * ↓ Runtime Validator (Structural JSON schema conformance verification)
 * ↓ Runtime Logger (Persistent audit logs, metrics tracking & cache indexing)
 * ↓ Return Structured Result
 */

const runtimeResolver = require("./RuntimeResolver");
const aiRequestBuilder = require("./AIRequestBuilder");
const providerManager = require("./ProviderManager");
const responseParser = require("./ResponseParser");
const runtimeValidator = require("./RuntimeValidator");
const runtimeLogger = require("./RuntimeLogger");

class AIRuntimeEngine {
  /**
   * Main pipeline execution interface for all future Assessment AI requests.
   *
   * @param {Object} executionParams
   * @param {string} executionParams.subcategoryId
   * @param {string} executionParams.categoryId
   * @param {string} executionParams.assessmentId
   * @param {string} executionParams.blueprintId - Optional explicit override
   * @param {Object} executionParams.dynamicVariables - Overrides for tokens ({{questionCount}}, etc.)
   * @param {string} executionParams.sessionId - Optional reference for candidate session logging
   * @param {Object} executionParams.options - { simulationOnly, forceSimulateError, bypassCache, streamingEnabled }
   */
  async execute({
    subcategoryId,
    categoryId,
    assessmentId,
    blueprintId,
    dynamicVariables = {},
    sessionId = null,
    options = {}
  }) {
    const pipelineStartTime = Date.now();
    const requestId = runtimeLogger.generateRequestId();
    let queueTimeMs = 0;
    let providerTimeMs = 0;
    let parseTimeMs = 0;
    let validationTimeMs = 0;
    let targetProvider = "Groq";
    let targetModel = "openai/gpt-oss-20b";
    let apiKeyMasked = "UNRESOLVED";
    let retryCount = 0;
    let requestFingerprint = null;
    let blueprintVersion = 1;

    try {
      console.log(`[AIRuntimeEngine] 🔄 Beginning pipeline execution for Request ID: [${requestId}]`);

      // ── STEP 1: RUNTIME RESOLVER (Phase 4.1 Completed Component) ─────────────
      const resolverStartTime = Date.now();
      const [providerConfigRes, blueprintRes] = await Promise.all([
        providerManager.resolveProviderConfiguration({ assessmentId, subcategoryId, categoryId }),
        runtimeResolver.resolveBlueprintAssignment({ subcategoryId, categoryId, fallbackBlueprintId: blueprintId })
      ]);
      const runtimeProviderConfig = providerConfigRes.config || {};
      const resolverOutput = await runtimeResolver.resolveRuntimeContext({
        blueprintId: blueprintRes.selectedBlueprint?._id || blueprintId,
        subcategoryId,
        validationLevel: "Strict",
        testVariables: dynamicVariables
      });
      queueTimeMs = Date.now() - resolverStartTime;

      targetProvider = runtimeProviderConfig.primaryProvider || "Groq";
      targetModel = runtimeProviderConfig.modelName || "openai/gpt-oss-20b";
      blueprintVersion = resolverOutput.blueprint?.activeVersion || 1;

      // ── STEP 2: AI REQUEST BUILDER (Component 1) ─────────────────────────────
      const payload = aiRequestBuilder.buildRequestPayload({
        resolverOutput,
        runtimeProviderConfig,
        dynamicVariables,
        options: { ...options, requestId }
      });
      requestFingerprint = payload.fingerprint;
      queueTimeMs += payload.meta.builderLatencyMs;

      // ── STEP 3: CACHE READY CHECK (Component 15) ─────────────────────────────
      if (!options.bypassCache && !options.forceSimulateError) {
        const cachedPayload = await runtimeLogger.checkRuntimeCache(requestFingerprint);
        if (cachedPayload) {
          console.log(`[AIRuntimeEngine] ⚡ Returning instantaneous cache hit for request [${requestId}].`);
          await runtimeLogger.recordLog({
            requestId,
            provider: targetProvider + " (Cache Hit)",
            model: targetModel,
            apiKey: "CACHED_FINGERPRINT",
            sessionId,
            blueprintVersion,
            requestTimestamp: pipelineStartTime,
            responseTimestamp: Date.now(),
            latencyMs: Date.now() - pipelineStartTime,
            retryCount: 0,
            status: "SUCCESS",
            metrics: {
              queueTimeMs,
              totalRuntimeMs: Date.now() - pipelineStartTime,
              estimatedTokens: payload.meta.estimatedPromptTokens,
              costPlaceholder: "$0.0000 (Cache Reuse)"
            },
            requestFingerprint
          });
          return {
            success: true,
            requestId,
            status: "SUCCESS (CACHED)",
            provider: targetProvider,
            model: targetModel,
            apiKeyMasked: "CACHED_FINGERPRINT",
            data: cachedPayload,
            metrics: { totalRuntimeMs: Date.now() - pipelineStartTime, fromCache: true }
          };
        }
      }

      // ── STEP 4: PROVIDER MANAGER & GROQ MANAGER EXECUTION (Components 2, 3, 5, 7)
      const provStart = Date.now();
      const executionResult = await providerManager.dispatchRequest(payload);
      providerTimeMs = executionResult.latencyMs || (Date.now() - provStart);
      targetProvider = executionResult.provider || targetProvider;
      targetModel = executionResult.model || targetModel;
      apiKeyMasked = executionResult.apiKeyMasked || "UNMASKED";
      retryCount = executionResult.retryCount || 0;

      // ── STEP 5: RESPONSE PARSER (Component 11) ───────────────────────────────
      const parseResult = responseParser.parse(executionResult.rawText);
      parseTimeMs = parseResult.parserLatencyMs;

      if (!parseResult.success) {
        throw new Error(`Response Parser Failure: ${parseResult.errorMessage}`);
      }

      // ── STEP 6: RUNTIME VALIDATOR (Component 12) ─────────────────────────────
      const valResult = runtimeValidator.validateStructure(parseResult.parsedData, payload.meta.jsonSchemaSpecification);
      validationTimeMs = valResult.validationLatencyMs;

      const totalRuntimeMs = Date.now() - pipelineStartTime;
      const returnedTokens = executionResult.usage?.completion_tokens || Math.round(String(executionResult.rawText).length / 3.8);
      const estimatedTokens = payload.meta.estimatedPromptTokens || executionResult.usage?.prompt_tokens || 0;

      const structuredResult = {
        success: valResult.isValid,
        requestId,
        status: valResult.isValid ? (executionResult.wasFallbackTriggered ? "FALLBACK_TRIGGERED" : "SUCCESS") : "VALIDATION_WARNING",
        provider: targetProvider,
        model: targetModel,
        apiKeyMasked,
        latencyMs: totalRuntimeMs,
        retryCount,
        parsedData: parseResult.parsedData,
        rawString: parseResult.rawString,
        validation: {
          isValid: valResult.isValid,
          score: valResult.validationScore,
          missingFields: valResult.missingFields,
          unexpectedFields: valResult.unexpectedFields,
          errors: valResult.errors,
          checkedItemsCount: valResult.checkedItemsCount
        },
        metrics: {
          queueTimeMs,
          providerTimeMs,
          responseParseTimeMs: parseTimeMs,
          validationTimeMs,
          totalRuntimeMs,
          estimatedTokens,
          returnedTokens,
          costPlaceholder: `$${((estimatedTokens * 0.0000007) + (returnedTokens * 0.0000008)).toFixed(6)} (Standard Estimation)`
        }
      };

      // ── STEP 7: RUNTIME LOGGER & CACHE INDEXING (Components 9, 10, 15) ───────
      await runtimeLogger.recordLog({
        requestId,
        provider: targetProvider,
        model: targetModel,
        apiKey: apiKeyMasked,
        sessionId,
        blueprintVersion,
        requestTimestamp: pipelineStartTime,
        responseTimestamp: Date.now(),
        latencyMs: totalRuntimeMs,
        retryCount,
        status: valResult.isValid ? "SUCCESS" : "FAILED",
        errorCode: valResult.isValid ? null : "SCHEMA_CONFORMANCE_VIOLATION",
        errorMessage: valResult.isValid ? null : valResult.errors.join("; "),
        metrics: structuredResult.metrics,
        requestFingerprint
      });

      if (valResult.isValid && !options.simulationOnly) {
        await runtimeLogger.storeRuntimeCache(requestFingerprint, parseResult.parsedData);
      }

      console.log(`[AIRuntimeEngine] ✅ Pipeline completed in ${totalRuntimeMs}ms. Status: [${structuredResult.status}]`);
      return structuredResult;

    } catch (pipelineError) {
      // ── PIPELINE EXCEPTION & PROVIDER ERROR MAPPING (Component 13) ───────────
      const mappedErr = pipelineError.mappedRuntimeError || providerManager.mapProviderError(pipelineError, targetProvider);
      const failRuntimeMs = Date.now() - pipelineStartTime;
      const errStatus = mappedErr.errorCode === "TIMEOUT_EXCEEDED" ? "TIMEOUT" :
                        mappedErr.errorCode === "RATE_LIMIT_EXCEEDED" ? "RATE_LIMITED" : "FAILED";

      console.error(`[AIRuntimeEngine] ❌ Pipeline terminated with failure (${mappedErr.errorCode}): ${mappedErr.errorMessage}`, pipelineError);

      await runtimeLogger.recordLog({
        requestId,
        provider: targetProvider,
        model: targetModel,
        apiKey: apiKeyMasked,
        sessionId,
        blueprintVersion,
        requestTimestamp: pipelineStartTime,
        responseTimestamp: Date.now(),
        latencyMs: failRuntimeMs,
        retryCount: pipelineError.retryCount || retryCount || 0,
        status: errStatus,
        errorCode: mappedErr.errorCode,
        errorMessage: mappedErr.errorMessage,
        metrics: {
          queueTimeMs,
          providerTimeMs: failRuntimeMs - queueTimeMs,
          totalRuntimeMs: failRuntimeMs,
          estimatedTokens: 0,
          returnedTokens: 0,
          costPlaceholder: "$0.0000 (Failed Request)"
        },
        requestFingerprint
      });

      return {
        success: false,
        requestId,
        status: errStatus,
        error: {
          code: mappedErr.errorCode,
          message: mappedErr.errorMessage,
          rawVendorDetails: mappedErr.originalVendorMessage
        },
        provider: targetProvider,
        model: targetModel,
        apiKeyMasked,
        latencyMs: failRuntimeMs,
        retryCount: pipelineError.retryCount || retryCount || 0,
        metrics: {
          totalRuntimeMs: failRuntimeMs,
          queueTimeMs,
          providerTimeMs: failRuntimeMs - queueTimeMs
        }
      };
    }
  }

  /**
   * Diagnostic test harness for Admin UI testing utilities (Component 19)
   * Does NOT generate assessment questions! Strictly verifies round-robin routing, retries, parsing, and health.
   */
  async executeDiagnosticTest(testType = "ROUND_ROBIN") {
    console.log(`[AIRuntimeEngine] 🧪 Running diagnostic test suite for mode: [${testType}]`);

    if (testType === "HEALTH_STATUS") {
      return {
        success: true,
        poolStatus: providerManager.getProviderPoolStatus(),
        metricsSummary: await runtimeLogger.getMetricsSummary()
      };
    }

    if (testType === "COOLDOWN_RECOVERY") {
      const restored = require("./GroqManager").restoreAllCooldownKeys();
      return {
        success: true,
        message: `Admin manual recovery restored ${restored} key(s) to Healthy state.`,
        poolStatus: providerManager.getProviderPoolStatus()
      };
    }

    // Execute diagnostic invocation (using simple JSON test verification, NO question generation)
    const testVariables = {
      category: "Diagnostic Engineering",
      subcategory: `Engine Validation - Mode: ${testType}`,
      questionCount: "1",
      difficulty: "Medium"
    };

    const options = {
      simulationOnly: true,
      bypassCache: true
    };

    if (testType === "SIMULATE_429_RATE_LIMIT") {
      options.forceSimulateError = "429";
    } else if (testType === "SIMULATE_TIMEOUT") {
      options.forceSimulateError = "TIMEOUT";
    }

    const testExecution = await this.execute({
      subcategoryId: null,
      categoryId: null,
      dynamicVariables: testVariables,
      options
    });

    return {
      testType,
      executionResult: testExecution,
      poolHealthAfterTest: providerManager.getProviderPoolStatus().groqPoolDetails
    };
  }
}

module.exports = new AIRuntimeEngine();
