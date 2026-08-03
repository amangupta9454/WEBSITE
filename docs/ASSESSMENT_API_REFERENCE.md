# Code-A-Nova Assessment Module — Enterprise REST API Reference (v1.0.0)

This reference defines the complete HTTP REST API surface area for the **Code-A-Nova Assessment Module (Phases 1–15)**. All endpoints return structured JSON responses, emit `X-Request-ID` telemetry headers, and apply automated NoSQL query sanitization.

---

## 1. Authentication & Security Headers
* **Admin Endpoints (`/api/admin/assessment/*`):** Require valid Bearer JWT header carrying authenticated Administrator privileges (`verifyAdmin` middleware).
* **Student Endpoints (`/api/assessment/*`):** Require candidate Bearer JWT token matching the requested target student identifier.
* **Public & Verification Endpoints (`/api/public/assessment/*`):** Open gateways governed by IP rate-limiting thresholds (100 requests per 15 minutes) and read-only response caching.

---

## 2. Infrastructure & Health Probes (Phase 15)

### Liveness Probe
* **Endpoint:** `GET /api/public/assessment/health/live`
* **Purpose:** Instantaneous check confirming Express event loop execution and process uptime.
* **Response Example:**
  ```json
  {
    "status": "PASS",
    "probe": "LIVENESS",
    "timestamp": "2026-08-03T12:00:00.000Z",
    "uptimeSeconds": 3420,
    "service": "CodeANova-Assessment-Engine",
    "version": "1.0.0"
  }
  ```

### Readiness & Subsystem Diagnostic Probe
* **Endpoint:** `GET /api/public/assessment/health/ready`
* **Purpose:** Verifies operational MongoDB connection pool latency and memory usage.
* **Response Example:**
  ```json
  {
    "status": "PASS",
    "probe": "READINESS",
    "latencyMs": 4,
    "subsystems": { "database": { "state": "HEALTHY", "poolSize": 5 }, "memory": { "rssMb": 182, "heapUsedMb": 94 } },
    "telemetry": { "totalRequests": 4821, "successRatio": "99%", "rateLimitedEvents": 2 }
  }
  ```

### Cache & Lock Diagnostics
* **Endpoint:** `GET /api/public/assessment/infrastructure/diagnostics`
* **Purpose:** Returns operational stats for the LRU in-memory cache and atomic distributed mutex locks.

---

## 3. Public Recruiter Credential Verification (Phase 14 & 15)

### Public Credential Verification Gateway
* **Endpoint:** `GET /api/public/assessment/verify/:certificateId`
* **Rate Limit:** 100 req / 15 min | **Cache TTL:** 300 seconds
* **Description:** Looks up cryptographic digital credentials by unique Certificate ID (`CAN-xxxx`) or SHA-256 hash. Returns verified competencies while withholding private candidate email addresses and contact records.
* **Response Example:**
  ```json
  {
    "success": true,
    "status": "Verified",
    "certificate": {
      "certificateId": "CAN-2026-ASMT-000001",
      "candidateName": "Alex Mercer",
      "domain": "Full-Stack Software Engineering",
      "issuedAt": "2026-07-28T10:00:00.000Z",
      "digitalSignature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  }
  ```

---

## 4. Admin Management APIs (`/api/admin/assessment/*`)
* `GET /categories` & `POST /categories` — Manage domain evaluation categories.
* `GET /subcategories/:categoryId` & `POST /subcategories` — Manage subcategory inventory slots.
* `GET /questions` & `POST /questions` — Consult, search, and ingest approved assessment test questions.
* `POST /ai/generate` — Invoke multi-provider AI Prompt Studio generative question generation.
* `GET /sessions/live` — Inspect ongoing candidate session watchdog telemetry.
* `GET /results` — Audit historical verified student evaluation score records.
* `GET /certificates` & `POST /certificates/revoke/:id` — Inspect digital credentials and execute status revocation or restoration.
* `GET /analytics/dashboard` — Fetch real-time KPI aggregations across all 13 enterprise intelligence modules.
* `GET /recruiter/dashboard` & `GET /recruiter/candidates` — Inspect employer verification trends and candidate qualification dossiers.
* `GET /recruiter/export` — Download multi-format verification audit reports (CSV, Excel JSON, PDF payloads).

---

## 5. Student Experience APIs (`/api/assessment/*`)
* `GET /student/home` — Fetch candidate dashboard mastery metrics, passed assessments, and recent activity timeline.
* `GET /student/catalog` — Retrieve published assessment opportunities available for initiation or continuation.
* `POST /student/session/start` — Initiate randomized, tamper-resistant active session attempt.
* `POST /student/session/submit` — Submit evaluation batch for instantaneous, immutable scoring and certificate badge assignment.
* `GET /student/credentials` — Retrieve earned verified certificates and trigger high-fidelity PDF downloading.
