/**
 * Universal Interview Context Engine v2
 * ========================================
 * Single source of truth for the entire AI Interview Platform.
 *
 * ARCHITECTURE (v2):
 *   1. buildInterviewContextObject() → Structured InterviewContext (pure data, no strings)
 *   2. buildSystemPrompt()           → Converts InterviewContext + Persona → system prompt string
 *   3. buildInterviewContext()       → Convenience wrapper (backward compatible, used by hooks)
 *
 * Every interview module (Standard, Panel, Router, Evaluation, Reports, Hiring Committee)
 * should consume the structured InterviewContext object.
 * Only Vapi-specific callers need the final systemPrompt string.
 *
 * Adding a new interviewer: Add an entry to INTERVIEWER_PERSONAS. Zero other changes required.
 * Adding a company mode:    Add an entry to COMPANY_INTERVIEW_MODES. Zero other changes required.
 */

// ---------------------------------------------------------------------------
// INTERVIEWER PERSONA REGISTRY
// Single place to define any current or future AI interviewer.
// ---------------------------------------------------------------------------
export const INTERVIEWER_PERSONAS = {
  standard: {
    name: 'AI Interviewer',
    role: 'Principal AI Architect, Senior Staff Engineer, and Hiring Committee Advisor',
    persona: 'You are a Principal AI Architect, Senior Staff Engineer, and Hiring Committee Advisor at a top-tier tech company. Speak exactly like a calm, human senior engineering manager. Never sound robotic, overly enthusiastic, or scripted.',
    focus: 'Full-spectrum technical and behavioral interview.',
    voiceId: 'nova',
    conversationRules: `# CONVERSATION RULES
1. ONE QUESTION LIMIT: Ask exactly ONE question at a time. Wait for the answer before continuing.
2. MAX LENGTH: 2-3 short sentences. NEVER read long lectures.
3. NATURAL REFERENCES: Use phrases like "You previously explained...", "Earlier you mentioned...".
4. UNCERTAINTY: If transcript is broken, say "Could you repeat that?". Ignore filler words.
5. RESUME RULE: You have the candidate's resume. Reference their actual projects and claimed skills. Never say "I don't have access to your resume."

# REASONING ENGINE
1. LIVE RECRUITER MEMORY: Track skills (Verified/Missing/Weak), Unverified Claims, Contradictions.
2. CONTINUOUS REASONING: Before every response, ask: What is the highest information-gain question I can ask next?
3. QUESTION PRIORITIZATION: 1. Unverified resume claims → 2. JD critical skills → 3. Weak skills → 4. Contradictions → 5. System Design → 6. Behavior.
4. ADAPTIVE DIFFICULTY: Escalate if candidate answers perfectly. Step down if they struggle.
5. CONTRADICTION ENGINE: Politely flag contradictions ("Earlier you mentioned...").
6. FOLLOW-UP ENGINE: Ask targeted follow-ups, not generic ones.

# INTERVIEW FLOW
Introduction → Resume/Project Deep Dive → Technical JD Coverage → System Design/Architecture → Behavioral (Ownership/Leadership) → Closing.

Never hallucinate technologies. Do not invent candidate experience. Maximize signal extraction.`,
  },

  Sarah: {
    name: 'Sarah',
    role: 'HR / Behavioral Interviewer',
    persona: 'You are Sarah, an experienced HR Business Partner on a FAANG Hiring Panel. You are warm, professional, and deeply insightful. You evaluate culture fit, behavioral competencies, communication, and leadership signals.',
    focus: 'Introduction, Behavioral Round, Culture Fit, Resume background, and Closing.',
    voiceId: 'nova',
    conversationRules: `# CONVERSATION RULES
1. Ask exactly ONE question at a time. Keep it brief (2-3 sentences).
2. Drive the conversation according to the Current Stage.
3. MEMORY RULE: Naturally reference "Discussed Topics" or "Pending Follow-ups" if appropriate.
4. RESUME RULE: You have the candidate's resume. Reference their actual projects, roles, and achievements. Never say "I don't have access to your resume."
5. BEHAVIOR RULE: You MUST adopt the "Mandatory Mood" specified in your directives.
6. ORCHESTRATOR RULE: Execute the orchestration action exactly as instructed.
7. INTRODUCTION RULE: If this is the beginning of the interview, introduce yourself and David. NEVER re-introduce yourself when David hands the conversation back to you.`,
  },

  David: {
    name: 'David',
    role: 'Technical Lead / System Architect',
    persona: 'You are David, a Technical Lead and System Architect on a FAANG Hiring Panel. You are direct, technically rigorous, and analytically sharp. You probe for depth, not breadth.',
    focus: 'Technical Round, System Design, DSA, Architecture, and deep coding questions.',
    voiceId: 'onyx',
    conversationRules: `# CONVERSATION RULES
1. Ask exactly ONE technical question at a time. Keep it focused and precise.
2. Drive the conversation according to the Current Stage.
3. RESUME RULE: You have the candidate's resume. Probe their actual claimed projects and technologies. Ask about real implementation choices they made. Never say "I don't have access to your resume."
4. DEPTH RULE: If a candidate's answer is shallow, drill deeper. Never accept vague answers on technical topics.
5. ADAPTIVE RULE: Adjust your technical depth to match the "Current Difficulty Level".
6. BEHAVIOR RULE: You MUST adopt the "Mandatory Mood" specified in your directives.
7. ORCHESTRATOR RULE: Execute the orchestration action exactly as instructed.`,
  },

  HiringManager: {
    name: 'Alex',
    role: 'Hiring Manager',
    persona: 'You are Alex, the Hiring Manager. You focus on team fit, cross-functional collaboration, leadership potential, and whether the candidate can deliver impact at scale.',
    focus: 'Leadership, ownership, impact, team dynamics, strategic thinking.',
    voiceId: 'alloy',
    conversationRules: `# CONVERSATION RULES
1. Ask exactly ONE question at a time about leadership, ownership, or impact.
2. Reference resume projects to ask about business impact and decisions made.
3. RESUME RULE: Reference the candidate's real work history and achievements. Never say "I don't have access to your resume."`,
  },

  BarRaiser: {
    name: 'Jordan',
    role: 'Bar Raiser',
    persona: 'You are Jordan, an independent Bar Raiser. You are the hardest interviewer in the panel. You probe for exceptional signal, look for red flags, and evaluate whether this candidate raises the overall bar.',
    focus: 'Exceptional technical depth, system design, ambiguity handling, intellectual honesty.',
    voiceId: 'echo',
    conversationRules: `# CONVERSATION RULES
1. Ask exactly ONE challenging question at a time.
2. Probe for edge cases, failure modes, and trade-offs.
3. RESUME RULE: Reference the candidate's actual projects and challenge their technical claims. Never say "I don't have access to your resume."`,
  },

  EngineeringManager: {
    name: 'Morgan',
    role: 'Engineering Manager',
    persona: 'You are Morgan, an Engineering Manager. You evaluate engineering judgment, mentorship instincts, delivery track record, and the ability to influence technical decisions without authority.',
    focus: 'Engineering leadership, delivery, technical influence, cross-team collaboration.',
    voiceId: 'shimmer',
    conversationRules: `# CONVERSATION RULES
1. Ask exactly ONE question at a time about engineering leadership or delivery.
2. Ask the candidate to describe situations where they influenced technical decisions.
3. RESUME RULE: Reference the candidate's actual projects and ask about team dynamics and delivery outcomes. Never say "I don't have access to your resume."`,
  },
};

// ---------------------------------------------------------------------------
// COMPANY INTERVIEW MODE REGISTRY
// Each company may override rules while consuming the same context object.
// ---------------------------------------------------------------------------
export const COMPANY_INTERVIEW_MODES = {
  default: { name: 'Default', additionalRules: '' },
  Google: { name: 'Google', additionalRules: 'Focus on algorithmic thinking, code quality, scalability. Use Googleyness signals (collaborative, humble, outcome-driven). Ask about large-scale distributed systems.' },
  Amazon: { name: 'Amazon', additionalRules: 'Evaluate all answers against Amazon Leadership Principles. Ask behavioral questions (STAR format). Probe for ownership, bias for action, and customer obsession.' },
  Microsoft: { name: 'Microsoft', additionalRules: 'Focus on growth mindset, collaboration, and cross-functional impact. Probe for clarity of thought and design decisions in Azure/Cloud scenarios.' },
  Meta: { name: 'Meta', additionalRules: 'Focus on impact at scale, product sense, and move fast mindset. Ask about A/B testing, data-driven decisions, and social graph problems.' },
  Netflix: { name: 'Netflix', additionalRules: 'Focus on context over control, freedom and responsibility. Probe for high performance culture fit, independent decision-making, and streaming/content delivery expertise.' },
};

// ---------------------------------------------------------------------------
// LAYER 1: buildInterviewContextObject()
// Returns a STRUCTURED object — the single source of truth for all modules.
// Pure data. No strings. No prompt logic.
// ---------------------------------------------------------------------------
/**
 * @param {Object} candidate - Static candidate data from interviewData
 * @param {Object} liveState - Live interview state (memory, stage, etc.)
 * @returns {InterviewContextObject} - Structured object consumed by all modules
 */
export function buildInterviewContextObject(candidate = {}, liveState = {}) {
  const mem = liveState.recruiterMemory || {};
  const compProfile = mem.competencyProfile || {};

  return {
    // --- Candidate Information ---
    candidate: {
      resumeText: (candidate.resumeText || candidate.resume || '').substring(0, 3000),
      parsedResume: candidate.parsedResume || null,
      projects: candidate.parsedResume?.projects || [],
      skills: candidate.parsedResume?.skills || (mem.verifiedSkills || []),
      education: candidate.parsedResume?.education || [],
      experience: candidate.parsedResume?.experience || [],
      certifications: candidate.parsedResume?.certifications || [],
      achievements: candidate.parsedResume?.achievements || [],
    },

    // --- Job Information ---
    job: {
      title: candidate.jobTitle || 'Software Engineer',
      description: (candidate.jobDescription || '').substring(0, 1500),
      experienceLevel: candidate.experienceYears || 'Not specified',
      durationMinutes: candidate.durationMinutes || null,
      language: candidate.language || 'en-IN',
      company: candidate.company || null,
    },

    // --- Interview State ---
    interview: {
      mode: liveState.mode || 'standard',
      stage: liveState.currentStage || 'Introduction',
      difficulty: liveState.currentDifficulty || 'Medium',
      confidence: liveState.currentConfidence || 50,
      interviewerMood: liveState.interviewerMood || 'Professional',
      activeSpeaker: liveState.activeSpeaker || null,
      companyMode: liveState.companyMode || 'default',
    },

    // --- Recruiter Memory (Live State) ---
    recruiterMemory: {
      verifiedSkills: mem.verifiedSkills || [],
      weakSkills: mem.weakSkills || [],
      missingSkills: mem.missingSkills || [],
      strongSkills: (mem.verifiedSkills || []).filter(s =>
        mem.evidenceGraph?.some(e => e.skill === s && e.confidence >= 0.8)
      ),
      discussedTopics: mem.discussedTopics || [],
      followUpQueue: (mem.followUpQueue || []).slice(0, 5),
      evidenceGraph: mem.evidenceGraph || [],
      observations: mem.observations || [],
      contradictions: mem.contradictions || [],
      questionHistory: mem.questionHistory || [],
      unverifiedClaims: mem.unverifiedClaims || [],
      coveredTopics: mem.coveredTopics || [],
      missingTopics: mem.missingTopics || [],
      competencyProfile: compProfile,
      competencySnapshot: Object.keys(compProfile)
        .filter(k => compProfile[k]?.score !== null && compProfile[k]?.score !== undefined)
        .map(k => `${k}: ${compProfile[k].score}/100`)
        .join(', ') || 'No data yet',
    },

    // --- Orchestration ---
    orchestration: mem.orchestration || {
      action: 'ASK_QUESTION',
      handoverTarget: null,
      interrupt: false,
      backchannel: null,
      pauseRecommendation: 'Medium',
      reason: '',
    },
  };
}

// ---------------------------------------------------------------------------
// LAYER 2: buildSystemPrompt()
// Converts InterviewContextObject + Persona → final system prompt string.
// This is the ONLY layer that creates strings/text.
// ---------------------------------------------------------------------------
/**
 * @param {InterviewContextObject} ctx - Output of buildInterviewContextObject()
 * @param {string} interviewerName - Key into INTERVIEWER_PERSONAS
 * @param {'standard'|'panel'} mode - Prompt mode
 * @returns {string} systemPrompt
 */
export function buildSystemPrompt(ctx, interviewerName = 'standard', mode = 'standard') {
  const persona = INTERVIEWER_PERSONAS[interviewerName] || INTERVIEWER_PERSONAS.standard;
  const company = COMPANY_INTERVIEW_MODES[ctx.interview.companyMode] || COMPANY_INTERVIEW_MODES.default;

  // --- PERSONA BLOCK ---
  const personaBlock = `# PERSONA
You are ${persona.name} — ${persona.role}.
${persona.persona}
Focus Area: ${persona.focus}`;

  // --- CANDIDATE & JOB BLOCK ---
  let candidateBlock = `\n# INTERVIEW CONTEXT
Target Role: ${ctx.job.title}
Candidate Experience: ${ctx.job.experienceLevel}${ctx.job.durationMinutes ? `\nInterview Duration: ${ctx.job.durationMinutes} minutes` : ''}`;

  if (ctx.job.description) {
    candidateBlock += `\n\n# JOB DESCRIPTION\n${ctx.job.description}`;
  }

  if (ctx.candidate.resumeText) {
    candidateBlock += `\n\n# CANDIDATE RESUME\n${ctx.candidate.resumeText}`;
  }

  if (ctx.candidate.skills.length > 0) {
    candidateBlock += `\n\n# CANDIDATE SKILLS\n${ctx.candidate.skills.join(', ')}`;
  }

  if (ctx.candidate.projects.length > 0) {
    candidateBlock += `\n\n# CANDIDATE PROJECTS\n${ctx.candidate.projects.map(p => `- ${p}`).join('\n')}`;
  }

  if (ctx.candidate.experience.length > 0) {
    candidateBlock += `\n\n# WORK EXPERIENCE\n${ctx.candidate.experience.map(e => `- ${e}`).join('\n')}`;
  }

  if (ctx.candidate.education.length > 0) {
    candidateBlock += `\n\n# EDUCATION\n${ctx.candidate.education.map(e => `- ${e}`).join('\n')}`;
  }

  if (ctx.candidate.achievements.length > 0) {
    candidateBlock += `\n\n# ACHIEVEMENTS\n${ctx.candidate.achievements.map(a => `- ${a}`).join('\n')}`;
  }

  // --- RECRUITER MEMORY BLOCK ---
  const mem = ctx.recruiterMemory;
  let memoryBlock = '';

  if (mode === 'panel') {
    memoryBlock = `\n# RECRUITER MEMORY (Live State)
Verified Skills: ${mem.verifiedSkills.join(', ') || 'None yet'}
Discussed Topics: ${mem.discussedTopics.join(', ') || 'None yet'}
Already Asked Questions: ${mem.questionHistory.slice(-10).join(' | ') || 'None yet'}
Pending Follow-ups: ${mem.followUpQueue.slice(0, 2).join(', ') || 'None yet'}

# CANDIDATE COMPETENCY SNAPSHOT
${mem.competencySnapshot}

# TOPIC COVERAGE
Already Covered: ${mem.coveredTopics.join(', ') || 'None yet'}
Still Missing: ${mem.missingTopics.join(', ') || 'None identified'}`;
  } else {
    memoryBlock = `\n# RECRUITER MEMORY (Current State)
Verified Skills: ${mem.verifiedSkills.join(', ') || 'None yet'}
Weak Skills: ${mem.weakSkills.join(', ') || 'None yet'}
Missing Skills: ${mem.missingSkills.join(', ') || 'None yet'}
Unverified Claims: ${mem.unverifiedClaims.join(', ') || 'None yet'}
Already Asked Questions: ${mem.questionHistory.slice(-10).join(' | ') || 'None yet'}
Contradictions: ${mem.contradictions.join(', ') || 'None yet'}`;
  }

  // --- INTELLIGENCE ENGINE DIRECTIVES (Panel only) ---
  let directivesBlock = '';
  if (mode === 'panel') {
    directivesBlock = `\n# INTELLIGENCE ENGINE DIRECTIVES
Current Difficulty Level: ${ctx.interview.difficulty}
Candidate Confidence Score (0-100): ${ctx.interview.confidence}
Your Mandatory Mood: ${ctx.interview.interviewerMood}
Current Interview Stage: ${ctx.interview.stage}`;
  }

  // --- ORCHESTRATOR BLOCK (Panel only) ---
  let orchestratorBlock = '';
  if (mode === 'panel') {
    const orch = ctx.orchestration;
    let orchRule = `Action: ${orch.action || 'ASK_QUESTION'}. `;
    if (orch.interrupt) orchRule += `Start your sentence by politely interrupting ("Sorry to interrupt, but..."). `;
    if (orch.backchannel) orchRule += `Start with: '${orch.backchannel}'. `;
    if (orch.action === 'HANDOVER' && orch.handoverTarget) orchRule += `Explicitly hand over to ${orch.handoverTarget}. `;
    if (orch.action === 'AGREE') orchRule += `Start by explicitly agreeing with the previous point. `;
    if (orch.action === 'CLARIFY') orchRule += `Ask the candidate to clarify their last statement. `;
    orchestratorBlock = `\n# CONVERSATION ORCHESTRATOR\n${orchRule}\nPacing Recommendation: ${orch.pauseRecommendation || 'Medium'}`;
  }

  // --- COMPANY MODE RULES ---
  let companyBlock = '';
  if (company.additionalRules) {
    companyBlock = `\n# COMPANY INTERVIEW MODE: ${company.name}\n${company.additionalRules}`;
  }

  // --- ASSEMBLE ---
  const systemPrompt = [
    personaBlock,
    candidateBlock,
    memoryBlock,
    directivesBlock,
    orchestratorBlock,
    companyBlock,
    `\n${persona.conversationRules}`,
  ]
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return systemPrompt;
}

// ---------------------------------------------------------------------------
// LAYER 3: buildInterviewContext()  ← BACKWARD COMPATIBLE CONVENIENCE WRAPPER
// Existing callers (useVapi.js, usePanelVapi.js) need no changes beyond v1.
// ---------------------------------------------------------------------------
/**
 * @param {Object} config
 * @param {'standard'|'panel'} config.mode
 * @param {string} config.interviewerName
 * @param {Object} config.candidate
 * @param {Object} config.liveState
 * @returns {{ systemPrompt: string, persona: Object, ctx: InterviewContextObject }}
 */
export function buildInterviewContext({ mode = 'standard', interviewerName = 'standard', candidate = {}, liveState = {} }) {
  const ctx = buildInterviewContextObject(candidate, { ...liveState, mode });
  const systemPrompt = buildSystemPrompt(ctx, interviewerName, mode);
  const persona = INTERVIEWER_PERSONAS[interviewerName] || INTERVIEWER_PERSONAS.standard;

  // Return ctx alongside systemPrompt so advanced callers (Router, Evaluation) can use structured data
  return { systemPrompt, persona, ctx };
}

// ---------------------------------------------------------------------------
// UTILITY: buildRouterContextSummary()
// Converts InterviewContextObject into a compact text block for Router enrichment.
// Used by triggerRouter() to send structured candidate context to Groq.
// ---------------------------------------------------------------------------
/**
 * @param {InterviewContextObject} ctx
 * @returns {string} Compact text summary for inclusion in Router prompt
 */
export function buildRouterContextSummary(ctx) {
  const mem = ctx.recruiterMemory;
  let summary = '';

  summary += `# CANDIDATE CONTEXT (Resume-Aware)\n`;
  summary += `Target Role: ${ctx.job.title} | Experience: ${ctx.job.experienceLevel}\n`;

  if (ctx.candidate.resumeText) {
    // Send a condensed first 800 chars of resume to Router (to keep Groq fast)
    summary += `Resume Summary: ${ctx.candidate.resumeText.substring(0, 800)}...\n`;
  }

  if (ctx.candidate.skills.length > 0) {
    summary += `Claimed Skills: ${ctx.candidate.skills.join(', ')}\n`;
  }

  if (ctx.candidate.projects.length > 0) {
    summary += `Projects: ${ctx.candidate.projects.slice(0, 3).join(', ')}\n`;
  }

  summary += `\n# LIVE INTERVIEW STATE\n`;
  summary += `Current Stage: ${ctx.interview.stage}\n`;
  summary += `Difficulty: ${ctx.interview.difficulty} | Confidence: ${ctx.interview.confidence}\n`;
  summary += `Verified Skills: ${mem.verifiedSkills.join(', ') || 'None yet'}\n`;
  summary += `Discussed Topics: ${mem.discussedTopics.join(', ') || 'None yet'}\n`;
  summary += `Missing Topics: ${mem.missingTopics.join(', ') || 'None identified'}\n`;
  summary += `Follow-ups Pending: ${mem.followUpQueue.slice(0, 2).join(', ') || 'None'}\n`;

  return summary.trim();
}
