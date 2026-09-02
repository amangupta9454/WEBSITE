/**
 * Enterprise Interview Layer - Mode Resolver
 * 
 * Determines whether the current interview session qualifies for advanced
 * Enterprise behaviours (Deep Dive, Cross-Questioning, Bar Raiser challenge styles).
 * 
 * @param {Object} ctx - The structured InterviewContextObject
 * @returns {Object} EnterpriseModePayload
 */
function resolveEnterpriseMode(ctx) {
  if (!ctx || !ctx.interview || !ctx.job || !ctx.recruiterMemory) {
    return { enabled: false, reason: 'Invalid context' };
  }

  const { interview, job, recruiterMemory, candidate } = ctx;

  // --- ACTIVATION CONDITIONS ---
  
  // 1. Duration >= 15 minutes
  const isLongDuration = job.durationMinutes && job.durationMinutes >= 15;
  
  // 2. Advanced Stage
  const advancedStages = ['System Design', 'Bar Raiser', 'Principal', 'Architecture', 'Hard'];
  const isAdvancedStage = advancedStages.includes(interview.stage);
  
  // 3. High Confidence
  const isHighConfidence = interview.confidence >= 85;
  
  // 4. Advanced Resume Projects
  const advancedKeywords = ['microservices', 'distributed', 'kubernetes', 'kafka', 'scale', 'architecture', 'system design'];
  const resumeText = (candidate.resumeText || '').toLowerCase();
  const hasAdvancedProjects = advancedKeywords.some(kw => resumeText.includes(kw));
  
  // 5. Strong Recruiter Memory Performance
  // Check if there are strong skills or highly rated competencies
  const hasStrongSkills = recruiterMemory.strongSkills && recruiterMemory.strongSkills.length >= 2;
  
  // Enterprise mode activates if ANY of these conditions are true
  const isEnabled = isLongDuration || isAdvancedStage || isHighConfidence || hasAdvancedProjects || hasStrongSkills;

  if (!isEnabled) {
    return {
      enabled: false,
      reason: 'Standard flow conditions met.',
      challengeLevel: 'Standard',
      deepDive: false,
      crossQuestioning: false,
      committeeMode: false,
      adaptiveDifficulty: false
    };
  }

  // --- DYNAMIC CHALLENGE STYLE ---
  let challengeLevel = 'Staff Engineer';
  if (interview.stage === 'System Design') challengeLevel = 'Architecture Reviewer';
  else if (interview.stage === 'Bar Raiser') challengeLevel = 'Bar Raiser';
  else if (hasAdvancedProjects && !isHighConfidence) challengeLevel = 'Security Reviewer';
  else if (isHighConfidence) challengeLevel = 'Principal Engineer';
  else challengeLevel = 'Socratic';

  let reason = [];
  if (isLongDuration) reason.push('Duration >= 15m');
  if (isAdvancedStage) reason.push(`Stage is ${interview.stage}`);
  if (isHighConfidence) reason.push('High Confidence');
  if (hasAdvancedProjects) reason.push('Advanced Projects Detected');
  if (hasStrongSkills) reason.push('Strong Technical Signals');

  return {
    enabled: true,
    reason: `Enterprise Mode activated due to: ${reason.join(', ')}`,
    challengeLevel,
    deepDive: true,           // Navigate the Project Deep Dive Graph
    crossQuestioning: true,   // David challenges Sarah's behavioral project questions
    committeeMode: true,      // Independent HR and Tech votes
    adaptiveDifficulty: true  // Dynamic difficulty escalation
  };
}

module.exports = { resolveEnterpriseMode };
