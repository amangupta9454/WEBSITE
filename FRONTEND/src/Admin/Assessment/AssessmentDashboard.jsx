import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FolderTree,
  Layers,
  Sparkles,
  Database,
  Settings2,
  Award,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import AssessmentOverview from "./AssessmentOverview";
import CategoryManager from "./CategoryManager";
import SubcategoryManager from "./SubcategoryManager";
import SimpleQuestionGenerator from "./SimpleQuestionGenerator";
import QuestionBankManager from "./QuestionBankManager";
import SimpleConfigManager from "./SimpleConfigManager";
import CredentialConsole from "./CredentialConsole";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5006";

const NAV_ITEMS = [
  { id: "dashboard",    label: "Overview",          icon: LayoutDashboard, desc: "Stats & summary" },
  { id: "categories",  label: "Categories",         icon: FolderTree,      desc: "Manage categories" },
  { id: "subcategories", label: "Subcategories",    icon: Layers,          desc: "Manage subcategories" },
  { id: "generate",    label: "Generate Questions", icon: Sparkles,        desc: "AI question generation" },
  { id: "questions",   label: "Question Bank",      icon: Database,        desc: "View & edit questions" },
  { id: "config",      label: "Assessment Config",  icon: Settings2,       desc: "Questions, time, pass %" },
  { id: "certificates", label: "Certificates",      icon: Award,           desc: "Issue & manage certs" },
];

const AssessmentDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/admin/assessment-settings`);
        if (res.data.success) setFeatureEnabled(res.data.enabled);
      } catch {
        // fallback: assume enabled
      }
    };
    fetchSettings();
  }, []);

  const toggleFeature = async () => {
    setToggling(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(`${BACKEND}/api/admin/assessment-settings/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeatureEnabled(res.data.enabled);
      toast.success(`Assessment feature ${res.data.enabled ? "enabled ✅" : "disabled 🔴"}`);
    } catch {
      toast.error("Failed to toggle feature");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 tracking-wide uppercase">
              AI Powered
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-1">
            Assessment &amp; Certification
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-powered question generation, assessment configuration &amp; certificate management
          </p>
        </div>
      </div>

      {/* Feature Toggle Banner */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 rounded-2xl border gap-4 mb-6 ${featureEnabled ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
        <div>
          <p className={`font-black text-base ${featureEnabled ? "text-emerald-800" : "text-red-800"}`}>
            Assessment Feature is {featureEnabled ? "✅ Active" : "🔴 Disabled"}
          </p>
          <p className={`text-xs font-medium mt-0.5 ${featureEnabled ? "text-emerald-600" : "text-red-500"}`}>
            {featureEnabled
              ? "Students can access all assessments from their dashboard."
              : "Students will see \"Coming Soon\" — assessments are hidden."}
          </p>
        </div>
        <button
          onClick={toggleFeature}
          disabled={toggling}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${featureEnabled ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"} disabled:opacity-50`}
        >
          {featureEnabled ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
          {toggling ? "Updating..." : featureEnabled ? "Disable Feature" : "Enable Feature"}
        </button>
      </div>

      {/* Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="w-full min-w-0">
        {activeTab === "dashboard" && (
          <AssessmentOverview
            onNavigate={setActiveTab}
            onLaunchWizard={() => setActiveTab("generate")}
          />
        )}
        {activeTab === "categories" && (
          <CategoryManager
            onSelectCategory={() => {}}
            onLaunchWizard={() => setActiveTab("generate")}
          />
        )}
        {activeTab === "subcategories" && <SubcategoryManager />}
        {activeTab === "generate" && <SimpleQuestionGenerator />}
        {activeTab === "questions" && <QuestionBankManager />}
        {activeTab === "config" && <SimpleConfigManager />}
        {activeTab === "certificates" && <CredentialConsole />}
      </div>
    </div>
  );
};

export default AssessmentDashboard;
