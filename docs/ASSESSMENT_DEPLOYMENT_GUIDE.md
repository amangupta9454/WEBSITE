# Code-A-Nova Assessment Module — Enterprise Deployment & Operational Guide (v1.0.0)

This deployment specification provides operational procedures for deploying, scaling, monitoring, and executing the **Code-A-Nova Assessment Module (v1.0.0)** in production containerized, serverless, and virtual machine infrastructures.

---

## 1. Environment Configuration & Secrets Management
Verify that the production runtime environment injects the following configuration variables prior to application boot:

| Environment Variable | Required / Optional | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Required | Set strictly to `production` to activate OpenTelemetry JSON log formats and stack trace masking. |
| `MONGO_URI` | Required | Connection string for clustered MongoDB instance (Atlas or Kubernetes StatefulSet). |
| `JWT_SECRET` | Required | High-entropy asymmetric or symmetric signing secret for candidate & admin token verification. |
| `GROQ_API_KEY` | Optional | Principal hardware LPU inference key for ultra-fast AI Question Prompt generation. |
| `OPENAI_API_KEY` | Optional | Fallback LLM execution provider secret for Question Bank enrichment. |
| `SENTRY_DSN` | Optional | Real-time crash tracking and unhandled exception diagnostic ingestion URI. |

---

## 2. Serverless & Edge Deployments (Vercel & Render Readiness)
The Code-A-Nova backend utilizes lazy, global connection pooling inside `index.js`, making it perfectly optimized for ephemeral serverless execution (Vercel Functions, AWS Lambda, Render Zero-Scale):
- **MongoDB Pool Tuning:** Configured with `maxPoolSize: 10` and `minPoolSize: 1`, preventing database socket exhaustion during simultaneous lambda cold-starts.
- **Stateless Lock & Caching Strategy:** In serverless architectures, the `AssessmentCacheEngine` operates within each function execution instance memory, while `DistributedLockManager` leans on atomic MongoDB `findOneAndUpdate` document leases to prevent duplicated scheduled triggers without requiring persistent local filesystem state.

---

## 3. Containerized & Dedicated Instance Scaling (Docker / PM2 / Kubernetes)
When running across continuous process managers or Kubernetes pod scaling replicas:
* **Horizontal Replication & Scheduler Safety:** You may scale to arbitrary container replicas without risk of duplicate auto-replenishment cron execution or split-brain reporting tasks, due to the atomic mutex lease boundary enforced by `DistributedLockManager`.
* **Graceful Shutdown & Pool Clean-up:** On receiving pod termination signals (`SIGTERM` or `SIGINT`), `AssessmentMonitoringEngine` intercepts the signal, completes in-flight HTTP streams, releases MongoDB socket pools cleanly, and closes Express worker listeners without dropping ongoing student exam evaluations.

### Sample PM2 Ecosystem Configuration (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: "can-assessment-engine",
    script: "./BACKEND/index.js",
    instances: "max",
    exec_mode: "cluster",
    env_production: {
      NODE_ENV: "production",
      PORT: 5000
    },
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
```

---

## 4. Production Health Verification & Monitoring Probes
Configure load balancer health checks and Kubernetes liveness/readiness probes to utilize the dedicated Phase 15 telemetry endpoints:
1. **Container Liveness Probe:** Point to `GET /api/public/assessment/health/live` (Target response: `200 OK`, confirming healthy process event loops).
2. **Traffic Readiness Probe:** Point to `GET /api/public/assessment/health/ready` (Target response: `200 OK`, confirming active database reachability and sub-100ms connection latency).
3. **Structured Telemetry Ingestion:** Direct stdout stream collectors (Datadog, Fluent Bit, Cloud Logging) to ingest the standard structured JSON telemetry records emitted by `AssessmentMonitoringEngine`.
