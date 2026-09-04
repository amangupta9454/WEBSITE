const HackathonResult = require('../models/HackathonResult');
const HackathonTeam = require('../models/HackathonTeam');
const HackathonSubmission = require('../models/HackathonSubmission');
const HackathonEditorialAssignment = require('../models/HackathonEditorialAssignment');
const HackathonEditorialEvaluation = require('../models/HackathonEditorialEvaluation');
const HackathonSetting = require('../models/HackathonSetting');
const HackathonAuditLog = require('../models/HackathonAuditLog');

/**
 * Deterministic Result Calculation Service for Code-A-Nova Hackathon
 */
class HackathonResultService {
  /**
   * Run server-side score aggregation and ranking
   */
  static async calculateResults({ hackathonId = 'can-hackathon-2026', actorId, actorName, actorEmail, req }) {
    // 1. Verify hackathon settings & lock status
    const setting =
      (await HackathonSetting.findOne({ hackathonId })) ||
      (await HackathonSetting.findOne()) ||
      (await HackathonSetting.getOrCreateSettings(hackathonId));
    if (setting?.resultsLocked) {
      throw new Error('Official results are locked and cannot be recalculated without explicit administrative reopening.');
    }

    // 2. Fetch all teams in the hackathon
    const teamFilter = { isDeleted: { $ne: true } };
    if (hackathonId && hackathonId !== 'can-hackathon-2026') {
      teamFilter.hackathonId = hackathonId;
    } else {
      teamFilter.$or = [{ hackathonId: 'can-hackathon-2026' }, { hackathonId: { $exists: false } }, { hackathonId: null }];
    }
    const teams = await HackathonTeam.find(teamFilter).lean();

    if (!teams || teams.length === 0) {
      return {
        success: true,
        message: 'No teams found for result calculation.',
        consideredCount: 0,
        eligibleCount: 0,
        pendingCount: 0,
        ineligibleCount: 0,
        rankings: [],
        ties: [],
      };
    }

    // 3. Batch fetch all submissions, assignments, and finalized evaluations
    const teamIds = teams.map((t) => t._id);
    const teamStringIds = teams.map((t) => t.teamId);

    const [submissions, assignments, finalizedEvaluations] = await Promise.all([
      HackathonSubmission.find({ hackathonId }).lean(),
      HackathonEditorialAssignment.find({
        hackathonId,
        status: 'ACTIVE',
      })
        .populate('editorialMember', 'name email role isActive')
        .lean(),
      HackathonEditorialEvaluation.find({
        hackathonId,
        status: 'FINALIZED',
        isLocked: true,
      })
        .populate('editorialMember', 'name email role isActive')
        .lean(),
    ]);

    // Build lookup maps for efficient zero-N+1 access
    const submissionMap = {};
    submissions.forEach((sub) => {
      submissionMap[String(sub.team)] = sub;
      submissionMap[sub.teamId] = sub;
    });

    const assignmentMap = {};
    assignments.forEach((as) => {
      const tKey = String(as.team);
      if (!assignmentMap[tKey]) assignmentMap[tKey] = [];
      assignmentMap[tKey].push(as);
    });

    const evalMap = {};
    finalizedEvaluations.forEach((ev) => {
      const tKey = String(ev.team);
      if (!evalMap[tKey]) evalMap[tKey] = [];
      evalMap[tKey].push(ev);
    });

    // 4. Process each team and evaluate eligibility
    const processedResults = [];
    const ties = [];

    teams.forEach((team) => {
      const tKey = String(team._id);
      const teamSubmission = submissionMap[tKey] || submissionMap[team.teamId];
      const teamAssignments = assignmentMap[tKey] || [];
      const teamEvals = evalMap[tKey] || [];

      const judgeCount = teamAssignments.length;
      const finalizedJudgeCount = teamEvals.length;
      const pendingJudgeCount = Math.max(0, judgeCount - finalizedJudgeCount);

      let rankingStatus = 'READY';
      let statusReason = '';

      // Check Eligibility conditions
      if (team.status === 'REJECTED') {
        rankingStatus = 'INELIGIBLE';
        statusReason = 'Team was rejected in admin review.';
      } else if (!teamSubmission || teamSubmission.status !== 'SUBMITTED') {
        rankingStatus = 'INELIGIBLE';
        statusReason = 'Final project submission missing or not completed.';
      } else if (judgeCount === 0) {
        rankingStatus = 'INELIGIBLE';
        statusReason = 'No judges assigned to evaluate project.';
      } else if (pendingJudgeCount > 0) {
        rankingStatus = 'PENDING_EVALUATIONS';
        statusReason = `${pendingJudgeCount} assigned judge evaluation(s) pending completion.`;
      }

      // Compute score if READY
      let finalScore = 0;
      let averageScore = 0;
      if (rankingStatus === 'READY' && finalizedJudgeCount > 0) {
        const totalSum = teamEvals.reduce((sum, ev) => sum + (ev.totalScore || 0), 0);
        averageScore = Number((totalSum / finalizedJudgeCount).toFixed(2));
        finalScore = averageScore;
      }

      // Build score snapshot
      const scoreSnapshot = teamEvals.map((ev) => ({
        judgeId: ev.editorialMember?._id,
        judgeName: ev.editorialMember?.name || 'Unknown Judge',
        judgeEmail: ev.editorialMember?.email || '',
        criteriaScores: (ev.criteriaScores || []).map((c) => ({
          criterionId: c.criterionId || '',
          criterionName: c.criterionName || '',
          score: c.score || 0,
          maxScore: c.maxScore || 25,
        })),
        totalScore: ev.totalScore || 0,
        comments: ev.comments || '',
        finalizedAt: ev.finalizedAt || ev.updatedAt || new Date(),
      }));

      processedResults.push({
        teamObjectId: team._id,
        teamId: team.teamId,
        teamName: team.teamName,
        track: team.track || 'General Track',
        submissionId: teamSubmission?._id || null,
        judgeCount,
        finalizedJudgeCount,
        pendingJudgeCount,
        rankingStatus,
        statusReason,
        finalScore,
        averageScore,
        scoreSnapshot,
      });
    });

    // 5. Separate eligible READY teams for deterministic sorting & tie detection
    const eligibleTeams = processedResults.filter((r) => r.rankingStatus === 'READY');
    const ineligibleTeams = processedResults.filter((r) => r.rankingStatus !== 'READY');

    // Deterministic Sort: Primary: finalScore DESC, Secondary: teamId ASC (stable ordering)
    eligibleTeams.sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return a.teamId.localeCompare(b.teamId);
    });

    // 6. Assign Ranks and Detect Ties
    // Detect ties among adjacent teams with identical final scores
    const scoreFrequency = {};
    eligibleTeams.forEach((t) => {
      scoreFrequency[t.finalScore] = (scoreFrequency[t.finalScore] || 0) + 1;
    });

    let currentRank = 1;
    eligibleTeams.forEach((team, idx) => {
      if (idx > 0 && team.finalScore < eligibleTeams[idx - 1].finalScore) {
        currentRank = idx + 1;
      }
      team.rank = currentRank;

      // If multiple teams share the same score, flag tie
      if (scoreFrequency[team.finalScore] > 1) {
        team.rankingStatus = 'TIE';
        team.statusReason = `Tie detected with score ${team.finalScore}.`;
        const tiedPeerIds = eligibleTeams
          .filter((peer) => peer.finalScore === team.finalScore && peer.teamId !== team.teamId)
          .map((peer) => peer.teamId);
        team.tieDetails = {
          isTie: true,
          tiedWithTeamIds: tiedPeerIds,
        };

        if (!ties.find((tie) => tie.score === team.finalScore)) {
          ties.push({
            score: team.finalScore,
            teams: eligibleTeams
              .filter((p) => p.finalScore === team.finalScore)
              .map((p) => ({ teamId: p.teamId, teamName: p.teamName, rank: p.rank })),
          });
        }
      } else {
        team.tieDetails = {
          isTie: false,
          tiedWithTeamIds: [],
        };
      }
    });

    // Ineligible teams get null rank
    ineligibleTeams.forEach((team) => {
      team.rank = null;
      team.tieDetails = {
        isTie: false,
        tiedWithTeamIds: [],
      };
    });

    const allRanked = [...eligibleTeams, ...ineligibleTeams];

    // 7. Persist or Update into HackathonResult collection
    const existingResults = await HackathonResult.find({ hackathonId }).lean();
    const existingMap = {};
    existingResults.forEach((ex) => {
      existingMap[ex.teamId] = ex;
    });

    const isRecalculation = existingResults.length > 0;
    const now = new Date();

    for (const item of allRanked) {
      const existing = existingMap[item.teamId];

      // If already locked, skip modifying
      if (existing?.isLocked) {
        continue;
      }

      const updateData = {
        hackathonId,
        team: item.teamObjectId,
        teamId: item.teamId,
        teamName: item.teamName,
        track: item.track,
        submissionId: item.submissionId,
        rank: item.rank,
        finalScore: item.finalScore,
        averageScore: item.averageScore,
        judgeCount: item.judgeCount,
        finalizedJudgeCount: item.finalizedJudgeCount,
        pendingJudgeCount: item.pendingJudgeCount,
        rankingStatus: item.rankingStatus,
        statusReason: item.statusReason,
        resultStatus: existing?.resultStatus === 'APPROVED' ? 'APPROVED' : 'CALCULATED',
        scoreSnapshot: item.scoreSnapshot,
        tieDetails: item.tieDetails,
      };

      // Preserve existing category / winner / prize if previously assigned
      if (existing) {
        updateData.category = existing.category;
        updateData.prize = existing.prize;
        updateData.isWinner = existing.isWinner;
        updateData.isRunnerUp = existing.isRunnerUp;
        updateData.isPublished = existing.isPublished;
        updateData.approvedBy = existing.approvedBy;
        updateData.approvedAt = existing.approvedAt;
        updateData.rankingSnapshot = existing.rankingSnapshot;
      }

      await HackathonResult.findOneAndUpdate(
        { hackathonId, teamId: item.teamId },
        {
          $set: updateData,
          $push: {
            history: {
              action: isRecalculation ? 'RESULTS_RECALCULATED' : 'RESULTS_CALCULATED',
              actor: actorName || 'admin',
              timestamp: now,
              newState: {
                rank: item.rank,
                finalScore: item.finalScore,
                rankingStatus: item.rankingStatus,
              },
            },
          },
        },
        { upsert: true, new: true }
      );
    }

    // 8. Log Audit Event
    await HackathonAuditLog.log({
      actorId: actorId || 'admin',
      actorName: actorName || 'Administrator',
      actorEmail: actorEmail || '',
      role: 'admin',
      action: isRecalculation ? 'RESULTS_RECALCULATED' : 'RESULTS_CALCULATED',
      targetEntity: 'HackathonResult',
      targetId: hackathonId,
      newState: {
        totalConsidered: teams.length,
        eligibleCount: eligibleTeams.length,
        pendingCount: ineligibleTeams.filter((t) => t.rankingStatus === 'PENDING_EVALUATIONS').length,
        ineligibleCount: ineligibleTeams.filter((t) => t.rankingStatus === 'INELIGIBLE').length,
        tiesCount: ties.length,
      },
      req,
    });

    return {
      success: true,
      message: isRecalculation ? 'Results recalculated successfully.' : 'Results calculated successfully.',
      consideredCount: teams.length,
      eligibleCount: eligibleTeams.length,
      pendingCount: ineligibleTeams.filter((t) => t.rankingStatus === 'PENDING_EVALUATIONS').length,
      ineligibleCount: ineligibleTeams.filter((t) => t.rankingStatus === 'INELIGIBLE').length,
      tiesCount: ties.length,
      ties,
      rankings: eligibleTeams,
      ineligible: ineligibleTeams,
    };
  }

  /**
   * Resolve a tie administratively
   */
  static async resolveTie({ hackathonId = 'can-hackathon-2026', teamOrders, tieBreakReason, actorId, actorName, actorEmail, req }) {
    // teamOrders is an array of { teamId, rank }
    if (!Array.isArray(teamOrders) || teamOrders.length === 0) {
      throw new Error('Valid team ranking order is required to resolve tie.');
    }
    if (!tieBreakReason || !tieBreakReason.trim()) {
      throw new Error('Administrative tie-break reason is mandatory.');
    }

    const setting =
      (await HackathonSetting.findOne({ hackathonId })) ||
      (await HackathonSetting.findOne()) ||
      (await HackathonSetting.getOrCreateSettings(hackathonId));
    if (setting?.resultsLocked) {
      throw new Error('Results are locked and tie cannot be modified.');
    }

    const now = new Date();
    const resolvedTeams = [];

    for (const item of teamOrders) {
      const resultDoc = await HackathonResult.findOne({ hackathonId, teamId: item.teamId });
      if (!resultDoc) {
        throw new Error(`Result record for team ${item.teamId} not found.`);
      }
      if (resultDoc.isLocked) {
        throw new Error(`Result for team ${item.teamId} is locked.`);
      }

      const previousRank = resultDoc.rank;
      resultDoc.rank = item.rank;
      resultDoc.rankingStatus = 'READY';
      resultDoc.statusReason = `Tie resolved by admin: ${tieBreakReason.trim()}`;
      resultDoc.tieDetails = {
        isTie: false,
        tiedWithTeamIds: [],
        resolvedBy: actorName || 'admin',
        resolvedAt: now,
        tieBreakReason: tieBreakReason.trim(),
        tieMethod: 'ADMIN_DECISION',
      };

      resultDoc.history.push({
        action: 'RESULT_TIE_RESOLVED',
        actor: actorName || 'admin',
        timestamp: now,
        previousState: { rank: previousRank, rankingStatus: 'TIE' },
        newState: { rank: item.rank, rankingStatus: 'READY' },
        reason: tieBreakReason.trim(),
      });

      await resultDoc.save();
      resolvedTeams.push({ teamId: item.teamId, rank: item.rank });
    }

    await HackathonAuditLog.log({
      actorId: actorId || 'admin',
      actorName: actorName || 'Administrator',
      actorEmail: actorEmail || '',
      role: 'admin',
      action: 'RESULT_TIE_RESOLVED',
      targetEntity: 'HackathonResult',
      targetId: hackathonId,
      newState: { resolvedTeams, tieBreakReason: tieBreakReason.trim() },
      req,
    });

    return {
      success: true,
      message: 'Tie successfully resolved.',
      resolvedTeams,
    };
  }
}

module.exports = HackathonResultService;
