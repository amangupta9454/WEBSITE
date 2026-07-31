import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const ReferralTracker = () => {
  const location = useLocation();

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const ref = searchParams.get("ref") || searchParams.get("referralCode");

      if (ref) {
        const cleanRef = ref.trim().toUpperCase();
        localStorage.setItem("referralCode", cleanRef);

        // Ping backend to track click count
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        axios.post(`${apiUrl}/api/admin/referrals/track-click`, { code: cleanRef }).catch(() => {
          // Ignore click tracking error silently
        });
      }
    } catch (e) {
      console.error("Error tracking referral link:", e);
    }
  }, [location]);

  return null;
};

export default ReferralTracker;
