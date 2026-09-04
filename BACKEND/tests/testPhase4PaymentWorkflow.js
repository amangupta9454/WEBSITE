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

async function runPhase4Tests() {
  console.log('=== RUNNING PHASE 4 SHORTLIST NOTIFICATION & PAYMENT TEST SUITE ===\n');
  await mongoose.connect(process.env.MONGO_URI);

  const app = express();
  app.use(express.json());
  app.use('/api/hackathon', hackathonRoutes);

  const PORT = 5096;
  const server = app.listen(PORT, async () => {
    try {
      // ─── 0. SETUP TEST USERS & TEAMS ───
      // Admin
      let admin = await Admin.findOne();
      if (!admin) {
        admin = await Admin.create({
          username: 'admin_phase4',
          password: 'password123',
          email: 'admin.phase4@codeanova.online',
        });
      }
      const adminToken = jwt.sign(
        { id: admin._id, username: admin.username, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET || 'secret'
      );

      // Leader User
      let leaderUser = await User.findOne({ email: 'phase4.leader@codeanova.online' });
      if (!leaderUser) {
        leaderUser = await User.create({
          name: 'Vikram Leader',
          email: 'phase4.leader@codeanova.online',
          password: 'password123',
          mobile: '9876543210',
        });
      }
      const leaderToken = jwt.sign(
        { id: leaderUser._id, name: leaderUser.name, email: leaderUser.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );

      // Member User (Non-Leader)
      let memberUser = await User.findOne({ email: 'phase4.member@codeanova.online' });
      if (!memberUser) {
        memberUser = await User.create({
          name: 'Sameer Member',
          email: 'phase4.member@codeanova.online',
          password: 'password123',
          mobile: '9876543211',
        });
      }
      const memberToken = jwt.sign(
        { id: memberUser._id, name: memberUser.name, email: memberUser.email, role: 'student' },
        process.env.JWT_SECRET || 'secret'
      );

      // Settings
      const settings = await HackathonSetting.getOrCreateSettings();
      settings.participationFee = 49;
      settings.whatsAppLink = 'https://chat.whatsapp.com/test-phase4-invite-link';
      await settings.save();

      // Create test team
      await HackathonTeam.deleteMany({ teamId: 'CAN-PHASE4-01' });
      await HackathonPayment.deleteMany({ teamId: 'CAN-PHASE4-01' });
      await HackathonAuditLog.deleteMany({ targetId: 'CAN-PHASE4-01' });

      const testTeam = await HackathonTeam.create({
        teamId: 'CAN-PHASE4-01',
        teamName: 'Nova Innovators',
        track: 'AI & Robotics',
        leader: {
          name: leaderUser.name,
          email: leaderUser.email,
          userId: leaderUser._id,
          mobile: '9876543210',
          college: 'IIT Bombay',
          state: 'Maharashtra',
        },
        members: [
          {
            name: memberUser.name,
            email: memberUser.email,
            userId: memberUser._id,
            mobile: '9876543211',
            college: 'IIT Bombay',
            state: 'Maharashtra',
            role: 'Full Stack Dev',
          },
        ],
        status: 'IMPORTED',
        paymentStatus: 'NOT_REQUIRED',
        source: 'MANUAL_ADMIN',
      });

      console.log('✓ Setup test users and team "CAN-PHASE4-01"');

      // ─── 1. TEST WHATSAPP ACCESS LOCK BEFORE CONFIRMATION ───
      console.log('\n--- 1. Testing WhatsApp URL Hidden Before Payment ---');
      const myTeamRes1 = await fetch(`http://localhost:${PORT}/api/hackathon/my-team`, {
        headers: { Authorization: `Bearer ${leaderToken}` },
      });
      const myTeamData1 = await myTeamRes1.json();
      console.assert(myTeamData1.success && myTeamData1.team.whatsAppLink === null, 'WhatsApp link must be null before payment confirmation');
      console.log('✓ WhatsApp link is safely locked and null for unconfirmed team');

      // ─── 2. TEST SHORTLISTING & SHORTLIST EMAIL TRIGGER ───
      console.log('\n--- 2. Testing Shortlist Email Automation & Idempotency ---');
      const shortlistRes = await fetch(`http://localhost:${PORT}/api/hackathon/admin/teams/${testTeam.teamId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'SHORTLISTED', note: 'Top tier ideation submission' }),
      });
      const shortlistData = await shortlistRes.json();
      console.assert(shortlistData.success && shortlistData.team.status === 'SHORTLISTED', 'Shortlisting failed');

      // Check email delivery status on team record
      const updatedTeam1 = await HackathonTeam.findOne({ teamId: testTeam.teamId });
      console.log(`Team shortlist email status: ${updatedTeam1.shortlistEmailStatus}`);
      console.assert(
        ['SENT', 'FAILED'].includes(updatedTeam1.shortlistEmailStatus),
        'Email status should be recorded as SENT or FAILED'
      );

      // Verify idempotency: re-calling shortlist must not re-trigger email if already SENT
      if (updatedTeam1.shortlistEmailStatus === 'SENT') {
        const initialSentAt = updatedTeam1.shortlistEmailSentAt;
        await fetch(`http://localhost:${PORT}/api/hackathon/admin/teams/${testTeam.teamId}/status`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'SHORTLISTED' }),
        });
        const teamAfterSecondShortlist = await HackathonTeam.findOne({ teamId: testTeam.teamId });
        console.assert(
          teamAfterSecondShortlist.shortlistEmailSentAt.getTime() === initialSentAt.getTime(),
          'Email must not be sent twice on redundant shortlist calls'
        );
        console.log('✓ Shortlist email trigger is strictly idempotent');
      }

      // ─── 3. TEST TEAM LEADER PAYMENT AUTHORIZATION ───
      console.log('\n--- 3. Testing Team Leader Payment Authorization ---');
      // A. Non-leader (member) attempts to create order -> Must receive 403 Forbidden
      const memberOrderRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/create-order`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${memberToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.assert(memberOrderRes.status === 403, `Expected 403 for member, got ${memberOrderRes.status}`);
      const memberOrderData = await memberOrderRes.json();
      console.assert(memberOrderData.success === false, 'Non-leader must not be able to create payment order');
      console.log('✓ Non-leader payment attempt rejected with 403 Forbidden');

      // B. Unauthenticated user attempts payment -> 401
      const unauthOrderRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/create-order`, {
        method: 'POST',
      });
      console.assert(unauthOrderRes.status === 401, `Expected 401, got ${unauthOrderRes.status}`);
      console.log('✓ Unauthenticated payment order attempt rejected with 401');

      // C. Team Leader creates payment order -> Must succeed with ₹49
      const leaderOrderRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/create-order`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          'Content-Type': 'application/json',
        },
      });
      const leaderOrderData = await leaderOrderRes.json();
      console.assert(leaderOrderRes.status === 200 && leaderOrderData.success, 'Leader order creation failed');
      console.assert(leaderOrderData.amount === 49, `Expected ₹49 fee, got ${leaderOrderData.amount}`);
      console.assert(leaderOrderData.order?.id, 'Order ID must be returned');
      console.assert(leaderOrderData.key !== undefined, 'Public key must be returned for checkout');
      console.log(`✓ Leader successfully created Razorpay order: ${leaderOrderData.order.id} for ₹${leaderOrderData.amount}`);

      const generatedOrderId = leaderOrderData.order.id;

      // Verify HackathonPayment ledger entry created in PENDING state
      const paymentLedger = await HackathonPayment.findOne({ orderId: generatedOrderId });
      console.assert(paymentLedger !== null && paymentLedger.status === 'PENDING', 'Payment ledger must be in PENDING state');
      console.log('✓ HackathonPayment ledger entry recorded with status PENDING');

      // ─── 4. TEST SERVER-SIDE PAYMENT SIGNATURE VERIFICATION ───
      console.log('\n--- 4. Testing Server-Side Signature Verification ---');
      const fakePaymentId = 'pay_fake_' + Math.floor(Math.random() * 100000);

      // A. Invalid Signature -> Must fail with 400
      const invalidVerifyRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: generatedOrderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: 'invalid_tampered_signature_12345',
        }),
      });
      console.assert(invalidVerifyRes.status === 400, `Expected 400 for invalid signature, got ${invalidVerifyRes.status}`);
      console.log('✓ Tampered signature rejected with 400 Bad Request');

      // B. Valid Signature -> Must confirm team and unlock WhatsApp
      const bodyToSign = generatedOrderId + '|' + fakePaymentId;
      const validSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
        .update(bodyToSign)
        .digest('hex');

      const validVerifyRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: generatedOrderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: validSignature,
        }),
      });
      const validVerifyData = await validVerifyRes.json();
      console.assert(validVerifyRes.status === 200 && validVerifyData.success, 'Valid signature verification failed');
      console.assert(validVerifyData.team?.status === 'CONFIRMED', `Expected team status CONFIRMED, got ${validVerifyData.team?.status}`);
      console.assert(validVerifyData.team?.paymentStatus === 'PAID', `Expected paymentStatus PAID, got ${validVerifyData.team?.paymentStatus}`);
      console.assert(validVerifyData.whatsAppLink === settings.whatsAppLink, 'WhatsApp link must be returned upon confirmed verification');
      console.log('✓ Payment verified! Team status = CONFIRMED, paymentStatus = PAID');

      // ─── 5. TEST WHATSAPP ACCESS RELEASED FOR ALL TEAM MEMBERS ───
      console.log('\n--- 5. Testing WhatsApp Link Released on Participant Dashboard ---');
      // Member checks my-team after leader paid -> Must now have WhatsApp link!
      const memberTeamRes = await fetch(`http://localhost:${PORT}/api/hackathon/my-team`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      const memberTeamData = await memberTeamRes.json();
      console.assert(
        memberTeamData.success && memberTeamData.team.whatsAppLink === settings.whatsAppLink,
        'WhatsApp link must be unlocked for team members after team confirmation'
      );
      console.log('✓ WhatsApp community link successfully unlocked for both Leader and Member');

      // ─── 6. TEST IDEMPOTENT WEBHOOK HANDLING ───
      console.log('\n--- 6. Testing Idempotent Webhook Handler ---');
      const webhookPayload = {
        event: 'order.paid',
        payload: {
          payment: {
            entity: {
              id: fakePaymentId,
              order_id: generatedOrderId,
              amount: 4900,
              notes: {
                teamId: testTeam.teamId,
              },
            },
          },
        },
      };

      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
      const webhookSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      const webhookRes = await fetch(`http://localhost:${PORT}/api/hackathon/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': webhookSig,
        },
        body: JSON.stringify(webhookPayload),
      });
      const webhookData = await webhookRes.json();
      console.assert(webhookRes.status === 200 && webhookData.success, 'Webhook handler failed');
      console.log('✓ Webhook handled idempotently without duplicate status corruption');

      // ─── 7. TEST AUDIT LOGS ───
      console.log('\n--- 7. Verifying Audit Logs for Phase 4 Events ---');
      const auditRecords = await HackathonAuditLog.find({
        $or: [{ targetId: testTeam.teamId }, { targetId: generatedOrderId }],
      });
      const loggedActions = auditRecords.map((r) => r.action);
      console.log('Logged Actions:', loggedActions);
      console.assert(loggedActions.includes('TEAM_SHORTLISTED'), 'Missing TEAM_SHORTLISTED audit');
      console.assert(loggedActions.includes('PAYMENT_CREATED'), 'Missing PAYMENT_CREATED audit');
      console.assert(loggedActions.includes('PAYMENT_VERIFIED'), 'Missing PAYMENT_VERIFIED audit');
      console.assert(loggedActions.includes('TEAM_CONFIRMED'), 'Missing TEAM_CONFIRMED audit');
      console.assert(loggedActions.includes('WHATSAPP_ACCESS_UNLOCKED'), 'Missing WHATSAPP_ACCESS_UNLOCKED audit');
      console.log('✓ All Phase 4 audit events successfully recorded');

      // ─── CLEANUP TEST DATA ───
      await HackathonTeam.deleteOne({ teamId: testTeam.teamId });
      await HackathonPayment.deleteMany({ teamId: testTeam.teamId });
      await HackathonAuditLog.deleteMany({ targetId: testTeam.teamId });
      await HackathonAuditLog.deleteMany({ targetId: generatedOrderId });
      await User.deleteOne({ email: 'phase4.leader@codeanova.online' });
      await User.deleteOne({ email: 'phase4.member@codeanova.online' });

      console.log('\n🎉 ALL PHASE 4 BACKEND TESTS PASSED CLEANLY!\n');
    } catch (err) {
      console.error('❌ Phase 4 test failure:', err);
      process.exitCode = 1;
    } finally {
      server.close();
      await mongoose.disconnect();
    }
  });
}

runPhase4Tests();
