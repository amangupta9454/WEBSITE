# Code-A-Nova Assessment Module — Enterprise Architecture Reference (v1.0.0)

This architectural master specification documents the design principles, layer separation, data isolation boundaries, and infrastructure subsystem integration of the **Code-A-Nova Enterprise Assessment Platform (Phases 1–15)**.

---

## 1. System Overview & Core Philosophy
The Assessment Module is engineered as an autonomous, high-availability micro-platform embedded inside the Code-A-Nova application monolith. It operates under a strict **Zero-Regression & Single Source of Truth** doctrine:
- **Immutable Domain Chronology:** Every phase built from Phase 1 through 14 is immutable and foundational for subsequent layers.
- **Strict Read-Only Governance for Downstream Consumers:** Enterprise Analytics (Phase 13) and Recruiter Verification (Phase 14) operate as zero-mutation layers that consume telemetry without altering marks, regenerating certificates, or modifying attempt records.
- **Infrastructure Over Feature Creep:** Phase 15 incorporates production hardening (caching, locking, rate limiting, indexing, probe monitoring) directly into network routers without mutating existing business logic or UI layouts.

---

## 2. SOLID Architectural Layers & Dependency Boundaries
The codebase is structured into strict layered responsibility tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND PRESENTATION TIER                        │
│   (Vite React Admin Console, Student Platform, Recruiter Dossier)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS REST API / JWT Auth
┌───────────────────────────────────▼────────────────────────────────────┘
│                     SECURITY & ROUTING GATEWAY                         │
│  (Rate Limiters, NoSQL Injection Defense, Secret Masking, RBAC Auth)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Clean Request Payload
┌───────────────────────────────────▼────────────────────────────────────┘
│                      SERVICE & ENGINE TIER                             │
│   (AIRuntimeEngine, AssessmentSessionEngine, ResultEvaluationEngine)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Mongoose Aggregation & Schemas
┌───────────────────────────────────▼────────────────────────────────────┘
│                    INFRASTRUCTURE & RELATIONAL DATA                    │
│    (MongoDB Compound Indexes, In-Memory LRU Cache, Distributed Mutex)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Engine Profiles & Business Responsibilities
1. **AI Prompt Studio & Multi-Provider Runtime (`AIRuntimeEngine.js` & `GroqManager.js`):** Orchestrates generative prompt templates across failover LLM clusters (Groq LPU Principal, OpenAI GPT-4o, Google Gemini, Anthropic Claude) with strict circuit breakers and SLA latency tracking.
2. **Question Intelligence & Bank Gate (`QuestionIntelligenceEngine.js`):** Enforces taxonomic distribution (Bloom's Taxonomy, Difficulty splits) and detects duplicate items via SHA-256 cryptographic hashing.
3. **Autonomous Orchestration & Worker Nodes (`JobManager.js`, `InventoryMonitor.js`):** Evaluates question bank health and triggers background auto-replenishment pipelines protected by atomic cluster locking.
4. **Assessment Session Watchdog (`AssessmentSessionEngine.js`):** Oversees real-time evaluation sessions, anti-cheat heartbeats, remaining countdown timers, and randomized question batch streaming.
5. **Authoritative Evaluation Engine (`ResultEvaluationEngine.js`):** Computes score metrics, pass/fail domain classifications, and percentile rankings without storing subjective grading variations.
6. **Digital Credential & Certificate Engine (`CredentialEngine.js`):** Synthesizes cryptographic digital badges, readable identifiers (`CAN-2026-ASMT-xxxx`), high-fidelity PDF documents, and QR verification codes with zero hard-deletion revocation governance.
7. **Student Experience & Enterprise Analytics (`StudentPlatformService.js`, `AnalyticsEngine.js`):** Delivers candidate competency tracking alongside single-pass MongoDB aggregation pipelines for admin business dashboards.
8. **Recruiter Verification Gateway (`RecruiterVerificationEngine.js`):** Empowers third-party employers to authenticate digital credentials and inspect skill dossiers without exposing personal candidate contact secrets.

---

## 4. Phase 15 Infrastructure Hardening Modules
- **`AssessmentMonitoringEngine.js`:** Attaches correlation Request IDs (`X-Request-ID`), generates OpenTelemetry-compliant structured JSON logs, and exposes immediate Liveness (`/api/public/assessment/health/live`) and Readiness (`/api/public/assessment/health/ready`) probes for Docker, PM2, Vercel, and Kubernetes health monitors.
- **`AssessmentCacheEngine.js`:** An LRU-shielded, declarative in-memory read cache (Redis/ElastiCache ready) that intercepts high-frequency GET lookups (e.g., public credential checks, analytics stats) to eradicate redundant MongoDB reads.
- **`DistributedLockManager.js`:** Utilizes MongoDB atomic `findOneAndUpdate` leasing to act as a distributed mutex across scaled container replicas, preventing simultaneous cron executions or race conditions in background schedulers.
- **`AssessmentIndexOptimizer.js`:** Evaluates relational collection metadata on database initialization to register compound background indexes across all 9 core domain tables.
