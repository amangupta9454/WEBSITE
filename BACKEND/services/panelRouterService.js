const fetch = require('node-fetch');

// Helper to sanitize text
const sanitizeText = (text, maxLength = 10000) => {
  if (!text) return "";
  let cleanText = text.replace(/<[^>]*>?/gm, '');
  return cleanText.substring(0, maxLength);
};

/**
 * Intelligent Router for AI Panel Interviews.
 * Decides whether the conversation stage should advance and who should speak next.
 * 
 * @param {Array} transcript - Array of message objects {role, transcript}
 * @param {String} jobTitle - Job title
 * @param {String} currentStage - Current stage (e.g. Introduction, Resume, Technical, Behavioral, Closing)
 * @returns {Object} JSON decision payload
 */
exports.routeConversation = async (transcript, jobTitle, currentStage) => {
  if (!transcript || !Array.isArray(transcript)) {
    throw new Error('Invalid transcript array');
  }

  const rawTranscript = transcript.map(msg => `${msg.role.toUpperCase()}: ${msg.transcript}`).join('\n');
  const safeTranscript = sanitizeText(rawTranscript, 15000); // 15k chars max for router
  
const prompt = `
You are the Stage Manager and Intelligence Router for an Enterprise AI Panel Interview.
The panel has two interviewers:
1. Sarah (HR): Handles Introduction, Behavioral Round, Culture Fit, Resume background, and Closing.
2. David (Technical): Handles Technical Round, System Design, DSA, Architecture, and deep coding questions.

Current Job Title: ${jobTitle || 'Software Engineer'}
Current Interview Stage: ${currentStage || 'Introduction'}

# AVAILABLE STAGES
- "Introduction" (Owned by Sarah)
- "Resume Deep Dive" (Owned by Sarah or David)
- "Technical Round" (Owned by David)
- "System Design" (Owned by David)
- "Behavioral Round" (Owned by Sarah)
- "Closing" (Owned by Sarah)

# RULES FOR ROUTING
1. KEEP THE SAME SPEAKER as long as possible to avoid reconnect latency. Do NOT transition speakers unless the current stage's objective is fully met.
2. If the candidate answers a technical question poorly, David should drill down. Only switch to Sarah if the technical round is entirely over.
3. If the candidate brings up a technical topic during Intro, transition to Technical Round (David).
4. Typical Flow: Introduction -> Resume Deep Dive -> Technical Round -> System Design -> Behavioral Round -> Closing.

# INTELLIGENCE ENGINE RULES
1. Evaluate candidate CONFIDENCE (0-100) based on transcript (uncertainty words, filler words, corrections, sentence completeness).
2. Assign a DIFFICULTY (Easy, Medium, Hard, Advanced, FAANG, Bar Raiser). Upgrade if confidence and technical accuracy are high. Downgrade if struggling.
3. Suggest 1-2 FOLLOW-UP topics to add to the queue based on the candidate's last answer (e.g. they mentioned JWT, suggest "JWT Expiry").
4. Provide a RECRUITER OBSERVATION (1 brief sentence about their performance).
5. Extract COMPETENCY UPDATES based ONLY on the latest transcript turn. Valid competencies: technicalKnowledge, problemSolving, communication, confidence, systemDesign, leadership, ownership, debugging, codingQuality, learningAbility.
6. Track TOPIC COVERAGE. List topics that were solidly covered in this turn. List expected important topics that are still missing.

# CONVERSATION ORCHESTRATOR (Phase 2B)
You must act as a true human panel. Determine the next CONVERSATION ACTION.
- Actions: ASK_QUESTION, FOLLOW_UP, INTERRUPT, AGREE, DISAGREE, CLARIFY, HANDOVER, OBSERVE, SUMMARIZE, WAIT, NO_ACTION
- If candidate rambles/repeats -> INTERRUPT (interrupt: true)
- If one recruiter wants the other to speak -> HANDOVER (set handoverTarget)
- Generate a BACKCHANNEL response if a recruiter should acknowledge mid-thought (e.g., "Makes sense.", "I see.")
- Recommend a PAUSE (Short, Medium, Long) based on the candidate's pacing.

Review the transcript below and output ONLY a valid JSON object matching this exact schema:
{ 
  "currentStage": "The stage you evaluated",
  "stageComplete": true | false,
  "nextStage": "The next stage (if stageComplete is true) or same as currentStage",
  "speaker": "Sarah" | "David", 
  "topic": "Current main topic being discussed",
  "confidenceScore": 75,
  "difficulty": "Easy" | "Medium" | "Hard" | "Advanced" | "FAANG" | "Bar Raiser",
  "followUpQueue": ["topic1", "topic2"],
  "recruiterObservation": "Brief observation",
  "reason": "Brief justification for this routing decision",
  "competencyUpdates": {
    "technicalKnowledge": { "score": 78, "confidenceOfAssessment": 84, "evidence": "Explained React lifecycle correctly." }
  },
  "coveredTopics": ["React Hooks", "Context API"],
  "missingTopics": ["Performance Optimization", "Testing"],
  "conversationAction": "ASK_QUESTION",
  "handoverTarget": null,
  "interrupt": false,
  "backchannel": "I see.",
  "pauseRecommendation": "Short",
  "conversationReason": "Continuing natural flow."
}

<TRANSCRIPT>
${safeTranscript}
</TRANSCRIPT>
  `.trim();

  const groqKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4
  ].filter(Boolean);

  let result = {
    currentStage: currentStage || "Introduction",
    stageComplete: false,
    nextStage: currentStage || "Introduction",
    speaker: "Sarah",
    topic: "Introduction",
    confidenceScore: 50,
    difficulty: "Medium",
    followUpQueue: [],
    recruiterObservation: "Waiting for more data.",
    reason: "Fallback to Sarah",
    competencyUpdates: {},
    coveredTopics: [],
    missingTopics: [],
    conversationAction: "ASK_QUESTION",
    handoverTarget: null,
    interrupt: false,
    backchannel: null,
    pauseRecommendation: "Medium",
    conversationReason: "Fallback flow"
  };

  if (groqKeys.length > 0) {
    const key = groqKeys[Math.floor(Math.random() * groqKeys.length)];
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Fast model for routing
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (groqRes.ok) {
      const data = await groqRes.json();
      const content = data.choices[0]?.message?.content;
      try {
        const parsed = JSON.parse(content);
        if (parsed.speaker === "Sarah" || parsed.speaker === "David") {
           result = { ...result, ...parsed };
        }
      } catch (e) {
        console.error("Panel Router JSON parse error", e);
      }
    } else {
       console.error("Panel Router Groq error", await groqRes.text());
    }
  }

  return result;
};
