/**
 * Centralized Role-Based Access Control (RBAC) & Module Permission Engine
 * Future-proof architecture: Adding roles or modules requires ONLY updating this metadata registry.
 * No hardcoded conditional role checks should be embedded directly in UI navigation or card components.
 */

export const ROLES = {
  STUDENT: 'student',
  INTERN: 'intern',
  CAMPUS_AMBASSADOR: 'campus_ambassador',
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
  MENTOR: 'mentor',
  JUDGE: 'judge',
  HR: 'hr',
  TRAINER: 'trainer',
  EMPLOYER: 'employer'
};

export const MODULE_REGISTRY = {
  my_dashboard: {
    id: 'my_dashboard',
    title: 'My Dashboard',
    requiredRoles: ['student', 'intern', 'campus_ambassador', 'admin', 'recruiter', 'mentor', 'judge', 'hr', 'trainer', 'employer'],
  },
  intern_dashboard: {
    id: 'intern_dashboard',
    title: 'Intern Dashboard',
    requiredRoles: ['intern', 'admin'],
  },
  campus_ambassador: {
    id: 'campus_ambassador',
    title: 'Campus Ambassador',
    requiredRoles: ['campus_ambassador', 'admin'],
  },
  assessment: {
    id: 'assessment',
    title: 'Assessment Engine',
    requiredRoles: ['student', 'intern', 'campus_ambassador', 'admin'],
  },
  mock_interviews: {
    id: 'mock_interviews',
    title: 'Mock AI Interviews',
    requiredRoles: ['student', 'intern', 'admin'],
  },
  ai_resume: {
    id: 'ai_resume',
    title: 'AI Resume Analyzer',
    requiredRoles: ['student', 'intern', 'admin'],
  },
  project_sandbox: {
    id: 'project_sandbox',
    title: 'Project Sandbox',
    requiredRoles: ['intern', 'admin'],
  },
  certifications: {
    id: 'certifications',
    title: 'Certifications',
    requiredRoles: ['student', 'intern', 'campus_ambassador', 'admin'],
  }
};

/**
 * Evaluates if a set of user roles has permission to access a module in the registry.
 * Admin role implicitly possesses permissions across all standard candidate modules.
 */
export const hasPermission = (userRoles = [], moduleId) => {
  if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
    return false;
  }
  if (userRoles.includes('admin')) {
    return true;
  }
  const moduleConfig = MODULE_REGISTRY[moduleId];
  if (!moduleConfig || !moduleConfig.requiredRoles) {
    return true; // Default allow if unregistered utility module
  }
  return moduleConfig.requiredRoles.some(role => userRoles.includes(role));
};

/**
 * Retrieves dynamic user roles from local authentication storage and cached schemas.
 * Guarantees consistent role serialization across the entire UI application.
 */
export const getUserRolesFromStorage = () => {
  const roleSet = new Set();
  
  if (localStorage.getItem('adminToken') && !localStorage.getItem('studentToken')) {
    roleSet.add('admin');
  }
  if (localStorage.getItem('studentToken') || localStorage.getItem('interviewToken')) {
    roleSet.add('student');
  }

  const tryParseUser = (key) => {
    try {
      const item = localStorage.getItem(key);
      if (item && item !== 'undefined') return JSON.parse(item);
    } catch (e) {
      return null;
    }
    return null;
  };

  const user = tryParseUser('studentData') || tryParseUser('interviewUser') || tryParseUser('adminData');

  if (user && Array.isArray(user.roles)) {
    user.roles.forEach(r => roleSet.add(r));
  }

  if (user && user.isAmbassador === true) {
    roleSet.add('campus_ambassador');
  }

  if (localStorage.getItem('interviewUserRole') === 'intern' || (user && user.role === 'intern')) {
    roleSet.add('intern');
  }

  // Fallback default
  if (roleSet.size === 0) {
    roleSet.add('student');
  }

  return Array.from(roleSet);
};
