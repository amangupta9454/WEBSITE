const xlsx = require('xlsx');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const HackathonTeam = require('../models/HackathonTeam');
const HackathonDuplicateQueue = require('../models/HackathonDuplicateQueue');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const HackathonSubmission = require('../models/HackathonSubmission');
const HackathonEditorialAssignment = require('../models/HackathonEditorialAssignment');
const HackathonEditorialEvaluation = require('../models/HackathonEditorialEvaluation');
const HackathonCertificate = require('../models/HackathonCertificate');

const hackathonIdentityService = require('../services/hackathonIdentityService');
const unstopParserService = require('../services/unstopParserService');

async function runTests() {
  console.log('===============================================================');
  console.log('=== HACKATHON TEAM IDENTITY ARCHITECTURE TEST SUITE         ===');
  console.log('=== 25 Test Cases: Canonical Internal ID & Multi-Source Map ===');
  console.log('===============================================================\n');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });

  // Cleanup any test leftovers
  await HackathonTeam.deleteMany({
    $or: [
      { 'leader.email': { $regex: /@identity\.test$/ } },
      { 'members.email': { $regex: /@identity\.test$/ } },
      { teamName: { $regex: /^IDENTITY_/ } },
      { 'sourceReferences.unstopTeamIds': { $regex: /^IDTEST-/ } },
      { 'sourceReferences.websiteRegistrationIds': { $regex: /^WEBTEST-/ } },
      { unstopApplicationId: { $regex: /^IDTEST-/ } },
    ],
  });
  await HackathonDuplicateQueue.deleteMany({
    incomingSourceId: { $regex: /^(IDTEST-|WEBTEST-)/ },
  });
  await HackathonAuditLog.deleteMany({
    targetId: { $regex: /^(CAN-TEAM-|IDTEST-|WEBTEST-)/ },
  });

  let passedTests = 0;
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    } else {
      console.log(`  ✓ ${message}`);
    }
  }

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // TEST 1: Team registered on website only has internal ID CAN-TEAM-XXXXXX and source WEBSITE
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 1: Website-only Team Registration ---');
    const t1Res = await hackathonIdentityService.processIncomingTeam({
      source: 'WEBSITE',
      sourceId: 'WEBTEST-001',
      teamName: 'IDENTITY_Web_Innovators',
      track: 'AI/ML',
      leader: {
        name: 'Alice Leader',
        email: 'alice.lead@identity.test',
        mobile: '9876543210',
        college: 'Test College of Eng',
      },
      members: [{ name: 'Bob Member', email: 'bob.m@identity.test' }],
    });

    assert(t1Res.status === 'CREATED', 'Website registration created team');
    assert(/^CAN-TEAM-\d{6}$/.test(t1Res.teamId), `Internal team ID conforms to CAN-TEAM-XXXXXX (got ${t1Res.teamId})`);
    assert(t1Res.team.sources.includes('WEBSITE'), 'Team sources array includes WEBSITE');
    assert(t1Res.team.sourceReferences.websiteRegistrationIds.includes('WEBTEST-001'), 'Website registration ID recorded in sourceReferences');
    const team1Id = t1Res.teamId;
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 2: Team registered on Unstop only has internal ID CAN-TEAM-XXXXXX and source UNSTOP
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 2: Unstop-only Team Registration ---');
    const t2Res = await hackathonIdentityService.processIncomingTeam({
      source: 'UNSTOP',
      sourceId: 'IDTEST-UNSTOP-002',
      teamName: 'IDENTITY_Unstop_Pioneers',
      track: 'Web3',
      leader: {
        name: 'Charlie Leader',
        email: 'charlie.unstop@identity.test',
        mobile: '9876543211',
      },
      members: [{ name: 'Dave Member', email: 'dave.m@identity.test' }],
    });

    assert(t2Res.status === 'CREATED', 'Unstop registration created team');
    assert(/^CAN-TEAM-\d{6}$/.test(t2Res.teamId), `Internal team ID conforms to CAN-TEAM-XXXXXX (got ${t2Res.teamId})`);
    assert(t2Res.team.sources.includes('UNSTOP'), 'Team sources array includes UNSTOP');
    assert(t2Res.team.sourceReferences.unstopTeamIds.includes('IDTEST-UNSTOP-002'), 'Unstop ID recorded in sourceReferences');
    assert(t2Res.team.unstopApplicationId === 'IDTEST-UNSTOP-002', 'Backward compatibility unstopApplicationId populated');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3: Team registered on website then imported via Unstop with same leader email maps to single internal ID
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 3: Website registered, then Unstop imported with same leader email ---');
    const t3Res = await hackathonIdentityService.processIncomingTeam({
      source: 'UNSTOP',
      sourceId: 'IDTEST-UNSTOP-003',
      teamName: 'IDENTITY_Web_Innovators (Unstop Sync)',
      leader: {
        name: 'Alice Leader',
        email: 'alice.lead@identity.test',
        mobile: '9876543210',
      },
      members: [{ name: 'Eve Member', email: 'eve.m@identity.test' }],
    });

    assert(t3Res.status === 'LINKED', 'Unstop import was recognized and linked to existing website team');
    assert(t3Res.teamId === team1Id, `Preserved original canonical Internal Team ID ${team1Id}`);
    assert(t3Res.team.sources.includes('WEBSITE') && t3Res.team.sources.includes('UNSTOP'), 'Team sources contains both WEBSITE and UNSTOP');
    assert(t3Res.team.sourceReferences.unstopTeamIds.includes('IDTEST-UNSTOP-003'), 'Unstop ID appended to sourceReferences.unstopTeamIds');
    assert(t3Res.team.sourceReferences.websiteRegistrationIds.includes('WEBTEST-001'), 'Original website registration ID preserved');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4: Team imported via Unstop then registered on website with same leader email maps to same internal ID
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 4: Unstop imported first, then registered on website with same leader email ---');
    const t4Res = await hackathonIdentityService.processIncomingTeam({
      source: 'WEBSITE',
      sourceId: 'WEBTEST-004',
      teamName: 'IDENTITY_Unstop_Pioneers (Portal Registration)',
      leader: {
        name: 'Charlie Leader',
        email: 'charlie.unstop@identity.test',
      },
    });

    assert(t4Res.status === 'LINKED', 'Website registration linked to existing Unstop team');
    assert(t4Res.teamId === t2Res.teamId, 'Retained original canonical Internal Team ID');
    assert(t4Res.team.sources.includes('WEBSITE') && t4Res.team.sources.includes('UNSTOP'), 'Both sources present');
    assert(t4Res.team.sourceReferences.websiteRegistrationIds.includes('WEBTEST-004'), 'Website registration ID attached to team');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 5: Website team (CN-12121) and Unstop team (CN-232323) resolve to same internal ID CAN-TEAM-XXXXXX
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 5: Website CN-12121 & Unstop CN-232323 map to same Internal ID ---');
    const t5_web = await hackathonIdentityService.processIncomingTeam({
      source: 'WEBSITE',
      sourceId: 'CN-12121',
      teamName: 'IDENTITY_Dual_Source_Team',
      leader: { name: 'Dan Leader', email: 'dan.lead@identity.test' },
      members: [{ name: 'Grace M', email: 'grace@identity.test' }],
    });
    const canonicalTeam5Id = t5_web.teamId;

    const t5_unstop = await hackathonIdentityService.processIncomingTeam({
      source: 'UNSTOP',
      sourceId: 'CN-232323',
      teamName: 'IDENTITY_Dual_Source_Team',
      leader: { name: 'Dan Leader', email: 'dan.lead@identity.test' },
    });

    assert(t5_unstop.teamId === canonicalTeam5Id, 'Both source registrations resolved to single Internal Team ID');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 6: Resolving team by website ID returns canonical internal team
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 6: Lookup by Website ID ---');
    const foundByWebId = await hackathonIdentityService.resolveTeamIdentity({
      source: 'WEBSITE',
      sourceId: 'CN-12121',
      leaderEmail: 'different.email@identity.test',
    });
    assert(foundByWebId.matchStrategy === 'EXACT_WEBSITE_ID', 'Matched via EXACT_WEBSITE_ID strategy');
    assert(foundByWebId.matchedTeam.teamId === canonicalTeam5Id, 'Lookup by website ID returned canonical internal team');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 7: Resolving team by Unstop ID returns canonical internal team
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 7: Lookup by Unstop ID ---');
    const foundByUnstopId = await hackathonIdentityService.resolveTeamIdentity({
      source: 'UNSTOP',
      sourceId: 'CN-232323',
      leaderEmail: 'different.email@identity.test',
    });
    assert(foundByUnstopId.matchStrategy === 'EXACT_UNSTOP_ID', 'Matched via EXACT_UNSTOP_ID strategy');
    assert(foundByUnstopId.matchedTeam.teamId === canonicalTeam5Id, 'Lookup by Unstop ID returned canonical internal team');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 8: Leader email with different casing/whitespace matches correctly
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 8: Leader email casing & whitespace normalization ---');
    const resolvedCasing = await hackathonIdentityService.resolveTeamIdentity({
      source: 'UNSTOP',
      sourceId: 'IDTEST-NEW-CASE',
      leaderEmail: '   Dan.LEAD@IDENTITY.TEST   ',
    });
    assert(resolvedCasing.matchStrategy === 'EXACT_LEADER_EMAIL', 'Matched via EXACT_LEADER_EMAIL despite casing and whitespace');
    assert(resolvedCasing.matchedTeam.teamId === canonicalTeam5Id, 'Resolved to correct canonical team');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 9: Leader email with dots in gmail (john.doe@gmail.com vs johndoe@gmail.com) resolves to same team
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 9: Gmail dot-normalization ---');
    const gmailTeam = await hackathonIdentityService.processIncomingTeam({
      source: 'WEBSITE',
      sourceId: 'WEBTEST-GMAIL-01',
      teamName: 'IDENTITY_Gmail_Test',
      leader: { name: 'John Doe', email: 'john.doe@gmail.com' },
    });

    const gmailMatch = await hackathonIdentityService.resolveTeamIdentity({
      source: 'UNSTOP',
      sourceId: 'IDTEST-GMAIL-02',
      leaderEmail: 'johndoe@gmail.com',
    });
    assert(gmailMatch.matchStrategy === 'EXACT_LEADER_EMAIL', 'Matched dotless gmail variant via cleanEmail normalization');
    assert(gmailMatch.matchedTeam.teamId === gmailTeam.teamId, 'Resolved to same team');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 10: Unstop import with leader email matching existing website team updates/enriches team rather than creating duplicate
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 10: Unstop import enriches existing website team without duplication ---');
    const initialCount = await HackathonTeam.countDocuments({ teamId: canonicalTeam5Id });
    assert(initialCount === 1, 'Exactly one team before enrichment');

    await hackathonIdentityService.processIncomingTeam({
      source: 'UNSTOP',
      sourceId: 'CN-232323-DUPCHECK',
      teamName: 'IDENTITY_Dual_Source_Team',
      leader: { name: 'Dan Leader', email: 'dan.lead@identity.test', mobile: '9998887776' },
      members: [{ name: 'New Unstop Member', email: 'new.unstop.m@identity.test' }],
    });

    const finalCount = await HackathonTeam.countDocuments({ teamId: canonicalTeam5Id });
    assert(finalCount === 1, 'Still exactly one team after enrichment');
    const enrichedTeam = await HackathonTeam.findOne({ teamId: canonicalTeam5Id });
    assert(enrichedTeam.members.some((m) => m.email === 'new.unstop.m@identity.test'), 'New member enriched into existing team');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 11: Unstop import with member email overlap >= 50% and matching signals resolves to same team
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 11: Member overlap >= 50% match ---');
    const t11_team = await hackathonIdentityService.processIncomingTeam({
      source: 'WEBSITE',
      sourceId: 'WEBTEST-OVERLAP-1',
      teamName: 'IDENTITY_Member_Overlap_Team',
      leader: { name: 'Frank Leader', email: 'frank.lead@identity.test' },
      members: [
        { name: 'Member One', email: 'm1.overlap@identity.test' },
        { name: 'Member Two', email: 'm2.overlap@identity.test' },
      ],
    });

    // Incoming has different leader email, but both members overlap (100% member overlap)
    const t11_match = await hackathonIdentityService.resolveTeamIdentity({
      source: 'UNSTOP',
      sourceId: 'IDTEST-OVERLAP-2',
      leaderEmail: 'different.lead@identity.test',
      incomingMembers: [
        { email: 'm1.overlap@identity.test' },
        { email: 'm2.overlap@identity.test' },
      ],
    });

    assert(t11_match.matchStrategy === 'MEMBER_OVERLAP', 'Matched via MEMBER_OVERLAP');
    assert(t11_match.matchedTeam.teamId === t11_team.teamId, 'Matched to canonical team');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 12: Two teams with same team name but completely different emails/members are NOT auto-merged
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 12: Team name is strictly NON-UNIQUE: no auto-merge without email signals ---');
    const t12_a = await hackathonIdentityService.processIncomingTeam({
      source: 'WEBSITE',
      sourceId: 'WEBTEST-NAME-A',
      teamName: 'Cyber Knights',
      leader: { name: 'Knight One', email: 'knight1@identity.test' },
      members: [{ email: 'km1@identity.test' }],
    });

    const t12_b = await hackathonIdentityService.processIncomingTeam({
      source: 'UNSTOP',
      sourceId: 'IDTEST-NAME-B',
      teamName: 'Cyber Knights', // Same team name!
      leader: { name: 'Knight Two', email: 'knight2@identity.test' }, // Different leader!
      members: [{ email: 'km2@identity.test' }], // 0 overlap!
    });

    // Per identity architecture rules: Same name with different emails must NOT auto-merge!
    // It should be routed to the Admin Duplicate Queue for human verification.
    assert(t12_b.status === 'QUEUED_FOR_ADMIN', 'Same team name with different emails sent to Admin Queue');
    assert(t12_a.teamId !== t12_b.queueItem?.candidateMatches[0]?.teamId || t12_b.status !== 'LINKED', 'Did NOT auto-merge into team A');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 13: Team name matching alone without email signals routes to Admin Verification Queue
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 13: Supporting signal only -> Admin Verification Queue ---');
    const queueItem13 = await HackathonDuplicateQueue.findOne({
      incomingSourceId: 'IDTEST-NAME-B',
      status: 'PENDING',
    });
    assert(queueItem13 !== null, 'Found pending queue item for name-only collision');
    assert(queueItem13.candidateMatches.length > 0, 'Contains candidate matches');
    assert(queueItem13.candidateMatches[0].matchSignals.sameTeamName === true, 'Same team name signal flagged');
    assert(queueItem13.candidateMatches[0].matchSignals.exactLeaderEmailMatch === false, 'Exact leader email match is false');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 14: Ambiguous match candidate created in duplicate queue with PENDING status
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 14: Duplicate queue item status is PENDING ---');
    assert(queueItem13.status === 'PENDING', 'Queue item status is PENDING');
    assert(queueItem13.queueId.startsWith('DUP-'), `Queue ID has DUP- prefix (${queueItem13.queueId})`);
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 15: Duplicate queue record captures both incoming record and candidate match details
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 15: Queue record details capture ---');
    assert(queueItem13.incomingRecord.teamName === 'Cyber Knights', 'Captured incoming teamName');
    assert(queueItem13.incomingRecord.leader.email === 'knight2@identity.test', 'Captured incoming leader email');
    assert(queueItem13.candidateMatches[0].teamId === t12_a.teamId, 'Captured candidate internal teamId');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 16: Admin approves merge in duplicate queue: source IDs linked, members merged, internal ID preserved
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 16: Admin resolution: MERGE ---');
    const mergeRes = await hackathonIdentityService.resolveAdminVerification({
      queueId: queueItem13.queueId,
      decision: 'MERGE',
      targetTeamId: t12_a.teamId,
      adminUser: { name: 'Admin Test', email: 'admin@identity.test' },
      notes: 'Confirmed same team through offline call',
    });

    assert(mergeRes.success === true, 'Merge resolution succeeded');
    assert(mergeRes.action === 'MERGED', 'Action is MERGED');
    assert(mergeRes.teamId === t12_a.teamId, 'Canonical Internal Team ID preserved exactly');

    const mergedTeam = await HackathonTeam.findOne({ teamId: t12_a.teamId });
    assert(mergedTeam.sourceReferences.unstopTeamIds.includes('IDTEST-NAME-B'), 'Incoming source ID linked');
    assert(mergedTeam.sources.includes('UNSTOP'), 'UNSTOP source added to sources array');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 17: Admin selects KEEP_SEPARATE in duplicate queue: separate team created with its own internal ID
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 17: Admin resolution: KEEP_SEPARATE ---');
    // Create another candidate in queue
    const t17_incoming = await hackathonIdentityService.processIncomingTeam({
      source: 'UNSTOP',
      sourceId: 'IDTEST-SEP-01',
      teamName: 'Cyber Knights', // Name collision again
      leader: { name: 'Knight Three', email: 'knight3@identity.test' },
    });
    assert(t17_incoming.status === 'QUEUED_FOR_ADMIN', 'Queued for admin review');

    const sepRes = await hackathonIdentityService.resolveAdminVerification({
      queueId: t17_incoming.queueItem.queueId,
      decision: 'KEEP_SEPARATE',
      adminUser: { name: 'Admin Test' },
      notes: 'Different college, confirmed distinct teams',
    });

    assert(sepRes.success === true, 'Keep separate resolution succeeded');
    assert(sepRes.action === 'KEPT_SEPARATE', 'Action is KEPT_SEPARATE');
    assert(/^CAN-TEAM-\d{6}$/.test(sepRes.teamId), `New canonical ID issued (${sepRes.teamId})`);
    assert(sepRes.teamId !== t12_a.teamId, 'New canonical ID is distinct from candidate team');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 18: Unstop PPT import matches existing team by Unstop ID and attaches PPT to canonical internal team
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 18: PPT import matches by Unstop ID and attaches to canonical internal team ---');
    const pptRows = [
      {
        rowIndex: 2,
        status: 'MATCHED',
        unstopApplicationId: 'IDTEST-UNSTOP-002',
        regnId: 'IDTEST-UNSTOP-002',
        teamName: 'IDENTITY_Unstop_Pioneers',
        pptUrl: 'https://storage.googleapis.com/test-bucket/ppt18.pdf',
        reportUrl: 'https://storage.googleapis.com/test-bucket/ppt18.pdf',
        matchedTeam: {
          teamId: t2Res.teamId,
          unstopApplicationId: 'IDTEST-UNSTOP-002',
        },
      },
    ];

    const commitPptRes = await unstopParserService.commitPptImport({ rowsToImport: pptRows });
    assert(commitPptRes.pptCreated + commitPptRes.pptUpdated === 1, 'PPT import committed 1 record');

    const teamAfterPpt = await HackathonTeam.findOne({ teamId: t2Res.teamId });
    assert(teamAfterPpt.initialIdea.pptUrl === 'https://storage.googleapis.com/test-bucket/ppt18.pdf', 'PPT URL attached to canonical team initialIdea');
    assert(teamAfterPpt.pptSubmission?.pptUrl === 'https://storage.googleapis.com/test-bucket/ppt18.pdf', 'PPT subdocument populated');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 19: Unstop PPT import matches existing team by leader email when Unstop ID is missing
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 19: PPT import matches by leader email fallback ---');
    const pptRowsEmail = [
      {
        rowIndex: 3,
        status: 'MATCHED',
        unstopApplicationId: '', // No Unstop ID in PPT row!
        leaderEmail: 'alice.lead@identity.test',
        teamName: 'IDENTITY_Web_Innovators',
        pptUrl: 'https://storage.googleapis.com/test-bucket/ppt19.pdf',
        matchedTeam: {
          teamId: team1Id,
          leaderEmail: 'alice.lead@identity.test',
        },
      },
    ];

    await unstopParserService.commitPptImport({ rowsToImport: pptRowsEmail });
    const teamAfterPptEmail = await HackathonTeam.findOne({ teamId: team1Id });
    assert(teamAfterPptEmail.initialIdea.pptUrl === 'https://storage.googleapis.com/test-bucket/ppt19.pdf', 'Attached PPT via leader email fallback');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 20: Unstop PPT import NEVER creates new team if unmatched; routes to unmatched list
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 20: PPT import NEVER creates new team ---');
    const totalTeamsBefore = await HackathonTeam.countDocuments();

    const unmatchedPptRows = [
      {
        rowIndex: 4,
        status: 'UNMATCHED',
        unstopApplicationId: 'IDTEST-GHOST-999',
        teamName: 'Ghost Nonexistent Team',
        pptUrl: 'https://storage.googleapis.com/test-bucket/ghost.pdf',
        matchedTeam: null,
      },
    ];

    const unmatchedCommit = await unstopParserService.commitPptImport({ rowsToImport: unmatchedPptRows });
    const totalTeamsAfter = await HackathonTeam.countDocuments();

    assert(totalTeamsAfter === totalTeamsBefore, 'No new team created by unmatched PPT row');
    assert(unmatchedCommit.unmatchedSkipped === 1, 'Unmatched PPT row counted as unmatchedSkipped');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 21: Repeated registration import for same Unstop ID is idempotent and preserves internal ID
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 21: Idempotent re-import preserves canonical internal ID ---');
    const reImportRes = await hackathonIdentityService.processIncomingTeam({
      source: 'UNSTOP',
      sourceId: 'IDTEST-UNSTOP-002', // Same ID as Test 2
      teamName: 'IDENTITY_Unstop_Pioneers Updated Name',
      leader: {
        name: 'Charlie Leader Updated',
        email: 'charlie.unstop@identity.test',
      },
    });

    assert(reImportRes.status === 'LINKED', 'Re-import was recognized as idempotent update');
    assert(reImportRes.teamId === t2Res.teamId, 'Canonical Internal Team ID remained unchanged');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 22: Downstream submission references canonical internal ID and remains valid after source linking
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 22: Downstream HackathonSubmission references canonical teamId ---');
    const team1Doc = await HackathonTeam.findOne({ teamId: team1Id });
    await HackathonSubmission.deleteMany({ teamId: team1Id });

    const sub = await HackathonSubmission.create({
      team: team1Doc._id,
      teamId: team1Id,
      submitterName: 'Alice Leader',
      submitterEmail: 'alice.lead@identity.test',
      projectName: 'Alpha Innovation',
      projectDescription: 'Description for testing downstream integrity',
      problemStatement: 'Problem statement test',
      proposedSolution: 'Proposed solution test',
      techStack: ['Node.js', 'MongoDB', 'React'],
      githubUrl: 'https://github.com/test/alpha',
      hostedProjectUrl: 'https://alpha.test',
      linkedInUrl: 'https://linkedin.com/in/test',
      demoVideoUrl: 'https://youtube.com/watch?v=test',
      status: 'SUBMITTED',
      isLocked: false,
    });

    assert(sub.teamId === team1Id, 'Submission created with canonical Internal Team ID');
    const fetchedSub = await HackathonSubmission.findOne({ teamId: team1Id });
    assert(fetchedSub !== null && fetchedSub.projectName === 'Alpha Innovation', 'Downstream submission queryable by canonical teamId');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 23: Downstream editorial assignment and evaluation reference canonical internal ID and remain valid
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 23: Downstream Editorial Assignment & Evaluation integrity ---');
    await HackathonEditorialAssignment.deleteMany({ teamId: team1Id });
    await HackathonEditorialEvaluation.deleteMany({ teamId: team1Id });

    const dummyMemberId = new mongoose.Types.ObjectId();
    const assignment = await HackathonEditorialAssignment.create({
      team: team1Doc._id,
      teamId: team1Id,
      submission: sub._id,
      editorialMember: dummyMemberId,
      status: 'ACTIVE',
      assignedBy: dummyMemberId,
    });
    assert(assignment.teamId === team1Id, 'Editorial assignment references canonical teamId');

    const evaluation = await HackathonEditorialEvaluation.create({
      team: team1Doc._id,
      teamId: team1Id,
      submission: sub._id,
      assignment: assignment._id,
      editorialMember: dummyMemberId,
      scores: [
        { criterion: 'Innovation', score: 9, maxScore: 10 },
        { criterion: 'Feasibility', score: 8, maxScore: 10 },
      ],
      totalScore: 17,
      status: 'FINALIZED',
    });
    assert(evaluation.teamId === team1Id, 'Editorial evaluation references canonical teamId');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 24: Downstream certificate issued to canonical internal ID remains valid and verifiable
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 24: Downstream HackathonCertificate integrity ---');
    await HackathonCertificate.deleteMany({ teamId: team1Id });
    const cert = await HackathonCertificate.create({
      certificateId: 'CERT-IDTEST-0001',
      certificateNumber: 'CERT-IDTEST-0001',
      verificationCode: 'VERIFY-IDTEST-0001',
      type: 'PARTICIPATION',
      team: team1Doc._id,
      teamId: team1Id,
      teamName: 'IDENTITY_Web_Innovators',
      recipientName: 'Alice Leader',
      recipientEmail: 'alice.lead@identity.test',
      recipientRole: 'LEADER',
      status: 'ISSUED',
    });

    assert(cert.teamId === team1Id, 'Certificate references canonical teamId');
    const fetchedCert = await HackathonCertificate.findOne({ verificationCode: 'VERIFY-IDTEST-0001' });
    assert(fetchedCert.teamId === team1Id, 'Certificate verified and references canonical teamId');
    passedTests++;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 25: Audit log records source mapping and resolution events with actor and reason
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 25: Comprehensive Audit Logging for Identity Resolution ---');
    const logs = await HackathonAuditLog.find({
      action: { $in: ['TEAM_SOURCE_LINKED', 'TEAM_SOURCE_MERGED', 'TEAM_DUPLICATE_QUEUED', 'TEAM_SOURCE_REJECTED'] },
    });

    assert(logs.length > 0, `Audit logs recorded for identity operations (found ${logs.length})`);
    assert(logs.some((l) => l.action === 'TEAM_SOURCE_MERGED'), 'Audit log contains TEAM_SOURCE_MERGED');
    assert(logs.some((l) => l.action === 'TEAM_DUPLICATE_QUEUED'), 'Audit log contains TEAM_DUPLICATE_QUEUED');
    passedTests++;

    console.log('\n===============================================================');
    console.log(`=== ALL ${passedTests} OF 25 TEAM IDENTITY ARCHITECTURE TESTS PASSED! ===`);
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n❌ Test suite failed with error:', err);
    process.exit(1);
  } finally {
    // Cleanup test data
    await HackathonTeam.deleteMany({
      $or: [
        { 'leader.email': { $regex: /@identity\.test$/ } },
        { 'members.email': { $regex: /@identity\.test$/ } },
        { teamName: { $regex: /^IDENTITY_/ } },
        { 'sourceReferences.unstopTeamIds': { $regex: /^IDTEST-/ } },
        { 'sourceReferences.websiteRegistrationIds': { $regex: /^WEBTEST-/ } },
        { unstopApplicationId: { $regex: /^IDTEST-/ } },
      ],
    });
    await HackathonDuplicateQueue.deleteMany({
      incomingSourceId: { $regex: /^(IDTEST-|WEBTEST-)/ },
    });
    await HackathonSubmission.deleteMany({ teamId: { $regex: /^CAN-TEAM-/ } });
    await HackathonEditorialAssignment.deleteMany({ teamId: { $regex: /^CAN-TEAM-/ } });
    await HackathonEditorialEvaluation.deleteMany({ teamId: { $regex: /^CAN-TEAM-/ } });
    await HackathonCertificate.deleteMany({ verificationCode: 'VERIFY-IDTEST-0001' });

    await mongoose.disconnect();
    console.log('Database disconnected and test records cleaned up.');
  }
}

runTests();
