# Code-A-Nova Hackathon — Production Runbook & Operations Manual

**Version**: 1.0.0 (Production Release)  
**Lifecycle**: Phases 1 through 9 Complete  
**Target Platform**: Code-A-Nova Multi-Track Online Hackathon  
**Audience**: DevOps Engineers, Lead Administrators, Hackathon Directors, and System Operators  

---

## Table of Contents
1. [Architecture & System Overview](#1-architecture--system-overview)
2. [Environment Configuration & Secrets Management](#2-environment-configuration--secrets-management)
3. [Database Management, Indexing & Backup/Restore](#3-database-management-indexing--backuprestore)
4. [Lifecycle Operational Procedures (Phases 1–9)](#4-lifecycle-operational-procedures-phases-19)
5. [Monitoring, Telemetry & Health Alerts](#5-monitoring-telemetry--health-alerts)
6. [Data Governance, Export Sanitization & Compliance](#6-data-governance-export-sanitization--compliance)
7. [Incident Response Playbooks](#7-incident-response-playbooks)
8. [Security Hardening & Pre-Flight Checklist](#8-security-hardening--pre-flight-checklist)

---

## 1. Architecture & System Overview

The Code-A-Nova Hackathon Platform is an enterprise-grade, multi-tenant capable hackathon management engine engineered for high concurrency, verifiable integrity, and operational transparency.

```
+-------------------------------------------------------------------------+
|                                FRONTEND                                 |
|   React 19 + Vite + Tailwind CSS + Lucide Icons + React Toastify        |
|  - Participant Portal (Registration, Payment, Submission, Verification) |
|  - Editorial Judge Portal (Blind Review, Rubric Scoring, Judge Notes)   |
|  - Admin Workspace (Operations, Health Score, 360 View, CSV Exports)   |
+-------------------------------------------------------------------------+
                                    |
                           HTTPS / RESTful APIs
                                    |
+-------------------------------------------------------------------------+
|                                BACKEND                                  |
|   Node.js + Express + Mongoose + JWT + Rate Limiting + Crypto (HMAC)   |
|  - hackathonController.js (Public, Team, Editorial & Admin Endpoints)   |
|  - hackathonOpsService.js (Health KPIs, Server Clock, Alert Center)    |
|  - hackathonLimiter.js (Public: 120/15m, Auth: 25/15m, Export: 35/15m)  |
|  - hackathonConfigService.js (Startup Pre-Flight Diagnostic Validator) |
+-------------------------------------------------------------------------+
               |                    |                     |
     +-------------------+  +---------------+  +-------------------+
     |   MongoDB Atlas   |  |   Razorpay    |  |  Resend / SMTP    |
     | Compound Indexes  |  |  ₹49 Payment  |  |  Email Logs &     |
     | Immutable Audits  |  |  Webhooks     |  |  Deliverability   |
     +-------------------+  +---------------+  +-------------------+
```

### Core Subsystems
- **Participant & Team Subsystem**: Unstop bulk CSV import, team self-service portal, track allocation, and leader management.
- **Payment & Access Subsystem**: ₹49 participation verification via Razorpay Orders and HMAC-SHA256 authenticated webhooks with automated WhatsApp group invite generation.
- **Submission & Lockdown Subsystem**: Multi-track project submissions (GitHub, Live URL, Video demo, PPT deck) with server-enforced deadline locking.
- **Editorial Judging Engine**: Blind review capabilities, normalized rubric scoring across 4 criteria, and role-based assignment locks.
- **Official Results & Tie-Breaking**: Automated score aggregation, deterministic tiebreak resolution, winner tier assignment, and tamper-resistant official result locking.
- **Certificates & Fulfillment**: Cryptographic SHA-256 certificate numbers, public verification code lookups, and prize tracking pipeline.
- **Operations & Health Engine**: Real-time server-time deadline calculations, 9-point system completion checklist, deliverability monitoring, formula injection-safe CSV exports, and Team 360 overview.

---

## 2. Environment Configuration & Secrets Management

All production settings are driven by environment variables. A template is maintained in `BACKEND/.env.example`.

### Mandatory Production Variables
| Variable | Description | Security Constraints |
|---|---|---|
| `PORT` | HTTP port for backend service (default: `5006`) | Internal or reverse-proxied |
| `NODE_ENV` | Must be set to `production` in live environments | Disables stack traces in HTTP responses |
| `MONGO_URI` | MongoDB connection URI with TLS and replica set | Must use strong auth credentials |
| `JWT_SECRET` | Secret key for signing Admin and Editorial tokens | Minimum 32 characters, high entropy |
| `FRONTEND_URL` | Public origin for CORS allowlisting | Strict domain match (no wildcards) |
| `RAZORPAY_KEY_ID` | Razorpay public key ID | Used for client-side checkout |
| `RAZORPAY_KEY_SECRET`| Razorpay secret key | Strictly server-side; never exposed |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay Webhooks | Required for signature validation |
| `SMTP_HOST` / `SMTP_PORT` | Outbound transactional mail server | Must enforce TLS (port 465 or 587) |
| `SMTP_USER` / `SMTP_PASS` | SMTP authentication credentials | Zero-trust credentials |
| `RESEND_API_KEY` | Resend API key for email transport | Restrict to sending permissions |
| `CLOUDINARY_*` | Cloudinary storage for PPTs, logos, and assets | Restricted API key and secret |

### Startup Pre-flight Validation
At server startup, `hackathonConfigService.validateStartupConfig()` evaluates configuration variables:
- Asserts presence and minimum entropy of `JWT_SECRET`.
- Validates that `MONGO_URI` connects successfully before serving traffic.
- Validates payment gateway and email configuration.
- **Zero Secrets Rule**: The diagnostic validator masks sensitive strings (e.g., `rzp_live_***`, `re_***`) to prevent credentials from ever leaking into stdout or production log aggregators.

---

## 3. Database Management, Indexing & Backup/Restore

### Indexing Strategy
To guarantee low latency under peak registration and judging traffic, compound and sparse indexes are deployed:

```javascript
// HackathonAuditLog
{ createdAt: -1 }
{ targetEntity: 1, createdAt: -1 }
{ role: 1, createdAt: -1 }
{ actorId: 1, createdAt: -1 }
{ action: 1, createdAt: -1 }
{ targetId: 1, createdAt: -1 }

// HackathonTeam
{ 'members.email': 1 }
{ hackathonId: 1, status: 1 }
{ hackathonId: 1, paymentStatus: 1 }
{ hackathonId: 1, track: 1 }
{ isDeleted: 1, status: 1 }
{ createdAt: -1 }

// HackathonSubmission
{ hackathonId: 1, status: 1 }
{ hackathonId: 1, isLocked: 1 }
{ createdAt: -1 }

// HackathonCertificate
{ hackathonId: 1, status: 1, isRevoked: 1 }
{ hackathonId: 1, teamId: 1 }
{ createdAt: -1 }

// HackathonPrizeFulfillment
{ hackathonId: 1, status: 1 }
{ createdAt: -1 }
```

### Automated Backup & Restore Procedures
1. **Daily Automated Snapshots**:
   Configure MongoDB Atlas Continuous Cloud Backups with point-in-time recovery (PITR) enabled and 7-day retention.
2. **Pre-Milestone CLI Dump (e.g. before Result Publication)**:
   ```bash
   mongodump --uri="<MONGO_URI>" --gzip --archive="./backups/hackathon-pre-results-$(date +%Y%m%d%H%M).gz"
   ```
3. **Database Restore**:
   ```bash
   mongorestore --uri="<MONGO_URI>" --gzip --archive="./backups/<backup-file-name>.gz" --drop
   ```

---

## 4. Lifecycle Operational Procedures (Phases 1–9)

### Phase 1–2: Unstop Import & Pre-flight Validation
1. Export participant registration CSV from Unstop portal.
2. Navigate to **Admin Workspace -> Overview -> Import Unstop CSV**.
3. Upload CSV file. The parser validates mandatory columns: `Team Name`, `Team Leader Email`, `Member Details`.
4. Review dry-run summary: Total records, new teams created, duplicate leader emails skipped.
5. Confirm import. All teams initialize in `IMPORTED` status with `paymentStatus: "PENDING"`.

### Phase 3: Screening & Shortlisting
1. Navigate to **Admin Workspace -> Teams**.
2. Filter by track or status `IMPORTED` / `UNDER_REVIEW`.
3. Open team drawer to review idea description and PPT deck.
4. Score initial criteria (Innovation, Idea Quality, Feasibility, Presentation).
5. Click **Shortlist Team**. System transitions status to `SHORTLISTED`, logs immutable audit record, and triggers transactional invitation email containing payment link.

### Phase 4: ₹49 Payment Gateway & Webhook Handling
1. Shortlisted teams login to participant portal to verify roster and proceed to payment.
2. Checkout initiates Razorpay standard modal for ₹49.
3. Upon payment success, Razorpay posts `payment.captured` or `order.paid` event to `/api/hackathon/payment/webhook`.
4. Backend verifies webhook signature using HMAC-SHA256 (`RAZORPAY_WEBHOOK_SECRET`).
5. Upon valid signature:
   - Team `paymentStatus` transitions to `PAID`.
   - Team `status` transitions to `CONFIRMED`.
   - WhatsApp invite link and confirmation email are automatically transmitted.

### Phase 5: Submission Window & Server Deadline Enforcement
1. Submission window opens automatically based on `submissionDeadline` in Hackathon Settings.
2. Teams input GitHub URL, live deployment URL, video demo link, and project description.
3. Participants click **Final Submit & Lock**. System locks submission (`isLocked: true`, `submittedAt: Date.now()`).
4. **Server Clock Deadline Enforcement**: Once `Date.now() > submissionDeadline`, backend automatically rejects edits, regardless of client time manipulation.
5. In exceptional cases (e.g. participant technical glitch), Admin can unlock submission with an audited reason via `POST /api/hackathon/admin/submissions/:id/unlock`.

### Phase 6: Editorial Judge Provisioning & Blind Judging
1. Navigate to **Admin Workspace -> Editorial & Judges**.
2. Invite judges via email and assign domain expertise tracks.
3. Perform **Automated Assignment**: System distributes locked submissions evenly across judges, ensuring no judge evaluates more teams than max load and avoiding conflicts of interest.
4. Judges login via `/hackathon/editorial/login` with their unique credentials.
5. Blind review mode hides team school/personal details, displaying only Project Title, Track, Code Repository, and Demo URL.
6. Judges submit rubric scores (0-10) across:
   - Innovation & Originality
   - Technical Execution
   - Design & Usability
   - Impact & Feasibility
7. Completed evaluations update the real-time evaluation tally.

### Phase 7: Score Aggregation, Tiebreak & Official Result Lockdown
1. Navigate to **Admin Workspace -> Results**.
2. Click **Compute Aggregated Results**. Backend averages multi-judge evaluations and sorts descending.
3. Review tiebreakers: If two teams tie, system applies rubric tiebreak priority (Technical Execution -> Innovation -> Usability) or Admin resolves manually.
4. Assign Winner Tiers (Winner, 1st Runner Up, 2nd Runner Up, Best Track Innovation).
5. Click **Publish Results** to allow participants to see outcomes.
6. Click **Lock Official Results**. This marks results `isLocked: true`. Once locked, no judge or admin can alter rankings, scores, or winner awards without an emergency audit unlock.

### Phase 8: Automated Certificate Issuance & Prize Pipeline
1. Navigate to **Admin Workspace -> Certificates**.
2. Click **Generate Certificates**. System creates verified records for:
   - Participation: All confirmed team members who submitted a project.
   - Winners: Winning teams with their official award title.
3. Each certificate generates a cryptographically random verification code (e.g., `CAN-2026-X8B9K2`) and unique certificate number.
4. Public verification URL `/hackathon/verify/:code` allows recruiters and universities to authenticate credentials in real time.
5. Navigate to **Admin Workspace -> Prizes & Fulfillment** to track claim forms, disbursement payment modes (UPI/Bank Transfer), and dispatch tracking numbers.

### Phase 9: Real-time Operations & Health Center
1. Navigate to **Admin Workspace -> Operations & Health**.
2. Review **Health Index (0-100)** and real-time status banner.
3. Monitor the **9-Point System Completion Checklist**.
4. Review **Actionable Alerts**: Click "Resolve" to immediately navigate to the relevant workflow tab.
5. Execute **Operational Quick Search** (`Ctrl/Cmd + K` or Search button) to locate any entity across the platform in under 50ms.
6. Trigger **Controlled CSV Data Export** for offline archival.

---

## 5. Monitoring, Telemetry & Health Alerts

The Operations Service (`hackathonOpsService.js`) aggregates operational telemetry continuously:

### Health Score Weighting
- Base Score: `100` points
- Deductions:
  - Missing Webhook Secret: `-25` points (Critical payment risk)
  - Unlocked Published Results: `-15` points (Integrity risk)
  - Overdue Pending Evaluations: `-10` points (Judging bottleneck)
  - Email Bounce Rate > 5%: `-10` points (Deliverability risk)
  - Unclaimed Winner Prizes: `-5` points (Fulfillment delay)

### Email Deliverability Monitoring
Telemetry tracks all outbound transactional mail dispatched via Resend/SMTP:
- Delivery rate target: `>= 98.0%`
- Bounce rate alert threshold: `> 3.0%`
- Spam complaint threshold: `> 0.1%`
- Automatically logs all transmission outcomes to `EmailLog` collection.

---

## 6. Data Governance, Export Sanitization & Compliance

### CSV Formula Injection Defense
When exporting datasets for spreadsheet viewing (Excel, Apple Numbers, Google Sheets), values beginning with characters `=, +, -, @` can trigger formula execution.
- `hackathonOpsService.exportResourceAsCsv` sanitizes all text cells:
  ```javascript
  if (/^[=+\-@]/.test(cellString)) {
    cellString = "'" + cellString; // Prepend single quote to neutralize formula
  }
  ```

### Strict Resource Allowlisting
Exports are strictly restricted to allowlisted resources:
`teams`, `submissions`, `editorial-assignments`, `editorial-evaluations`, `results`, `certificates`, `prizes`, `sponsors`.
Arbitrary collection queries are rejected with HTTP 400.

### PII & Secret Stripping
All exports omit passwords, password hashes, webhook secrets, authentication tokens, and private API keys.

---

## 7. Incident Response Playbooks

### Playbook 1: Razorpay Webhook Outage or Signature Mismatch
**Symptoms**: Team paid ₹49 on Razorpay, but status remains `PENDING` on dashboard.
1. Check `BACKEND` logs for `Invalid Razorpay webhook signature`.
2. Verify `RAZORPAY_WEBHOOK_SECRET` matches the secret configured in Razorpay Dashboard.
3. In Razorpay Dashboard -> Webhooks, view the failed event and check the HTTP response code.
4. **Manual Remediation**:
   - Locate payment in Razorpay Dashboard and obtain `payment_id` and `order_id`.
   - In Admin Workspace -> Teams, open team drawer.
   - Click **Verify Payment Manually**, enter payment ID, and confirm. System updates team to `PAID` / `CONFIRMED` and logs an audit trail.

### Playbook 2: Accidental Premature Result Publication
**Symptoms**: Results published before judging was complete or tiebreaks were resolved.
1. Navigate to **Admin Workspace -> Results**.
2. If results are not locked, toggle **Publish Results** to `OFF`.
3. If results are locked:
   - Run audited emergency unlock via Admin console.
   - Set `isResultsPublished = false` in `HackathonSettings`.
   - Audit log will record the retraction event with admin username and timestamp.

### Playbook 3: Judge Account Lockout or Compromised Password
**Symptoms**: Judge forgot password or entered incorrect credentials > 5 times.
1. Navigate to **Admin Workspace -> Editorial & Judges**.
2. Locate the judge in the table.
3. Click **Reset Password / Re-send Invitation**.
4. System invalidates existing tokens, generates a temporary high-entropy access credential, and logs an audit event.

### Playbook 4: Sudden Spike in Email Bounces
**Symptoms**: Deliverability widget shows bounce rate > 5%.
1. Check **Admin Workspace -> Operations & Health -> Email Deliverability Monitor**.
2. Inspect `EmailLog` entries for SMTP error codes (e.g. `550 User Unknown`, `421 Rate Limit`).
3. If domain throttling is reported, switch primary transport to Resend API fallback.
4. Export failed recipient list via controlled CSV export and verify email syntax.

---

## 8. Security Hardening & Pre-Flight Checklist

Before opening the platform for live traffic, verify each checkpoint:

- [x] **Rate Limiting Active**:
  - `hackathonPublicLimiter`: 120 req / 15 min on public endpoints.
  - `hackathonAuthLimiter`: 25 req / 15 min on login/register.
  - `hackathonExportLimiter`: 35 req / 15 min on CSV data exports.
- [x] **Zero Secrets in Git**: Verified `.env` is gitignored; only `.env.example` committed.
- [x] **MongoDB Indexes Built**: All compound and query indexes active on MongoDB cluster.
- [x] **Razorpay Webhook Verified**: Webhook endpoint tested with live HMAC signature.
- [x] **CORS Allowlist Restricted**: CORS configuration matches production frontend origin.
- [x] **Audit Logging Active**: All state modifications generate immutable `HackathonAuditLog` records.
- [x] **Blind Judging Enabled**: Judge views strip participant personal and institutional identifiers.
- [x] **Server-Time Deadlines Enforced**: System clock strictly governs submission lockdown.
- [x] **Certificate Verification Operational**: Public verification endpoint tested with valid and invalid codes.
- [x] **Automated Test Suites Passing**: 100% passing across all phase regression suites.
