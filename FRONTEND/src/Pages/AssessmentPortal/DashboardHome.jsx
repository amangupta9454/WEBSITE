import React from "react";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Award,
  PlayCircle,
  Clock,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  ChevronRight,
  FolderOpen,
} from "lucide-react";

/**
 * Assessment Hub (Part 6 — formerly Dashboard Home)
 * Compact, task-oriented candidate assessment summary adhering to existing Code-A-Nova light theme.
 * Strictly uses backend API data; shows professional empty states if no activity or attempts exist.
 */
const DashboardHome = ({ data, onNavigate, globalSettings }) => {
  const { progress = {}, activeSessions = [], recentActivity = [] } = data || {};

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Task-Oriented Header (Part 5: compact & non-marketing) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Assessment Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your AI-evaluated domain assessments, resume active attempts, and view verifiable credentials.
          </p>
        </div>

        {globalSettings?.studentAssessmentEnabled && (
          <button
            onClick={() => onNavigate("catalog")}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 self-start sm:self-center shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Assessments</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress & Stats Showcase Grid - Light Theme */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate("results")} 
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Attempts</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{progress.totalAssessments || 0}</span>
            <span className="block text-[11px] font-medium text-slate-400 mt-1">Authoritative evaluations</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate("results")}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passed Mastery</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{progress.passedCount || 0}</span>
            <span className="block text-[11px] font-medium text-slate-400 mt-1">Qualified competency</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate("results")}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Needs Practice</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{progress.failedCount || 0}</span>
            <span className="block text-[11px] font-medium text-slate-400 mt-1">Below required percentage</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate("certificates")}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Certificates</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{progress.certificatesEarned || 0}</span>
            <span className="block text-[11px] font-medium text-slate-400 mt-1">Verified permanent badges</span>
          </div>
        </div>
      </div>

      {/* Chronological Recent Activity Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-slate-600" />
            <h3 className="font-extrabold text-base text-slate-900">Recent Activity Timeline</h3>
          </div>
          <button
            onClick={() => onNavigate("timeline")}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>Full Timeline</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-bold text-slate-700">No activity recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Your assessment submissions and certificate awards will systematically log here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((act) => (
              <div key={act._id || act.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                  <div>
                    <span className="font-bold text-slate-900 block">{act.title || act.type}</span>
                    <span className="text-[10px] text-slate-400">{act.description || "Milestone reached in Assessment System"}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {act.createdAt || act.timestamp ? new Date(act.createdAt || act.timestamp).toLocaleDateString() : "Recent"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
