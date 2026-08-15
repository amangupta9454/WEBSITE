/**
 * GroqManager — Production AI Execution Engine & Key Pool Router (Phase 5 — Components 3, 4, 5, 6, 7, 18)
 *
 * Responsibilities:
 * - Multi-Key Management (Component 4): Dynamically load every available key without hardcoding.
 * - Round-Robin Load Distribution (Component 5): Distributes traffic equally across pool credentials.
 * - Health Monitoring (Component 6): Track per-key states (Healthy, Cooldown, Rate Limited, Timeout, Disabled) and auto-restore.
 * - Retry Engine (Component 7): Transparent failover across keys on 429 Rate Limits, Timeouts (7000ms SLA), and network faults.
 * - Security (Component 18): Complete credential masking; zero key leakages in traces or APIs.
 * - Usage Metrics: Tracks invocation count, cumulative latency, tokens, and failures.
 * - STRICT SEPARATION: No prompt building, no question validation.
 */

const runtimeLogger = require("./RuntimeLogger");

let Groq = null;
try {
  Groq = require("groq-sdk");
} catch (err) {
  console.warn("[GroqManager] ⚠️ groq-sdk package not available in Node environment:", err.message);
}

const DEFAULT_COOLDOWN_MS = 60 * 1000; // 1 minute standard cooldown on 429/Timeout
const MONITOR_INTERVAL_MS = 15 * 1000; // Check auto-restoration every 15 seconds
const HARD_TIMEOUT_SLA_MS = 7000;      // AI-First Architecture 7-second hard limit

class GroqManager {
  constructor() {
    this.keys = [];
    this.roundRobinIndex = 0;
    this.isSimulationMode = false;
    this._loadKeys();
    this._startHealthMonitor();
  }

  /**
   * Component 4 & 18: Multi-Key Management & Secure Credential Loading
   * Automatically scans environment variables for up to 10 configured Groq keys.
   */
  _loadKeys() {
    const rawKeys = new Set();

    // Check canonical patterns: GROQ_KEY_1..10, GROQ_API_KEY_1..4, and GROQ_API_KEY
    const envPrefixes = ["GROQ_KEY_", "GROQ_API_KEY_"];
    envPrefixes.forEach(prefix => {
      for (let i = 1; i <= 10; i++) {
        const val = process.env[`${prefix}${i}`];
        if (val && val.trim()) rawKeys.add(val.trim());
      }
    });
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
      rawKeys.add(process.env.GROQ_API_KEY.trim());
    }

    const keyArray = Array.from(rawKeys);

    if (keyArray.length === 0) {
      console.warn("[GroqManager] ⚠️ No real GROQ_KEY_* credentials detected in environment. Activating fallback Diagnostic Simulation pool (4 mock keys) for seamless runtime verification and UI testing.");
      this.isSimulationMode = true;
      // Seed 4 mock credentials so Round-Robin & Retry testing works without crashing
      for (let i = 1; i <= 4; i++) {
        keyArray.push(`gsk_mock_simulation_key_pool_credential_${i}_xxxx`);
      }
    } else {
      console.log(`[GroqManager] ✅ Successfully bound ${keyArray.length} production Groq API credentials into Round-Robin router.`);
      this.isSimulationMode = false;
    }

    this.keys = keyArray.map((keyStr, idx) => {
      const isMock = keyStr.startsWith("gsk_mock_");
      return {
        id: `key_${idx + 1}`,
        index: idx,
        apiKeyRaw: keyStr,
        apiKeyMasked: runtimeLogger.maskApiKey(keyStr),
        client: (Groq && !isMock) ? new Groq({ apiKey: keyStr }) : null,
        status: "Healthy", // "Healthy" | "Cooldown" | "Rate Limited" | "Timeout" | "Disabled"
        cooldownUntil: null,
        lastErrorReason: null,
        stats: {
          totalRequests: 0,
          totalSuccesses: 0,
          totalFailures: 0,
          rateLimitHitCount: 0,
          timeoutHitCount: 0,
          totalLatencyMs: 0,
          lastUsedTimestamp: null
        }
      };
    });
  }

  /**
   * Component 5: Round-Robin Load Distribution & Key Selection
   * Distributes traffic equally (Key 1 -> Key 2 -> Key 3 -> Key 4 -> Key 1), skipping unhealthy candidates.
   */
  _getNextHealthyKey() {
    const total = this.keys.length;
    if (total === 0) throw new Error("CRITICAL_POOL_ERROR: No Groq API keys registered in engine.");

    let attempted = 0;
    const now = Date.now();

    while (attempted < total) {
      const candidate = this.keys[this.roundRobinIndex % total];
      this.roundRobinIndex = (this.roundRobinIndex + 1) % total;
      attempted++;

      // Auto-restore if cooldown expired right at selection time
      if (candidate.status !== "Healthy" && candidate.status !== "Disabled" && candidate.cooldownUntil && now > candidate.cooldownUntil) {
        console.log(`[GroqManager] 🔄 Auto-restoring Key #${candidate.index + 1} (${candidate.apiKeyMasked}) from state [${candidate.status}] to [Healthy].`);
        candidate.status = "Healthy";
        candidate.cooldownUntil = null;
        candidate.lastErrorReason = null;
      }

      if (candidate.status === "Healthy") {
        return candidate;
      }
    }

    throw new Error("ALL_KEYS_UNAVAILABLE: Complete API pool exhaustion. All configured Groq keys are currently in Cooldown, Rate Limited, or Disabled states.");
  }

  /**
   * Component 6: State Transitions & Cooldown Management
   */
  _markKeyStatus(keyObj, newStatus, reason, customCooldownMs = DEFAULT_COOLDOWN_MS) {
    keyObj.status = newStatus;
    keyObj.cooldownUntil = Date.now() + customCooldownMs;
    keyObj.lastErrorReason = reason;
    keyObj.stats.totalFailures++;

    if (newStatus === "Rate Limited") keyObj.stats.rateLimitHitCount++;
    if (newStatus === "Timeout") keyObj.stats.timeoutHitCount++;

    console.warn(`[GroqManager] 🔴 Key #${keyObj.index + 1} (${keyObj.apiKeyMasked}) transitioned to state [${newStatus}]. Freeze time: ${customCooldownMs / 1000}s. Reason: ${reason}`);
  }

  /**
   * Component 7: Transparent Automatic Retry Engine
   * Executes AI requests with automatic round-robin failover on Timeouts, 429 Rate Limits, or Network disconnects.
   *
   * @param {Object} payload - Prepared payload from AIRequestBuilder
   */
  async executeInference(payload) {
    const maxRetries = Math.min(this.keys.length, 4); // Try up to 4 keys sequentially
    const timeoutMs = Math.min(payload.timeoutMs || HARD_TIMEOUT_SLA_MS, HARD_TIMEOUT_SLA_MS);
    
    let lastException = null;
    const startTimeMaster = Date.now();
    let retriesPerformed = 0;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let activeKey;
      try {
        activeKey = this._getNextHealthyKey();
      } catch (poolErr) {
        // Immediate exhaustion exception thrown to ProviderManager for Level 3 database fallback
        throw poolErr;
      }

      const attemptStartTime = Date.now();
      activeKey.stats.lastUsedTimestamp = attemptStartTime;
      activeKey.stats.totalRequests++;

      try {
        // ── SIMULATION / MOCK OR DIAGNOSTIC MODE ──────────────────────────────────
        if (this.isSimulationMode || payload.meta?.simulationOnly || activeKey.apiKeyRaw.startsWith("gsk_mock_")) {
          const simulatedLatency = Math.floor(Math.random() * 250 + 200); // 200-450ms simulation
          await new Promise(res => setTimeout(res, simulatedLatency));

          // Check if admin is conducting forced simulated rate-limit or timeout tests
          if (payload.meta?.forceSimulateError === "429") {
            const simulatedErr = new Error("Simulated Groq 429 Rate Limit Exceeded");
            simulatedErr.status = 429;
            throw simulatedErr;
          }
          if (payload.meta?.forceSimulateError === "TIMEOUT") {
            const simulatedErr = new Error("TIMEOUT_EXCEEDED");
            throw simulatedErr;
          }

          const execDuration = Date.now() - attemptStartTime;
          activeKey.stats.totalSuccesses++;
          activeKey.stats.totalLatencyMs += execDuration;

          // Return compliant normalized raw text structure
          const sampleMockJson = JSON.stringify([
            {
              question: "Which of the following database scaling techniques provides automatic logical partitioning across physical nodes in Code-A-Nova?",
              options: ["Horizontal Sharding", "Vertical RAM Upscaling", "Read-Only Replica Cascade", "ACID Mutex Locking"],
              correctIndex: 0,
              explanation: "Horizontal sharding partitions table data across multiple individual server nodes, enabling horizontal scale-out architectures without single-node memory ceilings.",
              topic: "Distributed Systems Architecture",
              difficulty: "Medium"
            }
          ]);

          return {
            success: true,
            rawText: sampleMockJson,
            provider: "Groq (Simulation Engine)",
            model: payload.targetModel || "llama-3.3-70b-specdec",
            apiKeyMasked: activeKey.apiKeyMasked,
            latencyMs: execDuration,
            retryCount: retriesPerformed,
            usage: {
              prompt_tokens: payload.meta?.estimatedPromptTokens || 220,
              completion_tokens: 185,
              total_tokens: (payload.meta?.estimatedPromptTokens || 220) + 185
            }
          };
        }
        // ── LIVE PRODUCTION GROQ INFERENCE ──────────────────────────────────────
        else {
          const createParams = {
            model: payload.targetModel || "llama-3.3-70b-specdec",
            messages: payload.messages,
            max_tokens: payload.maxTokens || 2500,
            temperature: payload.temperature !== undefined ? payload.temperature : 0.65,
            top_p: payload.topP !== undefined ? payload.topP : 0.9
          };

          // Strict Promise.race enforcing 7000ms zero-pause SLA boundary
          const completion = await Promise.race([
            activeKey.client.chat.completions.create(createParams),
            new Promise((_, reject) =>
              setTimeout(() => {
                const timeoutErr = new Error("TIMEOUT_EXCEEDED");
                timeoutErr.status = 408;
                reject(timeoutErr);
              }, timeoutMs)
            )
          ]);

          const execDuration = Date.now() - attemptStartTime;
          activeKey.stats.totalSuccesses++;
          activeKey.stats.totalLatencyMs += execDuration;

          const choiceContent = completion.choices?.[0]?.message?.content || "";

          return {
            success: true,
            rawText: choiceContent,
            provider: "Groq",
            model: payload.targetModel,
            apiKeyMasked: activeKey.apiKeyMasked,
            latencyMs: execDuration,
            retryCount: retriesPerformed,
            usage: completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
          };
        }
      } catch (err) {
        // Exception encountered during inference attempt
        const errDuration = Date.now() - attemptStartTime;
        lastException = err;
        retriesPerformed++;

        const isRateLimit = err.status === 429 || err.message?.toLowerCase().includes("rate limit") || err.message?.toLowerCase().includes("quota");
        const isTimeout = err.message === "TIMEOUT_EXCEEDED" || err.status === 408 || err.code === "ETIMEDOUT";
        const isNetwork = err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "EPIPE";
        const isServerError = err.status >= 500 && err.status <= 504;

        if (isRateLimit) {
          this._markKeyStatus(activeKey, "Rate Limited", "HTTP 429 Rate Limit Exceeded", DEFAULT_COOLDOWN_MS);
          continue; // Seamless failover to next key in Round-Robin pool
        } else if (isTimeout) {
          this._markKeyStatus(activeKey, "Timeout", `Inference exceeded SLA boundary (${timeoutMs}ms)`, DEFAULT_COOLDOWN_MS);
          continue;
        } else if (isNetwork || isServerError) {
          this._markKeyStatus(activeKey, "Cooldown", `Network/Server instability: ${err.message}`, DEFAULT_COOLDOWN_MS);
          continue;
        } else {
          // Unrecoverable syntactic or fatal authentication error — abort retry loop immediately
          console.error(`[GroqManager] ❌ Non-retryable operational exception on key #${activeKey.index + 1}:`, err.message);
          throw err;
        }
      }
    }

    // All available retries exhausted across pool
    const finalEx = lastException || new Error("All Round-Robin Groq API attempts failed.");
    finalEx.retryCount = retriesPerformed;
    throw finalEx;
  }

  /**
   * Component 6: Automatic Background Health Restoration Daemon
   */
  _startHealthMonitor() {
    const timer = setInterval(() => {
      const now = Date.now();
      this.keys.forEach((k) => {
        if (k.status !== "Healthy" && k.status !== "Disabled" && k.cooldownUntil && now > k.cooldownUntil) {
          console.log(`[GroqManager Daemon] 💚 Key #${k.index + 1} (${k.apiKeyMasked}) automatically restored from [${k.status}] to [Healthy].`);
          k.status = "Healthy";
          k.cooldownUntil = null;
          k.lastErrorReason = null;
        }
      });
    }, MONITOR_INTERVAL_MS);

    if (timer && typeof timer.unref === "function") {
      timer.unref(); // Keeps Node execution non-blocking
    }
  }

  /**
   * Manual admin reset helper (for testing health recovery in UI)
   */
  restoreAllCooldownKeys() {
    let count = 0;
    this.keys.forEach((k) => {
      if (k.status !== "Healthy") {
        k.status = "Healthy";
        k.cooldownUntil = null;
        k.lastErrorReason = null;
        count++;
      }
    });
    console.log(`[GroqManager] 🛠️ Admin manual reset restored ${count} key(s) to Healthy status.`);
    return count;
  }

  /**
   * Returns complete diagnostic pool health status (for API endpoints and Admin UI)
   */
  getHealthStatus() {
    return this.keys.map((k) => ({
      id: k.id,
      index: k.index + 1,
      maskedKey: k.apiKeyMasked,
      status: k.status,
      cooldownUntil: k.cooldownUntil ? new Date(k.cooldownUntil).toISOString() : null,
      lastErrorReason: k.lastErrorReason,
      stats: {
        totalRequests: k.stats.totalRequests,
        totalSuccesses: k.stats.totalSuccesses,
        totalFailures: k.stats.totalFailures,
        rateLimitHitCount: k.stats.rateLimitHitCount,
        timeoutHitCount: k.stats.timeoutHitCount,
        avgLatencyMs: k.stats.totalRequests > 0 ? Math.round(k.stats.totalLatencyMs / k.stats.totalRequests) : 0,
        lastUsed: k.stats.lastUsedTimestamp ? new Date(k.stats.lastUsedTimestamp).toISOString() : null
      }
    }));
  }

  get healthyKeyCount() {
    return this.keys.filter((k) => k.status === "Healthy").length;
  }

  get totalKeyCount() {
    return this.keys.length;
  }
}

module.exports = new GroqManager();
