/**
 * Phase 7: Final Results, Winner Management & Result Locking Test Suite
 * Covers 65+ assertions testing server-side score aggregation, deterministic ranking,
 * incomplete judging, tie handling, admin review, winner assignment, approval, publication,
 * locking, reopening, participant/public visibility, and audit logging.
 */

const assert = require('assert');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const HackathonSetting = require('../models/HackathonSetting');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonSubmission = require('../models/HackathonSubmission');
const HackathonEditorialMember = require('../models/HackathonEditorialMember');
const HackathonEditorialAssignment = require('../models/HackathonEditorialAssignment');
const HackathonEditorialEvaluation = require('../models/HackathonEditorialEvaluation');
const HackathonResult = require('../models/HackathonResult');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const User = require('../models/User');
const hackathonRoutes = require('../routes/hackathon');

const PORT = 5096;
const BASE_URL = `http://localhost:${PORT}/api/hackathon`;

async function runPhase7Tests() {
  console.log('================================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 7 RESULTS & WINNER TEST SUITE');
  console.log('================================================================\n');

  let server;
  let passedAssertions = 0;
  let failedAssertions = 0;

  function testAssert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedAssertions++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failedAssertions++;
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
      server = app.listen(PORT, resolve);
    });

    const testHackathonId = 'can-hackathon-2026-p7-test';
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';

    // 1. Create or retrieve Admin, Participant, and Editorial Users
    await User.deleteMany({ email: { $in: ['admin.p7@test.com', 'user.p7@test.com', 'unassigned.p7@test.com'] } });
    await HackathonEditorialMember.deleteMany({ email: { $in: ['judge1.p7@test.com', 'judge2.p7@test.com'] } });

    const Admin = require('../models/Admin');
    await Admin.deleteMany({ email: 'admin.p7@test.com' });
    const adminUser = await Admin.create({
      username: 'admin_p7',
      email: 'admin.p7@test.com',
      password: 'Password123!',
    });

    const participantUser = await User.create({
      name: 'Leader Alpha P7',
      email: 'user.p7@test.com',
      password: 'Password123!',
      mobile: '9876543202',
      role: 'student',
      isVerified: true,
    });

    const judge1 = await HackathonEditorialMember.create({
      hackathonId: testHackathonId,
      name: 'Judge Alice P7',
      email: 'judge1.p7@test.com',
      passwordHash: 'dummy_hash',
      role: 'editorial',
      isActive: true,
    });

    const judge2 = await HackathonEditorialMember.create({
      hackathonId: testHackathonId,
      name: 'Judge Bob P7',
      email: 'judge2.p7@test.com',
      passwordHash: 'dummy_hash',
      role: 'editorial',
      isActive: true,
    });

    const adminToken = jwt.sign({ id: adminUser._id, _id: adminUser._id, role: 'admin', email: adminUser.email }, jwtSecret);
    const participantToken = jwt.sign({ id: participantUser._id, _id: participantUser._id, role: 'student', email: participantUser.email }, jwtSecret);
    const judge1Token = judge1.generateAuthToken();

    // Clean up test collections for isolated test execution
    const testTeamIds = ['P7-TEAM-A', 'P7-TEAM-B', 'P7-TEAM-C', 'P7-TEAM-PENDING', 'P7-TEAM-UNSUB', 'P7-TEAM-REJ'];
    await HackathonResult.deleteMany({ hackathonId: testHackathonId });
    await HackathonEditorialEvaluation.deleteMany({ hackathonId: testHackathonId });
    await HackathonEditorialAssignment.deleteMany({ hackathonId: testHackathonId });
    await HackathonSubmission.deleteMany({ teamId: { $in: testTeamIds } });
    await HackathonTeam.deleteMany({ teamId: { $in: testTeamIds } });
    await HackathonAuditLog.deleteMany({ targetId: { $in: [...testTeamIds, testHackathonId] } });

    // Settings setup
    await HackathonSetting.deleteMany({ hackathonId: testHackathonId });
    await HackathonSetting.create({
      hackathonId: testHackathonId,
      name: 'Code-A-Nova 2026 Test Hackathon',
      isResultsPublished: false,
      resultsLocked: false,
      winnerCategories: [
        { categoryId: 'WINNER_1ST', name: 'Winner (1st Place)', prize: '₹15,000 + Trophy', rankRestriction: 1, maxWinners: 1, isActive: true },
        { categoryId: 'RUNNER_UP_2ND', name: '1st Runner Up (2nd Place)', prize: '₹10,000', rankRestriction: 2, maxWinners: 1, isActive: true },
        { categoryId: 'RUNNER_UP_3RD', name: '2nd Runner Up (3rd Place)', prize: '₹5,000', rankRestriction: 3, maxWinners: 1, isActive: true },
        { categoryId: 'BEST_INNOVATION', name: 'Best Innovation Award', prize: 'Special Recognition', rankRestriction: null, maxWinners: 1, isActive: true },
      ],
    });

    // Helper to create team and submission
    async function setupTeam(teamId, teamName, status, hasSubmission = true) {
      const team = await HackathonTeam.create({
        hackathonId: testHackathonId,
        teamId,
        teamName,
        track: 'AI & Machine Learning',
        status,
        leader: { name: `Leader ${teamName}`, email: `${teamId.toLowerCase()}@test.com`, userId: teamId === 'P7-TEAM-A' ? participantUser._id : new mongoose.Types.ObjectId() },
        paymentStatus: 'PAID',
      });

      let submission = null;
      if (hasSubmission) {
        submission = await HackathonSubmission.create({
          hackathonId: testHackathonId,
          team: team._id,
          teamId,
          submitterEmail: `${teamId.toLowerCase()}@test.com`,
          submitterName: `Leader ${teamName}`,
          projectName: `Project ${teamName}`,
          status: 'SUBMITTED',
          isLocked: true,
          submittedAt: new Date(),
        });
        team.submissionId = submission._id;
        await team.save();
      }
      return { team, submission };
    }

    // Create Teams:
    // Team A: 2 judges finalized (Scores: 90, 94 -> Avg 92.00) -> Rank 1
    const { team: teamA, submission: subA } = await setupTeam('P7-TEAM-A', 'Alpha Innovators', 'EVALUATED');
    // Team B: 2 judges finalized (Scores: 88, 86 -> Avg 87.00) -> Tied
    const { team: teamB, submission: subB } = await setupTeam('P7-TEAM-B', 'Beta Builders', 'EVALUATED');
    // Team C: 2 judges finalized (Scores: 87, 87 -> Avg 87.00) -> Tied with Team B!
    const { team: teamC, submission: subC } = await setupTeam('P7-TEAM-C', 'Gamma Coders', 'EVALUATED');
    // Team Pending: 2 assigned judges, but only 1 finalized -> PENDING_EVALUATIONS
    const { team: teamPend, submission: subPend } = await setupTeam('P7-TEAM-PENDING', 'Pending Pilots', 'UNDER_EVALUATION');
    // Team Unsubmitted: Confirmed, but no final submission -> INELIGIBLE
    const { team: teamUnsub } = await setupTeam('P7-TEAM-UNSUB', 'Unsubmitted Squad', 'CONFIRMED', false);
    // Team Rejected: Rejected in admin review -> INELIGIBLE
    const { team: teamRej, submission: subRej } = await setupTeam('P7-TEAM-REJ', 'Rejected Rebels', 'REJECTED');

    // Setup Assignments & Evaluations
    // Team A (Judge 1 = 90, Judge 2 = 94)
    const asA1 = await HackathonEditorialAssignment.create({ hackathonId: testHackathonId, team: teamA._id, teamId: teamA.teamId, submission: subA._id, editorialMember: judge1._id, status: 'ACTIVE' });
    const asA2 = await HackathonEditorialAssignment.create({ hackathonId: testHackathonId, team: teamA._id, teamId: teamA.teamId, submission: subA._id, editorialMember: judge2._id, status: 'ACTIVE' });
    await HackathonEditorialEvaluation.create({ hackathonId: testHackathonId, team: teamA._id, teamId: teamA.teamId, submission: subA._id, assignment: asA1._id, editorialMember: judge1._id, scores: [{ criterion: 'Tech', score: 25, maxScore: 25 }], totalScore: 90, status: 'FINALIZED', isLocked: true });
    await HackathonEditorialEvaluation.create({ hackathonId: testHackathonId, team: teamA._id, teamId: teamA.teamId, submission: subA._id, assignment: asA2._id, editorialMember: judge2._id, scores: [{ criterion: 'Tech', score: 25, maxScore: 25 }], totalScore: 94, status: 'FINALIZED', isLocked: true });

    // Team B (Judge 1 = 88, Judge 2 = 86 -> Avg 87.00)
    const asB1 = await HackathonEditorialAssignment.create({ hackathonId: testHackathonId, team: teamB._id, teamId: teamB.teamId, submission: subB._id, editorialMember: judge1._id, status: 'ACTIVE' });
    const asB2 = await HackathonEditorialAssignment.create({ hackathonId: testHackathonId, team: teamB._id, teamId: teamB.teamId, submission: subB._id, editorialMember: judge2._id, status: 'ACTIVE' });
    await HackathonEditorialEvaluation.create({ hackathonId: testHackathonId, team: teamB._id, teamId: teamB.teamId, submission: subB._id, assignment: asB1._id, editorialMember: judge1._id, scores: [{ criterion: 'Tech', score: 25, maxScore: 25 }], totalScore: 88, status: 'FINALIZED', isLocked: true });
    await HackathonEditorialEvaluation.create({ hackathonId: testHackathonId, team: teamB._id, teamId: teamB.teamId, submission: subB._id, assignment: asB2._id, editorialMember: judge2._id, scores: [{ criterion: 'Tech', score: 25, maxScore: 25 }], totalScore: 86, status: 'FINALIZED', isLocked: true });

    // Team C (Judge 1 = 87, Judge 2 = 87 -> Avg 87.00)
    const asC1 = await HackathonEditorialAssignment.create({ hackathonId: testHackathonId, team: teamC._id, teamId: teamC.teamId, submission: subC._id, editorialMember: judge1._id, status: 'ACTIVE' });
    const asC2 = await HackathonEditorialAssignment.create({ hackathonId: testHackathonId, team: teamC._id, teamId: teamC.teamId, submission: subC._id, editorialMember: judge2._id, status: 'ACTIVE' });
    await HackathonEditorialEvaluation.create({ hackathonId: testHackathonId, team: teamC._id, teamId: teamC.teamId, submission: subC._id, assignment: asC1._id, editorialMember: judge1._id, scores: [{ criterion: 'Tech', score: 25, maxScore: 25 }], totalScore: 87, status: 'FINALIZED', isLocked: true });
    await HackathonEditorialEvaluation.create({ hackathonId: testHackathonId, team: teamC._id, teamId: teamC.teamId, submission: subC._id, assignment: asC2._id, editorialMember: judge2._id, scores: [{ criterion: 'Tech', score: 25, maxScore: 25 }], totalScore: 87, status: 'FINALIZED', isLocked: true });

    // Team Pending (2 assigned, only Judge 1 finalized)
    const asP1 = await HackathonEditorialAssignment.create({ hackathonId: testHackathonId, team: teamPend._id, teamId: teamPend.teamId, submission: subPend._id, editorialMember: judge1._id, status: 'ACTIVE' });
    const asP2 = await HackathonEditorialAssignment.create({ hackathonId: testHackathonId, team: teamPend._id, teamId: teamPend.teamId, submission: subPend._id, editorialMember: judge2._id, status: 'ACTIVE' });
    await HackathonEditorialEvaluation.create({ hackathonId: testHackathonId, team: teamPend._id, teamId: teamPend.teamId, submission: subPend._id, assignment: asP1._id, editorialMember: judge1._id, scores: [{ criterion: 'Tech', score: 25, maxScore: 25 }], totalScore: 75, status: 'FINALIZED', isLocked: true });

    console.log('--- 1. Testing Security & Role Authorization on Result Endpoints ---');
    // 1.1 Unauthenticated calculation
    {
      const res = await fetch(`${BASE_URL}/admin/results/calculate`, { method: 'POST' });
      testAssert(res.status === 401, 'Unauthenticated calculation request returns HTTP 401');
    }

    // 1.2 Participant calculation
    {
      const res = await fetch(`${BASE_URL}/admin/results/calculate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${participantToken}` },
      });
      testAssert(res.status === 403, 'Participant token calculating results blocked with HTTP 403');
    }

    // 1.3 Editorial calculation
    {
      const res = await fetch(`${BASE_URL}/admin/results/calculate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${judge1Token}` },
      });
      testAssert(res.status === 403, 'Editorial token calculating results blocked with HTTP 403');
    }

    // 1.4 Participant cannot approve
    {
      const res = await fetch(`${BASE_URL}/admin/results/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${participantToken}` },
      });
      testAssert(res.status === 403, 'Participant cannot approve results (HTTP 403)');
    }

    // 1.5 Participant cannot lock
    {
      const res = await fetch(`${BASE_URL}/admin/results/lock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${participantToken}` },
      });
      testAssert(res.status === 403, 'Participant cannot lock results (HTTP 403)');
    }

    console.log('\n--- 2. Testing Server-Side Results Calculation & Aggregation ---');
    let calcData = null;
    {
      const res = await fetch(`${BASE_URL}/admin/results/calculate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: testHackathonId }),
      });
      calcData = await res.json();
      if (res.status !== 200) {
        console.error('DEBUG calculate error:', res.status, calcData);
      }
      testAssert(res.status === 200, 'Admin calculates results successfully with HTTP 200');
      testAssert(calcData.consideredCount === 6, 'All 6 teams considered');
      testAssert(calcData.eligibleCount === 3, 'Exactly 3 teams are eligible for ranking (A, B, C)');
      testAssert(calcData.pendingCount === 1, 'Exactly 1 team flagged PENDING_EVALUATIONS (Pending Pilots)');
      testAssert(calcData.ineligibleCount === 2, 'Exactly 2 teams flagged INELIGIBLE (Unsubmitted & Rejected)');
    }

    console.log('\n--- 3. Testing Incomplete Judging & Ineligibility Handling ---');
    {
      const res = await fetch(`${BASE_URL}/admin/results?hackathonId=${testHackathonId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      testAssert(res.status === 200, 'Admin lists calculated results with HTTP 200');

      const pendResult = data.results.find((r) => r.teamId === 'P7-TEAM-PENDING');
      testAssert(pendResult !== undefined, 'Pending team is present in results list');
      testAssert(pendResult.rankingStatus === 'PENDING_EVALUATIONS', 'Pending team status is PENDING_EVALUATIONS');
      testAssert(pendResult.pendingJudgeCount === 1, 'Pending judge count is accurately 1');
      testAssert(pendResult.rank === null, 'Pending team does not receive an official rank');

      const unsubResult = data.results.find((r) => r.teamId === 'P7-TEAM-UNSUB');
      testAssert(unsubResult.rankingStatus === 'INELIGIBLE', 'Unsubmitted team status is INELIGIBLE');

      const rejResult = data.results.find((r) => r.teamId === 'P7-TEAM-REJ');
      testAssert(rejResult.rankingStatus === 'INELIGIBLE', 'Rejected team status is INELIGIBLE');
    }

    console.log('\n--- 4. Testing Deterministic Ranking & Arithmetic Mean Calculation ---');
    {
      const resA = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-A' });
      testAssert(resA !== null, 'Team A result recorded');
      testAssert(resA.finalScore === 92.0, 'Team A score calculated as (90 + 94)/2 = 92.00');
      testAssert(resA.rank === 1, 'Team A holds Rank 1 with highest score');
      testAssert(resA.scoreSnapshot.length === 2, 'Team A scoreSnapshot contains 2 judge evaluations');

      const resB = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-B' });
      testAssert(resB.finalScore === 87.0, 'Team B score calculated as (88 + 86)/2 = 87.00');

      const resC = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-C' });
      testAssert(resC.finalScore === 87.0, 'Team C score calculated as (87 + 87)/2 = 87.00');
    }

    console.log('\n--- 5. Testing Tie Detection & Unresolved Tie Approval Guard ---');
    {
      const resB = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-B' });
      const resC = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-C' });
      testAssert(resB.rankingStatus === 'TIE', 'Team B flagged rankingStatus = TIE');
      testAssert(resC.rankingStatus === 'TIE', 'Team C flagged rankingStatus = TIE');
      testAssert(resB.tieDetails.isTie === true, 'Team B tieDetails.isTie is true');
      testAssert(resB.tieDetails.tiedWithTeamIds.includes('P7-TEAM-C'), 'Team B tiedWithTeamIds includes Team C');

      // Attempt approval while unresolved podium ties exist (Teams B & C tie for Rank 2)
      const appRes = await fetch(`${BASE_URL}/admin/results/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: testHackathonId }),
      });
      const appData = await appRes.json();
      testAssert(appRes.status === 400, 'Approving results with unresolved podium tie rejected with HTTP 400');
      testAssert(appData.message.includes('Unresolved ties detected'), 'Helpful error message returned for unresolved ties');
    }

    console.log('\n--- 6. Testing Explicit Administrative Tie Resolution ---');
    {
      const res = await fetch(`${BASE_URL}/admin/results/resolve-tie`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: testHackathonId,
          teamOrders: [
            { teamId: 'P7-TEAM-B', rank: 2 },
            { teamId: 'P7-TEAM-C', rank: 3 },
          ],
          tieBreakReason: 'Team B achieved higher architecture scalability score in criterion review.',
        }),
      });
      testAssert(res.status === 200, 'Admin resolves tie successfully with HTTP 200');

      const resB = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-B' });
      const resC = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-C' });
      testAssert(resB.rank === 2, 'Team B resolved to Rank 2');
      testAssert(resC.rank === 3, 'Team C resolved to Rank 3');
      testAssert(resB.rankingStatus === 'READY', 'Team B status updated to READY');
      testAssert(resC.rankingStatus === 'READY', 'Team C status updated to READY');
      testAssert(resB.tieDetails.isTie === false, 'Team B isTie cleared to false');

      const tieLog = await HackathonAuditLog.findOne({ action: 'RESULT_TIE_RESOLVED', targetId: testHackathonId });
      testAssert(tieLog !== null, 'RESULT_TIE_RESOLVED logged to HackathonAuditLog');
    }

    console.log('\n--- 7. Testing Winner Category Assignment & Validation ---');
    {
      // 7.1 Assigning winner to ineligible team rejected
      const ineligRes = await fetch(`${BASE_URL}/admin/results/P7-TEAM-UNSUB/assign-winner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: testHackathonId, category: 'Winner (1st Place)', isWinner: true }),
      });
      testAssert(ineligRes.status === 400, 'Assigning winner award to ineligible team rejected with HTTP 400');

      // 7.2 Category rank restriction check (e.g. Winner restricted to rank 1; assigning to Rank 2 rejected)
      const rankMismatchRes = await fetch(`${BASE_URL}/admin/results/P7-TEAM-B/assign-winner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: testHackathonId, category: 'Winner (1st Place)', isWinner: true }),
      });
      testAssert(rankMismatchRes.status === 400, 'Assigning 1st Place Winner to Rank 2 team rejected with HTTP 400');

      // 7.3 Valid assignment to Rank 1 (Team A)
      const winResA = await fetch(`${BASE_URL}/admin/results/P7-TEAM-A/assign-winner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: testHackathonId,
          category: 'Winner (1st Place)',
          prize: '₹15,000 + Trophy',
          isWinner: true,
        }),
      });
      testAssert(winResA.status === 200, 'Assigning Winner to Team A succeeds with HTTP 200');

      // 7.4 Valid assignment to Rank 2 (Team B)
      const winResB = await fetch(`${BASE_URL}/admin/results/P7-TEAM-B/assign-winner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: testHackathonId,
          category: '1st Runner Up (2nd Place)',
          prize: '₹10,000',
          isRunnerUp: true,
        }),
      });
      testAssert(winResB.status === 200, 'Assigning 1st Runner Up to Team B succeeds with HTTP 200');

      const logWinner = await HackathonAuditLog.findOne({ action: 'RESULT_WINNER_ASSIGNED', targetId: 'P7-TEAM-A' });
      testAssert(logWinner !== null, 'RESULT_WINNER_ASSIGNED logged to HackathonAuditLog');
    }

    console.log('\n--- 8. Testing Official Result Approval Workflow ---');
    {
      const res = await fetch(`${BASE_URL}/admin/results/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: testHackathonId }),
      });
      const data = await res.json();
      testAssert(res.status === 200, 'Admin approves results successfully with HTTP 200');
      testAssert(data.approvedCount >= 3, 'Approval applies to results');

      const resA = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-A' });
      testAssert(resA.resultStatus === 'APPROVED', 'Result status is now APPROVED');
      testAssert(resA.approvedBy !== null, 'approvedBy is recorded');
      testAssert(resA.rankingSnapshot !== null, 'rankingSnapshot is frozen');
      testAssert(resA.rankingSnapshot.rank === 1, 'rankingSnapshot captures rank 1');

      const appLog = await HackathonAuditLog.findOne({ action: 'RESULT_APPROVED', targetId: testHackathonId });
      testAssert(appLog !== null, 'RESULT_APPROVED logged to HackathonAuditLog');
    }

    console.log('\n--- 9. Testing Isolation: Participant & Public Visibility Before Publication ---');
    {
      // 9.1 Participant checks result before publication
      const pRes = await fetch(`${BASE_URL}/results/my-result`, {
        headers: { Authorization: `Bearer ${participantToken}` },
      });
      const pData = await pRes.json();
      testAssert(pRes.status === 200, 'Participant can query result endpoint with HTTP 200');
      testAssert(pData.isPublished === false, 'Participant sees isPublished = false');
      testAssert(pData.rank === undefined, 'Rank is hidden from participant before publication');
      testAssert(pData.finalScore === undefined, 'Score is hidden from participant before publication');

      // 9.2 Public page before publication
      const pubRes = await fetch(`${BASE_URL}/public/results?hackathonId=${testHackathonId}`);
      const pubData = await pubRes.json();
      testAssert(pubRes.status === 200, 'Public endpoint returns HTTP 200');
      testAssert(pubData.isPublished === false, 'Public endpoint returns isPublished = false');
      testAssert(pubData.winners.length === 0, 'No winners exposed publicly before publication');
    }

    console.log('\n--- 10. Testing Result Publication Workflow ---');
    {
      const res = await fetch(`${BASE_URL}/admin/results/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: testHackathonId, publish: true }),
      });
      testAssert(res.status === 200, 'Admin publishes results with HTTP 200');

      const setting = await HackathonSetting.findOne({ hackathonId: testHackathonId });
      testAssert(setting.isResultsPublished === true, 'HackathonSetting.isResultsPublished is true');

      const resA = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-A' });
      testAssert(resA.isPublished === true, 'Result item isPublished is true');
      testAssert(resA.resultStatus === 'PUBLISHED', 'Result status transitioned to PUBLISHED');

      const teamAUpdated = await HackathonTeam.findOne({ teamId: 'P7-TEAM-A' });
      testAssert(teamAUpdated.status === 'RESULT_PUBLISHED', 'Team status transitioned to RESULT_PUBLISHED');

      const pubLog = await HackathonAuditLog.findOne({ action: 'RESULT_PUBLISHED', targetId: testHackathonId });
      testAssert(pubLog !== null, 'RESULT_PUBLISHED recorded in HackathonAuditLog');
    }

    console.log('\n--- 11. Testing Participant & Public Results Visibility After Publication ---');
    {
      // 11.1 Participant sees their own result
      const pRes = await fetch(`${BASE_URL}/results/my-result`, {
        headers: { Authorization: `Bearer ${participantToken}` },
      });
      const pData = await pRes.json();
      testAssert(pRes.status === 200, 'Participant queries result with HTTP 200');
      testAssert(pData.isPublished === true, 'Participant sees isPublished = true');
      testAssert(pData.rank === 1, 'Participant sees their official Rank: 1');
      testAssert(pData.category === 'Winner (1st Place)', 'Participant sees Winner category');
      testAssert(pData.finalScore === 92.0, 'Participant sees final score');
      testAssert(pData.scoreSnapshot === undefined, 'Private judge criteria scores are NOT exposed to participant');

      // 11.2 Public endpoint sees published winners & rankings
      const pubRes = await fetch(`${BASE_URL}/public/results?hackathonId=${testHackathonId}`);
      const pubData = await pubRes.json();
      testAssert(pubRes.status === 200, 'Public endpoint returns HTTP 200');
      testAssert(pubData.isPublished === true, 'Public endpoint returns isPublished = true');
      testAssert(pubData.winners.length >= 2, 'Public endpoint returns winners list');
      testAssert(pubData.winners[0].teamName === 'Alpha Innovators', 'Public winner is Alpha Innovators');
      testAssert(pubData.winners[0].judgeName === undefined, 'Sanitization: Judge names stripped from public API');
      testAssert(pubData.winners[0].comments === undefined, 'Sanitization: Judge comments stripped from public API');
    }

    console.log('\n--- 12. Testing Result Locking & Modification Prevention ---');
    // 12.1 Lock without confirmation rejected
    {
      const res = await fetch(`${BASE_URL}/admin/results/lock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: testHackathonId, confirmLock: false }),
      });
      testAssert(res.status === 400, 'Locking without confirmLock: true rejected with HTTP 400');
    }

    // 12.2 Valid lock
    {
      const res = await fetch(`${BASE_URL}/admin/results/lock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: testHackathonId,
          confirmLock: true,
          reason: 'Official winners announced at ceremony. Permanent lock.',
        }),
      });
      testAssert(res.status === 200, 'Admin locks official results with HTTP 200');

      const setting = await HackathonSetting.findOne({ hackathonId: testHackathonId });
      testAssert(setting.resultsLocked === true, 'HackathonSetting.resultsLocked is true');

      const resA = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-A' });
      testAssert(resA.isLocked === true, 'Result item isLocked is true');
      testAssert(resA.resultStatus === 'LOCKED', 'Result status is LOCKED');

      const lockLog = await HackathonAuditLog.findOne({ action: 'RESULT_LOCKED', targetId: testHackathonId });
      testAssert(lockLog !== null, 'RESULT_LOCKED recorded in HackathonAuditLog');
    }

    // 12.3 Modifying locked winner rejected
    {
      const res = await fetch(`${BASE_URL}/admin/results/P7-TEAM-A/assign-winner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: testHackathonId, category: 'None' }),
      });
      testAssert(res.status === 400, 'Modifying winner on locked result rejected with HTTP 400');
    }

    // 12.4 Recalculating locked results rejected
    {
      const res = await fetch(`${BASE_URL}/admin/results/calculate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: testHackathonId }),
      });
      testAssert(res.status === 400, 'Recalculating locked results rejected with HTTP 400');
    }

    console.log('\n--- 13. Testing Administrative Result Reopening Workflow ---');
    // 13.1 Reopening without reason rejected
    {
      const res = await fetch(`${BASE_URL}/admin/results/reopen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: testHackathonId, reason: '' }),
      });
      testAssert(res.status === 400, 'Reopening without reason rejected with HTTP 400');
    }

    // 13.2 Valid reopening with reason
    {
      const res = await fetch(`${BASE_URL}/admin/results/reopen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: testHackathonId,
          reason: 'Organizers approved additional special category sponsor award.',
        }),
      });
      testAssert(res.status === 200, 'Admin unlocks results with HTTP 200');

      const setting = await HackathonSetting.findOne({ hackathonId: testHackathonId });
      testAssert(setting.resultsLocked === false, 'HackathonSetting.resultsLocked reset to false');

      const resA = await HackathonResult.findOne({ hackathonId: testHackathonId, teamId: 'P7-TEAM-A' });
      testAssert(resA.isLocked === false, 'Result item isLocked reset to false');
      testAssert(resA.reopenReason.includes('special category sponsor award'), 'reopenReason recorded');

      const reopenLog = await HackathonAuditLog.findOne({ action: 'RESULT_REOPENED', targetId: testHackathonId });
      testAssert(reopenLog !== null, 'RESULT_REOPENED recorded in HackathonAuditLog');
    }

    console.log('\n--- 14. Testing Admin Score Drill-Down (Read-Only) ---');
    {
      const res = await fetch(`${BASE_URL}/admin/results/P7-TEAM-A?hackathonId=${testHackathonId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      testAssert(res.status === 200, 'Admin can fetch score drill-down with HTTP 200');
      testAssert(data.result.teamId === 'P7-TEAM-A', 'Team ID matches');
      testAssert(data.result.scoreSnapshot.length === 2, 'Drill-down contains 2 judge evaluations');
      testAssert(data.result.scoreSnapshot[0].totalScore !== undefined, 'Drill-down provides judge total score');
    }

    console.log('\n--- 15. Testing Audit Log Coverage Across All Phase 7 Actions ---');
    {
      const actions = [
        'RESULTS_CALCULATED',
        'RESULT_TIE_RESOLVED',
        'RESULT_WINNER_ASSIGNED',
        'RESULT_APPROVED',
        'RESULT_PUBLISHED',
        'RESULT_LOCKED',
        'RESULT_REOPENED',
      ];
      for (const act of actions) {
        const found = await HackathonAuditLog.findOne({ action: act, targetEntity: 'HackathonResult' });
        testAssert(found !== null, `Audit log contains ${act}`);
      }
    }

    console.log('\n================================================================');
    console.log(`ALL PHASE 7 TESTS COMPLETED: ${passedAssertions} PASSED, ${failedAssertions} FAILED`);
    console.log('================================================================\n');

    if (failedAssertions > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Phase 7 Test Suite Execution Error:', error);
    process.exit(1);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    process.exit(0);
  }
}

runPhase7Tests();
