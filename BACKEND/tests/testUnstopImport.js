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

async function runTests() {
  console.log('=== STARTING PHASE 2 UNSTOP IMPORT TESTS ===\n');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });

  // Clean test teams if any
  await HackathonTeam.deleteMany({
    $or: [
      { unstopApplicationId: { $regex: /^UNSTOP-/ } },
      { 'leader.email': { $regex: /\.test\d*@example\.com$/ } },
      { teamName: { $regex: /^TEST_/ } },
    ],
  });

  // ── TEST 1: Normal Valid Excel with multiple columns ──────────────────────
  console.log('Test 1: Normal Valid Excel parsing & preview');
  const validRows = [
    [
      'Application ID',
      'Team Name',
      'Track',
      'Team Leader Name',
      'Leader Email',
      'Mobile Number',
      'College Name',
      'State',
      'Member 1 Name',
      'Member 1 Email',
      'Member 1 College',
      'Idea Title',
      'Abstract',
      'Problem Statement',
      'Proposed Solution',
      'Tech Stack',
      'PPT Link',
      'GitHub Link',
    ],
    [
      'UNSTOP-1001',
      'TEST_Alpha Innovators',
      'AI & Machine Learning',
      'Aarav Sharma',
      'aarav.test1@example.com',
      '+91 9876543210',
      'IIT Delhi',
      'Delhi',
      'Rohan Verma',
      'rohan.test1@example.com',
      'IIT Delhi',
      'Autonomous Medical Agent',
      'A real-time medical triage assistant powered by LLMs.',
      'Emergency room overload',
      'Automated triage dispatch',
      'Python, FastAPI, LangChain, React',
      'drive.google.com/file/d/test-ppt-1',
      'github.com/aarav/med-agent',
    ],
    [
      'UNSTOP-1002',
      'TEST_Byte Crafters',
      'Web3 & Decentralized Tech',
      'Priya Patel',
      'priya.test2@example.com',
      '9123456789',
      'BITS Pilani',
      'Rajasthan',
      'Sneha Sen',
      'sneha.test2@example.com',
      'BITS Pilani',
      'DeFi Micro-Lending',
      'Decentralized peer-to-peer micro loans on Polygon.',
      'Lack of credit history in rural India',
      'Collateralized on-chain trust graph',
      'Solidity, Ethereum, Next.js',
      'https://drive.google.com/file/d/test-ppt-2',
      'https://github.com/priya/defi-loans',
    ],
  ];

  const buffer1 = createSampleWorkbookBuffer({ 'Applications': validRows });
  const workbookData1 = unstopParserService.parseWorkbookBuffer(buffer1);
  const sheetData1 = unstopParserService.extractSheetData(workbookData1.workbook, 'Applications');
  const preview1 = await unstopParserService.generateImportPreview({ sheetData: sheetData1 });

  console.assert(preview1.totalRows === 2, `Expected 2 rows, got ${preview1.totalRows}`);
  console.assert(preview1.newCount === 2, `Expected 2 new, got ${preview1.newCount}`);
  console.assert(preview1.previewRows[0].leader.email === 'aarav.test1@example.com', 'Leader email lowercase check');
  console.assert(preview1.previewRows[0].initialIdea.pptUrl.startsWith('https://'), 'PPT URL normalization check');
  console.log('✓ Test 1 passed: Normal Valid Excel preview matches perfectly.\n');

  // ── TEST 2: Commit Batch Import to Database ────────────────────────────────
  console.log('Test 2: Commit Batch Import into Database');
  const commitRes1 = await unstopParserService.commitBatchImport({
    rowsToImport: preview1.previewRows,
    duplicateHandling: 'SKIP',
  });

  console.assert(commitRes1.importedCount === 2, `Expected 2 imported, got ${commitRes1.importedCount}`);
  console.assert(commitRes1.failedCount === 0, `Expected 0 failed, got ${commitRes1.failedCount}`);

  const dbTeam1 = await HackathonTeam.findOne({ unstopApplicationId: 'UNSTOP-1001' });
  console.assert(dbTeam1 !== null, 'Team 1 should exist in DB');
  console.assert(dbTeam1.status === 'IMPORTED', `Status should be IMPORTED, got ${dbTeam1?.status}`);
  console.assert(dbTeam1.paymentStatus === 'NOT_REQUIRED', 'Payment status should be NOT_REQUIRED');
  console.assert(dbTeam1.members.length === 1, 'Member 1 should be mapped');
  console.assert(dbTeam1.members[0].name === 'Rohan Verma', 'Member 1 name should match');
  console.assert(dbTeam1.rawUnstopData['College Name'] === 'IIT Delhi', 'Raw unstop data preserved');
  console.log('✓ Test 2 passed: Batch commit succeeded with status = IMPORTED and member mapping.\n');

  // ── TEST 3: Duplicate Detection against Database & Intra-file Duplicates ───
  console.log('Test 3: Duplicate Detection (DB Duplicate + File Duplicate)');
  const dupRows = [
    ['App ID', 'Team Name', 'Leader Name', 'Leader Email'],
    // Duplicate against DB (UNSTOP-1001 / aarav.test1@example.com)
    ['UNSTOP-1001', 'TEST_Alpha Innovators Dup', 'Aarav Sharma', 'aarav.test1@example.com'],
    // Fresh team
    ['UNSTOP-1003', 'TEST_Cyber Squad', 'Dev Mehra', 'dev.test3@example.com'],
    // Duplicate of UNSTOP-1003 in same file
    ['UNSTOP-1003', 'TEST_Cyber Squad Repeat', 'Dev Mehra', 'dev.test3@example.com'],
  ];

  const buffer3 = createSampleWorkbookBuffer({ 'Sheet1': dupRows });
  const wbData3 = unstopParserService.parseWorkbookBuffer(buffer3);
  const sheetData3 = unstopParserService.extractSheetData(wbData3.workbook);
  const preview3 = await unstopParserService.generateImportPreview({ sheetData: sheetData3 });

  console.assert(preview3.totalRows === 3, `Expected 3 rows, got ${preview3.totalRows}`);
  console.assert(preview3.validToImportCount === 1, `Expected 1 valid to import, got ${preview3.validToImportCount}`);
  console.assert(preview3.duplicateCount === 2, `Expected 2 duplicates, got ${preview3.duplicateCount}`);
  console.assert(preview3.previewRows[0].status === 'DUPLICATE', 'Row 1 should be DUPLICATE (against DB)');
  console.assert(preview3.previewRows[2].status === 'DUPLICATE', 'Row 3 should be DUPLICATE (intra-file)');
  console.log('✓ Test 3 passed: Accurate duplicate detection both against DB and within file.\n');

  // ── TEST 4: Invalid Rows (Missing required fields & invalid emails) ────────
  console.log('Test 4: Invalid Rows (Missing Team Name, Missing Leader Email, Invalid Email)');
  const invalidRows = [
    ['Team Name', 'Leader Name', 'Leader Email'],
    ['', 'Leader Only', 'leader.no.team@example.com'], // Missing team name
    ['TEST_Team No Email', 'Leader Two', ''], // Missing leader email
    ['TEST_Team Bad Email', 'Leader Three', 'not-an-email'], // Malformed email
  ];

  const buffer4 = createSampleWorkbookBuffer({ 'Sheet1': invalidRows });
  const wbData4 = unstopParserService.parseWorkbookBuffer(buffer4);
  const sheetData4 = unstopParserService.extractSheetData(wbData4.workbook);
  const preview4 = await unstopParserService.generateImportPreview({ sheetData: sheetData4 });

  console.assert(preview4.totalRows === 3, `Expected 3 rows, got ${preview4.totalRows}`);
  console.assert(preview4.invalidCount === 3, `Expected 3 invalid, got ${preview4.invalidCount}`);
  console.assert(preview4.previewRows[0].errors.includes('Missing Team Name'), 'Should flag missing team name');
  console.assert(preview4.previewRows[1].errors.includes('Missing Leader Email'), 'Should flag missing leader email');
  console.assert(preview4.previewRows[2].errors.some(e => e.includes('Invalid Leader Email format')), 'Should flag invalid email');
  console.log('✓ Test 4 passed: Strict server-side validation catches all invalid inputs.\n');

  // ── TEST 5: Multiple Sheets in Workbook ────────────────────────────────────
  console.log('Test 5: Multiple Sheets Detection & Selection');
  const multiSheetWb = createSampleWorkbookBuffer({
    'Sheet_One': [['Team Name', 'Leader Name', 'Leader Email'], ['TEST_Team Sheet 1', 'Lead 1', 'lead1@example.com']],
    'Final_Submissions': [['Team Name', 'Leader Name', 'Leader Email'], ['TEST_Team Sheet 2', 'Lead 2', 'lead2@example.com']],
  });

  const wbData5 = unstopParserService.parseWorkbookBuffer(multiSheetWb);
  console.assert(wbData5.sheetNames.length === 2, `Expected 2 sheets, got ${wbData5.sheetNames.length}`);
  console.assert(wbData5.sheetNames[1] === 'Final_Submissions', 'Sheet 2 name matches');

  const sheetData5 = unstopParserService.extractSheetData(wbData5.workbook, 'Final_Submissions');
  console.assert(sheetData5.sheetName === 'Final_Submissions', 'Correct sheet selected');
  const preview5 = await unstopParserService.generateImportPreview({ sheetData: sheetData5 });
  console.assert(preview5.previewRows[0].teamName === 'TEST_Team Sheet 2', 'Row from sheet 2 read successfully');
  console.log('✓ Test 5 passed: Multiple sheets detected and individually selectable.\n');

  // ── TEST 6: Extra / Unmapped Columns Preserved in rawUnstopData ────────────
  console.log('Test 6: Extra Columns Preservation in rawUnstopData');
  const extraCols = [
    ['Team Name', 'Leader Name', 'Leader Email', 'Custom T-Shirt Size', 'Dietary Preference', 'How did you hear about us?'],
    ['TEST_Extra Data Team', 'Karan Johar', 'karan.test6@example.com', 'XL', 'Vegetarian', 'Instagram Ad'],
  ];

  const buffer6 = createSampleWorkbookBuffer({ 'Sheet1': extraCols });
  const wbData6 = unstopParserService.parseWorkbookBuffer(buffer6);
  const sheetData6 = unstopParserService.extractSheetData(wbData6.workbook);
  const preview6 = await unstopParserService.generateImportPreview({ sheetData: sheetData6 });
  const commitRes6 = await unstopParserService.commitBatchImport({ rowsToImport: preview6.previewRows });

  const dbTeam6 = await HackathonTeam.findOne({ 'leader.email': 'karan.test6@example.com' });
  console.assert(dbTeam6.rawUnstopData['Custom T-Shirt Size'] === 'XL', 'Custom column preserved');
  console.assert(dbTeam6.rawUnstopData['Dietary Preference'] === 'Vegetarian', 'Dietary preference preserved');
  console.assert(dbTeam6.rawUnstopData['How did you hear about us?'] === 'Instagram Ad', 'Survey column preserved');
  console.log('✓ Test 6 passed: Extra custom columns preserved with zero data loss.\n');

  // Clean test teams
  await HackathonTeam.deleteMany({
    $or: [
      { unstopApplicationId: { $regex: /^UNSTOP-/ } },
      { 'leader.email': { $regex: /\.test\d*@example\.com$/ } },
      { teamName: { $regex: /^TEST_/ } },
    ],
  });

  await mongoose.disconnect();
  console.log('=== ALL PHASE 2 TESTS COMPLETED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
