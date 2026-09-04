const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const HackathonSetting = require('../models/HackathonSetting');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonPayment = require('../models/HackathonPayment');
const HackathonSubmission = require('../models/HackathonSubmission');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const HackathonEditorialMember = require('../models/HackathonEditorialMember');
const HackathonEditorialAssignment = require('../models/HackathonEditorialAssignment');
const HackathonEditorialEvaluation = require('../models/HackathonEditorialEvaluation');
const HackathonResult = require('../models/HackathonResult');
const HackathonCertificate = require('../models/HackathonCertificate');
const HackathonPrize = require('../models/HackathonPrize');
const HackathonSponsor = require('../models/HackathonSponsor');
const HackathonPrizeFulfillment = require('../models/HackathonPrizeFulfillment');
const hackathonResultService = require('../services/hackathonResultService');
const hackathonCertificateService = require('../services/hackathonCertificateService');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const unstopParserService = require('../services/unstopParserService');
const hackathonEmailService = require('../services/hackathonEmailService');
const hackathonOpsService = require('../services/hackathonOpsService');
const { validateHackathonConfig } = require('../services/hackathonConfigService');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

/**
 * URL Validation Helper (Phase 5 PRD Step 9)
 * Strictly verifies HTTP/HTTPS URLs and rejects dangerous schemes (javascript:, data:, file:)
 */
const validateSafeUrl = (url, fieldName = 'URL') => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    throw new Error(`Invalid URL format for ${fieldName}. Must be a valid URL with http:// or https://`);
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`Security violation for ${fieldName}: protocol "${protocol}" is not permitted. Only http:// and https:// URLs are allowed.`);
  }

  return trimmed;
};

/**
 * 1. Get Public Hackathon Information
 * Accessible to any visitor / participant
 */
exports.getPublicHackathonInfo = async (req, res) => {
  try {
    const settings = await HackathonSetting.getOrCreateSettings();

    // Sanitize and structure response
    const publicData = {
      hackathonId: settings.hackathonId,
      name: settings.name,
      tagline: settings.tagline,
      description: settings.description,
      startDate: settings.startDate,
      endDate: settings.endDate,
      submissionDeadline: settings.submissionDeadline,
      resultDate: settings.resultDate,
      participationFee: settings.participationFee,
      currency: settings.currency,
      rules: settings.rules,
      tracks: settings.tracks,
      judgingCriteria: settings.judgingCriteria,
      prizes: settings.prizes,
      announcements: (settings.announcements || []).filter((a) => a.active),
      isRegistrationOpen: settings.isRegistrationOpen,
      isSubmissionOpen: settings.isSubmissionOpen,
      isResultsPublished: settings.isResultsPublished,
      isActive: settings.isActive !== false,
    };

    res.status(200).json({
      success: true,
      data: publicData,
    });
  } catch (error) {
    console.error('getPublicHackathonInfo Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hackathon details.',
      error: error.message,
    });
  }
};

/**
 * Shared Helper: Resolve Authenticated Participant and Associated Hackathon Team
 * Handles:
 *  - Token with email OR token without email (fetches from User model via userId/id/unifiedUserId)
 *  - Matching by leader.userId, members.userId, leader.email, members.email
 *  - Optional explicit teamId param/body validation
 *  - Auto-linking leader.userId in DB if team was imported with email only
 */
async function resolveParticipantTeam(req, explicitTeamId = null) {
  const userId = req.user?._id || req.user?.id || req.user?.unifiedUserId || req.user?.userId;
  let userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : null;

  if (!userEmail && userId) {
    const user = await User.findById(userId).select('email name');
    if (user?.email) {
      userEmail = user.email.toLowerCase().trim();
      req.user.email = userEmail;
      if (!req.user.name && user.name) req.user.name = user.name;
    }
  }

  if (!userId && !userEmail) {
    return { errorStatus: 401, errorMessage: 'Authentication required. Please log in.' };
  }

  const targetTeamId = explicitTeamId || req.body?.teamId || req.query?.teamId;
  let team = null;

  if (targetTeamId) {
    const candidate = await HackathonTeam.findOne({
      isDeleted: { $ne: true },
      $or: [{ teamId: targetTeamId }, { _id: mongoose.isValidObjectId(targetTeamId) ? targetTeamId : null }],
    });
    if (candidate) {
      const isLeaderCheck =
        (userId && candidate.leader?.userId && String(candidate.leader.userId) === String(userId)) ||
        (userEmail && candidate.leader?.email && candidate.leader.email.toLowerCase() === userEmail);
      const isMemberCheck =
        (userId && candidate.members?.some((m) => m.userId && String(m.userId) === String(userId))) ||
        (userEmail && candidate.members?.some((m) => m.email && m.email.toLowerCase() === userEmail));

      if (isLeaderCheck || isMemberCheck) {
        team = candidate;
      }
    }
  }

  if (!team) {
    const query = {
      isDeleted: { $ne: true },
      $or: [],
    };
    if (userId) {
      query.$or.push({ 'leader.userId': userId }, { 'members.userId': userId });
    }
    if (userEmail) {
      query.$or.push({ 'leader.email': userEmail }, { 'members.email': userEmail });
    }
    team = await HackathonTeam.findOne(query);
  }

  if (!team) {
    return { errorStatus: 404, errorMessage: 'No hackathon team registered or linked to your account.' };
  }

  // Auto-link leader/member userId if missing
  let modified = false;
  if (userId && userEmail && team.leader?.email && team.leader.email.toLowerCase() === userEmail && !team.leader.userId) {
    team.leader.userId = userId;
    modified = true;
  }
  if (userId && userEmail && team.members?.length > 0) {
    team.members.forEach((m) => {
      if (m.email && m.email.toLowerCase() === userEmail && !m.userId) {
        m.userId = userId;
        modified = true;
      }
    });
  }
  if (modified) {
    await team.save().catch(() => {});
  }

  const isLeader =
    (userId && team.leader?.userId && String(team.leader.userId) === String(userId)) ||
    (userEmail && team.leader?.email && team.leader.email.toLowerCase() === userEmail);

  return { userId, userEmail, team, isLeader };
}

/**
 * 2. Get Authenticated Participant's Team Data
 * Strict security: Only returns the team that the authenticated user belongs to.
 */
exports.getMyTeam = async (req, res) => {
  try {
    const resolved = await resolveParticipantTeam(req);
    if (resolved.errorStatus) {
      if (resolved.errorStatus === 404) {
        return res.status(200).json({
          success: true,
          hasTeam: false,
          team: null,
          message: 'No team registered for the current user.',
        });
      }
      return res.status(resolved.errorStatus).json({ success: false, message: resolved.errorMessage });
    }

    const { team, isLeader, userId, userEmail } = resolved;

    const settings = await HackathonSetting.getOrCreateSettings();

    // Strict PRD Rule: WhatsApp link is ONLY exposed if the team is CONFIRMED / payment is PAID
    const isConfirmed = team.status === 'CONFIRMED' || team.paymentStatus === 'PAID';
    const whatsAppLink = isConfirmed ? settings.whatsAppLink : null;

    res.status(200).json({
      success: true,
      hasTeam: true,
      isLeader,
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        track: team.track,
        status: team.status,
        paymentStatus: team.paymentStatus,
        leader: {
          name: team.leader?.name,
          email: team.leader?.email,
          mobile: team.leader?.mobile,
          college: team.leader?.college,
          state: team.leader?.state,
        },
        members: (team.members || []).map((m) => ({
          _id: m._id,
          name: m.name,
          email: m.email,
          college: m.college,
        })),
        initialIdea: team.initialIdea,
        submittedLinks: team.submittedLinks,
        finalSubmission: team.finalSubmission,
        shortlistedAt: team.shortlistedAt,
        whatsAppLink,
      },
      participationFee: settings.participationFee,
      submissionDeadline: settings.submissionDeadline,
      isSubmissionOpen: settings.isSubmissionOpen,
    });
  } catch (error) {
    console.error('getMyTeam Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve team data.',
      error: error.message,
    });
  }
};

/**
 * 3. Admin Overview Statistics
 * Live metrics for the Hackathon Admin Workspace
 */
exports.getAdminOverview = async (req, res) => {
  try {
    const [
      totalTeams,
      pptSubmitted,
      underReview,
      shortlisted,
      paymentPending,
      confirmed,
      finalSubmissions,
      evaluated,
      recentLogs,
      settings,
    ] = await Promise.all([
      HackathonTeam.countDocuments({ isDeleted: { $ne: true } }),
      HackathonTeam.countDocuments({ 'initialIdea.pptUrl': { $exists: true, $ne: '' }, isDeleted: { $ne: true } }),
      HackathonTeam.countDocuments({ status: { $in: ['IMPORTED', 'UNDER_REVIEW'] }, isDeleted: { $ne: true } }),
      HackathonTeam.countDocuments({ status: 'SHORTLISTED', isDeleted: { $ne: true } }),
      HackathonTeam.countDocuments({
        $or: [{ status: 'PAYMENT_PENDING' }, { paymentStatus: 'PENDING' }],
        isDeleted: { $ne: true },
      }),
      HackathonTeam.countDocuments({
        $or: [{ status: 'CONFIRMED' }, { paymentStatus: 'PAID' }],
        isDeleted: { $ne: true },
      }),
      HackathonTeam.countDocuments({
        $or: [{ status: 'SUBMITTED' }, { 'finalSubmission.submittedAt': { $ne: null } }],
        isDeleted: { $ne: true },
      }),
      HackathonTeam.countDocuments({ status: 'EVALUATED', isDeleted: { $ne: true } }),
      HackathonAuditLog.find().sort({ createdAt: -1 }).limit(10),
      HackathonSetting.getOrCreateSettings(),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalTeams,
        pptSubmitted,
        underReview,
        shortlisted,
        paymentPending,
        confirmed,
        finalSubmissions,
        evaluated,
      },
      settings,
      recentLogs,
    });
  } catch (error) {
    console.error('getAdminOverview Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin overview statistics.',
      error: error.message,
    });
  }
};

/**
 * 4. Get Admin Settings
 */
exports.getAdminSettings = async (req, res) => {
  try {
    const settings = await HackathonSetting.getOrCreateSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('getAdminSettings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hackathon settings.',
      error: error.message,
    });
  }
};

/**
 * 5. Update Admin Settings & Record Audit Log
 */
exports.updateAdminSettings = async (req, res) => {
  try {
    const settings = await HackathonSetting.getOrCreateSettings();
    const previousState = settings.toObject();

    const allowedFields = [
      'name',
      'tagline',
      'description',
      'startDate',
      'endDate',
      'submissionDeadline',
      'resultDate',
      'participationFee',
      'whatsAppLink',
      'rules',
      'tracks',
      'judgingCriteria',
      'prizes',
      'isRegistrationOpen',
      'isSubmissionOpen',
      'isResultsPublished',
      'isActive',
      'announcements',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    settings.updatedBy = req.admin?.email || req.admin?.username || 'Admin';
    settings.updatedAt = new Date();

    const updatedSettings = await settings.save();

    // Log the update action into Audit Trail
    await HackathonAuditLog.log({
      actorId: req.admin?._id || req.admin?.id || 'admin',
      actorName: req.admin?.name || req.admin?.username || 'Admin',
      actorEmail: req.admin?.email || '',
      role: 'admin',
      action: 'UPDATE_SETTINGS',
      targetEntity: 'HackathonSetting',
      targetId: settings.hackathonId,
      previousState,
      newState: updatedSettings.toObject(),
      reason: req.body.reason || 'Admin updated hackathon settings',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Hackathon settings updated successfully.',
      data: updatedSettings,
    });
  } catch (error) {
    console.error('updateAdminSettings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hackathon settings.',
      error: error.message,
    });
  }
};

/**
 * 5b. Toggle Hackathon Active / Visibility Status
 * Allows Admin to turn ON / OFF Hackathon feature visibility on the user dashboard.
 */
exports.toggleHackathonActive = async (req, res) => {
  try {
    const settings = await HackathonSetting.getOrCreateSettings();
    const previousState = settings.toObject();

    if (typeof req.body.isActive === 'boolean') {
      settings.isActive = req.body.isActive;
    } else {
      settings.isActive = settings.isActive === false ? true : false;
    }

    settings.updatedBy = req.admin?.email || req.admin?.username || 'Admin';
    settings.updatedAt = new Date();
    const updatedSettings = await settings.save();

    await HackathonAuditLog.log({
      actorId: req.admin?._id || req.admin?.id || 'admin',
      actorName: req.admin?.name || req.admin?.username || 'Admin',
      actorEmail: req.admin?.email || '',
      role: 'admin',
      action: 'UPDATE_SETTINGS',
      targetEntity: 'HackathonSetting',
      targetId: settings.hackathonId,
      previousState,
      newState: updatedSettings.toObject(),
      reason: `Admin ${settings.isActive ? 'enabled' : 'disabled'} Hackathon visibility on dashboard`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Hackathon feature is now ${settings.isActive ? 'Active (Visible on Dashboard)' : 'Disabled (Hidden from Dashboard)'}.`,
      isActive: settings.isActive,
      data: updatedSettings,
    });
  } catch (error) {
    console.error('toggleHackathonActive Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle hackathon active status.',
      error: error.message,
    });
  }
};

/**
 * 6. Get Admin Audit Logs
 */
exports.getAdminAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 20), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) {
      filter.action = req.query.action;
    }
    if (req.query.targetEntity) {
      filter.targetEntity = req.query.targetEntity;
    }
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.actor) {
      const actorRegex = new RegExp(hackathonOpsService.escapeRegex(req.query.actor.trim()), 'i');
      filter.$or = [{ actorName: actorRegex }, { actorEmail: actorRegex }, { actorId: req.query.actor.trim() }];
    }
    if (req.query.teamId) {
      filter.targetId = req.query.teamId.trim().toUpperCase();
    }
    if (req.query.startDate || req.query.endDate) {
      const dateFilter = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        if (!isNaN(start.getTime())) dateFilter.$gte = start;
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        if (!isNaN(end.getTime())) dateFilter.$lte = end;
      }
      if (Object.keys(dateFilter).length > 0) {
        filter.createdAt = dateFilter;
      }
    }
    if (req.query.search) {
      const sRegex = new RegExp(hackathonOpsService.escapeRegex(req.query.search.trim()), 'i');
      filter.$or = [
        { action: sRegex },
        { actorName: sRegex },
        { actorEmail: sRegex },
        { targetId: sRegex },
        { reason: sRegex },
      ];
    }

    const [logs, total] = await Promise.all([
      HackathonAuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      HackathonAuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('getAdminAuditLogs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs.',
      error: error.message,
    });
  }
};

/**
 * 7. Preview Unstop Excel Upload
 */
exports.previewUnstopExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please provide an Excel (.xlsx or .xls) file.',
      });
    }

    const originalName = req.file.originalname || '';
    const isExcel =
      originalName.endsWith('.xlsx') ||
      originalName.endsWith('.xls') ||
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      req.file.mimetype === 'application/vnd.ms-excel';

    if (!isExcel) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Only .xlsx and .xls files are supported.',
      });
    }

    let workbookData;
    try {
      workbookData = unstopParserService.parseWorkbookBuffer(req.file.buffer);
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        message: 'Corrupted or unreadable Excel file: ' + parseErr.message,
      });
    }

    const { sheetNames, workbook } = workbookData;
    if (!sheetNames || sheetNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded Excel file contains no worksheets.',
      });
    }

    const requestedSheet = req.body.sheetName || sheetNames[0];
    const sheetData = unstopParserService.extractSheetData(workbook, requestedSheet);

    if (sheetData.rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Sheet "${sheetData.sheetName}" contains no data rows or is empty.`,
      });
    }

    let customMapping = {};
    if (req.body.customMapping) {
      try {
        customMapping = typeof req.body.customMapping === 'string'
          ? JSON.parse(req.body.customMapping)
          : req.body.customMapping;
      } catch (e) {}
    }

    const preview = await unstopParserService.generateImportPreview({
      sheetData,
      customMapping,
    });

    res.status(200).json({
      success: true,
      filename: originalName,
      sheetNames,
      activeSheet: sheetData.sheetName,
      headers: sheetData.headers,
      mappedColumns: sheetData.mappedColumns,
      stats: {
        totalRows: preview.totalRows,
        newCount: preview.newCount,
        duplicateCount: preview.duplicateCount,
        warningCount: preview.warningCount,
        invalidCount: preview.invalidCount,
        validToImportCount: preview.validToImportCount,
      },
      previewRows: preview.previewRows,
    });
  } catch (error) {
    console.error('previewUnstopExcel Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process Excel file: ' + error.message,
    });
  }
};

/**
 * 8. Commit Unstop Import to Database
 */
exports.commitUnstopImport = async (req, res) => {
  try {
    const { rows, duplicateHandling = 'SKIP', filename = 'unstop_export.xlsx' } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No row data provided for import.',
      });
    }

    const result = await unstopParserService.commitBatchImport({
      rowsToImport: rows,
      duplicateHandling,
    });

    // Write immutable audit log
    await HackathonAuditLog.log({
      actorId: req.admin?._id || req.admin?.id || 'admin',
      actorName: req.admin?.name || req.admin?.username || 'Admin',
      actorEmail: req.admin?.email || '',
      role: 'admin',
      action: 'UNSTOP_IMPORT',
      targetEntity: 'HackathonTeam',
      reason: `Imported ${result.importedCount} teams from Unstop file "${filename}". (${result.skippedCount} skipped, ${result.updatedCount} updated, ${result.failedCount} failed)`,
      newState: {
        filename,
        totalProcessed: result.totalProcessed,
        importedCount: result.importedCount,
        updatedCount: result.updatedCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
        duplicateHandling,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Import complete: ${result.importedCount} imported, ${result.skippedCount} skipped, ${result.updatedCount} updated, ${result.failedCount} failed.`,
      result,
    });
  } catch (error) {
    console.error('commitUnstopImport Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to commit import: ' + error.message,
    });
  }
};

/**
 * Helper to generate next unique teamId for manual creation
 */
const generateUniqueTeamId = async () => {
  const count = await HackathonTeam.countDocuments();
  let candidateNumber = 1001 + count;
  let candidateId = `CAN-${candidateNumber}`;
  while (await HackathonTeam.exists({ teamId: candidateId })) {
    candidateNumber++;
    candidateId = `CAN-${candidateNumber}`;
  }
  return candidateId;
};

/**
 * 9. Get Admin Teams List (Filtered, Paginated, Optimized)
 */
exports.getAdminTeams = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: { $ne: true } };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.track) {
      filter.track = req.query.track;
    }
    if (req.query.search) {
      const regex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { teamName: regex },
        { teamId: regex },
        { unstopApplicationId: regex },
        { 'leader.email': regex },
        { 'leader.name': regex },
      ];
    }

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [teams, total] = await Promise.all([
      HackathonTeam.find(filter)
        .select('-rawUnstopData') // Omit bulky raw data for list view performance
        .sort(sort)
        .skip(skip)
        .limit(limit),
      HackathonTeam.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      teams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getAdminTeams Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams.',
      error: error.message,
    });
  }
};

/**
 * 10. Get Single Admin Team Profile with Audit Logs & Raw Unstop Data
 */
exports.getAdminTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { teamId: id.toUpperCase() };

    const team = await HackathonTeam.findOne(query);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    // Fetch team-specific audit trail
    const auditLogs = await HackathonAuditLog.find({
      $or: [{ targetId: team.teamId }, { targetId: String(team._id) }],
    })
      .sort({ createdAt: -1 })
      .limit(25);

    res.status(200).json({
      success: true,
      team,
      auditLogs,
    });
  } catch (error) {
    console.error('getAdminTeamById Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team details.',
      error: error.message,
    });
  }
};

/**
 * 11. Manually Create Team (Admin)
 */
exports.createManualTeam = async (req, res) => {
  try {
    const { teamName, track, leader, members, initialIdea, submittedLinks } = req.body;

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ success: false, message: 'Team name is required.' });
    }
    if (!leader || !leader.name || !leader.email) {
      return res.status(400).json({ success: false, message: 'Leader name and email are required.' });
    }

    const teamId = await generateUniqueTeamId();

    const newTeam = new HackathonTeam({
      teamId,
      teamName: teamName.trim(),
      track: track ? track.trim() : 'General Track',
      leader: {
        name: leader.name.trim(),
        email: leader.email.trim().toLowerCase(),
        mobile: leader.mobile ? leader.mobile.trim() : '',
        college: leader.college ? leader.college.trim() : '',
        state: leader.state ? leader.state.trim() : '',
      },
      members: Array.isArray(members)
        ? members
            .map((m) => ({
              name: (m.name || '').trim(),
              email: (m.email || '').trim().toLowerCase(),
              mobile: (m.mobile || '').trim(),
              college: (m.college || '').trim(),
              state: (m.state || '').trim(),
              role: (m.role || 'Team Member').trim(),
            }))
            .filter((m) => m.name && m.email)
        : [],
      initialIdea: {
        title: initialIdea?.title ? initialIdea.title.trim() : '',
        description: initialIdea?.description || '',
        problemStatement: initialIdea?.problemStatement || '',
        proposedSolution: initialIdea?.proposedSolution || '',
        techStack: Array.isArray(initialIdea?.techStack) ? initialIdea.techStack : [],
        pptUrl: initialIdea?.pptUrl ? initialIdea.pptUrl.trim() : '',
        theme: initialIdea?.theme ? initialIdea.theme.trim() : '',
      },
      submittedLinks: {
        githubUrl: submittedLinks?.githubUrl ? submittedLinks.githubUrl.trim() : '',
        hostedProjectUrl: submittedLinks?.hostedProjectUrl ? submittedLinks.hostedProjectUrl.trim() : '',
        linkedInUrl: submittedLinks?.linkedInUrl ? submittedLinks.linkedInUrl.trim() : '',
        demoVideoUrl: submittedLinks?.demoVideoUrl ? submittedLinks.demoVideoUrl.trim() : '',
        otherLinks: Array.isArray(submittedLinks?.otherLinks) ? submittedLinks.otherLinks : [],
      },
      status: 'IMPORTED',
      source: 'MANUAL_ADMIN',
    });

    const savedTeam = await newTeam.save();

    await HackathonAuditLog.log({
      actorId: req.admin?._id || req.admin?.id || 'admin',
      actorName: req.admin?.name || req.admin?.username || 'Admin',
      actorEmail: req.admin?.email || '',
      role: 'admin',
      action: 'TEAM_CREATED_MANUALLY',
      targetEntity: 'HackathonTeam',
      targetId: savedTeam.teamId,
      newState: savedTeam.toObject(),
      reason: `Admin manually created team "${savedTeam.teamName}" (${savedTeam.teamId})`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Team manually created successfully.',
      team: savedTeam,
    });
  } catch (error) {
    console.error('createManualTeam Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create manual team: ' + error.message,
    });
  }
};

/**
 * 12. Update Team Information (Admin)
 */
exports.updateAdminTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { teamId: id.toUpperCase() };

    const team = await HackathonTeam.findOne(query);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const previousState = team.toObject();
    const { teamName, track, leader, members, initialIdea, submittedLinks } = req.body;

    if (teamName !== undefined) team.teamName = teamName.trim();
    if (track !== undefined) team.track = track.trim();

    if (leader) {
      if (leader.name !== undefined) team.leader.name = leader.name.trim();
      if (leader.email !== undefined) team.leader.email = leader.email.trim().toLowerCase();
      if (leader.mobile !== undefined) team.leader.mobile = leader.mobile.trim();
      if (leader.college !== undefined) team.leader.college = leader.college.trim();
      if (leader.state !== undefined) team.leader.state = leader.state.trim();
    }

    if (Array.isArray(members)) {
      team.members = members
        .map((m) => ({
          name: (m.name || '').trim(),
          email: (m.email || '').trim().toLowerCase(),
          mobile: (m.mobile || '').trim(),
          college: (m.college || '').trim(),
          state: (m.state || '').trim(),
          role: (m.role || 'Team Member').trim(),
        }))
        .filter((m) => m.name && m.email);
    }

    if (initialIdea) {
      if (initialIdea.title !== undefined) team.initialIdea.title = initialIdea.title.trim();
      if (initialIdea.description !== undefined) team.initialIdea.description = initialIdea.description;
      if (initialIdea.problemStatement !== undefined) team.initialIdea.problemStatement = initialIdea.problemStatement;
      if (initialIdea.proposedSolution !== undefined) team.initialIdea.proposedSolution = initialIdea.proposedSolution;
      if (initialIdea.techStack !== undefined)
        team.initialIdea.techStack = Array.isArray(initialIdea.techStack) ? initialIdea.techStack : [];
      if (initialIdea.pptUrl !== undefined) team.initialIdea.pptUrl = initialIdea.pptUrl.trim();
      if (initialIdea.theme !== undefined) team.initialIdea.theme = initialIdea.theme.trim();
    }

    if (submittedLinks) {
      if (submittedLinks.githubUrl !== undefined) team.submittedLinks.githubUrl = submittedLinks.githubUrl.trim();
      if (submittedLinks.hostedProjectUrl !== undefined)
        team.submittedLinks.hostedProjectUrl = submittedLinks.hostedProjectUrl.trim();
      if (submittedLinks.linkedInUrl !== undefined) team.submittedLinks.linkedInUrl = submittedLinks.linkedInUrl.trim();
      if (submittedLinks.demoVideoUrl !== undefined)
        team.submittedLinks.demoVideoUrl = submittedLinks.demoVideoUrl.trim();
      if (submittedLinks.otherLinks !== undefined)
        team.submittedLinks.otherLinks = Array.isArray(submittedLinks.otherLinks) ? submittedLinks.otherLinks : [];
    }

    const updatedTeam = await team.save();

    await HackathonAuditLog.log({
      actorId: req.admin?._id || req.admin?.id || 'admin',
      actorName: req.admin?.name || req.admin?.username || 'Admin',
      actorEmail: req.admin?.email || '',
      role: 'admin',
      action: 'TEAM_EDITED',
      targetEntity: 'HackathonTeam',
      targetId: team.teamId,
      previousState,
      newState: updatedTeam.toObject(),
      reason: req.body.reason || `Admin edited team details for ${team.teamId}`,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Team updated successfully.',
      team: updatedTeam,
    });
  } catch (error) {
    console.error('updateAdminTeam Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team: ' + error.message,
    });
  }
};

/**
 * 13. Soft-Delete Team (Admin)
 */
exports.deleteAdminTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { teamId: id.toUpperCase() };

    const team = await HackathonTeam.findOne(query);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const previousState = team.toObject();

    // Soft deletion preserves team data and all audit history
    team.isDeleted = true;
    team.deletedAt = new Date();
    team.deletedBy = req.admin?.name || req.admin?.username || 'Admin';
    await team.save();

    await HackathonAuditLog.log({
      actorId: req.admin?._id || req.admin?.id || 'admin',
      actorName: req.admin?.name || req.admin?.username || 'Admin',
      actorEmail: req.admin?.email || '',
      role: 'admin',
      action: 'TEAM_DELETED',
      targetEntity: 'HackathonTeam',
      targetId: team.teamId,
      previousState,
      newState: { isDeleted: true, deletedAt: team.deletedAt, deletedBy: team.deletedBy },
      reason: req.body.reason || `Admin soft-deleted team "${team.teamName}" (${team.teamId})`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Team ${team.teamName} (${team.teamId}) deleted successfully.`,
    });
  } catch (error) {
    console.error('deleteAdminTeam Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team: ' + error.message,
    });
  }
};

/**
 * 14. Update Initial Review Scores, Notes, and Tags (Admin)
 */
exports.updateTeamReview = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { teamId: id.toUpperCase() };

    const team = await HackathonTeam.findOne(query);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const previousReview = team.adminReview ? { ...team.adminReview } : {};
    const { scores, notes, tags } = req.body;

    const parseScore = (val, currentVal) => {
      if (val === null || val === undefined || val === '') return currentVal ?? null;
      const num = Number(val);
      if (isNaN(num)) return currentVal ?? null;
      return Math.max(0, Math.min(10, num));
    };

    const parsedScores = {
      innovation: parseScore(scores?.innovation, team.adminReview?.scores?.innovation),
      ideaQuality: parseScore(scores?.ideaQuality, team.adminReview?.scores?.ideaQuality),
      feasibility: parseScore(scores?.feasibility, team.adminReview?.scores?.feasibility),
      presentation: parseScore(scores?.presentation, team.adminReview?.scores?.presentation),
    };

    let totalScore = null;
    const scoreVals = [
      parsedScores.innovation,
      parsedScores.ideaQuality,
      parsedScores.feasibility,
      parsedScores.presentation,
    ].filter((v) => v !== null && !isNaN(v));

    if (scoreVals.length > 0) {
      totalScore = scoreVals.reduce((acc, curr) => acc + curr, 0);
    }

    team.adminReview = {
      reviewedBy: req.admin?.name || req.admin?.username || 'Admin',
      reviewedAt: new Date(),
      notes: notes !== undefined ? notes : team.adminReview?.notes || '',
      scores: parsedScores,
      totalScore,
      tags: Array.isArray(tags) ? tags : team.adminReview?.tags || [],
    };

    // Auto-advance lifecycle from IMPORTED to UNDER_REVIEW
    if (team.status === 'IMPORTED') {
      team.status = 'UNDER_REVIEW';
    }

    const updatedTeam = await team.save();

    await HackathonAuditLog.log({
      actorId: req.admin?._id || req.admin?.id || 'admin',
      actorName: req.admin?.name || req.admin?.username || 'Admin',
      actorEmail: req.admin?.email || '',
      role: 'admin',
      action: 'TEAM_REVIEW_UPDATED',
      targetEntity: 'HackathonTeam',
      targetId: team.teamId,
      previousState: { adminReview: previousReview },
      newState: { adminReview: updatedTeam.adminReview, status: updatedTeam.status },
      reason: `Saved initial review (Score: ${totalScore !== null ? `${totalScore}/40` : 'N/A'}) for ${team.teamId}`,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Review saved successfully.',
      adminReview: updatedTeam.adminReview,
      status: updatedTeam.status,
    });
  } catch (error) {
    console.error('updateTeamReview Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review: ' + error.message,
    });
  }
};

/**
 * 15. Update Team Lifecycle Status (Shortlist / Reject / Under Review)
 * PRD Phase 3 Rule: Shortlist ONLY updates database status and records audit log.
 * Strictly NO emails, NO payment triggers, NO WhatsApp releases at Phase 3.
 */
exports.updateTeamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, note } = req.body;

    const allowedTransitions = ['IMPORTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'CONFIRMED'];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition. Allowed: ${allowedTransitions.join(', ')}`,
      });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { teamId: id.toUpperCase() };

    const team = await HackathonTeam.findOne(query);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const previousStatus = team.status;
    team.status = status;

    let auditAction = 'TEAM_STATUS_UPDATED';

    if (status === 'SHORTLISTED') {
      team.shortlistedAt = team.shortlistedAt || new Date();
      auditAction = 'TEAM_SHORTLISTED';

      // Phase 4: Idempotent Shortlist Email to Team Leader
      if (team.shortlistEmailStatus !== 'SENT' && !team.shortlistEmailSent) {
        try {
          const settings = await HackathonSetting.getOrCreateSettings();
          const portalUrl = `${process.env.CLIENT_URL || 'https://code-a-nova.online'}/hackathon`;
          await hackathonEmailService.sendShortlistEmail({ team, settings, portalUrl });
          team.shortlistEmailSent = true;
          team.shortlistEmailSentAt = new Date();
          team.shortlistEmailStatus = 'SENT';
          team.shortlistEmailError = '';

          await HackathonAuditLog.log({
            actorId: req.admin?._id || req.admin?.id || 'admin',
            actorName: req.admin?.name || req.admin?.username || 'Admin',
            actorEmail: req.admin?.email || '',
            role: 'admin',
            action: 'SHORTLIST_EMAIL_SENT',
            targetEntity: 'HackathonTeam',
            targetId: team.teamId,
            reason: `Shortlist notification email delivered to team leader (${team.leader?.email})`,
            req,
          });
        } catch (emailErr) {
          console.error('Shortlist email error:', emailErr.message);
          team.shortlistEmailStatus = 'FAILED';
          team.shortlistEmailError = emailErr.message;

          await HackathonAuditLog.log({
            actorId: req.admin?._id || req.admin?.id || 'admin',
            actorName: req.admin?.name || req.admin?.username || 'Admin',
            actorEmail: req.admin?.email || '',
            role: 'admin',
            action: 'SHORTLIST_EMAIL_FAILED',
            targetEntity: 'HackathonTeam',
            targetId: team.teamId,
            reason: `Email delivery failed: ${emailErr.message}`,
            req,
          });
        }
      }
    } else if (status === 'REJECTED') {
      if (rejectionReason) {
        team.rejectionReason = rejectionReason.trim();
      }
      auditAction = 'TEAM_REJECTED';
    }

    const updatedTeam = await team.save();

    await HackathonAuditLog.log({
      actorId: req.admin?._id || req.admin?.id || 'admin',
      actorName: req.admin?.name || req.admin?.username || 'Admin',
      actorEmail: req.admin?.email || '',
      role: 'admin',
      action: auditAction,
      targetEntity: 'HackathonTeam',
      targetId: team.teamId,
      previousState: { status: previousStatus },
      newState: {
        status: updatedTeam.status,
        rejectionReason: updatedTeam.rejectionReason,
        shortlistEmailStatus: updatedTeam.shortlistEmailStatus,
      },
      reason: note || rejectionReason || `Status transitioned from ${previousStatus} to ${status}`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Team status updated to ${status}.`,
      team: {
        teamId: updatedTeam.teamId,
        status: updatedTeam.status,
        shortlistedAt: updatedTeam.shortlistedAt,
        shortlistEmailStatus: updatedTeam.shortlistEmailStatus,
        rejectionReason: updatedTeam.rejectionReason,
      },
    });
  } catch (error) {
    console.error('updateTeamStatus Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status: ' + error.message,
    });
  }
};

/**
 * 16. Admin Resend Shortlist Notification Email
 */
exports.resendShortlistEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { teamId: id.toUpperCase() };

    const team = await HackathonTeam.findOne(query);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.status !== 'SHORTLISTED') {
      return res.status(400).json({
        success: false,
        message: 'Team must have SHORTLISTED status to send shortlist email.',
      });
    }

    const settings = await HackathonSetting.getOrCreateSettings();
    const portalUrl = `${process.env.CLIENT_URL || 'https://code-a-nova.online'}/hackathon`;

    try {
      await hackathonEmailService.sendShortlistEmail({ team, settings, portalUrl });
      team.shortlistEmailSent = true;
      team.shortlistEmailSentAt = new Date();
      team.shortlistEmailStatus = 'SENT';
      team.shortlistEmailError = '';
      await team.save();

      await HackathonAuditLog.log({
        actorId: req.admin?._id || req.admin?.id || 'admin',
        actorName: req.admin?.name || req.admin?.username || 'Admin',
        actorEmail: req.admin?.email || '',
        role: 'admin',
        action: 'SHORTLIST_EMAIL_SENT',
        targetEntity: 'HackathonTeam',
        targetId: team.teamId,
        reason: `Admin manually resent shortlist notification email to leader (${team.leader?.email})`,
        req,
      });

      res.status(200).json({
        success: true,
        message: `Shortlist notification email resent successfully to ${team.leader?.email}`,
      });
    } catch (sendErr) {
      team.shortlistEmailStatus = 'FAILED';
      team.shortlistEmailError = sendErr.message;
      await team.save();

      await HackathonAuditLog.log({
        actorId: req.admin?._id || req.admin?.id || 'admin',
        actorName: req.admin?.name || req.admin?.username || 'Admin',
        actorEmail: req.admin?.email || '',
        role: 'admin',
        action: 'SHORTLIST_EMAIL_FAILED',
        targetEntity: 'HackathonTeam',
        targetId: team.teamId,
        reason: `Manual resend failed: ${sendErr.message}`,
        req,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to send email: ' + sendErr.message,
      });
    }
  } catch (error) {
    console.error('resendShortlistEmail Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

/**
 * 17. Participant Payment: Create Razorpay Order for ₹49 Team Fee
 * PRD Steps 3, 4, 6 & 7: Strictly enforced for Team Leader only, server-configured fee
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.unifiedUserId || req.user?.userId;
    let userEmail = req.user?.email;

    if (!userEmail && userId) {
      const user = await User.findById(userId).select('email name');
      if (user) userEmail = user.email;
    }

    if (!userEmail && !userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Session credentials missing.',
      });
    }

    const query = {
      isDeleted: { $ne: true },
      $or: [],
    };
    if (userId) {
      query.$or.push({ 'leader.userId': userId }, { 'members.userId': userId });
    }
    if (userEmail) {
      const normalized = userEmail.toLowerCase().trim();
      query.$or.push({ 'leader.email': normalized }, { 'members.email': normalized });
    }

    const team = await HackathonTeam.findOne(query);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No registered hackathon team found for your account.',
      });
    }

    // PRD Step 4: Strict Team Leader Authorization Check
    const isLeader =
      (userId && team.leader?.userId && String(team.leader.userId) === String(userId)) ||
      (userEmail && team.leader?.email && team.leader.email.toLowerCase() === userEmail.toLowerCase());

    if (!isLeader) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Participation confirmation payment can only be initiated by the designated Team Leader.',
      });
    }

    // PRD Step 6: Verify team status is strictly SHORTLISTED
    if (team.status !== 'SHORTLISTED') {
      return res.status(400).json({
        success: false,
        message: `Participation payment is not active for this team. Current status: ${team.status}. Team must be SHORTLISTED first.`,
      });
    }

    // PRD Step 17: Check if already paid / confirmed
    if (team.paymentStatus === 'PAID' || team.status === 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Team participation fee has already been paid and confirmed.',
      });
    }

    // PRD Step 6 & 21: Read fee from HackathonSettings
    const settings = await HackathonSetting.getOrCreateSettings();
    const amount = Number(settings.participationFee) >= 0 ? Number(settings.participationFee) : 49;

    // Rule: Payment is only accepted until 1 hour before hackathon starts
    if (settings?.startDate && process.env.NODE_ENV !== 'test') {
      const startTime = new Date(settings.startDate).getTime();
      if (!isNaN(startTime)) {
        const cutoffTime = startTime - (60 * 60 * 1000); // 1 hour before start
        if (Date.now() > cutoffTime) {
          return res.status(400).json({
            success: false,
            message: 'Participation confirmation payment window has closed. Payments were accepted until 1 hour before the hackathon start time.',
          });
        }
      }
    }

    // Create Razorpay Order (smallest currency unit: paise)
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${team.teamId}_${Date.now().toString().slice(-6)}`,
      notes: {
        teamId: team.teamId,
        teamName: team.teamName,
        leaderEmail: team.leader?.email,
      },
    };

    const order = await razorpayInstance.orders.create(options);
    if (!order || !order.id) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment gateway order.',
      });
    }

    // Create / update HackathonPayment record
    await HackathonPayment.create({
      teamId: team.teamId,
      leaderId: userId || null,
      leaderEmail: team.leader.email,
      amount,
      currency: 'INR',
      gateway: 'RAZORPAY',
      orderId: order.id,
      status: 'PENDING',
    });

    // Update team payment state to PENDING
    team.paymentStatus = 'PENDING';
    team.paymentDetails = {
      ...team.paymentDetails,
      amount,
      currency: 'INR',
      orderId: order.id,
    };
    await team.save();

    // Audit log
    await HackathonAuditLog.log({
      actorId: String(userId || team.leader.email),
      actorName: team.leader.name,
      actorEmail: team.leader.email,
      role: 'participant',
      action: 'PAYMENT_CREATED',
      targetEntity: 'HackathonPayment',
      targetId: order.id,
      reason: `Team leader initiated ₹${amount} confirmation payment for ${team.teamId}`,
      req,
    });

    res.status(200).json({
      success: true,
      order,
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount,
      amountInPaise: order.amount,
      currency: 'INR',
      teamName: team.teamName,
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        leaderName: team.leader.name,
        leaderEmail: team.leader.email,
        leaderMobile: team.leader.mobile,
      },
    });
  } catch (error) {
    console.error('createPaymentOrder Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating payment order: ' + error.message,
    });
  }
};

/**
 * 18. Participant Payment: Server-Side Signature Verification & Team Confirmation
 * PRD Steps 9, 11 & 13: Verifies HMAC signature, confirms team, unlocks WhatsApp community
 * Production Hardened: Validates user identity, team ownership, leader role, amount integrity, and timing-safe HMAC
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification credentials.',
      });
    }

    // 1. Identify Authenticated User from Session
    const userId = req.user?.id || req.user?.unifiedUserId || req.user?.userId;
    let userEmail = req.user?.email;

    if (!userEmail && userId) {
      const user = await User.findById(userId).select('email name');
      if (user) userEmail = user.email;
    }

    if (!userEmail && !userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Session credentials missing.',
      });
    }

    // 2. Locate Internal Payment Record
    const payment = await HackathonPayment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment order record not found in system.',
      });
    }

    // 3. Locate Associated Team
    const team = await HackathonTeam.findOne({ teamId: payment.teamId, isDeleted: { $ne: true } });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Associated team not found or has been deactivated.',
      });
    }

    // 4. Strict Team Leader Authorization Check
    const isLeader =
      (userId && team.leader?.userId && String(team.leader.userId) === String(userId)) ||
      (userEmail && team.leader?.email && team.leader.email.toLowerCase() === userEmail.toLowerCase());

    if (!isLeader) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the designated Team Leader can verify payment confirmation for this team.',
      });
    }

    // 5. Status Transition Integrity Check
    if (team.status !== 'SHORTLISTED' && !(team.status === 'CONFIRMED' && team.paymentStatus === 'PAID')) {
      return res.status(400).json({
        success: false,
        message: `Payment confirmation rejected. Team status is '${team.status}', not SHORTLISTED.`,
      });
    }

    // 6. Payment Amount Integrity Check
    if (!payment.amount || payment.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification rejected: Invalid payment amount.',
      });
    }

    const settings = await HackathonSetting.getOrCreateSettings();

    // 7. Idempotency Check: If already confirmed & paid
    if (team.paymentStatus === 'PAID' && team.status === 'CONFIRMED') {
      return res.status(200).json({
        success: true,
        message: 'Participation already confirmed.',
        team: {
          teamId: team.teamId,
          teamName: team.teamName,
          status: team.status,
          paymentStatus: team.paymentStatus,
          confirmedAt: team.confirmedAt,
          paymentDetails: team.paymentDetails,
        },
        whatsAppLink: settings.whatsAppLink,
      });
    }

    // 8. Timing-Safe HMAC Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const sigBuf = Buffer.from(razorpay_signature, 'utf8');

    if (
      expectedBuf.length !== sigBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, sigBuf)
    ) {
      await HackathonPayment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'FAILED', failureReason: 'Invalid signature mismatch' }
      );
      await HackathonAuditLog.log({
        actorId: String(userId || team.leader.email),
        actorName: team.leader.name,
        actorEmail: team.leader.email,
        role: 'participant',
        action: 'PAYMENT_FAILED',
        targetEntity: 'HackathonPayment',
        targetId: razorpay_order_id,
        reason: 'Payment signature verification mismatch',
        req,
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
    }

    // 9. Atomic Update on Team (Guarantees single execution in concurrent race conditions)
    const previousStatus = team.status;
    const now = new Date();

    const updatedTeam = await HackathonTeam.findOneAndUpdate(
      {
        teamId: team.teamId,
        paymentStatus: { $ne: 'PAID' },
      },
      {
        $set: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          confirmedAt: now,
          confirmationSource: 'PAYMENT',
          'paymentDetails.amount': payment.amount,
          'paymentDetails.currency': payment.currency || 'INR',
          'paymentDetails.orderId': razorpay_order_id,
          'paymentDetails.paymentId': razorpay_payment_id,
          'paymentDetails.paidAt': now,
          'paymentDetails.paymentMethod': 'RAZORPAY',
          'paymentDetails.razorpaySignature': razorpay_signature,
        },
      },
      { new: true }
    );

    // 10. Update Payment Record
    await HackathonPayment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        $set: {
          status: 'PAID',
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          paidAt: now,
        },
      }
    );

    // 11. Record Audit Logs (Only once if this call actually transitioned the team)
    if (updatedTeam) {
      await HackathonAuditLog.log({
        actorId: String(userId || team.leader.email),
        actorName: team.leader.name,
        actorEmail: team.leader.email,
        role: 'participant',
        action: 'PAYMENT_VERIFIED',
        targetEntity: 'HackathonPayment',
        targetId: razorpay_order_id,
        reason: `Verified ₹${payment.amount} payment (Payment ID: ${razorpay_payment_id})`,
        req,
      });

      await HackathonAuditLog.log({
        actorId: String(userId || team.leader.email),
        actorName: team.leader.name,
        actorEmail: team.leader.email,
        role: 'participant',
        action: 'TEAM_CONFIRMED',
        targetEntity: 'HackathonTeam',
        targetId: team.teamId,
        previousState: { status: previousStatus, paymentStatus: team.paymentStatus },
        newState: { status: 'CONFIRMED', paymentStatus: 'PAID' },
        reason: 'Team confirmed participation upon successful payment verification',
        req,
      });

      await HackathonAuditLog.log({
        actorId: 'SYSTEM',
        actorName: 'System',
        actorEmail: 'system@code-a-nova.online',
        role: 'system',
        action: 'WHATSAPP_ACCESS_UNLOCKED',
        targetEntity: 'HackathonTeam',
        targetId: team.teamId,
        reason: 'Official WhatsApp group link unlocked for confirmed team',
        req,
      });
    }

    const currentTeam = updatedTeam || team;

    res.status(200).json({
      success: true,
      message: 'Participation successfully confirmed! WhatsApp community access unlocked.',
      team: {
        teamId: currentTeam.teamId,
        teamName: currentTeam.teamName,
        status: currentTeam.status,
        paymentStatus: currentTeam.paymentStatus,
        confirmedAt: currentTeam.confirmedAt,
        paymentDetails: currentTeam.paymentDetails,
      },
      whatsAppLink: settings.whatsAppLink,
    });
  } catch (error) {
    console.error('verifyPayment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed: ' + error.message,
    });
  }
};

/**
 * 19. Payment Webhook: Secure, Idempotent Gateway Event Handler
 * PRD Step 10: Handles asynchronous gateway webhooks (order.paid / payment.captured)
 * Production Hardened: Uses rawBody, timingSafeEqual, atomic team transition, and sanitizes payload
 */
exports.handlePaymentWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!signature || typeof signature !== 'string' || !webhookSecret) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature or secret.' });
    }

    // Verify HMAC using rawBody Buffer if available, fallback to serialized body
    const rawPayload = req.rawBody ? req.rawBody : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');

    if (
      expectedBuf.length !== sigBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, sigBuf)
    ) {
      console.warn('Hackathon Webhook signature mismatch.');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = req.body.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const amount = (paymentEntity?.amount || 0) / 100;

      if (!orderId) {
        return res.status(200).json({ success: true, message: 'Ignored: No order_id present in webhook.' });
      }

      const payment = await HackathonPayment.findOne({ orderId });
      if (!payment) {
        return res.status(200).json({ success: true, message: 'Order not recognized as a Hackathon payment.' });
      }

      const team = await HackathonTeam.findOne({ teamId: payment.teamId, isDeleted: { $ne: true } });
      if (!team) {
        return res.status(200).json({ success: true, message: 'Team associated with order not found.' });
      }

      // Check status transition integrity: Must be SHORTLISTED or already CONFIRMED
      if (team.status !== 'SHORTLISTED' && !(team.status === 'CONFIRMED' && team.paymentStatus === 'PAID')) {
        console.warn(`Webhook ignored: Team ${team.teamId} has status '${team.status}', not eligible for confirmation.`);
        return res.status(200).json({ success: true, message: `Team status is '${team.status}', not eligible for confirmation.` });
      }

      // Atomic update: transition team to CONFIRMED only if not already PAID
      const now = new Date();
      const updatedTeam = await HackathonTeam.findOneAndUpdate(
        {
          teamId: team.teamId,
          paymentStatus: { $ne: 'PAID' },
        },
        {
          $set: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            confirmedAt: now,
            confirmationSource: 'WEBHOOK',
            'paymentDetails.amount': amount || payment.amount,
            'paymentDetails.currency': 'INR',
            'paymentDetails.orderId': orderId,
            'paymentDetails.paymentId': paymentId,
            'paymentDetails.paidAt': now,
            'paymentDetails.paymentMethod': 'RAZORPAY',
          },
        },
        { new: true }
      );

      // Sanitize stored webhook payload to avoid storing sensitive card/bank data (Item 13)
      const sanitizedPayload = {
        event,
        orderId,
        paymentId,
        amount,
        currency: paymentEntity?.currency,
        status: paymentEntity?.status,
        method: paymentEntity?.method,
        createdAt: req.body.created_at,
      };

      await HackathonPayment.findOneAndUpdate(
        { orderId },
        {
          $set: {
            status: 'PAID',
            paymentId: paymentId || payment.paymentId,
            paidAt: now,
            webhookReceived: true,
            webhookPayload: sanitizedPayload,
          },
        }
      );

      // Log audit records only if this webhook execution performed the state transition
      if (updatedTeam) {
        await HackathonAuditLog.log({
          actorId: 'GATEWAY_WEBHOOK',
          actorName: 'Razorpay Webhook',
          actorEmail: 'webhook@razorpay.com',
          role: 'system',
          action: 'PAYMENT_WEBHOOK_RECEIVED',
          targetEntity: 'HackathonPayment',
          targetId: orderId,
          reason: `Webhook event "${event}" processed for order ${orderId}`,
          req,
        });

        await HackathonAuditLog.log({
          actorId: 'SYSTEM',
          actorName: 'System',
          actorEmail: 'system@code-a-nova.online',
          role: 'system',
          action: 'TEAM_CONFIRMED',
          targetEntity: 'HackathonTeam',
          targetId: team.teamId,
          previousState: { status: team.status, paymentStatus: team.paymentStatus },
          newState: { status: 'CONFIRMED', paymentStatus: 'PAID' },
          reason: `Team confirmed participation via gateway webhook (${event})`,
          req,
        });

        await HackathonAuditLog.log({
          actorId: 'SYSTEM',
          actorName: 'System',
          actorEmail: 'system@code-a-nova.online',
          role: 'system',
          action: 'WHATSAPP_ACCESS_UNLOCKED',
          targetEntity: 'HackathonTeam',
          targetId: team.teamId,
          reason: 'Official WhatsApp group link unlocked via gateway webhook confirmation',
          req,
        });
      }

      return res.status(200).json({ success: true, message: 'Webhook processed successfully.' });
    } else if (event === 'payment.failed') {
      const paymentEntity = req.body.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        await HackathonPayment.findOneAndUpdate(
          { orderId, status: { $ne: 'PAID' } },
          {
            $set: {
              status: 'FAILED',
              failureReason: paymentEntity?.error_description || 'Payment failed via webhook',
            },
          }
        );
      }
      return res.status(200).json({ success: true, message: 'Payment failure recorded.' });
    }

    res.status(200).json({ success: true, message: `Ignored unhandled event: ${event}` });
  } catch (error) {
    console.error('handlePaymentWebhook Error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing error: ' + error.message,
    });
  }
};

/**
 * =========================================================================
 * PHASE 5: FINAL PROJECT SUBMISSION SYSTEM (Participant & Admin)
 * =========================================================================
 */

/**
 * 23. Get Participant Submission
 * GET /api/hackathon/submission/my-submission
 * Accessible to authenticated members of a confirmed team.
 */
exports.getMySubmission = async (req, res) => {
  try {
    const resolved = await resolveParticipantTeam(req);
    if (resolved.errorStatus) {
      return res.status(resolved.errorStatus).json({ success: false, message: resolved.errorMessage });
    }

    const { team, isLeader, userId, userEmail } = resolved;

    // Step 4: Access project submission portal for confirmed/submitted teams
    const allowedStatuses = [
      'CONFIRMED',
      'SUBMISSION_PENDING',
      'SUBMITTED',
      'UNDER_EVALUATION',
      'EVALUATED',
      'RESULT_PUBLISHED',
      'SHORTLISTED',
    ];
    if (!allowedStatuses.includes(team.status)) {
      return res.status(403).json({
        success: false,
        isEligible: false,
        teamStatus: team.status,
        message: `Your team status is "${team.status}". Only CONFIRMED teams can access the project submission portal.`,
      });
    }

    const settings = await HackathonSetting.getOrCreateSettings();
    const serverTime = new Date();
    const isDeadlinePassed = settings.submissionDeadline ? serverTime > new Date(settings.submissionDeadline) : false;

    // Retrieve or initialize submission document
    let submission = await HackathonSubmission.findOne({
      $or: [{ team: team._id }, { teamId: team.teamId }],
    });
    if (!submission) {
      submission = {
        hackathonId: settings.hackathonId || 'can-hackathon-2026',
        team: team._id,
        teamId: team.teamId,
        projectName: team.initialIdea?.title || '',
        projectDescription: team.initialIdea?.description || '',
        problemStatement: team.initialIdea?.problemStatement || '',
        proposedSolution: team.initialIdea?.proposedSolution || '',
        techStack: team.initialIdea?.techStack || [],
        githubUrl: team.submittedLinks?.githubUrl || '',
        hostedProjectUrl: team.submittedLinks?.hostedProjectUrl || '',
        linkedInUrl: team.submittedLinks?.linkedInUrl || '',
        demoVideoUrl: team.submittedLinks?.demoVideoUrl || '',
        otherLinks: team.submittedLinks?.otherLinks || [],
        status: 'NOT_STARTED',
        isLocked: false,
        draftSavedAt: null,
        submittedAt: null,
      };
    }

    res.status(200).json({
      success: true,
      isEligible: true,
      isLeader,
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        track: team.track,
        status: team.status,
        initialIdea: team.initialIdea,
      },
      submission,
      settings: {
        isSubmissionOpen: settings.isSubmissionOpen,
        submissionDeadline: settings.submissionDeadline,
        serverTime,
      },
      isDeadlinePassed,
    });
  } catch (error) {
    console.error('getMySubmission Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve submission details.',
      error: error.message,
    });
  }
};

/**
 * 24. Save Submission Draft
 * POST /api/hackathon/submission/save-draft
 * Leader-only. Validates basic URL formatting, saves safely without finalizing.
 */
exports.saveSubmissionDraft = async (req, res) => {
  try {
    const resolved = await resolveParticipantTeam(req);
    if (resolved.errorStatus) {
      return res.status(resolved.errorStatus).json({ success: false, message: resolved.errorMessage });
    }

    const { team, isLeader, userId, userEmail } = resolved;

    // Step 5: Team Ownership - Only Leader can create/edit draft
    if (!isLeader) {
      return res.status(403).json({
        success: false,
        message: 'Only the Team Leader is authorized to modify or save the project submission.',
      });
    }

    // Step 4: Eligibility
    const allowedStatuses = ['CONFIRMED', 'SUBMISSION_PENDING', 'SUBMITTED'];
    if (!allowedStatuses.includes(team.status)) {
      return res.status(403).json({
        success: false,
        message: `Your team status is "${team.status}". Only CONFIRMED teams can draft project submissions.`,
      });
    }

    const settings = await HackathonSetting.getOrCreateSettings();
    const serverTime = new Date();

    // Step 12: Deadline & Window enforcement
    if (!settings.isSubmissionOpen) {
      return res.status(400).json({
        success: false,
        message: 'Project submissions are currently closed by hackathon organizers.',
      });
    }

    if (settings.submissionDeadline && serverTime > new Date(settings.submissionDeadline)) {
      await HackathonAuditLog.log({
        actorId: String(userId || 'unknown'),
        actorName: req.user?.name || team.leader?.name || 'Leader',
        actorEmail: userEmail || team.leader?.email || '',
        role: 'participant',
        action: 'SUBMISSION_DEADLINE_REACHED',
        targetEntity: 'HackathonSubmission',
        targetId: team.teamId,
        reason: 'Attempted to save draft after official submission deadline.',
        req,
      });

      return res.status(400).json({
        success: false,
        message: 'Submission deadline has passed. Drafts can no longer be updated.',
      });
    }

    // Step 14: Final Submission Lock check
    let submission = await HackathonSubmission.findOne({
      $or: [{ team: team._id }, { teamId: team.teamId }],
    });
    if (submission && String(submission.team) !== String(team._id)) {
      submission.team = team._id;
    }
    if (submission && submission.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Your submission is finalized and locked. You cannot modify a locked submission.',
      });
    }

    const isFirstTime = !submission || submission.status === 'NOT_STARTED';

    const {
      projectName,
      projectDescription,
      problemStatement,
      proposedSolution,
      techStack,
      githubUrl,
      hostedProjectUrl,
      linkedInUrl,
      demoVideoUrl,
      otherLinks,
      additionalNotes,
    } = req.body;

    // Step 9: Server-side URL format validation for any provided URLs
    let safeGithub = '';
    let safeHosted = '';
    let safeLinkedIn = '';
    let safeDemo = '';
    const safeOtherLinks = [];

    if (githubUrl) safeGithub = validateSafeUrl(githubUrl, 'GitHub Repository URL');
    if (hostedProjectUrl) safeHosted = validateSafeUrl(hostedProjectUrl, 'Hosted Project URL');
    if (linkedInUrl) safeLinkedIn = validateSafeUrl(linkedInUrl, 'LinkedIn URL');
    if (demoVideoUrl) safeDemo = validateSafeUrl(demoVideoUrl, 'Demo Video URL');

    if (Array.isArray(otherLinks)) {
      for (let i = 0; i < otherLinks.length; i++) {
        if (otherLinks[i] && typeof otherLinks[i] === 'string' && otherLinks[i].trim()) {
          safeOtherLinks.push(validateSafeUrl(otherLinks[i], `Other Link #${i + 1}`));
        }
      }
    }

    if (!submission) {
      submission = new HackathonSubmission({
        hackathonId: settings.hackathonId || 'can-hackathon-2026',
        team: team._id,
        teamId: team.teamId,
        submittedBy: userId,
        submitterEmail: userEmail || team.leader.email,
        submitterName: req.user?.name || team.leader.name,
      });
    }

    if (projectName !== undefined) submission.projectName = projectName.trim();
    if (projectDescription !== undefined) submission.projectDescription = projectDescription;
    if (problemStatement !== undefined) submission.problemStatement = problemStatement;
    if (proposedSolution !== undefined) submission.proposedSolution = proposedSolution;
    if (techStack !== undefined) {
      submission.techStack = Array.isArray(techStack)
        ? techStack.map((t) => String(t).trim()).filter(Boolean)
        : [];
    }
    if (githubUrl !== undefined) submission.githubUrl = safeGithub;
    if (hostedProjectUrl !== undefined) submission.hostedProjectUrl = safeHosted;
    if (linkedInUrl !== undefined) submission.linkedInUrl = safeLinkedIn;
    if (demoVideoUrl !== undefined) submission.demoVideoUrl = safeDemo;
    if (otherLinks !== undefined) submission.otherLinks = safeOtherLinks;
    if (additionalNotes !== undefined) submission.additionalNotes = additionalNotes.trim();

    submission.status = 'DRAFT';
    submission.draftSavedAt = serverTime;
    submission.lastUpdatedAt = serverTime;

    await submission.save();

    // Link submission to team
    if (!team.submissionId || String(team.submissionId) !== String(submission._id)) {
      team.submissionId = submission._id;
      await team.save();
    }

    // Step 19: Audit Logging
    await HackathonAuditLog.log({
      actorId: String(userId || 'unknown'),
      actorName: req.user?.name || team.leader?.name || 'Leader',
      actorEmail: userEmail || team.leader?.email || '',
      role: 'participant',
      action: isFirstTime ? 'SUBMISSION_STARTED' : 'SUBMISSION_DRAFT_SAVED',
      targetEntity: 'HackathonSubmission',
      targetId: team.teamId,
      newState: { status: 'DRAFT', projectName: submission.projectName },
      reason: 'Participant saved submission draft',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Draft saved successfully.',
      submission,
    });
  } catch (error) {
    console.error('saveSubmissionDraft Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to save submission draft.',
    });
  }
};

/**
 * 25. Final Project Submission
 * POST /api/hackathon/submission/final-submit
 * Leader-only. Strict validation of all fields, creates immutable snapshot, permanently locks submission.
 */
exports.finalSubmitProject = async (req, res) => {
  try {
    const resolved = await resolveParticipantTeam(req);
    if (resolved.errorStatus) {
      return res.status(resolved.errorStatus).json({ success: false, message: resolved.errorMessage });
    }

    const { team, isLeader, userId, userEmail } = resolved;

    // Step 5: Team Ownership - Leader only
    if (!isLeader) {
      return res.status(403).json({
        success: false,
        message: 'Only the Team Leader is authorized to finalize and submit the project.',
      });
    }

    // Step 4: Eligibility
    if (team.status !== 'CONFIRMED' && team.status !== 'SUBMISSION_PENDING') {
      if (team.status === 'SUBMITTED') {
        return res.status(400).json({
          success: false,
          message: 'Your project has already been finalized and submitted.',
        });
      }
      return res.status(403).json({
        success: false,
        message: `Your team status is "${team.status}". Only CONFIRMED teams can submit final projects.`,
      });
    }

    const settings = await HackathonSetting.getOrCreateSettings();
    const serverTime = new Date();

    // Step 12: Deadline & Window enforcement
    if (!settings.isSubmissionOpen) {
      await HackathonAuditLog.log({
        actorId: String(userId || 'unknown'),
        actorName: req.user?.name || team.leader?.name || 'Leader',
        actorEmail: userEmail || team.leader?.email || '',
        role: 'participant',
        action: 'SUBMISSION_REJECTED_BY_SYSTEM',
        targetEntity: 'HackathonSubmission',
        targetId: team.teamId,
        reason: 'Attempted to finalize submission while submissions are closed.',
        req,
      });

      return res.status(400).json({
        success: false,
        message: 'Project submissions are currently closed by hackathon organizers.',
      });
    }

    if (settings.submissionDeadline && serverTime > new Date(settings.submissionDeadline)) {
      await HackathonAuditLog.log({
        actorId: String(userId || 'unknown'),
        actorName: req.user?.name || team.leader?.name || 'Leader',
        actorEmail: userEmail || team.leader?.email || '',
        role: 'participant',
        action: 'SUBMISSION_DEADLINE_REACHED',
        targetEntity: 'HackathonSubmission',
        targetId: team.teamId,
        reason: 'Attempted to finalize submission after official submission deadline.',
        req,
      });

      return res.status(400).json({
        success: false,
        message: 'Submission deadline has passed. Final submission cannot be accepted.',
      });
    }

    // Step 14: Final Submission Lock check
    let submission = await HackathonSubmission.findOne({
      $or: [{ team: team._id }, { teamId: team.teamId }],
    });
    if (submission && String(submission.team) !== String(team._id)) {
      submission.team = team._id;
    }
    if (submission && submission.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'This submission is already finalized and locked.',
      });
    }

    const {
      projectName,
      projectDescription,
      problemStatement,
      proposedSolution,
      techStack,
      githubUrl,
      hostedProjectUrl,
      linkedInUrl,
      demoVideoUrl,
      otherLinks,
      additionalNotes,
    } = req.body;

    // Step 11: Server-side validation of all required fields
    if (!projectName || !projectName.trim()) {
      return res.status(400).json({ success: false, message: 'Project Name is required.' });
    }
    if (!projectDescription || !projectDescription.trim()) {
      return res.status(400).json({ success: false, message: 'Project Description is required.' });
    }
    if (!problemStatement || !problemStatement.trim()) {
      return res.status(400).json({ success: false, message: 'Problem Statement is required.' });
    }
    if (!proposedSolution || !proposedSolution.trim()) {
      return res.status(400).json({ success: false, message: 'Proposed Solution is required.' });
    }

    const parsedTechStack = Array.isArray(techStack)
      ? techStack.map((t) => String(t).trim()).filter(Boolean)
      : [];
    if (parsedTechStack.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one technology must be listed in Tech Stack.' });
    }

    if (!githubUrl || !githubUrl.trim()) {
      return res.status(400).json({ success: false, message: 'GitHub Repository URL is required.' });
    }
    if (!hostedProjectUrl || !hostedProjectUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Hosted Project URL is required.' });
    }
    if (!linkedInUrl || !linkedInUrl.trim()) {
      return res.status(400).json({ success: false, message: 'LinkedIn URL is required.' });
    }
    if (!demoVideoUrl || !demoVideoUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Demo Video URL is required.' });
    }

    // Step 9: Validate URLs server-side
    const safeGithub = validateSafeUrl(githubUrl, 'GitHub Repository URL');
    const safeHosted = validateSafeUrl(hostedProjectUrl, 'Hosted Project URL');
    const safeLinkedIn = validateSafeUrl(linkedInUrl, 'LinkedIn URL');
    const safeDemo = validateSafeUrl(demoVideoUrl, 'Demo Video URL');

    const safeOtherLinks = [];
    if (Array.isArray(otherLinks)) {
      for (let i = 0; i < otherLinks.length; i++) {
        if (otherLinks[i] && typeof otherLinks[i] === 'string' && otherLinks[i].trim()) {
          safeOtherLinks.push(validateSafeUrl(otherLinks[i], `Other Link #${i + 1}`));
        }
      }
    }

    // Step 15: Freeze immutable snapshot
    const snapshot = {
      hackathonId: settings.hackathonId || 'can-hackathon-2026',
      teamId: team.teamId,
      teamName: team.teamName,
      track: team.track,
      projectName: projectName.trim(),
      projectDescription: projectDescription.trim(),
      problemStatement: problemStatement.trim(),
      proposedSolution: proposedSolution.trim(),
      techStack: parsedTechStack,
      githubUrl: safeGithub,
      hostedProjectUrl: safeHosted,
      linkedInUrl: safeLinkedIn,
      demoVideoUrl: safeDemo,
      otherLinks: safeOtherLinks,
      additionalNotes: additionalNotes ? additionalNotes.trim() : '',
      submittedBy: {
        userId: userId || null,
        email: userEmail || team.leader.email,
        name: req.user?.name || team.leader.name,
      },
      submittedAt: serverTime,
      frozenAt: serverTime,
    };

    if (!submission) {
      submission = new HackathonSubmission({
        hackathonId: settings.hackathonId || 'can-hackathon-2026',
        team: team._id,
        teamId: team.teamId,
      });
    }

    submission.submittedBy = userId;
    submission.submitterEmail = userEmail || team.leader.email;
    submission.submitterName = req.user?.name || team.leader.name;
    submission.projectName = projectName.trim();
    submission.projectDescription = projectDescription.trim();
    submission.problemStatement = problemStatement.trim();
    submission.proposedSolution = proposedSolution.trim();
    submission.techStack = parsedTechStack;
    submission.githubUrl = safeGithub;
    submission.hostedProjectUrl = safeHosted;
    submission.linkedInUrl = safeLinkedIn;
    submission.demoVideoUrl = safeDemo;
    submission.otherLinks = safeOtherLinks;
    submission.additionalNotes = additionalNotes ? additionalNotes.trim() : '';
    submission.status = 'SUBMITTED';
    submission.isLocked = true;
    submission.submittedAt = serverTime;
    submission.lastUpdatedAt = serverTime;
    submission.snapshot = snapshot;

    await submission.save();

    // Update Team record: status and legacy links (preserving team.initialIdea untouched!)
    team.status = 'SUBMITTED';
    team.submissionId = submission._id;
    team.submittedLinks = {
      githubUrl: safeGithub,
      hostedProjectUrl: safeHosted,
      linkedInUrl: safeLinkedIn,
      demoVideoUrl: safeDemo,
      otherLinks: safeOtherLinks,
    };
    team.finalSubmission = {
      projectTitle: projectName.trim(),
      description: projectDescription.trim(),
      githubUrl: safeGithub,
      liveDemoUrl: safeHosted,
      videoDemoUrl: safeDemo,
      techStack: parsedTechStack,
      submittedAt: serverTime,
    };
    await team.save();

    // Step 19: Audit Logging
    await HackathonAuditLog.log({
      actorId: String(userId || 'unknown'),
      actorName: req.user?.name || team.leader?.name || 'Leader',
      actorEmail: userEmail || team.leader?.email || '',
      role: 'participant',
      action: 'SUBMISSION_FINALIZED',
      targetEntity: 'HackathonSubmission',
      targetId: team.teamId,
      newState: { status: 'SUBMITTED', projectName: submission.projectName },
      reason: 'Participant finalized and submitted hackathon project.',
      req,
    });

    await HackathonAuditLog.log({
      actorId: String(userId || 'unknown'),
      actorName: req.user?.name || team.leader?.name || 'Leader',
      actorEmail: userEmail || team.leader?.email || '',
      role: 'participant',
      action: 'SUBMISSION_LOCKED',
      targetEntity: 'HackathonSubmission',
      targetId: team.teamId,
      reason: 'Project submission permanently locked upon final submission.',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Project finalized and submitted successfully! Your submission is now locked.',
      submission,
    });
  } catch (error) {
    console.error('finalSubmitProject Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to finalize project submission.',
    });
  }
};

/**
 * 26. Admin Submissions List
 * GET /api/hackathon/admin/submissions
 * Supports search, track filter, status filter, and pagination
 */
exports.getAdminSubmissions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { search, status, track } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { projectName: regex },
        { teamId: regex },
        { submitterEmail: regex },
        { submitterName: regex },
      ];
    }

    const [submissions, total] = await Promise.all([
      HackathonSubmission.find(query)
        .populate({
          path: 'team',
          select: 'teamId teamName track leader members status paymentStatus initialIdea confirmedAt',
        })
        .sort({ submittedAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HackathonSubmission.countDocuments(query),
    ]);

    let filtered = submissions;
    if (track && track !== 'ALL') {
      filtered = submissions.filter((s) => s.team?.track === track);
    }

    res.status(200).json({
      success: true,
      submissions: filtered,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('getAdminSubmissions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve submissions.',
      error: error.message,
    });
  }
};

/**
 * 27. Admin Get Submission by Team ID
 * GET /api/hackathon/admin/submissions/team/:teamId
 */
exports.getAdminSubmissionByTeamId = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await HackathonTeam.findOne({
      $or: [{ teamId }, { _id: mongoose.isValidObjectId(teamId) ? teamId : null }],
      isDeleted: { $ne: true },
    }).lean();

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const submission = await HackathonSubmission.findOne({ team: team._id }).lean();
    const auditLogs = await HackathonAuditLog.find({
      targetId: team.teamId,
      action: { $regex: /^SUBMISSION_/ },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      team,
      submission,
      auditLogs,
    });
  } catch (error) {
    console.error('getAdminSubmissionByTeamId Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team submission detail.',
      error: error.message,
    });
  }
};

/**
 * 28. Admin Unlock Submission
 * POST /api/hackathon/admin/submissions/:id/unlock
 */
exports.unlockAdminSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await HackathonSubmission.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { teamId: id }],
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission record not found.' });
    }

    submission.isLocked = false;
    submission.status = 'DRAFT';
    await submission.save();

    // Also reset team status back to CONFIRMED so drafting is allowed
    const team = await HackathonTeam.findById(submission.team);
    if (team && team.status === 'SUBMITTED') {
      team.status = 'CONFIRMED';
      await team.save();
    }

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Administrator',
      actorEmail: req.user?.email || 'admin@code-a-nova.online',
      role: 'admin',
      action: 'SUBMISSION_UNLOCKED',
      targetEntity: 'HackathonSubmission',
      targetId: submission.teamId,
      reason: req.body.reason || 'Admin unlocked submission for participant revision.',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Submission unlocked successfully. Team can now edit and re-submit.',
      submission,
    });
  } catch (error) {
    console.error('unlockAdminSubmission Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock submission.',
      error: error.message,
    });
  }
};

// ==========================================================
// PHASE 6: EDITORIAL / JUDGE MANAGEMENT & EVALUATION CONTROLLERS
// ==========================================================

/**
 * 29. Admin Get Editorial Members
 * GET /api/hackathon/admin/editorial-members
 */
exports.getAdminEditorialMembers = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = { hackathonId: 'can-hackathon-2026' };

    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const members = await HackathonEditorialMember.find(query).sort({ createdAt: -1 }).lean();

    // Enrich with assignment and finalized counts
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        const assignedTeamsCount = await HackathonEditorialAssignment.countDocuments({
          editorialMember: member._id,
          status: 'ACTIVE',
        });
        const completedEvaluationsCount = await HackathonEditorialEvaluation.countDocuments({
          editorialMember: member._id,
          status: 'FINALIZED',
        });
        return {
          ...member,
          assignedTeamsCount,
          completedEvaluationsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      members: enrichedMembers,
    });
  } catch (error) {
    console.error('getAdminEditorialMembers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch editorial members.',
      error: error.message,
    });
  }
};

/**
 * 30. Admin Create Editorial Member
 * POST /api/hackathon/admin/editorial-members
 */
exports.createAdminEditorialMember = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Initial password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await HackathonEditorialMember.findOne({
      email: cleanEmail,
      hackathonId: 'can-hackathon-2026',
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An editorial member with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const member = await HackathonEditorialMember.create({
      hackathonId: 'can-hackathon-2026',
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'editorial',
      isActive: isActive !== false,
      mustChangePassword: true,
      createdBy: req.user?.email || 'admin',
    });

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Administrator',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'EDITORIAL_ACCOUNT_CREATED',
      targetEntity: 'HackathonEditorialMember',
      targetId: String(member._id),
      newState: {
        name: member.name,
        email: member.email,
        role: member.role,
        isActive: member.isActive,
      },
      req,
    });

    // Optionally send welcome notification in background
    hackathonEmailService
      .sendEditorialWelcomeEmail({ email: member.email, name: member.name })
      .catch((err) => console.error('Failed to send editorial welcome email:', err));

    res.status(201).json({
      success: true,
      message: 'Editorial member account created successfully.',
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        isActive: member.isActive,
        mustChangePassword: member.mustChangePassword,
        createdAt: member.createdAt,
      },
    });
  } catch (error) {
    console.error('createAdminEditorialMember Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create editorial member.',
      error: error.message,
    });
  }
};

/**
 * 31. Admin Update Editorial Member (Profile / Active Toggle)
 * PUT /api/hackathon/admin/editorial-members/:id
 */
exports.updateAdminEditorialMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const member = await HackathonEditorialMember.findById(id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Editorial member not found.' });
    }

    const prevState = {
      name: member.name,
      isActive: member.isActive,
    };

    let action = 'EDITORIAL_ACCOUNT_UPDATED';

    if (name && name.trim()) {
      member.name = name.trim();
    }

    if (typeof isActive === 'boolean' && isActive !== member.isActive) {
      member.isActive = isActive;
      if (!isActive) {
        member.deactivatedAt = new Date();
        action = 'EDITORIAL_ACCOUNT_DEACTIVATED';
      } else {
        member.deactivatedAt = null;
        action = 'EDITORIAL_ACCOUNT_REACTIVATED';
      }
    }

    await member.save();

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Administrator',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action,
      targetEntity: 'HackathonEditorialMember',
      targetId: String(member._id),
      previousState: prevState,
      newState: { name: member.name, isActive: member.isActive },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Editorial member updated successfully.',
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        isActive: member.isActive,
        mustChangePassword: member.mustChangePassword,
        deactivatedAt: member.deactivatedAt,
        updatedAt: member.updatedAt,
      },
    });
  } catch (error) {
    console.error('updateAdminEditorialMember Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update editorial member.',
      error: error.message,
    });
  }
};

/**
 * 32. Admin Reset Editorial Member Password
 * POST /api/hackathon/admin/editorial-members/:id/reset-password
 */
exports.resetAdminEditorialMemberPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.',
      });
    }

    const member = await HackathonEditorialMember.findById(id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Editorial member not found.' });
    }

    member.passwordHash = await bcrypt.hash(newPassword, 10);
    member.mustChangePassword = true;
    member.passwordChangedAt = new Date();
    await member.save();

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Administrator',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'EDITORIAL_PASSWORD_RESET',
      targetEntity: 'HackathonEditorialMember',
      targetId: String(member._id),
      reason: 'Admin initiated password reset. First-login password change enforced.',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. The member will be required to change it on login.',
    });
  } catch (error) {
    console.error('resetAdminEditorialMemberPassword Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
      error: error.message,
    });
  }
};

/**
 * 33. Admin Get Editorial Assignments
 * GET /api/hackathon/admin/editorial-assignments
 */
exports.getAdminEditorialAssignments = async (req, res) => {
  try {
    const { editorialMemberId, teamId, status } = req.query;
    const query = { hackathonId: 'can-hackathon-2026' };

    if (status) query.status = status;
    if (editorialMemberId) query.editorialMember = editorialMemberId;
    if (teamId) {
      query.$or = [{ teamId }, { team: mongoose.isValidObjectId(teamId) ? teamId : null }];
    }

    const assignments = await HackathonEditorialAssignment.find(query)
      .populate('team')
      .populate('submission')
      .populate('editorialMember', 'name email role isActive')
      .sort({ assignedAt: -1 })
      .lean();

    // Attach evaluation details to each assignment
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const evaluation = await HackathonEditorialEvaluation.findOne({
          team: assignment.team?._id,
          editorialMember: assignment.editorialMember?._id,
        }).lean();

        return {
          ...assignment,
          evaluation: evaluation
            ? {
                _id: evaluation._id,
                status: evaluation.status,
                totalScore: evaluation.totalScore,
                scores: evaluation.scores,
                comments: evaluation.comments,
                isLocked: evaluation.isLocked,
                finalizedAt: evaluation.finalizedAt,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      assignments: enrichedAssignments,
    });
  } catch (error) {
    console.error('getAdminEditorialAssignments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch editorial assignments.',
      error: error.message,
    });
  }
};

/**
 * 34. Admin Assign Project to Judge
 * POST /api/hackathon/admin/editorial-assignments
 */
exports.createAdminEditorialAssignment = async (req, res) => {
  try {
    const { teamId, editorialMemberId, notes } = req.body;

    if (!teamId || !editorialMemberId) {
      return res.status(400).json({
        success: false,
        message: 'Both teamId and editorialMemberId are required.',
      });
    }

    const team = await HackathonTeam.findOne({
      $or: [{ teamId }, { _id: mongoose.isValidObjectId(teamId) ? teamId : null }],
      isDeleted: { $ne: true },
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Eligible hackathon team not found.' });
    }

    // Eligibility check: Team must be confirmed or submitted
    const eligibleStatuses = ['CONFIRMED', 'SUBMISSION_PENDING', 'SUBMITTED', 'UNDER_EVALUATION', 'EVALUATED', 'RESULT_PUBLISHED', 'SHORTLISTED'];
    if (!eligibleStatuses.includes(team.status)) {
      return res.status(400).json({
        success: false,
        message: `Team is not eligible for judging assignment. Current status: "${team.status}". Must be confirmed.`,
      });
    }

    // Must have a valid submission
    const submission = await HackathonSubmission.findOne({
      $or: [{ team: team._id }, { teamId: team.teamId }],
    });
    if (!submission || submission.status === 'NOT_STARTED') {
      return res.status(400).json({
        success: false,
        message: 'Team does not have a final project submission to evaluate.',
      });
    }

    const judge = await HackathonEditorialMember.findById(editorialMemberId);
    if (!judge) {
      return res.status(404).json({ success: false, message: 'Editorial member / judge not found.' });
    }

    if (!judge.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign project to a deactivated judge account.',
      });
    }

    // Check duplicate active assignment
    const existingActive = await HackathonEditorialAssignment.findOne({
      team: team._id,
      editorialMember: judge._id,
      status: 'ACTIVE',
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `Team "${team.teamName}" is already assigned to Judge "${judge.name}".`,
      });
    }

    const assignment = await HackathonEditorialAssignment.create({
      hackathonId: team.hackathonId || 'can-hackathon-2026',
      team: team._id,
      teamId: team.teamId,
      submission: submission._id,
      editorialMember: judge._id,
      status: 'ACTIVE',
      assignedBy: req.user?.email || 'admin',
      notes: notes || '',
    });

    // Initialize or bind HackathonEditorialEvaluation
    let evaluation = await HackathonEditorialEvaluation.findOne({
      team: team._id,
      editorialMember: judge._id,
    });

    if (!evaluation) {
      evaluation = await HackathonEditorialEvaluation.create({
        hackathonId: team.hackathonId || 'can-hackathon-2026',
        team: team._id,
        teamId: team.teamId,
        submission: submission._id,
        editorialMember: judge._id,
        assignment: assignment._id,
        status: 'NOT_STARTED',
        scores: [],
        totalScore: 0,
      });
    } else {
      evaluation.assignment = assignment._id;
      await evaluation.save();
    }

    // Transition team status to UNDER_EVALUATION if currently SUBMITTED
    if (team.status === 'SUBMITTED') {
      team.status = 'UNDER_EVALUATION';
      await team.save();
    }

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Administrator',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'EDITORIAL_ASSIGNMENT_CREATED',
      targetEntity: 'HackathonEditorialAssignment',
      targetId: String(assignment._id),
      newState: {
        teamId: team.teamId,
        teamName: team.teamName,
        editorialMemberId: judge._id,
        judgeName: judge.name,
        notes: assignment.notes,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Successfully assigned project to Judge "${judge.name}".`,
      assignment,
      evaluation,
    });
  } catch (error) {
    console.error('createAdminEditorialAssignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign project to judge.',
      error: error.message,
    });
  }
};

/**
 * 35. Admin Remove Judge Assignment
 * DELETE /api/hackathon/admin/editorial-assignments/:id
 */
exports.deleteAdminEditorialAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await HackathonEditorialAssignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found.' });
    }

    assignment.status = 'UNASSIGNED';
    assignment.unassignedAt = new Date();
    assignment.unassignedBy = req.user?.email || 'admin';
    await assignment.save();

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Administrator',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'EDITORIAL_ASSIGNMENT_REMOVED',
      targetEntity: 'HackathonEditorialAssignment',
      targetId: String(assignment._id),
      previousState: { status: 'ACTIVE', teamId: assignment.teamId },
      newState: { status: 'UNASSIGNED' },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Judge assignment removed successfully.',
    });
  } catch (error) {
    console.error('deleteAdminEditorialAssignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove assignment.',
      error: error.message,
    });
  }
};

/**
 * 36. Admin Get Editorial Evaluations & Aggregated Scores
 * GET /api/hackathon/admin/editorial-evaluations
 */
exports.getAdminEditorialEvaluations = async (req, res) => {
  try {
    const { teamId, editorialMemberId, status, track } = req.query;
    const query = { hackathonId: 'can-hackathon-2026' };

    if (status) query.status = status;
    if (editorialMemberId) query.editorialMember = editorialMemberId;

    const evaluations = await HackathonEditorialEvaluation.find(query)
      .populate('team')
      .populate('editorialMember', 'name email role isActive')
      .populate('submission')
      .sort({ updatedAt: -1 })
      .lean();

    // Filter by teamId or track if provided
    let filteredEvaluations = evaluations;
    if (teamId) {
      filteredEvaluations = filteredEvaluations.filter(
        (e) => e.teamId === teamId || String(e.team?._id) === String(teamId)
      );
    }
    if (track && track !== 'ALL') {
      filteredEvaluations = filteredEvaluations.filter((e) => e.team?.track === track);
    }

    // Aggregation Foundation per Team (PRD Section 15 & 32)
    const teamAggregationMap = {};

    filteredEvaluations.forEach((evalDoc) => {
      const tId = evalDoc.teamId;
      if (!teamAggregationMap[tId]) {
        teamAggregationMap[tId] = {
          teamId: tId,
          teamName: evalDoc.team?.teamName || 'Unknown Team',
          track: evalDoc.team?.track || 'General Track',
          leaderName: evalDoc.team?.leader?.name || '',
          evaluations: [],
          totalFinalizedScores: 0,
          finalizedCount: 0,
          averageScore: 0,
        };
      }

      teamAggregationMap[tId].evaluations.push({
        evaluationId: evalDoc._id,
        judgeName: evalDoc.editorialMember?.name || 'Judge',
        judgeEmail: evalDoc.editorialMember?.email || '',
        status: evalDoc.status,
        isLocked: evalDoc.isLocked,
        scores: evalDoc.scores,
        totalScore: evalDoc.totalScore,
        comments: evalDoc.comments,
        finalizedAt: evalDoc.finalizedAt,
      });

      if (evalDoc.status === 'FINALIZED') {
        teamAggregationMap[tId].totalFinalizedScores += evalDoc.totalScore || 0;
        teamAggregationMap[tId].finalizedCount += 1;
      }
    });

    const aggregatedResults = Object.values(teamAggregationMap).map((item) => ({
      ...item,
      averageScore: item.finalizedCount > 0 ? Number((item.totalFinalizedScores / item.finalizedCount).toFixed(2)) : 0,
    }));

    // Sort aggregated results descending by average score
    aggregatedResults.sort((a, b) => b.averageScore - a.averageScore);

    res.status(200).json({
      success: true,
      evaluations: filteredEvaluations,
      aggregatedResults,
    });
  } catch (error) {
    console.error('getAdminEditorialEvaluations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch editorial evaluations.',
      error: error.message,
    });
  }
};

/**
 * 37. Admin Reopen Finalized Evaluation
 * POST /api/hackathon/admin/editorial-evaluations/:id/reopen
 */
exports.reopenAdminEditorialEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const evaluation = await HackathonEditorialEvaluation.findById(id).populate('team').populate('editorialMember');
    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation record not found.' });
    }

    const prevState = {
      status: evaluation.status,
      isLocked: evaluation.isLocked,
    };

    evaluation.status = 'REOPENED';
    evaluation.isLocked = false;
    evaluation.reopenedAt = new Date();
    evaluation.reopenedBy = req.user?.email || 'admin';
    evaluation.reopenReason = reason || 'Admin explicitly reopened evaluation for score adjustments.';
    await evaluation.save();

    // Ensure team status reflects that evaluation is open
    const team = await HackathonTeam.findById(evaluation.team?._id || evaluation.team);
    if (team && team.status === 'EVALUATED') {
      team.status = 'UNDER_EVALUATION';
      await team.save();
    }

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Administrator',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'EDITORIAL_EVALUATION_REOPENED',
      targetEntity: 'HackathonEditorialEvaluation',
      targetId: String(evaluation._id),
      previousState: prevState,
      newState: { status: 'REOPENED', isLocked: false, reason: evaluation.reopenReason },
      reason: evaluation.reopenReason,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Evaluation reopened successfully. Judge can now edit scores.',
      evaluation,
    });
  } catch (error) {
    console.error('reopenAdminEditorialEvaluation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reopen evaluation.',
      error: error.message,
    });
  }
};

/**
 * 38. Editorial Judge Login
 * POST /api/hackathon/editorial/login
 */
exports.editorialLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const member = await HackathonEditorialMember.findOne({
      email: email.toLowerCase().trim(),
      hackathonId: 'can-hackathon-2026',
    }).select('+passwordHash');

    if (!member) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await member.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!member.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This Editorial account has been deactivated. Please contact the administrator.',
      });
    }

    member.lastLoginAt = new Date();
    await member.save();

    const token = member.generateAuthToken();

    await HackathonAuditLog.log({
      actorId: String(member._id),
      actorName: member.name,
      actorEmail: member.email,
      role: 'editorial',
      action: 'EDITORIAL_LOGIN',
      targetEntity: 'HackathonEditorialMember',
      targetId: String(member._id),
      req,
    });

    res.status(200).json({
      success: true,
      token,
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        mustChangePassword: member.mustChangePassword,
        lastLoginAt: member.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('editorialLogin Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process editorial login.',
      error: error.message,
    });
  }
};

/**
 * 39. Editorial Judge Logout
 * POST /api/hackathon/editorial/logout
 */
exports.editorialLogout = async (req, res) => {
  try {
    if (req.editorialMember) {
      await HackathonAuditLog.log({
        actorId: String(req.editorialMember._id),
        actorName: req.editorialMember.name,
        actorEmail: req.editorialMember.email,
        role: 'editorial',
        action: 'EDITORIAL_LOGOUT',
        targetEntity: 'HackathonEditorialMember',
        targetId: String(req.editorialMember._id),
        req,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('editorialLogout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process logout.',
      error: error.message,
    });
  }
};

/**
 * 40. Get Logged-in Editorial Profile
 * GET /api/hackathon/editorial/me
 */
exports.getEditorialMe = async (req, res) => {
  try {
    const member = req.editorialMember;
    res.status(200).json({
      success: true,
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        mustChangePassword: member.mustChangePassword,
        lastLoginAt: member.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('getEditorialMe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch editorial profile.',
      error: error.message,
    });
  }
};

/**
 * 41. Editorial Change Password
 * PUT /api/hackathon/editorial/password
 */
exports.changeEditorialPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.',
      });
    }

    const member = await HackathonEditorialMember.findById(req.editorialMember._id).select('+passwordHash');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const isMatch = await member.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    member.passwordHash = await bcrypt.hash(newPassword, 10);
    member.mustChangePassword = false;
    member.passwordChangedAt = new Date();
    await member.save();

    await HackathonAuditLog.log({
      actorId: String(member._id),
      actorName: member.name,
      actorEmail: member.email,
      role: 'editorial',
      action: 'EDITORIAL_PASSWORD_RESET',
      targetEntity: 'HackathonEditorialMember',
      targetId: String(member._id),
      reason: 'Editorial member updated password self-service.',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('changeEditorialPassword Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password.',
      error: error.message,
    });
  }
};

/**
 * 42. Editorial Dashboard Summary
 * GET /api/hackathon/editorial/dashboard
 */
exports.getEditorialDashboard = async (req, res) => {
  try {
    const judgeId = req.editorialMember._id;

    const activeAssignments = await HackathonEditorialAssignment.find({
      editorialMember: judgeId,
      status: 'ACTIVE',
    }).select('team');

    const assignedTeamIds = activeAssignments.map((a) => a.team);

    const evaluations = await HackathonEditorialEvaluation.find({
      editorialMember: judgeId,
      team: { $in: assignedTeamIds },
    });

    const completedCount = evaluations.filter((e) => e.status === 'FINALIZED').length;
    const pendingCount = activeAssignments.length - completedCount;

    res.status(200).json({
      success: true,
      stats: {
        assignedCount: activeAssignments.length,
        completedCount,
        pendingCount,
      },
    });
  } catch (error) {
    console.error('getEditorialDashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch editorial dashboard.',
      error: error.message,
    });
  }
};

/**
 * 43. Editorial Assigned Projects List
 * GET /api/hackathon/editorial/projects
 */
exports.getEditorialProjects = async (req, res) => {
  try {
    const judgeId = req.editorialMember._id;

    const assignments = await HackathonEditorialAssignment.find({
      editorialMember: judgeId,
      status: 'ACTIVE',
    })
      .populate('team')
      .populate('submission')
      .sort({ assignedAt: -1 })
      .lean();

    const projects = await Promise.all(
      assignments.map(async (assignment) => {
        const team = assignment.team;
        if (!team || team.isDeleted) return null;

        const evaluation = await HackathonEditorialEvaluation.findOne({
          team: team._id,
          editorialMember: judgeId,
        }).lean();

        return {
          assignmentId: assignment._id,
          teamId: team.teamId,
          teamName: team.teamName,
          track: team.track,
          leaderName: team.leader?.name || '',
          memberCount: (team.members?.length || 0) + 1,
          submissionStatus: assignment.submission?.status || 'SUBMITTED',
          submittedAt: assignment.submission?.submittedAt || assignment.assignedAt,
          evaluationStatus: evaluation ? evaluation.status : 'NOT_STARTED',
          totalScore: evaluation ? evaluation.totalScore : 0,
          isLocked: evaluation ? evaluation.isLocked : false,
          finalizedAt: evaluation ? evaluation.finalizedAt : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      projects: projects.filter(Boolean),
    });
  } catch (error) {
    console.error('getEditorialProjects Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned projects.',
      error: error.message,
    });
  }
};

/**
 * 44. Editorial Get Project Detail for Evaluation
 * GET /api/hackathon/editorial/projects/:teamId
 */
exports.getEditorialProjectDetail = async (req, res) => {
  try {
    const { teamId } = req.params;
    const judgeId = req.editorialMember._id;

    const team = await HackathonTeam.findOne({
      $or: [{ teamId }, { _id: mongoose.isValidObjectId(teamId) ? teamId : null }],
      isDeleted: { $ne: true },
    }).lean();

    if (!team) {
      return res.status(404).json({ success: false, message: 'Hackathon team not found.' });
    }

    // Strict Assignment Verification (Section 6 & 18): Judge can only access assigned projects
    const assignment = await HackathonEditorialAssignment.findOne({
      team: team._id,
      editorialMember: judgeId,
      status: 'ACTIVE',
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not assigned to evaluate this team project.',
      });
    }

    const submission = await HackathonSubmission.findOne({ team: team._id }).lean();

    // Data Sanitization (PRD Section 28): Strip private phone, email, payment details, admin notes
    const sanitizedTeam = {
      _id: team._id,
      teamId: team.teamId,
      teamName: team.teamName,
      track: team.track,
      leader: {
        name: team.leader?.name || 'Leader',
        college: team.leader?.college || '',
        state: team.leader?.state || '',
      },
      members: (team.members || []).map((m) => ({
        name: m.name,
        college: m.college,
        state: m.state,
      })),
      initialIdea: {
        title: team.initialIdea?.title || '',
        description: team.initialIdea?.description || '',
        problemStatement: team.initialIdea?.problemStatement || '',
        proposedSolution: team.initialIdea?.proposedSolution || '',
        techStack: team.initialIdea?.techStack || [],
        pptUrl: team.initialIdea?.pptUrl || '',
      },
    };

    const sanitizedSubmission = submission
      ? {
          _id: submission._id,
          projectName: submission.projectName,
          projectDescription: submission.projectDescription,
          problemStatement: submission.problemStatement,
          proposedSolution: submission.proposedSolution,
          techStack: submission.techStack,
          githubUrl: submission.githubUrl,
          hostedProjectUrl: submission.hostedProjectUrl,
          linkedInUrl: submission.linkedInUrl,
          demoVideoUrl: submission.demoVideoUrl,
          otherLinks: submission.otherLinks,
          submittedAt: submission.submittedAt,
        }
      : null;

    const settings = await HackathonSetting.getOrCreateSettings();

    let evaluation = await HackathonEditorialEvaluation.findOne({
      team: team._id,
      editorialMember: judgeId,
    });

    if (!evaluation) {
      evaluation = await HackathonEditorialEvaluation.create({
        hackathonId: team.hackathonId || 'can-hackathon-2026',
        team: team._id,
        teamId: team.teamId,
        submission: submission?._id,
        editorialMember: judgeId,
        assignment: assignment._id,
        status: 'NOT_STARTED',
        scores: [],
        totalScore: 0,
      });
    }

    await HackathonAuditLog.log({
      actorId: String(judgeId),
      actorName: req.editorialMember.name,
      actorEmail: req.editorialMember.email,
      role: 'editorial',
      action: 'EDITORIAL_PROJECT_OPENED',
      targetEntity: 'HackathonEditorialEvaluation',
      targetId: team.teamId,
      req,
    });

    res.status(200).json({
      success: true,
      team: sanitizedTeam,
      submission: sanitizedSubmission,
      evaluation,
      judgingCriteria: settings.judgingCriteria || [],
    });
  } catch (error) {
    console.error('getEditorialProjectDetail Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project evaluation detail.',
      error: error.message,
    });
  }
};

/**
 * 45. Editorial Audit Deliverable Link Click
 * POST /api/hackathon/editorial/projects/:teamId/audit-link-click
 */
exports.auditEditorialLinkClick = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { linkType } = req.body;
    const judgeId = req.editorialMember._id;

    const team = await HackathonTeam.findOne({
      $or: [{ teamId }, { _id: mongoose.isValidObjectId(teamId) ? teamId : null }],
      isDeleted: { $ne: true },
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    // Verify judge assignment
    const assignment = await HackathonEditorialAssignment.findOne({
      team: team._id,
      editorialMember: judgeId,
      status: 'ACTIVE',
    });

    if (!assignment) {
      return res.status(403).json({ success: false, message: 'Forbidden: Not assigned to this team.' });
    }

    const actionMap = {
      PPT: 'EDITORIAL_PPT_VIEWED',
      GITHUB: 'EDITORIAL_GITHUB_OPENED',
      HOSTED_LINK: 'EDITORIAL_HOSTED_LINK_OPENED',
      LINKEDIN: 'EDITORIAL_LINKEDIN_OPENED',
      DEMO: 'EDITORIAL_DEMO_OPENED',
    };

    const action = actionMap[linkType] || 'EDITORIAL_PROJECT_OPENED';

    await HackathonAuditLog.log({
      actorId: String(judgeId),
      actorName: req.editorialMember.name,
      actorEmail: req.editorialMember.email,
      role: 'editorial',
      action,
      targetEntity: 'HackathonSubmission',
      targetId: team.teamId,
      reason: `Judge inspected deliverable link: ${linkType}`,
      req,
    });

    res.status(200).json({ success: true, message: 'Link interaction audited.' });
  } catch (error) {
    console.error('auditEditorialLinkClick Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to audit link click.',
      error: error.message,
    });
  }
};

/**
 * 46. Editorial Save Evaluation Draft
 * POST /api/hackathon/editorial/projects/:teamId/evaluation/draft
 */
exports.saveEditorialEvaluationDraft = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { scores, comments } = req.body;
    const judgeId = req.editorialMember._id;

    const team = await HackathonTeam.findOne({
      $or: [{ teamId }, { _id: mongoose.isValidObjectId(teamId) ? teamId : null }],
      isDeleted: { $ne: true },
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const assignment = await HackathonEditorialAssignment.findOne({
      team: team._id,
      editorialMember: judgeId,
      status: 'ACTIVE',
    });

    if (!assignment) {
      return res.status(403).json({ success: false, message: 'Forbidden: Not assigned to evaluate this team.' });
    }

    const evaluation = await HackathonEditorialEvaluation.findOne({
      team: team._id,
      editorialMember: judgeId,
    });

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation record not found.' });
    }

    if (evaluation.isLocked || evaluation.status === 'FINALIZED') {
      return res.status(400).json({
        success: false,
        message: 'Evaluation is finalized and locked. Contact hackathon administrator to reopen.',
      });
    }

    // Validate partial scores if provided
    let calculatedTotal = 0;
    if (Array.isArray(scores)) {
      for (const s of scores) {
        const num = Number(s.score);
        if (isNaN(num) || num < 0 || (s.maxScore && num > s.maxScore)) {
          return res.status(400).json({
            success: false,
            message: `Invalid score for criterion "${s.criterion}". Score must be between 0 and ${s.maxScore || 100}.`,
          });
        }
        calculatedTotal += num;
      }
      evaluation.scores = scores;
      evaluation.totalScore = calculatedTotal;
    }

    if (comments !== undefined) {
      evaluation.comments = String(comments);
    }

    evaluation.status = 'IN_PROGRESS';
    if (!evaluation.startedAt) evaluation.startedAt = new Date();
    evaluation.lastUpdatedAt = new Date();
    await evaluation.save();

    await HackathonAuditLog.log({
      actorId: String(judgeId),
      actorName: req.editorialMember.name,
      actorEmail: req.editorialMember.email,
      role: 'editorial',
      action: 'EDITORIAL_EVALUATION_DRAFT_SAVED',
      targetEntity: 'HackathonEditorialEvaluation',
      targetId: team.teamId,
      newState: { scores: evaluation.scores, totalScore: evaluation.totalScore },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Evaluation draft saved successfully.',
      evaluation,
    });
  } catch (error) {
    console.error('saveEditorialEvaluationDraft Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save evaluation draft.',
      error: error.message,
    });
  }
};

/**
 * 47. Editorial Finalize Evaluation
 * POST /api/hackathon/editorial/projects/:teamId/evaluation/finalize
 */
exports.finalizeEditorialEvaluation = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { scores, comments } = req.body;
    const judgeId = req.editorialMember._id;

    const team = await HackathonTeam.findOne({
      $or: [{ teamId }, { _id: mongoose.isValidObjectId(teamId) ? teamId : null }],
      isDeleted: { $ne: true },
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const assignment = await HackathonEditorialAssignment.findOne({
      team: team._id,
      editorialMember: judgeId,
      status: 'ACTIVE',
    });

    if (!assignment) {
      return res.status(403).json({ success: false, message: 'Forbidden: Not assigned to evaluate this team.' });
    }

    const evaluation = await HackathonEditorialEvaluation.findOne({
      team: team._id,
      editorialMember: judgeId,
    });

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation record not found.' });
    }

    if (evaluation.isLocked || evaluation.status === 'FINALIZED') {
      return res.status(400).json({
        success: false,
        message: 'Evaluation is already finalized and locked.',
      });
    }

    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation scores array is required for finalization.',
      });
    }

    const settings = await HackathonSetting.getOrCreateSettings();
    const requiredCriteria = settings.judgingCriteria || [];

    // Mandatory Criteria Check: Every criterion configured in HackathonSetting must have a valid score
    for (const crit of requiredCriteria) {
      const matched = scores.find(
        (s) => s.criterion && s.criterion.toLowerCase().trim() === crit.title.toLowerCase().trim()
      );

      if (!matched || matched.score === undefined || matched.score === null || matched.score === '') {
        return res.status(400).json({
          success: false,
          message: `Missing mandatory score for criterion: "${crit.title}".`,
        });
      }

      const num = Number(matched.score);
      if (isNaN(num) || num < 0 || num > crit.maxScore) {
        return res.status(400).json({
          success: false,
          message: `Invalid score for criterion "${crit.title}". Score must be a number between 0 and ${crit.maxScore}.`,
        });
      }
    }

    // Calculate server-side total score (NEVER trust frontend totalScore)
    const serverTotalScore = scores.reduce((sum, s) => sum + Number(s.score || 0), 0);

    evaluation.scores = scores;
    evaluation.totalScore = serverTotalScore;
    if (comments !== undefined) evaluation.comments = String(comments);
    evaluation.status = 'FINALIZED';
    evaluation.isLocked = true;
    evaluation.finalizedAt = new Date();
    evaluation.lastUpdatedAt = new Date();
    evaluation.version = (evaluation.version || 1) + 1;
    await evaluation.save();

    // Check if all active judges have finalized to update team status
    const allAssignments = await HackathonEditorialAssignment.find({
      team: team._id,
      status: 'ACTIVE',
    });

    const finalizedEvaluations = await HackathonEditorialEvaluation.find({
      team: team._id,
      editorialMember: { $in: allAssignments.map((a) => a.editorialMember) },
      status: 'FINALIZED',
    });

    if (finalizedEvaluations.length >= allAssignments.length && allAssignments.length > 0) {
      team.status = 'EVALUATED';
    } else {
      team.status = 'UNDER_EVALUATION';
    }
    await team.save();

    await HackathonAuditLog.log({
      actorId: String(judgeId),
      actorName: req.editorialMember.name,
      actorEmail: req.editorialMember.email,
      role: 'editorial',
      action: 'EDITORIAL_EVALUATION_FINALIZED',
      targetEntity: 'HackathonEditorialEvaluation',
      targetId: team.teamId,
      newState: {
        totalScore: evaluation.totalScore,
        scores: evaluation.scores,
        finalizedAt: evaluation.finalizedAt,
      },
      req,
    });

    await HackathonAuditLog.log({
      actorId: String(judgeId),
      actorName: req.editorialMember.name,
      actorEmail: req.editorialMember.email,
      role: 'editorial',
      action: 'EDITORIAL_SCORE_SUBMITTED',
      targetEntity: 'HackathonEditorialEvaluation',
      targetId: team.teamId,
      reason: `Finalized total score: ${evaluation.totalScore}`,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Evaluation finalized and locked successfully.',
      evaluation,
    });
  } catch (error) {
    console.error('finalizeEditorialEvaluation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize evaluation.',
      error: error.message,
    });
  }
};

// ============================================================================
// PHASE 7: RESULTS, WINNER MANAGEMENT & RESULT LOCKING
// ============================================================================

/**
 * 42. Admin Calculate / Recalculate Hackathon Results
 * POST /api/hackathon/admin/results/calculate
 */
exports.calculateAdminResults = async (req, res) => {
  try {
    const hackathonId = req.body.hackathonId || 'can-hackathon-2026';
    const actorId = String(req.user?._id || req.user?.id || 'admin');
    const actorName = req.user?.name || 'Administrator';
    const actorEmail = req.user?.email || '';

    const calculation = await hackathonResultService.calculateResults({
      hackathonId,
      actorId,
      actorName,
      actorEmail,
      req,
    });

    res.status(200).json(calculation);
  } catch (error) {
    console.error('calculateAdminResults Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to calculate results.',
    });
  }
};

/**
 * 43. Admin Get Calculated Results with Filters & Summary
 * GET /api/hackathon/admin/results
 */
exports.getAdminResults = async (req, res) => {
  try {
    const hackathonId = req.query.hackathonId || 'can-hackathon-2026';
    const { track, status, rankingStatus, category, search } = req.query;

    const query = { hackathonId };
    if (status && status !== 'ALL') query.resultStatus = status;
    if (rankingStatus && rankingStatus !== 'ALL') query.rankingStatus = rankingStatus;
    if (category && category !== 'ALL') query.category = category;
    if (track && track !== 'ALL') query.track = track;

    let results = await HackathonResult.find(query)
      .populate('team', 'teamName teamId track leader status isDeleted')
      .populate('submissionId', 'projectName githubUrl hostedProjectUrl status')
      .sort({ rank: 1, finalScore: -1 })
      .lean();

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (r) =>
          r.teamName?.toLowerCase().includes(q) ||
          r.teamId?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q)
      );
    }

    // Summary counters
    const allResults = await HackathonResult.find({ hackathonId }).lean();
    const summary = {
      total: allResults.length,
      eligible: allResults.filter((r) => r.rankingStatus === 'READY').length,
      pending: allResults.filter((r) => r.rankingStatus === 'PENDING_EVALUATIONS').length,
      ineligible: allResults.filter((r) => r.rankingStatus === 'INELIGIBLE').length,
      ties: allResults.filter((r) => r.rankingStatus === 'TIE').length,
      approved: allResults.filter((r) => ['APPROVED', 'PUBLISHED', 'LOCKED'].includes(r.resultStatus)).length,
      published: allResults.filter((r) => r.isPublished).length,
      locked: allResults.filter((r) => r.isLocked).length,
    };

    const setting =
      (await HackathonSetting.findOne({ hackathonId }).lean()) ||
      (await HackathonSetting.findOne().lean()) ||
      (await HackathonSetting.getOrCreateSettings(hackathonId)).toObject();

    res.status(200).json({
      success: true,
      results,
      summary,
      setting: {
        isResultsPublished: setting?.isResultsPublished || false,
        resultsLocked: setting?.resultsLocked || false,
        resultsLockedAt: setting?.resultsLockedAt || null,
        resultsLockedBy: setting?.resultsLockedBy || null,
        winnerCategories: setting?.winnerCategories || [],
      },
    });
  } catch (error) {
    console.error('getAdminResults Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results.',
      error: error.message,
    });
  }
};

/**
 * 44. Admin Score Drill-Down for Specific Team (Read-Only)
 * GET /api/hackathon/admin/results/:teamId
 */
exports.getAdminResultDetail = async (req, res) => {
  try {
    const { teamId } = req.params;
    const hackathonId = req.query.hackathonId || 'can-hackathon-2026';

    const result = await HackathonResult.findOne({
      hackathonId,
      $or: [{ teamId }, { team: mongoose.isValidObjectId(teamId) ? teamId : null }],
    })
      .populate('team')
      .populate('submissionId')
      .lean();

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result record not found for this team.' });
    }

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('getAdminResultDetail Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch result details.',
      error: error.message,
    });
  }
};

/**
 * 45. Admin Resolve Tie
 * POST /api/hackathon/admin/results/resolve-tie
 */
exports.resolveAdminResultTie = async (req, res) => {
  try {
    const { teamOrders, tieBreakReason, hackathonId = 'can-hackathon-2026' } = req.body;
    const actorId = String(req.user?._id || req.user?.id || 'admin');
    const actorName = req.user?.name || 'Administrator';
    const actorEmail = req.user?.email || '';

    const resolution = await hackathonResultService.resolveTie({
      hackathonId,
      teamOrders,
      tieBreakReason,
      actorId,
      actorName,
      actorEmail,
      req,
    });

    res.status(200).json(resolution);
  } catch (error) {
    console.error('resolveAdminResultTie Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to resolve tie.',
    });
  }
};

/**
 * 46. Admin Assign Winner Category & Prize
 * POST /api/hackathon/admin/results/:teamId/assign-winner
 */
exports.assignAdminResultWinner = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { category, prize, isWinner = false, isRunnerUp = false } = req.body;
    const hackathonId = req.body.hackathonId || 'can-hackathon-2026';

    const setting =
      (await HackathonSetting.findOne({ hackathonId })) ||
      (await HackathonSetting.findOne()) ||
      (await HackathonSetting.getOrCreateSettings(hackathonId));
    if (setting?.resultsLocked) {
      return res.status(400).json({ success: false, message: 'Results are locked and winner assignments cannot be modified.' });
    }

    const result = await HackathonResult.findOne({
      hackathonId,
      $or: [{ teamId }, { team: mongoose.isValidObjectId(teamId) ? teamId : null }],
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result record not found for this team.' });
    }

    if (result.isLocked) {
      return res.status(400).json({ success: false, message: 'This result is individually locked.' });
    }

    // Eligibility enforcement: only READY teams can be assigned official winner awards
    if (category && result.rankingStatus !== 'READY') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign winner award to team with status "${result.rankingStatus}". Only fully evaluated eligible teams can receive awards.`,
      });
    }

    // Rank restriction check if category defines rank restriction
    if (category && setting?.winnerCategories) {
      const catConfig = setting.winnerCategories.find((c) => c.name === category || c.categoryId === category);
      if (catConfig && catConfig.rankRestriction && result.rank !== catConfig.rankRestriction) {
        return res.status(400).json({
          success: false,
          message: `Category "${catConfig.name}" is restricted to rank ${catConfig.rankRestriction}. This team is rank ${result.rank}.`,
        });
      }
    }

    const previousCategory = result.category;
    result.category = category || null;
    result.prize = prize || null;
    result.isWinner = Boolean(isWinner);
    result.isRunnerUp = Boolean(isRunnerUp);

    const now = new Date();
    result.history.push({
      action: previousCategory ? 'RESULT_WINNER_CHANGED' : 'RESULT_WINNER_ASSIGNED',
      actor: req.user?.name || 'admin',
      timestamp: now,
      previousState: { category: previousCategory },
      newState: { category: result.category, prize: result.prize, isWinner: result.isWinner },
    });

    await result.save();

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Administrator',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: previousCategory ? 'RESULT_WINNER_CHANGED' : 'RESULT_WINNER_ASSIGNED',
      targetEntity: 'HackathonResult',
      targetId: result.teamId,
      newState: {
        category: result.category,
        prize: result.prize,
        isWinner: result.isWinner,
        isRunnerUp: result.isRunnerUp,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Winner category "${category || 'None'}" updated for team ${result.teamName}.`,
      result,
    });
  } catch (error) {
    console.error('assignAdminResultWinner Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign winner category.',
      error: error.message,
    });
  }
};

/**
 * 47. Admin Approve Official Results
 * POST /api/hackathon/admin/results/approve
 */
exports.approveAdminResults = async (req, res) => {
  try {
    const hackathonId = req.body.hackathonId || 'can-hackathon-2026';

    const setting =
      (await HackathonSetting.findOne({ hackathonId })) ||
      (await HackathonSetting.findOne()) ||
      (await HackathonSetting.getOrCreateSettings(hackathonId));
    if (setting?.resultsLocked) {
      return res.status(400).json({ success: false, message: 'Results are locked.' });
    }

    const results = await HackathonResult.find({ hackathonId });
    if (!results || results.length === 0) {
      return res.status(400).json({ success: false, message: 'No results have been calculated yet.' });
    }

    // Check for unresolved ties in top 3 positions
    const topTies = results.filter((r) => r.rankingStatus === 'TIE' && r.rank && r.rank <= 3);
    if (topTies.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve results: Unresolved ties detected in podium ranks (1-3). Please resolve ties before approval.',
        tiedTeams: topTies.map((t) => ({ teamId: t.teamId, score: t.finalScore, rank: t.rank })),
      });
    }

    const now = new Date();
    const approvedByName = req.user?.name || 'Administrator';

    for (const resDoc of results) {
      resDoc.resultStatus = 'APPROVED';
      resDoc.approvedBy = approvedByName;
      resDoc.approvedAt = now;

      // Freeze ranking snapshot
      resDoc.rankingSnapshot = {
        rank: resDoc.rank,
        finalScore: resDoc.finalScore,
        category: resDoc.category,
        prize: resDoc.prize,
        isWinner: resDoc.isWinner,
        isRunnerUp: resDoc.isRunnerUp,
        approvedAt: now,
        approvedBy: approvedByName,
      };

      resDoc.history.push({
        action: 'RESULT_APPROVED',
        actor: approvedByName,
        timestamp: now,
        newState: { resultStatus: 'APPROVED' },
      });

      await resDoc.save();
    }

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: approvedByName,
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'RESULT_APPROVED',
      targetEntity: 'HackathonResult',
      targetId: hackathonId,
      newState: { approvedCount: results.length, approvedAt: now },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Official results approved successfully.',
      approvedCount: results.length,
    });
  } catch (error) {
    console.error('approveAdminResults Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve results.',
      error: error.message,
    });
  }
};

/**
 * 48. Admin Publish / Unpublish Official Results
 * POST /api/hackathon/admin/results/publish
 */
exports.publishAdminResults = async (req, res) => {
  try {
    const hackathonId = req.body.hackathonId || 'can-hackathon-2026';
    const shouldPublish = req.body.publish !== false; // default true

    const setting =
      (await HackathonSetting.findOne({ hackathonId })) ||
      (await HackathonSetting.findOne()) ||
      (await HackathonSetting.getOrCreateSettings(hackathonId));
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Hackathon settings not found.' });
    }

    if (setting.resultsLocked && !shouldPublish) {
      return res.status(400).json({ success: false, message: 'Cannot unpublish locked official results.' });
    }

    const results = await HackathonResult.find({ hackathonId });
    if (!results || results.length === 0) {
      return res.status(400).json({ success: false, message: 'No results found to publish.' });
    }

    // Check for unresolved ties in top 3 positions before publishing
    if (shouldPublish) {
      const topTies = results.filter((r) => r.rankingStatus === 'TIE' && r.rank && r.rank <= 3);
      if (topTies.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot publish results: Unresolved ties detected in podium ranks (1-3). Please resolve ties before publishing.',
          tiedTeams: topTies.map((t) => ({ teamId: t.teamId, score: t.finalScore, rank: t.rank })),
        });
      }
    }

    const now = new Date();
    const actorName = req.user?.name || 'Administrator';

    setting.isResultsPublished = shouldPublish;
    if (shouldPublish) {
      setting.resultsPublishedAt = now;
    }
    await setting.save();

    // Update result items and teams
    for (const resDoc of results) {
      resDoc.isPublished = shouldPublish;
      if (shouldPublish) {
        resDoc.resultStatus = resDoc.resultStatus === 'LOCKED' ? 'LOCKED' : 'PUBLISHED';
        resDoc.publishedAt = now;
        resDoc.publishedBy = actorName;
        if (!resDoc.approvedBy) {
          resDoc.approvedBy = actorName;
          resDoc.approvedAt = now;
        }
      }
      resDoc.history.push({
        action: shouldPublish ? 'RESULT_PUBLISHED' : 'RESULT_UNPUBLISHED',
        actor: actorName,
        timestamp: now,
      });
      await resDoc.save();

      // Transition team status to RESULT_PUBLISHED if published
      if (shouldPublish) {
        await HackathonTeam.updateOne(
          { _id: resDoc.team, status: { $ne: 'REJECTED' } },
          { $set: { status: 'RESULT_PUBLISHED' } }
        );
      }
    }

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName,
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: shouldPublish ? 'RESULT_PUBLISHED' : 'RESULT_UNPUBLISHED',
      targetEntity: 'HackathonResult',
      targetId: hackathonId,
      newState: { isResultsPublished: shouldPublish, publishedAt: now },
      req,
    });

    res.status(200).json({
      success: true,
      message: shouldPublish
        ? 'Official hackathon results published successfully.'
        : 'Official hackathon results unpublished.',
      isResultsPublished: shouldPublish,
    });
  } catch (error) {
    console.error('publishAdminResults Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update publication status.',
      error: error.message,
    });
  }
};

/**
 * 49. Admin Permanently Lock Official Results
 * POST /api/hackathon/admin/results/lock
 */
exports.lockAdminResults = async (req, res) => {
  try {
    const hackathonId = req.body.hackathonId || 'can-hackathon-2026';
    const { reason, confirmLock } = req.body;

    if (!confirmLock) {
      return res.status(400).json({
        success: false,
        message: 'Explicit confirmation required (confirmLock: true) to permanently lock official results.',
      });
    }

    const setting =
      (await HackathonSetting.findOne({ hackathonId })) ||
      (await HackathonSetting.findOne()) ||
      (await HackathonSetting.getOrCreateSettings(hackathonId));
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Settings not found.' });
    }

    const results = await HackathonResult.find({ hackathonId });
    if (!results || results.length === 0) {
      return res.status(400).json({ success: false, message: 'No results found to lock.' });
    }

    const now = new Date();
    const actorName = req.user?.name || 'Administrator';
    const lockReason = reason || 'Official hackathon results permanently finalized and locked.';

    setting.resultsLocked = true;
    setting.resultsLockedAt = now;
    setting.resultsLockedBy = actorName;
    await setting.save();

    for (const resDoc of results) {
      resDoc.isLocked = true;
      resDoc.resultStatus = 'LOCKED';
      resDoc.lockedAt = now;
      resDoc.lockedBy = actorName;
      resDoc.lockReason = lockReason;
      if (!resDoc.approvedBy) {
        resDoc.approvedBy = actorName;
        resDoc.approvedAt = now;
      }
      resDoc.history.push({
        action: 'RESULT_LOCKED',
        actor: actorName,
        timestamp: now,
        reason: lockReason,
      });
      await resDoc.save();
    }

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName,
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'RESULT_LOCKED',
      targetEntity: 'HackathonResult',
      targetId: hackathonId,
      reason: lockReason,
      newState: { lockedCount: results.length, lockedAt: now },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Official results permanently locked.',
      resultsLocked: true,
      lockedAt: now,
    });
  } catch (error) {
    console.error('lockAdminResults Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock results.',
      error: error.message,
    });
  }
};

/**
 * 50. Admin Reopen Official Results with Mandatory Reason
 * POST /api/hackathon/admin/results/reopen
 */
exports.reopenAdminResults = async (req, res) => {
  try {
    const hackathonId = req.body.hackathonId || 'can-hackathon-2026';
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory administrative reason is required to unlock official results.',
      });
    }

    const setting =
      (await HackathonSetting.findOne({ hackathonId })) ||
      (await HackathonSetting.findOne()) ||
      (await HackathonSetting.getOrCreateSettings(hackathonId));
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Settings not found.' });
    }

    const now = new Date();
    const actorName = req.user?.name || 'Administrator';
    const reopenReason = reason.trim();

    setting.resultsLocked = false;
    await setting.save();

    const results = await HackathonResult.find({ hackathonId });
    for (const resDoc of results) {
      resDoc.isLocked = false;
      resDoc.resultStatus = 'APPROVED';
      resDoc.reopenedAt = now;
      resDoc.reopenedBy = actorName;
      resDoc.reopenReason = reopenReason;
      resDoc.history.push({
        action: 'RESULT_REOPENED',
        actor: actorName,
        timestamp: now,
        reason: reopenReason,
      });
      await resDoc.save();
    }

    await HackathonAuditLog.log({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName,
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'RESULT_REOPENED',
      targetEntity: 'HackathonResult',
      targetId: hackathonId,
      reason: reopenReason,
      newState: { reopenedCount: results.length, reopenedAt: now },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Results unlocked for administrative revisions.',
      resultsLocked: false,
      reopenedAt: now,
    });
  } catch (error) {
    console.error('reopenAdminResults Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reopen results.',
      error: error.message,
    });
  }
};

/**
 * 51. Participant Get Own Official Result
 * GET /api/hackathon/results/my-result
 */
exports.getParticipantMyResult = async (req, res) => {
  try {
    const resolved = await resolveParticipantTeam(req);
    if (resolved.errorStatus) {
      return res.status(resolved.errorStatus).json({ success: false, message: resolved.errorMessage });
    }

    const { team } = resolved;

    const setting =
      (await HackathonSetting.findOne({ hackathonId: team.hackathonId || 'can-hackathon-2026' }).lean()) ||
      (await HackathonSetting.findOne().lean()) ||
      (await HackathonSetting.getOrCreateSettings(team.hackathonId || 'can-hackathon-2026')).toObject();

    // If results unpublished, hide all results
    if (!setting?.isResultsPublished) {
      return res.status(200).json({
        success: true,
        isPublished: false,
        message: 'Final results have not been published yet. Evaluations are currently being reviewed.',
        resultDate: setting?.resultDate || null,
      });
    }

    // Results are published: Return sanitized DTO for participant's team only
    const result = await HackathonResult.findOne({
      $or: [{ team: team._id }, { teamId: team.teamId }],
    }).lean();

    if (!result || !result.isPublished) {
      return res.status(200).json({
        success: true,
        isPublished: true,
        message: 'Your team results are being processed.',
        teamName: team.teamName,
        track: team.track,
        resultDate: setting?.resultDate || null,
      });
    }

    const resultObj = {
      teamName: result.teamName,
      track: result.track,
      rank: result.rank,
      finalScore: result.finalScore,
      category: result.category,
      prize: result.prize,
      isWinner: result.isWinner,
      isRunnerUp: result.isRunnerUp,
      publishedAt: result.publishedAt,
    };

    res.status(200).json({
      success: true,
      isPublished: true,
      resultDate: setting?.resultDate || null,
      result: resultObj,
      ...resultObj,
    });
  } catch (error) {
    console.error('getParticipantMyResult Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve result.',
      error: error.message,
    });
  }
};

/**
 * 52. Public Get Published Official Results & Leaderboard
 * GET /api/hackathon/public/results
 */
exports.getPublicResults = async (req, res) => {
  try {
    const hackathonId = req.query.hackathonId || 'can-hackathon-2026';
    const setting =
      (await HackathonSetting.findOne({ hackathonId }).lean()) ||
      (await HackathonSetting.findOne().lean()) ||
      (await HackathonSetting.getOrCreateSettings(hackathonId)).toObject();

    if (!setting?.isResultsPublished) {
      return res.status(200).json({
        success: true,
        isPublished: false,
        message: 'Official results have not been announced yet.',
        resultDate: setting?.resultDate || null,
        winners: [],
        rankings: [],
        leaderboard: [],
      });
    }

    // Flexible query to find published results regardless of minor hackathonId naming variance
    const resultFilter = {
      isPublished: true,
    };
    if (hackathonId && hackathonId !== 'can-hackathon-2026') {
      resultFilter.hackathonId = hackathonId;
    } else {
      resultFilter.$or = [
        { hackathonId: 'can-hackathon-2026' },
        { hackathonId: { $exists: false } },
        { hackathonId: null },
      ];
    }

    // Fetch published results, populate submission & team info
    const results = await HackathonResult.find(resultFilter)
      .populate('submissionId', 'projectName')
      .populate('team', 'teamName teamId track finalSubmission initialIdea')
      .sort({ rank: 1, finalScore: -1 })
      .lean();

    const formatItem = (r) => ({
      rank: r.rank,
      teamName: r.teamName || r.team?.teamName || 'Team',
      teamId: r.teamId || r.team?.teamId,
      projectName:
        r.submissionId?.projectName ||
        r.team?.finalSubmission?.projectTitle ||
        r.team?.initialIdea?.title ||
        'Project Submission',
      track: r.track || r.team?.track || 'General Track',
      category:
        r.category ||
        (r.rank === 1 ? 'Winner' : r.rank === 2 ? '1st Runner Up' : r.rank === 3 ? '2nd Runner Up' : ''),
      prize: r.prize || '',
      finalScore: r.finalScore,
      isWinner: r.isWinner,
      isRunnerUp: r.isRunnerUp,
    });

    const podiumWinners = results
      .filter((r) => r.isWinner || r.category || (r.rank && r.rank <= 3))
      .map(formatItem);

    const rankings = results.map(formatItem);

    res.status(200).json({
      success: true,
      isPublished: true,
      hackathonName: setting.name,
      publishedAt: setting.resultsPublishedAt,
      resultDate: setting.resultDate || null,
      winners: podiumWinners,
      rankings,
      leaderboard: rankings,
    });
  } catch (error) {
    console.error('getPublicResults Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public results.',
      error: error.message,
    });
  }
};

// ============================================================================
// PHASE 8 — CERTIFICATES, PRIZE FULFILLMENT & SPONSOR MANAGEMENT
// ============================================================================

/**
 * 53. Admin: List Certificates
 * GET /api/hackathon/admin/certificates
 */
exports.getAdminCertificates = async (req, res) => {
  try {
    const hackathonId = req.query.hackathonId || 'can-hackathon-2026';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { hackathonId };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { recipientName: { $regex: q, $options: 'i' } },
        { recipientEmail: { $regex: q, $options: 'i' } },
        { certificateNumber: { $regex: q, $options: 'i' } },
        { award: { $regex: q, $options: 'i' } },
        { projectName: { $regex: q, $options: 'i' } },
      ];
    }

    const [certificates, total, counts] = await Promise.all([
      HackathonCertificate.find(filter)
        .select('-htmlContent')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HackathonCertificate.countDocuments(filter),
      HackathonCertificate.aggregate([
        { $match: { hackathonId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            issued: { $sum: { $cond: [{ $eq: ['$status', 'ISSUED'] }, 1, 0] } },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
            revoked: { $sum: { $cond: ['$isRevoked', 1, 0] } },
            winners: { $sum: { $cond: [{ $in: ['$type', ['WINNER', 'RUNNER_UP', 'SPECIAL_AWARD']] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const summary = counts[0] || {
      total: 0,
      issued: 0,
      delivered: 0,
      revoked: 0,
      winners: 0,
    };

    res.status(200).json({
      success: true,
      certificates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary,
    });
  } catch (error) {
    console.error('getAdminCertificates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates.',
      error: error.message,
    });
  }
};

/**
 * 54. Admin: Generate All Eligible Certificates
 * POST /api/hackathon/admin/certificates/generate-bulk
 */
exports.generateAdminCertificates = async (req, res) => {
  try {
    const hackathonId = req.body.hackathonId || 'can-hackathon-2026';
    const adminId = req.user?._id || req.user?.id;
    const actorDetails = {
      id: String(adminId || 'admin'),
      name: req.user?.name || 'Admin',
      email: req.user?.email || '',
    };

    const result = await hackathonCertificateService.generateAllEligibleCertificates({
      hackathonId,
      adminId,
      actorDetails,
    });

    res.status(200).json({
      success: true,
      message: `Certificates processed successfully. Generated: ${result.generatedCount}, Skipped: ${result.skippedCount}`,
      data: result,
    });
  } catch (error) {
    console.error('generateAdminCertificates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificates.',
      error: error.message,
    });
  }
};

/**
 * 55. Admin: Email Single Certificate
 * POST /api/hackathon/admin/certificates/:id/email
 */
exports.emailAdminCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await HackathonCertificate.findById(id);

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (cert.isRevoked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot email a revoked certificate.',
      });
    }

    cert.emailStatus.attempts = (cert.emailStatus.attempts || 0) + 1;

    const emailRes = await hackathonEmailService.sendCertificateEmail({
      email: cert.recipientEmail,
      name: cert.recipientName,
      award: cert.award,
      certificateNumber: cert.certificateNumber,
      verificationUrl: cert.verificationUrl,
      downloadUrl: `${process.env.CLIENT_URL || 'https://code-a-nova.online'}/hackathon#team-status`,
    });

    if (emailRes.success) {
      cert.emailStatus.sent = true;
      cert.emailStatus.sentAt = new Date();
      cert.emailStatus.messageId = emailRes.messageId || '';
      cert.emailStatus.error = '';
      cert.status = 'DELIVERED';
      await cert.save();

      await HackathonAuditLog.create({
        actorId: String(req.user?._id || req.user?.id || 'admin'),
        actorName: req.user?.name || 'Admin',
        actorEmail: req.user?.email || '',
        role: 'admin',
        action: 'CERTIFICATE_EMAILED',
        targetEntity: 'HackathonCertificate',
        targetId: cert.certificateNumber,
        newState: { recipientEmail: cert.recipientEmail, sentAt: cert.emailStatus.sentAt },
      });

      return res.status(200).json({
        success: true,
        message: `Certificate emailed to ${cert.recipientEmail}.`,
        emailStatus: cert.emailStatus,
      });
    } else {
      cert.emailStatus.error = emailRes.error || 'Failed to dispatch email';
      await cert.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to send certificate email.',
        error: emailRes.error,
      });
    }
  } catch (error) {
    console.error('emailAdminCertificate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to email certificate.',
      error: error.message,
    });
  }
};

/**
 * 56. Admin: Bulk Email Certificates
 * POST /api/hackathon/admin/certificates/email-bulk
 */
exports.emailBulkAdminCertificates = async (req, res) => {
  try {
    const hackathonId = req.body.hackathonId || 'can-hackathon-2026';
    const limit = Math.min(50, parseInt(req.body.limit) || 20);

    const pendingCerts = await HackathonCertificate.find({
      hackathonId,
      'emailStatus.sent': false,
      isRevoked: false,
    }).limit(limit);

    let sentCount = 0;
    let failCount = 0;

    for (const cert of pendingCerts) {
      cert.emailStatus.attempts = (cert.emailStatus.attempts || 0) + 1;
      const sendRes = await hackathonEmailService.sendCertificateEmail({
        email: cert.recipientEmail,
        name: cert.recipientName,
        award: cert.award,
        certificateNumber: cert.certificateNumber,
        verificationUrl: cert.verificationUrl,
      });

      if (sendRes.success) {
        cert.emailStatus.sent = true;
        cert.emailStatus.sentAt = new Date();
        cert.emailStatus.messageId = sendRes.messageId || '';
        cert.status = 'DELIVERED';
        sentCount++;
      } else {
        cert.emailStatus.error = sendRes.error || 'Delivery failed';
        failCount++;
      }
      await cert.save();
    }

    res.status(200).json({
      success: true,
      message: `Batch email complete. Sent: ${sentCount}, Failed: ${failCount}`,
      sentCount,
      failCount,
      processed: pendingCerts.length,
    });
  } catch (error) {
    console.error('emailBulkAdminCertificates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk email certificates.',
      error: error.message,
    });
  }
};

/**
 * 57. Admin: Revoke Certificate
 * POST /api/hackathon/admin/certificates/:id/revoke
 */
exports.revokeAdminCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory revocation reason must be provided.',
      });
    }

    const adminId = req.user?._id || req.user?.id;
    const actorDetails = {
      id: String(adminId || 'admin'),
      name: req.user?.name || 'Admin',
      email: req.user?.email || '',
    };

    const result = await hackathonCertificateService.revokeCertificate({
      certificateId: id,
      reason,
      adminId,
      actorDetails,
    });

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully.',
      certificate: result.certificate,
    });
  } catch (error) {
    console.error('revokeAdminCertificate Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to revoke certificate.',
    });
  }
};

/**
 * 58. Admin: Get Certificate Detail
 * GET /api/hackathon/admin/certificates/:id
 */
exports.getAdminCertificateDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await HackathonCertificate.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { certificateNumber: id }, { certificateId: id }],
    }).populate('team', 'teamName leader members track');

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    res.status(200).json({ success: true, certificate: cert });
  } catch (error) {
    console.error('getAdminCertificateDetail Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch certificate detail.' });
  }
};

/**
 * 59. Participant: Get My Certificates
 * GET /api/hackathon/certificates/my-certificates
 */
exports.getParticipantMyCertificates = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.user?.unifiedUserId || req.user?.userId;
    let userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : null;

    if (!userEmail && userId) {
      const user = await User.findById(userId).select('email name');
      if (user?.email) userEmail = user.email.toLowerCase().trim();
    }

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const certificates = await HackathonCertificate.find({
      recipientEmail: userEmail,
      isRevoked: false,
    })
      .select('-htmlContent')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      certificates,
    });
  } catch (error) {
    console.error('getParticipantMyCertificates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participant certificates.',
      error: error.message,
    });
  }
};

/**
 * 60. Participant / Admin: Download Certificate
 * GET /api/hackathon/certificates/:id/download
 */
exports.downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await HackathonCertificate.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { certificateNumber: id }, { certificateId: id }],
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    // Security Check: Must be admin OR the certificate recipient
    const isAdmin = !!(req.admin || req.user?.role === 'admin');
    const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : '';

    if (!isAdmin && userEmail !== cert.recipientEmail.toLowerCase().trim()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to access this certificate.',
      });
    }

    if (cert.isRevoked && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This certificate has been revoked and is unavailable for download.',
      });
    }

    cert.downloadCount = (cert.downloadCount || 0) + 1;
    await cert.save();

    await HackathonAuditLog.create({
      actorId: String(req.user?._id || req.user?.id || 'anonymous'),
      actorName: req.user?.name || cert.recipientName,
      actorEmail: userEmail,
      role: isAdmin ? 'admin' : 'participant',
      action: 'CERTIFICATE_DOWNLOADED',
      targetEntity: 'HackathonCertificate',
      targetId: cert.certificateNumber,
      newState: { downloadCount: cert.downloadCount },
    });

    // If client requested HTML directly (e.g. for print view)
    if (req.query.format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      return res.send(cert.htmlContent);
    }

    res.status(200).json({
      success: true,
      certificate: {
        certificateNumber: cert.certificateNumber,
        recipientName: cert.recipientName,
        award: cert.award,
        htmlContent: cert.htmlContent,
        verificationUrl: cert.verificationUrl,
      },
    });
  } catch (error) {
    console.error('downloadCertificate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download certificate.',
      error: error.message,
    });
  }
};

/**
 * 61. Public: Verify Certificate
 * GET /api/hackathon/certificates/verify/:verificationCode
 */
exports.verifyPublicCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;
    const result = await hackathonCertificateService.verifyCertificate(verificationCode);

    if (!result.isValid && !result.isRevoked) {
      return res.status(404).json({
        success: false,
        isValid: false,
        message: result.message || 'Invalid verification code.',
      });
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('verifyPublicCertificate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certificate.',
      error: error.message,
    });
  }
};

/**
 * 62. Admin: List Prizes
 * GET /api/hackathon/admin/prizes
 */
exports.getAdminPrizes = async (req, res) => {
  try {
    const hackathonId = req.query.hackathonId || 'can-hackathon-2026';
    const prizes = await HackathonPrize.find({ hackathonId })
      .populate('sponsorId', 'name tier logoUrl')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, prizes });
  } catch (error) {
    console.error('getAdminPrizes Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prizes.' });
  }
};

/**
 * 63. Admin: Create Prize
 * POST /api/hackathon/admin/prizes
 */
exports.createAdminPrize = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      amount,
      currency,
      sponsorId,
      quantity,
      eligibility,
      trackRestriction,
      rankRestriction,
      fulfillmentMethod,
      hackathonId = 'can-hackathon-2026',
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Prize name and category are required.' });
    }

    let sponsorName = '';
    if (sponsorId && mongoose.isValidObjectId(sponsorId)) {
      const spon = await HackathonSponsor.findById(sponsorId).lean();
      if (spon) sponsorName = spon.name;
    }

    const prizeId = `PRIZE-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const prize = await HackathonPrize.create({
      hackathonId,
      prizeId,
      name: name.trim(),
      category: category.trim(),
      description: description || '',
      amount: Number(amount) || 0,
      currency: currency || 'INR',
      sponsorId: sponsorId && mongoose.isValidObjectId(sponsorId) ? sponsorId : null,
      sponsorNameSnapshot: sponsorName,
      quantity: Number(quantity) || 1,
      eligibility: eligibility || '',
      trackRestriction: trackRestriction || 'ALL',
      rankRestriction: rankRestriction ? Number(rankRestriction) : null,
      fulfillmentMethod: fulfillmentMethod || 'BANK_TRANSFER',
      createdBy: req.user?._id || req.user?.id || null,
    });

    await HackathonAuditLog.create({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'PRIZE_CREATED',
      targetEntity: 'HackathonPrize',
      targetId: prize.prizeId,
      newState: { name: prize.name, amount: prize.amount, category: prize.category },
    });

    res.status(201).json({ success: true, message: 'Prize created successfully.', prize });
  } catch (error) {
    console.error('createAdminPrize Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create prize.', error: error.message });
  }
};

/**
 * 64. Admin: Update Prize
 * PUT /api/hackathon/admin/prizes/:id
 */
exports.updateAdminPrize = async (req, res) => {
  try {
    const { id } = req.params;
    const prize = await HackathonPrize.findById(id);

    if (!prize) {
      return res.status(404).json({ success: false, message: 'Prize not found.' });
    }

    const previousState = prize.toObject();

    if (req.body.name) prize.name = req.body.name.trim();
    if (req.body.category) prize.category = req.body.category.trim();
    if (req.body.description !== undefined) prize.description = req.body.description;
    if (req.body.amount !== undefined) prize.amount = Number(req.body.amount);
    if (req.body.currency) prize.currency = req.body.currency;
    if (req.body.quantity !== undefined) prize.quantity = Number(req.body.quantity);
    if (req.body.eligibility !== undefined) prize.eligibility = req.body.eligibility;
    if (req.body.trackRestriction) prize.trackRestriction = req.body.trackRestriction;
    if (req.body.rankRestriction !== undefined) prize.rankRestriction = req.body.rankRestriction ? Number(req.body.rankRestriction) : null;
    if (req.body.fulfillmentMethod) prize.fulfillmentMethod = req.body.fulfillmentMethod;
    if (req.body.status) prize.status = req.body.status;

    if (req.body.sponsorId !== undefined) {
      if (req.body.sponsorId && mongoose.isValidObjectId(req.body.sponsorId)) {
        prize.sponsorId = req.body.sponsorId;
        const spon = await HackathonSponsor.findById(req.body.sponsorId).lean();
        if (spon) prize.sponsorNameSnapshot = spon.name;
      } else {
        prize.sponsorId = null;
        prize.sponsorNameSnapshot = '';
      }
    }

    prize.updatedBy = req.user?._id || req.user?.id || null;
    await prize.save();

    await HackathonAuditLog.create({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'PRIZE_UPDATED',
      targetEntity: 'HackathonPrize',
      targetId: prize.prizeId,
      previousState: { name: previousState.name, amount: previousState.amount },
      newState: { name: prize.name, amount: prize.amount },
    });

    res.status(200).json({ success: true, message: 'Prize updated successfully.', prize });
  } catch (error) {
    console.error('updateAdminPrize Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update prize.', error: error.message });
  }
};

/**
 * 65. Admin: Delete Prize
 * DELETE /api/hackathon/admin/prizes/:id
 */
exports.deleteAdminPrize = async (req, res) => {
  try {
    const { id } = req.params;
    const prize = await HackathonPrize.findById(id);

    if (!prize) {
      return res.status(404).json({ success: false, message: 'Prize not found.' });
    }

    // Safety check: Prevent deletion if fulfillments are linked to this prize
    const activeFulfillments = await HackathonPrizeFulfillment.countDocuments({ prizeId: prize._id });
    if (activeFulfillments > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete prize: ${activeFulfillments} prize fulfillment record(s) are mapped to it. Please archive the prize instead.`,
      });
    }

    await HackathonPrize.deleteOne({ _id: prize._id });

    await HackathonAuditLog.create({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'PRIZE_DELETED',
      targetEntity: 'HackathonPrize',
      targetId: prize.prizeId,
      previousState: { name: prize.name, amount: prize.amount },
    });

    res.status(200).json({ success: true, message: 'Prize deleted successfully.' });
  } catch (error) {
    console.error('deleteAdminPrize Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete prize.', error: error.message });
  }
};

/**
 * 66. Admin: List Sponsors
 * GET /api/hackathon/admin/sponsors
 */
exports.getAdminSponsors = async (req, res) => {
  try {
    const hackathonId = req.query.hackathonId || 'can-hackathon-2026';
    const sponsors = await HackathonSponsor.find({ hackathonId })
      .select('+contactName +contactEmail +contactPhone')
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, sponsors });
  } catch (error) {
    console.error('getAdminSponsors Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sponsors.' });
  }
};

/**
 * 67. Admin: Create Sponsor
 * POST /api/hackathon/admin/sponsors
 */
exports.createAdminSponsor = async (req, res) => {
  try {
    const {
      name,
      logoUrl,
      websiteUrl,
      description,
      tier,
      contactName,
      contactEmail,
      contactPhone,
      benefits,
      active = true,
      displayOrder = 0,
      hackathonId = 'can-hackathon-2026',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Sponsor name is required.' });
    }

    if (logoUrl) validateSafeUrl(logoUrl, 'Logo URL');
    if (websiteUrl) validateSafeUrl(websiteUrl, 'Website URL');

    const sponsorId = `SPON-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const sponsor = await HackathonSponsor.create({
      hackathonId,
      sponsorId,
      name: name.trim(),
      logoUrl: logoUrl ? logoUrl.trim() : '',
      websiteUrl: websiteUrl ? websiteUrl.trim() : '',
      description: description || '',
      tier: tier || 'COMMUNITY',
      contactName: contactName || '',
      contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : '',
      contactPhone: contactPhone || '',
      benefits: Array.isArray(benefits) ? benefits : [],
      active: active !== false,
      displayOrder: Number(displayOrder) || 0,
      createdBy: req.user?._id || req.user?.id || null,
    });

    await HackathonAuditLog.create({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'SPONSOR_CREATED',
      targetEntity: 'HackathonSponsor',
      targetId: sponsor.sponsorId,
      newState: { name: sponsor.name, tier: sponsor.tier },
    });

    res.status(201).json({ success: true, message: 'Sponsor created successfully.', sponsor });
  } catch (error) {
    console.error('createAdminSponsor Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create sponsor.' });
  }
};

/**
 * 68. Admin: Update Sponsor
 * PUT /api/hackathon/admin/sponsors/:id
 */
exports.updateAdminSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await HackathonSponsor.findById(id).select('+contactName +contactEmail +contactPhone');

    if (!sponsor) {
      return res.status(404).json({ success: false, message: 'Sponsor not found.' });
    }

    if (req.body.logoUrl) validateSafeUrl(req.body.logoUrl, 'Logo URL');
    if (req.body.websiteUrl) validateSafeUrl(req.body.websiteUrl, 'Website URL');

    if (req.body.name) sponsor.name = req.body.name.trim();
    if (req.body.logoUrl !== undefined) sponsor.logoUrl = req.body.logoUrl.trim();
    if (req.body.websiteUrl !== undefined) sponsor.websiteUrl = req.body.websiteUrl.trim();
    if (req.body.description !== undefined) sponsor.description = req.body.description;
    if (req.body.tier) sponsor.tier = req.body.tier;
    if (req.body.contactName !== undefined) sponsor.contactName = req.body.contactName;
    if (req.body.contactEmail !== undefined) sponsor.contactEmail = req.body.contactEmail.trim().toLowerCase();
    if (req.body.contactPhone !== undefined) sponsor.contactPhone = req.body.contactPhone;
    if (req.body.benefits) sponsor.benefits = req.body.benefits;
    if (req.body.active !== undefined) sponsor.active = req.body.active;
    if (req.body.displayOrder !== undefined) sponsor.displayOrder = Number(req.body.displayOrder);

    sponsor.updatedBy = req.user?._id || req.user?.id || null;
    await sponsor.save();

    await HackathonAuditLog.create({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'SPONSOR_UPDATED',
      targetEntity: 'HackathonSponsor',
      targetId: sponsor.sponsorId,
      newState: { name: sponsor.name, tier: sponsor.tier, active: sponsor.active },
    });

    res.status(200).json({ success: true, message: 'Sponsor updated successfully.', sponsor });
  } catch (error) {
    console.error('updateAdminSponsor Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to update sponsor.' });
  }
};

/**
 * 69. Admin: Delete Sponsor
 * DELETE /api/hackathon/admin/sponsors/:id
 */
exports.deleteAdminSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await HackathonSponsor.findById(id);

    if (!sponsor) {
      return res.status(404).json({ success: false, message: 'Sponsor not found.' });
    }

    sponsor.active = false;
    await sponsor.save();

    await HackathonAuditLog.create({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'SPONSOR_DEACTIVATED',
      targetEntity: 'HackathonSponsor',
      targetId: sponsor.sponsorId,
    });

    res.status(200).json({ success: true, message: 'Sponsor deactivated successfully.' });
  } catch (error) {
    console.error('deleteAdminSponsor Error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate sponsor.' });
  }
};

/**
 * 70. Public: List Active Sponsors (Sanitized)
 * GET /api/hackathon/public/sponsors
 */
exports.getPublicSponsors = async (req, res) => {
  try {
    const hackathonId = req.query.hackathonId || 'can-hackathon-2026';
    const sponsors = await HackathonSponsor.find({ hackathonId, active: true })
      .select('sponsorId name logoUrl websiteUrl description tier benefits displayOrder')
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    res.status(200).json({ success: true, sponsors });
  } catch (error) {
    console.error('getPublicSponsors Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch public sponsors.' });
  }
};

/**
 * 71. Admin: List Prize Fulfillments
 * GET /api/hackathon/admin/prize-fulfillments
 */
exports.getAdminPrizeFulfillments = async (req, res) => {
  try {
    const hackathonId = req.query.hackathonId || 'can-hackathon-2026';
    const filter = { hackathonId };
    if (req.query.status) filter.status = req.query.status;

    const fulfillments = await HackathonPrizeFulfillment.find(filter)
      .select('+transactionReference')
      .populate('prizeId', 'name category amount currency fulfillmentMethod sponsorNameSnapshot')
      .populate('resultId', 'rank category finalScore')
      .populate('team', 'teamName leader track')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, fulfillments });
  } catch (error) {
    console.error('getAdminPrizeFulfillments Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prize fulfillments.' });
  }
};

/**
 * 72. Admin: Map Prize to Official Result Winner
 * POST /api/hackathon/admin/prize-fulfillments
 */
exports.createAdminPrizeFulfillment = async (req, res) => {
  try {
    const { teamId, prizeId, hackathonId = 'can-hackathon-2026', notes } = req.body;

    if (!teamId || !prizeId) {
      return res.status(400).json({ success: false, message: 'teamId and prizeId are required.' });
    }

    const [team, prize, result] = await Promise.all([
      HackathonTeam.findOne({ teamId, hackathonId }),
      HackathonPrize.findById(prizeId),
      HackathonResult.findOne({ teamId, hackathonId }),
    ]);

    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });
    if (!prize) return res.status(404).json({ success: false, message: 'Prize not found.' });
    if (!result) return res.status(404).json({ success: false, message: 'Result not found for this team.' });

    // Result must be approved or published
    if (!['APPROVED', 'PUBLISHED', 'LOCKED'].includes(result.resultStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Prize fulfillment requires official results to be approved, published, or locked.',
      });
    }

    // Check for duplicate fulfillment mapping
    const existing = await HackathonPrizeFulfillment.findOne({ hackathonId, teamId, prizeId: prize._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This prize is already mapped to this team.',
      });
    }

    const fulfillmentId = `FULF-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const fulfillment = await HackathonPrizeFulfillment.create({
      hackathonId,
      fulfillmentId,
      prizeId: prize._id,
      resultId: result._id,
      teamId: team.teamId,
      team: team._id,
      recipient: {
        name: team.leader?.name || team.teamName,
        email: team.leader?.email || '',
        mobile: team.leader?.mobile || '',
        college: team.leader?.college || '',
      },
      fulfillmentMethod: prize.fulfillmentMethod || 'BANK_TRANSFER',
      amount: prize.amount || 0,
      currency: prize.currency || 'INR',
      status: 'PENDING',
      notes: notes || '',
    });

    await HackathonAuditLog.create({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: 'PRIZE_FULFILLMENT_CREATED',
      targetEntity: 'HackathonPrizeFulfillment',
      targetId: fulfillment.fulfillmentId,
      newState: { teamId, prizeName: prize.name, amount: prize.amount },
    });

    res.status(201).json({
      success: true,
      message: 'Prize mapped to team successfully.',
      fulfillment,
    });
  } catch (error) {
    console.error('createAdminPrizeFulfillment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign prize.', error: error.message });
  }
};

/**
 * 73. Admin: Update Prize Fulfillment Status & Reference
 * PUT /api/hackathon/admin/prize-fulfillments/:id
 */
exports.updateAdminPrizeFulfillment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionReference, notes, voucherCodeMasked } = req.body;

    const fulfillment = await HackathonPrizeFulfillment.findById(id).select('+transactionReference');
    if (!fulfillment) {
      return res.status(404).json({ success: false, message: 'Prize fulfillment record not found.' });
    }

    const previousStatus = fulfillment.status;
    if (status) fulfillment.status = status;
    if (transactionReference !== undefined) fulfillment.transactionReference = transactionReference.trim();
    if (notes !== undefined) fulfillment.notes = notes;
    if (voucherCodeMasked !== undefined) fulfillment.voucherCodeMasked = voucherCodeMasked;

    if (status === 'FULFILLED') {
      fulfillment.fulfilledAt = new Date();
      fulfillment.fulfilledBy = req.user?._id || req.user?.id || null;
    }

    await fulfillment.save();

    await HackathonAuditLog.create({
      actorId: String(req.user?._id || req.user?.id || 'admin'),
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      role: 'admin',
      action: status === 'FULFILLED' ? 'PRIZE_FULFILLED' : 'PRIZE_FULFILLMENT_UPDATED',
      targetEntity: 'HackathonPrizeFulfillment',
      targetId: fulfillment.fulfillmentId,
      previousState: { status: previousStatus },
      newState: { status: fulfillment.status, fulfilledAt: fulfillment.fulfilledAt },
    });

    res.status(200).json({
      success: true,
      message: `Prize fulfillment status updated to ${fulfillment.status}.`,
      fulfillment,
    });
  } catch (error) {
    console.error('updateAdminPrizeFulfillment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update prize fulfillment.' });
  }
};

/**
 * 74. Admin: Notify Winner on Prize Fulfillment
 * POST /api/hackathon/admin/prize-fulfillments/:id/notify
 */
exports.notifyAdminPrizeFulfillment = async (req, res) => {
  try {
    const { id } = req.params;
    const fulfillment = await HackathonPrizeFulfillment.findById(id)
      .populate('prizeId', 'name amount currency')
      .populate('resultId', 'category rank');

    if (!fulfillment) {
      return res.status(404).json({ success: false, message: 'Prize fulfillment not found.' });
    }

    const recipientEmail = fulfillment.recipient?.email;
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is missing.' });
    }

    const sendRes = await hackathonEmailService.sendPrizeFulfillmentEmail({
      email: recipientEmail,
      name: fulfillment.recipient?.name || 'Winner',
      award: fulfillment.resultId?.category || `Rank #${fulfillment.resultId?.rank}`,
      prizeName: fulfillment.prizeId?.name || 'Hackathon Prize',
      fulfillmentStatus: fulfillment.status,
      message: req.body.customMessage || `Your prize of ${fulfillment.currency} ${fulfillment.amount} is currently ${fulfillment.status}.`,
    });

    if (sendRes.success) {
      fulfillment.emailNotified = true;
      fulfillment.notifiedAt = new Date();
      await fulfillment.save();

      return res.status(200).json({
        success: true,
        message: `Fulfillment notification sent to ${recipientEmail}.`,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to dispatch email.',
        error: sendRes.error,
      });
    }
  } catch (error) {
    console.error('notifyAdminPrizeFulfillment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to notify winner.' });
  }
};

/**
 * 75. Participant: Get My Team's Prizes
 * GET /api/hackathon/prizes/my-prizes
 */
exports.getParticipantMyPrizes = async (req, res) => {
  try {
    const resolved = await resolveParticipantTeam(req);
    if (resolved.errorStatus) {
      // If user has no team or not logged in, return empty prizes gracefully
      return res.status(200).json({ success: true, prizes: [] });
    }

    const { team } = resolved;

    const fulfillments = await HackathonPrizeFulfillment.find({ teamId: team.teamId })
      .select('-transactionReference') // Strictly exclude sensitive transaction / UTR info
      .populate('prizeId', 'name category amount currency fulfillmentMethod sponsorNameSnapshot description')
      .populate('resultId', 'rank category')
      .lean();

    const sanitizedPrizes = fulfillments.map((f) => ({
      fulfillmentId: f.fulfillmentId,
      award: f.resultId?.category || (f.resultId?.rank ? `Rank #${f.resultId.rank}` : 'Prize Winner'),
      prizeName: f.prizeId?.name || 'Prize',
      sponsorName: f.prizeId?.sponsorNameSnapshot || '',
      amount: f.amount,
      currency: f.currency,
      fulfillmentMethod: f.fulfillmentMethod,
      status: f.status,
      fulfilledAt: f.fulfilledAt,
      voucherCodeMasked: f.voucherCodeMasked,
    }));

    res.status(200).json({
      success: true,
      prizes: sanitizedPrizes,
    });
  } catch (error) {
    console.error('getParticipantMyPrizes Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch participant prizes.' });
  }
};

/**
 * 76. Public: Hackathon Health Status
 * GET /api/hackathon/health
 */
exports.getPublicHealth = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(200).json({
      success: true,
      status: isDbConnected ? 'HEALTHY' : 'DEGRADED',
      database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      timestamp: new Date().toISOString(),
      service: 'Code-A-Nova Hackathon Engine',
      version: '1.0.0-phase9',
    });
  } catch (error) {
    console.error('getPublicHealth Error:', error);
    res.status(500).json({ success: false, status: 'ERROR', message: 'Health probe failed.' });
  }
};

/**
 * 77. Admin: Complete Operational Health Assessment
 * GET /api/hackathon/admin/health
 */
exports.getAdminHealth = async (req, res) => {
  try {
    const hackathonId = req.query.hackathonId || 'can-hackathon-2026';
    const health = await hackathonOpsService.getHackathonHealth(hackathonId);
    res.status(200).json(health);
  } catch (error) {
    console.error('getAdminHealth Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve operational health summary.', error: error.message });
  }
};

/**
 * 78. Admin: Real-Time Operational Alerts
 * GET /api/hackathon/admin/alerts
 */
exports.getAdminAlerts = async (req, res) => {
  try {
    const hackathonId = req.query.hackathonId || 'can-hackathon-2026';
    const alerts = await hackathonOpsService.getOperationalAlerts(hackathonId);
    res.status(200).json(alerts);
  } catch (error) {
    console.error('getAdminAlerts Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch operational alerts.', error: error.message });
  }
};

/**
 * 79. Admin: Email Delivery & Failure Analytics
 * GET /api/hackathon/admin/email-stats
 */
exports.getAdminEmailStats = async (req, res) => {
  try {
    const stats = await hackathonOpsService.getEmailStatsSummary();
    res.status(200).json(stats);
  } catch (error) {
    console.error('getAdminEmailStats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email statistics.', error: error.message });
  }
};

/**
 * 80. Admin: Security Events & Sensitive Actions Summary
 * GET /api/hackathon/admin/security-summary
 */
exports.getAdminSecuritySummary = async (req, res) => {
  try {
    const summary = await hackathonOpsService.getSecurityEventsSummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error('getAdminSecuritySummary Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch security summary.', error: error.message });
  }
};

/**
 * 81. Admin: Controlled Data Export (CSV)
 * GET /api/hackathon/admin/export/:resource
 */
exports.exportAdminResource = async (req, res) => {
  try {
    const { resource } = req.params;
    const actor = {
      id: req.user?._id || req.user?.id || 'admin',
      name: req.user?.name || 'Admin User',
      email: req.user?.email || '',
    };

    const csvContent = await hackathonOpsService.exportResourceAsCsv(resource, req.query, actor);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="hackathon-${resource}-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('exportAdminResource Error:', error);
    if (error.message && error.message.includes('Forbidden resource export')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to generate dataset export.', error: error.message });
  }
};

/**
 * 82. Admin: Operational Quick Search
 * GET /api/hackathon/admin/search
 */
exports.operationalSearch = async (req, res) => {
  try {
    const { q, hackathonId } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(200).json({
        success: true,
        query: '',
        results: {
          teams: [],
          submissions: [],
          certificates: [],
          judges: [],
          sponsors: [],
        },
      });
    }

    const searchResults = await hackathonOpsService.operationalSearch(q, hackathonId);
    res.status(200).json(searchResults);
  } catch (error) {
    console.error('operationalSearch Error:', error);
    res.status(500).json({ success: false, message: 'Operational search failed.', error: error.message });
  }
};

/**
 * 83. Admin: Team 360 Full Lifecycle Journey
 * GET /api/hackathon/admin/team-360/:teamId
 */
exports.getAdminTeam360 = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { hackathonId } = req.query;

    const team360 = await hackathonOpsService.getTeam360(teamId, hackathonId);
    res.status(200).json({ success: true, team360, ...team360 });
  } catch (error) {
    console.error('getAdminTeam360 Error:', error);
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch team 360 details.', error: error.message });
  }
};








