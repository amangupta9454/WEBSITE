/**
 * Clears ALL user-related data from localStorage and sessionStorage.
 * Call this on every logout, regardless of user type.
 */
export const clearAllUserData = () => {
  // ── localStorage keys ──────────────────────────────────────────────────────
  const localKeys = [
    'studentToken',
    'studentData',
    'interviewToken',
    'interviewUser',
    'interviewUserRole',
    'adminToken',
    'adminData',
  ];
  localKeys.forEach(key => localStorage.removeItem(key));

  // ── sessionStorage keys (banners, caches, temp data) ──────────────────────
  sessionStorage.clear();
};
