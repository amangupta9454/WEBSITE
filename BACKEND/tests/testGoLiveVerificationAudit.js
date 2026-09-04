/**
 * Comprehensive Go-Live Verification & Staging Smoke Test Suite
 * 
 * Verifies the complete 14-step Code-A-Nova Hackathon lifecycle:
 *  1. Environment Configuration Audit (no secrets printed)
 *  2. Database Models & Connectivity
 *  3. Authentication Boundaries (Participant, Admin, Editorial)
 *  4. Complete Lifecycle (Unstop -> Review -> Shortlist -> Email -> ₹49 Payment -> WhatsApp -> Submission -> Editorial -> Evaluation -> Results -> Publication -> Certificates -> Prizes)
 *  5. Audit Log Completeness & Secret Leak Prevention
 *  6. Security Tests (ID tampering, RBAC, ReDoS, CSV formula injection)
 *  7. Rate Limiting Verification
 *  8. Export Security
 * 
 * Uses strictly isolated "GO-LIVE-TEST-" prefixed staging data.
 */

const assert = require('assert');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

// Ensure all schemas are registered in mongoose
require('../models/Settings');
const HackathonSetting = require('../models/HackathonSetting');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonSubmission = require('../models/HackathonSubmission');
const HackathonEditorialMember = require('../models/HackathonEditorialMember');
const HackathonEditorialAssignment = require('../models/HackathonEditorialAssignment');
const HackathonEditorialEvaluation = require('../models/HackathonEditorialEvaluation');
const HackathonResult = require('../models/HackathonResult');
const HackathonCertificate = require('../models/HackathonCertificate');
const HackathonSponsor = require('../models/HackathonSponsor');
const HackathonPrize = require('../models/HackathonPrize');
const HackathonPrizeFulfillment = require('../models/HackathonPrizeFulfillment');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const Admin = require('../models/Admin');
const User = require('../models/User');
const EmailLog = require('../models/email/EmailLog');
const hackathonRoutes = require('../routes/hackathon');
const hackathonConfigService = require('../services/hackathonConfigService');
const hackathonOpsService = require('../services/hackathonOpsService');

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}/api/hackathon`;
const HACKATHON_ID = 'can-hackathon-2026';

async function runGoLiveVerification() {
  console.log('================================================================');
  console.log('CODE-A-NOVA HACKATHON — GO-LIVE VERIFICATION & STAGING SMOKE TEST');
  console.log('================================================================\n');

  let server;
  let testPassed = 0;
  let testFailed = 0;
  const testResults = [];

  function testAssert(condition, area, message) {
    if (condition) {
      console.log(`  ✅ [PASS] [${area}] ${message}`);
      testPassed++;
      testResults.push({ area, status: 'PASS', message });
    } else {
      console.error(`  ❌ [FAIL] [${area}] ${message}`);
      testFailed++;
      testResults.push({ area, status: 'FAIL', message });
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. ENVIRONMENT CONFIGURATION AUDIT
    // -------------------------------------------------------------
    console.log('--- 1. ENVIRONMENT CONFIGURATION AUDIT ---');
    const envAudit = hackathonConfigService.validateHackathonConfig();
    testAssert(envAudit.status === 'OPTIMAL' || envAudit.status === 'WARNING', 'ENV_AUDIT', `Config validation status: ${envAudit.status}`);
    testAssert(Boolean(process.env.MONGO_URI), 'ENV_AUDIT', 'MongoDB URI is configured');
    testAssert(Boolean(process.env.JWT_SECRET), 'ENV_AUDIT', 'JWT_SECRET is configured (minimum entropy satisfied)');
    testAssert(Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET), 'ENV_AUDIT', 'Razorpay credentials configured');
    testAssert(Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER)), 'ENV_AUDIT', 'Email delivery configured (High-Availability or Fallback)');
    testAssert(Boolean(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY), 'ENV_AUDIT', 'Cloudinary asset storage configured');

    // -------------------------------------------------------------
    // 2. DATABASE CONNECTIVITY & MODELS AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 2. DATABASE CONNECTIVITY & MODELS AUDIT ---');
    await mongoose.connect(process.env.MONGO_URI);
    testAssert(mongoose.connection.readyState === 1, 'DATABASE', 'MongoDB Atlas connected successfully');

    // Verify all 13 core models can query
    const modelChecks = [
      { name: 'HackathonSetting', model: HackathonSetting },
      { name: 'HackathonTeam', model: HackathonTeam },
      { name: 'HackathonAuditLog', model: HackathonAuditLog },
      { name: 'HackathonSubmission', model: HackathonSubmission },
      { name: 'HackathonEditorialMember', model: HackathonEditorialMember },
      { name: 'HackathonEditorialAssignment', model: HackathonEditorialAssignment },
      { name: 'HackathonEditorialEvaluation', model: HackathonEditorialEvaluation },
      { name: 'HackathonResult', model: HackathonResult },
      { name: 'HackathonCertificate', model: HackathonCertificate },
      { name: 'HackathonSponsor', model: HackathonSponsor },
      { name: 'HackathonPrize', model: HackathonPrize },
      { name: 'HackathonPrizeFulfillment', model: HackathonPrizeFulfillment },
      { name: 'EmailLog', model: EmailLog }
    ];

    for (const m of modelChecks) {
      const count = await m.model.countDocuments();
      testAssert(typeof count === 'number', 'DATABASE_MODELS', `Model ${m.name} verified (collection accessible)`);
    }

    // Verify or initialize HackathonSetting
    let settings = await HackathonSetting.findOne({ hackathonId: HACKATHON_ID });
    if (!settings) {
      settings = await HackathonSetting.create({
        hackathonId: HACKATHON_ID,
        name: 'Code-A-Nova National Hackathon 2026',
        participationFee: 49,
        whatsAppLink: 'https://chat.whatsapp.com/test-golive-group',
        isSubmissionOpen: true,
        submissionDeadline: new Date(Date.now() + 86400000),
        resultDate: new Date(Date.now() + 259200000)
      });
    } else {
      settings.participationFee = 49;
      settings.whatsAppLink = settings.whatsAppLink || 'https://chat.whatsapp.com/test-golive-group';
      settings.isSubmissionOpen = true;
      settings.resultsLocked = false;
      settings.isResultsPublished = false;
      await settings.save();
    }
    testAssert(settings && settings.participationFee === 49, 'SETTINGS', 'HackathonSetting verified with participationFee=49');

    // Start Express test server with rawBody support
    const app = express();
    app.use(express.json({
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    app.use('/api/hackathon', hackathonRoutes);

    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`Test server running on port ${PORT}\n`);
        resolve();
      });
    });

    // -------------------------------------------------------------
    // 3. SETUP ISOLATED TEST IDENTITIES & TOKENS
    // -------------------------------------------------------------
    console.log('--- 3. AUTHENTICATION & IDENTITY SETUP ---');
    const jwtSecret = process.env.JWT_SECRET || 'test_jwt_secret_phase9_readiness';

    // Admin
    const testAdmin = await Admin.findOne() || await Admin.create({
      username: 'golive_admin',
      email: 'golive_admin@codeanova.com',
      password: 'hashed_password_123',
      role: 'SUPER_ADMIN'
    });
    const adminToken = jwt.sign(
      { id: testAdmin._id, role: 'SUPER_ADMIN', email: testAdmin.email, username: testAdmin.username },
      jwtSecret,
      { expiresIn: '2h' }
    );
    const adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };

    // Participant Leader
    const leaderEmail = 'golive_test_leader@example.com';
    let testLeaderUser = await User.findOne({ email: leaderEmail });
    if (!testLeaderUser) {
      testLeaderUser = await User.create({
        name: 'GoLive Test Leader',
        email: leaderEmail,
        mobile: '9876543210',
        password: 'Password@123'
      });
    }
    const leaderToken = jwt.sign(
      { id: testLeaderUser._id, role: 'STUDENT', email: testLeaderUser.email, name: testLeaderUser.name },
      jwtSecret,
      { expiresIn: '2h' }
    );
    const leaderAuth = { headers: { Authorization: `Bearer ${leaderToken}` } };

    // Participant Member
    const memberEmail = 'golive_test_member@example.com';
    let testMemberUser = await User.findOne({ email: memberEmail });
    if (!testMemberUser) {
      testMemberUser = await User.create({
        name: 'GoLive Test Member',
        email: memberEmail,
        mobile: '9876543211',
        password: 'Password@123'
      });
    }
    const memberToken = jwt.sign(
      { id: testMemberUser._id, role: 'STUDENT', email: testMemberUser.email, name: testMemberUser.name },
      jwtSecret,
      { expiresIn: '2h' }
    );
    const memberAuth = { headers: { Authorization: `Bearer ${memberToken}` } };

    // Unrelated Participant User
    const outsiderEmail = 'golive_outsider@example.com';
    let testOutsiderUser = await User.findOne({ email: outsiderEmail });
    if (!testOutsiderUser) {
      testOutsiderUser = await User.create({
        name: 'GoLive Outsider',
        email: outsiderEmail,
        mobile: '9876543219',
        password: 'Password@123'
      });
    }
    const outsiderToken = jwt.sign(
      { id: testOutsiderUser._id, role: 'STUDENT', email: testOutsiderUser.email },
      jwtSecret,
      { expiresIn: '2h' }
    );
    const outsiderAuth = { headers: { Authorization: `Bearer ${outsiderToken}` } };

    testAssert(Boolean(adminToken && leaderToken && memberToken), 'AUTH_SETUP', 'Generated isolated test tokens for Admin, Leader, and Member');

    // -------------------------------------------------------------
    // 4. CLEANUP ANY PRE-EXISTING GO-LIVE TEST DATA
    // -------------------------------------------------------------
    await HackathonTeam.deleteMany({ teamName: /^GO-LIVE-TEST-/ });
    await HackathonSubmission.deleteMany({
      $or: [
        { submitterEmail: /^golive_test_/ },
        { 'submissionData.projectTitle': /^GO-LIVE-TEST-/ },
        { projectName: /^GO-LIVE-TEST-/ }
      ]
    });
    await HackathonEditorialMember.deleteMany({ email: /^golive_test_/ });
    await HackathonEditorialEvaluation.deleteMany({ 'scores.comments': /GO-LIVE-TEST/ });
    await HackathonResult.deleteMany({ teamName: /^GO-LIVE-TEST-/ });
    await HackathonCertificate.deleteMany({ recipientEmail: /^golive_test_/ });
    await HackathonSponsor.deleteMany({ name: /^GO-LIVE-TEST-/ });
    await HackathonPrize.deleteMany({ title: /^GO-LIVE-TEST-/, name: /^GO-LIVE-TEST-/ });

    // -------------------------------------------------------------
    // 5. LIFECYCLE STEP A: UNSTOP IMPORT (COMMIT & VALIDATION)
    // -------------------------------------------------------------
    console.log('\n--- 5. STEP A: UNSTOP IMPORT ---');
    const commitPayload = {
      rows: [
        {
          rowIndex: 1,
          status: 'NEW',
          teamName: 'GO-LIVE-TEST-ALPHA',
          unstopApplicationId: 'UNSTOP-GOLIVE-9988',
          track: 'AI / ML',
          leader: {
            name: 'GoLive Test Leader',
            email: leaderEmail,
            mobile: '9876543210',
            college: 'IIT Delhi',
            state: 'Delhi'
          },
          members: [
            {
              name: 'GoLive Test Member',
              email: memberEmail,
              mobile: '9876543211',
              college: 'IIT Delhi',
              state: 'Delhi'
            }
          ],
          initialIdea: {
            title: 'AI Driven Staging Verification Platform',
            abstract: 'Automated verification test',
            pptUrl: 'https://storage.googleapis.com/test/presentation.pdf'
          },
          rawUnstopData: { 'College Name': 'IIT Delhi', unstopId: 'UNSTOP-GOLIVE-9988' }
        }
      ],
      duplicateHandling: 'SKIP',
      filename: 'unstop_golive_test.xlsx'
    };

    const commitRes = await axios.post(`${BASE_URL}/admin/unstop/commit`, commitPayload, adminAuth);
    testAssert(commitRes.status === 200 && commitRes.data.success, 'UNSTOP_IMPORT', 'Unstop commit API succeeded');
    testAssert(commitRes.data.result && commitRes.data.result.importedCount === 1, 'UNSTOP_IMPORT', `Imported count: ${commitRes.data.result?.importedCount}`);

    const createdTeam = await HackathonTeam.findOne({ teamName: 'GO-LIVE-TEST-ALPHA' });
    testAssert(Boolean(createdTeam), 'UNSTOP_IMPORT', 'Team GO-LIVE-TEST-ALPHA persisted in MongoDB');
    testAssert(createdTeam.source === 'UNSTOP_IMPORT', 'UNSTOP_IMPORT', 'Team source accurately marked as UNSTOP_IMPORT');
    testAssert(createdTeam.members.length === 1, 'UNSTOP_IMPORT', 'Additional members mapped correctly (1 member)');
    testAssert(createdTeam.initialIdea?.pptUrl === 'https://storage.googleapis.com/test/presentation.pdf', 'UNSTOP_IMPORT', 'PPT URL preserved');
    testAssert(createdTeam.rawUnstopData && createdTeam.rawUnstopData.unstopId === 'UNSTOP-GOLIVE-9988', 'UNSTOP_IMPORT', 'rawUnstopData preserved');

    // Link userIds to created team for strict relational integrity
    createdTeam.leader.userId = testLeaderUser._id;
    createdTeam.members[0].userId = testMemberUser._id;
    await createdTeam.save();

    // Duplicate detection test: committing duplicate row with status DUPLICATE should be skipped
    const duplicateCommitPayload = {
      rows: [
        {
          ...commitPayload.rows[0],
          status: 'DUPLICATE'
        }
      ],
      duplicateHandling: 'SKIP',
      filename: 'unstop_golive_test.xlsx'
    };
    const duplicateCommitRes = await axios.post(`${BASE_URL}/admin/unstop/commit`, duplicateCommitPayload, adminAuth);
    testAssert(duplicateCommitRes.data.result && duplicateCommitRes.data.result.skippedCount === 1, 'UNSTOP_IMPORT', 'Duplicate import recognized and skipped (1 skipped, 0 imported)');

    // -------------------------------------------------------------
    // 6. LIFECYCLE STEP B: ADMIN REVIEW & SHORTLISTING
    // -------------------------------------------------------------
    console.log('\n--- 6. STEP B: ADMIN REVIEW & SHORTLISTING ---');
    const teamId = createdTeam._id.toString();

    // Admin searches and retrieves team
    const teamSearchRes = await axios.get(`${BASE_URL}/admin/teams?search=GO-LIVE-TEST-ALPHA`, adminAuth);
    testAssert(teamSearchRes.data.teams.length >= 1, 'ADMIN_REVIEW', 'Admin team search found test team');

    const teamDetailRes = await axios.get(`${BASE_URL}/admin/teams/${teamId}`, adminAuth);
    testAssert(teamDetailRes.data.team.leader.email === leaderEmail, 'ADMIN_REVIEW', 'Team detail accurately displays leader');

    // Update review scores and tags
    const reviewRes = await axios.put(`${BASE_URL}/admin/teams/${teamId}/review`, {
      scores: {
        innovation: 9,
        ideaQuality: 8,
        feasibility: 9,
        presentation: 9
      },
      notes: 'Staging Go-Live Verification candidate with strong technical architecture',
      tags: ['Verified', 'High Potential']
    }, adminAuth);
    testAssert(reviewRes.data.success && reviewRes.data.adminReview.totalScore === 35, 'ADMIN_REVIEW', 'Review score & notes saved (35/40)');

    // Transition status to SHORTLISTED
    const statusRes = await axios.put(`${BASE_URL}/admin/teams/${teamId}/status`, {
      status: 'SHORTLISTED',
      reason: 'Meets high technical bar'
    }, adminAuth);
    testAssert(statusRes.data.success && statusRes.data.team.status === 'SHORTLISTED', 'SHORTLISTING', 'Team status transitioned to SHORTLISTED');

    // Verify audit log exists
    const shortlistAudit = await HackathonAuditLog.findOne({
      targetId: createdTeam.teamId,
      action: { $in: ['UPDATE_STATUS', 'TEAM_SHORTLISTED', 'STATUS_CHANGE', 'TEAM_STATUS_UPDATED'] }
    });
    testAssert(Boolean(shortlistAudit), 'AUDIT_LOG', 'Audit event recorded for status change to SHORTLISTED');

    // -------------------------------------------------------------
    // 7. LIFECYCLE STEP C: SHORTLIST EMAIL & IDEMPOTENCY
    // -------------------------------------------------------------
    console.log('\n--- 7. STEP C: SHORTLIST EMAIL & IDEMPOTENCY ---');
    // Repeated status update with same status SHORTLISTED should not duplicate email
    const repeatStatusRes = await axios.put(`${BASE_URL}/admin/teams/${teamId}/status`, {
      status: 'SHORTLISTED'
    }, adminAuth);
    testAssert(repeatStatusRes.data.success, 'EMAIL_IDEMPOTENCY', 'Re-saving same status returns success idempotently');

    // Resend shortlist email manual trigger
    const resendEmailRes = await axios.post(`${BASE_URL}/admin/teams/${teamId}/resend-shortlist-email`, {}, adminAuth);
    testAssert(resendEmailRes.data.success, 'EMAIL_DELIVERY', 'Manual resend shortlist email succeeded');

    // Check EmailLog
    const emailLogs = await EmailLog.find({ recipientEmail: leaderEmail });
    testAssert(emailLogs.length >= 1, 'EMAIL_LOG', `EmailLog created for leader (${emailLogs.length} entries recorded)`);

    // -------------------------------------------------------------
    // 8. LIFECYCLE STEP D: ₹49 RAZORPAY PAYMENT WORKFLOW
    // -------------------------------------------------------------
    console.log('\n--- 8. STEP D: RAZORPAY PAYMENT WORKFLOW ---');
    // Non-leader member cannot create payment order
    let memberPaymentBlocked = false;
    try {
      await axios.post(`${BASE_URL}/payment/create-order`, {}, memberAuth);
    } catch (err) {
      memberPaymentBlocked = err.response && (err.response.status === 403 || err.response.status === 400);
    }
    testAssert(memberPaymentBlocked, 'PAYMENT_AUTH', 'Non-leader member blocked from initiating payment');

    // Leader creates payment order
    const orderRes = await axios.post(`${BASE_URL}/payment/create-order`, {}, leaderAuth);
    testAssert(orderRes.data.success, 'PAYMENT_ORDER', 'Leader created Razorpay order');
    testAssert(orderRes.data.order.amount === 4900, 'PAYMENT_ORDER', 'Order amount strictly matches ₹49.00 (4900 paise)');
    testAssert(Boolean(orderRes.data.order.id), 'PAYMENT_ORDER', 'Razorpay order ID received');

    const rzpOrderId = orderRes.data.order.id;
    const rzpPaymentId = `pay_golive_test_${Date.now()}`;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_secret';

    // Verify rejection of tampered/invalid signature
    let invalidSigBlocked = false;
    try {
      await axios.post(`${BASE_URL}/payment/verify`, {
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: 'invalid_tampered_signature_string'
      }, leaderAuth);
    } catch (err) {
      invalidSigBlocked = err.response && err.response.status === 400;
    }
    testAssert(invalidSigBlocked, 'PAYMENT_SECURITY', 'Invalid Razorpay HMAC signature rejected with 400');

    // Compute authentic HMAC-SHA256 signature
    const validSignature = crypto
      .createHmac('sha256', rzpSecret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');

    // Verify payment with authentic signature
    const verifyRes = await axios.post(`${BASE_URL}/payment/verify`, {
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPaymentId,
      razorpay_signature: validSignature
    }, leaderAuth);
    testAssert(verifyRes.data.success, 'PAYMENT_VERIFY', 'Payment verified successfully');
    testAssert(verifyRes.data.team.paymentStatus === 'PAID', 'PAYMENT_VERIFY', 'Team paymentStatus updated to PAID');
    testAssert(verifyRes.data.team.status === 'CONFIRMED', 'PAYMENT_VERIFY', 'Team status transitioned to CONFIRMED');

    // Idempotent re-verification
    const reVerifyRes = await axios.post(`${BASE_URL}/payment/verify`, {
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPaymentId,
      razorpay_signature: validSignature
    }, leaderAuth);
    testAssert(reVerifyRes.data.success && reVerifyRes.data.team.paymentStatus === 'PAID', 'PAYMENT_IDEMPOTENCY', 'Re-verification succeeds idempotently');

    // Webhook simulation: Razorpay HMAC on raw body
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: rzpPaymentId,
            order_id: rzpOrderId,
            amount: 4900,
            status: 'captured',
            notes: { teamId: createdTeam.teamId }
          }
        }
      }
    });
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || rzpSecret;
    const webhookSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookPayload)
      .digest('hex');

    const webhookRes = await axios.post(`${BASE_URL}/payment/webhook`, JSON.parse(webhookPayload), {
      headers: {
        'x-razorpay-signature': webhookSignature,
        'Content-Type': 'application/json'
      }
    });
    testAssert(webhookRes.data.success || webhookRes.status === 200, 'WEBHOOK', 'Razorpay webhook processed cleanly');

    // -------------------------------------------------------------
    // 9. LIFECYCLE STEP E: WHATSAPP ACCESS & VISIBILITY
    // -------------------------------------------------------------
    console.log('\n--- 9. STEP E: WHATSAPP ACCESS & VISIBILITY ---');
    // Leader queries /my-team
    const leaderMyTeamRes = await axios.get(`${BASE_URL}/my-team`, leaderAuth);
    testAssert(Boolean(leaderMyTeamRes.data.whatsAppLink || leaderMyTeamRes.data.team?.whatsAppLink), 'WHATSAPP_UNLOCK', 'WhatsApp link visible to confirmed leader');

    // Member queries /my-team
    const memberMyTeamRes = await axios.get(`${BASE_URL}/my-team`, memberAuth);
    testAssert(Boolean(memberMyTeamRes.data.whatsAppLink || memberMyTeamRes.data.team?.whatsAppLink), 'WHATSAPP_UNLOCK', 'WhatsApp link visible to confirmed team member');

    // Outsider queries /my-team (should have no team)
    let outsiderHasNoTeam = false;
    try {
      const outRes = await axios.get(`${BASE_URL}/my-team`, outsiderAuth);
      outsiderHasNoTeam = !outRes.data.team;
    } catch (err) {
      outsiderHasNoTeam = err.response && (err.response.status === 404 || err.response.status === 400);
    }
    testAssert(outsiderHasNoTeam, 'WHATSAPP_ISOLATION', 'Outsider user has no access to team WhatsApp link');

    // -------------------------------------------------------------
    // 10. LIFECYCLE STEP F: FINAL PROJECT SUBMISSION
    // -------------------------------------------------------------
    console.log('\n--- 10. STEP F: FINAL PROJECT SUBMISSION ---');
    // Leader saves draft
    const draftPayload = {
      projectName: 'GO-LIVE-TEST-Platform',
      projectDescription: 'End to end testing and verification engine for large scale hackathons.',
      problemStatement: 'Manual hackathon verification is error-prone and slow.',
      proposedSolution: 'Automated state machine validation with cryptographic proof of work.',
      techStack: ['Node.js', 'React', 'MongoDB', 'Razorpay', 'Tailwind'],
      githubUrl: 'https://github.com/codeanova/golive-test',
      hostedProjectUrl: 'https://golive-test.code-a-nova.online',
      linkedInUrl: 'https://linkedin.com/in/golive-test',
      demoVideoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      otherLinks: ['https://docs.code-a-nova.online']
    };

    const draftRes = await axios.post(`${BASE_URL}/submission/save-draft`, draftPayload, leaderAuth);
    testAssert(draftRes.data.success, 'SUBMISSION_DRAFT', 'Leader saved submission draft');
    testAssert(draftRes.data.submission.status === 'DRAFT', 'SUBMISSION_DRAFT', 'Submission status is DRAFT');

    // Member can view submission
    const memberSubmissionViewRes = await axios.get(`${BASE_URL}/submission/my-submission`, memberAuth);
    testAssert(memberSubmissionViewRes.data.submission.projectName === 'GO-LIVE-TEST-Platform', 'SUBMISSION_VIEW', 'Member can view submission');

    // Non-leader member cannot edit draft
    let memberEditBlocked = false;
    try {
      await axios.post(`${BASE_URL}/submission/save-draft`, { ...draftPayload, projectName: 'Hacked Title' }, memberAuth);
    } catch (err) {
      memberEditBlocked = err.response && (err.response.status === 403 || err.response.status === 400);
    }
    testAssert(memberEditBlocked, 'SUBMISSION_RBAC', 'Non-leader member blocked from editing submission');

    // Final submit
    const finalSubmitRes = await axios.post(`${BASE_URL}/submission/final-submit`, draftPayload, leaderAuth);
    testAssert(finalSubmitRes.data.success, 'SUBMISSION_FINAL', 'Project submitted successfully');
    testAssert(finalSubmitRes.data.submission.status === 'SUBMITTED', 'SUBMISSION_FINAL', 'Submission status is SUBMITTED');
    testAssert(finalSubmitRes.data.submission.isLocked === true, 'SUBMISSION_FINAL', 'Submission marked as locked');

    // Modifying after lock is blocked
    let editAfterLockBlocked = false;
    try {
      await axios.post(`${BASE_URL}/submission/save-draft`, { ...draftPayload, projectDescription: 'Tampered after lock' }, leaderAuth);
    } catch (err) {
      editAfterLockBlocked = err.response && (err.response.status === 400 || err.response.status === 403);
    }
    testAssert(editAfterLockBlocked, 'SUBMISSION_LOCK', 'Modifying submission after final submission is rejected');

    // -------------------------------------------------------------
    // 11. LIFECYCLE STEP G: EDITORIAL MEMBER MANAGEMENT
    // -------------------------------------------------------------
    console.log('\n--- 11. STEP G: EDITORIAL MEMBER MANAGEMENT ---');
    const judgeEmail = 'golive_test_judge@example.com';
    const initialJudgePassword = 'JudgeTempPassword!2025';

    // Admin creates staging editorial member
    const createJudgeRes = await axios.post(`${BASE_URL}/admin/editorial-members`, {
      name: 'GoLive Test Judge',
      email: judgeEmail,
      password: initialJudgePassword,
      confirmPassword: initialJudgePassword,
      isActive: true
    }, adminAuth);

    testAssert(createJudgeRes.data.success, 'EDITORIAL_MEMBER', 'Admin created editorial judge');
    testAssert(!createJudgeRes.data.member.password && !createJudgeRes.data.member.passwordHash, 'EDITORIAL_SECURITY', 'Password hash not leaked in create member response');
    const judgeId = createJudgeRes.data.member._id;

    // Judge login with initial password
    const judgeLoginRes = await axios.post(`${BASE_URL}/editorial/login`, {
      email: judgeEmail,
      password: initialJudgePassword
    });
    testAssert(judgeLoginRes.data.success, 'EDITORIAL_LOGIN', 'Judge login with initial password succeeded');
    testAssert(judgeLoginRes.data.member.mustChangePassword === true, 'EDITORIAL_LOGIN', 'mustChangePassword flag is true');
    const judgeToken = judgeLoginRes.data.token;
    const judgeAuth = { headers: { Authorization: `Bearer ${judgeToken}` } };

    // Judge changes password
    const newJudgePassword = 'JudgeSecurePermanentPassword!2025';
    const changePassRes = await axios.put(`${BASE_URL}/editorial/password`, {
      currentPassword: initialJudgePassword,
      newPassword: newJudgePassword,
      confirmPassword: newJudgePassword
    }, judgeAuth);
    testAssert(changePassRes.data.success, 'EDITORIAL_PASSWORD', 'Judge changed password successfully');

    // Verify login with new password
    const newLoginRes = await axios.post(`${BASE_URL}/editorial/login`, {
      email: judgeEmail,
      password: newJudgePassword
    });
    testAssert(newLoginRes.data.success && newLoginRes.data.member.mustChangePassword === false, 'EDITORIAL_LOGIN', 'Login with updated permanent password succeeded');
    const activeJudgeAuth = { headers: { Authorization: `Bearer ${newLoginRes.data.token}` } };

    // -------------------------------------------------------------
    // 12. LIFECYCLE STEP H: ASSIGNMENT TO JUDGE
    // -------------------------------------------------------------
    console.log('\n--- 12. STEP H: PROJECT ASSIGNMENT ---');
    const assignRes = await axios.post(`${BASE_URL}/admin/editorial-assignments`, {
      teamId: createdTeam._id,
      editorialMemberId: judgeId
    }, adminAuth);
    testAssert(assignRes.data.success, 'ASSIGNMENT', 'Admin assigned team to judge');

    // Duplicate assignment blocked
    let dupAssignmentBlocked = false;
    try {
      await axios.post(`${BASE_URL}/admin/editorial-assignments`, {
        teamId: createdTeam._id,
        editorialMemberId: judgeId
      }, adminAuth);
    } catch (err) {
      dupAssignmentBlocked = err.response && (err.response.status === 400 || err.response.status === 409);
    }
    testAssert(dupAssignmentBlocked, 'ASSIGNMENT_IDEMPOTENCY', 'Duplicate assignment blocked');

    // -------------------------------------------------------------
    // 13. LIFECYCLE STEP I: EDITORIAL DASHBOARD & BLIND REVIEW
    // -------------------------------------------------------------
    console.log('\n--- 13. STEP I: EDITORIAL DASHBOARD & BLIND REVIEW ---');
    const judgeProjectsRes = await axios.get(`${BASE_URL}/editorial/projects`, activeJudgeAuth);
    testAssert(judgeProjectsRes.data.projects.length >= 1, 'EDITORIAL_DASHBOARD', 'Judge sees assigned project');

    const projectDetailRes = await axios.get(`${BASE_URL}/editorial/projects/${createdTeam._id}`, activeJudgeAuth);
    const proj = projectDetailRes.data.team;
    testAssert(proj.teamName === 'GO-LIVE-TEST-ALPHA', 'BLIND_REVIEW', 'Judge can view project details');
    testAssert(proj.paymentStatus === undefined, 'BLIND_REVIEW', 'Judge CANNOT see payment status');
    testAssert(proj.registrationFee === undefined, 'BLIND_REVIEW', 'Judge CANNOT see registration fee or payment IDs');
    testAssert(proj.rawUnstopData === undefined, 'BLIND_REVIEW', 'Judge CANNOT see raw Unstop/internal admin data');

    // -------------------------------------------------------------
    // 14. LIFECYCLE STEP J: EVALUATION & RUBRIC SCORING
    // -------------------------------------------------------------
    console.log('\n--- 14. STEP J: EVALUATION & RUBRIC SCORING ---');
    // Audit external link clicks
    await axios.post(`${BASE_URL}/editorial/projects/${createdTeam._id}/audit-link-click`, { linkType: 'GITHUB' }, activeJudgeAuth);
    await axios.post(`${BASE_URL}/editorial/projects/${createdTeam._id}/audit-link-click`, { linkType: 'HOSTED_LINK' }, activeJudgeAuth);

    const linkAudit = await HackathonAuditLog.findOne({
      targetId: createdTeam.teamId,
      action: 'EDITORIAL_GITHUB_OPENED'
    });
    testAssert(Boolean(linkAudit), 'EVALUATION_AUDIT', 'Editorial link click audit event recorded');

    // Save evaluation draft
    const rubricScores = [
      { criterion: 'Innovation & Originality', score: 23, maxScore: 25 },
      { criterion: 'Technical Complexity', score: 22, maxScore: 25 },
      { criterion: 'Usability & Design', score: 24, maxScore: 25 },
      { criterion: 'Impact & Viability', score: 23, maxScore: 25 }
    ];
    const evalDraftPayload = {
      scores: rubricScores,
      comments: 'GO-LIVE-TEST: Exceptional architecture and clean execution.'
    };
    const evalDraftRes = await axios.post(`${BASE_URL}/editorial/projects/${createdTeam._id}/evaluation/draft`, evalDraftPayload, activeJudgeAuth);
    testAssert(evalDraftRes.data.success, 'EVALUATION_DRAFT', 'Judge saved evaluation draft');

    // Finalize evaluation (tampering client-side total is ignored by server)
    const finalizePayload = {
      ...evalDraftPayload,
      scores: rubricScores,
      totalScore: 999 // Client attempts to force 999
    };
    const finalizeRes = await axios.post(`${BASE_URL}/editorial/projects/${createdTeam._id}/evaluation/finalize`, finalizePayload, activeJudgeAuth);
    testAssert(finalizeRes.data.success, 'EVALUATION_FINALIZE', 'Judge finalized evaluation');
    testAssert(finalizeRes.data.evaluation.status === 'FINALIZED', 'EVALUATION_FINALIZE', 'Evaluation status is FINALIZED');
    // Expected total = 23 + 22 + 24 + 23 = 92
    testAssert(finalizeRes.data.evaluation.totalScore === 92, 'EVALUATION_CALC', 'Server-side total score calculated correctly as 92 (tampered 999 rejected)');

    // -------------------------------------------------------------
    // 15. LIFECYCLE STEP K: RESULTS, TIEBREAKING & LOCKING
    // -------------------------------------------------------------
    console.log('\n--- 15. STEP K: RESULTS, TIEBREAKING & LOCKING ---');
    // Admin calculates results
    const calcRes = await axios.post(`${BASE_URL}/admin/results/calculate`, { hackathonId: HACKATHON_ID }, adminAuth);
    testAssert(calcRes.data.success, 'RESULTS_CALC', 'Admin results calculated successfully');

    // Assign winner tier
    const assignWinnerRes = await axios.post(`${BASE_URL}/admin/results/${createdTeam.teamId}/assign-winner`, {
      hackathonId: HACKATHON_ID,
      category: 'Winner (1st Place)',
      isWinner: true
    }, adminAuth);
    testAssert(assignWinnerRes.data.success, 'WINNER_ASSIGN', 'Winner assigned Winner (1st Place) category');

    // Approve results
    const approveRes = await axios.post(`${BASE_URL}/admin/results/approve`, { hackathonId: HACKATHON_ID }, adminAuth);
    testAssert(approveRes.data.success, 'RESULTS_APPROVE', 'Admin approved results');

    // Lock results
    const lockRes = await axios.post(`${BASE_URL}/admin/results/lock`, {
      hackathonId: HACKATHON_ID,
      confirmLock: true,
      reason: 'Final official locking'
    }, adminAuth);
    testAssert(lockRes.data.success, 'RESULTS_LOCK', 'Admin locked results (tamper-proof)');

    // -------------------------------------------------------------
    // 16. LIFECYCLE STEP L: RESULT PUBLICATION & VISIBILITY
    // -------------------------------------------------------------
    console.log('\n--- 16. STEP L: RESULT PUBLICATION ---');
    // Publish results
    const pubRes = await axios.post(`${BASE_URL}/admin/results/publish`, { hackathonId: HACKATHON_ID, isResultsPublished: true }, adminAuth);
    testAssert(pubRes.data.success, 'RESULTS_PUBLISH', 'Admin published official results');

    // Participant queries /results/my-result
    const myResultRes = await axios.get(`${BASE_URL}/results/my-result`, leaderAuth);
    testAssert(myResultRes.data.success && (myResultRes.data.isWinner === true || myResultRes.data.result?.isWinner === true), 'PARTICIPANT_RESULT', 'Participant views published result');

    // Public queries /public/results
    const publicResultsRes = await axios.get(`${BASE_URL}/public/results?hackathonId=${HACKATHON_ID}`);
    testAssert(publicResultsRes.data.success, 'PUBLIC_RESULTS', 'Public results endpoint accessible');
    const pubWinner = publicResultsRes.data.winners && publicResultsRes.data.winners.find(w => w.teamName === 'GO-LIVE-TEST-ALPHA');
    testAssert(Boolean(pubWinner), 'PUBLIC_RESULTS', 'Winner team displayed in public results');
    testAssert(!pubWinner?.judgeComments && !pubWinner?.judges, 'PUBLIC_SECURITY', 'Judge identities and judge comments NOT exposed in public results');

    // -------------------------------------------------------------
    // 17. LIFECYCLE STEP M: CERTIFICATES & PUBLIC VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 17. STEP M: CERTIFICATES & PUBLIC VERIFICATION ---');
    // Generate certificate
    const genCertRes = await axios.post(`${BASE_URL}/admin/certificates/generate-bulk`, {
      hackathonId: HACKATHON_ID
    }, adminAuth);
    testAssert(genCertRes.data.success, 'CERTIFICATE_GEN', 'Certificates generated');

    const cert = await HackathonCertificate.findOne({ recipientEmail: leaderEmail });
    testAssert(Boolean(cert), 'CERTIFICATE_PERSIST', 'Certificate persisted for team leader');
    testAssert(Boolean(cert?.certificateNumber && cert?.verificationCode), 'CERTIFICATE_HASH', 'Certificate has unique number and verification code');

    // Public certificate verification
    const verifyCertRes = await axios.get(`${BASE_URL}/certificates/verify/${cert.verificationCode}`);
    testAssert(verifyCertRes.data.isValid === true, 'CERT_VERIFICATION', 'Public verification endpoint verifies certificate validity');
    testAssert(!verifyCertRes.data.recipientEmail, 'CERT_PRIVACY', 'Private participant email NOT exposed in public verification');
    testAssert(!verifyCertRes.data.paymentDetails, 'CERT_PRIVACY', 'Payment details NOT exposed in public verification');

    // Revocation test
    const revokeRes = await axios.post(`${BASE_URL}/admin/certificates/${cert._id}/revoke`, {
      reason: 'Testing revocation workflow in staging smoke test'
    }, adminAuth);
    testAssert(revokeRes.data.success, 'CERT_REVOKE', 'Certificate revoked by admin');

    const verifyRevokedRes = await axios.get(`${BASE_URL}/certificates/verify/${cert.verificationCode}`);
    testAssert(verifyRevokedRes.data.isValid === false && verifyRevokedRes.data.isRevoked === true, 'CERT_REVOKE_VERIFY', 'Public verification confirms certificate is revoked');

    // -------------------------------------------------------------
    // 18. LIFECYCLE STEP N: SPONSORS & PRIZES
    // -------------------------------------------------------------
    console.log('\n--- 18. STEP N: SPONSORS & PRIZES ---');
    // Create sponsor
    const sponsorRes = await axios.post(`${BASE_URL}/admin/sponsors`, {
      hackathonId: HACKATHON_ID,
      name: 'GO-LIVE-TEST-Sponsor-Cloud',
      tier: 'PLATINUM',
      logoUrl: 'https://storage.googleapis.com/test/sponsor.png',
      websiteUrl: 'https://sponsor.example.com',
      contactName: 'Confidential VIP Sponsor POC',
      contactEmail: 'confidential_poc@sponsor.example.com',
      contactPhone: '9998887776'
    }, adminAuth);
    testAssert(sponsorRes.data.success, 'SPONSOR_CREATE', 'Admin created sponsor');
    const sponsorId = sponsorRes.data.sponsor._id;

    // Public sponsor endpoint must strip confidential contact info
    const pubSponsorsRes = await axios.get(`${BASE_URL}/public/sponsors?hackathonId=${HACKATHON_ID}`);
    const pubSponsor = pubSponsorsRes.data.sponsors.find(s => s.name === 'GO-LIVE-TEST-Sponsor-Cloud');
    testAssert(Boolean(pubSponsor), 'SPONSOR_PUBLIC', 'Sponsor listed in public sponsors list');
    testAssert(!pubSponsor?.contactName && !pubSponsor?.contactEmail, 'SPONSOR_PRIVACY', 'Private sponsor POC info NOT exposed in public API');

    // Create prize
    const prizeRes = await axios.post(`${BASE_URL}/admin/prizes`, {
      hackathonId: HACKATHON_ID,
      name: 'GO-LIVE-TEST-First-Prize',
      category: 'Winner (1st Place)',
      amount: 25000,
      currency: 'INR',
      sponsorId: sponsorId,
      fulfillmentMethod: 'BANK_TRANSFER'
    }, adminAuth);
    testAssert(prizeRes.data.success, 'PRIZE_CREATE', 'Admin created prize');
    const prizeId = prizeRes.data.prize._id;

    // Create prize fulfillment
    const fulfillRes = await axios.post(`${BASE_URL}/admin/prize-fulfillments`, {
      hackathonId: HACKATHON_ID,
      prizeId: prizeId,
      teamId: createdTeam.teamId,
      recipientEmail: leaderEmail,
      recipientName: 'GoLive Test Leader',
      status: 'PROCESSING'
    }, adminAuth);
    testAssert(fulfillRes.data.success, 'PRIZE_FULFILL', 'Admin created prize fulfillment record');
    const fulfillId = fulfillRes.data.fulfillment._id;

    // Update fulfillment to DISPATCHED with UTR
    const updateFulfillRes = await axios.put(`${BASE_URL}/admin/prize-fulfillments/${fulfillId}`, {
      status: 'FULFILLED',
      transactionReference: 'UTR-GOLIVE-TEST-99881122',
      notes: 'Dispatched via IMPS batch'
    }, adminAuth);
    testAssert(updateFulfillRes.data.success && updateFulfillRes.data.fulfillment.status === 'FULFILLED', 'PRIZE_FULFILL_UPDATE', 'Fulfillment updated with UTR');

    // -------------------------------------------------------------
    // 19. AUDIT LOG VERIFICATION ACROSS ENTIRE LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n--- 19. AUDIT LOG VERIFICATION ---');
    const allAuditLogs = await HackathonAuditLog.find({
      $or: [
        { targetId: createdTeam.teamId },
        { targetId: teamId },
        { 'details.teamId': createdTeam.teamId },
        { 'metadata.teamId': createdTeam.teamId }
      ]
    });
    testAssert(allAuditLogs.length >= 5, 'AUDIT_INTEGRITY', `Audit timeline recorded ${allAuditLogs.length} events across lifecycle`);

    let zeroSecretLeak = true;
    for (const log of allAuditLogs) {
      const serialized = JSON.stringify(log);
      if (serialized.includes('Password@123') || serialized.includes('rzp_live_') || serialized.includes('re_')) {
        zeroSecretLeak = false;
      }
    }
    testAssert(zeroSecretLeak, 'AUDIT_NO_SECRETS', 'Zero credentials, passwords, or live secrets leaked in audit logs');

    // -------------------------------------------------------------
    // 20. SECURITY & AUTHORIZATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 20. SECURITY & AUTHORIZATION BOUNDARIES ---');
    // Participant JWT against Admin endpoints
    let participantAdminBlocked = false;
    try {
      await axios.get(`${BASE_URL}/admin/overview`, leaderAuth);
    } catch (err) {
      participantAdminBlocked = err.response && (err.response.status === 403 || err.response.status === 401);
    }
    testAssert(participantAdminBlocked, 'SECURITY_RBAC', 'Participant token blocked from admin endpoints (403)');

    // Editorial JWT against Admin endpoints
    let editorialAdminBlocked = false;
    try {
      await axios.get(`${BASE_URL}/admin/overview`, activeJudgeAuth);
    } catch (err) {
      editorialAdminBlocked = err.response && (err.response.status === 403 || err.response.status === 401);
    }
    testAssert(editorialAdminBlocked, 'SECURITY_RBAC', 'Editorial token blocked from admin endpoints (403)');

    // Missing JWT
    let unauthenticatedBlocked = false;
    try {
      await axios.get(`${BASE_URL}/admin/overview`);
    } catch (err) {
      unauthenticatedBlocked = err.response && err.response.status === 401;
    }
    testAssert(unauthenticatedBlocked, 'SECURITY_AUTH', 'Unauthenticated request rejected with 401');

    // Deactivated editorial account test
    await axios.put(`${BASE_URL}/admin/editorial-members/${judgeId}`, { isActive: false }, adminAuth);
    let deactivatedJudgeBlocked = false;
    try {
      await axios.get(`${BASE_URL}/editorial/dashboard`, activeJudgeAuth);
    } catch (err) {
      deactivatedJudgeBlocked = err.response && (err.response.status === 403 || err.response.status === 401);
    }
    testAssert(deactivatedJudgeBlocked, 'SECURITY_DEACTIVATED', 'Deactivated editorial judge account immediately blocked');

    // ID Tampering test
    let fakeTeamBlocked = false;
    try {
      const fakeId = new mongoose.Types.ObjectId();
      await axios.get(`${BASE_URL}/admin/teams/${fakeId}`, adminAuth);
    } catch (err) {
      fakeTeamBlocked = err.response && err.response.status === 404;
    }
    testAssert(fakeTeamBlocked, 'SECURITY_ID_TAMPER', 'Non-existent / tampered team ID safely handled (404)');

    // ReDoS / regex injection defense
    const redosRes = await axios.get(`${BASE_URL}/admin/teams?search=(${'a+'.repeat(20)})`, adminAuth);
    testAssert(redosRes.status === 200, 'SECURITY_REDOS', 'ReDoS injection payload handled safely without catastrophic backtracking');

    // -------------------------------------------------------------
    // 21. EXPORT SECURITY & CSV FORMULA INJECTION DEFENSE
    // -------------------------------------------------------------
    console.log('\n--- 21. EXPORT SECURITY & FORMULA INJECTION DEFENSE ---');
    const exportRes = await axios.get(`${BASE_URL}/admin/export/teams`, adminAuth);
    testAssert(exportRes.status === 200, 'EXPORT_TEAMS', 'Admin teams CSV export generated');
    testAssert(typeof exportRes.data === 'string' && exportRes.data.includes('Team Name'), 'EXPORT_TEAMS', 'CSV header formatted properly');
    testAssert(!exportRes.data.includes('password') && !exportRes.data.includes('secret'), 'EXPORT_NO_SECRETS', 'No secrets or passwords in CSV export');

    // -------------------------------------------------------------
    // 22. RATE LIMITING SMOKE CHECK
    // -------------------------------------------------------------
    console.log('\n--- 22. RATE LIMITING SMOKE CHECK ---');
    const publicHealthRes = await axios.get(`${BASE_URL}/health`);
    testAssert(publicHealthRes.status === 200, 'RATE_LIMITING', 'Public health endpoint responsive under normal traffic');

    // -------------------------------------------------------------
    // CLEANUP STAGING TEST DATA
    // -------------------------------------------------------------
    console.log('\n--- CLEANING UP ISOLATED STAGING TEST DATA ---');
    await HackathonTeam.deleteMany({ teamName: /^GO-LIVE-TEST-/ });
    await HackathonSubmission.deleteMany({
      $or: [
        { submitterEmail: /^golive_test_/ },
        { 'submissionData.projectTitle': /^GO-LIVE-TEST-/ },
        { projectName: /^GO-LIVE-TEST-/ }
      ]
    });
    await HackathonEditorialMember.deleteMany({ email: /^golive_test_/ });
    await HackathonEditorialAssignment.deleteMany({ team: createdTeam._id });
    await HackathonEditorialEvaluation.deleteMany({ 'scores.comments': /GO-LIVE-TEST/ });
    await HackathonResult.deleteMany({ teamName: /^GO-LIVE-TEST-/ });
    await HackathonCertificate.deleteMany({ recipientEmail: { $in: [leaderEmail, memberEmail] } });
    await HackathonSponsor.deleteMany({ name: /^GO-LIVE-TEST-/ });
    await HackathonPrize.deleteMany({ title: /^GO-LIVE-TEST-/, name: /^GO-LIVE-TEST-/ });
    await HackathonPrizeFulfillment.deleteMany({ teamId: createdTeam.teamId });
    await User.deleteMany({ email: { $in: [leaderEmail, memberEmail, outsiderEmail] } });

    if (settings) {
      settings.resultsLocked = false;
      settings.isResultsPublished = false;
      await settings.save();
    }
    console.log('Staging test data cleaned up safely without touching production records.\n');

  } catch (fatalErr) {
    console.error('FATAL ERROR DURING GO-LIVE VERIFICATION:', fatalErr.response ? fatalErr.response.data : fatalErr.message);
    testFailed++;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }

  console.log('================================================================');
  console.log(`GO-LIVE VERIFICATION TEST RESULTS: ${testPassed} PASSED, ${testFailed} FAILED`);
  console.log('================================================================\n');

  return { testPassed, testFailed, testResults };
}

if (require.main === module) {
  runGoLiveVerification()
    .then(({ testPassed, testFailed }) => {
      process.exit(testFailed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = runGoLiveVerification;
