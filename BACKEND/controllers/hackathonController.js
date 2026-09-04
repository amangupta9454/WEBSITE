const mongoose = require('mongoose');
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

    const allowedTransitions = ['IMPORTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED'];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition for Phase 3. Allowed: ${allowedTransitions.join(', ')}`,
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
      team.shortlistedAt = new Date();
      auditAction = 'TEAM_SHORTLISTED';
      // PRD Step 14: Phase 3 MUST ONLY update database status and record audit log.
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
      newState: { status: updatedTeam.status, rejectionReason: updatedTeam.rejectionReason },
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


