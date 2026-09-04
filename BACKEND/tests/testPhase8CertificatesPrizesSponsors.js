/**
 * Comprehensive Phase 8 Automated Test Suite: Certificates, Prize Fulfillment & Sponsor Management
 * Verifies all 80+ security, eligibility, generation, verification, download, prize, sponsor, and audit requirements.
 */

const assert = require('assert');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();

const HackathonSetting = require('../models/HackathonSetting');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonSubmission = require('../models/HackathonSubmission');
const HackathonResult = require('../models/HackathonResult');
const HackathonCertificate = require('../models/HackathonCertificate');
const HackathonPrize = require('../models/HackathonPrize');
const HackathonSponsor = require('../models/HackathonSponsor');
const HackathonPrizeFulfillment = require('../models/HackathonPrizeFulfillment');
const HackathonEditorialMember = require('../models/HackathonEditorialMember');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const Admin = require('../models/Admin');
const User = require('../models/User');
const hackathonRoutes = require('../routes/hackathon');

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}/api/hackathon`;

async function runPhase8Tests() {
  console.log('================================================================');
  console.log('RUNNING COMPREHENSIVE PHASE 8 CERTIFICATES, PRIZES & SPONSORS SUITE');
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
      server = app.listen(PORT, resolve);
    });

    const HACKATHON_ID = `test-phase8-${Date.now()}`;
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';

    // 1. Setup Admin Account & Token
    await Admin.deleteMany({ email: 'admin.phase8@codeanova.online' });
    const passwordHash = await bcrypt.hash('AdminP8@Secure2026', 10);
    const admin = await Admin.create({
      username: 'admin_p8',
      name: 'Phase8 Super Admin',
      email: 'admin.phase8@codeanova.online',
      password: passwordHash,
      role: 'admin',
    });
    const adminToken = jwt.sign({ id: admin._id, email: admin.email, role: 'admin' }, jwtSecret, { expiresIn: '1h' });

    // 2. Setup Participant Users
    const leaderEmail = `leader.p8.${Date.now()}@codeanova.online`;
    const memberEmail = `member.p8.${Date.now()}@codeanova.online`;
    const strangerEmail = `stranger.p8.${Date.now()}@codeanova.online`;

    const pwHash = await bcrypt.hash('Test@12345', 10);
    const [leaderUser, memberUser, strangerUser] = await Promise.all([
      User.create({ name: 'Alex Winner', email: leaderEmail, mobile: '9998887771', password: pwHash, isVerified: true }),
      User.create({ name: 'Bob Teammate', email: memberEmail, mobile: '9998887772', password: pwHash, isVerified: true }),
      User.create({ name: 'Charlie Stranger', email: strangerEmail, mobile: '9998887773', password: pwHash, isVerified: true }),
    ]);

    const leaderToken = jwt.sign({ id: leaderUser._id, email: leaderUser.email }, jwtSecret, { expiresIn: '1h' });
    const memberToken = jwt.sign({ id: memberUser._id, email: memberUser.email }, jwtSecret, { expiresIn: '1h' });
    const strangerToken = jwt.sign({ id: strangerUser._id, email: strangerUser.email }, jwtSecret, { expiresIn: '1h' });

    // 3. Setup Editorial Token
    const edHash = await bcrypt.hash('Judge@12345', 10);
    const edMember = await HackathonEditorialMember.create({
      hackathonId: HACKATHON_ID,
      name: 'Judge Sarah',
      email: `judge.p8.${Date.now()}@codeanova.online`,
      passwordHash: edHash,
      role: 'editorial',
      isActive: true,
    });
    const editorialToken = jwt.sign({ id: edMember._id, email: edMember.email, role: 'editorial' }, jwtSecret, { expiresIn: '1h' });

    // 4. Setup Hackathon Setting
    await HackathonSetting.create({
      hackathonId: HACKATHON_ID,
      name: 'Code-A-Nova Test 2026',
      isResultsPublished: true,
      resultsPublishedAt: new Date(),
      resultsLocked: true,
      isActive: true,
    });

    // 5. Setup Test Teams & Results
    // Team 1: Winner (Rank 1)
    const team1 = await HackathonTeam.create({
      hackathonId: HACKATHON_ID,
      teamId: `CAN-T1-${Date.now().toString().slice(-4)}`,
      teamName: 'P8 Champions',
      track: 'AI & Machine Learning',
      status: 'RESULT_PUBLISHED',
      leader: { name: 'Alex Winner', email: leaderEmail, mobile: '9998887771', college: 'Tech University' },
      members: [{ name: 'Bob Teammate', email: memberEmail, college: 'Tech University' }],
      initialIdea: { title: 'Autonomous Drone Swarm' },
      submittedLinks: { projectName: 'Autonomous Drone Swarm' },
    });

    const result1 = await HackathonResult.create({
      hackathonId: HACKATHON_ID,
      team: team1._id,
      teamId: team1.teamId,
      rank: 1,
      finalScore: 95.0,
      averageScore: 95.0,
      judgeCount: 2,
      finalizedJudgeCount: 2,
      rankingStatus: 'READY',
      resultStatus: 'PUBLISHED',
      category: 'Winner (1st Place)',
      prize: '₹25,000 + Trophy',
      isWinner: true,
      isRunnerUp: false,
      isPublished: true,
      isLocked: true,
    });

    // Team 2: Confirmed Participant (Not a podium winner)
    const team2 = await HackathonTeam.create({
      hackathonId: HACKATHON_ID,
      teamId: `CAN-T2-${Date.now().toString().slice(-4)}`,
      teamName: 'P8 Hardworkers',
      track: 'Web3 & Fintech',
      status: 'RESULT_PUBLISHED',
      leader: { name: 'Dan Participant', email: `dan.p8.${Date.now()}@codeanova.online`, college: 'Apex College' },
      members: [],
      initialIdea: { title: 'Decentralized Micro-Lending' },
    });

    const result2 = await HackathonResult.create({
      hackathonId: HACKATHON_ID,
      team: team2._id,
      teamId: team2.teamId,
      rank: 8,
      finalScore: 78.0,
      averageScore: 78.0,
      judgeCount: 2,
      finalizedJudgeCount: 2,
      rankingStatus: 'READY',
      resultStatus: 'PUBLISHED',
      category: 'General Finalist',
      isWinner: false,
      isRunnerUp: false,
      isPublished: true,
      isLocked: true,
    });

    console.log('--- 1. Security & Role Authorization on Phase 8 Endpoints ---');
    try {
      await axios.get(`${BASE_URL}/admin/certificates`);
      testAssert(false, 'Unauthenticated request should return 401');
    } catch (err) {
      testAssert(err.response?.status === 401, 'Unauthenticated certificate request returns HTTP 401');
    }

    try {
      await axios.get(`${BASE_URL}/admin/certificates`, {
        headers: { Authorization: `Bearer ${leaderToken}` },
      });
      testAssert(false, 'Participant token should be rejected with 403');
    } catch (err) {
      testAssert(err.response?.status === 403, 'Participant token rejected on admin certificates with HTTP 403');
    }

    try {
      await axios.get(`${BASE_URL}/admin/certificates`, {
        headers: { Authorization: `Bearer ${editorialToken}` },
      });
      testAssert(false, 'Editorial token should be rejected with 403');
    } catch (err) {
      testAssert(err.response?.status === 403, 'Editorial token rejected on admin certificates with HTTP 403');
    }

    try {
      await axios.post(`${BASE_URL}/admin/prizes`, {}, { headers: { Authorization: `Bearer ${leaderToken}` } });
      testAssert(false, 'Participant token creating prize should return 403');
    } catch (err) {
      testAssert(err.response?.status === 403, 'Participant token creating prize blocked with HTTP 403');
    }

    try {
      await axios.post(`${BASE_URL}/admin/sponsors`, {}, { headers: { Authorization: `Bearer ${editorialToken}` } });
      testAssert(false, 'Editorial token creating sponsor should return 403');
    } catch (err) {
      testAssert(err.response?.status === 403, 'Editorial token creating sponsor blocked with HTTP 403');
    }

    console.log('\n--- 2. Sponsor Management (CRUD & Public Sanitization) ---');
    let sponsorId;
    try {
      const sponRes = await axios.post(
        `${BASE_URL}/admin/sponsors`,
        {
          hackathonId: HACKATHON_ID,
          name: 'Nexus Tech Global',
          logoUrl: 'https://nexus.example.com/logo.png',
          websiteUrl: 'https://nexus.example.com',
          description: 'Leading AI Infrastructure Sponsor',
          tier: 'PLATINUM',
          contactName: 'Executive Director',
          contactEmail: 'private.contact@nexus.com',
          contactPhone: '+1-555-9876',
          benefits: ['Keynote presentation', 'Judge seat', 'Logo on banners'],
          displayOrder: 1,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(sponRes.status === 201, 'Admin creates sponsor with HTTP 201');
      testAssert(sponRes.data.success, 'Sponsor creation response indicates success');
      sponsorId = sponRes.data.sponsor._id;
      testAssert(sponRes.data.sponsor.tier === 'PLATINUM', 'Sponsor tier assigned as PLATINUM');
      testAssert(sponRes.data.sponsor.name === 'Nexus Tech Global', 'Sponsor name correctly stored');
    } catch (err) {
      testAssert(false, `Sponsor creation failed: ${err.message}`);
    }

    // Dangerous URL scheme rejection
    try {
      await axios.post(
        `${BASE_URL}/admin/sponsors`,
        {
          hackathonId: HACKATHON_ID,
          name: 'Malicious Sponsor',
          websiteUrl: 'javascript:alert(1)',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(false, 'Dangerous javascript: URL scheme must be rejected');
    } catch (err) {
      testAssert(err.response?.status === 400, 'Dangerous sponsor URL rejected with HTTP 400');
    }

    // Update sponsor
    try {
      const updateRes = await axios.put(
        `${BASE_URL}/admin/sponsors/${sponsorId}`,
        { tier: 'TITLE', displayOrder: 0, description: 'Premier Title Sponsor of Code-A-Nova' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(updateRes.status === 200, 'Admin updates sponsor with HTTP 200');
      testAssert(updateRes.data.sponsor.tier === 'TITLE', 'Sponsor tier upgraded to TITLE');
      testAssert(updateRes.data.sponsor.displayOrder === 0, 'Sponsor displayOrder updated to 0');
    } catch (err) {
      testAssert(false, `Sponsor update failed: ${err.message}`);
    }

    // Admin lists sponsors with contact details
    try {
      const adminSponRes = await axios.get(`${BASE_URL}/admin/sponsors?hackathonId=${HACKATHON_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      testAssert(adminSponRes.status === 200, 'Admin lists sponsors with HTTP 200');
      const found = adminSponRes.data.sponsors.find((s) => s._id === String(sponsorId));
      testAssert(!!found, 'Created sponsor in admin list');
      testAssert(found.contactEmail === 'private.contact@nexus.com', 'Admin can view private sponsor contact email');
    } catch (err) {
      testAssert(false, `Admin sponsors list failed: ${err.message}`);
    }

    // Public sponsors endpoint (strictly sanitized)
    try {
      const pubSponRes = await axios.get(`${BASE_URL}/public/sponsors?hackathonId=${HACKATHON_ID}`);
      testAssert(pubSponRes.status === 200, 'Public sponsors endpoint returns HTTP 200');
      testAssert(Array.isArray(pubSponRes.data.sponsors), 'Sponsors returned as array');
      const pubSpon = pubSponRes.data.sponsors.find((s) => s.name === 'Nexus Tech Global');
      testAssert(!!pubSpon, 'Created sponsor visible in public listing');
      testAssert(pubSpon.contactEmail === undefined, 'Sanitization: contactEmail strictly excluded in public view');
      testAssert(pubSpon.contactPhone === undefined, 'Sanitization: contactPhone strictly excluded in public view');
      testAssert(pubSpon.contactName === undefined, 'Sanitization: contactName strictly excluded in public view');
    } catch (err) {
      testAssert(false, `Public sponsors check failed: ${err.message}`);
    }

    console.log('\n--- 3. Prize Configuration (CRUD & Locked Result Protection) ---');
    let prizeId;
    try {
      const prizeRes = await axios.post(
        `${BASE_URL}/admin/prizes`,
        {
          hackathonId: HACKATHON_ID,
          name: 'Champion Cash Prize',
          category: 'Winner (1st Place)',
          description: 'First place national award with cash & trophy',
          amount: 25000,
          currency: 'INR',
          sponsorId,
          fulfillmentMethod: 'BANK_TRANSFER',
          quantity: 1,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(prizeRes.status === 201, 'Admin creates prize with HTTP 201');
      prizeId = prizeRes.data.prize._id;
      testAssert(prizeRes.data.prize.amount === 25000, 'Prize amount correctly recorded as ₹25,000');
      testAssert(prizeRes.data.prize.sponsorNameSnapshot === 'Nexus Tech Global', 'Sponsor name snapshotted into prize');
    } catch (err) {
      testAssert(false, `Prize creation failed: ${err.message}`);
    }

    // Update Prize
    try {
      const prizeUpdateRes = await axios.put(
        `${BASE_URL}/admin/prizes/${prizeId}`,
        { description: 'Updated champion prize description', quantity: 2 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(prizeUpdateRes.status === 200, 'Admin updates prize with HTTP 200');
      testAssert(prizeUpdateRes.data.prize.description === 'Updated champion prize description', 'Prize description updated');
      testAssert(prizeUpdateRes.data.prize.quantity === 2, 'Prize quantity updated');
    } catch (err) {
      testAssert(false, `Prize update failed: ${err.message}`);
    }

    console.log('\n--- 4. Prize Fulfillment Workflow ---');
    let fulfillmentId;
    try {
      const fulfRes = await axios.post(
        `${BASE_URL}/admin/prize-fulfillments`,
        {
          hackathonId: HACKATHON_ID,
          teamId: team1.teamId,
          prizeId,
          notes: 'Team Leader bank account details pending verification',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(fulfRes.status === 201, 'Admin assigns prize to winning team with HTTP 201');
      testAssert(fulfRes.data.fulfillment.status === 'PENDING', 'Initial fulfillment status is PENDING');
      testAssert(fulfRes.data.fulfillment.amount === 25000, 'Fulfillment amount matches prize amount');
      fulfillmentId = fulfRes.data.fulfillment._id;
    } catch (err) {
      testAssert(false, `Prize fulfillment mapping failed: ${err.message}`);
    }

    // Duplicate prize mapping protection
    try {
      await axios.post(
        `${BASE_URL}/admin/prize-fulfillments`,
        { hackathonId: HACKATHON_ID, teamId: team1.teamId, prizeId },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(false, 'Duplicate prize mapping to same team must be rejected');
    } catch (err) {
      testAssert(err.response?.status === 400, 'Duplicate prize mapping rejected with HTTP 400');
    }

    // Delete prize blocked when fulfillment exists
    try {
      await axios.delete(`${BASE_URL}/admin/prizes/${prizeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      testAssert(false, 'Deleting prize with active fulfillment must be blocked');
    } catch (err) {
      testAssert(err.response?.status === 400, 'Deleting prize with active fulfillments rejected with HTTP 400');
    }

    // Update fulfillment to PROCESSING
    try {
      const updateFulfRes1 = await axios.put(
        `${BASE_URL}/admin/prize-fulfillments/${fulfillmentId}`,
        {
          status: 'PROCESSING',
          notes: 'Bank details verified with leader.',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(updateFulfRes1.status === 200, 'Admin transitions fulfillment to PROCESSING with HTTP 200');
      testAssert(updateFulfRes1.data.fulfillment.status === 'PROCESSING', 'Fulfillment status is PROCESSING');
    } catch (err) {
      testAssert(false, `Fulfillment PROCESSING update failed: ${err.message}`);
    }

    // Update fulfillment to FULFILLED
    try {
      const updateFulfRes2 = await axios.put(
        `${BASE_URL}/admin/prize-fulfillments/${fulfillmentId}`,
        {
          status: 'FULFILLED',
          transactionReference: 'NEFT-AXIS-20260904-891234',
          notes: 'Bank transfer completed successfully.',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(updateFulfRes2.status === 200, 'Admin marks fulfillment FULFILLED with HTTP 200');
      testAssert(updateFulfRes2.data.fulfillment.status === 'FULFILLED', 'Fulfillment status is FULFILLED');
      testAssert(!!updateFulfRes2.data.fulfillment.fulfilledAt, 'fulfilledAt timestamp recorded');
    } catch (err) {
      testAssert(false, `Fulfillment FULFILLED update failed: ${err.message}`);
    }

    // Notify winner endpoint
    try {
      const notifyRes = await axios.post(
        `${BASE_URL}/admin/prize-fulfillments/${fulfillmentId}/notify`,
        { customMessage: 'Funds transferred to registered account.' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(notifyRes.status === 200, 'Admin notifies winner on fulfillment with HTTP 200');
      testAssert(notifyRes.data.success, 'Notification dispatched successfully');
    } catch (err) {
      testAssert(false, `Winner notification failed: ${err.message}`);
    }

    // Participant Prize Visibility (Sanitized)
    try {
      const myPrizesRes = await axios.get(`${BASE_URL}/prizes/my-prizes`, {
        headers: { Authorization: `Bearer ${leaderToken}` },
      });
      testAssert(myPrizesRes.status === 200, 'Participant retrieves prizes with HTTP 200');
      testAssert(Array.isArray(myPrizesRes.data.prizes), 'Prizes returned as array');
      testAssert(myPrizesRes.data.prizes.length === 1, 'Participant sees exactly 1 assigned prize');
      const myPrize = myPrizesRes.data.prizes[0];
      testAssert(myPrize.amount === 25000, 'Participant sees correct prize amount');
      testAssert(myPrize.status === 'FULFILLED', 'Participant sees status FULFILLED');
      testAssert(myPrize.transactionReference === undefined, 'Sanitization: Internal UTR / transactionReference is hidden');
    } catch (err) {
      testAssert(false, `Participant prize query failed: ${err.message}`);
    }

    console.log('\n--- 5. Certificate Bulk Generation & Member Distribution ---');
    let genResult;
    try {
      const genRes = await axios.post(
        `${BASE_URL}/admin/certificates/generate-bulk`,
        { hackathonId: HACKATHON_ID },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(genRes.status === 200, 'Admin bulk-generates certificates with HTTP 200');
      testAssert(genRes.data.success, 'Bulk generation indicates success');
      genResult = genRes.data.data;
      // Team 1 has 2 members (Leader + Member), Team 2 has 1 member (Leader) -> Total 3 certificates
      testAssert(genResult.generatedCount === 3, `Generated exactly 3 certificates for all members (got ${genResult.generatedCount})`);
    } catch (err) {
      testAssert(false, `Bulk certificate generation failed: ${err.message}`);
    }

    // Idempotency: Re-running bulk generation should skip duplicates
    try {
      const reGenRes = await axios.post(
        `${BASE_URL}/admin/certificates/generate-bulk`,
        { hackathonId: HACKATHON_ID },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(reGenRes.status === 200, 'Re-run bulk generation succeeds with HTTP 200');
      testAssert(reGenRes.data.data.generatedCount === 0, 'Idempotency: Exactly 0 duplicates generated');
      testAssert(reGenRes.data.data.skippedCount >= 3, 'Idempotency: Previously generated certificates skipped');
    } catch (err) {
      testAssert(false, `Idempotent generation check failed: ${err.message}`);
    }

    console.log('\n--- 6. Certificate Verification Code & Deterministic Numbering ---');
    let leaderCert;
    let memberCert;
    try {
      const listRes = await axios.get(
        `${BASE_URL}/admin/certificates?hackathonId=${HACKATHON_ID}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(listRes.status === 200, 'Admin lists certificates with HTTP 200');
      testAssert(listRes.data.certificates.length === 3, 'Admin sees all 3 generated certificates');

      leaderCert = listRes.data.certificates.find((c) => c.recipientEmail === leaderEmail);
      memberCert = listRes.data.certificates.find((c) => c.recipientEmail === memberEmail);

      testAssert(!!leaderCert, 'Leader certificate created');
      testAssert(!!memberCert, 'Teammate certificate created independently');
      testAssert(leaderCert.type === 'WINNER', 'Leader certificate type is WINNER');
      testAssert(memberCert.type === 'WINNER', 'Teammate certificate type is WINNER');
      testAssert(leaderCert.award === 'Winner (1st Place)', 'Award reflects official winner category');
      testAssert(leaderCert.certificateNumber.startsWith('CAN-2026-'), 'Certificate number format conforms to CAN-2026-XXXXXX');
      testAssert(leaderCert.certificateNumber !== memberCert.certificateNumber, 'Each member receives a unique certificate number');
      testAssert(leaderCert.verificationCode.length === 32, 'Verification code is a 32-character cryptographic hex token');
    } catch (err) {
      testAssert(false, `Certificate inspection failed: ${err.message}`);
    }

    console.log('\n--- 7. Public Certificate Verification Endpoint (Zero Leakage) ---');
    try {
      const verifyRes = await axios.get(
        `${BASE_URL}/certificates/verify/${leaderCert.verificationCode}`
      );
      testAssert(verifyRes.status === 200, 'Public verification endpoint returns HTTP 200');
      testAssert(verifyRes.data.isValid === true, 'Verification returns isValid = true');
      testAssert(verifyRes.data.isRevoked === false, 'Verification returns isRevoked = false');
      testAssert(verifyRes.data.recipientName === 'Alex Winner', 'Recipient name correctly authenticated');
      testAssert(verifyRes.data.award === 'Winner (1st Place)', 'Award verified');
      testAssert(verifyRes.data.certificateNumber === leaderCert.certificateNumber, 'Certificate number matches');
      testAssert(verifyRes.data.recipientEmail === undefined, 'Sanitization: recipientEmail is NOT exposed');
      testAssert(verifyRes.data.contactPhone === undefined, 'Sanitization: phone is NOT exposed');
      testAssert(verifyRes.data.internalNotes === undefined, 'Sanitization: internal notes are NOT exposed');
    } catch (err) {
      testAssert(false, `Public verification failed: ${err.message}`);
    }

    // Invalid verification code check
    try {
      await axios.get(`${BASE_URL}/certificates/verify/INVALID_CODE_9999`);
      testAssert(false, 'Invalid verification code should return 404');
    } catch (err) {
      testAssert(err.response?.status === 404, 'Invalid verification code returns HTTP 404');
      testAssert(err.response?.data.isValid === false, 'Invalid verification code indicates isValid = false');
    }

    console.log('\n--- 8. Participant Certificate Access & Download Authorization ---');
    // Participant viewing own certificates
    try {
      const myCertsRes = await axios.get(`${BASE_URL}/certificates/my-certificates`, {
        headers: { Authorization: `Bearer ${leaderToken}` },
      });
      testAssert(myCertsRes.status === 200, 'Participant retrieves own certificates with HTTP 200');
      testAssert(myCertsRes.data.certificates.length === 1, 'Participant sees only their 1 certificate');
      testAssert(myCertsRes.data.certificates[0].recipientEmail === leaderEmail, 'Certificate belongs to authenticated user');
    } catch (err) {
      testAssert(false, `Participant certificates query failed: ${err.message}`);
    }

    // Authorized download
    try {
      const dlRes = await axios.get(
        `${BASE_URL}/certificates/${leaderCert.certificateNumber}/download`,
        { headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      testAssert(dlRes.status === 200, 'Authorized recipient downloads certificate with HTTP 200');
      testAssert(dlRes.data.certificate.certificateNumber === leaderCert.certificateNumber, 'Certificate payload returned');
      testAssert(typeof dlRes.data.certificate.htmlContent === 'string', 'HTML printable content returned in payload');
    } catch (err) {
      testAssert(false, `Authorized download failed: ${err.message}`);
    }

    // Direct HTML format query
    try {
      const dlHtmlRes = await axios.get(
        `${BASE_URL}/certificates/${leaderCert.certificateNumber}/download?format=html`,
        { headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      testAssert(dlHtmlRes.status === 200, 'Authorized recipient downloads raw HTML for print with HTTP 200');
      testAssert(dlHtmlRes.headers['content-type'].includes('text/html'), 'Content-Type is text/html');
      testAssert(dlHtmlRes.data.includes('Code-A-Nova National Hackathon'), 'HTML contains brand title');
    } catch (err) {
      testAssert(false, `Raw HTML download failed: ${err.message}`);
    }

    // Cross-user unauthorized download rejection
    try {
      await axios.get(
        `${BASE_URL}/certificates/${leaderCert.certificateNumber}/download`,
        { headers: { Authorization: `Bearer ${strangerToken}` } }
      );
      testAssert(false, 'Stranger downloading another user certificate must be rejected');
    } catch (err) {
      testAssert(err.response?.status === 403, 'Cross-user certificate download rejected with HTTP 403');
    }

    // Admin download authorization
    try {
      const adminDlRes = await axios.get(
        `${BASE_URL}/certificates/${leaderCert.certificateNumber}/download`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(adminDlRes.status === 200, 'Admin can download any certificate for fulfillment with HTTP 200');
    } catch (err) {
      testAssert(false, `Admin download failed: ${err.message}`);
    }

    console.log('\n--- 9. Certificate Revocation Workflow ---');
    try {
      // Revocation without reason rejected
      try {
        await axios.post(
          `${BASE_URL}/admin/certificates/${memberCert.certificateNumber}/revoke`,
          { reason: '' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        testAssert(false, 'Revocation without reason must be rejected');
      } catch (err) {
        testAssert(err.response?.status === 400, 'Revocation without mandatory reason rejected with HTTP 400');
      }

      // Valid revocation
      const revokeRes = await axios.post(
        `${BASE_URL}/admin/certificates/${memberCert.certificateNumber}/revoke`,
        { reason: 'Administrative re-issuance requested' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(revokeRes.status === 200, 'Admin revokes certificate with HTTP 200');
      testAssert(revokeRes.data.certificate.isRevoked === true, 'Certificate isRevoked set to true');
      testAssert(revokeRes.data.certificate.status === 'REVOKED', 'Certificate status updated to REVOKED');

      // Revoked certificate public verification
      const verifyRevokedRes = await axios.get(
        `${BASE_URL}/certificates/verify/${memberCert.verificationCode}`
      );
      testAssert(verifyRevokedRes.status === 200, 'Revoked certificate query returns HTTP 200');
      testAssert(verifyRevokedRes.data.isValid === false, 'Revoked certificate returns isValid = false');
      testAssert(verifyRevokedRes.data.isRevoked === true, 'Revoked certificate returns isRevoked = true');

      // Revoked certificate download blocked for participant
      try {
        await axios.get(
          `${BASE_URL}/certificates/${memberCert.certificateNumber}/download`,
          { headers: { Authorization: `Bearer ${memberToken}` } }
        );
        testAssert(false, 'Participant downloading revoked certificate must be blocked');
      } catch (err) {
        testAssert(err.response?.status === 403, 'Participant download of revoked certificate blocked with HTTP 403');
      }
    } catch (err) {
      testAssert(false, `Revocation workflow failed: ${err.message}`);
    }

    console.log('\n--- 10. Certificate Email Delivery & Tracking ---');
    try {
      const emailRes = await axios.post(
        `${BASE_URL}/admin/certificates/${leaderCert._id}/email`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      testAssert(emailRes.status === 200, 'Admin dispatches certificate email with HTTP 200');
      testAssert(emailRes.data.success, 'Email response indicates success');
      testAssert(emailRes.data.emailStatus.sent === true, 'emailStatus.sent marked true');

      // Attempting to email a revoked certificate should be blocked
      try {
        await axios.post(
          `${BASE_URL}/admin/certificates/${memberCert._id}/email`,
          {},
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        testAssert(false, 'Emailing revoked certificate must be rejected');
      } catch (err) {
        testAssert(err.response?.status === 400, 'Emailing revoked certificate rejected with HTTP 400');
      }
    } catch (err) {
      testAssert(false, `Email delivery failed: ${err.message}`);
    }

    console.log('\n--- 11. Complete Audit Log Coverage across Phase 8 Actions ---');
    try {
      const auditLogs = await HackathonAuditLog.find({
        $or: [
          { targetId: { $in: [HACKATHON_ID, leaderCert.certificateNumber, memberCert.certificateNumber] } },
          { action: { $in: ['CERTIFICATE_GENERATED', 'CERTIFICATE_EMAILED', 'CERTIFICATE_REVOKED', 'CERTIFICATE_DOWNLOADED', 'PRIZE_CREATED', 'PRIZE_UPDATED', 'PRIZE_FULFILLMENT_CREATED', 'PRIZE_FULFILLED', 'SPONSOR_CREATED', 'SPONSOR_UPDATED'] } },
        ],
      }).lean();

      const actions = new Set(auditLogs.map((l) => l.action));

      testAssert(actions.has('CERTIFICATE_GENERATED'), 'Audit log contains CERTIFICATE_GENERATED');
      testAssert(actions.has('CERTIFICATE_EMAILED'), 'Audit log contains CERTIFICATE_EMAILED');
      testAssert(actions.has('CERTIFICATE_REVOKED'), 'Audit log contains CERTIFICATE_REVOKED');
      testAssert(actions.has('CERTIFICATE_DOWNLOADED'), 'Audit log contains CERTIFICATE_DOWNLOADED');
      testAssert(actions.has('PRIZE_CREATED'), 'Audit log contains PRIZE_CREATED');
      testAssert(actions.has('PRIZE_UPDATED'), 'Audit log contains PRIZE_UPDATED');
      testAssert(actions.has('PRIZE_FULFILLMENT_CREATED'), 'Audit log contains PRIZE_FULFILLMENT_CREATED');
      testAssert(actions.has('PRIZE_FULFILLED'), 'Audit log contains PRIZE_FULFILLED');
      testAssert(actions.has('SPONSOR_CREATED'), 'Audit log contains SPONSOR_CREATED');
      testAssert(actions.has('SPONSOR_UPDATED'), 'Audit log contains SPONSOR_UPDATED');
    } catch (err) {
      testAssert(false, `Audit log verification failed: ${err.message}`);
    }

    console.log('\n================================================================');
    console.log(`ALL PHASE 8 TESTS COMPLETED: ${testPassed} PASSED, ${testFailed} FAILED`);
    console.log('================================================================');
  } catch (err) {
    console.error('Test Suite Fatal Error:', err);
    testFailed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  }

  if (testFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase8Tests();
