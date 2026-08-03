import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FolderTree,
  Layers,
  Sliders,
  Cpu,
  Database,
  FileCheck,
  Award,
  BarChart3,
  RefreshCw,
  Settings,
  PlusCircle,
  Clock,
  Server,
  ShieldCheck
} from "lucide-react";

import AssessmentOverview from "./AssessmentOverview";
import CategoryManager from "./CategoryManager";
import CategoryDetail from "./CategoryDetail";
import SubcategoryManager from "./SubcategoryManager";
import CategoryWizard from "./CategoryWizard";
import ConfigManager from "./ConfigManager";
import AIBlueprintManager from "./AIBlueprintManager";
import AIRuntimeMonitor from "./AIRuntimeMonitor";
import QuestionIntelligenceGate from "./QuestionIntelligenceGate";
import QuestionBankManager from "./QuestionBankManager";
import OrchestrationCenter from "./OrchestrationCenter";
import AssessmentSessionManager from "./AssessmentSessionManager";
import EvaluationConsole from "./EvaluationConsole";
import StudentResultView from "./StudentResultView";
import CredentialConsole from "./CredentialConsole";
import PublicVerificationPage from "./PublicVerificationPage";
import PublishControl from "./PublishControl";
import AnalyticsDashboard from "./AnalyticsDashboard";
import RecruiterDashboard from "./RecruiterDashboard";

const AssessmentDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard, phase: "Phase 1-2 / Live" },
    { id: "categories", label: "Categories", icon: FolderTree, phase: "Phase 2 / Live" },
    { id: "subcategories", label: "Subcategories", icon: Layers, phase: "Phase 2 / Live" },
    { id: "config", label: "Configuration", icon: Sliders, phase: "Phase 3 / Live" },
    { id: "ai_config", label: "Blueprints (Prompt Studio)", icon: Cpu, phase: "Phase 4 / Live" },
    { id: "ai_runtime", label: "Runtime Engine", icon: Server, phase: "Phase 5 / Live" },
    { id: "ai_quality_gate", label: "Question Intelligence", icon: ShieldCheck, phase: "Phase 6 / Live" },
    { id: "questions", label: "Knowledge Base", icon: Database, phase: "Phase 7 / Live" },
    { id: "jobs", label: "Orchestration", icon: RefreshCw, phase: "Phase 8 / Live" },
    { id: "assessments", label: "Sessions Engine", icon: FileCheck, phase: "Phase 9 / Live" },
    { id: "evaluation", label: "Evaluation", icon: Cpu, phase: "Phase 10 / Live" },
    { id: "certificates", label: "Certificates", icon: Award, phase: "Phase 11 / Live" },
    { id: "student_result", label: "Student Experience", icon: FileCheck, phase: "Phase 12 / Live" },
    { id: "analytics", label: "Analytics Platform", icon: BarChart3, phase: "Phase 13 / Live" },
    { id: "recruiter_verification", label: "Recruiter Verification", icon: ShieldCheck, phase: "Phase 14 / Live" },
    { id: "general_settings", label: "General Settings", icon: Settings, phase: "Part 9 / Live" },
    { id: "publish_control", label: "Publish Control", icon: Layers, phase: "LMS Control / Live" }
  ];

  const handleSelectCategory = (id) => {
    setSelectedCategoryId(id);
    setActiveTab("category_detail");
  };

  const handleNavigate = (tab) => {
    setSelectedCategoryId(null);
    setActiveTab(tab);
  };

  return (
    <div className="bg-slate-50 min-h-screen rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 tracking-wide uppercase">
              AI Powered Module
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Phase 3.1 Management System Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-1">
            Assessment & Certification
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Database-Driven Inventory Management, Multi-step Wizards, Operational Rules & AI Telemetry
          </p>
        </div>
      </div>

      {/* Horizontal Navigation Sub-menu */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (activeTab === "category_detail" && item.id === "categories");
          const isLive = item.phase.includes("Live");
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-black"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ml-1 ${
                isActive ? "bg-indigo-500 text-white" : isLive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-slate-100 text-slate-400"
              }`}>
                {isLive ? "Active" : item.phase.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="w-full min-w-0">
        {activeTab === "dashboard" && (
          <AssessmentOverview
            onNavigate={handleNavigate}
            onLaunchWizard={() => handleNavigate("wizard")}
            />
          )}

          {activeTab === "categories" && (
            <CategoryManager
              onSelectCategory={handleSelectCategory}
              onLaunchWizard={() => handleNavigate("wizard")}
            />
          )}

          {activeTab === "category_detail" && (
            <CategoryDetail
              categoryId={selectedCategoryId}
              onBack={() => handleNavigate("categories")}
              onSelectSubcategory={() => handleNavigate("subcategories")}
            />
          )}

          {activeTab === "subcategories" && (
            <SubcategoryManager />
          )}

          {activeTab === "wizard" && (
            <CategoryWizard
              onComplete={() => handleNavigate("categories")}
              onCancel={() => handleNavigate("categories")}
            />
          )}

          {activeTab === "config" && (
            <ConfigManager />
          )}

          {activeTab === "ai_config" && (
            <AIBlueprintManager />
          )}

          {activeTab === "ai_runtime" && (
            <AIRuntimeMonitor />
          )}

          {activeTab === "ai_quality_gate" && (
            <QuestionIntelligenceGate />
          )}

          {activeTab === "questions" && (
            <QuestionBankManager />
          )}

          {activeTab === "jobs" && (
            <OrchestrationCenter />
          )}

          {activeTab === "assessments" && (
            <AssessmentSessionManager />
          )}

          {activeTab === "evaluation" && (
            <EvaluationConsole />
          )}

          {activeTab === "student_result" && (
            <StudentResultView onBack={() => setActiveTab("evaluation")} />
          )}

          {activeTab === "certificates" && (
            <CredentialConsole />
          )}

          {activeTab === "general_settings" && (
            <GeneralSettings />
          )}

          {activeTab === "publish_control" && (
            <PublishControl />
          )}

          {activeTab === "analytics" && (
            <AnalyticsDashboard />
          )}

          {activeTab === "recruiter_verification" && (
            <RecruiterDashboard />
          )}

          {!["dashboard", "categories", "category_detail", "subcategories", "wizard", "config", "ai_config", "ai_runtime", "ai_quality_gate", "questions", "jobs", "assessments", "evaluation", "student_result", "certificates", "analytics", "recruiter_verification", "general_settings", "publish_control"].includes(activeTab) && (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm max-w-2xl mx-auto my-8 animate-fade-in">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs border border-indigo-100">
                {React.createElement(navItems.find(i => i.id === activeTab)?.icon || FolderTree, { className: "w-8 h-8" })}
              </div>
              <h3 className="text-xl font-black text-slate-800 capitalize">
                {navItems.find(i => i.id === activeTab)?.label} Engine
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                This AI subsystem and management console belongs to <span className="font-bold text-indigo-600">{navItems.find(i => i.id === activeTab)?.phase}</span> of our progressive enterprise implementation roadmap.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                Awaiting instruction: <code className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">Next Phase</code>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default AssessmentDashboard;
