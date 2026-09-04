const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const HackathonSetting = require('../models/HackathonSetting');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonPayment = require('../models/HackathonPayment');
const HackathonSubmission = require('../models/HackathonSubmission');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const User = require('../models/User');
const unstopParserService = require('../services/unstopParserService');
const hackathonEmailService = require('../services/hackathonEmailService');

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
 * 2. Get Authenticated Participant's Team Data
 * Strict security: Only returns the team that the authenticated user belongs to.
 */
exports.getMyTeam = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.unifiedUserId || req.user?.userId;
    let userEmail = req.user?.email;

    if (!userEmail && userId) {
      const user = await User.findById(userId).select('email name');
      if (user) {
        userEmail = user.email;
      }
    }

    if (!userEmail && !userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing user authentication session.',
      });
    }

    const query = {
      isDeleted: { $ne: true },
      $or: [],
    };

    if (userId) {
      query.$or.push({ 'leader.userId': userId });
      query.$or.push({ 'members.userId': userId });
    }

    if (userEmail) {
      const normalizedEmail = userEmail.toLowerCase().trim();
      query.$or.push({ 'leader.email': normalizedEmail });
      query.$or.push({ 'members.email': normalizedEmail });
    }

    const team = await HackathonTeam.findOne(query);

    if (!team) {
      return res.status(200).json({
        success: true,
        hasTeam: false,
        team: null,
        message: 'No team registered for the current user.',
      });
    }

    const isLeader =
      (userId && team.leader?.userId && String(team.leader.userId) === String(userId)) ||
      (userEmail && team.leader?.email && team.leader.email.toLowerCase() === userEmail.toLowerCase());

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
 * 6. Get Admin Audit Logs
 */
exports.getAdminAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
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

    const [logs, total] = await Promise.all([
      HackathonAuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      HackathonAuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
      key: process.env.RAZORPAY_KEY_ID,
      amount,
      currency: 'INR',
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
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Locate active team
    const query = {
      isDeleted: { $ne: true },
      $or: [],
    };
    if (userId) {
      query.$or.push({ 'leader.userId': userId }, { 'members.userId': userId });
    }
    if (userEmail) {
      const normalizedEmail = userEmail.toLowerCase().trim();
      query.$or.push({ 'leader.email': normalizedEmail }, { 'members.email': normalizedEmail });
    }

    const team = await HackathonTeam.findOne(query);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No team registered or linked to your account.',
      });
    }

    const isLeader =
      (userId && team.leader?.userId && String(team.leader.userId) === String(userId)) ||
      (userEmail && team.leader?.email && team.leader.email.toLowerCase() === userEmail.toLowerCase());

    // Step 4: Only teams with status = CONFIRMED (or SUBMISSION_PENDING/SUBMITTED) can access
    const allowedStatuses = ['CONFIRMED', 'SUBMISSION_PENDING', 'SUBMITTED', 'UNDER_EVALUATION', 'EVALUATED'];
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
    let submission = await HackathonSubmission.findOne({ team: team._id });
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
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const query = {
      isDeleted: { $ne: true },
      $or: [],
    };
    if (userId) {
      query.$or.push({ 'leader.userId': userId }, { 'members.userId': userId });
    }
    if (userEmail) {
      const normalizedEmail = userEmail.toLowerCase().trim();
      query.$or.push({ 'leader.email': normalizedEmail }, { 'members.email': normalizedEmail });
    }

    const team = await HackathonTeam.findOne(query);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    // Step 5: Team Ownership - Only Leader can create/edit draft
    const isLeader =
      (userId && team.leader?.userId && String(team.leader.userId) === String(userId)) ||
      (userEmail && team.leader?.email && team.leader.email.toLowerCase() === userEmail.toLowerCase());

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
    let submission = await HackathonSubmission.findOne({ team: team._id });
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
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const query = {
      isDeleted: { $ne: true },
      $or: [],
    };
    if (userId) {
      query.$or.push({ 'leader.userId': userId }, { 'members.userId': userId });
    }
    if (userEmail) {
      const normalizedEmail = userEmail.toLowerCase().trim();
      query.$or.push({ 'leader.email': normalizedEmail }, { 'members.email': normalizedEmail });
    }

    const team = await HackathonTeam.findOne(query);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    // Step 5: Team Ownership - Leader only
    const isLeader =
      (userId && team.leader?.userId && String(team.leader.userId) === String(userId)) ||
      (userEmail && team.leader?.email && team.leader.email.toLowerCase() === userEmail.toLowerCase());

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
    let submission = await HackathonSubmission.findOne({ team: team._id });
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




