# Assessment & Certification Module — Master Roadmap
# Code-A-Nova AI-Powered Assessment Platform

> **Single Source of Truth** for the entire Assessment module.
> This document is auto-updated after every phase.

---

## Table of Contents

1. Project Overview
2. Goals
3. Business Requirements
4. Functional Requirements
5. User Flow
6. Admin Flow
7. Recruiter Flow
8. AI Architecture
9. Database Design
10. Folder Structure
11. API Plan
12. UI Plan
13. Security
14. Background Workers
15. Phase Roadmap
16. Progress Tracker
17. Pending Tasks
18. Testing Strategy
19. Deployment Strategy
20. Future Roadmap

---

## 1. Project Overview

**Code-A-Nova Assessment & Certification Platform** is an enterprise-grade, AI-first,
multi-type assessment system built on top of the existing Code-A-Nova platform.

Students take AI-generated assessments across technology domains, earn verified certificates,
and recruiters can verify candidate credentials.
Admins configure everything from the Admin Panel — no code changes needed.

**Core Principle:** AI is always the primary question source. Database is the fallback. Assessment must never pause.

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | AI-first, real-time question generation per assessment session |
| G2 | Zero hardcoded values — everything configurable from Admin Panel |
| G3 | Scalable to millions of assessments with no architecture change |
| G4 | Auto-growing question bank via background workers |
| G5 | Professional certificates with public verification |
| G6 | Multi-Groq key management: round-robin + automatic failover |
| G7 | Recruiter portal for candidate credential verification |
| G8 | Detailed analytics for students, admins, and recruiters |

---

## 3. Business Requirements

| ID  | Requirement |
|-----|-------------|
| BR1 | Admin creates/edits/deletes Categories and Subcategories without code changes |
| BR2 | Each subcategory has its own AI Prompt Blueprint |
| BR3 | Assessment never stops — AI fallback to DB is seamless |
| BR4 | Question bank grows automatically via background jobs |
| BR5 | Certificates are PDF with unique ID, QR code, public URL |
| BR6 | 4 Groq API keys managed centrally with round-robin + failover |
| BR7 | Admin configures: questions count, passing %, time limit, difficulty per subcategory |
| BR8 | Recruiter can verify certificate via unique ID or URL |
| BR9 | Students get detailed feedback: weak topics, strong topics, AI analysis |
| BR10 | Low inventory alert when question count drops below configured threshold |

---

## 4. Functional Requirements

### Category Management
- Add / Edit / Delete / Disable / Enable categories
- Upload category icon and banner image
- Set display order
- No code changes for new categories

### Subcategory Management
- Unlimited subcategories per category
- Each has: name, description, icon, status, display order
- Link to AI Prompt Blueprint and Assessment Configuration

### Assessment Configuration (Per Subcategory)
- Total questions, passing percentage, time limit
- Difficulty distribution (Easy / Medium / Hard / Expert)
- Assessment type: MCQ / Coding / Mixed / AI Viva / Subjective
- AI-first toggle (default ON), AI timeout (default 7s)
- Enable/Disable certificate, Enable/Disable assessment

### AI Prompt Blueprint
- Custom system prompt per subcategory
- Topic list, output schema, version number

### Question Bank
- Stores all validated AI + manual + CSV questions
- Statuses: Pending / Approved / Rejected
- Auto-grows via background worker

### Assessment Session
- Rolling 5-question generation batches
- Session locked — questions never change after shown
- Max 7 seconds AI wait before DB fallback

### Certificate
- Auto-generated PDF on passing
- Unique Certificate ID (UUID), QR Code, Email delivery
- Public verification URL

### Analytics
- Per-student: history, scores, accuracy, time, rank
- Per-subcategory: attempts, avg score, pass rate
- Admin: total assessments, AI vs DB ratio, Groq key health
- Leaderboard per subcategory

### Recruiter Module
- Search candidate by email or certificate ID
- View assessment report, verify certificate, download report

---

## 5. User Flow

```
User → Browse Categories
     → Selects Subcategory
     → Views Config (time, questions, passing %)
     → Clicks "Start Assessment"
     → Session Created (unique sessionId)
     → AI Request → Batch 1 (5 questions, 7s timeout)
          ↓ AI OK          ↓ AI Failed
        Show AI Qs      Load DB Qs (AI continues in BG)
     → User answers Batch 1 (Batch 2 generating in BG)
     → ...continues until all questions answered
     → Submit → Score Calculated
     → Result Page (score, rank, weak/strong topics, AI feedback)
          ↓ Pass
        Certificate Generated (PDF + QR + Email)
        Dashboard Updated
```

---

## 6. Admin Flow

```
Admin Dashboard → "Assessment" Sidebar
  ├── Assessment Dashboard (stats overview)
  ├── Categories → Add/Edit/Delete/Icon/Order
  ├── Subcategories → Add/Edit/Delete/Order
  ├── Assessment Config → Per Subcategory
  ├── AI Configuration → Prompt Blueprints
  ├── Question Bank → View/Approve/Reject/Generate
  ├── Assessments → List active assessments
  ├── Certificates → Issued certs, revoke
  ├── Analytics → Full dashboard
  ├── Background Jobs → Queue status, retry
  └── Settings → Global settings
```

---

## 7. Recruiter Flow

```
Recruiter → /verify
  → Enter Certificate ID or Candidate Email
  → System returns:
       Certificate validity (Valid / Revoked / Not Found)
       Candidate Name, Assessment Name, Score, Pass Date
       Certificate PDF link
  → Download report
```

---

## 8. AI Architecture

### Groq Manager Service

```
4 Groq API Keys: GROQ_KEY_1, GROQ_KEY_2, GROQ_KEY_3, GROQ_KEY_4

GroqManager {
  keys: [ { key, status, requests, failures, latency, cooldownUntil } ]
  currentIndex: 0  // Round Robin pointer

  getNextKey():
    → cycle keys, skip keys in cooldown
    → return healthy key

  executeRequest(prompt):
    → getNextKey()
    → send request
    → success: record latency, return result
    → fail (429/timeout/error): mark cooldown, try next key
    → all keys exhausted: throw AIUnavailableError

  healthMonitor():
    → runs every 30 seconds
    → checks cooldown expiry
    → restores keys after cooldown window
}
```

### Rolling Batch Generation

```
Session Starts
  → Batch 1 (5 Qs) AI Request (7s timeout)
  → If AI: show, validate, save
  → If fail: load 5 from DB

User on Q1-Q5 → Batch 2 generating in background
User on Q6-Q10 → Batch 3 generating in background
...until all questions answered
```

### Question Validation Pipeline

```
AI Response
  → JSON Parse
  → Schema Validation (required fields)
  → Grammar Check (non-empty, meaningful)
  → Duplicate Detection (hash vs DB)
  → Topic Detection (matches expected topics)
  → Difficulty Validation
  → Option Validation (4 options, valid correct index)
  → PASS: Save to QuestionBank (Approved)
  → FAIL: Log rejection reason, discard
```

### Background Question Factory

```
InventoryChecker (every 1 hour):
  → For each subcategory × difficulty:
    → count approved questions
    → if count < inventoryTarget: queue GenerateQuestionsJob

GenerateQuestionsJob:
  → uses GroqManager
  → generates via AI Prompt Blueprint
  → validates each question
  → saves approved to assessment_questions
  → updates job progress
```

---

## 9. Database Design

### assessment_categories
```
_id, name, slug, description, icon, banner,
displayOrder, isActive, createdAt, updatedAt
```

### assessment_subcategories
```
_id, categoryId, name, slug, description, icon,
displayOrder, isActive, createdAt, updatedAt
```

### assessment_configs
```
_id, subcategoryId, totalQuestions, passingPercentage,
timeLimitMinutes, difficultyDistribution {easy,medium,hard,expert},
assessmentType, aiFirst, aiTimeoutSeconds, certificateEnabled,
isActive, inventoryTarget {easy,medium,hard,expert}, createdAt, updatedAt
```

### assessment_ai_blueprints
```
_id, subcategoryId, systemPrompt, topics[], outputSchema,
version, isActive, createdAt, updatedAt
```

### assessment_questions
```
_id, subcategoryId, categoryId, text, options[], correctIndex,
explanation, difficulty, topics[], source (AI|manual|csv),
status (approved|pending|rejected), rejectionReason,
hash (md5 for dedup), usedCount, createdAt, updatedAt
```

### assessment_sessions
```
_id, userId, subcategoryId, configId,
status (in_progress|completed|abandoned),
startedAt, completedAt, totalQuestions, currentBatch,
questionIds[], answers[{questionId, selectedIndex, isCorrect, timeTakenSeconds}],
score, percentage, passed, aiQuestionsCount, dbQuestionsCount, createdAt
```

### assessment_certificates
```
_id, userId, sessionId, subcategoryId,
certificateId (UUID), candidateName, assessmentName,
score, percentage, issuedAt, pdfUrl, qrCodeUrl,
verificationUrl, isRevoked, revokedAt, createdAt
```

### assessment_ai_jobs
```
_id, jobType, subcategoryId, difficulty, targetCount,
generatedCount, approvedCount, rejectedCount,
status (queued|running|completed|failed),
progress, error, groqKeyUsed, startedAt, completedAt, createdAt
```

### assessment_leaderboard
```
_id, subcategoryId, userId, bestScore, bestPercentage,
attempts, rank, updatedAt
```

---

## 10. Folder Structure

```
BACKEND/
├── models/assessment/
│   ├── AssessmentCategory.js
│   ├── AssessmentSubcategory.js
│   ├── AssessmentConfig.js
│   ├── AssessmentAIBlueprint.js
│   ├── AssessmentQuestion.js
│   ├── AssessmentSession.js
│   ├── AssessmentCertificate.js
│   ├── AssessmentAIJob.js
│   └── AssessmentLeaderboard.js
│
├── controllers/assessment/
│   ├── categoryController.js
│   ├── subcategoryController.js
│   ├── configController.js
│   ├── blueprintController.js
│   ├── questionBankController.js
│   ├── sessionController.js
│   ├── resultController.js
│   ├── certificateController.js
│   ├── analyticsController.js
│   └── jobController.js
│
├── services/assessment/
│   ├── GroqManager.js
│   ├── QuestionGenerator.js
│   ├── QuestionValidator.js
│   ├── SessionManager.js
│   ├── CertificateService.js
│   ├── InventoryChecker.js
│   └── EmailService.js
│
├── workers/assessment/
│   ├── QuestionFactoryWorker.js
│   └── InventoryWorker.js
│
└── routes/assessment/
    ├── adminAssessment.js
    ├── studentAssessment.js
    └── publicAssessment.js

FRONTEND/src/
├── Pages/Assessment/
│   ├── AssessmentHome.jsx
│   ├── AssessmentSubcategory.jsx
│   ├── AssessmentSession.jsx
│   ├── AssessmentResult.jsx
│   ├── AssessmentHistory.jsx
│   ├── CertificateVerify.jsx
│   └── CertificateDownload.jsx
│
├── Components/Assessment/
│   ├── CategoryCard.jsx
│   ├── SubcategoryCard.jsx
│   ├── QuestionCard.jsx
│   ├── TimerBar.jsx
│   ├── ProgressBar.jsx
│   ├── ResultSummary.jsx
│   ├── CertificateCard.jsx
│   └── LeaderboardTable.jsx
│
└── Admin/Assessment/
    ├── AssessmentDashboard.jsx
    ├── CategoryManager.jsx
    ├── SubcategoryManager.jsx
    ├── ConfigManager.jsx
    ├── BlueprintManager.jsx
    ├── QuestionBankManager.jsx
    ├── AssessmentsList.jsx
    ├── CertificatesPanel.jsx
    ├── AnalyticsDashboard.jsx
    ├── BackgroundJobs.jsx
    └── AssessmentSettings.jsx

docs/
└── assessment-roadmap.md
```

---

## 11. API Plan

### Admin: /api/admin/assessment/

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /categories | List / Create |
| PUT/DELETE | /categories/:id | Update / Delete |
| PATCH | /categories/:id/toggle | Enable/Disable |
| POST | /categories/:id/icon | Upload icon |
| GET/POST | /subcategories | List / Create |
| PUT/DELETE | /subcategories/:id | Update / Delete |
| GET/PUT | /configs/:subcategoryId | Get / Update config |
| GET/PUT | /blueprints/:subcategoryId | Get / Update blueprint |
| GET/POST | /questions | List (paginated) / Add manual |
| PUT/DELETE | /questions/:id | Update / Delete |
| PATCH | /questions/:id/status | Approve / Reject |
| POST | /questions/generate | Trigger AI generation job |
| POST | /questions/import-csv | CSV import |
| GET | /jobs | List background jobs |
| GET | /jobs/:id | Job detail + progress |
| POST | /jobs/:id/retry | Retry failed job |
| GET | /certificates | List all certificates |
| PATCH | /certificates/:id/revoke | Revoke certificate |
| GET | /analytics/overview | Overview stats |
| GET | /groq/health | Groq key health |

### Student: /api/assessment/

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /categories | Browse categories |
| GET | /categories/:slug/subcategories | Browse subcategories |
| GET | /subcategories/:slug | Detail + config preview |
| POST | /sessions/start | Start session |
| GET | /sessions/:id/batch | Next question batch |
| POST | /sessions/:id/answer | Submit answer |
| POST | /sessions/:id/submit | Final submit |
| GET | /sessions/:id/result | Result + feedback |
| GET | /history | Assessment history |
| GET | /leaderboard/:subcategoryId | Leaderboard |
| GET | /certificates | Student certificates |
| GET | /certificates/:id/download | Download PDF |

### Public: /api/public/assessment/

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /verify/:certificateId | Public certificate verification |

---

## 12. UI Plan

### Admin Sidebar (Assessment Section)
```
Assessment
├── Dashboard     (stats: assessments, pass rate, AI health, inventory)
├── Categories    (table: add/edit/delete/icon/order)
├── Sub Categories (table: filtered by category)
├── Assessment Config (per-subcategory form)
├── AI Configuration  (prompt blueprint editor)
├── Question Bank (table: filters, approve/reject, generate)
├── Assessments   (live assessments list)
├── Certificates  (issued certs, revoke)
├── Analytics     (charts: scores, pass rate, trends)
├── Background Jobs (live queue with progress bars)
└── Settings      (global: timeout, retry, defaults)
```

### Student Pages
```
/assessment             → Browse categories (card grid)
/assessment/:category   → Browse subcategories
/assessment/:cat/:sub   → Detail page + start button
/assessment/session/:id → Active (timer, question, options, progress)
/assessment/result/:id  → Result (score, topics, AI feedback)
/assessment/history     → Past assessments list
/certificate/verify/:id → Public verification page
```

---

## 13. Security

| Area | Implementation |
|------|---------------|
| Auth | Existing JWT middleware |
| Admin Routes | Existing verifyAdmin middleware |
| Rate Limiting | 60 req/min per IP on public APIs |
| Input Validation | Mongoose schema + express-validator |
| Sanitization | Strip HTML from all text inputs |
| Session Isolation | Questions never exposed until answered |
| Certificate Verify | UUID-based, public but read-only |
| Server-side Scoring | Never trust client score |
| Audit Logs | Every admin action logged with timestamp + adminId |

---

## 14. Background Workers

### Worker 1: InventoryChecker
- Runs every 1 hour via cron
- Checks approved questions per subcategory × difficulty
- Below inventoryTarget → queues GenerateQuestionsJob
- Admin notification if critically low

### Worker 2: QuestionFactoryWorker
- Picks queued GenerateQuestionsJob
- Uses GroqManager for AI generation
- Validates via QuestionValidator
- Saves approved to assessment_questions
- Updates job progress in real-time

---

## 15. Phase Roadmap

| Phase | Name | Status |
|-------|------|--------|
| Phase 0  | Roadmap Document | ✅ COMPLETED |
| Phase 1  | Foundation: Models + GroqManager + Admin Sidebar | ✅ COMPLETED |
| Phase 2  | Category & Subcategory Management (Admin CRUD + UI) | ✅ COMPLETED |
| Phase 3  | Assessment Config + AI Blueprint Editor | ⏳ Pending |
| Phase 4  | Question Bank: Manual Add + CSV Import + Admin UI | ⏳ Pending |
| Phase 5  | GroqManager + AI Question Generation + Validator | ⏳ Pending |
| Phase 6  | Background Workers: Inventory Checker + Question Factory | ⏳ Pending |
| Phase 7  | Assessment Session: Start + Rolling Batch + AI First + DB Fallback | ⏳ Pending |
| Phase 8  | Answer Submission + Server-side Scoring + Result Engine | ⏳ Pending |
| Phase 9  | Certificate: PDF + QR Code + Email + Public Verify | ⏳ Pending |
| Phase 10 | Student Dashboard: History + Certificates + Leaderboard | ⏳ Pending |
| Phase 11 | Analytics Dashboard (Admin + Student) | ⏳ Pending |
| Phase 12 | Recruiter Module: Search + Verify | ⏳ Pending |
| Phase 13 | Performance: Caching + Query Optimization | ⏳ Pending |
| Phase 14 | Testing + Security Audit + Final Polish | ⏳ Pending |
| Phase 15 | Merge to main + Production Deployment | ⏳ Pending |

---

## 16. Progress Tracker

```
Phase 0   [####################] COMPLETED
Phase 1   [####################] COMPLETED
Phase 2   [####################] COMPLETED
Phase 3   [....................] Pending
Phase 4   [....................] Pending
Phase 5   [....................] Pending
Phase 6   [....................] Pending
Phase 7   [....................] Pending
Phase 8   [....................] Pending
Phase 9   [....................] Pending
Phase 10  [....................] Pending
Phase 11  [....................] Pending
Phase 12  [....................] Pending
Phase 13  [....................] Pending
Phase 14  [....................] Pending
Phase 15  [....................] Pending
```

---

## 17. Pending Tasks

- [x] Phase 1: Create 9 Mongoose models in BACKEND/models/assessment/
- [x] Phase 1: Create GroqManager.js service (round-robin + failover)
- [x] Phase 1: Add "Assessment" sidebar section in AdminDashboard.jsx
- [x] Phase 1: Create stub AssessmentDashboard.jsx
- [x] Phase 1: Register assessment routes in index.js
- [x] Phase 2: Upgrade Category & Subcategory Mongoose models with dynamic inventory health status and virtuals
- [x] Phase 2: Add auto-sync hooks to AssessmentQuestion to automatically maintain question counts
- [x] Phase 2: Category & Subcategory CRUD APIs + Admin UI (CategoryManager.jsx, SubcategoryManager.jsx, CategoryDetail.jsx)
- [x] Phase 2: Implement Multi-step Category Creation Wizard (CategoryWizard.jsx + atomic backend route)
- [ ] Phase 3: Assessment Config form + API
- [ ] Phase 3: AI Blueprint editor + API
- [ ] Phase 4: Question Bank table + Manual add + CSV import
- [ ] Phase 5: AI question generation via GroqManager
- [ ] Phase 5: QuestionValidator pipeline
- [ ] Phase 6: Background worker cron setup
- [ ] Phase 7: Session start + rolling batch + AI-first (7s) + DB fallback
- [ ] Phase 8: Answer submission + scoring + result page + AI feedback
- [ ] Phase 9: Certificate PDF + QR + Email
- [ ] Phase 10: Student history + certificate download
- [ ] Phase 11: Analytics charts
- [ ] Phase 12: Recruiter verify portal
- [ ] Phase 13: Caching + optimization
- [ ] Phase 14: Tests + security audit
- [ ] Phase 15: Merge to main

---

## 18. Testing Strategy

### Key Test Scenarios

| Scenario | Expected |
|----------|----------|
| AI responds in <7s | AI questions shown |
| AI times out (7s) | DB questions loaded, no pause |
| All 4 Groq keys rate-limited | Graceful error message |
| Duplicate question from AI | Rejected by validator |
| User submits same session twice | 409 Conflict |
| Score = exactly passing % | Certificate generated |
| Score < passing % | No certificate, retry shown |
| Certificate ID tampered | 404 Invalid |
| Admin deletes category with active assessments | 400 Conflict |

---

## 19. Deployment Strategy

- Branch: feature/assessment-module
- Merge: Only after Phase 14 complete
- New env vars required:
  - GROQ_KEY_1, GROQ_KEY_2, GROQ_KEY_3, GROQ_KEY_4
  - CERTIFICATE_BASE_URL
- DB: New collections auto-created by Mongoose on first run
- No breaking changes to existing functionality

---

## 20. Future Roadmap

| Feature | Priority |
|---------|----------|
| Coding Assessment (code execution sandbox) | High |
| AI Voice Viva (speech-based interview) | High |
| Mixed Assessment (MCQ + Coding combined) | Medium |
| Subjective Assessment (AI grading) | Medium |
| Recruiter Custom Assessment Builder | High |
| Team / Company-wide Assessments | Medium |
| Proctoring (eye tracking, tab detection) | Medium |
| Mobile App Integration | Low |

---

## Phase 2 — Completion Summary

**Date Completed**: 2026-07-31
**Branch**: feature/assessment-module

**Files Created**:
- BACKEND/controllers/assessment/categoryController.js
- BACKEND/controllers/assessment/subcategoryController.js
- FRONTEND/src/Admin/Assessment/AssessmentOverview.jsx
- FRONTEND/src/Admin/Assessment/CategoryManager.jsx
- FRONTEND/src/Admin/Assessment/CategoryDetail.jsx
- FRONTEND/src/Admin/Assessment/SubcategoryManager.jsx
- FRONTEND/src/Admin/Assessment/CategoryWizard.jsx

**Files Modified**:
- BACKEND/models/assessment/AssessmentCategory.js
- BACKEND/models/assessment/AssessmentSubcategory.js
- BACKEND/models/assessment/AssessmentQuestion.js
- BACKEND/routes/assessment/adminAssessment.js
- FRONTEND/src/Admin/Assessment/AssessmentDashboard.jsx
- docs/assessment-roadmap.md

**Database Changes**: 
- Upgraded `AssessmentCategory` & `AssessmentSubcategory` schemas with `icon`, `banner`, `color`, `targetQuestionCount`, `totalAIQuestions`, `totalManualQuestions`, `totalCSVQuestions`, and virtuals for `healthStatus` (`Healthy`, `Medium`, `Low`, `Critical`) and `inventoryPercentage`.
- Implemented automatic inventory sync Mongoose post-hooks on `AssessmentQuestion` (`post('save')`, `post('findOneAndDelete')`, `post('findOneAndUpdate')`) to ensure current question counts are 100% database-driven and never manually edited.

**API Changes**:
- Implemented full CRUD routes with global search, filtering, pagination, sorting, duplicate (`/copy`), status toggle (`/status`), and bulk status/delete endpoints for categories and subcategories.
- Created atomic endpoint `POST /api/admin/assessment/categories/wizard` for one-click deployment of categories with unlimited subcategories and linked default configs/blueprints.
- Added comprehensive metrics endpoint `GET /api/admin/assessment/dashboard/stats`.

**UI Changes**:
- Engineered an enterprise-grade UI suite featuring KPI cards, question source progress bars, real-time AI key pool monitoring, interactive category/subcategory management tables, and a dynamic 5-step creation wizard.

**Testing Checklist**:
- [x] Verified clean syntax and schema registration across all models and controllers
- [x] Confirmed clean production Vite compilation (`npx vite build`) in 5.11s with zero errors
- [x] Tested automatic slug generation and inventory virtual calculation logic

**Remaining Work**: Start Phase 3 (Assessment Configuration & AI Blueprint Editor) upon next instruction.

---

> Next Command: Type "Next Phase" to begin Phase 3 implementation.
> Last Updated: Phase 1 — 2026-07-31
