import React, { useState } from "react";
import {
  LayoutDashboard,
  FolderTree,
  Layers,
  Sparkles,
  Database,
  Settings2,
  Award,
} from "lucide-react";

import AssessmentOverview from "./AssessmentOverview";
import CategoryManager from "./CategoryManager";
import SubcategoryManager from "./SubcategoryManager";
import SimpleQuestionGenerator from "./SimpleQuestionGenerator";
import QuestionBankManager from "./QuestionBankManager";
import SimpleConfigManager from "./SimpleConfigManager";
import CredentialConsole from "./CredentialConsole";

// Keep these imports available if needed later (not shown in nav)
// import CategoryWizard from "./CategoryWizard";
// import ConfigManager from "./ConfigManager";
// import AIBlueprintManager from "./AIBlueprintManager";
// import AIRuntimeMonitor from "./AIRuntimeMonitor";
// import QuestionIntelligenceGate from "./QuestionIntelligenceGate";
// import OrchestrationCenter from "./OrchestrationCenter";
// import AssessmentSessionManager from "./AssessmentSessionManager";
// import EvaluationConsole from "./EvaluationConsole";
// import AnalyticsDashboard from "./AnalyticsDashboard";

const NAV_ITEMS = [
  { id: "dashboard",   label: "Overview",           icon: LayoutDashboard, desc: "Stats & summary" },
  { id: "categories",  label: "Categories",          icon: FolderTree,      desc: "Manage categories" },
  { id: "subcategories", label: "Subcategories",     icon: Layers,          desc: "Manage subcategories" },
  { id: "generate",    label: "Generate Questions",  icon: Sparkles,        desc: "AI question generation" },
  { id: "questions",   label: "Question Bank",       icon: Database,        desc: "View & edit questions" },
  { id: "config",      label: "Assessment Config",   icon: Settings2,       desc: "Questions, time, pass %" },
  { id: "certificates", label: "Certificates",       icon: Award,           desc: "Issue & manage certs" },
];

const AssessmentDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

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
            Assessment & Certification
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-powered question generation, assessment configuration & certificate management
          </p>
        </div>
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
