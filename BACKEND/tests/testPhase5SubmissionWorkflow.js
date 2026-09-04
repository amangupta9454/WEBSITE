const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');
const User = require('../models/User');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonSubmission = require('../models/HackathonSubmission');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const HackathonSetting = require('../models/HackathonSetting');
const Settings = require('../models/Settings');
const hackathonRoutes = require('../routes/hackathon');

async function runPhase5SubmissionTests() {
  console.log('================================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 5 FINAL PROJECT SUBMISSION TEST SUITE');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  const app = express();
  app.use(express.json());
  app.use('/api/hackathon', hackathonRoutes);

  const PORT = 5098;
  const server = app.listen(PORT, async () => {
    try {
      // ─── 0. SETUP TEST ACCOUNTS & TOKENS ───
      let admin = await Admin.findOne();
      if (!admin) {
        admin = await Admin.create({
          username: 'admin_p5',
          password: 'password123',
          email: 'admin.p5@code-a-nova.online',
        });
      }
      const adminToken = jwt.sign(
        { id: admin._id, username: admin.username, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET || 'secret'
      );

      // Team A: Confirmed Team
      let leaderA = await User.findOne({ email: 'p5.leadera@codeanova.online' });
      if (!leaderA) {
        leaderA = await User.create({
          name: 'Leader P5 Team A',
          email: 'p5.leadera@codeanova.online',
          password: 'password123',
          mobile: '9876543220',
        });
      }
      const leaderTokenA = jwt.sign(
        { id: leaderA._id, name: leaderA.name, email: leaderA.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );

      let memberA = await User.findOne({ email: 'p5.membera@codeanova.online' });
      if (!memberA) {
        memberA = await User.create({
          name: 'Member P5 Team A',
          email: 'p5.membera@codeanova.online',
          password: 'password123',
          mobile: '9876543221',
        });
      }
      const memberTokenA = jwt.sign(
        { id: memberA._id, name: memberA.name, email: memberA.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );

      // Team B: Separate Confirmed Team (Cross-team test)
      let leaderB = await User.findOne({ email: 'p5.leaderb@codeanova.online' });
      if (!leaderB) {
        leaderB = await User.create({
          name: 'Leader P5 Team B',
          email: 'p5.leaderb@codeanova.online',
          password: 'password123',
          mobile: '9876543222',
        });
      }
      const leaderTokenB = jwt.sign(
        { id: leaderB._id, name: leaderB.name, email: leaderB.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );

      // Clean up previous test records
      await HackathonSubmission.deleteMany({ teamId: { $in: ['P5-TEAM-A', 'P5-TEAM-B', 'P5-TEAM-UNCONFIRMED', 'P5-TEAM-DELETED'] } });
      await HackathonTeam.deleteMany({ teamId: { $in: ['P5-TEAM-A', 'P5-TEAM-B', 'P5-TEAM-UNCONFIRMED', 'P5-TEAM-DELETED'] } });

      // Create Team A (CONFIRMED)
      const teamA = await HackathonTeam.create({
        teamId: 'P5-TEAM-A',
        teamName: 'Nova Innovators Alpha',
        track: 'AI & Machine Learning',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        confirmedAt: new Date(),
        leader: {
          name: leaderA.name,
          email: leaderA.email,
          mobile: leaderA.mobile,
          userId: leaderA._id,
        },
        members: [
          {
            name: memberA.name,
            email: memberA.email,
            mobile: memberA.mobile,
            userId: memberA._id,
          },
        ],
        initialIdea: {
          title: 'Unstop Autonomous Code Agent',
          description: 'Original Unstop idea registered on portal',
          pptUrl: 'https://unstop.com/submissions/team-a-deck.pdf',
          techStack: ['Python', 'LangChain'],
        },
      });

      // Create Team B (CONFIRMED)
      const teamB = await HackathonTeam.create({
        teamId: 'P5-TEAM-B',
        teamName: 'Nova Innovators Beta',
        track: 'Web3 & Decentralized Tech',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        confirmedAt: new Date(),
        leader: {
          name: leaderB.name,
          email: leaderB.email,
          userId: leaderB._id,
        },
        initialIdea: {
          title: 'DeFi Autonomous Yield Optimizer',
          pptUrl: 'https://unstop.com/submissions/team-b-deck.pdf',
        },
      });

      // Create Unconfirmed Team (SHORTLISTED, fee unpaid)
      let leaderUnconfirmed = await User.findOne({ email: 'p5.unconfirmed@codeanova.online' });
      if (!leaderUnconfirmed) {
        leaderUnconfirmed = await User.create({
          name: 'Leader Unconfirmed',
          email: 'p5.unconfirmed@codeanova.online',
          password: 'password123',
          mobile: '9876543223',
        });
      }
      const unconfirmedToken = jwt.sign(
        { id: leaderUnconfirmed._id, name: leaderUnconfirmed.name, email: leaderUnconfirmed.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );

      const teamUnconfirmed = await HackathonTeam.create({
        teamId: 'P5-TEAM-UNCONFIRMED',
        teamName: 'Unconfirmed Team',
        status: 'SHORTLISTED',
        paymentStatus: 'PENDING',
        leader: {
          name: leaderUnconfirmed.name,
          email: leaderUnconfirmed.email,
          userId: leaderUnconfirmed._id,
        },
      });

      // Ensure settings has open submission & future deadline
      const settings = await HackathonSetting.getOrCreateSettings();
      settings.isSubmissionOpen = true;
      settings.submissionDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days in future
      await settings.save();

      let passedCount = 0;
      let totalCount = 0;

      function assert(condition, message) {
        totalCount++;
        if (condition) {
          console.log(`  ✅ [PASS] ${message}`);
          passedCount++;
        } else {
          console.error(`  ❌ [FAIL] ${message}`);
          throw new Error(`Assertion Failed: ${message}`);
        }
      }

      // ─── TEST 1: UNAUTHENTICATED ACCESS REJECTION ───
      console.log('\n--- 1. Testing Unauthenticated Access Rejection ---');
      const res1 = await fetch(`http://localhost:${PORT}/api/hackathon/submission/my-submission`);
      assert(res1.status === 401, 'Unauthenticated request to /my-submission is rejected with HTTP 401');

      // ─── TEST 2: ELIGIBILITY: UNCONFIRMED TEAM CANNOT SUBMIT ───
      console.log('\n--- 2. Testing Eligibility: Unconfirmed Team Rejection ---');
      const res2 = await fetch(`http://localhost:${PORT}/api/hackathon/submission/my-submission`, {
        headers: { Authorization: `Bearer ${unconfirmedToken}` },
      });
      const data2 = await res2.json();
      assert(res2.status === 403, 'Non-confirmed team is rejected with HTTP 403');
      assert(data2.isEligible === false, 'Non-confirmed team response indicates isEligible = false');

      // Attempt to save draft as unconfirmed team
      const res2Draft = await fetch(`http://localhost:${PORT}/api/hackathon/submission/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unconfirmedToken}`,
        },
        body: JSON.stringify({ projectName: 'Hacked Submission' }),
      });
      assert(res2Draft.status === 403, 'Draft saving by unconfirmed team is blocked with HTTP 403');

      // ─── TEST 3: ROLE: MEMBER CAN VIEW BUT CANNOT SAVE DRAFT OR FINAL SUBMIT ───
      console.log('\n--- 3. Testing Role Authorization: Member vs Leader ---');
      // Member can view
      const res3View = await fetch(`http://localhost:${PORT}/api/hackathon/submission/my-submission`, {
        headers: { Authorization: `Bearer ${memberTokenA}` },
      });
      const data3View = await res3View.json();
      assert(res3View.status === 200, 'Team member can view submission details with HTTP 200');
      assert(data3View.isLeader === false, 'Team member correctly identified as isLeader = false');
      assert(data3View.submission.status === 'NOT_STARTED', 'Initial submission status is NOT_STARTED');

      // Member attempts to save draft
      const res3Draft = await fetch(`http://localhost:${PORT}/api/hackathon/submission/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberTokenA}`,
        },
        body: JSON.stringify({ projectName: 'Member Unauthorized Project' }),
      });
      assert(res3Draft.status === 403, 'Team member attempting to save draft is rejected with HTTP 403');

      // Member attempts final submit
      const res3Final = await fetch(`http://localhost:${PORT}/api/hackathon/submission/final-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberTokenA}`,
        },
        body: JSON.stringify({ projectName: 'Member Unauthorized Final' }),
      });
      assert(res3Final.status === 403, 'Team member attempting final submit is rejected with HTTP 403');

      // ─── TEST 4: DRAFT SAVE WORKFLOW ───
      console.log('\n--- 4. Testing Draft Save Workflow by Team Leader ---');
      const draftPayload = {
        projectName: 'Nova AI Code Copilot',
        projectDescription: 'Autonomous system for real-time repository refactoring and security linting.',
        problemStatement: 'Developers spend 40% of their day manually reviewing repetitive linting errors.',
        proposedSolution: 'AI-driven pipeline with AST analysis and auto-generated PR fixes.',
        techStack: ['Node.js', 'Express', 'React', 'MongoDB', 'OpenAI'],
        githubUrl: 'https://github.com/codeanova/nova-copilot-draft',
        hostedProjectUrl: 'https://nova-copilot.vercel.app',
        linkedInUrl: 'https://www.linkedin.com/posts/codeanova-copilot-preview',
        demoVideoUrl: 'https://youtu.be/dummy-copilot-demo',
        otherLinks: ['https://www.figma.com/file/copilot-design'],
        additionalNotes: 'Test account credentials: demo@codeanova.online / secret123',
      };

      const res4 = await fetch(`http://localhost:${PORT}/api/hackathon/submission/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderTokenA}`,
        },
        body: JSON.stringify(draftPayload),
      });
      const data4 = await res4.json();
      assert(res4.status === 200, 'Leader successfully saves draft with HTTP 200');
      assert(data4.submission.status === 'DRAFT', 'Submission status transitions to DRAFT');
      assert(data4.submission.isLocked === false, 'Draft submission is NOT locked');
      assert(data4.submission.draftSavedAt !== null, 'draftSavedAt timestamp is recorded');
      assert(data4.submission.projectName === 'Nova AI Code Copilot', 'Project name is saved correctly');

      // Verify original Unstop PPT is preserved untouched
      const teamACheck = await HackathonTeam.findOne({ teamId: 'P5-TEAM-A' });
      assert(
        teamACheck.initialIdea.pptUrl === 'https://unstop.com/submissions/team-a-deck.pdf',
        'Original Unstop PPT link remains preserved and untouched'
      );

      // ─── TEST 5: DANGEROUS URL SCHEME REJECTION ───
      console.log('\n--- 5. Testing URL Validation & Dangerous Scheme Rejection ---');
      const dangerousPayloads = [
        { githubUrl: 'javascript:alert(document.cookie)' },
        { hostedProjectUrl: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' },
        { demoVideoUrl: 'file:///etc/passwd' },
        { linkedInUrl: 'not_a_valid_url' },
      ];

      for (const badPayload of dangerousPayloads) {
        const res5 = await fetch(`http://localhost:${PORT}/api/hackathon/submission/save-draft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${leaderTokenA}`,
          },
          body: JSON.stringify(badPayload),
        });
        assert(res5.status === 400, `Dangerous or invalid URL rejected with HTTP 400 (${JSON.stringify(badPayload)})`);
      }

      // ─── TEST 6: DEADLINE ENFORCEMENT & CLOSED SUBMISSIONS ───
      console.log('\n--- 6. Testing Deadline & Submission Window Enforcement ---');
      // Case A: Submission Window Closed
      settings.isSubmissionOpen = false;
      await settings.save();

      const res6Closed = await fetch(`http://localhost:${PORT}/api/hackathon/submission/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderTokenA}`,
        },
        body: JSON.stringify({ projectName: 'Late Attempt' }),
      });
      assert(res6Closed.status === 400, 'Saving draft rejected when isSubmissionOpen = false (HTTP 400)');

      // Case B: Submission Deadline in Past
      settings.isSubmissionOpen = true;
      settings.submissionDeadline = new Date(Date.now() - 1000 * 60); // 1 minute in the past
      await settings.save();

      const res6Deadline = await fetch(`http://localhost:${PORT}/api/hackathon/submission/final-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderTokenA}`,
        },
        body: JSON.stringify(draftPayload),
      });
      assert(res6Deadline.status === 400, 'Final submission rejected when submissionDeadline has passed (HTTP 400)');

      // Re-open window & future deadline for final submission
      settings.isSubmissionOpen = true;
      settings.submissionDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      await settings.save();

      // ─── TEST 7: FINAL SUBMISSION VALIDATION & LOCKING ───
      console.log('\n--- 7. Testing Final Submission & Immutable Snapshot Locking ---');
      // Incomplete payload test
      const incompletePayload = { ...draftPayload, demoVideoUrl: '' };
      const res7Incomplete = await fetch(`http://localhost:${PORT}/api/hackathon/submission/final-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderTokenA}`,
        },
        body: JSON.stringify(incompletePayload),
      });
      assert(res7Incomplete.status === 400, 'Final submit with missing required field rejected with HTTP 400');

      // Complete valid final submit
      const res7Valid = await fetch(`http://localhost:${PORT}/api/hackathon/submission/final-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderTokenA}`,
        },
        body: JSON.stringify(draftPayload),
      });
      const data7Valid = await res7Valid.json();
      assert(res7Valid.status === 200, 'Valid final project submission succeeds with HTTP 200');
      assert(data7Valid.submission.status === 'SUBMITTED', 'Submission status marked as SUBMITTED');
      assert(data7Valid.submission.isLocked === true, 'Submission is permanently marked isLocked = true');
      assert(data7Valid.submission.submittedAt !== null, 'submittedAt timestamp is recorded');
      assert(data7Valid.submission.snapshot !== null, 'Immutable snapshot is created');
      assert(
        data7Valid.submission.snapshot.projectName === draftPayload.projectName,
        'Snapshot captures submitted project name'
      );
      assert(
        data7Valid.submission.snapshot.githubUrl === draftPayload.githubUrl,
        'Snapshot captures submitted GitHub URL'
      );

      // Verify HackathonTeam status is updated to SUBMITTED
      const teamAFinal = await HackathonTeam.findOne({ teamId: 'P5-TEAM-A' });
      assert(teamAFinal.status === 'SUBMITTED', 'Team status transitioned to SUBMITTED');
      assert(
        teamAFinal.submittedLinks.githubUrl === draftPayload.githubUrl,
        'Team submittedLinks.githubUrl updated for legacy views'
      );
      assert(
        teamAFinal.initialIdea.pptUrl === 'https://unstop.com/submissions/team-a-deck.pdf',
        'Original Unstop PPT remains preserved untouched after final submission'
      );

      // ─── TEST 8: LOCKED SUBMISSION MODIFICATION PREVENTION ───
      console.log('\n--- 8. Testing Locked Submission Modification Prevention ---');
      const res8Draft = await fetch(`http://localhost:${PORT}/api/hackathon/submission/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderTokenA}`,
        },
        body: JSON.stringify({ projectName: 'Modifying Locked Submission' }),
      });
      assert(res8Draft.status === 400, 'Draft modification of locked submission is rejected with HTTP 400');

      const res8Final = await fetch(`http://localhost:${PORT}/api/hackathon/submission/final-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderTokenA}`,
        },
        body: JSON.stringify(draftPayload),
      });
      assert(res8Final.status === 400, 'Re-submitting finalized locked submission is rejected with HTTP 400');

      // ─── TEST 9: CROSS-TEAM ISOLATION ───
      console.log('\n--- 9. Testing Cross-Team Isolation ---');
      // User B tries to save draft with Team A's teamId in payload
      const res9Spoof = await fetch(`http://localhost:${PORT}/api/hackathon/submission/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderTokenB}`,
        },
        body: JSON.stringify({
          teamId: 'P5-TEAM-A',
          projectName: 'Malicious Overwrite',
        }),
      });
      const data9Spoof = await res9Spoof.json();
      assert(
        data9Spoof.submission.teamId === 'P5-TEAM-B',
        'Backend derives team from JWT, preventing payload spoofing of Team A'
      );

      // ─── TEST 10: ADMIN SUBMISSION MANAGEMENT & UNLOCK ───
      console.log('\n--- 10. Testing Admin Submissions Listing, Detail & Unlock ---');
      // Admin list submissions
      const res10List = await fetch(`http://localhost:${PORT}/api/hackathon/admin/submissions?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data10List = await res10List.json();
      assert(res10List.status === 200, 'Admin can list submissions with HTTP 200');
      assert(Array.isArray(data10List.submissions), 'Submissions returned as array');
      const foundSubA = data10List.submissions.find((s) => s.teamId === 'P5-TEAM-A');
      assert(!!foundSubA, 'Team A submission found in admin list');

      // Admin view submission by Team ID
      const res10Detail = await fetch(`http://localhost:${PORT}/api/hackathon/admin/submissions/team/P5-TEAM-A`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data10Detail = await res10Detail.json();
      assert(res10Detail.status === 200, 'Admin can get submission detail by teamId with HTTP 200');
      assert(data10Detail.submission.isLocked === true, 'Admin detail shows submission is locked');
      assert(data10Detail.team.initialIdea.pptUrl !== '', 'Admin detail separates initial Unstop PPT');

      // Admin unlocks submission
      const res10Unlock = await fetch(
        `http://localhost:${PORT}/api/hackathon/admin/submissions/${foundSubA._id}/unlock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ reason: 'Participant requested re-submission to update repository link' }),
        }
      );
      const data10Unlock = await res10Unlock.json();
      assert(res10Unlock.status === 200, 'Admin unlock submission succeeds with HTTP 200');
      assert(data10Unlock.submission.isLocked === false, 'Submission is now unlocked (isLocked = false)');
      assert(data10Unlock.submission.status === 'DRAFT', 'Submission status reset to DRAFT');

      // Verify team status reset to CONFIRMED
      const teamAUnlocked = await HackathonTeam.findOne({ teamId: 'P5-TEAM-A' });
      assert(teamAUnlocked.status === 'CONFIRMED', 'Team status returned to CONFIRMED after unlock');

      // Now Leader A can edit draft again
      const res10ReDraft = await fetch(`http://localhost:${PORT}/api/hackathon/submission/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderTokenA}`,
        },
        body: JSON.stringify({ projectName: 'Nova AI Code Copilot v2' }),
      });
      assert(res10ReDraft.status === 200, 'Leader can save draft after admin unlocked submission');

      // ─── TEST 11: AUDIT LOG VERIFICATION ───
      console.log('\n--- 11. Testing Audit Log Verification ---');
      const auditLogs = await HackathonAuditLog.find({
        targetId: 'P5-TEAM-A',
        action: { $in: ['SUBMISSION_STARTED', 'SUBMISSION_DRAFT_SAVED', 'SUBMISSION_FINALIZED', 'SUBMISSION_LOCKED', 'SUBMISSION_UNLOCKED'] },
      });
      const actionsFound = auditLogs.map((l) => l.action);
      assert(actionsFound.includes('SUBMISSION_DRAFT_SAVED'), 'Audit log contains SUBMISSION_DRAFT_SAVED');
      assert(actionsFound.includes('SUBMISSION_FINALIZED'), 'Audit log contains SUBMISSION_FINALIZED');
      assert(actionsFound.includes('SUBMISSION_LOCKED'), 'Audit log contains SUBMISSION_LOCKED');
      assert(actionsFound.includes('SUBMISSION_UNLOCKED'), 'Audit log contains SUBMISSION_UNLOCKED');

      console.log(`\n================================================================`);
      console.log(`ALL PHASE 5 TESTS COMPLETED: ${passedCount}/${totalCount} PASSED`);
      console.log(`================================================================\n`);
    } catch (err) {
      console.error('\n❌ TEST RUNNER FAILED:', err);
      process.exitCode = 1;
    } finally {
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(process.exitCode || 0);
      });
    }
  });
}

runPhase5SubmissionTests();
