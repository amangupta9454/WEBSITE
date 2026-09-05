const xlsx = require('xlsx');
const HackathonTeam = require('../models/HackathonTeam');

/**
 * Standard fuzzy field dictionary for Unstop Excel columns
 */
const FIELD_MATCHERS = {
  unstopApplicationId: [
    'application id',
    'registration id',
    'unstop id',
    'team id',
    'id',
    'reg id',
    'app id',
    'unstop application id',
    'unstop team id',
    'participant id',
    'application no',
    'registration no',
  ],
  teamName: [
    'team name',
    'team',
    'teamname',
    'group name',
    'project title/team name',
    'name of the team',
    'name of team',
  ],
  track: [
    'track',
    'theme',
    'category',
    'domain',
    'sub-theme',
    'choose your track',
    'problem track',
    'hackathon track',
    'preferred track',
    'selected track',
  ],
  leaderName: [
    'leader name',
    'team leader name',
    'leader',
    'team leader',
    'name (team leader)',
    'full name (team leader)',
    'candidate name',
    'name',
    'full name',
    'first name',
    'participant name',
  ],
  leaderEmail: [
    'leader email',
    'team leader email',
    'email',
    'email address',
    'leader email id',
    'team leader email id',
    'candidate email',
    'email id',
  ],
  leaderMobile: [
    'leader mobile',
    'leader phone',
    'mobile',
    'phone',
    'contact',
    'leader contact',
    'whatsapp number',
    'phone number',
    'contact number',
    'mobile number',
    'mobile no',
    'phone no',
  ],
  leaderCollege: [
    'leader college',
    'college',
    'university',
    'institution',
    'college name',
    'organization',
    'institute name',
    'school/college',
    'institute',
    'university name',
  ],
  leaderState: [
    'state',
    'location',
    'city',
    'leader state',
    'region',
    'current state',
    'state name',
  ],
  ideaTitle: [
    'idea title',
    'project title',
    'project name',
    'idea name',
    'title of the project',
    'title',
    'synopsis title',
    'title of idea',
  ],
  ideaDescription: [
    'idea description',
    'project description',
    'abstract',
    'brief idea',
    'problem description',
    'description',
    'idea overview',
    'project summary',
    'summary',
    'brief overview',
    'solution overview',
  ],
  problemStatement: [
    'problem statement',
    'problem',
    'the problem',
    'challenge addressed',
    'problem statement description',
  ],
  proposedSolution: [
    'proposed solution',
    'solution',
    'the solution',
    'approach',
    'solution description',
    'detailed solution',
  ],
  techStack: [
    'tech stack',
    'technology',
    'tools used',
    'technologies',
    'tech-stack',
    'programming languages',
    'technologies used',
    'frameworks',
  ],
  pptUrl: [
    'ppt',
    'ppt link',
    'presentation',
    'presentation link',
    'pitch deck',
    'deck link',
    'google drive link',
    'drive link',
    'submission file',
    'submission url',
    'ppt/presentation',
    'presentation url',
    'file link',
    'document link',
    'pitch deck link',
    'ppt url',
    'upload ppt',
  ],
  githubUrl: [
    'github',
    'github link',
    'repo',
    'repository',
    'github url',
    'github repository',
  ],
  hostedProjectUrl: [
    'hosted link',
    'live demo',
    'live url',
    'website link',
    'demo link',
    'deployed link',
    'project link',
  ],
  demoVideoUrl: [
    'video demo',
    'demo video',
    'youtube link',
    'video link',
    'loom link',
    'drive video link',
    'youtube video',
  ],
  linkedInUrl: [
    'linkedin',
    'linkedin url',
    'linkedin profile',
    'leader linkedin',
  ],
};

/**
 * Clean string utility
 */
function cleanString(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Clean & validate email
 */
function cleanEmail(val) {
  const s = cleanString(val).toLowerCase();
  return s;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Clean phone number
 */
function cleanPhone(val) {
  let s = cleanString(val);
  // Remove non-numeric characters except leading +
  s = s.replace(/[^\d+]/g, '');
  return s;
}

/**
 * Clean URL (handles bare drive.google.com or github.com)
 */
function cleanUrl(val) {
  let s = cleanString(val);
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return s;
  }
  if (s.includes('.com') || s.includes('.io') || s.includes('.app') || s.includes('.org')) {
    return `https://${s}`;
  }
  return s;
}

/**
 * Clean Tech Stack to array
 */
function cleanTechStack(val) {
  const s = cleanString(val);
  if (!s) return [];
  return s
    .split(/[,;\n/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Normalize header name for matching
 */
function normalizeHeader(header) {
  return String(header)
    .toLowerCase()
    .replace(/[_\-/()[\].:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find best matching target field for a given column header
 */
function matchColumnHeader(header) {
  const norm = normalizeHeader(header);
  if (!norm) return null;

  // 1. Check dynamic member patterns first (e.g., "Member 1 Name", "Team Member 2 Email", etc.)
  const memberMatch = norm.match(/(?:team\s*)?member\s*(\d+)\s*(name|email|college|mobile|phone|state)?/);
  if (memberMatch) {
    const memberNum = memberMatch[1];
    const subField = memberMatch[2] || 'name';
    const fieldType =
      subField === 'email'
        ? 'Email'
        : subField === 'college'
        ? 'College'
        : subField === 'mobile' || subField === 'phone'
        ? 'Mobile'
        : subField === 'state'
        ? 'State'
        : 'Name';
    return `member_${memberNum}_${fieldType}`;
  }

  // 2. Exact match check
  for (const [field, matchers] of Object.entries(FIELD_MATCHERS)) {
    for (const matcher of matchers) {
      if (norm === matcher) {
        return field;
      }
    }
  }

  // 3. Longest matcher priority with word boundary check
  const allMatchers = [];
  for (const [field, matchers] of Object.entries(FIELD_MATCHERS)) {
    for (const matcher of matchers) {
      allMatchers.push({ field, matcher, len: matcher.length });
    }
  }
  allMatchers.sort((a, b) => b.len - a.len);

  for (const { field, matcher } of allMatchers) {
    if (matcher.length >= 4) {
      const escaped = matcher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
      if (regex.test(norm)) {
        return field;
      }
    }
  }

  return null;
}

/**
 * Parse Excel Workbook from buffer
 */
exports.parseWorkbookBuffer = (buffer) => {
  const workbook = xlsx.read(buffer, {
    type: 'buffer',
    cellDates: true,
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  return {
    sheetNames: workbook.SheetNames,
    workbook,
  };
};

/**
 * Extract raw rows and detect column mapping from a specific sheet
 */
exports.extractSheetData = (workbook, requestedSheetName = null) => {
  const sheetName = requestedSheetName && workbook.SheetNames.includes(requestedSheetName)
    ? requestedSheetName
    : workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in uploaded workbook.`);
  }

  // Convert to array of arrays to identify header row
  const rawAOA = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rawAOA || rawAOA.length === 0) {
    return {
      sheetName,
      headers: [],
      rawRows: [],
      mappedColumns: {},
    };
  }

  // Find the header row: first row with multiple non-empty string values
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawAOA.length, 10); i++) {
    const row = rawAOA[i];
    const stringCells = row.filter((c) => cleanString(c).length > 0);
    if (stringCells.length >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rawAOA[headerRowIndex].map((h) => cleanString(h));
  const headers = rawHeaders.filter((h) => h.length > 0);

  // Map header column indices to target fields
  const mappedColumns = {};
  rawHeaders.forEach((header, colIdx) => {
    if (!header) return;
    const matchedField = matchColumnHeader(header);
    if (matchedField) {
      mappedColumns[colIdx] = {
        headerName: header,
        targetField: matchedField,
      };
    }
  });

  // Extract data rows below header
  const dataRows = [];
  for (let r = headerRowIndex + 1; r < rawAOA.length; r++) {
    const row = rawAOA[r];
    // Check if row has any non-empty cell
    const hasData = row.some((cell) => cleanString(cell).length > 0);
    if (hasData) {
      // Build raw key-value dictionary to preserve original columns
      const rawRowObj = {};
      rawHeaders.forEach((hdr, idx) => {
        if (hdr) {
          rawRowObj[hdr] = cleanString(row[idx]);
        }
      });
      dataRows.push({
        rowIndex: r + 1, // 1-indexed for user display
        cells: row,
        rawObj: rawRowObj,
      });
    }
  }

  return {
    sheetName,
    headers,
    rawHeaders,
    rawRows: dataRows,
    mappedColumns,
  };
};

/**
 * Generate unique internal Team ID (e.g. CAN-1001)
 */
async function generateTeamId() {
  const count = await HackathonTeam.countDocuments();
  const nextNum = 1000 + count + 1;
  let candidate = `CAN-${nextNum}`;
  let exists = await HackathonTeam.findOne({ teamId: candidate });
  let offset = 1;
  while (exists) {
    candidate = `CAN-${nextNum + offset}`;
    exists = await HackathonTeam.findOne({ teamId: candidate });
    offset++;
  }
  return candidate;
}

/**
 * Normalize a single raw row into structured HackathonTeam object
 */
function normalizeTeamRow(row, mappedColumns, customMapping = {}) {
  const { rowIndex, cells, rawObj } = row;

  // Combine automatic mapped columns with any admin custom override
  // customMapping format: { "Team Name Column": "teamName", ... }
  const fieldValues = {};
  const membersMap = {};

  Object.entries(mappedColumns).forEach(([colIdxStr, colInfo]) => {
    const colIdx = parseInt(colIdxStr, 10);
    const cellVal = cleanString(cells[colIdx]);
    const targetField = customMapping[colInfo.headerName] || colInfo.targetField;

    if (!targetField) return;

    if (targetField.startsWith('member_')) {
      // Format: member_1_Name, member_1_Email
      const parts = targetField.split('_');
      const memberIdx = parts[1];
      const memberField = parts[2]?.toLowerCase() || 'name';
      if (!membersMap[memberIdx]) membersMap[memberIdx] = {};
      membersMap[memberIdx][memberField] = cellVal;
    } else {
      fieldValues[targetField] = cellVal;
    }
  });

  // Apply any customMapping keys directly from rawObj
  Object.entries(customMapping).forEach(([rawHeader, targetField]) => {
    if (targetField && rawObj[rawHeader] !== undefined) {
      if (targetField.startsWith('member_')) {
        const parts = targetField.split('_');
        const memberIdx = parts[1];
        const memberField = parts[2]?.toLowerCase() || 'name';
        if (!membersMap[memberIdx]) membersMap[memberIdx] = {};
        membersMap[memberIdx][memberField] = cleanString(rawObj[rawHeader]);
      } else {
        fieldValues[targetField] = cleanString(rawObj[rawHeader]);
      }
    }
  });

  // Build members array
  const members = [];
  Object.keys(membersMap)
    .sort()
    .forEach((key) => {
      const m = membersMap[key];
      const name = cleanString(m.name);
      const email = cleanEmail(m.email);
      if (name || email) {
        members.push({
          name: name || 'Team Member',
          email: email || '',
          mobile: cleanPhone(m.mobile),
          college: cleanString(m.college),
          state: cleanString(m.state),
          role: 'Team Member',
        });
      }
    });

  const teamName = cleanString(fieldValues.teamName);
  const unstopId = cleanString(fieldValues.unstopApplicationId);
  const leaderEmail = cleanEmail(fieldValues.leaderEmail);
  const leaderName = cleanString(fieldValues.leaderName);
  const leaderMobile = cleanPhone(fieldValues.leaderMobile);
  const leaderCollege = cleanString(fieldValues.leaderCollege);
  const leaderState = cleanString(fieldValues.leaderState);

  const ideaTitle = cleanString(fieldValues.ideaTitle);
  const ideaDescription = cleanString(fieldValues.ideaDescription);
  const problemStatement = cleanString(fieldValues.problemStatement);
  const proposedSolution = cleanString(fieldValues.proposedSolution);
  const techStack = cleanTechStack(fieldValues.techStack);
  const pptUrl = cleanUrl(fieldValues.pptUrl);
  const githubUrl = cleanUrl(fieldValues.githubUrl);
  const hostedProjectUrl = cleanUrl(fieldValues.hostedProjectUrl);
  const demoVideoUrl = cleanUrl(fieldValues.demoVideoUrl);
  const linkedInUrl = cleanUrl(fieldValues.linkedInUrl);
  const track = cleanString(fieldValues.track) || 'General Track';

  return {
    rowIndex,
    unstopApplicationId: unstopId,
    teamName,
    track,
    leader: {
      name: leaderName,
      email: leaderEmail,
      mobile: leaderMobile,
      college: leaderCollege,
      state: leaderState,
    },
    members,
    initialIdea: {
      title: ideaTitle,
      description: ideaDescription,
      problemStatement,
      proposedSolution,
      techStack,
      pptUrl,
    },
    submittedLinks: {
      githubUrl,
      hostedProjectUrl,
      demoVideoUrl,
      linkedInUrl,
      otherLinks: [],
    },
    rawUnstopData: rawObj,
  };
}

/**
 * Preview & Duplicate Detection Engine
 */
exports.generateImportPreview = async ({
  sheetData,
  customMapping = {},
}) => {
  const { rawRows, mappedColumns } = sheetData;

  const normalizedRows = [];
  const errors = [];

  // In-memory sets to detect duplicates within the Excel file itself
  const seenUnstopIds = new Set();
  const seenLeaderEmails = new Set();
  const seenTeamLeaderCombos = new Set();

  // Extract all unstop IDs and emails to query DB once (high performance batch check)
  const candidateUnstopIds = [];
  const candidateEmails = [];

  for (const rawRow of rawRows) {
    const normalized = normalizeTeamRow(rawRow, mappedColumns, customMapping);
    normalizedRows.push(normalized);

    if (normalized.unstopApplicationId) {
      candidateUnstopIds.push(normalized.unstopApplicationId);
    }
    if (normalized.leader.email) {
      candidateEmails.push(normalized.leader.email);
    }
  }

  // Batch query existing database records
  const existingTeams = await HackathonTeam.find({
    $or: [
      { unstopApplicationId: { $in: candidateUnstopIds.filter(Boolean) } },
      { 'leader.email': { $in: candidateEmails.filter(Boolean) } },
    ],
  }).select('teamId teamName unstopApplicationId leader status paymentStatus');

  const existingDbMapByUnstopId = new Map();
  const existingDbMapByEmail = new Map();

  existingTeams.forEach((team) => {
    if (team.unstopApplicationId) {
      existingDbMapByUnstopId.set(team.unstopApplicationId, team);
    }
    if (team.leader?.email) {
      existingDbMapByEmail.set(team.leader.email.toLowerCase(), team);
    }
  });

  // Evaluate each row for classification: NEW, DUPLICATE, WARNING, INVALID
  const previewRows = [];
  let newCount = 0;
  let duplicateCount = 0;
  let warningCount = 0;
  let invalidCount = 0;

  normalizedRows.forEach((row) => {
    const rowIssues = [];
    let isDuplicate = false;
    let duplicateReason = '';
    let existingTeamRef = null;

    // 1. Critical Field Validation
    if (!row.teamName) {
      rowIssues.push('Missing Team Name');
    }
    if (!row.leader.email) {
      rowIssues.push('Missing Leader Email');
    } else if (!isValidEmail(row.leader.email)) {
      rowIssues.push(`Invalid Leader Email format (${row.leader.email})`);
    }
    if (!row.leader.name) {
      rowIssues.push('Missing Leader Name');
    }

    // 2. Duplicate Check against DB
    if (row.unstopApplicationId && existingDbMapByUnstopId.has(row.unstopApplicationId)) {
      isDuplicate = true;
      const existing = existingDbMapByUnstopId.get(row.unstopApplicationId);
      duplicateReason = `Duplicate Unstop Application ID (${row.unstopApplicationId}) already registered as "${existing.teamName}" (${existing.teamId})`;
      existingTeamRef = { teamId: existing.teamId, teamName: existing.teamName };
    } else if (row.leader.email && existingDbMapByEmail.has(row.leader.email)) {
      isDuplicate = true;
      const existing = existingDbMapByEmail.get(row.leader.email);
      duplicateReason = `Leader Email (${row.leader.email}) already registered for team "${existing.teamName}" (${existing.teamId})`;
      existingTeamRef = { teamId: existing.teamId, teamName: existing.teamName };
    }

    // 3. Duplicate Check within the uploaded file itself
    const teamLeaderCombo = `${row.teamName.toLowerCase()}:::${row.leader.email}`;
    if (!isDuplicate) {
      if (row.unstopApplicationId && seenUnstopIds.has(row.unstopApplicationId)) {
        isDuplicate = true;
        duplicateReason = `Duplicate Unstop Application ID (${row.unstopApplicationId}) found multiple times in this Excel file`;
      } else if (row.leader.email && seenLeaderEmails.has(row.leader.email)) {
        isDuplicate = true;
        duplicateReason = `Leader Email (${row.leader.email}) appears multiple times in this Excel file`;
      } else if (seenTeamLeaderCombos.has(teamLeaderCombo)) {
        isDuplicate = true;
        duplicateReason = `Team Name "${row.teamName}" with Leader "${row.leader.email}" appears multiple times in this Excel file`;
      }
    }

    if (row.unstopApplicationId) seenUnstopIds.add(row.unstopApplicationId);
    if (row.leader.email) seenLeaderEmails.add(row.leader.email);
    seenTeamLeaderCombos.add(teamLeaderCombo);

    // 4. Soft Warnings (non-blocking)
    const warnings = [];
    if (!row.initialIdea.pptUrl) {
      warnings.push('No PPT Link provided');
    }
    if (!row.track || row.track === 'General Track') {
      warnings.push('Track defaulted to General Track');
    }
    if (row.members.length === 0) {
      warnings.push('No team members found (Solo team)');
    }

    // Determine row classification
    let status = 'NEW';
    if (rowIssues.length > 0) {
      status = 'INVALID';
      invalidCount++;
    } else if (isDuplicate) {
      status = 'DUPLICATE';
      duplicateCount++;
    } else if (warnings.length > 0) {
      status = 'WARNING';
      warningCount++;
    } else {
      status = 'NEW';
      newCount++;
    }

    previewRows.push({
      rowIndex: row.rowIndex,
      status,
      teamName: row.teamName,
      unstopApplicationId: row.unstopApplicationId,
      track: row.track,
      leader: row.leader,
      membersCount: row.members.length,
      members: row.members,
      ideaTitle: row.initialIdea.title,
      pptUrl: row.initialIdea.pptUrl,
      initialIdea: row.initialIdea,
      submittedLinks: row.submittedLinks,
      rawUnstopData: row.rawUnstopData,
      errors: rowIssues,
      warnings,
      duplicateReason,
      existingTeamRef,
    });
  });

  return {
    totalRows: previewRows.length,
    newCount,
    duplicateCount,
    warningCount,
    invalidCount,
    validToImportCount: newCount + warningCount,
    previewRows,
  };
};

/**
 * Batch Commit Imported Teams into Database
 */
exports.commitBatchImport = async ({
  rowsToImport,
  duplicateHandling = 'SKIP', // 'SKIP' or 'UPDATE'
}) => {
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const failedRows = [];

  // Batch in chunks of 50 to prevent memory spikes
  const CHUNK_SIZE = 50;

  for (let i = 0; i < rowsToImport.length; i += CHUNK_SIZE) {
    const chunk = rowsToImport.slice(i, i + CHUNK_SIZE);

    for (const item of chunk) {
      try {
        // Skip invalid rows unconditionally
        if (item.status === 'INVALID' || (item.errors && item.errors.length > 0)) {
          failedCount++;
          failedRows.push({
            rowIndex: item.rowIndex,
            teamName: item.teamName,
            reason: item.errors?.join(', ') || 'Validation error',
          });
          continue;
        }

        // Duplicate handling
        if (item.status === 'DUPLICATE') {
          if (duplicateHandling === 'SKIP') {
            skippedCount++;
            continue;
          } else if (duplicateHandling === 'UPDATE') {
            // Find existing team to update
            const existing = await HackathonTeam.findOne({
              $or: [
                ...(item.unstopApplicationId ? [{ unstopApplicationId: item.unstopApplicationId }] : []),
                ...(item.leader?.email ? [{ 'leader.email': item.leader.email.toLowerCase() }] : []),
              ],
            });

            if (existing) {
              existing.teamName = item.teamName || existing.teamName;
              existing.track = item.track || existing.track;
              if (item.leader) {
                existing.leader.name = item.leader.name || existing.leader.name;
                existing.leader.mobile = item.leader.mobile || existing.leader.mobile;
                existing.leader.college = item.leader.college || existing.leader.college;
                existing.leader.state = item.leader.state || existing.leader.state;
              }
              if (item.members && item.members.length > 0) {
                existing.members = item.members;
              }
              if (item.initialIdea) {
                existing.initialIdea = {
                  ...existing.initialIdea,
                  ...item.initialIdea,
                };
              }
              if (item.rawUnstopData) {
                existing.rawUnstopData = {
                  ...existing.rawUnstopData,
                  ...item.rawUnstopData,
                };
              }
              await existing.save();
              updatedCount++;
              continue;
            }
          }
        }

        // Standard Insert for NEW and WARNING rows
        const teamId = await generateTeamId();

        await HackathonTeam.create({
          teamId,
          unstopApplicationId: item.unstopApplicationId || '',
          teamName: item.teamName,
          track: item.track || 'General Track',
          leader: {
            name: item.leader?.name,
            email: item.leader?.email?.toLowerCase(),
            mobile: item.leader?.mobile || '',
            college: item.leader?.college || '',
            state: item.leader?.state || '',
          },
          members: item.members || [],
          initialIdea: item.initialIdea || {},
          submittedLinks: item.submittedLinks || {},
          rawUnstopData: item.rawUnstopData || {},
          status: 'IMPORTED',
          paymentStatus: 'NOT_REQUIRED',
          source: 'UNSTOP_IMPORT',
        });

        importedCount++;
      } catch (err) {
        console.error(`Error importing row ${item.rowIndex}:`, err);
        failedCount++;
        failedRows.push({
          rowIndex: item.rowIndex,
          teamName: item.teamName,
          reason: err.message,
        });
      }
    }
  }

  return {
    totalProcessed: rowsToImport.length,
    importedCount,
    updatedCount,
    skippedCount,
    failedCount,
    failedRows,
  };
};

/**
 * Detect Import Type based on headers or explicit request
 */
function detectImportType(headers, requestedType = null) {
  if (requestedType && (requestedType === 'REGISTRATION' || requestedType === 'PPT')) {
    return requestedType;
  }
  const normHeaders = headers.map((h) => normalizeHeader(h));

  const isPpt = normHeaders.some(
    (h) =>
      h.includes('report url') ||
      h.includes('ppt pdf url') ||
      h.includes('ppt url') ||
      h.includes('team name candidate name') ||
      h.includes('team leader email candidate email') ||
      h.includes('round 1 submission') ||
      h.includes('round 1 score') ||
      h.includes('submission file') ||
      h.includes('pitch deck') ||
      h.includes('presentation link')
  );
  if (isPpt) return 'PPT';

  const isRegistration = normHeaders.some(
    (h) =>
      h.includes('candidate role') ||
      h.includes('specialization') ||
      h.includes('course duration') ||
      h.includes('ref code') ||
      h.includes('registration time') ||
      h.includes('year of graduation') ||
      h.includes('candidate id')
  );
  if (isRegistration) return 'REGISTRATION';

  return 'LEGACY';
}
exports.detectImportType = detectImportType;

/**
 * STAGE 1 — REGISTRATION IMPORT PREVIEW
 * Master source for Teams + Multiple Members grouped by Team ID.
 */
exports.generateRegistrationImportPreview = async ({ sheetData, customMapping = {} }) => {
  const { rawRows } = sheetData;
  const candidateRows = [];

  for (const rawRow of rawRows) {
    const { rowIndex, rawObj } = rawRow;

    // Helper to retrieve value by matching column names (exact match first)
    const getVal = (fieldKeys) => {
      // 1. Exact match first
      for (const [hdr, val] of Object.entries(rawObj)) {
        const normH = normalizeHeader(hdr);
        for (const key of fieldKeys) {
          if (normH === key) {
            return cleanString(val);
          }
        }
      }
      // 2. Substring fallback
      for (const [hdr, val] of Object.entries(rawObj)) {
        const normH = normalizeHeader(hdr);
        for (const key of fieldKeys) {
          if (normH.includes(key)) {
            return cleanString(val);
          }
        }
      }
      return '';
    };

    const teamId = cleanString(getVal(['team id', 'unstop id', 'application id', 'registration id', 'reg id', 'app id']));
    const teamName = cleanString(getVal(['team name', 'team', 'group name']));
    const candidateRole = cleanString(getVal(['candidate role', 'role', 'team role', 'member role']));
    const candidateName = cleanString(getVal(['candidate name', 'participant name', 'name', 'full name']));
    const candidateEmail = cleanEmail(getVal(['candidate email', 'email id', 'email address', 'email']));
    const candidateMobile = cleanPhone(getVal(['candidate mobile', 'mobile', 'phone', 'contact']));
    const candidateGender = cleanString(getVal(['candidate gender', 'gender', 'sex']));
    const candidateLocation = cleanString(getVal(['candidate location', 'location', 'city', 'state']));
    const userType = cleanString(getVal(['user type', 'type of user']));
    const domain = cleanString(getVal(['domain', 'track', 'theme', 'preferred track']));
    const course = cleanString(getVal(['course', 'degree', 'program']));
    const specialization = cleanString(getVal(['specialization', 'branch', 'department']));
    const courseType = cleanString(getVal(['course type']));
    const courseDuration = cleanString(getVal(['course duration']));
    const classGrade = cleanString(getVal(['class grade', 'class', 'grade', 'year of study']));
    const yearOfGraduation = cleanString(getVal(['year of graduation', 'graduation year', 'yog', 'passing year']));
    const candidateOrganisation = cleanString(getVal(['candidate organisation', 'candidate organization', 'college', 'university', 'organisation', 'organization', 'institution']));
    const designation = cleanString(getVal(['designation', 'occupation']));
    const registrationTime = getVal(['registration time', 'registered at', 'registered on', 'registration date', 'timestamp']);
    const workExperience = cleanString(getVal(['work experience', 'experience']));
    const registrationStatus = cleanString(getVal(['registration status', 'reg status']));
    const refCode = cleanString(getVal(['ref code', 'referral code', 'refcode']));

    candidateRows.push({
      rowIndex,
      teamId: teamId || 'UNKNOWN_TEAM',
      teamName: teamName || 'Untitled Team',
      candidateRole,
      candidateName,
      candidateEmail,
      candidateMobile,
      candidateGender,
      candidateLocation,
      userType,
      domain,
      course,
      specialization,
      courseType,
      courseDuration,
      classGrade,
      yearOfGraduation,
      candidateOrganisation,
      designation,
      registrationTime: registrationTime ? new Date(registrationTime) : null,
      workExperience,
      registrationStatus,
      refCode,
      rawObj,
    });
  }

  // Group candidates by Team ID (or fallback to Team Name)
  const teamGroups = new Map();
  candidateRows.forEach((cand) => {
    const groupKey = cand.teamId && cand.teamId !== 'UNKNOWN_TEAM'
      ? cand.teamId.toUpperCase()
      : cand.teamName.toLowerCase();

    if (!teamGroups.has(groupKey)) {
      teamGroups.set(groupKey, []);
    }
    teamGroups.get(groupKey).push(cand);
  });

  // Batch query database for existing teams
  const allTeamIds = Array.from(teamGroups.keys());
  const allCandidateEmails = candidateRows.map((c) => c.candidateEmail).filter(Boolean);

  const existingTeamsDb = await HackathonTeam.find({
    $or: [
      { unstopApplicationId: { $in: allTeamIds } },
      { teamId: { $in: allTeamIds } },
      { 'leader.email': { $in: allCandidateEmails } },
    ],
    isDeleted: { $ne: true },
  }).lean();

  const existingByUnstopId = new Map();
  const existingByTeamId = new Map();
  const existingByLeaderEmail = new Map();

  existingTeamsDb.forEach((t) => {
    if (t.unstopApplicationId) existingByUnstopId.set(t.unstopApplicationId.toUpperCase(), t);
    if (t.teamId) existingByTeamId.set(t.teamId.toUpperCase(), t);
    if (t.leader?.email) existingByLeaderEmail.set(t.leader.email.toLowerCase(), t);
  });

  const previewTeams = [];
  let newTeamsCount = 0;
  let updatedTeamsCount = 0;
  let newMembersCount = 0;
  let updatedMembersCount = 0;
  let invalidCount = 0;

  for (const [groupKey, candidates] of teamGroups.entries()) {
    // Identify Team Leader: Candidate Role contains 'leader' or first candidate in team
    let leaderCand = candidates.find((c) => /leader/i.test(c.candidateRole));
    if (!leaderCand) {
      leaderCand = candidates[0];
    }
    const memberCands = candidates.filter((c) => c !== leaderCand);

    const teamId = leaderCand.teamId !== 'UNKNOWN_TEAM' ? leaderCand.teamId : '';
    const teamName = leaderCand.teamName;
    const domain = leaderCand.domain || candidates.find((c) => c.domain)?.domain || '';
    const regTime = leaderCand.registrationTime || candidates.find((c) => c.registrationTime)?.registrationTime || null;
    const regStatus = leaderCand.registrationStatus || candidates.find((c) => c.registrationStatus)?.registrationStatus || '';

    // Check if team already exists in DB
    const existingTeam =
      (teamId && existingByUnstopId.get(teamId.toUpperCase())) ||
      (teamId && existingByTeamId.get(teamId.toUpperCase())) ||
      (leaderCand.candidateEmail && existingByLeaderEmail.get(leaderCand.candidateEmail));

    let status = 'NEW';
    let existingTeamRef = null;
    const errors = [];

    if (!teamName || teamName === 'Untitled Team') errors.push('Missing Team Name');
    if (!leaderCand.candidateEmail) errors.push('Missing Leader Email');
    else if (!isValidEmail(leaderCand.candidateEmail)) errors.push(`Invalid Leader Email format: ${leaderCand.candidateEmail}`);

    let teamNewMembers = 0;
    let teamUpdatedMembers = 0;

    if (errors.length > 0) {
      status = 'INVALID';
      invalidCount++;
    } else if (existingTeam) {
      status = 'EXISTING_UPDATE';
      updatedTeamsCount++;
      existingTeamRef = {
        teamId: existingTeam.teamId,
        teamName: existingTeam.teamName,
        unstopApplicationId: existingTeam.unstopApplicationId,
      };

      const existingMemberEmails = new Set(
        (existingTeam.members || []).map((m) => cleanEmail(m.email))
      );
      memberCands.forEach((m) => {
        if (existingMemberEmails.has(cleanEmail(m.candidateEmail))) {
          updatedMembersCount++;
          teamUpdatedMembers++;
        } else {
          newMembersCount++;
          teamNewMembers++;
        }
      });
    } else {
      status = 'NEW';
      newTeamsCount++;
      newMembersCount += memberCands.length;
      teamNewMembers = memberCands.length;
    }

    previewTeams.push({
      status,
      unstopApplicationId: teamId,
      teamName,
      domain,
      track: domain || 'General Track',
      registrationTime: regTime,
      registrationStatus: regStatus,
      leader: {
        name: leaderCand.candidateName,
        email: leaderCand.candidateEmail,
        mobile: leaderCand.candidateMobile,
        gender: leaderCand.candidateGender,
        location: leaderCand.candidateLocation,
        college: leaderCand.candidateOrganisation,
        state: leaderCand.candidateLocation,
        userType: leaderCand.userType,
        domain: leaderCand.domain,
        course: leaderCand.course,
        specialization: leaderCand.specialization,
        courseType: leaderCand.courseType,
        courseDuration: leaderCand.courseDuration,
        classGrade: leaderCand.classGrade,
        yearOfGraduation: leaderCand.yearOfGraduation,
        organisation: leaderCand.candidateOrganisation,
        designation: leaderCand.designation,
        workExperience: leaderCand.workExperience,
        refCode: leaderCand.refCode,
        role: 'Team Leader',
      },
      members: memberCands.map((m) => ({
        name: m.candidateName,
        email: m.candidateEmail,
        mobile: m.candidateMobile,
        gender: m.candidateGender,
        location: m.candidateLocation,
        college: m.candidateOrganisation,
        state: m.candidateLocation,
        userType: m.userType,
        domain: m.domain,
        course: m.course,
        specialization: m.specialization,
        courseType: m.courseType,
        courseDuration: m.courseDuration,
        classGrade: m.classGrade,
        yearOfGraduation: m.yearOfGraduation,
        organisation: m.candidateOrganisation,
        designation: m.designation,
        workExperience: m.workExperience,
        refCode: m.refCode,
        role: m.candidateRole || 'Team Member',
      })),
      totalMembersInSheet: candidates.length,
      memberDiff: {
        newCount: teamNewMembers,
        updatedCount: teamUpdatedMembers,
        totalCount: memberCands.length,
      },
      existingTeamRef,
      errors,
    });
  }

  return {
    importType: 'REGISTRATION',
    totalRows: candidateRows.length,
    totalTeams: previewTeams.length,
    newTeamsCount,
    updatedTeamsCount,
    newCount: newTeamsCount,
    existingUpdateCount: updatedTeamsCount,
    newMembersCount,
    updatedMembersCount,
    totalNewMembers: newMembersCount,
    totalUpdatedMembers: updatedMembersCount,
    teamsToImportCount: newTeamsCount + updatedTeamsCount,
    validToImportCount: newTeamsCount + updatedTeamsCount,
    invalidCount,
    teams: previewTeams,
    previewTeams,
    previewRows: previewTeams.map((t, idx) => ({
      rowIndex: idx + 1,
      status: t.status === 'EXISTING_UPDATE' ? 'UPDATE' : t.status,
      teamName: t.teamName,
      unstopApplicationId: t.unstopApplicationId,
      track: t.track,
      leader: t.leader,
      membersCount: t.members.length,
      members: t.members,
      errors: t.errors,
      existingTeamRef: t.existingTeamRef,
    })),
  };
};

/**
 * STAGE 1 — REGISTRATION IMPORT COMMIT
 */
exports.commitRegistrationImport = async ({ teamsToImport, duplicateHandling = 'UPDATE' }) => {
  let teamsCreated = 0;
  let teamsUpdated = 0;
  let membersCreated = 0;
  let membersUpdated = 0;
  let failedCount = 0;
  const failedRows = [];

  for (const item of teamsToImport) {
    try {
      if (item.status === 'INVALID' || (item.errors && item.errors.length > 0)) {
        failedCount++;
        failedRows.push({
          teamName: item.teamName,
          reason: item.errors?.join(', ') || 'Validation error',
        });
        continue;
      }

      // Check if team already exists by unstopApplicationId, existing teamId, or leader email
      const existing = await HackathonTeam.findOne({
        $or: [
          ...(item.unstopApplicationId ? [{ unstopApplicationId: item.unstopApplicationId }] : []),
          ...(item.existingTeamRef?.teamId ? [{ teamId: item.existingTeamRef.teamId.toUpperCase() }] : []),
          ...(item.leader?.email ? [{ 'leader.email': item.leader.email.toLowerCase() }] : []),
        ],
        isDeleted: { $ne: true },
      });

      if (existing) {
        // UPDATE Existing Team
        existing.teamName = item.teamName || existing.teamName;
        existing.domain = item.domain || existing.domain;
        if (item.track) existing.track = item.track;
        if (item.registrationTime) existing.registrationTime = item.registrationTime;
        if (item.registrationStatus) existing.registrationStatus = item.registrationStatus;

        if (item.leader) {
          existing.leader.name = item.leader.name || existing.leader.name;
          existing.leader.mobile = item.leader.mobile || existing.leader.mobile;
          existing.leader.college = item.leader.college || existing.leader.college;
          existing.leader.state = item.leader.state || existing.leader.state;
          existing.leader.gender = item.leader.gender || existing.leader.gender;
          existing.leader.location = item.leader.location || existing.leader.location;
          existing.leader.domain = item.leader.domain || existing.leader.domain;
          existing.leader.course = item.leader.course || existing.leader.course;
          existing.leader.specialization = item.leader.specialization || existing.leader.specialization;
          existing.leader.yearOfGraduation = item.leader.yearOfGraduation || existing.leader.yearOfGraduation;
          existing.leader.organisation = item.leader.organisation || existing.leader.organisation;
          existing.leader.designation = item.leader.designation || existing.leader.designation;
          existing.leader.workExperience = item.leader.workExperience || existing.leader.workExperience;
          existing.leader.refCode = item.leader.refCode || existing.leader.refCode;
        }

        // Upsert members: match by email, update existing or append new
        if (Array.isArray(item.members)) {
          if (!Array.isArray(existing.members)) existing.members = [];
          const existingEmails = new Set(existing.members.map((m) => cleanEmail(m.email)));

          for (const incM of item.members) {
            const mEmail = cleanEmail(incM.email);
            if (existingEmails.has(mEmail)) {
              // Update existing member fields
              const targetMember = existing.members.find((m) => cleanEmail(m.email) === mEmail);
              if (targetMember) {
                targetMember.name = incM.name || targetMember.name;
                targetMember.mobile = incM.mobile || targetMember.mobile;
                targetMember.college = incM.college || targetMember.college;
                targetMember.state = incM.state || targetMember.state;
                targetMember.gender = incM.gender || targetMember.gender;
                targetMember.location = incM.location || targetMember.location;
                targetMember.domain = incM.domain || targetMember.domain;
                targetMember.course = incM.course || targetMember.course;
                targetMember.specialization = incM.specialization || targetMember.specialization;
                targetMember.yearOfGraduation = incM.yearOfGraduation || targetMember.yearOfGraduation;
                targetMember.organisation = incM.organisation || targetMember.organisation;
                targetMember.designation = incM.designation || targetMember.designation;
                targetMember.workExperience = incM.workExperience || targetMember.workExperience;
                targetMember.refCode = incM.refCode || targetMember.refCode;
                membersUpdated++;
              }
            } else {
              // Add new member to existing team
              existing.members.push(incM);
              existingEmails.add(mEmail);
              membersCreated++;
            }
          }
        }

        await existing.save();
        teamsUpdated++;
      } else {
        // CREATE New Team
        const teamId = await generateTeamId();
        await HackathonTeam.create({
          teamId,
          unstopApplicationId: item.unstopApplicationId || '',
          teamName: item.teamName,
          domain: item.domain || '',
          track: item.track || item.domain || 'General Track',
          registrationTime: item.registrationTime || null,
          registrationStatus: item.registrationStatus || '',
          leader: item.leader,
          members: item.members || [],
          status: 'IMPORTED',
          paymentStatus: 'NOT_REQUIRED',
          source: 'UNSTOP_IMPORT',
        });
        teamsCreated++;
        membersCreated += item.members?.length || 0;
      }
    } catch (err) {
      console.error(`Error importing team ${item.teamName}:`, err);
      failedCount++;
      failedRows.push({
        teamName: item.teamName,
        reason: err.message,
      });
    }
  }

  return {
    totalTeamsProcessed: teamsToImport.length,
    teamsCreated,
    teamsUpdated,
    membersCreated,
    membersUpdated,
    createdCount: teamsCreated,
    updatedCount: teamsUpdated,
    membersAppended: membersCreated,
    failedCount,
    failedRows,
  };
};

/**
 * STAGE 2 — PPT ROUND IMPORT PREVIEW
 * Enrichment only: matches existing teams via multi-tier hierarchy and attaches PPT.
 * MUST NEVER CREATE A NEW TEAM.
 */
exports.generatePptImportPreview = async ({ sheetData, customMapping = {} }) => {
  const { rawRows } = sheetData;

  // 1. Fetch all active teams from DB
  const activeTeams = await HackathonTeam.find({ isDeleted: { $ne: true } })
    .select('teamId teamName unstopApplicationId leader members initialIdea pptSubmission track')
    .lean();

  const byUnstopId = new Map();
  const byTeamId = new Map();
  const byLeaderEmail = new Map();
  const byMemberEmail = new Map();
  const byNormalizedName = new Map();

  activeTeams.forEach((team) => {
    if (team.unstopApplicationId) {
      const uId = team.unstopApplicationId.trim().toUpperCase();
      if (!byUnstopId.has(uId)) byUnstopId.set(uId, []);
      byUnstopId.get(uId).push(team);
    }
    if (team.teamId) {
      const tId = team.teamId.trim().toUpperCase();
      if (!byTeamId.has(tId)) byTeamId.set(tId, []);
      byTeamId.get(tId).push(team);
    }
    if (team.leader?.email) {
      const em = team.leader.email.trim().toLowerCase();
      if (!byLeaderEmail.has(em)) byLeaderEmail.set(em, []);
      byLeaderEmail.get(em).push(team);
    }
    if (Array.isArray(team.members)) {
      team.members.forEach((m) => {
        if (m.email) {
          const em = m.email.trim().toLowerCase();
          if (!byMemberEmail.has(em)) byMemberEmail.set(em, []);
          byMemberEmail.get(em).push(team);
        }
      });
    }
    if (team.teamName) {
      const normName = normalizeHeader(team.teamName);
      if (normName) {
        if (!byNormalizedName.has(normName)) byNormalizedName.set(normName, []);
        byNormalizedName.get(normName).push(team);
      }
    }
  });

  const previewRows = [];
  let matchedCount = 0;
  let newPptCount = 0;
  let updatedPptCount = 0;
  let unmatchedCount = 0;
  let ambiguousCount = 0;

  for (const rawRow of rawRows) {
    const { rowIndex, rawObj } = rawRow;

    // Helper to retrieve value (exact match first)
    const getVal = (keys) => {
      // 1. Exact match first
      for (const [hdr, val] of Object.entries(rawObj)) {
        const normH = normalizeHeader(hdr);
        for (const k of keys) {
          if (normH === k) {
            return cleanString(val);
          }
        }
      }
      // 2. Substring fallback
      for (const [hdr, val] of Object.entries(rawObj)) {
        const normH = normalizeHeader(hdr);
        for (const k of keys) {
          if (normH.includes(k)) {
            return cleanString(val);
          }
        }
      }
      return '';
    };

    const regnId = cleanString(getVal(['regn id', 'registration id', 'unstop id', 'application id', 'team id']));
    const teamNameRaw = cleanString(getVal(['team name candidate name', 'team name', 'team']));
    const leaderEmailRaw = cleanEmail(getVal(['team leader email candidate email', 'team leader email', 'leader email']));
    const candidateType = cleanString(getVal(['candidate type']));
    const candidateName = cleanString(getVal(['candidate name', 'participant name', 'name']));
    const candidateEmail = cleanEmail(getVal(['candidate email', 'email']));
    const candidateMobile = cleanPhone(getVal(['candidate mobile', 'mobile', 'phone']));
    const reportUrl = cleanUrl(getVal(['report url', 'report link', 'project report']));
    const pptUrl = cleanUrl(
      getVal([
        'ppt pdf url',
        'ppt url',
        'ppt link',
        'ppt',
        'presentation link',
        'round 1 submission',
        'submission',
        'round 1',
        'submission file',
        'pitch deck',
      ])
    );

    // MATCHING PRIORITY HIERARCHY
    let matchedTeams = [];
    let matchStrategy = 'NONE';

    // 1. Strongest identifier: Regn ID matches unstopApplicationId or teamId
    if (regnId) {
      const regnUpper = regnId.toUpperCase();
      if (byUnstopId.has(regnUpper)) {
        matchedTeams = byUnstopId.get(regnUpper);
        matchStrategy = 'REGN_ID_UNSTOP';
      } else if (byTeamId.has(regnUpper)) {
        matchedTeams = byTeamId.get(regnUpper);
        matchStrategy = 'REGN_ID_TEAM';
      }
    }

    // 2. Team Leader Email -> existing Team leader
    if (matchedTeams.length === 0 && leaderEmailRaw) {
      if (byLeaderEmail.has(leaderEmailRaw)) {
        matchedTeams = byLeaderEmail.get(leaderEmailRaw);
        matchStrategy = 'LEADER_EMAIL';
      }
    }

    // 3. Candidate Email -> existing Member -> that Member's teamId
    if (matchedTeams.length === 0 && candidateEmail) {
      if (byLeaderEmail.has(candidateEmail)) {
        matchedTeams = byLeaderEmail.get(candidateEmail);
        matchStrategy = 'CANDIDATE_AS_LEADER_EMAIL';
      } else if (byMemberEmail.has(candidateEmail)) {
        matchedTeams = byMemberEmail.get(candidateEmail);
        matchStrategy = 'MEMBER_EMAIL';
      }
    }

    // 4. Controlled fallback using normalized Team Name + candidate info
    if (matchedTeams.length === 0 && teamNameRaw) {
      const normTeamName = normalizeHeader(teamNameRaw);
      if (byNormalizedName.has(normTeamName)) {
        const potential = byNormalizedName.get(normTeamName);
        matchedTeams = potential;
        matchStrategy = potential.length === 1 ? 'TEAM_NAME_FALLBACK' : 'TEAM_NAME_AMBIGUOUS';
      }
    }

    // Deduplicate matched teams by _id string
    const uniqueMatchedMap = new Map();
    matchedTeams.forEach((t) => uniqueMatchedMap.set(String(t._id), t));
    const uniqueMatchedTeams = Array.from(uniqueMatchedMap.values());

    let status = 'UNMATCHED';
    let matchReason = '';
    let matchedTeamInfo = null;

    if (uniqueMatchedTeams.length > 1) {
      status = 'AMBIGUOUS';
      ambiguousCount++;
      matchReason = `Needs Admin Review: Matches ${uniqueMatchedTeams.length} teams (${uniqueMatchedTeams.map((t) => t.teamId).join(', ')})`;
    } else if (uniqueMatchedTeams.length === 0) {
      status = 'UNMATCHED';
      unmatchedCount++;
      matchReason = 'No existing registered team found in database';
    } else {
      // Exactly 1 confident match
      const targetTeam = uniqueMatchedTeams[0];
      matchedTeamInfo = {
        teamId: targetTeam.teamId,
        teamName: targetTeam.teamName,
        leaderName: targetTeam.leader?.name,
        leaderEmail: targetTeam.leader?.email,
        track: targetTeam.track,
      };

      const hasExistingPpt = Boolean(
        targetTeam.initialIdea?.pptUrl || targetTeam.pptSubmission?.pptUrl
      );

      if (hasExistingPpt) {
        status = 'UPDATE_PPT';
        updatedPptCount++;
        matchReason = `Matched team "${targetTeam.teamName}" (${targetTeam.teamId}) via ${matchStrategy} (Update existing PPT)`;
      } else {
        status = 'NEW_PPT';
        newPptCount++;
        matchReason = `Matched team "${targetTeam.teamName}" (${targetTeam.teamId}) via ${matchStrategy} (New PPT submission)`;
      }
      matchedCount++;
    }

    previewRows.push({
      rowIndex,
      status, // 'NEW_PPT', 'UPDATE_PPT', 'AMBIGUOUS', 'UNMATCHED'
      regnId,
      teamName: teamNameRaw,
      leaderEmail: leaderEmailRaw,
      candidateType,
      candidateName,
      candidateEmail,
      candidateMobile,
      reportUrl,
      pptUrl: pptUrl || reportUrl,
      matchStrategy,
      matchReason,
      matchedTeam: matchedTeamInfo,
      ambiguousCandidates:
        uniqueMatchedTeams.length > 1
          ? uniqueMatchedTeams.map((t) => ({
              teamId: t.teamId,
              teamName: t.teamName,
              leaderEmail: t.leader?.email,
              college: t.leader?.college,
            }))
          : [],
      ignoredFields: ['Status', 'Round 1 Score', 'Official Website Registration', 'WhatsApp Group Join'],
      rawObj,
    });
  }

  return {
    importType: 'PPT',
    totalRows: previewRows.length,
    matchedCount,
    newPptCount,
    updatedPptCount,
    updatePptCount: updatedPptCount,
    unmatchedCount,
    ambiguousCount,
    validToImportCount: matchedCount,
    rows: previewRows,
    previewRows,
  };
};

/**
 * STAGE 2 — PPT ROUND IMPORT COMMIT
 */
exports.commitPptImport = async ({ rowsToImport }) => {
  let pptCreated = 0;
  let pptUpdated = 0;
  let unmatchedSkipped = 0;
  let ambiguousSkipped = 0;
  let failedCount = 0;
  const failedRows = [];

  for (const row of rowsToImport) {
    try {
      if (row.status === 'UNMATCHED') {
        unmatchedSkipped++;
        continue;
      }
      if (row.status === 'AMBIGUOUS') {
        ambiguousSkipped++;
        continue;
      }
      if (!row.matchedTeam?.teamId && !row.matchedTeam?._id) {
        failedCount++;
        failedRows.push({
          rowIndex: row.rowIndex,
          reason: 'No matched team identifier provided',
        });
        continue;
      }

      const team = await HackathonTeam.findOne({
        $or: [
          ...(row.matchedTeam._id ? [{ _id: row.matchedTeam._id }] : []),
          ...(row.matchedTeam.teamId ? [{ teamId: row.matchedTeam.teamId.toUpperCase() }] : []),
          ...(row.matchedTeam.unstopApplicationId ? [{ unstopApplicationId: row.matchedTeam.unstopApplicationId }] : []),
          ...(row.matchedTeam.leaderEmail ? [{ 'leader.email': row.matchedTeam.leaderEmail.toLowerCase() }] : []),
        ],
        isDeleted: { $ne: true },
      });

      if (!team) {
        failedCount++;
        failedRows.push({
          rowIndex: row.rowIndex,
          reason: `Team ${row.matchedTeam.teamId || row.matchedTeam.teamName} not found or is deleted`,
        });
        continue;
      }

      const effectivePptUrl = row.pptUrl || row.reportUrl || '';
      const hadExistingPpt = Boolean(team.initialIdea?.pptUrl || team.pptSubmission?.pptUrl);

      // Update initialIdea.pptUrl for downstream Phases 3-9
      if (effectivePptUrl) {
        if (!team.initialIdea) team.initialIdea = {};
        team.initialIdea.pptUrl = effectivePptUrl;
      }

      // Update dedicated pptSubmission subdocument
      team.pptSubmission = {
        unstopRegnId: row.regnId || row.unstopApplicationId || '',
        reportUrl: row.reportUrl || '',
        pptUrl: effectivePptUrl,
        candidateType: row.candidateType || '',
        importedAt: new Date(),
        round: 'round1',
        source: 'unstop',
        submittedBy: row.candidateName || row.leaderEmail || row.candidateEmail || '',
      };

      // Add to submittedLinks.otherLinks if not already present
      if (effectivePptUrl) {
        if (!team.submittedLinks) team.submittedLinks = {};
        if (!Array.isArray(team.submittedLinks.otherLinks)) team.submittedLinks.otherLinks = [];
        const existsInLinks = team.submittedLinks.otherLinks.some(
          (l) => (typeof l === 'string' ? l : l?.url) === effectivePptUrl
        );
        if (!existsInLinks) {
          team.submittedLinks.otherLinks.push(effectivePptUrl);
        }
      }

      // If team rawUnstopData exists, merge ppt info
      if (row.rawObj) {
        team.rawUnstopData = {
          ...(team.rawUnstopData || {}),
          pptImportData: row.rawObj,
        };
      }

      await team.save();

      if (hadExistingPpt) {
        pptUpdated++;
      } else {
        pptCreated++;
      }
    } catch (err) {
      console.error(`Error committing PPT row ${row.rowIndex}:`, err);
      failedCount++;
      failedRows.push({
        rowIndex: row.rowIndex,
        reason: err.message,
      });
    }
  }

  return {
    totalProcessed: rowsToImport.length,
    pptCreated,
    pptUpdated,
    matchedCount: pptCreated + pptUpdated,
    updatedCount: pptCreated + pptUpdated,
    skippedCount: unmatchedSkipped + ambiguousSkipped,
    unmatchedSkipped,
    ambiguousSkipped,
    failedCount,
    failedRows,
  };
};
