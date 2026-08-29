const User = require("../models/User");
const QuizApplicant = require("../models/QuizApplicant");

// Get all website users with filters and search
exports.getAllUsers = async (req, res) => {
  try {
    const { type, search } = req.query;

    let query = {};
    let quizQuery = {};
    if (search) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      query = {
        $or: [
          { name: regex },
          { email: regex },
          { mobile: regex }
        ]
      };
      quizQuery = {
        $or: [
          { name: regex },
          { email: regex },
          { mobile: regex },
          { quizName: regex },
          { domain: regex }
        ]
      };
    }

    const [users, quizApplicants] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).lean(),
      QuizApplicant.find(quizQuery).sort({ createdAt: -1 }).lean()
    ]);

    // Create a map of quiz applicants by email
    const quizMap = new Map();
    for (const qa of quizApplicants) {
      if (qa.email) {
        const lowerEmail = qa.email.toLowerCase();
        const quizList = qa.quizzes && qa.quizzes.length > 0
          ? qa.quizzes
          : [{
              quizName: qa.quizName,
              registrationId: qa.registrationId,
              score: qa.score || "N/A",
              totalScore: qa.totalScore || "N/A",
              result: qa.result || "N/A",
              percentage: qa.percentage || "N/A",
              importedAt: qa.createdAt
            }];
        quizMap.set(lowerEmail, {
          _id: qa._id,
          quizName: qa.quizName,
          quizzes: quizList,
          domain: qa.domain,
          organisation: qa.organisation,
          resumeUrl: qa.resumeUrl
        });
      }
    }

    const userEmails = new Set();
    const formattedUsers = users.map((user) => {
      const lowerEmail = (user.email || "").toLowerCase();
      userEmails.add(lowerEmail);

      const internships = user.internships || [];
      const isIntern = user.role === "intern" || internships.length > 0;
      const appliedDomains = Array.from(new Set(internships.map((i) => i.domain).filter(Boolean)));

      const quizData = quizMap.get(lowerEmail);
      const isQuizUser = !!quizData;
      const quizzes = quizData ? quizData.quizzes : [];

      return {
        _id: user._id,
        name: user.name || "N/A",
        email: user.email || "N/A",
        mobile: user.mobile || "N/A",
        role: user.role || "user",
        isIntern,
        isQuizUser,
        internshipsCount: internships.length,
        quizzesCount: quizzes.length,
        quizzes,
        appliedDomains,
        internships: internships.map((i) => ({
          studentId: i.studentId,
          domain: i.domain,
          duration: i.duration,
          batch: i.batch,
          appliedAt: i.appliedAt,
          hasPaid: i.hasPaid,
          certificateUrl: i.certificateUrl
        })),
        interviewCredits: user.interviewCredits || 0,
        referredByCode: user.referredByCode || null,
        createdAt: user.createdAt
      };
    });

    // Add quiz-only applicants who haven't registered on the website yet
    for (const qa of quizApplicants) {
      const lowerEmail = (qa.email || "").toLowerCase();
      if (!lowerEmail || userEmails.has(lowerEmail)) continue;

      userEmails.add(lowerEmail);
      const quizList = qa.quizzes && qa.quizzes.length > 0
        ? qa.quizzes
        : [{
            quizName: qa.quizName,
            registrationId: qa.registrationId,
            score: qa.score || "N/A",
            totalScore: qa.totalScore || "N/A",
            result: qa.result || "N/A",
            percentage: qa.percentage || "N/A",
            importedAt: qa.createdAt
          }];

      formattedUsers.push({
        _id: qa._id,
        name: qa.name || "Unknown User",
        email: qa.email,
        mobile: qa.mobile || "N/A",
        role: "quiz_applicant",
        isIntern: false,
        isQuizUser: true,
        internshipsCount: 0,
        quizzesCount: quizList.length,
        quizzes: quizList,
        appliedDomains: qa.domain ? [qa.domain] : [],
        organisation: qa.organisation || "N/A",
        resumeUrl: qa.resumeUrl || null,
        internships: [],
        interviewCredits: 0,
        referredByCode: null,
        createdAt: qa.createdAt
      });
    }

    let filteredUsers = formattedUsers;
    if (type === "intern") {
      filteredUsers = formattedUsers.filter((u) => u.isIntern);
    } else if (type === "registered") {
      // Users who ONLY signed up — no internship applied and no quiz given
      filteredUsers = formattedUsers.filter((u) => !u.isIntern && !u.isQuizUser && u.role !== "quiz_applicant" && u.internshipsCount === 0);
    } else if (type === "quiz") {
      filteredUsers = formattedUsers.filter((u) => u.isQuizUser);
    }

    const stats = {
      total: formattedUsers.length,
      interns: formattedUsers.filter((u) => u.isIntern).length,
      registered: formattedUsers.filter((u) => !u.isIntern && !u.isQuizUser && u.role !== "quiz_applicant" && u.internshipsCount === 0).length,
      quiz: formattedUsers.filter((u) => u.isQuizUser).length,
    };

    res.json({
      success: true,
      stats,
      users: filteredUsers,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First try to find in User collection
    let user = await User.findById(id).populate('internships.assignedRepos.projectId').lean();
    let isQuizOnly = false;

    if (!user) {
      // If not found in User, it might be a quiz-only applicant
      user = await QuizApplicant.findById(id).lean();
      if (user) {
        isQuizOnly = true;
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If it's a regular user, also fetch their quiz data by email to merge it
    let quizzes = [];
    if (!isQuizOnly && user.email) {
      const quizApplicant = await QuizApplicant.findOne({ email: new RegExp(`^${user.email}$`, 'i') }).lean();
      if (quizApplicant) {
        quizzes = quizApplicant.quizzes && quizApplicant.quizzes.length > 0 
          ? quizApplicant.quizzes 
          : [{
              quizName: quizApplicant.quizName,
              registrationId: quizApplicant.registrationId,
              score: quizApplicant.score,
              totalScore: quizApplicant.totalScore,
              result: quizApplicant.result,
              percentage: quizApplicant.percentage,
              importedAt: quizApplicant.createdAt
            }];
      }
    } else if (isQuizOnly) {
      quizzes = user.quizzes && user.quizzes.length > 0 
        ? user.quizzes 
        : [{
            quizName: user.quizName,
            registrationId: user.registrationId,
            score: user.score,
            totalScore: user.totalScore,
            result: user.result,
            percentage: user.percentage,
            importedAt: user.createdAt
          }];
    }

    res.json({
      success: true,
      user,
      isQuizOnly,
      quizzes
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ success: false, message: "Server error fetching user details" });
  }
};
