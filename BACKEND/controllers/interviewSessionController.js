const User = require('../models/User');
const InterviewSession = require('../models/InterviewSession');
const Settings = require('../models/Settings');
const { sanitizeText } = require('../utils/sanitizer');
const auditLogger = require('../utils/auditLogger');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const validateEvaluationSchema = (data) => {
  if (!data || typeof data !== 'object') throw new Error('Invalid JSON: Not an object');
  
  const requiredKeys = [
    'executive_summary', 'final_recommendation', 'recommendation_reason',
    'estimated_experience_level', 'estimated_salary_band', 'promotion_readiness',
    'hiring_risk', 'confidence_scores', 'skill_matrix', 'strengths', 'weaknesses'
  ];
  
  for (const key of requiredKeys) {
    if (!(key in data)) throw new Error(`Missing required key: ${key}`);
  }
  
  const scores = data.confidence_scores;
  if (!scores || typeof scores !== 'object') throw new Error('confidence_scores must be an object');
  const scoreKeys = ['overall', 'technical', 'behavioral', 'leadership', 'communication'];
  for (const sk of scoreKeys) {
    if (!scores[sk] || typeof scores[sk] !== 'object') throw new Error(`confidence_scores.${sk} must be an object`);
    if (typeof scores[sk].score !== 'number') throw new Error(`confidence_scores.${sk}.score must be a number`);
    if (!('evidence' in scores[sk])) throw new Error(`confidence_scores.${sk} must contain evidence`);
  }
  
  if (!Array.isArray(data.skill_matrix)) throw new Error('skill_matrix must be an array');
  
  return true;
};

exports.createSession = async (req, res) => {
  const { jobTitle, jobDescription, experienceYears, durationMinutes } = req.body;
  const userId = req.user.id || req.user.unifiedUserId;

  try {
    let extractedResumeText = "";

    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ success: false, message: 'Only PDF files are supported for resumes.' });
      }
      try {
        const pdfData = await pdfParse(req.file.buffer);
        extractedResumeText = pdfData.text
          .replace(/\n+/g, '\n') 
          .replace(/ +/g, ' ')   
          .trim();
        
        if (extractedResumeText.length > 15000) {
          extractedResumeText = extractedResumeText.substring(0, 3000);
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return res.status(400).json({ success: false, message: 'Failed to extract text from PDF. It may be corrupted or password protected.' });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const credits = user.interviewCredits || 0;
    let isUnlimited = user.interviewIsUnlimited || false;
    
    if (isUnlimited && user.interviewUnlimitedExpiresAt && new Date() > user.interviewUnlimitedExpiresAt) {
      isUnlimited = false; // Expired
      user.interviewIsUnlimited = false;
      await user.save();
    }

    // ✅ Check if interview feature is globally enabled or user has an override
    const featureSetting = await Settings.findOne({ key: 'interviewEnabled' });
    const isFeatureGloballyEnabled = featureSetting ? featureSetting.value === true || featureSetting.value === 'true' : true;
    const hasOverride = user.interviewAccessOverride === true;

    if (!isFeatureGloballyEnabled && !hasOverride) {
      return res.status(403).json({ success: false, message: 'Interview feature is currently disabled.' });
    }

    const costSetting = await Settings.findOne({ key: 'interviewCostTokens' });
    const interviewCost = costSetting && costSetting.value !== undefined ? Number(costSetting.value) : 10;

    if (!isUnlimited && credits < interviewCost) {
      return res.status(403).json({ success: false, message: `Insufficient credits. Each interview costs ${interviewCost} tokens. Please purchase more.` });
    }

    // Deduct credit only if not unlimited
    if (!isUnlimited) {
      user.interviewCredits = credits - interviewCost;
      if (!user.tokenHistory) user.tokenHistory = [];
      user.tokenHistory.push({
        type: 'USE',
        amount: interviewCost,
        reason: 'Started a mock interview',
        date: new Date()
      });
      await user.save();
    }

    const session = new InterviewSession({
      userId,
      jobTitle,
      jobDescription,
      experienceYears,
      durationMinutes,
      resumeText: extractedResumeText
    });

    await session.save();
    
    auditLogger.log('INTERVIEW_CREATED', { sessionId: session._id, userId });

    const remaining = isUnlimited ? 'Unlimited' : (credits - interviewCost);
    res.status(201).json({ success: true, session, creditsRemaining: remaining });
  } catch (error) {
    console.error('Error creating interview session:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.endSession = async (req, res) => {
  const { sessionId, feedback, status } = req.body;
  const userId = req.user.id || req.user.unifiedUserId;

  try {
    const session = await InterviewSession.findOne({ _id: sessionId, userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Prevents duplicate submissions/feedback generation
    if (session.status === 'Completed' || session.status === 'Aborted') {
      return res.status(200).json({ success: true, message: 'Session already ended', session });
    }

    // Save transcript payload directly into session, then return 202
    if (feedback) {
      session.messages = feedback.conversation || [];
      session.recruiterMemory = feedback.recruiterMemory || {};
      session.attentionReport = feedback.attentionReport || {};
    }
    
    if (req.body.resumeText) {
      session.resumeText = req.body.resumeText;
    }

    session.status = status === 'Aborted' ? 'Aborted' : 'EVALUATION_PENDING';
    await session.save();
    
    auditLogger.log('INTERVIEW_ENDED', { sessionId: session._id, status: session.status });

    if (session.status === 'Aborted') {
      return res.status(200).json({ success: true, session });
    }

    return res.status(202).json({ success: true, message: 'Evaluation pending', sessionId: session._id });
  } catch (error) {
    console.error('Error ending interview session:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.processEvaluation = async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id || req.user.unifiedUserId;

  try {
    const session = await InterviewSession.findOne({ _id: sessionId, userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'EVALUATION_PENDING') {
      return res.status(400).json({ success: false, message: 'Session not pending evaluation' });
    }

    session.status = 'EVALUATION_RUNNING';
    await session.save();

    let aiEvaluation = null;
    try {
      if (session.messages && session.messages.length > 0) {
        const rawTranscript = session.messages.map(msg => `${msg.role.toUpperCase()}: ${msg.transcript}`).join('\n');
        const evidenceGraph = session.recruiterMemory?.evidenceGraph || [];
        const verifiedSkills = session.recruiterMemory?.verifiedSkills || [];
        const rawResumeText = session.resumeText || "No resume context provided.";

        // Sanitize and limit untrusted inputs
        const transcriptText = sanitizeText(rawTranscript, 50000);
        const resumeText = sanitizeText(rawResumeText, 25000);
        const safeJobTitle = sanitizeText(session.jobTitle || 'Unknown', 100);

        // Load Active Prompt from Registry
        const registryPath = path.join(__dirname, '../ai-qa/prompt-registry.json');
        let promptTemplate = "";
        try {
          const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
          const activePrompt = registryData.prompts.find(p => p.version === registryData.activeVersion);
          promptTemplate = activePrompt ? activePrompt.content : "";
        } catch (err) {
          console.error("Failed to load prompt registry:", err);
        }

        if (!promptTemplate) {
          throw new Error("Critical Error: AI Prompt Template is missing or registry is corrupt.");
        }

        const prompt = promptTemplate
          .replace('{{EVIDENCE_GRAPH}}', JSON.stringify(evidenceGraph, null, 2))
          .replace('{{VERIFIED_SKILLS}}', verifiedSkills.join(', '))
          .replace('{{JOB_TITLE}}', safeJobTitle)
          .replace('{{EXPERIENCE_YEARS}}', session.experienceYears || 'Unknown')
          .replace('{{RESUME_TEXT}}', resumeText)
          .replace('{{TRANSCRIPT_TEXT}}', transcriptText);

        const groqKeys = [
          process.env.GROQ_API_KEY,
          process.env.GROQ_API_KEY_2,
          process.env.GROQ_API_KEY_3,
          process.env.GROQ_API_KEY_4
        ].filter(Boolean);

        if (groqKeys.length > 0) {
          let attempts = 0;
          let lastError = null;
          const maxAttempts = 3; // 1 initial + 2 retries

          while (attempts < maxAttempts && !aiEvaluation) {
            try {
              const key = groqKeys[Math.floor(Math.random() * groqKeys.length)];
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

              const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${key}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  messages: [{ role: 'user', content: prompt }],
                  model: 'llama-3.3-70b-versatile',
                  temperature: 0.2,
                  response_format: { type: "json_object" }
                }),
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);

              if (groqRes.ok) {
                const data = await groqRes.json();
                const responseText = data.choices[0].message.content || "";
                const jsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(jsonStr);
                
                // Validate Schema
                validateEvaluationSchema(parsed);
                aiEvaluation = parsed; // Success
                auditLogger.log('EVALUATION_GENERATED', { sessionId: session._id, attempts: attempts + 1 });
              } else {
                throw new Error(`Groq API Error: ${groqRes.status} ${await groqRes.text()}`);
              }
            } catch (err) {
              attempts++;
              lastError = err.message;
              console.error(`AI Evaluation Attempt ${attempts} failed:`, lastError);
              if (attempts < maxAttempts) {
                // Exponential backoff: 2s, 4s
                await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
              }
            }
          }

          // Safe Fallback
          if (!aiEvaluation) {
            aiEvaluation = {
              status: "failed",
              failure_reason: lastError || "Unknown error",
              timestamp: Date.now(),
              evidence_graph_fallback: evidenceGraph,
              transcript_fallback: transcriptText
            };
          }

        } else {
          console.error('No GROQ_API_KEY found in environment.');
        }
      }
    } catch (aiErr) {
      console.error('Error generating AI feedback:', aiErr);
    }

    const mappedEvaluation = {
      overall_score: aiEvaluation.confidence_scores?.overall?.score ? Math.round(aiEvaluation.confidence_scores.overall.score / 10) : 0,
      technical_score: aiEvaluation.confidence_scores?.technical?.score ? Math.round(aiEvaluation.confidence_scores.technical.score / 10) : 0,
      communication_score: aiEvaluation.confidence_scores?.communication?.score ? Math.round(aiEvaluation.confidence_scores.communication.score / 10) : 0,
      detailed_feedback: aiEvaluation.executive_summary || "No feedback generated.",
      strengths: aiEvaluation.strengths || [],
      weaknesses: aiEvaluation.weaknesses || [],
      enhancements: aiEvaluation.learning_roadmap ? Object.values(aiEvaluation.learning_roadmap).flat() : []
    };

    session.feedback = {
      ...(session.feedback || {}),
      ai_evaluation: mappedEvaluation,
      enterprise_evaluation: aiEvaluation
    };
    session.status = 'Completed';
    await session.save();
    auditLogger.log('EVALUATION_FINISHED', { sessionId: session._id, status: session.status });

    res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Error in processEvaluation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getSessionStatus = async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id || req.user.unifiedUserId;

  try {
    const session = await InterviewSession.findOne({ _id: sessionId, userId }).select('status');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.status(200).json({ success: true, status: session.status });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getUserSessions = async (req, res) => {
  const userId = req.user.id || req.user.unifiedUserId;
  try {
    const sessions = await InterviewSession.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getUserCredits = async (req, res) => {
  const userId = req.user.id || req.user.unifiedUserId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let isUnlimited = user.interviewIsUnlimited || false;
    
    if (isUnlimited && user.interviewUnlimitedExpiresAt && new Date() > user.interviewUnlimitedExpiresAt) {
      isUnlimited = false; // Expired
      user.interviewIsUnlimited = false;
      await user.save();
    }

    const isInternRole = user.internships && user.internships.length > 0;
    
    const costSetting = await Settings.findOne({ key: 'interviewCostTokens' });
    const interviewCost = costSetting && costSetting.value !== undefined ? Number(costSetting.value) : 10;
    
    const globalFeatureSetting = await Settings.findOne({ key: 'interviewEnabled' });
    const globalEnabled = globalFeatureSetting ? globalFeatureSetting.value : true;
    const interviewEnabled = globalEnabled || !!user.interviewAccessOverride;
    
    res.status(200).json({
      success: true,
      credits: user.interviewCredits || 0,
      isUnlimited: isUnlimited,
      interviewCost: interviewCost,
      interviewEnabled: interviewEnabled,
      role: isInternRole ? 'intern' : 'interview_user',
      user: { name: user.name, email: user.email, profileImage: user.profileImage, mobile: user.mobile, interviewAccessOverride: !!user.interviewAccessOverride }
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteSession = async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id || req.user.unifiedUserId;

  try {
    const session = await InterviewSession.findOneAndDelete({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.status(200).json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
