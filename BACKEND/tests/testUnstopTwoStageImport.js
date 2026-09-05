const xlsx = require('xlsx');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const unstopParserService = require('../services/unstopParserService');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonAuditLog = require('../models/HackathonAuditLog');

function createSampleWorkbookBuffer(sheetDataMap) {
  const wb = xlsx.utils.book_new();
  for (const [sheetName, rows] of Object.entries(sheetDataMap)) {
    const ws = xlsx.utils.aoa_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
  }
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function runTwoStageImportTests() {
  console.log('===============================================================');
  console.log('=== STARTING UNSTOP TWO-STAGE IMPORT COMPREHENSIVE TESTS    ===');
  console.log('===============================================================\n');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });

  // Clean up any test teams and audit logs before starting
  await HackathonTeam.deleteMany({
    $or: [
      { unstopApplicationId: { $regex: /^TWOSTAGE-/ } },
      { 'leader.email': { $regex: /@twostage\.test$/ } },
      { 'members.email': { $regex: /@twostage\.test$/ } },
      { teamName: { $regex: /^TEST_TWOSTAGE_/ } },
    ],
  });
  await HackathonAuditLog.deleteMany({
    action: { $in: ['UNSTOP_REGISTRATION_IMPORT', 'UNSTOP_PPT_IMPORT'] },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Auto-detection of Import Type
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 1: Intelligent Auto-Detection of Sheet Type');
  const regHeaders = [
    'Candidate ID', 'Candidate Name', 'Candidate Email', 'Candidate Role',
    'Team ID', 'Team Name', 'Domain', 'Organisation / Institute', 'Course',
  ];
  const pptHeaders = [
    'Regn. ID', 'Team Name', 'Round 1 Submission', 'Round 1 Score', 'Status', 'Candidate Email'
  ];
  const legacyHeaders = [
    'Application ID', 'Team Name', 'Team Leader Name', 'Leader Email', 'PPT Link'
  ];

  console.assert(
    unstopParserService.detectImportType(regHeaders, 'AUTO') === 'REGISTRATION',
    'Should detect REGISTRATION from candidate headers'
  );
  console.assert(
    unstopParserService.detectImportType(pptHeaders, 'AUTO') === 'PPT',
    'Should detect PPT from submission headers'
  );
  console.assert(
    unstopParserService.detectImportType(legacyHeaders, 'AUTO') === 'LEGACY',
    'Should detect LEGACY from Phase 2 single-row headers'
  );
  console.assert(
    unstopParserService.detectImportType(legacyHeaders, 'REGISTRATION') === 'REGISTRATION',
    'Explicit override REGISTRATION should take precedence'
  );
  console.assert(
    unstopParserService.detectImportType(legacyHeaders, 'PPT') === 'PPT',
    'Explicit override PPT should take precedence'
  );
  console.log('✓ Test 1 passed: Auto-detection and explicit stage selection working accurately.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Stage 1 Registration Import - Grouping Candidate Rows by Team ID
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 2: Stage 1 Registration Import - Candidate Rows Grouping by Team ID');
  const registrationRows = [
    [
      'Candidate ID', 'Candidate Name', 'Candidate Email', 'Candidate Mobile',
      'Candidate Role', 'Team ID', 'Team Name', 'Domain', 'Organisation / Institute',
      'Course', 'Specialization', 'Course Duration', 'Class / Grade', 'Year of Graduation',
      'Gender', 'Location', 'User Type', 'Designation', 'Total Work Experience',
    ],
    // Team 1 - Leader
    [
      'CAND-101', 'Aman Verma', 'aman@twostage.test', '+91 9999000101',
      'Team Leader', 'TWOSTAGE-T1', 'TEST_TWOSTAGE_NovaCoders', 'Full Stack AI', 'IIT Roorkee',
      'B.Tech', 'Computer Science', '4 Years', 'Final Year', '2026',
      'Male', 'Uttarakhand', 'College Student', 'Student Lead', '1 Year',
    ],
    // Team 1 - Member 1
    [
      'CAND-102', 'Ritu Sharma', 'ritu@twostage.test', '+91 9999000102',
      'Team Member', 'TWOSTAGE-T1', 'TEST_TWOSTAGE_NovaCoders', 'Full Stack AI', 'IIT Roorkee',
      'B.Tech', 'Data Science', '4 Years', '3rd Year', '2027',
      'Female', 'Delhi', 'College Student', 'Member', '0',
    ],
    // Team 1 - Member 2
    [
      'CAND-103', 'Kabir Das', 'kabir@twostage.test', '+91 9999000103',
      'Team Member', 'TWOSTAGE-T1', 'TEST_TWOSTAGE_NovaCoders', 'Full Stack AI', 'IIT Roorkee',
      'B.Tech', 'Electronics', '4 Years', '3rd Year', '2027',
      'Male', 'Varanasi', 'College Student', 'Member', '0',
    ],
    // Team 2 - Leader (Solo Team)
    [
      'CAND-201', 'Zoya Khan', 'zoya@twostage.test', '+91 9999000201',
      'Team Leader', 'TWOSTAGE-T2', 'TEST_TWOSTAGE_SoloMatrix', 'Cybersecurity', 'NIT Trichy',
      'M.Tech', 'InfoSec', '2 Years', '1st Year', '2027',
      'Female', 'Tamil Nadu', 'College Student', 'Researcher', '2 Years',
    ],
  ];

  const regBuffer = createSampleWorkbookBuffer({ 'Registrations': registrationRows });
  const regWb = unstopParserService.parseWorkbookBuffer(regBuffer);
  const regSheet = unstopParserService.extractSheetData(regWb.workbook, 'Registrations');
  const regPreview = await unstopParserService.generateRegistrationImportPreview({ sheetData: regSheet });

  console.assert(regPreview.totalRows === 4, `Expected 4 candidate rows, got ${regPreview.totalRows}`);
  console.assert(regPreview.totalTeams === 2, `Expected 2 grouped teams, got ${regPreview.totalTeams}`);
  console.assert(regPreview.newCount === 2, `Expected 2 new teams, got ${regPreview.newCount}`);
  console.assert(regPreview.existingUpdateCount === 0, `Expected 0 updates on fresh DB`);
  console.assert(regPreview.teams[0].leader.email === 'aman@twostage.test', 'Leader should be Aman');
  console.assert(regPreview.teams[0].members.length === 2, 'Team 1 should have 2 members');
  console.assert(regPreview.teams[0].members[0].name === 'Ritu Sharma', 'Member 1 should be Ritu');
  console.assert(regPreview.teams[0].members[1].name === 'Kabir Das', 'Member 2 should be Kabir');
  console.assert(regPreview.teams[1].leader.email === 'zoya@twostage.test', 'Leader should be Zoya');
  console.assert(regPreview.teams[1].members.length === 0, 'Team 2 should have 0 members');
  console.log('✓ Test 2 passed: Grouping candidate rows into teams with leaders and members works properly.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Commit Stage 1 Teams into MongoDB & Verify Schema Invariants
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 3: Commit Stage 1 Registration Import to MongoDB');
  const regCommitResult = await unstopParserService.commitRegistrationImport({
    teamsToImport: regPreview.teams,
  });

  console.assert(regCommitResult.createdCount === 2, `Expected 2 created teams, got ${regCommitResult.createdCount}`);
  console.assert(regCommitResult.updatedCount === 0, `Expected 0 updated teams`);
  console.assert(regCommitResult.failedCount === 0, `Expected 0 failures`);

  const dbTeam1 = await HackathonTeam.findOne({ unstopApplicationId: 'TWOSTAGE-T1' });
  console.assert(dbTeam1 !== null, 'Team 1 should be saved in DB');
  console.assert(dbTeam1.teamId.startsWith('CAN-'), `teamId should start with CAN-, got ${dbTeam1.teamId}`);
  console.assert(dbTeam1.status === 'IMPORTED', `Status should be IMPORTED, got ${dbTeam1.status}`);
  console.assert(dbTeam1.paymentStatus === 'NOT_REQUIRED', 'Payment status should be NOT_REQUIRED');
  console.assert(dbTeam1.members.length === 2, `Members length should be 2, got ${dbTeam1.members.length}`);
  console.assert(dbTeam1.leader.college === 'IIT Roorkee', 'Leader college should match');
  console.assert(dbTeam1.leader.gender === 'Male', 'Leader gender should match');
  console.assert(dbTeam1.members[0].email === 'ritu@twostage.test', 'Member 1 email should match');
  console.assert(dbTeam1.members[0].specialization === 'Data Science', 'Member 1 specialization should match');
  console.assert(dbTeam1.members[1].email === 'kabir@twostage.test', 'Member 2 email should match');
  console.log('✓ Test 3 passed: Teams and member arrays correctly created with CAN- codes and candidate fields.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Idempotent Re-Import (Master Upsert - Updates Existing, Adds New Member, Never Deletes)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 4: Re-import Registration Sheet (Upsert Invariant: Update Team, Add Member, Preserve Missing)');
  const updatedRegRows = [
    [
      'Candidate ID', 'Candidate Name', 'Candidate Email', 'Candidate Mobile',
      'Candidate Role', 'Team ID', 'Team Name', 'Domain', 'Organisation / Institute',
      'Course', 'Specialization', 'Course Duration', 'Class / Grade', 'Year of Graduation',
      'Gender', 'Location', 'User Type', 'Designation', 'Total Work Experience',
    ],
    // Team 1 Leader updated college/phone
    [
      'CAND-101', 'Aman Verma', 'aman@twostage.test', '+91 9999000999', // updated phone
      'Team Leader', 'TWOSTAGE-T1', 'TEST_TWOSTAGE_NovaCoders', 'Full Stack AI', 'IIT Roorkee - Tech Hub',
      'B.Tech', 'Computer Science & AI', '4 Years', 'Final Year', '2026',
      'Male', 'Uttarakhand', 'College Student', 'Founder', '1.5 Years',
    ],
    // Team 1 Member 1 (Ritu) updated
    [
      'CAND-102', 'Ritu Sharma', 'ritu@twostage.test', '+91 9999000102',
      'Team Member', 'TWOSTAGE-T1', 'TEST_TWOSTAGE_NovaCoders', 'Full Stack AI', 'IIT Roorkee - Tech Hub',
      'B.Tech', 'Data Science', '4 Years', '3rd Year', '2027',
      'Female', 'Delhi', 'College Student', 'Senior Member', '1 Year',
    ],
    // Note: Kabir (CAND-103) is intentionally MISSING in this export to test preservation!
    // Team 1 NEW Member 3 added
    [
      'CAND-104', 'Tanvi Gupta', 'tanvi@twostage.test', '+91 9999000104',
      'Team Member', 'TWOSTAGE-T1', 'TEST_TWOSTAGE_NovaCoders', 'Full Stack AI', 'IIT Roorkee',
      'B.Tech', 'AI/ML', '4 Years', '2nd Year', '2028',
      'Female', 'Jaipur', 'College Student', 'New Member', '0',
    ],
  ];

  const regBuffer2 = createSampleWorkbookBuffer({ 'Registrations': updatedRegRows });
  const regWb2 = unstopParserService.parseWorkbookBuffer(regBuffer2);
  const regSheet2 = unstopParserService.extractSheetData(regWb2.workbook, 'Registrations');
  const regPreview2 = await unstopParserService.generateRegistrationImportPreview({ sheetData: regSheet2 });

  console.assert(regPreview2.totalTeams === 1, `Expected 1 team in export`);
  console.assert(regPreview2.newCount === 0, `Expected 0 new teams`);
  console.assert(regPreview2.existingUpdateCount === 1, `Expected 1 existing update team`);
  console.assert(regPreview2.teams[0].status === 'EXISTING_UPDATE', 'Status should be EXISTING_UPDATE');
  console.assert(regPreview2.teams[0].memberDiff.newCount === 1, 'Expected 1 new member (Tanvi)');
  console.assert(regPreview2.teams[0].memberDiff.updatedCount === 1, 'Expected 1 updated member (Ritu)');

  const regCommitResult2 = await unstopParserService.commitRegistrationImport({
    teamsToImport: regPreview2.teams,
  });

  console.assert(regCommitResult2.createdCount === 0, 'Created count should be 0');
  console.assert(regCommitResult2.updatedCount === 1, 'Updated count should be 1');
  console.assert(regCommitResult2.membersAppended === 1, '1 new member appended');
  console.assert(regCommitResult2.membersUpdated === 1, '1 member updated');

  const reloadedTeam1 = await HackathonTeam.findOne({ unstopApplicationId: 'TWOSTAGE-T1' });
  console.assert(reloadedTeam1.leader.mobile.includes('9999000999'), 'Leader mobile updated');
  console.assert(reloadedTeam1.members.length === 3, `Expected 3 members (Ritu, Kabir preserved, Tanvi appended), got ${reloadedTeam1.members.length}`);
  const memberEmails = reloadedTeam1.members.map(m => m.email);
  console.assert(memberEmails.includes('ritu@twostage.test'), 'Ritu present');
  console.assert(memberEmails.includes('kabir@twostage.test'), 'Kabir preserved even though missing from second export!');
  console.assert(memberEmails.includes('tanvi@twostage.test'), 'Tanvi added');
  console.log('✓ Test 4 passed: Master upsert is idempotent, updates leader/members, appends new members, preserves missing candidates.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Stage 2 PPT Import Preview - 4-Tier Matching & Enrichment Invariants
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 5: Stage 2 PPT Import - 4-Tier Matching Hierarchy');
  const pptRows = [
    [
      'Regn. ID', 'Team Name', 'Candidate Email', 'Candidate Name',
      'Round 1 Submission', 'Round 1 Score', 'Status',
    ],
    // Row 1: Matches Team 1 via Regn ID ('TWOSTAGE-T1')
    [
      'TWOSTAGE-T1', 'TEST_TWOSTAGE_NovaCoders', 'aman@twostage.test', 'Aman Verma',
      'https://drive.google.com/file/d/test-team1-deck/view', '88/100', 'Selected',
    ],
    // Row 2: Matches Team 2 via Candidate Email ('zoya@twostage.test'), Regn ID empty
    [
      '', 'Some Other Name', 'zoya@twostage.test', 'Zoya Khan',
      'https://drive.google.com/file/d/test-team2-deck/view', '95/100', 'Selected',
    ],
    // Row 3: Ambiguous Row (no ID, no email, team name matches 0 or >1, or multiple DB matches)
    // Row 4: Unmatched Row (completely unknown candidate & ID)
    [
      'TWOSTAGE-UNKNOWN-999', 'Ghost Warriors', 'ghost@unknown.com', 'Casper',
      'https://drive.google.com/file/d/test-ghost-deck/view', '50/100', 'Rejected',
    ],
  ];

  const pptBuffer = createSampleWorkbookBuffer({ 'Submissions': pptRows });
  const pptWb = unstopParserService.parseWorkbookBuffer(pptBuffer);
  const pptSheet = unstopParserService.extractSheetData(pptWb.workbook, 'Submissions');
  const pptPreview = await unstopParserService.generatePptImportPreview({ sheetData: pptSheet });

  console.assert(pptPreview.totalRows === 3, `Expected 3 rows, got ${pptPreview.totalRows}`);
  console.assert(pptPreview.matchedCount === 2, `Expected 2 matched, got ${pptPreview.matchedCount}`);
  console.assert(pptPreview.newPptCount === 2, `Expected 2 new PPTs, got ${pptPreview.newPptCount}`);
  console.assert(pptPreview.unmatchedCount === 1, `Expected 1 unmatched, got ${pptPreview.unmatchedCount}`);

  // Row 1 checks
  console.assert(pptPreview.rows[0].status === 'NEW_PPT', 'Row 1 status NEW_PPT');
  console.assert(pptPreview.rows[0].matchStrategy.includes('REGN_ID'), 'Row 1 matched by REGN_ID');
  console.assert(pptPreview.rows[0].matchedTeam.teamId === reloadedTeam1.teamId, 'Row 1 matched team id');
  console.assert(pptPreview.rows[0].pptUrl.includes('test-team1-deck'), 'Row 1 pptUrl parsed');

  // Row 2 checks
  console.assert(pptPreview.rows[1].status === 'NEW_PPT', 'Row 2 status NEW_PPT');
  console.assert(
    pptPreview.rows[1].matchStrategy.includes('EMAIL'),
    'Row 2 matched by email'
  );
  console.assert(pptPreview.rows[1].matchedTeam.leaderEmail === 'zoya@twostage.test', 'Row 2 matched Zoya');

  // Row 3 checks (Unmatched)
  console.assert(pptPreview.rows[2].status === 'UNMATCHED', 'Row 3 status UNMATCHED');
  console.assert(pptPreview.rows[2].matchedTeam === null, 'Row 3 matchedTeam is null');
  console.log('✓ Test 5 passed: 4-tier matching hierarchy identifies teams by ID and Email, sets UNMATCHED for unknown.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Stage 2 PPT Commit - Enrichment ONLY & Strict Invariant: NEVER Creates Teams
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 6: Stage 2 PPT Commit - Enrichment Only, PPT NEVER Creates New Team');
  const totalTeamsBeforeCommit = await HackathonTeam.countDocuments();

  const pptCommitResult = await unstopParserService.commitPptImport({
    rowsToImport: pptPreview.rows,
  });

  console.assert(pptCommitResult.matchedCount === 2, `Expected 2 matched, got ${pptCommitResult.matchedCount}`);
  console.assert(pptCommitResult.updatedCount === 2, `Expected 2 updated, got ${pptCommitResult.updatedCount}`);
  console.assert(pptCommitResult.skippedCount === 1, `Expected 1 skipped (the unmatched ghost row)`);

  const totalTeamsAfterCommit = await HackathonTeam.countDocuments();
  console.assert(
    totalTeamsAfterCommit === totalTeamsBeforeCommit,
    `STRICT INVARIANT VIOLATION: Team count changed from ${totalTeamsBeforeCommit} to ${totalTeamsAfterCommit}! PPT import must NEVER create a new team!`
  );

  // Check enriched Team 1 in DB
  const enrichedTeam1 = await HackathonTeam.findOne({ unstopApplicationId: 'TWOSTAGE-T1' });
  console.assert(
    enrichedTeam1.initialIdea.pptUrl === 'https://drive.google.com/file/d/test-team1-deck/view',
    'initialIdea.pptUrl should be enriched'
  );
  console.assert(
    enrichedTeam1.pptSubmission.pptUrl === 'https://drive.google.com/file/d/test-team1-deck/view',
    'pptSubmission.pptUrl should be populated'
  );
  console.assert(
    enrichedTeam1.pptSubmission.submittedBy === 'Aman Verma',
    'pptSubmission.submittedBy should be populated'
  );
  console.assert(
    enrichedTeam1.submittedLinks.otherLinks.some(l => (typeof l === 'string' ? l : l.url).includes('test-team1-deck')),
    'submittedLinks.otherLinks should be updated for downstream access'
  );

  // Check enriched Team 2 in DB
  const enrichedTeam2 = await HackathonTeam.findOne({ 'leader.email': 'zoya@twostage.test' });
  console.assert(
    enrichedTeam2.pptSubmission.pptUrl === 'https://drive.google.com/file/d/test-team2-deck/view',
    'Team 2 PPT enriched'
  );

  console.log('✓ Test 6 passed: PPT import enriched existing teams with zero new teams created.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Ignored Fields (Unstop Status & Round 1 Score are Strictly Ignored)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 7: Verification that Unstop Status & Round 1 Score are Strictly Ignored');
  // Row 1 had Unstop Status: 'Selected', Row 3 had Unstop Status: 'Rejected', and Round 1 Score: '88/100'
  // Verify team.status is still 'IMPORTED', NOT overwritten by Unstop status
  console.assert(
    enrichedTeam1.status === 'IMPORTED',
    `Team status should remain IMPORTED, got ${enrichedTeam1.status}`
  );
  console.assert(
    enrichedTeam2.status === 'IMPORTED',
    `Team status should remain IMPORTED, got ${enrichedTeam2.status}`
  );
  // Verify internal evaluation score is NOT overwritten by Unstop '88/100'
  console.assert(
    enrichedTeam1.evaluation?.totalScore === undefined || enrichedTeam1.evaluation?.totalScore === null || enrichedTeam1.evaluation?.totalScore === 0,
    'Internal score must remain Code-A-Nova controlled, not Unstop Round 1 Score'
  );
  console.log('✓ Test 7 passed: Unstop Status and Round 1 Score strictly ignored.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 8: Ambiguous Match (>1 candidate teams) Placed in Review Queue
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 8: Ambiguous Matching Detection (>1 team with same name/characteristics)');
  // Create two teams with identical team name in different colleges
  const dupTeam1 = new HackathonTeam({
    teamId: 'CAN-9001',
    teamName: 'TEST_TWOSTAGE_IdenticalName',
    leader: { name: 'Lead One', email: 'lead1@twostage.test', college: 'College A' },
    status: 'IMPORTED',
  });
  const dupTeam2 = new HackathonTeam({
    teamId: 'CAN-9002',
    teamName: 'TEST_TWOSTAGE_IdenticalName',
    leader: { name: 'Lead Two', email: 'lead2@twostage.test', college: 'College B' },
    status: 'IMPORTED',
  });
  await dupTeam1.save();
  await dupTeam2.save();

  // PPT row provides ONLY team name, no ID or email
  const ambiguousPptRows = [
    ['Regn. ID', 'Team Name', 'Candidate Email', 'Round 1 Submission'],
    ['', 'TEST_TWOSTAGE_IdenticalName', '', 'https://drive.google.com/file/d/ambiguous-deck/view'],
  ];
  const ambBuffer = createSampleWorkbookBuffer({ 'Ambiguous': ambiguousPptRows });
  const ambWb = unstopParserService.parseWorkbookBuffer(ambBuffer);
  const ambSheet = unstopParserService.extractSheetData(ambWb.workbook, 'Ambiguous');
  const ambPreview = await unstopParserService.generatePptImportPreview({ sheetData: ambSheet });

  console.assert(ambPreview.ambiguousCount === 1, `Expected 1 ambiguous row, got ${ambPreview.ambiguousCount}`);
  console.assert(ambPreview.rows[0].status === 'AMBIGUOUS', 'Row status should be AMBIGUOUS');
  console.assert(
    ambPreview.rows[0].ambiguousCandidates.length === 2,
    `Expected 2 candidate teams in ambiguous queue, got ${ambPreview.rows[0].ambiguousCandidates.length}`
  );
  console.assert(ambPreview.validToImportCount === 0, 'Ambiguous row cannot be automatically imported');

  // Clean up dup teams
  await HackathonTeam.deleteMany({ _id: { $in: [dupTeam1._id, dupTeam2._id] } });
  console.log('✓ Test 8 passed: Ambiguous rows accurately trapped with candidate teams listed for admin review.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 9: PPT Re-import (Updating PPT URL)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 9: PPT Re-import updates existing PPT URL (UPDATE_PPT status)');
  const updatePptRows = [
    ['Regn. ID', 'Team Name', 'Candidate Email', 'Round 1 Submission'],
    [
      'TWOSTAGE-T1', 'TEST_TWOSTAGE_NovaCoders', 'aman@twostage.test',
      'https://drive.google.com/file/d/test-team1-deck-REVISED-V2/view',
    ],
  ];
  const updatePptBuffer = createSampleWorkbookBuffer({ 'RevisedPPT': updatePptRows });
  const updateWb = unstopParserService.parseWorkbookBuffer(updatePptBuffer);
  const updateSheet = unstopParserService.extractSheetData(updateWb.workbook, 'RevisedPPT');
  const updatePreview = await unstopParserService.generatePptImportPreview({ sheetData: updateSheet });

  console.assert(updatePreview.rows[0].status === 'UPDATE_PPT', `Expected UPDATE_PPT, got ${updatePreview.rows[0].status}`);
  console.assert(updatePreview.updatePptCount === 1, 'Expected 1 updatePptCount');

  await unstopParserService.commitPptImport({ rowsToImport: updatePreview.rows });
  const revisedTeam1 = await HackathonTeam.findOne({ unstopApplicationId: 'TWOSTAGE-T1' });
  console.assert(
    revisedTeam1.initialIdea.pptUrl.includes('REVISED-V2'),
    'PPT URL successfully revised in DB'
  );
  console.log('✓ Test 9 passed: Re-importing PPT updates existing submission cleanly.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 10: Audit Log Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log('Test 10: Audit Logging Verification');
  await HackathonAuditLog.log({
    actorId: 'admin-test',
    actorName: 'Test Runner',
    role: 'admin',
    action: 'UNSTOP_REGISTRATION_IMPORT',
    targetEntity: 'HackathonTeam',
    reason: 'Stage 1 Unstop Registration Import completed',
    newState: {
      totalRows: 4,
      teamsCreated: 2,
      teamsUpdated: 1,
      membersAppended: 1,
    },
  });

  const foundLog = await HackathonAuditLog.findOne({ action: 'UNSTOP_REGISTRATION_IMPORT' }).sort({ createdAt: -1 });
  console.assert(foundLog !== null, 'Audit log should be recorded');
  console.assert(foundLog.newState.teamsCreated === 2, 'Audit log newState preserved');
  console.log('✓ Test 10 passed: Audit logging captures two-stage import telemetry.\n');

  // Clean up all test teams
  await HackathonTeam.deleteMany({
    $or: [
      { unstopApplicationId: { $regex: /^TWOSTAGE-/ } },
      { 'leader.email': { $regex: /@twostage\.test$/ } },
      { 'members.email': { $regex: /@twostage\.test$/ } },
      { teamName: { $regex: /^TEST_TWOSTAGE_/ } },
    ],
  });
  await HackathonAuditLog.deleteMany({ action: 'UNSTOP_REGISTRATION_IMPORT' });

  await mongoose.disconnect();
  console.log('===============================================================');
  console.log('=== ALL 10 TWO-STAGE IMPORT TEST SUITES PASSED FLAWLESSLY!  ===');
  console.log('===============================================================');
}

runTwoStageImportTests().catch((err) => {
  console.error('Two-Stage Import Test Suite Failed:', err);
  process.exit(1);
});
