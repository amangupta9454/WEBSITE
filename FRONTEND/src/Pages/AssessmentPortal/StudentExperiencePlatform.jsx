import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  Layers,
  PlayCircle,
  FileText,
  Award,
  Clock,
  User,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import DashboardHome from "./DashboardHome";
import AssessmentCenterView from "./AssessmentCenterView";
import ActiveAssessmentView from "./ActiveAssessmentView";
import ResultCenterView from "./ResultCenterView";
import CredentialCenterView from "./CredentialCenterView";
import ActivityTimelineView from "./ActivityTimelineView";
import StudentProfileView from "./StudentProfileView";
import StudentSearchView from "./StudentSearchView";
import StudentSettingsView from "./StudentSettingsView";

/**
 * Phase 12 — Student Assessment Module (Refactored for Native Platform Integration)
 * Inherits existing Code-A-Nova light theme, navigation layout, spacing, and styling.
 * Completely zero mock or hardcoded demo data; displays professional empty states.
 */
const StudentExperiencePlatform = ({ isEmbedded = false }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const [activeTab, setActiveTab] = useState("hub"); // hub | catalog | results | certificates | resume | timeline | profile | search | settings
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState({
    assessmentModuleEnabled: true,
    studentAssessmentEnabled: true,
    certificateDownloadEnabled: true,
    publicVerificationEnabled: true,
    aiQuestionGenerationEnabled: true,
    questionBankFallbackEnabled: true,
    resumeAssessmentEnabled: true,
  });

  // Zero-mock state store for candidate workspace data
  const [dashboardData, setDashboardData] = useState({
    welcome: { candidateName: "", greeting: "Assessment Hub" },
    progress: { completionRate: 0, totalAssessments: 0, passedCount: 0, failedCount: 0, certificatesEarned: 0 },
    activeSessions: [],
    recentActivity: [],
  });
  const [catalogData, setCatalogData] = useState({ available: [], categories: [], subcategories: [] });
  const [activeSessions, setActiveSessions] = useState([]);
  const [resultsData, setResultsData] = useState([]);
  const [credentialsData, setCredentialsData] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/catalog")) setActiveTab("catalog");
    else if (path.includes("/attempt") || path.includes("/active")) setActiveTab("resume");
    else if (path.includes("/results")) setActiveTab("results");
    else if (path.includes("/certificates") || path.includes("/credentials")) setActiveTab("certificates");
    else if (path.includes("/timeline")) setActiveTab("timeline");
    else if (path.includes("/profile")) setActiveTab("profile");
    else if (path.includes("/search")) setActiveTab("search");
    else if (path.includes("/settings")) setActiveTab("settings");
    else setActiveTab("hub");
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "hub") navigate("/dashboard/assessment");
    else if (tabId === "catalog") navigate("/dashboard/assessment/catalog");
    else if (tabId === "resume") navigate("/dashboard/assessment/attempt/active");
    else if (tabId === "results") navigate("/dashboard/assessment/results");
    else if (tabId === "certificates") navigate("/dashboard/assessment/certificates");
    else navigate(`/dashboard/assessment/${tabId}`);
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem("CAN_ASSESSMENT_GENERAL_SETTINGS");
    if (savedSettings) {
      try {
        setGlobalSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error("Error parsing assessment settings:", err);
      }
    }
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("studentToken") || localStorage.getItem("token") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [dashRes, catRes, actRes, resRes, certRes, timeRes, profRes] = await Promise.allSettled([
        axios.get(`${backendUrl}/api/assessment/student/dashboard`, { headers }),
        axios.get(`${backendUrl}/api/assessment/student/catalog`, { headers }),
        axios.get(`${backendUrl}/api/assessment/student/active`, { headers }),
        axios.get(`${backendUrl}/api/assessment/student/results`, { headers }),
        axios.get(`${backendUrl}/api/assessment/student/credentials`, { headers }),
        axios.get(`${backendUrl}/api/assessment/student/timeline`, { headers }),
        axios.get(`${backendUrl}/api/assessment/student/profile`, { headers }),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data?.success) {
        setDashboardData(dashRes.value.data.data);
      } else {
        setDashboardData({
          welcome: { candidateName: "", greeting: "Assessment Hub" },
          progress: { completionRate: 0, totalAssessments: 0, passedCount: 0, failedCount: 0, certificatesEarned: 0 },
          activeSessions: [],
          recentActivity: [],
        });
      }

      if (catRes.status === "fulfilled" && catRes.value.data?.success) {
        setCatalogData(catRes.value.data.data || { available: [] });
      } else {
        setCatalogData({ available: [], categories: [], subcategories: [] });
      }

      if (actRes.status === "fulfilled" && actRes.value.data?.success) {
        setActiveSessions(actRes.value.data.data || []);
      } else {
        setActiveSessions([]);
      }

      if (resRes.status === "fulfilled" && resRes.value.data?.success) {
        setResultsData(resRes.value.data.data || []);
      } else {
        setResultsData([]);
      }

      if (certRes.status === "fulfilled" && certRes.value.data?.success) {
        setCredentialsData(certRes.value.data.data || []);
      } else {
        setCredentialsData([]);
      }

      if (timeRes.status === "fulfilled" && timeRes.value.data?.success) {
        setTimelineData(timeRes.value.data.data || []);
      } else {
        setTimelineData([]);
      }

      if (profRes.status === "fulfilled" && profRes.value.data?.success) {
        setProfileData(profRes.value.data.data || null);
      }
    } catch (err) {
      console.warn("Notice: API sync error in Assessment workspace, rendering empty state:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!globalSettings.assessmentModuleEnabled) {
    return (
      <div className={`w-full max-w-6xl mx-auto ${isEmbedded ? "my-6" : "pt-24 sm:pt-28 pb-16 px-4"}`}>
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800">Assessment Module Unavailable</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            The assessment feature set is currently disabled by system administration for scheduled maintenance or governance policies.
          </p>
        </div>
      </div>
    );
  }

  // Navigation Items matching Part 10 requirements ("Assessment Hub, My Results, My Certificates, Resume Assessment")
  const navItems = [
    { id: "hub", label: "Assessment Hub", icon: LayoutDashboard, enabled: true },
    { id: "catalog", label: "Assessment Center", icon: Layers, enabled: globalSettings.studentAssessmentEnabled },
    { id: "results", label: "My Results", icon: FileText, enabled: true },
    { id: "certificates", label: "My Certificates", icon: Award, enabled: globalSettings.certificateDownloadEnabled },
    { id: "resume", label: "Resume Assessment", icon: PlayCircle, enabled: globalSettings.resumeAssessmentEnabled },
    { id: "timeline", label: "Activity Timeline", icon: Clock, enabled: true },
    { id: "profile", label: "Profile & Analytics", icon: User, enabled: true },
    { id: "search", label: "Search", icon: Search, enabled: true },
    { id: "settings", label: "Settings", icon: Settings, enabled: true },
  ].filter(item => item.enabled !== false);

  return (
    <div className={`w-full max-w-6xl mx-auto ${isEmbedded ? "mt-4" : "pt-24 sm:pt-28 pb-16 px-4"} space-y-6 text-slate-800 animate-fade-in`}>
      {/* Native Navigation Strip matching Code-A-Nova Dashboard architecture */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center overflow-x-auto gap-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
              {item.id === "resume" && activeSessions.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px]">
                  {activeSessions.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Module Area */}
      <div className="relative min-h-[500px]">
        {loading && (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 text-xs font-bold gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Synchronizing candidate assessment records from authoritative servers...</span>
          </div>
        )}

        {!loading && activeTab === "hub" && (
          <DashboardHome
            data={dashboardData}
            onNavigate={(tabId) => handleTabChange(tabId)}
            globalSettings={globalSettings}
          />
        )}

        {!loading && activeTab === "catalog" && (
          <AssessmentCenterView catalogData={catalogData} onRefresh={fetchWorkspaceData} />
        )}

        {!loading && activeTab === "resume" && (
          <ActiveAssessmentView activeSessions={activeSessions} onRefresh={fetchWorkspaceData} />
        )}

        {!loading && activeTab === "results" && (
          <ResultCenterView results={resultsData} onRefresh={fetchWorkspaceData} />
        )}

        {!loading && activeTab === "certificates" && (
          <CredentialCenterView credentials={credentialsData} onRefresh={fetchWorkspaceData} />
        )}

        {!loading && activeTab === "timeline" && (
          <ActivityTimelineView timeline={timelineData} onRefresh={fetchWorkspaceData} />
        )}

        {!loading && activeTab === "profile" && (
          <StudentProfileView profileData={profileData} onRefresh={fetchWorkspaceData} />
        )}

        {!loading && activeTab === "search" && (
          <StudentSearchView
            catalog={catalogData?.available || []}
            results={resultsData}
            credentials={credentialsData}
            onSelect={(item, domain) => {
              if (domain === "result") handleTabChange("results");
              else if (domain === "certificate") handleTabChange("certificates");
              else handleTabChange("catalog");
            }}
          />
        )}

        {!loading && activeTab === "settings" && (
          <StudentSettingsView onUpdate={fetchWorkspaceData} />
        )}
      </div>
    </div>
  );
};

export default StudentExperiencePlatform;
