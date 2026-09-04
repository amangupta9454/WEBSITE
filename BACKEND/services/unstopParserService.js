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
