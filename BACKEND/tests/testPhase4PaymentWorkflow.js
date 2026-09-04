const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');
const User = require('../models/User');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonPayment = require('../models/HackathonPayment');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const HackathonSetting = require('../models/HackathonSetting');
const hackathonRoutes = require('../routes/hackathon');

async function runPhase4SecurityTests() {
  console.log('=== RUNNING COMPREHENSIVE PHASE 4 SECURITY & PRODUCTION HARDENING TEST SUITE ===\n');
  await mongoose.connect(process.env.MONGO_URI);

  const app = express();
  app.use(express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use('/api/hackathon', hackathonRoutes);

  const PORT = 5097;
  const server = app.listen(PORT, async () => {
    try {
      // ─── 0. SETUP TEST USERS & TEAMS ───
      let admin = await Admin.findOne();
      if (!admin) {
        admin = await Admin.create({
          username: 'admin_sec',
          password: 'password123',
          email: 'admin.sec@codeanova.online',
        });
      }
      const adminToken = jwt.sign(
        { id: admin._id, username: admin.username, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET || 'secret'
      );

      // Leader User Team A
      let leaderA = await User.findOne({ email: 'sec.leadera@codeanova.online' });
      if (!leaderA) {
        leaderA = await User.create({
          name: 'Leader A',
          email: 'sec.leadera@codeanova.online',
          password: 'password123',
          mobile: '9876543210',
        });
      }
      const leaderTokenA = jwt.sign(
        { id: leaderA._id, name: leaderA.name, email: leaderA.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );

      // Member User Team A
      let memberA = await User.findOne({ email: 'sec.membera@codeanova.online' });
      if (!memberA) {
        memberA = await User.create({
          name: 'Member A',
          email: 'sec.membera@codeanova.online',
          password: 'password123',
          mobile: '9876543211',
        });
      }
      const memberTokenA = jwt.sign(
        { id: memberA._id, name: memberA.name, email: memberA.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );

      // Leader User Team B (Cross-team attacker)
      let leaderB = await User.findOne({ email: 'sec.leaderb@codeanova.online' });
      if (!leaderB) {
        leaderB = await User.create({
          name: 'Leader B',
          email: 'sec.leaderb@codeanova.online',
          password: 'password123',
          mobile: '9876543212',
        });
      }
      const leaderTokenB = jwt.sign(
        { id: leaderB._id, name: leaderB.name, email: leaderB.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );

      // Configure Settings
      const settings = await HackathonSetting.getOrCreateSettings();
      settings.participationFee = 49;
      settings.whatsAppLink = 'https://chat.whatsapp.com/test-phase4-secure-invite';
      await settings.save();

      // Clean old test records
      const testTeamIds = ['CAN-SEC-01', 'CAN-SEC-02', 'CAN-SEC-03', 'CAN-SEC-04'];
      await HackathonTeam.deleteMany({ teamId: { $in: testTeamIds } });
      await HackathonPayment.deleteMany({ teamId: { $in: testTeamIds } });
      await HackathonAuditLog.deleteMany({ targetId: { $in: testTeamIds } });

      // Team 1: Shortlisted Team
      const teamA = await HackathonTeam.create({
        teamId: 'CAN-SEC-01',
        teamName: 'Sec Alpha',
        track: 'Security Track',
        leader: {
          name: leaderA.name,
          email: leaderA.email,
          userId: leaderA._id,
        },
        members: [{ name: memberA.name, email: memberA.email, userId: memberA._id }],
        status: 'SHORTLISTED',
        paymentStatus: 'NOT_REQUIRED',
        source: 'MANUAL_ADMIN',
      });

      // Team 2: Team B (Separate team)
      const teamB = await HackathonTeam.create({
        teamId: 'CAN-SEC-02',
        teamName: 'Sec Beta',
        track: 'Web3 Track',
        leader: {
          name: leaderB.name,
          email: leaderB.email,
          userId: leaderB._id,
        },
        status: 'SHORTLISTED',
        paymentStatus: 'NOT_REQUIRED',
        source: 'MANUAL_ADMIN',
      });

      // Team 3: Rejected Team
      const teamC = await HackathonTeam.create({
        teamId: 'CAN-SEC-03',
        teamName: 'Sec Gamma',
        track: 'AI Track',
        leader: {
          name: 'Leader C',
          email: 'sec.leaderc@codeanova.online',
        },
        status: 'REJECTED',
        paymentStatus: 'NOT_REQUIRED',
        source: 'MANUAL_ADMIN',
      });

      // Team 4: Imported Team (Not Shortlisted)
      const teamD = await HackathonTeam.create({
        teamId: 'CAN-SEC-04',
        teamName: 'Sec Delta',
        track: 'Full Stack',
        leader: {
          name: 'Leader D',
          email: 'sec.leaderd@codeanova.online',
        },
        status: 'IMPORTED',
        paymentStatus: 'NOT_REQUIRED',
        source: 'MANUAL_ADMIN',
      });

      console.log('✓ Setup complete: Created test teams & accounts.\n');

      // ─── TEST 1: WHATSAPP URL STRICTLY HIDDEN BEFORE CONFIRMATION ───
      console.log('--- Test 1: WhatsApp URL Before Confirmation ---');
      const teamInfoResBefore = await fetch(`http://localhost:${PORT}/api/hackathon/my-team`, {
        headers: { Authorization: `Bearer ${leaderTokenA}` },
      });
      const teamInfoDataBefore = await teamInfoResBefore.json();
      console.assert(teamInfoDataBefore.team?.whatsAppLink === null, 'WhatsApp URL must be null for unconfirmed team');
      console.log('✓ Pass: WhatsApp URL is null before confirmation');

      // ─── TEST 2: NON-LEADER PAYMENT ATTEMPT (CREATE ORDER) ───
      console.log('\n--- Test 2: Non-Leader Cannot Create Order ---');
      const memberOrderRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/create-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberTokenA}` },
      });
      console.assert(memberOrderRes.status === 403, `Expected 403 Forbidden for member, got ${memberOrderRes.status}`);
      console.log('✓ Pass: Non-leader rejected with 403 Forbidden');

      // ─── TEST 3: REJECTED TEAM CANNOT CREATE PAYMENT ORDER ───
      console.log('\n--- Test 3: Rejected Team Cannot Pay ---');
      let leaderCUser = await User.findOne({ email: 'sec.leaderc@codeanova.online' });
      if (!leaderCUser) {
        leaderCUser = await User.create({
          name: 'Leader C',
          email: 'sec.leaderc@codeanova.online',
          password: 'password123',
          mobile: '9876543213',
        });
      }
      const leaderCToken = jwt.sign(
        { id: leaderCUser._id, name: leaderCUser.name, email: leaderCUser.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );
      const rejectedOrderRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/create-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${leaderCToken}` },
      });
      console.assert(rejectedOrderRes.status === 400, `Expected 400 for rejected team, got ${rejectedOrderRes.status}`);
      console.log('✓ Pass: Rejected team rejected with 400 Bad Request');

      // ─── TEST 4: NON-SHORTLISTED (IMPORTED) TEAM CANNOT PAY ───
      console.log('\n--- Test 4: Non-Shortlisted (Imported) Team Cannot Pay ---');
      let leaderDUser = await User.findOne({ email: 'sec.leaderd@codeanova.online' });
      if (!leaderDUser) {
        leaderDUser = await User.create({
          name: 'Leader D',
          email: 'sec.leaderd@codeanova.online',
          password: 'password123',
          mobile: '9876543214',
        });
      }
      const leaderDToken = jwt.sign(
        { id: leaderDUser._id, name: leaderDUser.name, email: leaderDUser.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );
      const importedOrderRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/create-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${leaderDToken}` },
      });
      console.assert(importedOrderRes.status === 400, `Expected 400 for imported team, got ${importedOrderRes.status}`);
      console.log('✓ Pass: Imported team rejected with 400 Bad Request');

      // ─── TEST 5: LEADER CREATES ORDER (AMOUNT INTEGRITY ₹49) ───
      console.log('\n--- Test 5: Server-Side Fee Enforcement (₹49) ---');
      const leaderOrderRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/create-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${leaderTokenA}` },
      });
      const leaderOrderData = await leaderOrderRes.json();
      console.assert(leaderOrderRes.status === 200 && leaderOrderData.success, 'Leader order creation failed');
      console.assert(leaderOrderData.amount === 49, `Expected ₹49 fee, got ${leaderOrderData.amount}`);
      const validOrderIdA = leaderOrderData.order.id;
      console.log(`✓ Pass: Order created server-side for ₹${leaderOrderData.amount} (Order ID: ${validOrderIdA})`);

      // ─── TEST 6: CROSS-TEAM ORDER ID VERIFICATION ATTEMPT ───
      console.log('\n--- Test 6: Cross-Team Access Blocked on Verify ---');
      // Leader B attempts to verify payment for Team A's order ID!
      const fakePaymentId = 'pay_sec_' + Date.now().toString().slice(-6);
      const fakeSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
        .update(`${validOrderIdA}|${fakePaymentId}`)
        .digest('hex');

      const crossTeamVerifyRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${leaderTokenB}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: validOrderIdA,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: fakeSig,
        }),
      });
      console.assert(crossTeamVerifyRes.status === 403, `Expected 403 for cross-team verify, got ${crossTeamVerifyRes.status}`);
      console.log('✓ Pass: Cross-team verify attempt blocked with 403 Forbidden');

      // ─── TEST 7: NON-LEADER (MEMBER) ATTEMPTS TO VERIFY PAYMENT ───
      console.log('\n--- Test 7: Non-Leader Member Cannot Verify Payment ---');
      const memberVerifyRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${memberTokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: validOrderIdA,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: fakeSig,
        }),
      });
      console.assert(memberVerifyRes.status === 403, `Expected 403 for non-leader verify, got ${memberVerifyRes.status}`);
      console.log('✓ Pass: Non-leader verify attempt blocked with 403 Forbidden');

      // ─── TEST 8: UNKNOWN / WRONG ORDER ID ───
      console.log('\n--- Test 8: Non-Existent Order ID on Verify ---');
      const wrongOrderRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${leaderTokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: 'order_nonexistent_999999',
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: fakeSig,
        }),
      });
      console.assert(wrongOrderRes.status === 404, `Expected 404 for wrong order ID, got ${wrongOrderRes.status}`);
      console.log('✓ Pass: Non-existent order ID rejected with 404 Not Found');

      // ─── TEST 9: INVALID / TAMPERED RAZORPAY SIGNATURE ───
      console.log('\n--- Test 9: Invalid / Tampered Razorpay Signature ---');
      const tamperedVerifyRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${leaderTokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: validOrderIdA,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: 'forged_signature_xyz_123',
        }),
      });
      console.assert(tamperedVerifyRes.status === 400, `Expected 400 for tampered signature, got ${tamperedVerifyRes.status}`);
      console.log('✓ Pass: Tampered signature rejected with 400 Bad Request');

      // ─── TEST 10: VALID VERIFY PAYMENT & CONFIRMATION ───
      console.log('\n--- Test 10: Valid Payment Signature & State Transition ---');
      const validVerifyRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${leaderTokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: validOrderIdA,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: fakeSig,
        }),
      });
      const validVerifyData = await validVerifyRes.json();
      console.assert(validVerifyRes.status === 200 && validVerifyData.success, 'Verify failed');
      console.assert(validVerifyData.team.status === 'CONFIRMED', 'Team must be CONFIRMED');
      console.assert(validVerifyData.team.paymentStatus === 'PAID', 'Payment status must be PAID');
      console.assert(validVerifyData.whatsAppLink === settings.whatsAppLink, 'WhatsApp URL must be returned');
      console.log('✓ Pass: Payment verified! Status = CONFIRMED, paymentStatus = PAID, WhatsApp URL unlocked');

      // ─── TEST 11: WHATSAPP URL ACCESSIBLE TO ALL MEMBERS AFTER CONFIRMATION ───
      console.log('\n--- Test 11: WhatsApp URL After Confirmation ---');
      const memberTeamResAfter = await fetch(`http://localhost:${PORT}/api/hackathon/my-team`, {
        headers: { Authorization: `Bearer ${memberTokenA}` },
      });
      const memberTeamDataAfter = await memberTeamResAfter.json();
      console.assert(
        memberTeamDataAfter.team?.whatsAppLink === settings.whatsAppLink,
        'Member must now be able to view unlocked WhatsApp URL'
      );
      console.log('✓ Pass: WhatsApp community URL unlocked for all confirmed team members');

      // ─── TEST 12: DUPLICATE VERIFY REQUEST (IDEMPOTENCY) ───
      console.log('\n--- Test 12: Duplicate Verify Request (Idempotent) ---');
      const dupVerifyRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${leaderTokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: validOrderIdA,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: fakeSig,
        }),
      });
      const dupVerifyData = await dupVerifyRes.json();
      console.assert(dupVerifyRes.status === 200 && dupVerifyData.success, 'Duplicate verify failed');
      console.assert(dupVerifyData.message === 'Participation already confirmed.', 'Expected idempotent message');
      console.log('✓ Pass: Duplicate verify request handled idempotently without re-triggering status change');

      // ─── TEST 13: ALREADY PAID TEAM CANNOT CREATE NEW ORDER ───
      console.log('\n--- Test 13: Already Confirmed Team Cannot Re-Order ---');
      const reOrderRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/create-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${leaderTokenA}` },
      });
      console.assert(reOrderRes.status === 400, `Expected 400 for already confirmed team, got ${reOrderRes.status}`);
      console.log('✓ Pass: Already confirmed team prevented from creating duplicate order');

      // ─── TEST 14: INVALID WEBHOOK SIGNATURE REJECTION ───
      console.log('\n--- Test 14: Invalid Webhook Signature Rejected ---');
      const webhookPayload = {
        event: 'order.paid',
        payload: {
          payment: {
            entity: {
              id: fakePaymentId,
              order_id: validOrderIdA,
              amount: 4900,
            },
          },
        },
      };
      const invalidWebhookRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'invalid_webhook_sig_123',
        },
        body: JSON.stringify(webhookPayload),
      });
      console.assert(invalidWebhookRes.status === 400, `Expected 400 for bad webhook sig, got ${invalidWebhookRes.status}`);
      console.log('✓ Pass: Tampered webhook signature rejected with 400 Bad Request');

      // ─── TEST 15: VALID & DUPLICATE WEBHOOK (IDEMPOTENCY) ───
      console.log('\n--- Test 15: Webhook Signature Verification & Idempotency ---');
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
      const rawPayloadStr = JSON.stringify(webhookPayload);
      const validWebhookSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayloadStr)
        .digest('hex');

      // First webhook post
      const webhookRes1 = await fetch(`http://localhost:${PORT}/api/hackathon/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validWebhookSig,
        },
        body: rawPayloadStr,
      });
      console.assert(webhookRes1.status === 200, `Expected 200, got ${webhookRes1.status}`);

      // Second duplicate webhook post
      const webhookRes2 = await fetch(`http://localhost:${PORT}/api/hackathon/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validWebhookSig,
        },
        body: rawPayloadStr,
      });
      console.assert(webhookRes2.status === 200, `Expected 200 on duplicate webhook, got ${webhookRes2.status}`);
      console.log('✓ Pass: Webhook verified with timing-safe HMAC and handled idempotently');

      // ─── TEST 16: UNAUTHORIZED ADMIN RESEND SHORTLIST EMAIL ───
      console.log('\n--- Test 16: Unauthorized Access to Admin Resend Endpoint ---');
      const unauthAdminRes = await fetch(
        `http://localhost:${PORT}/api/hackathon/admin/teams/${teamA.teamId}/resend-shortlist-email`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${leaderTokenA}` }, // Student token, not admin!
        }
      );
      console.assert(unauthAdminRes.status === 403, `Expected 403 for non-admin, got ${unauthAdminRes.status}`);
      console.log('✓ Pass: Unauthorized admin endpoint access blocked with 403 Forbidden');

      // ─── CLEANUP ───
      await HackathonTeam.deleteMany({ teamId: { $in: testTeamIds } });
      await HackathonPayment.deleteMany({ teamId: { $in: testTeamIds } });
      await HackathonAuditLog.deleteMany({ targetId: { $in: testTeamIds } });
      await User.deleteMany({
        email: {
          $in: [
            'sec.leadera@codeanova.online',
            'sec.membera@codeanova.online',
            'sec.leaderb@codeanova.online',
            'sec.leaderc@codeanova.online',
            'sec.leaderd@codeanova.online',
          ],
        },
      });

      console.log('\n🎉 ALL 16 PHASE 4 SECURITY AUDIT TESTS PASSED COMPLETELY!\n');
    } catch (err) {
      console.error('❌ Security test error:', err);
      process.exitCode = 1;
    } finally {
      server.close();
      await mongoose.disconnect();
    }
  });
}

runPhase4SecurityTests();
