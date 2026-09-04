const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const HackathonSetting = require('../models/HackathonSetting');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonPayment = require('../models/HackathonPayment');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const User = require('../models/User');
const unstopParserService = require('../services/unstopParserService');
const hackathonEmailService = require('../services/hackathonEmailService');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

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
        finalSubmission: team.finalSubmission,
        shortlistedAt: team.shortlistedAt,
        whatsAppLink,
      },
      participationFee: settings.participationFee,
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

    // PRD Step 6: Verify team status is payable
    if (team.status !== 'SHORTLISTED' && team.status !== 'PAYMENT_PENDING') {
      return res.status(400).json({
        success: false,
        message: `Participation payment is not active for this team. Current status: ${team.status}`,
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

    // Verify HMAC signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await HackathonPayment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'FAILED', failureReason: 'Invalid signature mismatch' }
      );
      await HackathonAuditLog.log({
        actorId: req.user?.id || 'participant',
        actorName: req.user?.name || 'Participant',
        actorEmail: req.user?.email || '',
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

    // Locate Payment record
    const payment = await HackathonPayment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment order record not found in system.',
      });
    }

    const team = await HackathonTeam.findOne({ teamId: payment.teamId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Associated team not found.',
      });
    }

    const settings = await HackathonSetting.getOrCreateSettings();

    // Idempotency: If already paid & confirmed
    if (team.paymentStatus === 'PAID' && team.status === 'CONFIRMED') {
      return res.status(200).json({
        success: true,
        message: 'Participation already confirmed.',
        team: {
          teamId: team.teamId,
          status: team.status,
          paymentStatus: team.paymentStatus,
          confirmedAt: team.confirmedAt,
        },
        whatsAppLink: settings.whatsAppLink,
      });
    }

    // Update payment record
    payment.status = 'PAID';
    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.paidAt = new Date();
    await payment.save();

    // Update team to CONFIRMED
    const previousStatus = team.status;
    team.paymentStatus = 'PAID';
    team.status = 'CONFIRMED';
    team.confirmedAt = new Date();
    team.confirmationSource = 'PAYMENT';
    team.paymentDetails = {
      amount: payment.amount,
      currency: payment.currency,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paidAt: payment.paidAt,
      paymentMethod: 'RAZORPAY',
      razorpaySignature: razorpay_signature,
    };
    await team.save();

    // Audit logs
    await HackathonAuditLog.log({
      actorId: String(payment.leaderId || team.leader.email),
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
      actorId: String(payment.leaderId || team.leader.email),
      actorName: team.leader.name,
      actorEmail: team.leader.email,
      role: 'participant',
      action: 'TEAM_CONFIRMED',
      targetEntity: 'HackathonTeam',
      targetId: team.teamId,
      previousState: { status: previousStatus, paymentStatus: 'PENDING' },
      newState: { status: 'CONFIRMED', paymentStatus: 'PAID' },
      reason: 'Team confirmed participation upon successful payment',
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

    res.status(200).json({
      success: true,
      message: 'Participation successfully confirmed! WhatsApp community access unlocked.',
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
 */
exports.handlePaymentWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!signature || !webhookSecret) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature or secret.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Hackathon Webhook signature mismatch.');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = req.body.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const amount = (paymentEntity?.amount || 0) / 100;

      if (orderId) {
        let payment = await HackathonPayment.findOne({ orderId });
        let teamId = payment?.teamId || paymentEntity?.notes?.teamId;

        if (teamId) {
          const team = await HackathonTeam.findOne({ teamId });
          if (team) {
            // Idempotency: Ignore if already marked confirmed & paid
            if (team.paymentStatus === 'PAID' && team.status === 'CONFIRMED') {
              return res.status(200).json({
                success: true,
                message: 'Already confirmed via direct client verification.',
              });
            }

            if (payment) {
              payment.status = 'PAID';
              payment.paymentId = paymentId;
              payment.paidAt = new Date();
              payment.webhookReceived = true;
              payment.webhookPayload = req.body;
              await payment.save();
            }

            team.paymentStatus = 'PAID';
            team.status = 'CONFIRMED';
            team.confirmedAt = new Date();
            team.confirmationSource = 'WEBHOOK';
            team.paymentDetails = {
              amount,
              currency: 'INR',
              orderId,
              paymentId,
              paidAt: new Date(),
              paymentMethod: 'RAZORPAY',
            };
            await team.save();

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
              reason: `Team confirmed participation via gateway webhook (${event})`,
              req,
            });
          }
        }
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed successfully.' });
  } catch (error) {
    console.error('handlePaymentWebhook Error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing error: ' + error.message,
    });
  }
};



