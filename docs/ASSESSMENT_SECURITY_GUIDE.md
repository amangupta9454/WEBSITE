# Code-A-Nova Assessment Module — Enterprise Security & Threat Mitigation Guide (v1.0.0)

This security specification details the defense-in-depth methodologies, boundary protections, cryptographic verification techniques, and attack threat mitigations deployed across the **Code-A-Nova Assessment Platform (Phases 1–15)**.

---

## 1. Multi-Layer Threat Defenses & Guardrail Implementation
The application router embeds the `assessmentSecurity.js` middleware stack, creating an impermeable protective barrier before any request encounters business logic or MongoDB drivers:

### A. NoSQL Injection & Parameter Tampering Neutralization
* **Vulnerability Mitigated:** Malicious attackers sending MongoDB operator syntax (e.g., `{"username": {"$ne": null}, "password": {"$gt": ""}}`) inside JSON payloads or nested URL query strings to bypass authentication or dump unauthorized records.
* **Defense Implementation:** The automated `sanitizeInput` recursive deep-cleaning engine scans all properties in `req.body`, `req.query`, and `req.params`, systematically stripping out any keys starting with `$` or containing dot notations (`.`), neutralizing NoSQL query injections without disturbing valid UTF-8 strings or numbers.

### B. Regular Expression Denial of Service (ReDoS) Protection
* **Vulnerability Mitigated:** Attacker injection of catastrophic, exponentially backtracking regex expressions (e.g., `(a+)+$`) into public candidate or certificate search filter parameter strings to freeze server CPU cores.
* **Defense Implementation:** Automated regex query string length capping (limited to 5000 characters) paired with strict escape sanitization in `VerificationSearchEngine.js` before executing MongoDB string matching.

### C. Automated Secret Leakage & Credential Masking
* **Vulnerability Mitigated:** Accidental inclusion of database passwords, JWT tokens, user passwords, or third-party LLM API keys inside API error trace responses or JSON debugging dumps.
* **Defense Implementation:** The `secretLeakageDefense` output interception filter wraps `res.json()`, scanning outbound payloads and automatically replacing any attributes matching sensitive keywords (`password`, `token`, `secret`, `api_key`, `authorization`) with masked safety symbols (`********-MASKED-SECURITY-AUDIT-********`).

---

## 2. Token Authorization, RBAC, & Tenant Data Isolation
* **Zero Cross-Tenant Leakage (`enforceCandidateOwnership`):** Student API requests are strictly authenticated via JWTs. The system validates that the identifier within the signed JWT matches the requested candidate dossier ID in the URI. Any mismatch immediately returns a `403 Forbidden` rejection, stopping lateral data enumeration.
* **Strict Read-Only Verification Boundaries:** Public credential verifications (`/api/public/assessment/verify/:id`) operate on an isolated verification engine (`PublicVerificationEngine.js`). This layer exposes only professional competency signatures while strictly omitting candidate email addresses, contact phone numbers, IP timestamps, internal assessment item identifiers, and scoring algorithms.
* **Administrative Role Enforcement:** All administrative routes (`/api/admin/assessment/*`) are shielded by `verifyAdmin` middleware, confirming high-privilege JWT signatures and admin status before reaching analytical or configuration controllers.

---

## 3. Rate-Limiting & Anti-Scraping Throttling Thresholds
Dedicated IP-based slide-window token buckets (`express-rate-limit`) safeguard endpoints against denial of service and automated scraping algorithms:

| Protected API Route Group | Applied Middleware Limiter | Threshold Quota & Time Window | Security Purpose |
| :--- | :--- | :--- | :--- |
| **Public Credential Lookups** | `publicVerifyLimiter` | **100 requests** per **15 minutes** | Prevents automated brute-force scraping and certificate ID guessing. |
| **Active Student Exam Attempts** | `sessionAttemptLimiter` | **300 interactions** per **5 minutes** | Stops rapid-fire automated bot scripts while permitting intense user typing. |
| **Admin Analytical Report Exports**| `adminExportLimiter` | **40 batch exports** per **15 minutes** | Prevents RAM depletion via excessive simultaneous CSV/Excel/PDF compilation. |
| **AI Prompt Studio Executions** | `aiRuntimeLimiter` | **20 generative inferences** per **1 minute** | Protects third-party LLM token budgets against accidental loop depletion. |
