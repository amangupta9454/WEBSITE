/**
 * Phase 13 — Enterprise Analytics & Intelligence Platform
 * Module 3: Student Analytics Service
 * 
 * READ-ONLY aggregation per student candidate.
 * Computes Attempts, Avg/High/Low percentage scores, Certificates earned,
 * Skill progression, Category performance, and historical Growth timelines.
 */
const mongoose = require("mongoose");
const AssessmentResult = require("../../../models/assessment/AssessmentResult");
const AssessmentCertificate = require("../../../models/assessment/AssessmentCertificate");
const AssessmentSession = require("../../../models/assessment/AssessmentSession");
const User = require("../../../models/User");

class StudentAnalytics {
  /**
   * Retrieves paginated student analytical performance summary.
   */
  static async getStudentListAnalytics(filter = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const matchStage = {};

    if (filter.startDate || filter.endDate) {
      matchStage.createdAt = {};
      if (filter.startDate) matchStage.createdAt.$gte = new Date(filter.startDate);
      if (filter.endDate) matchStage.createdAt.$lte = new Date(filter.endDate);
    }

    // Group evaluated results by candidateId
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$candidateId",
          userId: { $first: "$userId" },
          attempts: { $sum: 1 },
          avgPercentage: { $avg: "$scoreSummary.percentage" },
          highestPercentage: { $max: "$scoreSummary.percentage" },
          lowestPercentage: { $min: "$scoreSummary.percentage" },
          lastAttemptDate: { $max: "$createdAt" }
        }
      },
      { $sort: { attempts: -1, avgPercentage: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const countPipeline = [
      { $match: matchStage },
      { $group: { _id: "$candidateId" } },
      { $count: "totalCount" }
    ];

    const [aggregatedData, totalCountRes] = await Promise.all([
      AssessmentResult.aggregate(pipeline),
      AssessmentResult.aggregate(countPipeline)
    ]);

    const totalCount = totalCountRes.length ? totalCountRes[0].totalCount : 0;

    // Fetch user profile info & certificate counts
    const userIds = aggregatedData
      .map(d => d.userId)
      .filter(id => id && mongoose.isValidObjectId(id));

    const candidateIds = aggregatedData.map(d => d._id);

    const [users, certCounts] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select("name email phone").lean(),
      AssessmentCertificate.aggregate([
        { $match: { candidateId: { $in: candidateIds }, isRevoked: false } },
        { $group: { _id: "$candidateId", count: { $sum: 1 } } }
      ])
    ]);

    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));
    const certMap = Object.fromEntries(certCounts.map(c => [c._id, c.count]));

    const items = aggregatedData.map(item => {
      const u = (item.userId && userMap[item.userId.toString()]) || {};
      const certCount = certMap[item._id] || 0;
      const avg = Math.round(item.avgPercentage * 10) / 10;
      
      // Determine skill maturity based on average score and attempt density
      let skillProgress = "Novice";
      if (avg >= 85 && item.attempts >= 3) skillProgress = "Advanced Expert";
      else if (avg >= 70) skillProgress = "Proficient Practitioner";
      else if (avg >= 55) skillProgress = "Developing Candidate";

      return {
        candidateId: item._id,
        userId: item.userId || null,
        name: u.name || item._id,
        email: u.email || "Confidential",
        attempts: item.attempts,
        averagePercentage: avg,
        highestPercentage: Math.round(item.highestPercentage),
        lowestPercentage: Math.round(item.lowestPercentage),
        certificatesEarned: certCount,
        currentSkillProgress: skillProgress,
        lastAttemptDate: item.lastAttemptDate
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1
      }
    };
  }

  /**
   * Retrieves deep-dive analytical history and skill timeline for a single candidate.
   */
  static async getStudentDetail(candidateId) {
    if (!candidateId) throw new Error("Candidate identifier required.");

    const results = await AssessmentResult.find({ candidateId })
      .populate("subcategoryId", "name icon")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const certificates = await AssessmentCertificate.find({ candidateId, isRevoked: false })
      .sort({ issuedAt: -1 })
      .lean();

    const sessions = await AssessmentSession.find({ candidateId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("sessionId status createdAt endTime passed subcategoryId")
      .lean();

    // Calculate category performance mapping
    const categoryPerformance = {};
    results.forEach(res => {
      const subName = res.subcategoryId?.name || "Standard Evaluation";
      if (!categoryPerformance[subName]) {
        categoryPerformance[subName] = { total: 0, sum: 0, passed: 0 };
      }
      categoryPerformance[subName].total += 1;
      categoryPerformance[subName].sum += res.scoreSummary.percentage;
      if (res.passed) categoryPerformance[subName].passed += 1;
    });

    const categorySummary = Object.entries(categoryPerformance).map(([name, stat]) => ({
      categoryName: name,
      attempts: stat.total,
      averageScore: Math.round((stat.sum / stat.total) * 10) / 10,
      passRate: Math.round((stat.passed / stat.total) * 100)
    }));

    // Generate chronological growth timeline
    const growthTimeline = [...results]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(r => ({
        date: new Date(r.createdAt).toLocaleDateString(),
        score: Math.round(r.scoreSummary.percentage),
        resultId: r.resultId,
        passed: r.passed
      }));

    return {
      candidateId,
      totalAttempts: results.length,
      certificatesEarned: certificates.length,
      recentAssessments: results.slice(0, 10),
      attemptHistory: sessions,
      categoryPerformance: categorySummary,
      growthTimeline,
      certificates
    };
  }
}

module.exports = StudentAnalytics;
