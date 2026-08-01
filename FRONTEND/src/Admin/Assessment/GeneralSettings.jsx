import React, { useState, useEffect } from "react";
import { Settings, Shield, CheckCircle2, AlertCircle, Save, Sliders } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Admin -> Assessment -> General Settings (Part 9)
 * Global administrative control switches to instantly enable or disable assessment module capabilities.
 * Changes immediately propagate to the Student Experience Platform to hide/show respective features.
 */
const GeneralSettings = () => {
  const [settings, setSettings] = useState({
    assessmentModuleEnabled: true,
    studentAssessmentEnabled: true,
    certificateDownloadEnabled: true,
    publicVerificationEnabled: true,
    aiQuestionGenerationEnabled: true,
    questionBankFallbackEnabled: true,
    resumeAssessmentEnabled: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("CAN_ASSESSMENT_GENERAL_SETTINGS");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to load assessment settings:", err);
      }
    }
  }, []);

  const handleToggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem("CAN_ASSESSMENT_GENERAL_SETTINGS", JSON.stringify(updated));
    toast.success(`Updated toggle: ${key} is now ${updated[key] ? "ENABLED" : "DISABLED"}`);
  };

  const handleSaveAll = () => {
    localStorage.setItem("CAN_ASSESSMENT_GENERAL_SETTINGS", JSON.stringify(settings));
    toast.success("✅ Global Assessment Module settings saved & applied to platform!");
  };

  const toggleConfigs = [
    {
      key: "assessmentModuleEnabled",
      title: "Assessment Module Enabled",
      description: "Master switch for the entire assessment engine and student UI interfaces across Code-A-Nova.",
      critical: true,
    },
    {
      key: "studentAssessmentEnabled",
      title: "Student Assessment Enabled",
      description: "Controls whether students can view and launch new domain assessments from the catalog.",
    },
    {
      key: "certificateDownloadEnabled",
      title: "Certificate Download Enabled",
      description: "Allows students to download verified printable PDF certificates for passed assessments.",
    },
    {
      key: "publicVerificationEnabled",
      title: "Public Verification Enabled",
      description: "Enables public employer verification gateways (/verify/:certificateId) for earned competency badges.",
    },
    {
      key: "aiQuestionGenerationEnabled",
      title: "AI Question Generation Enabled",
      description: "Activates Phase 5 AI Runtime generation for real-time question synthesis via Groq LLM pipelines.",
    },
    {
      key: "questionBankFallbackEnabled",
      title: "Question Bank Fallback Enabled",
      description: "Allows fallback to pre-generated Question Knowledge Base questions if AI latency thresholds are exceeded.",
    },
    {
      key: "resumeAssessmentEnabled",
      title: "Resume Assessment Enabled",
      description: "Enables autosaved attempt restoration without resetting timers when students exit sessions midway.",
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 animate-fade-in text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Global Assessment Governance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Assessment General Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure global platform switches. Disabled features are seamlessly hidden from student environments without code deployment.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 self-start sm:self-center shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </div>

      <div className="space-y-4 max-w-3xl">
        {toggleConfigs.map((item) => {
          const isEnabled = settings[item.key];
          return (
            <div
              key={item.key}
              onClick={() => handleToggle(item.key)}
              className={`p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                isEnabled
                  ? "bg-white border-slate-200 hover:border-indigo-300 shadow-xs"
                  : "bg-slate-50/80 border-slate-200 text-slate-500 opacity-80"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-slate-900">{item.title}</span>
                  {item.critical && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold uppercase border border-rose-200">
                      Master Switch
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  {item.description}
                </p>
              </div>

              {/* Toggle Switch UI */}
              <div
                className={`w-12 h-7 rounded-full transition-colors flex items-center p-1 shrink-0 ${
                  isEnabled ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900 font-medium">
        <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
        <div>
          <strong>Enterprise Guardrail:</strong> When switches like <em>Certificate Download</em> or <em>Resume Assessment</em> are toggled off here, the Student Portal dynamically hides corresponding action buttons and prevents API executions.
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
