/**
 * RuntimeLogger & Security Telemetry Service (Phase 5 — Components 8, 9, 10, 14, 15, 18)
 *
 * Responsibilities:
 * - Generate canonical Unique AI Request IDs (e.g. REQ-20260801-000001).
 * - Securely mask API credentials before persistence or console diagnostics.
 * - Track exhaustive execution metrics (Queue, Provider, Parse, Validation & Total times; Token ratios; Cost stubs).
 * - Persist structured log records into MongoDB via AIRuntimeLog schema.
 * - Provide ready-to-plug interfaces for future distributed queueing (BullMQ/Redis/RabbitMQ) [Component 14].
 * - Provide canonical SHA-256 request fingerprinting for future response caching [Component 15].
 */

const crypto = require("crypto");
const AIRuntimeLog = require("../../models/assessment/AIRuntimeLog");

let sequenceCounter = 1;
const sessionStartTime = Date.now();

class RuntimeLogger {
  constructor() {
    this.inMemoryLogs = []; // Fallback ring buffer for quick real-time diagnostics
    this.cacheRegistry = new Map(); // In-memory cache stub for Component 15
  }

  /**
   * Component 8: Generate Canonical AI Request ID
   * Format: REQ-YYYYMMDD-XXXXXX (e.g., REQ-20260801-000001)
   */
  generateRequestId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const seqStr = String(sequenceCounter++).padStart(6, "0");
    const randSuffix = Math.floor(Math.random() * 90 + 10); // 2 digit entropy
    return `REQ-${dateStr}-${seqStr}${randSuffix}`;
  }

  /**
   * Component 18: Security Credential Masking
   * Never exposes raw API keys in logs, errors, or returns.
   * Example: "gsk_abc1234567890defghijklmnopqrstuv" -> "gsk_abc1...uv"
   */
  maskApiKey(key) {
    if (!key || typeof key !== "string") return "KEY_MISSING_OR_INVALID";
    const trimmed = key.trim();
    if (trimmed.length <= 8) return "••••••••";
    const prefix = trimmed.slice(0, 7);
    const suffix = trimmed.slice(-4);
    return `${prefix}••••••••••••••••${suffix}`;
  }

  /**
   * Component 15: Cache Ready Architecture & Request Fingerprint Generator
   * Computes deterministic SHA-256 hash of:
   * [Blueprint Version + Variables + Output Schema + Provider + Model]
   */
  generateRequestFingerprint({ blueprintVersion, variables = {}, outputSchema = "", provider = "Groq", model = "openai/gpt-oss-20b" }) {
    const sortedVars = Object.keys(variables)
      .sort()
      .map(k => `${k}:${variables[k]}`)
      .join("|");
    const canonicalPayload = `V=${blueprintVersion}||VARS=${sortedVars}||SCHEMA=${typeof outputSchema === "string" ? outputSchema : JSON.stringify(outputSchema)}||P=${provider}||M=${model}`;
    return crypto.createHash("sha256").update(canonicalPayload).digest("hex");
  }

  /**
   * Component 15 Cache Check Stub
   */
  async checkRuntimeCache(fingerprint) {
    if (!fingerprint) return null;
    // Architecture ready: Future phases will query Redis or Mongo Cache Collection here
    if (this.cacheRegistry.has(fingerprint)) {
      const cached = this.cacheRegistry.get(fingerprint);
      if (Date.now() - cached.timestamp < 3600 * 1000) { // 1 hour TTL simulation
        console.log(`[RuntimeCache] 🟢 Cache hit for fingerprint ${fingerprint.slice(0, 8)}...`);
        return cached.payload;
      }
    }
    return null;
  }

  /**
   * Component 15 Cache Store Stub
   */
  async storeRuntimeCache(fingerprint, payload) {
    if (!fingerprint) return;
    this.cacheRegistry.set(fingerprint, { timestamp: Date.now(), payload });
    // Cleanup old items if ring buffer exceeds 500
    if (this.cacheRegistry.size > 500) {
      const firstKey = this.cacheRegistry.keys().next().value;
      this.cacheRegistry.delete(firstKey);
    }
  }

  /**
   * Component 14: Runtime Queue Ready Architecture
   * Prepared architectural hook to transition direct async invocation into scheduled job drivers.
   */
  async enqueueRuntimeJob(jobPayload, driver = "BullMQ") {
    console.log(`[RuntimeQueue] ⏳ Architecture Hook triggered for driver: [${driver}]. Job ID: ${jobPayload.requestId}`);
    // In Phase 5, execution happens directly in the worker pipeline; future engines will push to Redis/BullMQ/RabbitMQ
    return {
      queued: true,
      driver,
      queueName: "assessment-ai-runtime-queue",
      timestamp: Date.now()
    };
  }

  /**
   * Component 9 & 10: Persist Runtime Log with exhaustive usage Metrics
   */
  async recordLog({
    requestId,
    provider,
    model,
    apiKey,
    sessionId = null,
    blueprintVersion = 1,
    assessmentConfigVersion = 1,
    requestTimestamp = Date.now(),
    responseTimestamp = Date.now(),
    latencyMs = 0,
    retryCount = 0,
    status = "SUCCESS",
    errorCode = null,
    errorMessage = null,
    metrics = {},
    requestFingerprint = null
  }) {
    const maskedKey = this.maskApiKey(apiKey);

    const fullMetrics = {
      queueTimeMs: metrics.queueTimeMs || 0,
      providerTimeMs: metrics.providerTimeMs || latencyMs || 0,
      responseParseTimeMs: metrics.responseParseTimeMs || 0,
      validationTimeMs: metrics.validationTimeMs || 0,
      totalRuntimeMs: metrics.totalRuntimeMs || (Date.now() - requestTimestamp) || latencyMs || 0,
      estimatedTokens: metrics.estimatedTokens || 0,
      returnedTokens: metrics.returnedTokens || 0,
      costPlaceholder: metrics.costPlaceholder || "$0.0000 (Standard Tier)"
    };

    const logEntry = {
      requestId: requestId || this.generateRequestId(),
      provider: provider || "Groq",
      model: model || "openai/gpt-oss-20b",
      apiKeyMasked: maskedKey,
      sessionId,
      blueprintVersion,
      assessmentConfigVersion,
      requestTimestamp,
      responseTimestamp,
      latencyMs,
      retryCount,
      status,
      errorCode,
      errorMessage,
      metrics: fullMetrics,
      requestFingerprint
    };

    // Keep in ring buffer for instantaneous UI testing & diagnostics
    this.inMemoryLogs.unshift(logEntry);
    if (this.inMemoryLogs.length > 200) this.inMemoryLogs.pop();

    // Persist asynchronously to MongoDB without blocking execution path
    try {
      if (AIRuntimeLog.db && AIRuntimeLog.db.readyState === 1) {
        await AIRuntimeLog.create(logEntry);
      }
    } catch (err) {
      console.warn("[RuntimeLogger] ⚠️ Failed to persist log entry to database:", err.message);
    }

    // Diagnostic console output
    console.log(`[RuntimeLogger] [${logEntry.status}] ID: ${logEntry.requestId} | Provider: ${logEntry.provider} (${logEntry.model}) | Key: ${logEntry.apiKeyMasked} | Total Time: ${logEntry.metrics.totalRuntimeMs}ms | Retries: ${logEntry.retryCount}`);

    return logEntry;
  }

  /**
   * Helper to retrieve recent runtime logs for Admin diagnostic UI
   */
  async getRecentLogs(limit = 50, filter = {}) {
    try {
      if (AIRuntimeLog.db && AIRuntimeLog.db.readyState === 1) {
        return await AIRuntimeLog.find(filter).sort({ createdAt: -1 }).limit(limit);
      }
    } catch (err) {
      console.warn("[RuntimeLogger] Falling back to in-memory diagnostic buffer:", err.message);
    }
    return this.inMemoryLogs.slice(0, limit);
  }

  /**
   * Helper to retrieve aggregated Runtime Metrics summary for Dashboard
   */
  async getMetricsSummary() {
    let logs = this.inMemoryLogs;
    try {
      if (AIRuntimeLog.db && AIRuntimeLog.db.readyState === 1) {
        const dbLogs = await AIRuntimeLog.find().sort({ createdAt: -1 }).limit(200);
        if (dbLogs.length > 0) logs = dbLogs;
      }
    } catch (e) {
      // Use memory
    }

    const totalRequests = logs.length;
    const successful = logs.filter(l => l.status === "SUCCESS").length;
    const retried = logs.filter(l => l.retryCount > 0).length;
    const failures = logs.filter(l => l.status !== "SUCCESS").length;

    let totalLatency = 0;
    let totalProviderTime = 0;
    let totalTokens = 0;

    logs.forEach(l => {
      totalLatency += (l.metrics?.totalRuntimeMs || l.latencyMs || 0);
      totalProviderTime += (l.metrics?.providerTimeMs || l.latencyMs || 0);
      totalTokens += ((l.metrics?.estimatedTokens || 0) + (l.metrics?.returnedTokens || 0));
    });

    return {
      totalRequests,
      successRate: totalRequests > 0 ? Math.round((successful / totalRequests) * 100) : 100,
      avgTotalRuntimeMs: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
      avgProviderTimeMs: totalRequests > 0 ? Math.round(totalProviderTime / totalRequests) : 0,
      retryRate: totalRequests > 0 ? Math.round((retried / totalRequests) * 100) : 0,
      failures,
      totalTokensConsumed: totalTokens,
      queueReadyEngine: "BullMQ / Redis placeholder ready",
      cacheReadyEngine: "SHA-256 canonical fingerprint indexing enabled",
      uptimeSeconds: Math.round((Date.now() - sessionStartTime) / 1000)
    };
  }
}

module.exports = new RuntimeLogger();
