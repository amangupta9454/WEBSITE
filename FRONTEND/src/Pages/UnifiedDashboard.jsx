import React, { useState, useEffect } from "react";
import { LayoutDashboard, Briefcase } from "lucide-react";
import InterviewDashboard from "./InterviewPortal/InterviewDashboard";
import StudentDashboard from "../Components/StudentDashboard";
import DashboardTopSection from "./InterviewPortal/components/DashboardTopSection";

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isIntern, setIsIntern] = useState(false);

  useEffect(() => {
    // Check if user is an intern
    const checkRole = () => {
      const role = localStorage.getItem("interviewUserRole");
      setIsIntern(role === "intern");
    };
    checkRole();
    
    // Sometimes the role is set after the API call in InterviewDashboard,
    // so we can poll or rely on it being set when the component loads.
    // For a robust check, we can listen for local storage changes or check periodically.
    const interval = setInterval(checkRole, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 max-w-7xl mx-auto relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none rounded-b-[3rem]"></div>
      <div className="absolute top-20 right-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute top-40 left-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="relative z-50 w-full max-w-6xl mx-auto mb-8">
        {/* Top Header Section (Welcome and Profile/Wallet) */}
        <DashboardTopSection />

        {/* Tab Navigation */}
        <div className="flex bg-white p-2 rounded-xl shadow-sm border border-slate-200 w-full sm:w-auto overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard size={18} />
            My Dashboard
          </button>
          
          {isIntern && (
            <button
              onClick={() => setActiveTab("internship")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "internship"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Briefcase size={18} />
              Intern Dashboard
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {activeTab === "overview" && <InterviewDashboard />}
        {activeTab === "internship" && isIntern && <StudentDashboard />}
      </div>
    </div>
  );
}
