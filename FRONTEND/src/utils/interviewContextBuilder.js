/**
 * Universal Interview Context Engine
 * ====================================
 * Single source of truth for all AI interviewer system prompts.
 * Supports Standard Interview, Panel Interview, and all future interview modes.
 *
 * Usage:
 *   import { buildInterviewContext } from '../utils/interviewContextBuilder';
 *   const { systemPrompt } = buildInterviewContext({ mode, interviewer, candidate, liveState });
 *
 * Architecture: SOLID / DRY / Separation of Concerns.
 * No hook, component, or service should construct its own system prompt.
 */

// ---------------------------------------------------------------------------
// Interviewer Persona Registry
// Add future interviewers here without changing any hook or component.
// ---------------------------------------------------------------------------
const INTERVIEWER_PERSONAS = {
  standard: {
    name: 'AI Interviewer',
    role: 'Principal AI Architect, Senior Staff Engineer, and Hiring Committee Advisor',
    persona: 'You are a Principal AI Architect, Senior Staff Engineer, and Hiring Committee Advisor at a top-tier tech company. Speak exactly like a calm, human senior engineering manager. Never sound robotic, overly enthusiastic, or scripted.',
    focus: 'Full-spectrum technical and behavioral interview.',
    voiceId: 'nova',
    conversationRules: `# CONVERSATION RULES
1. ONE QUESTION LIMIT: Ask exactly ONE question at a time. Never combine multiple questions. Wait for the answer before continuing.
2. MAX LENGTH: 2-3 short sentences. NEVER read long lectures.
3. NATURAL REFERENCES: Use phrases like "You previously explained...", "Earlier you mentioned...".
4. UNCERTAINTY: If the transcript is broken, say "Could you repeat that?". Never guess. Ignore filler words.
5. RESUME RULE: You have the candidate's resume. Reference their actual projects and claimed skills directly. Never say "I don't have access to your resume."

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
6. ORCHESTRATOR RULE: Execute the orchestration action exactly as instructed.`,
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

  // Future interviewers — add here, no frontend code changes needed
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
};

// ---------------------------------------------------------------------------
// STATIC CONTEXT BLOCK (built once per session)
// Contains candidate info, resume, job description.
// Expensive to rebuild — cache the result if interviewData doesn't change.
// ---------------------------------------------------------------------------
function buildStaticContextBlock(candidate) {
  const resume = candidate.resumeText || candidate.resume || '';
  const parsedResume = candidate.parsedResume || null;
  const jobDescription = candidate.jobDescription || '';

  let block = '';

  // Job / Role context
  block += `\n# INTERVIEW CONTEXT\n`;
  block += `Target Role: ${candidate.jobTitle || 'Software Engineer'}\n`;
  block += `Candidate Experience: ${candidate.experienceYears || 'Not specified'}\n`;
  if (candidate.durationMinutes) {
    block += `Interview Duration: ${candidate.durationMinutes} minutes\n`;
  }

  // Job Description
  if (jobDescription) {
    block += `\n# JOB DESCRIPTION\n${jobDescription.substring(0, 1500)}\n`;
  }

  // Resume (raw text)
  if (resume) {
    block += `\n# CANDIDATE RESUME\n${resume.substring(0, 3000)}\n`;
  }

  // Parsed resume sections (if available from backend parsing)
  if (parsedResume) {
    if (parsedResume.skills && parsedResume.skills.length > 0) {
      block += `\n# PARSED CANDIDATE SKILLS\n${parsedResume.skills.join(', ')}\n`;
    }
    if (parsedResume.projects && parsedResume.projects.length > 0) {
      block += `\n# PARSED CANDIDATE PROJECTS\n${parsedResume.projects.map(p => `- ${p}`).join('\n')}\n`;
    }
    if (parsedResume.experience && parsedResume.experience.length > 0) {
      block += `\n# PARSED WORK EXPERIENCE\n${parsedResume.experience.map(e => `- ${e}`).join('\n')}\n`;
    }
    if (parsedResume.education && parsedResume.education.length > 0) {
      block += `\n# PARSED EDUCATION\n${parsedResume.education.map(e => `- ${e}`).join('\n')}\n`;
    }
    if (parsedResume.certifications && parsedResume.certifications.length > 0) {
      block += `\n# CERTIFICATIONS\n${parsedResume.certifications.join(', ')}\n`;
    }
    if (parsedResume.achievements && parsedResume.achievements.length > 0) {
      block += `\n# ACHIEVEMENTS\n${parsedResume.achievements.map(a => `- ${a}`).join('\n')}\n`;
    }
  }

  return block.trim();
}

// ---------------------------------------------------------------------------
// DYNAMIC CONTEXT BLOCK (rebuilt each call)
// Contains live recruiter memory, stage, difficulty, confidence, follow-ups.
// ---------------------------------------------------------------------------
function buildDynamicContextBlock(liveState) {
  const mem = liveState.recruiterMemory || {};
  const compProfile = mem.competencyProfile || {};

  const competencySnapshot = Object.keys(compProfile)
    .filter(k => compProfile[k].score !== null)
    .map(k => `${k}: ${compProfile[k].score}/100`)
    .join(', ') || 'No data yet';

  const missingTopics = (mem.missingTopics || []).join(', ') || 'None identified';
  const coveredTopics = (mem.coveredTopics || []).join(', ') || 'None yet';
  const pendingFollowUps = (mem.followUpQueue || []).slice(0, 2).join(', ') || 'None yet';
  const orchestration = mem.orchestration || {};

  // Standard memory (used by standard interview)
  const standardMemory = `
# RECRUITER MEMORY (Current State)
Verified Skills: ${(mem.verifiedSkills || []).join(', ') || 'None yet'}
Weak Skills: ${(mem.weakSkills || []).join(', ') || 'None yet'}
Missing Skills: ${(mem.missingSkills || []).join(', ') || 'None yet'}
Unverified Claims: ${(mem.unverifiedClaims || []).join(', ') || 'None yet'}
Already Asked Questions: ${(mem.questionHistory || []).join(' | ') || 'None yet'}
Contradictions: ${(mem.contradictions || []).join(', ') || 'None yet'}`.trim();

  // Panel memory (richer — used by Sarah and David)
  const panelMemory = `
# RECRUITER MEMORY (Live State)
Verified Skills: ${(mem.verifiedSkills || []).join(', ') || 'None yet'}
Discussed Topics: ${(mem.discussedTopics || []).join(', ') || 'None yet'}
Already Asked Questions: ${(mem.questionHistory || []).join(' | ') || 'None yet'}
Pending Follow-ups: ${pendingFollowUps}

# CANDIDATE COMPETENCY SNAPSHOT
${competencySnapshot}

# TOPIC COVERAGE
Already Covered: ${coveredTopics}
Still Missing: ${missingTopics}`.trim();

  return { standardMemory, panelMemory, orchestration, pendingFollowUps };
}

// ---------------------------------------------------------------------------
// INTERVIEWER CONTEXT BLOCK (mode-specific directives)
// ---------------------------------------------------------------------------
function buildInterviewerContextBlock(interviewerName, liveState) {
  const persona = INTERVIEWER_PERSONAS[interviewerName] || INTERVIEWER_PERSONAS.standard;
  const difficulty = liveState.currentDifficulty || 'Medium';
  const confidence = liveState.currentConfidence || 50;
  const mood = liveState.interviewerMood || 'Professional';
  const stage = liveState.currentStage || 'Introduction';

  let block = '';

  if (interviewerName !== 'standard') {
    // Panel-mode directives
    block += `\n# INTELLIGENCE ENGINE DIRECTIVES\n`;
    block += `Current Difficulty Level: ${difficulty}\n`;
    block += `Candidate Confidence Score (0-100): ${confidence}\n`;
    block += `Your Mandatory Mood: ${mood}\n`;
    block += `Current Interview Stage: ${stage}\n`;
  }

  return block.trim();
}

// ---------------------------------------------------------------------------
// ORCHESTRATOR BLOCK (Panel Interview only)
// ---------------------------------------------------------------------------
function buildOrchestratorBlock(orchestration) {
  if (!orchestration) return '';
  const { action, handoverTarget, interrupt, backchannel, pauseRecommendation } = orchestration;

  let rule = `Action: ${action || 'ASK_QUESTION'}. `;
  if (interrupt) rule += `Start your sentence by politely interrupting ("Sorry to interrupt, but..."). `;
  if (backchannel) rule += `Start with: '${backchannel}'. `;
  if (action === 'HANDOVER' && handoverTarget) rule += `Explicitly hand over to ${handoverTarget}. `;
  if (action === 'AGREE') rule += `Start by explicitly agreeing with the previous point. `;
  if (action === 'CLARIFY') rule += `Ask the candidate to clarify their last statement. `;

  return `\n# CONVERSATION ORCHESTRATOR\n${rule}\nPacing Recommendation: ${pauseRecommendation || 'Medium'}`.trim();
}

// ---------------------------------------------------------------------------
// MAIN EXPORT: buildInterviewContext
// ---------------------------------------------------------------------------
/**
 * @param {Object} config
 * @param {'standard'|'panel'} config.mode - Interview mode
 * @param {string} config.interviewerName - 'standard', 'Sarah', 'David', 'HiringManager', 'BarRaiser'
 * @param {Object} config.candidate - interviewData from session (static fields)
 * @param {Object} config.liveState - Live recruiter memory, stage, difficulty, confidence
 * @returns {{ systemPrompt: string, persona: Object }}
 */
export function buildInterviewContext({ mode = 'standard', interviewerName = 'standard', candidate = {}, liveState = {} }) {
  const persona = INTERVIEWER_PERSONAS[interviewerName] || INTERVIEWER_PERSONAS.standard;

  const staticBlock = buildStaticContextBlock(candidate);
  const { standardMemory, panelMemory, orchestration } = buildDynamicContextBlock(liveState);
  const interviewerDirectives = buildInterviewerContextBlock(interviewerName, liveState);
  const orchestratorBlock = mode === 'panel' ? buildOrchestratorBlock(orchestration) : '';

  const memoryBlock = mode === 'panel' ? panelMemory : standardMemory;

  const systemPrompt = `# PERSONA
You are ${persona.name} — ${persona.role}.
${persona.persona}
Focus Area: ${persona.focus}

${staticBlock}

${memoryBlock}

${interviewerDirectives}

${orchestratorBlock}

${persona.conversationRules}
`.replace(/\n{3,}/g, '\n\n').trim();

  return { systemPrompt, persona };
}

// Re-export personas registry for any consumer that needs it (e.g., UI rendering)
export { INTERVIEWER_PERSONAS };
