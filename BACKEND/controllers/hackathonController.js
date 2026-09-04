const HackathonSetting = require('../models/HackathonSetting');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonAuditLog = require('../models/HackathonAuditLog');
const User = require('../models/User');
const unstopParserService = require('../services/unstopParserService');

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
      HackathonTeam.countDocuments(),
      HackathonTeam.countDocuments({ 'initialIdea.pptUrl': { $exists: true, $ne: '' } }),
      HackathonTeam.countDocuments({ status: { $in: ['IMPORTED', 'UNDER_REVIEW'] } }),
      HackathonTeam.countDocuments({ status: 'SHORTLISTED' }),
      HackathonTeam.countDocuments({
        $or: [{ status: 'PAYMENT_PENDING' }, { paymentStatus: 'PENDING' }],
      }),
      HackathonTeam.countDocuments({
        $or: [{ status: 'CONFIRMED' }, { paymentStatus: 'PAID' }],
      }),
      HackathonTeam.countDocuments({
        $or: [{ status: 'SUBMITTED' }, { 'finalSubmission.submittedAt': { $ne: null } }],
      }),
      HackathonTeam.countDocuments({ status: 'EVALUATED' }),
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
 * 9. Get Admin Teams List
 */
exports.getAdminTeams = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.track) {
      filter.track = req.query.track;
    }
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { teamName: regex },
        { teamId: regex },
        { unstopApplicationId: regex },
        { 'leader.email': regex },
        { 'leader.name': regex },
      ];
    }

    const [teams, total] = await Promise.all([
      HackathonTeam.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
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

