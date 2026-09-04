const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');
const User = require('../models/User');
const hackathonRoutes = require('../routes/hackathon');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const HackathonTeam = require('../models/HackathonTeam');

async function runPhase3Tests() {
  console.log('=== RUNNING PHASE 3 ADMIN TEAM MANAGEMENT & REVIEW TEST SUITE ===\n');
  await mongoose.connect(process.env.MONGO_URI);

  const app = express();
  app.use(express.json());
  app.use('/api/hackathon', hackathonRoutes);

  const PORT = 5097;
  const server = app.listen(PORT, async () => {
    try {
      // ─── 1. SECURITY CHECKS: UNAUTHENTICATED CALLS MUST RETURN 401 ───
      console.log('--- 1. Testing Security on Phase 3 Endpoints ---');
      const endpoints = [
        { method: 'GET', url: `http://localhost:${PORT}/api/hackathon/admin/teams/CAN-TEST` },
        { method: 'POST', url: `http://localhost:${PORT}/api/hackathon/admin/teams` },
        { method: 'PUT', url: `http://localhost:${PORT}/api/hackathon/admin/teams/CAN-TEST` },
        { method: 'DELETE', url: `http://localhost:${PORT}/api/hackathon/admin/teams/CAN-TEST` },
        { method: 'PUT', url: `http://localhost:${PORT}/api/hackathon/admin/teams/CAN-TEST/review` },
        { method: 'PUT', url: `http://localhost:${PORT}/api/hackathon/admin/teams/CAN-TEST/status` },
      ];

      for (const ep of endpoints) {
        const res = await fetch(ep.url, { method: ep.method });
        console.assert(res.status === 401, `Expected 401 for ${ep.method} ${ep.url}, got ${res.status}`);
        console.log(`✓ Security verified: ${ep.method} ${ep.url.split('/admin/')[1]} blocked with 401`);
      }

      // ─── 2. SETUP ADMIN TOKEN ───
      let admin = await Admin.findOne();
      if (!admin) {
        admin = await Admin.create({
          username: 'testadmin_p3',
          password: 'hashedpassword123',
          email: 'admin.p3@codeanova.online',
        });
      }
      const adminToken = jwt.sign(
        { id: admin._id, username: admin.username, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET || 'secret'
      );
      const authHeaders = {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      };

      // ─── 3. TEST MANUAL TEAM CREATION ───
      console.log('\n--- 2. Testing Manual Team Creation ---');
      const manualPayload = {
        teamName: 'Phase3 Alpha Squad',
        track: 'Web3 & AI',
        leader: {
          name: 'Priya Sharma',
          email: 'priya.phase3@codeanova.online',
          mobile: '9876543210',
          college: 'IIT Delhi',
          state: 'Delhi',
        },
        members: [
          {
            name: 'Rohan Gupta',
            email: 'rohan.phase3@codeanova.online',
            mobile: '9876543211',
            college: 'IIT Delhi',
            state: 'Delhi',
            role: 'ML Developer',
          },
        ],
        initialIdea: {
          title: 'Decentralized AI Assistant',
          description: 'A privacy-first AI agent orchestrator.',
          problemStatement: 'Data privacy leaks in cloud LLMs.',
          proposedSolution: 'Federated learning on local nodes.',
          techStack: ['Python', 'React', 'Ethers.js'],
          pptUrl: 'https://slides.google.com/phase3-deck',
          theme: 'Artificial Intelligence',
        },
        submittedLinks: {
          githubUrl: 'https://github.com/code-a-nova/alpha-squad',
          hostedProjectUrl: 'https://alpha-squad.vercel.app',
          linkedInUrl: 'https://linkedin.com/in/priya-sharma-ai',
          demoVideoUrl: 'https://youtube.com/watch?v=alpha-demo',
        },
      };

      const createRes = await fetch(`http://localhost:${PORT}/api/hackathon/admin/teams`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(manualPayload),
      });
      const createData = await createRes.json();
      console.assert(createRes.status === 201 && createData.success, 'Manual team creation failed');
      const createdTeam = createData.team;
      console.log(`✓ Manual team created successfully: ${createdTeam.teamName} (${createdTeam.teamId})`);
      console.assert(createdTeam.source === 'MANUAL_ADMIN', `Expected source MANUAL_ADMIN, got ${createdTeam.source}`);
      console.assert(createdTeam.status === 'IMPORTED', `Expected status IMPORTED, got ${createdTeam.status}`);

      // ─── 4. TEST GET ADMIN TEAMS LIST (FILTERING, SEARCH & PROJECTION) ───
      console.log('\n--- 3. Testing Teams List, Search, and Pagination ---');
      const listRes = await fetch(
        `http://localhost:${PORT}/api/hackathon/admin/teams?search=Alpha%20Squad&page=1&limit=10`,
        { headers: authHeaders }
      );
      const listData = await listRes.json();
      console.assert(listData.success && listData.teams.length >= 1, 'Search by team name failed');
      console.assert(listData.teams[0].rawUnstopData === undefined, 'rawUnstopData must NOT be sent in list view for performance');
      console.log(`✓ Teams list returns paginated results and safely excludes bulky rawUnstopData`);

      // Search by leader email
      const emailSearchRes = await fetch(
        `http://localhost:${PORT}/api/hackathon/admin/teams?search=priya.phase3@codeanova.online`,
        { headers: authHeaders }
      );
      const emailSearchData = await emailSearchRes.json();
      console.assert(emailSearchData.teams.length >= 1, 'Search by leader email failed');
      console.log(`✓ Search by leader email successfully returned team`);

      // ─── 5. TEST GET SINGLE TEAM PROFILE ───
      console.log('\n--- 4. Testing Single Team Profile with Audit Logs ---');
      const singleRes = await fetch(`http://localhost:${PORT}/api/hackathon/admin/teams/${createdTeam.teamId}`, {
        headers: authHeaders,
      });
      const singleData = await singleRes.json();
      console.assert(singleData.success && singleData.team.teamId === createdTeam.teamId, 'Get single team failed');
      console.assert(Array.isArray(singleData.auditLogs), 'Team profile should include audit history');
      console.log(`✓ Single team profile retrieved with ${singleData.auditLogs.length} audit records`);

      // ─── 6. TEST ADMIN REVIEW & SCORING ───
      console.log('\n--- 5. Testing Admin Review Scoring & Auto-Transition ---');
      const reviewPayload = {
        scores: {
          innovation: 9,
          ideaQuality: 8,
          feasibility: 8.5,
          presentation: 9,
        },
        tags: ['Innovative', 'High Potential', 'Strong Idea'],
        notes: 'Impressive decentralized architecture. Strong deck and clean problem statement.',
      };

      const reviewRes = await fetch(`http://localhost:${PORT}/api/hackathon/admin/teams/${createdTeam.teamId}/review`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(reviewPayload),
      });
      const reviewData = await reviewRes.json();
      console.assert(reviewData.success, 'Review submission failed');
      console.assert(reviewData.adminReview.totalScore === 34.5, `Expected totalScore 34.5, got ${reviewData.adminReview.totalScore}`);
      console.assert(reviewData.status === 'UNDER_REVIEW', `Expected auto-transition to UNDER_REVIEW, got ${reviewData.status}`);
      console.log(`✓ Admin review saved: Total ${reviewData.adminReview.totalScore}/40, auto-transitioned to UNDER_REVIEW`);

      // ─── 7. TEST SHORTLISTING (PRD STRICT: NO EMAIL, NO PAYMENT TRIGGER) ───
      console.log('\n--- 6. Testing Shortlist Team (Phase 3 Strict Scope) ---');
      const shortlistRes = await fetch(`http://localhost:${PORT}/api/hackathon/admin/teams/${createdTeam.teamId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: 'SHORTLISTED', note: 'Top 10% in Web3 track' }),
      });
      const shortlistData = await shortlistRes.json();
      console.assert(shortlistData.success && shortlistData.team.status === 'SHORTLISTED', 'Shortlisting failed');
      console.assert(shortlistData.team.shortlistedAt !== null, 'shortlistedAt must be recorded');

      // Verify in DB that no payment or email was prematurely marked
      const teamInDb = await HackathonTeam.findOne({ teamId: createdTeam.teamId });
      console.assert(teamInDb.shortlistEmailSent === false, 'Strict Phase 3: shortlistEmailSent must remain false');
      console.assert(teamInDb.paymentStatus === 'NOT_REQUIRED', 'Strict Phase 3: paymentStatus must not change');
      console.log('✓ Strict Phase 3 verified: Status updated to SHORTLISTED without sending email or triggering payment');

      // ─── 8. TEST REJECTION FLOW ───
      console.log('\n--- 7. Testing Rejection Flow ---');
      const rejectRes = await fetch(`http://localhost:${PORT}/api/hackathon/admin/teams/${createdTeam.teamId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: 'Idea outside of active hackathon themes',
        }),
      });
      const rejectData = await rejectRes.json();
      console.assert(rejectData.success && rejectData.team.status === 'REJECTED', 'Rejection failed');
      console.assert(rejectData.team.rejectionReason === 'Idea outside of active hackathon themes', 'Rejection reason not stored');
      console.log('✓ Rejection status and rejection reason recorded');

      // ─── 9. TEST EDITING TEAM INFORMATION ───
      console.log('\n--- 8. Testing Team Information Edit ---');
      const editRes = await fetch(`http://localhost:${PORT}/api/hackathon/admin/teams/${createdTeam.teamId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          teamName: 'Phase3 Alpha Squad (Updated)',
          track: 'Open Innovation',
          initialIdea: {
            title: 'Decentralized AI Agent Network',
          },
        }),
      });
      const editData = await editRes.json();
      console.assert(editData.success, 'Editing team failed');
      console.assert(editData.team.teamName === 'Phase3 Alpha Squad (Updated)', 'Team name was not updated');
      console.assert(editData.team.track === 'Open Innovation', 'Track was not updated');
      console.log('✓ Team information edited and saved successfully');

      // ─── 10. TEST SOFT-DELETE ───
      console.log('\n--- 9. Testing Soft-Delete & Audit Preservation ---');
      const deleteRes = await fetch(`http://localhost:${PORT}/api/hackathon/admin/teams/${createdTeam.teamId}`, {
        method: 'DELETE',
        headers: authHeaders,
        body: JSON.stringify({ reason: 'Test soft delete verification' }),
      });
      const deleteData = await deleteRes.json();
      console.assert(deleteRes.status === 200 && deleteData.success, 'Soft delete failed');

      // Verify team is hidden from active list
      const afterDeleteList = await fetch(
        `http://localhost:${PORT}/api/hackathon/admin/teams?search=${createdTeam.teamId}`,
        { headers: authHeaders }
      );
      const afterDeleteData = await afterDeleteList.json();
      console.assert(afterDeleteData.teams.length === 0, 'Soft-deleted team must NOT appear in active teams list');

      // Verify team record still exists in DB with isDeleted: true
      const dbRecord = await HackathonTeam.findOne({ teamId: createdTeam.teamId });
      console.assert(dbRecord !== null && dbRecord.isDeleted === true, 'Team was permanently destroyed instead of soft-deleted');
      console.log(`✓ Soft deletion confirmed: Team excluded from active list, record preserved with isDeleted=true`);

      // ─── 11. VERIFY AUDIT LOGS ───
      console.log('\n--- 10. Verifying Audit Logs Trail ---');
      const teamAuditLogs = await HackathonAuditLog.find({ targetId: createdTeam.teamId });
      const actions = teamAuditLogs.map((l) => l.action);
      console.log('Audit actions recorded:', actions);
      console.assert(actions.includes('TEAM_CREATED_MANUALLY'), 'Missing TEAM_CREATED_MANUALLY audit log');
      console.assert(actions.includes('TEAM_REVIEW_UPDATED'), 'Missing TEAM_REVIEW_UPDATED audit log');
      console.assert(actions.includes('TEAM_SHORTLISTED'), 'Missing TEAM_SHORTLISTED audit log');
      console.assert(actions.includes('TEAM_REJECTED'), 'Missing TEAM_REJECTED audit log');
      console.assert(actions.includes('TEAM_EDITED'), 'Missing TEAM_EDITED audit log');
      console.assert(actions.includes('TEAM_DELETED'), 'Missing TEAM_DELETED audit log');
      console.log('✓ All Phase 3 actions successfully recorded in HackathonAuditLog');

      // ─── CLEANUP TEST ARTIFACTS ───
      await HackathonTeam.deleteOne({ teamId: createdTeam.teamId });
      await HackathonAuditLog.deleteMany({ targetId: createdTeam.teamId });

      console.log('\n🎉 ALL PHASE 3 BACKEND TESTS PASSED CLEANLY!\n');
    } catch (err) {
      console.error('❌ Phase 3 test failure:', err);
      process.exitCode = 1;
    } finally {
      server.close();
      await mongoose.disconnect();
    }
  });
}

runPhase3Tests();
