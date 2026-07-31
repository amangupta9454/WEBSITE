/**
 * GroqManager — Centralized Groq API Key Manager
 *
 * Features:
 * - Loads all GROQ_KEY_1..4 from environment automatically
 * - Round-Robin key selection for equal distribution
 * - Automatic failover on 429 / timeout / network error
 * - Per-key health tracking: healthy | cooldown
 * - Health monitor restores keys after cooldown period
 * - All AI requests MUST pass through this manager
 */

const Groq = require("groq-sdk");

const COOLDOWN_MS   = 60 * 1000;  // 1 minute cooldown on error
const MONITOR_MS    = 30 * 1000;  // Health monitor interval
const REQUEST_TIMEOUT_MS = 15000; // 15s max per request

class GroqManager {
  constructor() {
    this.keys   = [];
    this.index  = 0; // Round-Robin pointer
    this._loadKeys();
    this._startHealthMonitor();
  }

  // ── Load all GROQ_KEY_* from environment ──────────────────────────────────
  _loadKeys() {
    const envKeys = [];
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`GROQ_KEY_${i}`];
      if (key && key.trim()) envKeys.push(key.trim());
    }

    if (envKeys.length === 0) {
      console.warn("[GroqManager] ⚠️  No GROQ_KEY_* found in environment. AI generation will be unavailable.");
    } else {
      console.log(`[GroqManager] ✅ Loaded ${envKeys.length} Groq API key(s).`);
    }

    this.keys = envKeys.map((key, idx) => ({
      index:          idx,
      key,
      client:         new Groq({ apiKey: key }),
      status:         "healthy", // "healthy" | "cooldown"
      cooldownUntil:  null,
      totalRequests:  0,
      totalFailures:  0,
      totalLatencyMs: 0,
    }));
  }

  // ── Get next healthy key using Round-Robin ─────────────────────────────────
  _getNextKey() {
    const total = this.keys.length;
    if (total === 0) throw new Error("No Groq API keys configured.");

    let tried = 0;
    while (tried < total) {
      const key = this.keys[this.index % total];
      this.index = (this.index + 1) % total;
      tried++;

      if (key.status === "healthy") return key;
      if (key.status === "cooldown" && key.cooldownUntil && Date.now() > key.cooldownUntil) {
        key.status = "healthy";
        key.cooldownUntil = null;
        console.log(`[GroqManager] 🔄 Key #${key.index + 1} restored from cooldown.`);
        return key;
      }
    }

    throw new Error("ALL_KEYS_UNAVAILABLE: All Groq API keys are in cooldown.");
  }

  // ── Mark a key as cooling down ────────────────────────────────────────────
  _markCooldown(keyObj, reason) {
    keyObj.status        = "cooldown";
    keyObj.cooldownUntil = Date.now() + COOLDOWN_MS;
    keyObj.totalFailures++;
    console.warn(`[GroqManager] 🔴 Key #${keyObj.index + 1} → cooldown. Reason: ${reason}`);
  }

  // ── Core: Send a prompt through Groq, with auto-failover ──────────────────
  async chat(messages, options = {}) {
    const {
      model            = "llama-3.3-70b-versatile",
      maxTokens        = 4096,
      temperature      = 0.7,
      responseFormat   = null,
      maxRetries       = this.keys.length, // Try all keys before giving up
    } = options;

    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let keyObj;
      try {
        keyObj = this._getNextKey();
      } catch (e) {
        throw e; // All keys in cooldown
      }

      const startTime = Date.now();

      try {
        const requestParams = {
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        };
        if (responseFormat) requestParams.response_format = responseFormat;

        // Race against timeout
        const result = await Promise.race([
          keyObj.client.chat.completions.create(requestParams),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("TIMEOUT")), REQUEST_TIMEOUT_MS)
          ),
        ]);

        const latency = Date.now() - startTime;
        keyObj.totalRequests++;
        keyObj.totalLatencyMs += latency;

        return result.choices[0].message.content;

      } catch (err) {
        const latency = Date.now() - startTime;
        lastError = err;

        const isRateLimit = err?.status === 429 ||
                            err?.message?.includes("rate") ||
                            err?.message?.includes("quota");
        const isTimeout   = err?.message === "TIMEOUT";
        const isNetwork   = err?.code === "ECONNREFUSED" || err?.code === "ENOTFOUND";

        if (isRateLimit || isTimeout || isNetwork) {
          this._markCooldown(keyObj, err.message);
          continue; // Try next key
        }

        // Non-retryable error (bad prompt, etc.)
        throw err;
      }
    }

    throw lastError || new Error("All Groq API keys failed.");
  }

  // ── Health Monitor: restore keys after cooldown ───────────────────────────
  _startHealthMonitor() {
    if (!this.keys || this.keys.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      this.keys.forEach((key) => {
        if (key.status === "cooldown" && key.cooldownUntil && now > key.cooldownUntil) {
          key.status = "healthy";
          key.cooldownUntil = null;
          console.log(`[GroqManager] ✅ Key #${key.index + 1} restored automatically.`);
        }
      });
    }, MONITOR_MS);
    if (timer && typeof timer.unref === "function") {
      timer.unref(); // Prevents keeping serverless process alive
    }
  }

  // ── Get health status of all keys (for Admin API) ─────────────────────────
  getHealthStatus() {
    return this.keys.map((k) => ({
      index:         k.index + 1,
      status:        k.status,
      cooldownUntil: k.cooldownUntil,
      totalRequests: k.totalRequests,
      totalFailures: k.totalFailures,
      avgLatencyMs:  k.totalRequests > 0
                       ? Math.round(k.totalLatencyMs / k.totalRequests)
                       : 0,
    }));
  }

  // ── Total healthy keys count ──────────────────────────────────────────────
  get healthyKeyCount() {
    return this.keys.filter((k) => k.status === "healthy").length;
  }

  // ── Total keys configured ─────────────────────────────────────────────────
  get totalKeyCount() {
    return this.keys.length;
  }
}

// Singleton export — shared across all modules
const groqManager = new GroqManager();
module.exports = groqManager;
