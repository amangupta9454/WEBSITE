import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Briefcase, GraduationCap, Layers } from "lucide-react";
import axios from "axios";
import { hasPermission, getUserRolesFromStorage } from "../utils/permissionEngine";
import InterviewDashboard from "./InterviewPortal/InterviewDashboard";
import StudentDashboard from "../Components/StudentDashboard";
import AmbassadorTab from "../Components/AmbassadorTab";
import DashboardTopSection from "./InterviewPortal/components/DashboardTopSection";
import StudentExperiencePlatform from "./AssessmentPortal/StudentExperiencePlatform";

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [userRoles, setUserRoles] = useState(() => getUserRolesFromStorage());
  const [assessmentEnabled, setAssessmentEnabled] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isAssessmentRoute = location.pathname.startsWith("/dashboard/assessment");

  useEffect(() => {
    // Check if URL specifies initial tab (e.g. /dashboard?tab=internship)
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get("tab");
    if (initialTab && ["overview", "internship", "ambassador"].includes(initialTab)) {
      setActiveTab(initialTab);
    } else if (initialTab === "assessment") {
      navigate("/dashboard/assessment", { replace: true });
    }

    // Check General Settings master switch
    const settings = localStorage.getItem("CAN_ASSESSMENT_GENERAL_SETTINGS");
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setAssessmentEnabled(parsed.assessmentModuleEnabled !== false);
      } catch (e) {
        setAssessmentEnabled(true);
      }
    }

    // Dynamic RBAC Role verification
    const verifyRoles = async () => {
      let roles = getUserRolesFromStorage();
      const token = localStorage.getItem("studentToken") || localStorage.getItem("adminToken");
      if (token && !roles.includes('admin')) {
        try {
          const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
          const res = await axios.get(`${apiUrl}/api/student/ambassador-stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success && !roles.includes("campus_ambassador")) {
            roles = [...roles, "campus_ambassador"];
          }
        } catch (e) {
          // Ignore API verification fallback
        }
      }
      setUserRoles(roles);
    };
    verifyRoles();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 sm:pt-28 pb-16 px-4 max-w-7xl mx-auto relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none rounded-b-[3rem]"></div>
      <div className="absolute top-20 right-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute top-40 left-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="relative z-50 w-full max-w-6xl mx-auto mb-3 sm:mb-6">
        {/* Top Header Section (Welcome and Profile/Wallet) */}
        <DashboardTopSection />

        {/* Tab Navigation dynamically filtered by RBAC permissions */}
        <div className="flex bg-white p-2 rounded-xl shadow-sm border border-slate-200 w-full sm:w-auto overflow-x-auto gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {hasPermission(userRoles, "my_dashboard") && (
            <button
              onClick={() => {
                setActiveTab("overview");
                if (isAssessmentRoute) navigate("/dashboard");
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                (activeTab === "overview" || isAssessmentRoute)
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              My Dashboard
            </button>
          )}

          {hasPermission(userRoles, "intern_dashboard") && (
            <button
              onClick={() => {
                setActiveTab("internship");
                if (isAssessmentRoute) navigate("/dashboard?tab=internship");
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                (!isAssessmentRoute && activeTab === "internship")
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Briefcase className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              Intern Dashboard
            </button>
          )}

          {hasPermission(userRoles, "campus_ambassador") && (
            <button
              onClick={() => {
                setActiveTab("ambassador");
                if (isAssessmentRoute) navigate("/dashboard?tab=ambassador");
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                (!isAssessmentRoute && activeTab === "ambassador")
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <GraduationCap className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              Campus Ambassador
            </button>
          )}
        </div>
      </div>

      <div className="relative z-[60] w-full max-w-6xl mx-auto">
        {isAssessmentRoute ? (
          assessmentEnabled && hasPermission(userRoles, "assessment") ? (
            <StudentExperiencePlatform isEmbedded={true} />
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-bold my-4">
              {!hasPermission(userRoles, "assessment")
                ? "403 Forbidden: Your user role does not have permission to access the Assessment Module."
                : "Assessment module is currently unavailable."}
            </div>
          )
        ) : (
          <>
            {activeTab === "overview" && hasPermission(userRoles, "my_dashboard") && <InterviewDashboard userRoles={userRoles} />}
            {activeTab === "internship" && hasPermission(userRoles, "intern_dashboard") && <StudentDashboard />}
            {activeTab === "ambassador" && hasPermission(userRoles, "campus_ambassador") && <AmbassadorTab />}
          </>
        )}
      </div>
    </div>
  );
}
