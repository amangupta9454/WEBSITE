import React, { useState, useEffect } from "react";
import { LayoutDashboard, Briefcase, GraduationCap, Layers, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import InterviewDashboard from "./InterviewPortal/InterviewDashboard";
import StudentDashboard from "../Components/StudentDashboard";
import AmbassadorTab from "../Components/AmbassadorTab";
import DashboardTopSection from "./InterviewPortal/components/DashboardTopSection";
import StudentExperiencePlatform from "./AssessmentPortal/StudentExperiencePlatform";
import SEO from '../Components/SEO';

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isIntern, setIsIntern] = useState(() => localStorage.getItem("interviewUserRole") === "intern");
  const [isAmbassador, setIsAmbassador] = useState(() => localStorage.getItem("isAmbassador") === "true");
  const [assessmentEnabled, setAssessmentEnabled] = useState(true);
  const [ambassadorEnabled, setAmbassadorEnabled] = useState(true);
  const [showAmbassadorBanner, setShowAmbassadorBanner] = useState(() => localStorage.getItem("hideAmbassadorBanner") !== "true");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if URL specifies initial tab (e.g. /dashboard?tab=assessment)
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get("tab");
    const pathname = window.location.pathname;
    
    if (pathname.includes('/dashboard/assessment')) {
      setActiveTab("assessment");
    } else if (pathname === '/dashboard') {
      setActiveTab("overview");
    } else if (initialTab && ["overview", "internship", "ambassador", "assessment"].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    // Read Assessment Settings
    const savedAssessmentSettings = localStorage.getItem("CAN_ASSESSMENT_GENERAL_SETTINGS");
    if (savedAssessmentSettings) {
      try {
        const parsed = JSON.parse(savedAssessmentSettings);
        if (parsed.assessmentModuleEnabled === false) {
          setAssessmentEnabled(false);
        }
      } catch (err) {
        console.error("Failed to read settings", err);
      }
    }

    // Read Ambassador Settings
    const savedAmbassadorSettings = localStorage.getItem("CAN_AMBASSADOR_GENERAL_SETTINGS");
    if (savedAmbassadorSettings) {
      try {
        const parsed = JSON.parse(savedAmbassadorSettings);
        if (parsed.ambassadorDashboardEnabled === false) {
          setAmbassadorEnabled(false);
        }
      } catch (err) {
        console.error("Failed to read ambassador settings", err);
      }
    }

    // Check if user is an intern or ambassador
    const checkRole = async () => {
      const role = localStorage.getItem("interviewUserRole");
      setIsIntern(role === "intern");

      const token = localStorage.getItem("studentToken") || localStorage.getItem("adminToken");
      if (token) {
        try {
          const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
          const res = await axios.get(`${apiUrl}/api/student/ambassador-stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            setIsAmbassador(true);
            localStorage.setItem("isAmbassador", "true");
          } else {
            setIsAmbassador(false);
            localStorage.setItem("isAmbassador", "false");
          }
        } catch (e) {
          setIsAmbassador(false);
          localStorage.setItem("isAmbassador", "false");
        }
      }
    };
    checkRole();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 sm:pt-28 pb-16 px-4 max-w-7xl mx-auto relative">
      <SEO noIndex={true} title="Dashboard | Code-A-Nova" />
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none rounded-b-[3rem]"></div>
      <div className="absolute top-20 right-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute top-40 left-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="relative z-50 w-full max-w-6xl mx-auto mb-3 sm:mb-6">
        {/* Top Header Section (Welcome and Profile/Wallet) */}
        <DashboardTopSection />

        {/* Dismissible Become an Ambassador Promotional Banner Above Tabs */}
        {showAmbassadorBanner && ambassadorEnabled && (
          <div className="mb-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 p-0.5 rounded-2xl shadow-md animate-fade-in">
            <div className="bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-3.5 rounded-2xl flex items-center justify-between gap-3 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-extrabold text-lg flex items-center justify-center shrink-0 shadow-inner">
                  🎓
                </div>
                <div>
                  <div className="text-slate-900 font-black text-xs sm:text-sm flex items-center gap-1.5">
                    <span>Earn Official Certificates & Campus Recognition!</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded-full uppercase tracking-wider hidden md:inline-block">Exclusive</span>
                  </div>
                  <div className="text-slate-600 text-xs font-semibold line-clamp-1 sm:line-clamp-none">
                    Join our Campus Ambassador program today to build leadership skills and enhance your career profile.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => navigate("/campus-ambassador")}
                  className="px-4 py-2 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs sm:text-sm hover:opacity-95 shadow-md shadow-purple-600/20 whitespace-nowrap flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Apply Now →
                </button>
                <button
                  onClick={() => {
                    setShowAmbassadorBanner(false);
                    localStorage.setItem("hideAmbassadorBanner", "true");
                  }}
                  title="Dismiss banner"
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-white p-2 rounded-xl shadow-sm border border-slate-200 w-full sm:w-auto overflow-x-auto gap-2 mx-auto max-w-fit [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
          >
            <LayoutDashboard className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            My Dashboard
          </button>



          {isIntern && (
            <button
              onClick={() => setActiveTab("internship")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === "internship"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
              <Briefcase className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              Intern Dashboard
            </button>
          )}

          {isAmbassador && ambassadorEnabled && (
            <button
              onClick={() => setActiveTab("ambassador")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === "ambassador"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
              <GraduationCap className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              Ambassador Dashboard
            </button>
          )}
        </div>
      </div>

      <div className="relative z-[60] w-full max-w-6xl mx-auto">
        {activeTab === "overview" && <InterviewDashboard />}
        {activeTab === "assessment" && <StudentExperiencePlatform isEmbedded={true} />}
        {activeTab === "internship" && isIntern && <StudentDashboard />}
        {activeTab === "ambassador" && isAmbassador && ambassadorEnabled && <AmbassadorTab />}
      </div>
    </div>
  );
}
