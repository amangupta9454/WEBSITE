const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');
const User = require('../models/User');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonSubmission = require('../models/HackathonSubmission');
const HackathonEditorialMember = require('../models/HackathonEditorialMember');
const HackathonEditorialAssignment = require('../models/HackathonEditorialAssignment');
const HackathonEditorialEvaluation = require('../models/HackathonEditorialEvaluation');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const HackathonSetting = require('../models/HackathonSetting');
const hackathonRoutes = require('../routes/hackathon');
const hackathonEmailService = require('../services/hackathonEmailService');

// Mock email service during test
hackathonEmailService.sendEditorialWelcomeEmail = async () => ({ success: true });
hackathonEmailService.sendShortlistConfirmationEmail = async () => ({ success: true });

async function runPhase6EditorialTests() {
  console.log('================================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 6 EDITORIAL & EVALUATION TEST SUITE');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  const app = express();
  app.use(express.json());
  app.use('/api/hackathon', hackathonRoutes);

  const PORT = 5099;
  const server = app.listen(PORT, async () => {
    let passedAssertions = 0;
    let failedAssertions = 0;

    function assert(condition, message) {
      if (condition) {
        passedAssertions++;
        console.log(`  ✅ [PASS] ${message}`);
      } else {
        failedAssertions++;
        console.error(`  ❌ [FAIL] ${message}`);
      }
    }

    try {
      const BASE_URL = `http://localhost:${PORT}/api/hackathon`;
      const testHackathonId = 'can-hackathon-2026';

      // ─── 0. SETUP TEST ACCOUNTS & TOKENS ───
      let admin = await Admin.findOne();
      if (!admin) {
        admin = await Admin.create({
          email: 'admin.p6@code-a-nova.online',
          password: await bcrypt.hash('password123', 10),
        });
      }
      const adminToken = jwt.sign(
        { id: admin._id, unifiedUserId: admin._id, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET || 'secret'
      );

      let participant = await User.findOne({ email: 'p6.leader@codeanova.online' });
      if (!participant) {
        participant = await User.create({
          name: 'Leader P6 Participant',
          email: 'p6.leader@codeanova.online',
          password: 'password123',
          mobile: '9876543230',
        });
      }
      const participantToken = jwt.sign(
        { id: participant._id, unifiedUserId: participant._id, name: participant.name, email: participant.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );

      // Clean up previous test artifacts
      await HackathonEditorialEvaluation.deleteMany({ hackathonId: testHackathonId });
      await HackathonEditorialAssignment.deleteMany({ hackathonId: testHackathonId });
      await HackathonEditorialMember.deleteMany({ hackathonId: testHackathonId });
      await HackathonSubmission.deleteMany({ teamId: { $in: ['P6-TEAM-A', 'P6-TEAM-UNCONF', 'P6-TEAM-B'] } });
      await HackathonTeam.deleteMany({ teamId: { $in: ['P6-TEAM-A', 'P6-TEAM-UNCONF', 'P6-TEAM-B'] } });
      await HackathonAuditLog.deleteMany({ targetId: { $in: ['P6-TEAM-A', 'P6-TEAM-UNCONF', 'P6-TEAM-B'] } });

      // Settings
      await HackathonSetting.deleteMany({});
      const settings = await HackathonSetting.create({
        hackathonId: testHackathonId,
        judgingCriteria: [
          { title: 'Innovation & Originality', maxScore: 25, description: 'Creativity' },
          { title: 'Technical Complexity', maxScore: 25, description: 'Architecture' },
          { title: 'Usability & Design', maxScore: 25, description: 'UI/UX' },
          { title: 'Impact & Viability', maxScore: 25, description: 'Market fit' },
        ],
      });

      // Create Confirmed Team with Submitted Final Project
      const teamA = await HackathonTeam.create({
        hackathonId: testHackathonId,
        teamId: 'P6-TEAM-A',
        teamName: 'Nova Innovators P6',
        track: 'AI & Machine Learning',
        status: 'SUBMITTED',
        paymentStatus: 'PAID',
        confirmedAt: new Date(),
        leader: {
          name: participant.name,
          email: participant.email,
          mobile: participant.mobile,
          userId: participant._id,
        },
        members: [
          { name: 'Member Two', email: 'm2@test.com', college: 'Tech University', state: 'Delhi' },
        ],
        initialIdea: {
          title: 'Autonomous Code Auditor',
          description: 'Original Unstop idea',
          problemStatement: 'Manual code reviews are slow',
          proposedSolution: 'Automated AST & LLM scanner',
          techStack: ['Python', 'FastAPI'],
          pptUrl: 'https://unstop.com/submissions/team-p6-deck.pdf',
        },
      });

      const submissionA = await HackathonSubmission.create({
        hackathonId: testHackathonId,
        team: teamA._id,
        teamId: teamA.teamId,
        submitterEmail: participant.email,
        submitterName: participant.name,
        projectName: 'CodeSentinel AI',
        projectDescription: 'Production AST security scanner',
        problemStatement: 'Security vulnerabilities in production code',
        proposedSolution: 'Real-time static code analysis',
        techStack: ['Python', 'FastAPI', 'React'],
        githubUrl: 'https://github.com/codenova/codesentinel',
        hostedProjectUrl: 'https://codesentinel.app',
        linkedInUrl: 'https://linkedin.com/in/leader-p6',
        demoVideoUrl: 'https://youtube.com/watch?v=codesentinel',
        otherLinks: ['https://docs.codesentinel.app'],
        status: 'SUBMITTED',
        isLocked: true,
        submittedAt: new Date(),
      });

      teamA.submissionId = submissionA._id;
      await teamA.save();

      console.log('--- 1. Testing Unauthenticated & Unauthorized API Access ---');
      // 1.1 Unauthenticated editorial endpoint
      {
        const res = await fetch(`${BASE_URL}/editorial/projects`);
        assert(res.status === 401, 'Unauthenticated request to /editorial/projects returns HTTP 401');
      }

      // 1.2 Participant token accessing editorial endpoint
      {
        const res = await fetch(`${BASE_URL}/editorial/projects`, {
          headers: { Authorization: `Bearer ${participantToken}` },
        });
        assert(res.status === 403, 'Participant token accessing /editorial/projects rejected with HTTP 403');
      }

      console.log('\n--- 2. Testing Admin Editorial Member Management ---');
      // 2.1 Password length validation
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-members`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Judge ShortPwd',
            email: 'short@code-a-nova.online',
            password: '123',
            confirmPassword: '123',
          }),
        });
        assert(res.status === 400, 'Password length < 6 rejected with HTTP 400');
      }

      // 2.2 Password mismatch validation
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-members`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Judge Mismatch',
            email: 'mismatch@code-a-nova.online',
            password: 'ValidPassword123!',
            confirmPassword: 'DifferentPassword123!',
          }),
        });
        assert(res.status === 400, 'Mismatched passwords rejected with HTTP 400');
      }

      // 2.3 Create Judge 1 successfully
      let judge1Id = null;
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-members`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Dr. Sarah Connor',
            email: 'judge1@code-a-nova.online',
            password: 'JudgeSecret123!',
            confirmPassword: 'JudgeSecret123!',
            isActive: true,
          }),
        });
        const data = await res.json();
        assert(res.status === 201, 'Admin creates Judge 1 with HTTP 201');
        assert(data.success === true, 'Response indicates success');
        assert(data.member.name === 'Dr. Sarah Connor', 'Member name preserved');
        assert(data.member.mustChangePassword === true, 'mustChangePassword is true on creation');
        assert(data.member.passwordHash === undefined, 'Password hash is NOT exposed in API response');
        judge1Id = data.member._id;

        const dbJudge1 = await HackathonEditorialMember.findById(judge1Id).select('+passwordHash');
        assert(dbJudge1.passwordHash !== 'JudgeSecret123!', 'Password stored as bcrypt hash, not plaintext');
      }

      // 2.4 Duplicate email creation rejected
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-members`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Duplicate Judge',
            email: 'judge1@code-a-nova.online',
            password: 'JudgeSecret123!',
            confirmPassword: 'JudgeSecret123!',
          }),
        });
        assert(res.status === 400, 'Duplicate editorial email rejected with HTTP 400');
      }

      // 2.5 Create Judge 2
      let judge2Id = null;
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-members`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Prof. Alan Turing',
            email: 'judge2@code-a-nova.online',
            password: 'JudgeSecret123!',
            confirmPassword: 'JudgeSecret123!',
            isActive: true,
          }),
        });
        const data = await res.json();
        assert(res.status === 201, 'Admin creates Judge 2 with HTTP 201');
        judge2Id = data.member._id;
      }

      // 2.6 Admin lists editorial members
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-members`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const data = await res.json();
        assert(res.status === 200, 'Admin can list editorial members with HTTP 200');
        assert(Array.isArray(data.members), 'Members returned as array');
        assert(data.members.length >= 2, 'List contains at least 2 judges');
      }

      console.log('\n--- 3. Testing Editorial Authentication & Token Integrity ---');
      // 3.1 Invalid credentials
      {
        const res = await fetch(`${BASE_URL}/editorial/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'judge1@code-a-nova.online', password: 'WrongPassword' }),
        });
        assert(res.status === 401, 'Invalid password rejected with HTTP 401');
      }

      // 3.2 Successful Judge 1 Login
      let judge1Token = null;
      {
        const res = await fetch(`${BASE_URL}/editorial/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'judge1@code-a-nova.online', password: 'JudgeSecret123!' }),
        });
        const data = await res.json();
        assert(res.status === 200, 'Judge 1 login succeeds with HTTP 200');
        assert(data.token !== undefined, 'JWT token returned in login response');
        assert(data.member.mustChangePassword === true, 'Member notified mustChangePassword = true');
        judge1Token = data.token;
      }

      // 3.3 Successful Judge 2 Login
      let judge2Token = null;
      {
        const res = await fetch(`${BASE_URL}/editorial/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'judge2@code-a-nova.online', password: 'JudgeSecret123!' }),
        });
        const data = await res.json();
        assert(res.status === 200, 'Judge 2 login succeeds with HTTP 200');
        judge2Token = data.token;
      }

      // 3.4 Editorial token attempting to access Admin endpoint blocked
      {
        const res = await fetch(`${BASE_URL}/admin/overview`, {
          headers: { Authorization: `Bearer ${judge1Token}` },
        });
        assert(res.status === 403, 'Editorial token accessing admin endpoint blocked with HTTP 403');
      }

      // 3.5 Deactivated Judge Account Blocked
      {
        // Admin deactivates Judge 2
        await fetch(`${BASE_URL}/admin/editorial-members/${judge2Id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: false }),
        });

        // Deactivated Judge 2 attempts login
        const resLogin = await fetch(`${BASE_URL}/editorial/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'judge2@code-a-nova.online', password: 'JudgeSecret123!' }),
        });
        assert(resLogin.status === 403, 'Deactivated judge login denied with HTTP 403');

        // Deactivated Judge 2 attempts API call with old token
        const resApi = await fetch(`${BASE_URL}/editorial/projects`, {
          headers: { Authorization: `Bearer ${judge2Token}` },
        });
        assert(resApi.status === 403, 'Deactivated judge token rejected on API calls with HTTP 403');

        // Admin reactivates Judge 2
        await fetch(`${BASE_URL}/admin/editorial-members/${judge2Id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true }),
        });
      }

      console.log('\n--- 4. Testing Project Assignment Workflow ---');
      // 4.1 Ineligible team assignment rejected (unsubmitted team)
      const unsubmittedTeam = await HackathonTeam.create({
        hackathonId: testHackathonId,
        teamId: 'P6-TEAM-UNCONF',
        teamName: 'Unsubmitted Team',
        leader: { name: 'Bob', email: 'bob@test.com' },
        status: 'CONFIRMED',
      });

      {
        const res = await fetch(`${BASE_URL}/admin/editorial-assignments`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: unsubmittedTeam.teamId, editorialMemberId: judge1Id }),
        });
        assert(res.status === 400, 'Assigning team without final submission rejected with HTTP 400');
      }

      // 4.2 Assign Team A to Judge 1
      let assignment1Id = null;
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-assignments`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: teamA.teamId, editorialMemberId: judge1Id, notes: 'Lead AI evaluation' }),
        });
        const data = await res.json();
        assert(res.status === 201, 'Eligible submitted team assigned to Judge 1 with HTTP 201');
        assert(data.assignment.status === 'ACTIVE', 'Assignment status is ACTIVE');
        assignment1Id = data.assignment._id;
      }

      // 4.3 Duplicate active assignment prevented
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-assignments`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: teamA.teamId, editorialMemberId: judge1Id }),
        });
        assert(res.status === 400, 'Duplicate active assignment rejected with HTTP 400');
      }

      // 4.4 Multiple Judges assigned to Team A (Assign Judge 2)
      let assignment2Id = null;
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-assignments`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: teamA.teamId, editorialMemberId: judge2Id, notes: 'Secondary reviewer' }),
        });
        const data = await res.json();
        assert(res.status === 201, 'Multiple judges can be assigned to the same team');
        assignment2Id = data.assignment._id;
      }

      // Verify team status transitioned to UNDER_EVALUATION
      const updatedTeam = await HackathonTeam.findById(teamA._id);
      assert(updatedTeam.status === 'UNDER_EVALUATION', 'Team status transitioned to UNDER_EVALUATION');

      console.log('\n--- 5. Testing Editorial Project Access & Data Sanitization ---');
      // 5.1 Judge 1 sees assigned project
      {
        const res = await fetch(`${BASE_URL}/editorial/projects`, {
          headers: { Authorization: `Bearer ${judge1Token}` },
        });
        const data = await res.json();
        assert(res.status === 200, 'Judge 1 lists assigned projects with HTTP 200');
        assert(data.projects.length === 1, 'Judge 1 has exactly 1 assigned project');
        assert(data.projects[0].teamId === teamA.teamId, 'Assigned project matches Team A');
      }

      // 5.2 Judge cannot access unassigned team
      const otherTeam = await HackathonTeam.create({
        hackathonId: testHackathonId,
        teamId: 'P6-TEAM-B',
        teamName: 'Web3 Innovators',
        track: 'Web3 & Decentralized Tech',
        leader: { name: 'Charlie', email: 'charlie@test.com' },
        status: 'SUBMITTED',
      });

      {
        const res = await fetch(`${BASE_URL}/editorial/projects/${otherTeam.teamId}`, {
          headers: { Authorization: `Bearer ${judge1Token}` },
        });
        assert(res.status === 403, 'Judge accessing unassigned team rejected with HTTP 403');
      }

      // 5.3 Judge accesses assigned Team A: Verify Data Sanitization (PRD Section 28)
      {
        const res = await fetch(`${BASE_URL}/editorial/projects/${teamA.teamId}`, {
          headers: { Authorization: `Bearer ${judge1Token}` },
        });
        const data = await res.json();
        assert(res.status === 200, 'Judge retrieves project detail with HTTP 200');
        assert(data.team.leader.mobile === undefined, 'Sanitization: Participant mobile stripped');
        assert(data.team.leader.email === undefined, 'Sanitization: Participant email stripped');
        assert(data.team.paymentDetails === undefined, 'Sanitization: ₹49 payment details stripped');
        assert(data.submission.githubUrl === 'https://github.com/codenova/codesentinel', 'GitHub URL accessible to judge');
        assert(data.team.initialIdea.pptUrl === 'https://unstop.com/submissions/team-p6-deck.pdf', 'Original Unstop PPT accessible');
      }

      console.log('\n--- 6. Testing Deliverable Click Audit Logging ---');
      {
        const res = await fetch(`${BASE_URL}/editorial/projects/${teamA.teamId}/audit-link-click`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${judge1Token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkType: 'PPT' }),
        });
        assert(res.status === 200, 'Audited deliverable link click with HTTP 200');

        const pptLog = await HackathonAuditLog.findOne({ action: 'EDITORIAL_PPT_VIEWED', targetId: teamA.teamId }).sort({ createdAt: -1 });
        assert(pptLog !== null, 'EDITORIAL_PPT_VIEWED written to audit log');
        assert(pptLog.role === 'editorial', 'Audit attribution role is editorial');
        assert(pptLog.actorId === String(judge1Id), 'Audit actorId is Judge 1');
      }

      console.log('\n--- 7. Testing Evaluation Draft Workflow ---');
      // 7.1 Save draft with partial scores
      {
        const partialScores = [
          { criterion: 'Innovation & Originality', score: 23, maxScore: 25 },
          { criterion: 'Technical Complexity', score: 22, maxScore: 25 },
        ];
        const res = await fetch(`${BASE_URL}/editorial/projects/${teamA.teamId}/evaluation/draft`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${judge1Token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: partialScores, comments: 'Preliminary draft inspection.' }),
        });
        const data = await res.json();
        assert(res.status === 200, 'Draft evaluation saved with HTTP 200');
        assert(data.evaluation.status === 'IN_PROGRESS', 'Evaluation status transitions to IN_PROGRESS');
        assert(data.evaluation.totalScore === 45, 'Server calculated draft total: 23 + 22 = 45');
        assert(data.evaluation.isLocked === false, 'Draft remains unlocked');
      }

      // 7.2 Score range validation (score > maxScore rejected)
      {
        const invalidScores = [{ criterion: 'Innovation & Originality', score: 30, maxScore: 25 }];
        const res = await fetch(`${BASE_URL}/editorial/projects/${teamA.teamId}/evaluation/draft`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${judge1Token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: invalidScores }),
        });
        assert(res.status === 400, 'Score exceeding maxScore rejected with HTTP 400');
      }

      console.log('\n--- 8. Testing Evaluation Finalization & Tamper-Proof Locking ---');
      // 8.1 Missing mandatory criteria on finalization rejected
      {
        const incompleteScores = [
          { criterion: 'Innovation & Originality', score: 23, maxScore: 25 },
          { criterion: 'Technical Complexity', score: 22, maxScore: 25 },
        ];
        const res = await fetch(`${BASE_URL}/editorial/projects/${teamA.teamId}/evaluation/finalize`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${judge1Token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: incompleteScores }),
        });
        assert(res.status === 400, 'Finalization with missing mandatory criteria rejected with HTTP 400');
      }

      // 8.2 Finalize evaluation with complete scores & client totalScore manipulation attempt
      let finalizedEval1Id = null;
      {
        const completeScores = [
          { criterion: 'Innovation & Originality', score: 24, maxScore: 25 },
          { criterion: 'Technical Complexity', score: 23, maxScore: 25 },
          { criterion: 'Usability & Design', score: 22, maxScore: 25 },
          { criterion: 'Impact & Viability', score: 21, maxScore: 25 },
        ];

        const res = await fetch(`${BASE_URL}/editorial/projects/${teamA.teamId}/evaluation/finalize`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${judge1Token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scores: completeScores,
            totalScore: 9999, // Attempted client-side spoof
            comments: 'Outstanding architecture and real-world viability.',
          }),
        });
        const data = await res.json();
        assert(res.status === 200, 'Judge 1 finalizes evaluation with HTTP 200');
        assert(data.evaluation.status === 'FINALIZED', 'Evaluation status is FINALIZED');
        assert(data.evaluation.isLocked === true, 'isLocked set to true');
        assert(data.evaluation.totalScore === 90, 'Server-side calculation enforced (24+23+22+21=90), spoofed 9999 discarded');
        assert(data.evaluation.finalizedAt !== null, 'finalizedAt timestamp recorded');
        finalizedEval1Id = data.evaluation._id;
      }

      // 8.3 Modification of finalized evaluation blocked
      {
        const res = await fetch(`${BASE_URL}/editorial/projects/${teamA.teamId}/evaluation/draft`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${judge1Token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ comments: 'Tamper attempt after locking' }),
        });
        assert(res.status === 400, 'Draft modification of locked evaluation blocked with HTTP 400');
      }

      // 8.4 Re-finalization blocked
      {
        const res = await fetch(`${BASE_URL}/editorial/projects/${teamA.teamId}/evaluation/finalize`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${judge1Token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: [{ criterion: 'Innovation', score: 10 }] }),
        });
        assert(res.status === 400, 'Re-finalization of locked evaluation blocked with HTTP 400');
      }

      console.log('\n--- 9. Testing Independent Multiple Judges Evaluation ---');
      // Judge 2 evaluates Team A with different scores
      {
        const judge2Scores = [
          { criterion: 'Innovation & Originality', score: 20, maxScore: 25 },
          { criterion: 'Technical Complexity', score: 21, maxScore: 25 },
          { criterion: 'Usability & Design', score: 19, maxScore: 25 },
          { criterion: 'Impact & Viability', score: 22, maxScore: 25 },
        ];

        const res = await fetch(`${BASE_URL}/editorial/projects/${teamA.teamId}/evaluation/finalize`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${judge2Token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: judge2Scores, comments: 'Solid technical implementation.' }),
        });
        const data = await res.json();
        assert(res.status === 200, 'Judge 2 finalizes evaluation independently with HTTP 200');
        assert(data.evaluation.totalScore === 82, 'Judge 2 server-calculated total: 20+21+19+22 = 82');
      }

      // Verify Judge 1 evaluation was not overwritten
      const checkEval1 = await HackathonEditorialEvaluation.findById(finalizedEval1Id);
      assert(checkEval1.totalScore === 90, 'Judge 1 evaluation remained untouched at 90 points');

      // Verify Team status transitioned to EVALUATED once all assigned judges finalized
      const fullyEvaluatedTeam = await HackathonTeam.findById(teamA._id);
      assert(fullyEvaluatedTeam.status === 'EVALUATED', 'Team status transitioned to EVALUATED');

      console.log('\n--- 10. Testing Admin Evaluation View & Score Aggregation ---');
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-evaluations?teamId=${teamA.teamId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const data = await res.json();
        assert(res.status === 200, 'Admin can query editorial evaluations with HTTP 200');
        assert(data.evaluations.length === 2, 'Admin sees evaluations from both judges');
        assert(data.aggregatedResults.length === 1, 'Aggregated result computed for Team A');

        const teamAgg = data.aggregatedResults[0];
        assert(teamAgg.finalizedCount === 2, 'finalizedCount is 2');
        assert(teamAgg.averageScore === 86.0, 'Average score calculated: (90 + 82) / 2 = 86.00');
      }

      console.log('\n--- 11. Testing Admin Evaluation Reopen Workflow ---');
      // 11.1 Admin reopens Judge 1 evaluation
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-evaluations/${finalizedEval1Id}/reopen`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Score tie-break re-examination requested by organizers.' }),
        });
        const data = await res.json();
        assert(res.status === 200, 'Admin reopens evaluation with HTTP 200');
        assert(data.evaluation.status === 'REOPENED', 'Status reset to REOPENED');
        assert(data.evaluation.isLocked === false, 'isLocked reset to false');

        const reopenLog = await HackathonAuditLog.findOne({ action: 'EDITORIAL_EVALUATION_REOPENED' });
        assert(reopenLog !== null, 'EDITORIAL_EVALUATION_REOPENED recorded in audit log');
      }

      // 11.2 Judge 1 can now modify and re-finalize reopened evaluation
      {
        const revisedScores = [
          { criterion: 'Innovation & Originality', score: 25, maxScore: 25 },
          { criterion: 'Technical Complexity', score: 24, maxScore: 25 },
          { criterion: 'Usability & Design', score: 23, maxScore: 25 },
          { criterion: 'Impact & Viability', score: 22, maxScore: 25 },
        ];

        const res = await fetch(`${BASE_URL}/editorial/projects/${teamA.teamId}/evaluation/finalize`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${judge1Token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: revisedScores, comments: 'Revised score after panel deliberation.' }),
        });
        const data = await res.json();
        assert(res.status === 200, 'Judge 1 can re-finalize reopened evaluation');
        assert(data.evaluation.totalScore === 94, 'Updated score is 94');
        assert(data.evaluation.isLocked === true, 'Evaluation locked again');
      }

      console.log('\n--- 12. Testing Self-Service Password Change & Admin Reset ---');
      // 12.1 Judge changes password self-service
      {
        const res = await fetch(`${BASE_URL}/editorial/password`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${judge1Token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: 'JudgeSecret123!',
            newPassword: 'BrandNewPassword@2026',
            confirmPassword: 'BrandNewPassword@2026',
          }),
        });
        assert(res.status === 200, 'Judge changes password self-service with HTTP 200');

        const updatedJudge = await HackathonEditorialMember.findById(judge1Id);
        assert(updatedJudge.mustChangePassword === false, 'mustChangePassword cleared to false');
      }

      // 12.2 Admin resets Judge 2 password
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-members/${judge2Id}/reset-password`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newPassword: 'AdminResetPwd@123',
            confirmPassword: 'AdminResetPwd@123',
          }),
        });
        assert(res.status === 200, 'Admin password reset succeeds with HTTP 200');

        const updatedJudge2 = await HackathonEditorialMember.findById(judge2Id);
        assert(updatedJudge2.mustChangePassword === true, 'mustChangePassword set to true on reset');
      }

      console.log('\n--- 13. Testing Assignment Removal / Soft-Unassign ---');
      {
        const res = await fetch(`${BASE_URL}/admin/editorial-assignments/${assignment2Id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(res.status === 200, 'Admin removes assignment with HTTP 200');

        const checkAssignment = await HackathonEditorialAssignment.findById(assignment2Id);
        assert(checkAssignment.status === 'UNASSIGNED', 'Assignment status is UNASSIGNED');
      }

      console.log('\n--- 14. Testing Audit Log Coverage ---');
      const auditActions = await HackathonAuditLog.find({
        action: { $regex: /^EDITORIAL_/ },
      }).distinct('action');

      assert(auditActions.includes('EDITORIAL_ACCOUNT_CREATED'), 'Audit log contains EDITORIAL_ACCOUNT_CREATED');
      assert(auditActions.includes('EDITORIAL_LOGIN'), 'Audit log contains EDITORIAL_LOGIN');
      assert(auditActions.includes('EDITORIAL_ASSIGNMENT_CREATED'), 'Audit log contains EDITORIAL_ASSIGNMENT_CREATED');
      assert(auditActions.includes('EDITORIAL_PROJECT_OPENED'), 'Audit log contains EDITORIAL_PROJECT_OPENED');
      assert(auditActions.includes('EDITORIAL_EVALUATION_DRAFT_SAVED'), 'Audit log contains EDITORIAL_EVALUATION_DRAFT_SAVED');
      assert(auditActions.includes('EDITORIAL_EVALUATION_FINALIZED'), 'Audit log contains EDITORIAL_EVALUATION_FINALIZED');
      assert(auditActions.includes('EDITORIAL_SCORE_SUBMITTED'), 'Audit log contains EDITORIAL_SCORE_SUBMITTED');
      assert(auditActions.includes('EDITORIAL_EVALUATION_REOPENED'), 'Audit log contains EDITORIAL_EVALUATION_REOPENED');
      assert(auditActions.includes('EDITORIAL_PASSWORD_RESET'), 'Audit log contains EDITORIAL_PASSWORD_RESET');
      assert(auditActions.includes('EDITORIAL_ASSIGNMENT_REMOVED'), 'Audit log contains EDITORIAL_ASSIGNMENT_REMOVED');

    } catch (err) {
      console.error('Test execution error:', err);
      failedAssertions++;
    } finally {
      server.close();
      await mongoose.disconnect();

      console.log('\n================================================================');
      console.log(`ALL PHASE 6 TESTS COMPLETED: ${passedAssertions} PASSED, ${failedAssertions} FAILED`);
      console.log('================================================================\n');

      if (failedAssertions > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    }
  });
}

runPhase6EditorialTests();
