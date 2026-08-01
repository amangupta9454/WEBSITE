import React, { useState } from "react";
import {
  Settings,
  Shield,
  Lock,
  Globe,
  Save,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Student Platform Settings (Component 10)
 * Manages privacy preferences and security behavior in existing Light Theme without redundancy.
 */
const StudentSettingsView = ({ onUpdate }) => {
  const [privacy, setPrivacy] = useState("strict");
  const [language, setLanguage] = useState("en-US");

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast.success("✅ Candidate workspace and privacy settings applied!");
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>Assessment Preferences & Security</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure assessment workspace environment, verification visibility, and privacy guidelines.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6 pt-6 border-t border-slate-100">
          {/* Section 1: Account Credentials */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Security & Authentication</span>
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900">Password & Two-Factor Authentication</div>
                <div className="text-xs text-slate-500 mt-0.5">Manage credentials via main account settings gateway</div>
              </div>
              <button
                type="button"
                onClick={() => toast("🔒 Please use the main account setup page to alter primary credentials.")}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-extrabold text-slate-700 border border-slate-200 transition-all shadow-xs shrink-0"
              >
                Manage Password
              </button>
            </div>
          </div>

          {/* Section 2: Privacy Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Public Verification & Privacy</span>
            </h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  checked={privacy === "strict"}
                  onChange={() => setPrivacy("strict")}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900">Strict Employer Gateway Only</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Only verified third parties possessing your specific Certificate ID can query passing status.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  checked={privacy === "public"}
                  onChange={() => setPrivacy("public")}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900">Public Profile Registry</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Allow authorized enterprise campus recruiters to discover your earned competency badges.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentSettingsView;
