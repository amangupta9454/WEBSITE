import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const ReferralTracker = () => {
  const location = useLocation();

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const ref = searchParams.get("ref") || searchParams.get("referralCode") || searchParams.get("referredByCode");

      if (ref) {
        const cleanRef = ref.trim().toUpperCase();
        localStorage.setItem("referralCode", cleanRef);
        localStorage.setItem("referredByCode", cleanRef);
        sessionStorage.setItem("referralCode", cleanRef);

        // Infer feature target from path
        const path = location.pathname.toLowerCase();
        let featureTarget = "Account Registered";
        if (path.includes("resume")) {
          featureTarget = "AI Resume Created";
        } else if (path.includes("interview")) {
          featureTarget = "AI Mock Interview Joined";
        } else if (path.includes("job")) {
          featureTarget = "Job Portal Applied";
        } else if (path.includes("registration")) {
          featureTarget = "Internship Application";
        }

        sessionStorage.setItem("referredFeatureTarget", featureTarget);
        if (!path.includes("login") && !path.includes("dashboard")) {
          sessionStorage.setItem("redirectAfterLogin", location.pathname + location.search);
        }

        const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
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
