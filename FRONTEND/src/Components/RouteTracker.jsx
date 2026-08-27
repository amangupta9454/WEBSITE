import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    const isAdmin = localStorage.getItem('adminToken') !== null;
    if (!isAdmin) {
      const email = localStorage.getItem("userEmail") || 
                    localStorage.getItem("studentEmail") || 
                    (localStorage.getItem('interviewUserData') ? JSON.parse(localStorage.getItem('interviewUserData')).email : null) ||
                    (localStorage.getItem('studentData') ? JSON.parse(localStorage.getItem('studentData')).email : null);

      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/audit-logs/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'PAGE_VISIT', 
          details: { 
            userEmail: email,
            path: location.pathname + location.search 
          } 
        })
      }).catch(err => console.error("Tracking error", err));
    }
  }, [location.pathname, location.search]);

  return null;
}
