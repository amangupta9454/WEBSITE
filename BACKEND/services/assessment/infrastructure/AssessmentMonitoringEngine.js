/**
 * Phase 15 — Assessment Module Infrastructure
 * Service: AssessmentMonitoringEngine.js
 * 
 * OBJECTIVE:
 * - Enterprise observability, structured JSON logging, and tracing hooks.
 * - Liveness (`/health/live`), Readiness (`/health/ready`), and Diagnostic probes.
 * - Request ID tracking & Error ID attribution for OpenTelemetry / Sentry compatibility.
 * - STRICT RULE: Zero business logic mutation. Pure operational infrastructure.
 */
const mongoose = require("mongoose");
const crypto = require("crypto");

class AssessmentMonitoringEngine {
  constructor() {
    this.startTime = Date.now();
    this.requestCounters = {
      total: 0,
      success: 0,
      clientError: 0,
      serverError: 0,
      rateLimited: 0
    };
    this.latencyHistogram = {
      under100ms: 0,
      under500ms: 0,
      under2000ms: 0,
      slowRequests: 0
    };
  }

  /**
   * Express Middleware: Request Tracing & Structured Logging Hook
   */
  requestTracingMiddleware() {
    return (req, res, next) => {
      const startMs = Date.now();
      // Generate unique Request ID or inherit from edge reverse proxy (Cloudflare, Vercel, Nginx)
      const requestId = req.headers["x-request-id"] || req.headers["x-correlation-id"] || `can-req-${crypto.randomUUID()}`;
      req.requestId = requestId;
      res.setHeader("X-Request-ID", requestId);

      // Increment request counter
      this.requestCounters.total += 1;

      // Intercept stream finish to record telemetry
      res.on("finish", () => {
        const durationMs = Date.now() - startMs;
        const status = res.statusCode;

        // Categorize HTTP status codes
        if (status >= 500) {
          this.requestCounters.serverError += 1;
        } else if (status === 429) {
          this.requestCounters.rateLimited += 1;
        } else if (status >= 400) {
          this.requestCounters.clientError += 1;
        } else {
          this.requestCounters.success += 1;
        }

        // Categorize latency
        if (durationMs < 100) this.latencyHistogram.under100ms += 1;
        else if (durationMs < 500) this.latencyHistogram.under500ms += 1;
        else if (durationMs < 2000) this.latencyHistogram.under2000ms += 1;
        else this.latencyHistogram.slowRequests += 1;

        // Structured enterprise JSON logging (OpenTelemetry compliant format)
        if (process.env.NODE_ENV === "production" && (durationMs > 1000 || status >= 400)) {
          console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            severity: status >= 500 ? "ERROR" : status >= 400 ? "WARNING" : "INFO",
            eventType: "ASSESSMENT_HTTP_TELEMETRY",
            requestId,
            method: req.method,
            path: req.originalUrl || req.url,
            statusCode: status,
            durationMs,
            userAgent: req.headers["user-agent"] || "unknown",
            ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "0.0.0.0",
            service: "CodeANova-Assessment-Engine",
            version: "v1.0-PROD"
          }));
        }
      });

      next();
    };
  }

  /**
   * Express Middleware: Centralized Exception & Error Boundary
   */
  errorBoundaryMiddleware() {
    return (err, req, res, next) => {
      const errorId = `err-${crypto.randomUUID().slice(0, 8)}`;
      const statusCode = err.status || err.statusCode || 500;

      // Log structured crash diagnosis
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: "CRITICAL",
        eventType: "ASSESSMENT_UNHANDLED_EXCEPTION",
        errorId,
        requestId: req.requestId || "no-request-id",
        path: req.originalUrl || req.url,
        message: err.message || "Unknown internal server exception",
        stack: process.env.NODE_ENV === "production" ? "SUPPLIED_IN_SENTRY_ONLY" : err.stack
      }));

      this.requestCounters.serverError += 1;

      // Safe client payload without leaking internal stack traces or database query paths
      if (!res.headersSent) {
        res.status(statusCode).json({
          success: false,
          errorId,
          requestId: req.requestId,
          message: statusCode === 500 
            ? "An internal system fault occurred while executing the assessment operation. Please reference this Error ID when contacting technical support." 
            : err.message || "Request validation failed."
        });
      } else {
        next(err);
      }
    };
  }

  /**
   * Liveness probe (Immediate Kubernetes / PM2 / Vercel ping)
   */
  getLivenessProbe(req, res) {
    return res.status(200).json({
      status: "PASS",
      probe: "LIVENESS",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round((Date.now() - this.startTime) / 1000),
      service: "CodeANova-Assessment-Engine",
      version: "1.0.0"
    });
  }

  /**
   * Readiness probe (Verify Database Pool & Subsystem Connectivity)
   */
  async getReadinessProbe(req, res) {
    const startCheck = Date.now();
    let dbStatus = "HEALTHY";
    let httpStatus = 200;

    try {
      if (mongoose.connection.readyState !== 1) {
        dbStatus = "UNHEALTHY_DISCONNECTED";
        httpStatus = 503;
      } else {
        // Fast ping test on admin db command
        if (mongoose.connection.db) {
          await mongoose.connection.db.command({ ping: 1 });
        }
      }
    } catch (err) {
      dbStatus = `UNHEALTHY_ERROR (${err.message})`;
      httpStatus = 503;
    }

    const latencyMs = Date.now() - startCheck;

    return res.status(httpStatus).json({
      status: httpStatus === 200 ? "PASS" : "FAIL",
      probe: "READINESS",
      timestamp: new Date().toISOString(),
      latencyMs,
      subsystems: {
        database: {
          state: dbStatus,
          poolSize: mongoose.connection.base.connections.length || 1
        },
        memory: {
          rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024))
        }
      },
      telemetry: {
        totalRequests: this.requestCounters.total,
        successRatio: this.requestCounters.total > 0 ? `${Math.round((this.requestCounters.success / this.requestCounters.total) * 100)}%` : "100%",
        rateLimitedEvents: this.requestCounters.rateLimited
      }
    });
  }

  /**
   * Graceful Shutdown handler for cluster safety
   */
  setupGracefulShutdown(server) {
    const shutdown = async (signal) => {
      console.log(`[AssessmentMonitoringEngine] Received ${signal}. Initiating graceful operational shutdown...`);
      if (server && server.close) {
        server.close(() => {
          console.log("[AssessmentMonitoringEngine] HTTP server closed cleanly.");
        });
      }
      try {
        await mongoose.connection.close(false);
        console.log("[AssessmentMonitoringEngine] MongoDB connection pools released successfully.");
      } catch (err) {
        console.error("[AssessmentMonitoringEngine] Error while closing MongoDB connection pool:", err);
      }
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }
}

module.exports = new AssessmentMonitoringEngine();
