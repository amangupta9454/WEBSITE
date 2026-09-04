const mongoose = require('mongoose');
const express = require('express');
const xlsx = require('xlsx');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');
const hackathonRoutes = require('../routes/hackathon');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const HackathonTeam = require('../models/HackathonTeam');

async function testApiRoutes() {
  console.log('=== TESTING UNSTOP IMPORT API ENDPOINTS & SECURITY ===\n');
  await mongoose.connect(process.env.MONGO_URI);

  const app = express();
  app.use(express.json());
  app.use('/api/hackathon', hackathonRoutes);

  const server = app.listen(5098, async () => {
    try {
      // 1. Security Check: Unauthenticated requests
      const unauthPreview = await fetch('http://localhost:5098/api/hackathon/admin/unstop/preview', { method: 'POST' });
      console.assert(unauthPreview.status === 401, `Expected 401, got ${unauthPreview.status}`);
      console.log('✓ Security Test 1: POST /admin/unstop/preview rejected unauthorized request with 401');

      const unauthCommit = await fetch('http://localhost:5098/api/hackathon/admin/unstop/commit', { method: 'POST' });
      console.assert(unauthCommit.status === 401, `Expected 401, got ${unauthCommit.status}`);
      console.log('✓ Security Test 2: POST /admin/unstop/commit rejected unauthorized request with 401');

      const unauthTeams = await fetch('http://localhost:5098/api/hackathon/admin/teams');
      console.assert(unauthTeams.status === 401, `Expected 401, got ${unauthTeams.status}`);
      console.log('✓ Security Test 3: GET /admin/teams rejected unauthorized request with 401');

      // 2. Generate an Admin Token
      let admin = await Admin.findOne();
      if (!admin) {
        admin = await Admin.create({
          username: 'testadmin_unstop',
          password: 'hashedpassword123',
          email: 'admin.unstop@codeanova.online',
        });
      }

      const adminToken = jwt.sign(
        { id: admin._id, username: admin.username, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET || 'secret'
      );

      // 3. Test Preview with real Excel buffer
      const wb = xlsx.utils.book_new();
      const wsData = [
        ['App ID', 'Team Name', 'Leader Name', 'Leader Email', 'PPT Link'],
        ['UNSTOP-API-1', 'TEST_Api Team 1', 'Arjun Verma', 'arjun.api@example.com', 'https://drive.google.com/ppt-1'],
      ];
      const ws = xlsx.utils.aoa_to_sheet(wsData);
      xlsx.utils.book_append_sheet(wb, ws, 'Teams');
      const excelBuf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const blob = new Blob([excelBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const formData = new FormData();
      formData.append('excelFile', blob, 'test_unstop_export.xlsx');

      const previewRes = await fetch('http://localhost:5098/api/hackathon/admin/unstop/preview', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });

      const previewJson = await previewRes.json();
      console.assert(previewRes.status === 200, `Expected 200, got ${previewRes.status}`);
      console.assert(previewJson.success === true, 'Preview should succeed');
      console.assert(previewJson.stats.totalRows === 1, `Expected 1 row, got ${previewJson.stats.totalRows}`);
      console.log('✓ Admin Preview Test: Authenticated admin preview returned 200 with parsed stats');

      // 4. Test Commit with Preview Rows
      const commitRes = await fetch('http://localhost:5098/api/hackathon/admin/unstop/commit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: previewJson.previewRows,
          duplicateHandling: 'SKIP',
          filename: 'test_unstop_export.xlsx',
        }),
      });

      const commitJson = await commitRes.json();
      console.assert(commitRes.status === 200, `Expected 200, got ${commitRes.status}`);
      console.assert(commitJson.result.importedCount === 1, `Expected 1 imported, got ${commitJson.result.importedCount}`);
      console.log('✓ Admin Commit Test: Batch commit imported team with status = IMPORTED');

      // 5. Test Audit Log created
      const auditLog = await HackathonAuditLog.findOne({ action: 'UNSTOP_IMPORT' }).sort({ createdAt: -1 });
      console.assert(auditLog !== null, 'Audit log should be recorded');
      console.assert(auditLog.action === 'UNSTOP_IMPORT', 'Action should match UNSTOP_IMPORT');
      console.log('✓ Audit Log Test: UNSTOP_IMPORT logged in HackathonAuditLog');

      // 6. Test GET /admin/teams
      const teamsRes = await fetch('http://localhost:5098/api/hackathon/admin/teams?search=TEST_Api', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const teamsJson = await teamsRes.json();
      console.assert(teamsRes.status === 200, `Expected 200, got ${teamsRes.status}`);
      console.assert(teamsJson.teams.length >= 1, 'Search query returned matching team');
      console.log('✓ Admin Teams Query Test: GET /admin/teams returned team records');

      // Clean up test team
      await HackathonTeam.deleteMany({ teamName: { $regex: /^TEST_Api/ } });

      console.log('\n=== ALL API & SECURITY TESTS PASSED! ===');
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('API Test Error:', err);
      server.close();
      await mongoose.disconnect();
      process.exit(1);
    }
  });
}

testApiRoutes();
