const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');

exports.createSession = async (req, res) => {
  const { jobTitle, jobDescription, experienceYears, durationMinutes } = req.body;
  const userId = req.user.id || req.user.unifiedUserId;

  try {
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

    if (!isUnlimited && credits < 10) {
      return res.status(403).json({ success: false, message: 'Insufficient credits. Each interview costs 10 tokens. Please purchase more.' });
    }

    // Deduct credit only if not unlimited
    if (!isUnlimited) {
      user.interviewCredits = credits - 10;
      if (!user.tokenHistory) user.tokenHistory = [];
      user.tokenHistory.push({
        type: 'USE',
        amount: 10,
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
      durationMinutes
    });

    await session.save();

    const remaining = isUnlimited ? 'Unlimited' : (credits - 10);
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

    let aiEvaluation = null;
    try {
      if (feedback && feedback.conversation && feedback.conversation.length > 0) {
        const transcriptText = feedback.conversation.map(msg => `${msg.role.toUpperCase()}: ${msg.transcript}`).join('\n');

        const prompt = `Act as an expert Technical HR Manager conducting a job interview.
You are evaluating a candidate based on the following interview transcript. 
Analyze the candidate's responses in extreme detail for technical accuracy, communication skills, confidence, and overall performance.

Job Title being interviewed for: ${session.jobTitle || 'Unknown'}
Experience required: ${session.experienceYears || 'Unknown'} years

Transcript:
${transcriptText}

You must return your evaluation STRICTLY as a valid JSON object with the following structure (no markdown, no code blocks):
{
  "overall_score": 8,
  "technical_score": 7,
  "communication_score": 9,
  "strengths": ["Clear communication", "Good understanding of concepts"],
  "weaknesses": ["Hesitated on some questions", "Needs to explain concepts more deeply"],
  "enhancements": ["Practice system design questions", "Speak slower during technical explanations"],
  "detailed_feedback": "A highly detailed, comprehensive paragraph of overall HR feedback."
}`;

        const groqKeys = [
          process.env.GROQ_API_KEY,
          process.env.GROQ_API_KEY_2,
          process.env.GROQ_API_KEY_3,
          process.env.GROQ_API_KEY_4
        ].filter(Boolean);

        if (groqKeys.length > 0) {
          const key = groqKeys[Math.floor(Math.random() * groqKeys.length)];
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
            })
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const responseText = data.choices[0].message.content || "";
            const jsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            aiEvaluation = JSON.parse(jsonStr);
          } else {
            console.error('Groq API Error:', await groqRes.text());
          }
        } else {
          console.error('No GROQ_API_KEY found in environment.');
        }
      }
    } catch (aiErr) {
      console.error('Error generating AI feedback:', aiErr);
    }

    session.feedback = feedback || session.feedback;
    if (aiEvaluation) {
      session.feedback = { ...session.feedback, ai_evaluation: aiEvaluation };
      if (aiEvaluation.overall_score) {
        session.feedback.overallScore = aiEvaluation.overall_score;
      }
    }

    session.status = status || 'Completed';
    await session.save();

    res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Error ending interview session:', error);
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
    
    res.status(200).json({
      success: true,
      credits: user.interviewCredits || 0,
      isUnlimited: isUnlimited,
      role: isInternRole ? 'intern' : 'interview_user',
      user: { name: user.name, email: user.email, profileImage: user.profileImage, mobile: user.mobile }
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
