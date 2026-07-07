/**
 * Dynamic Interviewer Escalation Engine
 * 
 * Orchestrates panel growth by evaluating candidate performance in real-time
 * and deciding if a specialized interviewer should join.
 */

const MAX_INTERVIEWERS = 5;
const ESCALATION_THRESHOLD = 80;

/**
 * Evaluates whether to invite a new interviewer to the panel.
 * @param {Object} ctx - The structured InterviewContextObject
 * @param {Array<string>} activeInterviewers - Array of currently active interviewer names (e.g. ['Sarah', 'David'])
 * @returns {Object} Escalation Directive
 */
export function evaluateEscalation(ctx, activeInterviewers = []) {
  if (!ctx || !ctx.recruiterMemory) {
    return { escalate: false, reason: 'Invalid context' };
  }

  if (activeInterviewers.length >= MAX_INTERVIEWERS) {
    return { escalate: false, reason: 'Panel at maximum capacity' };
  }

  const { interview, recruiterMemory, candidate } = ctx;
  const { verifiedSkills = [], currentDifficulty = 'Medium', currentStage = 'Introduction' } = recruiterMemory;
  const duration = interview.durationMinutes || 0;

  // 1. Calculate Escalation Score
  let escalationScore = 0;

  // Depth & Difficulty (Base signals)
  if (currentDifficulty === 'Hard') escalationScore += 30;
  if (currentDifficulty === 'Bar Raiser') escalationScore += 50;

  // Confidence & Momentum
  if (interview.confidence >= 80) escalationScore += 20;
  if (interview.confidence >= 95) escalationScore += 35;

  // Verified Competencies
  escalationScore += (verifiedSkills.length * 10);

  // Time factor (avoid escalating in the first 5 minutes unless exceptional)
  if (duration < 5) escalationScore -= 30;
  if (duration > 15) escalationScore += 15;

  // Wait for technical rounds
  if (['Introduction', 'Resume Deep Dive'].includes(currentStage)) {
    escalationScore -= 20;
  }

  if (escalationScore < ESCALATION_THRESHOLD) {
    return { 
      escalate: false, 
      score: escalationScore,
      reason: `Escalation score ${escalationScore} is below threshold ${ESCALATION_THRESHOLD}`
    };
  }

  // 2. Select Specialized Interviewer
  // Map demonstrated strengths to a specific persona
  const resumeText = (candidate.resumeText || '').toLowerCase();
  let nextInterviewer = null;
  let inviteReason = '';

  const isVerified = (keyword) => verifiedSkills.some(s => s.toLowerCase().includes(keyword));
  const hasKeyword = (keyword) => resumeText.includes(keyword);

  if ((isVerified('system design') || isVerified('architecture') || hasKeyword('distributed')) && !activeInterviewers.includes('BarRaiser')) {
    nextInterviewer = 'BarRaiser';
    inviteReason = 'Candidate excels in Distributed Systems and Architecture';
  } else if ((isVerified('security') || hasKeyword('auth')) && !activeInterviewers.includes('SecurityArchitect')) {
    nextInterviewer = 'SecurityArchitect';
    inviteReason = 'Candidate demonstrates strong Security knowledge';
  } else if ((isVerified('leadership') || hasKeyword('led team')) && !activeInterviewers.includes('EngineeringManager')) {
    nextInterviewer = 'EngineeringManager';
    inviteReason = 'Candidate shows high Leadership potential';
  } else if ((isVerified('cloud') || hasKeyword('aws') || hasKeyword('kubernetes')) && !activeInterviewers.includes('CloudArchitect')) {
    nextInterviewer = 'CloudArchitect';
    inviteReason = 'Candidate has deep Cloud infrastructure expertise';
  } else if (!activeInterviewers.includes('PrincipalEngineer')) {
    nextInterviewer = 'PrincipalEngineer';
    inviteReason = 'Candidate demonstrates exceptional overall technical depth';
  }

  if (!nextInterviewer) {
    return { 
      escalate: false, 
      score: escalationScore,
      reason: 'No suitable specialized interviewer available to join'
    };
  }

  return {
    escalate: true,
    score: escalationScore,
    nextInterviewer,
    reason: inviteReason
  };
}
