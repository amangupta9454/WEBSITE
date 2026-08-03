/**
 * Phase 15 — Assessment Module Infrastructure
 * Service: AssessmentCacheEngine.js
 * 
 * OBJECTIVE:
 * - High-speed memory caching layer to eliminate duplicate MongoDB queries.
 * - Supports declarative TTL (Time to Live) and seamless future Redis/ElastiCache clustering integration.
 * - Zero business logic mutation; read-only performance optimization.
 */

class AssessmentCacheEngine {
  constructor() {
    // In-memory cache map (Key -> { value, expiry, hitCount, createdAt })
    this.memoryStore = new Map();
    this.maxCacheEntries = 2000; // LRU protection against memory leaks
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      evictions: 0
    };

    // Auto-clean expired keys every 5 minutes in background without blocking event loop
    this.cleanupTimer = setInterval(() => this.purgeExpired(), 5 * 60 * 1000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Generate safe compound cache key
   */
  generateKey(namespace, params) {
    const sortedParams = typeof params === "object" ? JSON.stringify(Object.entries(params || {}).sort()) : String(params);
    return `can:asm:${namespace}:${sortedParams}`;
  }

  /**
   * Get cached data if valid
   */
  async get(key) {
    const entry = this.memoryStore.get(key);
    if (!entry) {
      this.stats.misses += 1;
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.memoryStore.delete(key);
      this.stats.misses += 1;
      return null;
    }

    entry.hitCount += 1;
    this.stats.hits += 1;
    return entry.value;
  }

  /**
   * Set cache item with specified Time-To-Live (seconds)
   */
  async set(key, value, ttlSeconds = 60) {
    // Enforce max entries limit (LRU-style eviction of oldest keys)
    if (this.memoryStore.size >= this.maxCacheEntries && !this.memoryStore.has(key)) {
      const oldestKey = this.memoryStore.keys().next().value;
      if (oldestKey) {
        this.memoryStore.delete(oldestKey);
        this.stats.evictions += 1;
      }
    }

    this.memoryStore.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000),
      hitCount: 0,
      createdAt: Date.now()
    });
    return true;
  }

  /**
   * Invalidate specific key or prefix pattern
   */
  async invalidate(prefix) {
    let count = 0;
    for (const [key] of this.memoryStore.entries()) {
      if (key.includes(prefix) || key === prefix) {
        this.memoryStore.delete(key);
        count++;
      }
    }
    this.stats.invalidations += count;
    return count;
  }

  /**
   * Purge all expired keys from memory
   */
  purgeExpired() {
    const now = Date.now();
    for (const [key, item] of this.memoryStore.entries()) {
      if (now > item.expiry) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Express Middleware helper for route caching
   */
  routeCache(namespace, ttlSeconds = 60) {
    return async (req, res, next) => {
      // Never cache mutation requests
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }

      // Bypass cache if client specifies explicit refresh or debug header
      if (req.headers["x-no-cache"] || req.query.refresh === "true") {
        return next();
      }

      const key = this.generateKey(namespace, { url: req.originalUrl || req.url, user: req.user?.id || "public" });
      try {
        const cachedResponse = await this.get(key);
        if (cachedResponse) {
          res.setHeader("X-Cache", "HIT");
          res.setHeader("X-Cache-TTL", `${ttlSeconds}s`);
          return res.status(cachedResponse.status || 200).json(cachedResponse.body);
        }
      } catch (err) {
        // Fallback silently if cache lookup errors
        console.warn("[AssessmentCacheEngine] Cache read warning:", err.message);
      }

      // Intercept response methods to inject into cache on success
      const originalJson = res.json.bind(res);
      res.setHeader("X-Cache", "MISS");

      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(key, { status: res.statusCode, body }, ttlSeconds).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    };
  }

  /**
   * Get operational cache diagnostic statistics
   */
  getDiagnostics() {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      status: "ACTIVE",
      type: "IN_MEMORY_LRU (REDIS_COMPATIBLE_ABSTRACTION)",
      entries: this.memoryStore.size,
      maxCapacity: this.maxCacheEntries,
      hitRate: totalRequests > 0 ? `${Math.round((this.stats.hits / totalRequests) * 100)}%` : "N/A",
      telemetry: {
        hits: this.stats.hits,
        misses: this.stats.misses,
        invalidations: this.stats.invalidations,
        evictions: this.stats.evictions
      }
    };
  }
}

module.exports = new AssessmentCacheEngine();
