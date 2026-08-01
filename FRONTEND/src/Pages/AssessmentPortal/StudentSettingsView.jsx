import React, { useState } from "react";
import {
  Settings,
  Shield,
  Lock,
  Moon,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Phase 12 — Component 10: Settings
 * Manages Profile preference adjustments, Password change placeholder, Theme preference (future ready),
 * strict Candidate Privacy settings, and Language localization placeholder.
 */
const StudentSettingsView = ({ onNavigateTab }) => {
  const [theme, setTheme] = useState("dark");
  const [privacy, setPrivacy] = useState("strict");
  const [language, setLanguage] = useState("en-US");

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast.success("✅ Candidate preferences and security settings applied!");
  };

  return (
    <div className="space-y-8 p-1 sm:p-4 max-w-4xl mx-auto">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Student Platform Settings & Security</h1>
            <p className="text-xs text-slate-400">Configure your workspace environment, account privacy, and interface behavior.</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6 mt-8 pt-6 border-t border-slate-800/80">
          {/* Section 1: Profile & Password placeholder */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Account Credentials & Security</span>
            </h2>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-white">Password Authentication</div>
                <div className="text-xs text-slate-400 mt-0.5">Manage password resets via our encrypted authentication gateway</div>
              </div>
              <button
                type="button"
                onClick={() => toast("🔒 Password modification requires email re-authentication link (Future Ready)")}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors shrink-0"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Section 2: Theme Preferences (Future Ready) */}
          <div className="space-y-4 pt-4 border-t border-slate-800/60">
            <h2 className="text-sm font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-2">
              <Moon className="w-4 h-4" />
              <span>Theme Preference (Future Ready)</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setTheme("dark")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  theme === "dark" ? "bg-indigo-950/40 border-indigo-500 text-white shadow-lg" : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                <div>
                  <div className="text-sm font-bold">Modern Enterprise Dark</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Recommended tailored HSL palette</div>
                </div>
                {theme === "dark" && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
              </div>
              <div
                onClick={() => {
                  setTheme("light");
                  toast("🌞 Light theme option scheduled for Phase 13 UI expansion.");
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  theme === "light" ? "bg-indigo-950/40 border-indigo-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400 opacity-60"
                }`}
              >
                <div>
                  <div className="text-sm font-bold">Light Day Mode</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">High-contrast daytime view</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Privacy & Ownership Guardrails */}
          <div className="space-y-4 pt-4 border-t border-slate-800/60">
            <h2 className="text-sm font-bold uppercase text-purple-400 tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Candidate Privacy & Data Isolation (Component 12)</span>
            </h2>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Enforce strict candidate-only ownership validation on all APIs</span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold uppercase border border-emerald-500/30">
                  Protected & Active
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                By default, your results, scores, and draft attempts cannot be queried or read by any other student. Public verification URLs only display non-sensitive competency badges.
              </p>
            </div>
          </div>

          {/* Section 4: Language Placeholder */}
          <div className="space-y-4 pt-4 border-t border-slate-800/60">
            <h2 className="text-sm font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Language & Regional Formatting (Placeholder)</span>
            </h2>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 font-medium"
            >
              <option value="en-US">English (US - Standard Enterprise)</option>
              <option value="en-UK">English (UK - International)</option>
              <option value="es-ES">Spanish (Future Ready Localization)</option>
              <option value="fr-FR">French (Future Ready Localization)</option>
            </select>
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save All Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentSettingsView;
