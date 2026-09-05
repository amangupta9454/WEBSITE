const HackathonTeam = require('../models/HackathonTeam');
const HackathonDuplicateQueue = require('../models/HackathonDuplicateQueue');
const HackathonAuditLog = require('../models/HackathonAuditLog');

/**
 * Normalization utilities
 */
function cleanString(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function cleanEmail(val) {
  const raw = cleanString(val).toLowerCase();
  if (!raw) return '';
  const parts = raw.split('@');
  if (parts.length !== 2) return raw;
  const [localPart, domain] = parts;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const cleanedLocal = localPart.replace(/\./g, '').split('+')[0];
    return `${cleanedLocal}@${domain}`;
  }
  return raw;
}

function getEmailQueryVariants(email) {
  const raw = cleanString(email).toLowerCase();
  if (!raw) return { variants: [], regex: null };
  const variants = [raw];
  const normalized = cleanEmail(raw);
  if (!variants.includes(normalized)) variants.push(normalized);

  const parts = raw.split('@');
  if (parts.length === 2 && (parts[1] === 'gmail.com' || parts[1] === 'googlemail.com')) {
    const dotless = parts[0].replace(/\./g, '').split('+')[0];
    const regexPattern = '^' + dotless.split('').join('\\.?') + '@(gmail|googlemail)\\.com$';
    return { variants, regex: new RegExp(regexPattern, 'i') };
  }
  return { variants, regex: null };
}

function normalizeTeamName(val) {
  return cleanString(val)
    .toLowerCase()
    .replace(/[_\-/()[\]:.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate permanent canonical Internal Team ID
 * Format: CAN-TEAM-000001
 * Strict Invariants: System generated, immutable, unique, never reused, independent of Website & Unstop IDs.
 */
async function generateInternalTeamId() {
  const count = await HackathonTeam.countDocuments();
  let candidateNum = count + 1;
  let candidateId = `CAN-TEAM-${String(candidateNum).padStart(6, '0')}`;

  while (await HackathonTeam.exists({ teamId: candidateId })) {
    candidateNum++;
    candidateId = `CAN-TEAM-${String(candidateNum).padStart(6, '0')}`;
  }

  return candidateId;
}

/**
 * Calculate member email overlap between incoming and existing members
 */
function calculateMemberOverlap(incomingMembers = [], existingMembers = []) {
  const incomingEmails = new Set(
    incomingMembers.map((m) => cleanEmail(typeof m === 'string' ? m : m.email)).filter(Boolean)
  );
  const existingEmails = new Set(
    existingMembers.map((m) => cleanEmail(typeof m === 'string' ? m : m.email)).filter(Boolean)
  );

  if (incomingEmails.size === 0 || existingEmails.size === 0) {
    return { overlapCount: 0, overlapRatio: 0, matchedEmails: [] };
  }

  const matchedEmails = [];
  incomingEmails.forEach((email) => {
    if (existingEmails.has(email)) {
      matchedEmails.push(email);
    }
  });

  const overlapCount = matchedEmails.length;
  const overlapRatio = overlapCount / Math.max(incomingEmails.size, 1);

  return {
    overlapCount,
    overlapRatio,
    matchedEmails,
    totalIncoming: incomingEmails.size,
    totalExisting: existingEmails.size,
  };
}

/**
 * Server-Side Identity Resolution Engine
 * Hierarchy:
 * 1. Existing source-reference mapping (Unstop ID or Website ID)
 * 2. Exact Leader Email (normalized)
 * 3. Member Email overlap (>= 50%)
 * 4. Supporting team info (Team Name is secondary signal, NEVER standalone)
 */
async function resolveTeamIdentity({
  websiteRegistrationId = '',
  unstopTeamId = '',
  sourceId = '',
  source = '',
  teamName = '',
  leader = {},
  leaderEmail = '',
  members = [],
  incomingMembers = [],
}) {
  let cleanWebId = cleanString(websiteRegistrationId);
  let cleanUnstopId = cleanString(unstopTeamId);
  if (!cleanWebId && (source === 'WEBSITE' || !source) && sourceId) {
    cleanWebId = cleanString(sourceId);
  }
  if (!cleanUnstopId && source === 'UNSTOP' && sourceId) {
    cleanUnstopId = cleanString(sourceId);
  }

  const effectiveLeaderEmail = leader?.email || leaderEmail || '';
  const normLeaderEmail = cleanEmail(effectiveLeaderEmail);
  const normName = normalizeTeamName(teamName);
  const effectiveMembers = Array.isArray(members) && members.length > 0 ? members : incomingMembers;

  // 1. Direct Source Reference Mapping
  if (cleanUnstopId) {
    const matchedByUnstop = await HackathonTeam.findOne({
      $or: [
        { 'sourceReferences.unstopTeamIds': cleanUnstopId },
        { unstopApplicationId: cleanUnstopId },
      ],
      isDeleted: { $ne: true },
    });
    if (matchedByUnstop) {
      return {
        decision: 'CONFIDENT_MATCH',
        matchStrategy: 'EXACT_UNSTOP_ID',
        matchedTeam: matchedByUnstop,
        confidenceScore: 100,
        notes: `Matched existing team by Unstop ID: ${cleanUnstopId}`,
      };
    }
  }

  if (cleanWebId) {
    const matchedByWeb = await HackathonTeam.findOne({
      'sourceReferences.websiteRegistrationIds': cleanWebId,
      isDeleted: { $ne: true },
    });
    if (matchedByWeb) {
      return {
        decision: 'CONFIDENT_MATCH',
        matchStrategy: 'EXACT_WEBSITE_ID',
        matchedTeam: matchedByWeb,
        confidenceScore: 100,
        notes: `Matched existing team by Website Registration ID: ${cleanWebId}`,
      };
    }
  }

  // 2. Exact Leader Email Match (Strongest cross-source identity signal)
  if (normLeaderEmail) {
    const { variants, regex } = getEmailQueryVariants(effectiveLeaderEmail);
    const orClauses = [{ 'leader.email': { $in: variants } }];
    if (regex) orClauses.push({ 'leader.email': regex });

    const candidatesByLeader = await HackathonTeam.find({
      $or: orClauses,
      isDeleted: { $ne: true },
    });

    if (candidatesByLeader.length === 1) {
      return {
        decision: 'CONFIDENT_MATCH',
        matchStrategy: 'EXACT_LEADER_EMAIL',
        matchedTeam: candidatesByLeader[0],
        confidenceScore: 95,
        notes: `Strong match by Leader Email: ${normLeaderEmail}`,
      };
    }

    if (candidatesByLeader.length > 1) {
      // Multiple teams with same leader email -> Trapped for Admin Verification
      return {
        decision: 'AMBIGUOUS_MATCH',
        matchStrategy: 'MULTIPLE_TEAMS_SAME_LEADER',
        matchedTeam: null,
        candidateMatches: candidatesByLeader.map((t) => ({
          teamId: t.teamId,
          teamName: t.teamName,
          leaderName: t.leader?.name,
          leaderEmail: t.leader?.email,
          matchSignals: { exactLeaderEmailMatch: true },
          matchScore: 80,
          notes: 'Same leader registered multiple teams',
        })),
        confidenceScore: 50,
        notes: `Multiple active teams found with Leader Email: ${normLeaderEmail}`,
      };
    }
  }

  // 3. Member Email Overlap Check
  const incomingMemberEmails = effectiveMembers
    .map((m) => cleanEmail(typeof m === 'string' ? m : m.email))
    .filter(Boolean);

  if (incomingMemberEmails.length > 0) {
    const teamsWithMemberOverlap = await HackathonTeam.find({
      $or: [
        { 'members.email': { $in: incomingMemberEmails } },
        { 'leader.email': { $in: incomingMemberEmails } },
      ],
      isDeleted: { $ne: true },
    });

    if (teamsWithMemberOverlap.length > 0) {
      const candidates = [];

      for (const t of teamsWithMemberOverlap) {
        const overlap = calculateMemberOverlap(effectiveMembers, t.members);
        const leaderMatchedAsMember = incomingMemberEmails.includes(cleanEmail(t.leader?.email));
        const sameName = normName && normalizeTeamName(t.teamName) === normName;

        let score = Math.round(overlap.overlapRatio * 60);
        if (leaderMatchedAsMember) score += 20;
        if (sameName) score += 15;

        candidates.push({
          teamId: t.teamId,
          teamName: t.teamName,
          leaderName: t.leader?.name,
          leaderEmail: t.leader?.email,
          matchSignals: {
            exactLeaderEmailMatch: false,
            memberOverlapCount: overlap.overlapCount,
            totalIncomingMembers: overlap.totalIncoming,
            totalExistingMembers: overlap.totalExisting,
            overlapRatio: overlap.overlapRatio,
            sameTeamName: sameName,
          },
          matchScore: score,
          notes: `${overlap.overlapCount} member(s) overlap with incoming record`,
        });
      }

      // Filter significant candidates
      const significant = candidates.filter(
        (c) => c.matchSignals.overlapRatio >= 0.5 || c.matchScore >= 50
      );

      if (significant.length === 1 && significant[0].matchSignals.overlapRatio >= 0.5) {
        const matched = teamsWithMemberOverlap.find((t) => t.teamId === significant[0].teamId);
        return {
          decision: 'CONFIDENT_MATCH',
          matchStrategy: 'MEMBER_OVERLAP',
          matchedTeam: matched,
          candidateMatches: significant,
          confidenceScore: 75,
          notes: `Matched team ${matched.teamId} with >=50% member email overlap`,
        };
      } else if (significant.length > 0) {
        return {
          decision: 'AMBIGUOUS_MATCH',
          matchStrategy: 'MEMBER_OVERLAP',
          matchedTeam: null,
          candidateMatches: significant,
          confidenceScore: 60,
          notes: `Found ${significant.length} candidate team(s) with >=50% member overlap`,
        };
      }
    }
  }

  // 4. Team Name Check alone (MANDATORY RULE: Team Name alone is NEVER unique and NEVER auto-merges)
  if (normName) {
    const rawName = cleanString(teamName);
    const teamsWithSameName = await HackathonTeam.find({
      $or: [
        { teamName: new RegExp(`^${rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        { teamName: new RegExp(`^${normName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
      isDeleted: { $ne: true },
    });

    if (teamsWithSameName.length > 0) {
      return {
        decision: 'AMBIGUOUS_MATCH',
        matchStrategy: 'NAME_ONLY_COLLISION',
        matchedTeam: null,
        candidateMatches: teamsWithSameName.map((t) => ({
          teamId: t.teamId,
          teamName: t.teamName,
          leaderName: t.leader?.name,
          leaderEmail: t.leader?.email,
          matchSignals: {
            exactLeaderEmailMatch: false,
            memberOverlapCount: 0,
            overlapRatio: 0,
            sameTeamName: true,
          },
          matchScore: 30,
          notes: 'Same team name, but different leader email and 0 member overlap (Never auto-merge)',
        })),
        confidenceScore: 30,
        notes: `Found ${teamsWithSameName.length} existing team(s) with identical name. Sent to Admin Verification Queue.`,
      };
    }
  }

  return {
    decision: 'NO_MATCH',
    matchStrategy: 'NONE',
    matchedTeam: null,
    confidenceScore: 0,
    notes: 'No credible existing team match found. Safe to create fresh Internal Team.',
  };
}

/**
 * Ingest / Process Incoming Team with Identity Resolution
 */
async function processIncomingTeam({
  websiteRegistrationId = '',
  unstopTeamId = '',
  sourceId = '',
  teamName = '',
  track = 'General Track',
  domain = '',
  leader = {},
  members = [],
  initialIdea = {},
  pptUrl = '',
  submittedLinks = {},
  rawRecord = {},
  source = 'WEBSITE',
  autoCreate = true,
}) {
  let cleanWebId = cleanString(websiteRegistrationId);
  let cleanUnstopId = cleanString(unstopTeamId);
  if (!cleanWebId && source === 'WEBSITE' && sourceId) {
    cleanWebId = cleanString(sourceId);
  }
  if (!cleanUnstopId && source === 'UNSTOP' && sourceId) {
    cleanUnstopId = cleanString(sourceId);
  }

  const resolution = await resolveTeamIdentity({
    websiteRegistrationId: cleanWebId,
    unstopTeamId: cleanUnstopId,
    sourceId,
    source,
    teamName,
    leader,
    members,
  });

  // CASE 1: CONFIDENT MATCH -> Auto-link to existing Internal Team
  if (resolution.decision === 'CONFIDENT_MATCH' && resolution.matchedTeam) {
    const existingTeam = resolution.matchedTeam;

    if (!existingTeam.sourceReferences) {
      existingTeam.sourceReferences = { websiteRegistrationIds: [], unstopTeamIds: [] };
    }

    // Link source IDs idempotently
    if (cleanWebId && !existingTeam.sourceReferences.websiteRegistrationIds.includes(cleanWebId)) {
      existingTeam.sourceReferences.websiteRegistrationIds.push(cleanWebId);
    }
    if (cleanUnstopId && !existingTeam.sourceReferences.unstopTeamIds.includes(cleanUnstopId)) {
      existingTeam.sourceReferences.unstopTeamIds.push(cleanUnstopId);
    }
    if (cleanUnstopId && !existingTeam.unstopApplicationId) {
      existingTeam.unstopApplicationId = cleanUnstopId;
    }

    // Ensure source tags
    if (cleanWebId && !existingTeam.sources.includes('WEBSITE')) {
      existingTeam.sources.push('WEBSITE');
    }
    if (cleanUnstopId && !existingTeam.sources.includes('UNSTOP')) {
      existingTeam.sources.push('UNSTOP');
    }

    // Merge members without duplicating emails
    if (Array.isArray(members) && members.length > 0) {
      if (!Array.isArray(existingTeam.members)) existingTeam.members = [];
      const existingMemberEmails = new Set(existingTeam.members.map((m) => cleanEmail(m.email)));

      for (const m of members) {
        const mEmail = cleanEmail(m.email);
        if (mEmail && !existingMemberEmails.has(mEmail)) {
          existingTeam.members.push({
            name: cleanString(m.name) || mEmail.split('@')[0] || 'Member',
            email: mEmail,
            mobile: cleanString(m.mobile || m.phone),
            college: cleanString(m.college),
          });
          existingMemberEmails.add(mEmail);
        }
      }
    }

    // Update PPT if provided and target team lacks it
    if (pptUrl) {
      if (!existingTeam.initialIdea) existingTeam.initialIdea = {};
      if (!existingTeam.initialIdea.pptUrl) {
        existingTeam.initialIdea.pptUrl = pptUrl;
      }
    }

    await existingTeam.save();

    await HackathonAuditLog.log({
      actorId: 'system',
      actorName: 'Identity Resolution Engine',
      role: 'system',
      action: 'TEAM_SOURCE_LINKED',
      targetEntity: 'HackathonTeam',
      targetId: existingTeam.teamId,
      reason: `Linked incoming ${source} record (${cleanWebId || cleanUnstopId}) to canonical internal team ${existingTeam.teamId}`,
    });

    return {
      status: 'LINKED',
      action: 'EXISTING_LINKED',
      team: existingTeam,
      teamId: existingTeam.teamId,
      matchStrategy: resolution.matchStrategy,
      notes: resolution.notes,
    };
  }

  // CASE 2: AMBIGUOUS MATCH -> Put in Admin Verification Queue
  if (resolution.decision === 'AMBIGUOUS_MATCH') {
    const queueId = `DUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const queueItem = await HackathonDuplicateQueue.create({
      queueId,
      incomingSource: source,
      incomingSourceId: cleanWebId || cleanUnstopId || '',
      incomingRecord: {
        websiteRegistrationId: cleanWebId,
        unstopTeamId: cleanUnstopId,
        teamName,
        track,
        leader,
        members,
        initialIdea,
        pptUrl,
        submittedLinks,
        rawRecord,
      },
      candidateMatches: resolution.candidateMatches || [],
      confidence: 'AMBIGUOUS',
      status: 'PENDING',
    });

    await HackathonAuditLog.log({
      actorId: 'system',
      actorName: 'Identity Resolution Engine',
      role: 'system',
      action: 'TEAM_DUPLICATE_QUEUED',
      targetEntity: 'HackathonDuplicateQueue',
      targetId: queueItem.queueId,
      newState: queueItem.toObject(),
      reason: resolution.notes || `Ambiguous ${source} match queued for admin verification`,
    });

    return {
      status: 'QUEUED_FOR_ADMIN',
      action: 'AMBIGUOUS_QUEUED',
      queueItem,
      queueId: queueItem.queueId,
      matchStrategy: resolution.matchStrategy,
      candidateMatches: resolution.candidateMatches,
      notes: resolution.notes,
    };
  }

  // CASE 3: NO MATCH -> Create fresh Internal Team ID
  if (autoCreate) {
    const newTeamId = await generateInternalTeamId();

    const createdTeam = await HackathonTeam.create({
      teamId: newTeamId,
      unstopApplicationId: cleanUnstopId,
      sourceReferences: {
        websiteRegistrationIds: cleanWebId ? [cleanWebId] : [],
        unstopTeamIds: cleanUnstopId ? [cleanUnstopId] : [],
      },
      sources: source === 'WEBSITE' || cleanWebId
        ? ['WEBSITE']
        : source === 'UNSTOP' || cleanUnstopId
        ? ['UNSTOP']
        : ['MANUAL'],
      source: cleanWebId ? 'DIRECT_REGISTRATION' : 'UNSTOP_IMPORT',
      teamName: cleanString(teamName) || 'Untitled Team',
      track: cleanString(track) || 'General Track',
      leader: {
        name: cleanString(leader.name),
        email: cleanEmail(leader.email),
        mobile: cleanString(leader.mobile || leader.phone),
        college: cleanString(leader.college),
        state: cleanString(leader.state),
        gender: cleanString(leader.gender),
        location: cleanString(leader.location),
        course: cleanString(leader.course),
        specialization: cleanString(leader.specialization),
        organisation: cleanString(leader.organisation || leader.college),
        designation: cleanString(leader.designation),
      },
      members: Array.isArray(members)
        ? members.map((m) => ({
            name: cleanString(m.name) || cleanString(m.email).split('@')[0] || 'Member',
            email: cleanEmail(m.email),
            mobile: cleanString(m.mobile || m.phone),
            college: cleanString(m.college),
          }))
        : [],
      initialIdea: {
        title: cleanString(initialIdea.title),
        description: cleanString(initialIdea.description),
        problemStatement: cleanString(initialIdea.problemStatement),
        proposedSolution: cleanString(initialIdea.proposedSolution),
        techStack: Array.isArray(initialIdea.techStack) ? initialIdea.techStack : [],
        pptUrl: cleanString(pptUrl || initialIdea.pptUrl),
        theme: cleanString(initialIdea.theme),
      },
      submittedLinks: submittedLinks || {},
      status: 'IMPORTED',
      paymentStatus: 'NOT_REQUIRED',
    });

    return {
      status: 'CREATED',
      action: 'NEW_TEAM_CREATED',
      team: createdTeam,
      teamId: createdTeam.teamId,
      matchStrategy: 'NONE',
      notes: 'Fresh team registered with new canonical Internal Team ID',
    };
  }

  return {
    status: 'NO_MATCH',
    action: 'NONE',
  };
}

/**
 * Admin Verification / Duplicate Resolution Action Handler
 * Decisions:
 * - MERGE: Link incoming source ID to target internal team, merge members, preserve Internal Team ID.
 * - KEEP_SEPARATE: Generate a new Internal Team ID for incoming record.
 * - REJECT: Discard incoming record.
 */
async function resolveAdminVerification({
  queueId,
  decision,
  targetTeamId = '',
  adminUser = {},
  notes = '',
  req = null,
}) {
  const queueItem = await HackathonDuplicateQueue.findOne({
    $or: [
      { queueId },
      ...(String(queueId).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: queueId }] : []),
    ],
  });
  if (!queueItem) {
    throw new Error(`Queue item ${queueId} not found`);
  }
  if (queueItem.status !== 'PENDING') {
    throw new Error(`Queue item ${queueId} has already been resolved as ${queueItem.status}`);
  }

  const incoming = queueItem.incomingRecord || {};

  // ── ACTION 1: MERGE / LINK TO EXISTING TEAM ──────────────────────────────
  if (decision === 'MERGE') {
    if (!targetTeamId) {
      throw new Error('Target Team ID is required to merge');
    }

    const targetTeam = await HackathonTeam.findOne({
      teamId: targetTeamId.toUpperCase(),
      isDeleted: { $ne: true },
    });

    if (!targetTeam) {
      throw new Error(`Target team "${targetTeamId}" not found or deleted`);
    }

    const prevTeamSnapshot = targetTeam.toObject();

    if (!targetTeam.sourceReferences) {
      targetTeam.sourceReferences = { websiteRegistrationIds: [], unstopTeamIds: [] };
    }

    // Link source IDs without losing existing ones
    if (incoming.websiteRegistrationId && !targetTeam.sourceReferences.websiteRegistrationIds.includes(incoming.websiteRegistrationId)) {
      targetTeam.sourceReferences.websiteRegistrationIds.push(incoming.websiteRegistrationId);
    }
    if (incoming.unstopTeamId && !targetTeam.sourceReferences.unstopTeamIds.includes(incoming.unstopTeamId)) {
      targetTeam.sourceReferences.unstopTeamIds.push(incoming.unstopTeamId);
    }
    if (incoming.unstopTeamId && !targetTeam.unstopApplicationId) {
      targetTeam.unstopApplicationId = incoming.unstopTeamId;
    }

    // Sync sources
    if (incoming.websiteRegistrationId && !targetTeam.sources.includes('WEBSITE')) {
      targetTeam.sources.push('WEBSITE');
    }
    if (incoming.unstopTeamId && !targetTeam.sources.includes('UNSTOP')) {
      targetTeam.sources.push('UNSTOP');
    }

    // Merge members
    if (Array.isArray(incoming.members) && incoming.members.length > 0) {
      if (!Array.isArray(targetTeam.members)) targetTeam.members = [];
      const existingMemberEmails = new Set(targetTeam.members.map((m) => cleanEmail(m.email)));

      for (const m of incoming.members) {
        const mEmail = cleanEmail(m.email);
        if (mEmail && !existingMemberEmails.has(mEmail)) {
          targetTeam.members.push({
            name: cleanString(m.name) || mEmail.split('@')[0] || 'Member',
            email: mEmail,
            mobile: cleanString(m.mobile || m.phone),
            college: cleanString(m.college),
          });
          existingMemberEmails.add(mEmail);
        }
      }
    }

    // Update PPT if missing
    if (incoming.pptUrl && (!targetTeam.initialIdea || !targetTeam.initialIdea.pptUrl)) {
      if (!targetTeam.initialIdea) targetTeam.initialIdea = {};
      targetTeam.initialIdea.pptUrl = incoming.pptUrl;
    }

    await targetTeam.save();

    // Update Queue record
    queueItem.status = 'MERGED';
    queueItem.resolution = {
      action: 'MERGE',
      targetTeamId: targetTeam.teamId,
      resolvedBy: {
        id: adminUser._id || adminUser.id || 'admin',
        name: adminUser.name || 'Admin',
        email: adminUser.email || '',
      },
      resolvedAt: new Date(),
      notes: notes || 'Admin merged incoming source record into existing Internal Team',
    };
    await queueItem.save();

    // Audit Log
    await HackathonAuditLog.log({
      actorId: adminUser._id || adminUser.id || 'admin',
      actorName: adminUser.name || 'Admin',
      actorEmail: adminUser.email || '',
      role: 'admin',
      action: 'TEAM_SOURCE_MERGED',
      targetEntity: 'HackathonTeam',
      targetId: targetTeam.teamId,
      previousState: prevTeamSnapshot,
      newState: targetTeam.toObject(),
      reason: `Admin merged incoming ${queueItem.incomingSource} record (${queueItem.incomingSourceId}) into ${targetTeam.teamId}`,
      req,
    });

    return {
      success: true,
      action: 'MERGED',
      team: targetTeam,
      teamId: targetTeam.teamId,
      message: `Successfully linked source record to existing team ${targetTeam.teamId}`,
    };
  }

  // ── ACTION 2: KEEP SEPARATE ──────────────────────────────────────────────
  if (decision === 'KEEP_SEPARATE') {
    const newTeamId = await generateInternalTeamId();

    const createdTeam = await HackathonTeam.create({
      teamId: newTeamId,
      unstopApplicationId: incoming.unstopTeamId || '',
      sourceReferences: {
        websiteRegistrationIds: incoming.websiteRegistrationId ? [incoming.websiteRegistrationId] : [],
        unstopTeamIds: incoming.unstopTeamId ? [incoming.unstopTeamId] : [],
      },
      sources: incoming.websiteRegistrationId ? ['WEBSITE'] : ['UNSTOP'],
      source: incoming.websiteRegistrationId ? 'DIRECT_REGISTRATION' : 'UNSTOP_IMPORT',
      teamName: cleanString(incoming.teamName) || 'Untitled Team',
      track: cleanString(incoming.track) || 'General Track',
      leader: incoming.leader || {},
      members: Array.isArray(incoming.members)
        ? incoming.members.map((m) => ({
            name: cleanString(m.name) || cleanString(m.email).split('@')[0] || 'Member',
            email: cleanEmail(m.email),
            mobile: cleanString(m.mobile || m.phone),
            college: cleanString(m.college),
          }))
        : [],
      initialIdea: incoming.initialIdea || {},
      submittedLinks: incoming.submittedLinks || {},
      status: 'IMPORTED',
      paymentStatus: 'NOT_REQUIRED',
    });

    queueItem.status = 'KEPT_SEPARATE';
    queueItem.resolution = {
      action: 'KEEP_SEPARATE',
      targetTeamId: createdTeam.teamId,
      resolvedBy: {
        id: adminUser._id || adminUser.id || 'admin',
        name: adminUser.name || 'Admin',
        email: adminUser.email || '',
      },
      resolvedAt: new Date(),
      notes: notes || 'Admin verified records represent distinct teams; created new Internal Team ID',
    };
    await queueItem.save();

    await HackathonAuditLog.log({
      actorId: adminUser._id || adminUser.id || 'admin',
      actorName: adminUser.name || 'Admin',
      actorEmail: adminUser.email || '',
      role: 'admin',
      action: 'TEAM_KEPT_SEPARATE',
      targetEntity: 'HackathonTeam',
      targetId: createdTeam.teamId,
      newState: createdTeam.toObject(),
      reason: `Admin verified ${queueItem.incomingSourceId} as distinct; created ${createdTeam.teamId}`,
      req,
    });

    return {
      success: true,
      action: 'KEPT_SEPARATE',
      team: createdTeam,
      teamId: createdTeam.teamId,
      message: `Created distinct Internal Team ${createdTeam.teamId}`,
    };
  }

  // ── ACTION 3: REJECT ─────────────────────────────────────────────────────
  if (decision === 'REJECT') {
    queueItem.status = 'REJECTED';
    queueItem.resolution = {
      action: 'REJECT',
      targetTeamId: '',
      resolvedBy: {
        id: adminUser._id || adminUser.id || 'admin',
        name: adminUser.name || 'Admin',
        email: adminUser.email || '',
      },
      resolvedAt: new Date(),
      notes: notes || 'Admin rejected incoming source record as invalid/duplicate',
    };
    await queueItem.save();

    await HackathonAuditLog.log({
      actorId: adminUser._id || adminUser.id || 'admin',
      actorName: adminUser.name || 'Admin',
      actorEmail: adminUser.email || '',
      role: 'admin',
      action: 'TEAM_SOURCE_REJECTED',
      targetEntity: 'HackathonTeam',
      targetId: queueItem.incomingSourceId || queueItem.queueId,
      reason: `Admin rejected incoming ${queueItem.incomingSource} duplicate record`,
      req,
    });

    return {
      success: true,
      action: 'REJECTED',
      message: `Rejected incoming record ${queueItem.incomingSourceId}`,
    };
  }

  throw new Error(`Unsupported decision "${decision}". Supported: MERGE, KEEP_SEPARATE, REJECT`);
}

module.exports = {
  cleanEmail,
  normalizeTeamName,
  generateInternalTeamId,
  calculateMemberOverlap,
  resolveTeamIdentity,
  processIncomingTeam,
  resolveAdminVerification,
};
