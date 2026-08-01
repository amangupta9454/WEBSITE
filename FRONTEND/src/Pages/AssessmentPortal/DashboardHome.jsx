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
  Zap,
  BookOpen,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

/**
 * Phase 12 — Component 1: Dashboard Home
 * Displays rich Welcome Card, Overall Progress metrics, Total/Passed/Failed counts,
 * Certificates earned, active attempts, and chronological recent activity feed.
 */
const DashboardHome = ({ data, loading, onNavigateTab }) => {
  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-44 bg-slate-800/60 rounded-3xl border border-slate-700/50 w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 bg-slate-800/60 rounded-2xl border border-slate-700/50"></div>
          <div className="h-32 bg-slate-800/60 rounded-2xl border border-slate-700/50"></div>
          <div className="h-32 bg-slate-800/60 rounded-2xl border border-slate-700/50"></div>
          <div className="h-32 bg-slate-800/60 rounded-2xl border border-slate-700/50"></div>
        </div>
        <div className="h-64 bg-slate-800/60 rounded-2xl border border-slate-700/50"></div>
      </div>
    );
  }

  const { welcome, progress = {}, activeSessions = [], recentActivity = [] } = data;

  return (
    <div className="space-y-8 p-1 sm:p-4">
      {/* Welcome Card — Premium Gradient & Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/80 via-indigo-900/90 to-purple-950 p-6 sm:p-8 border border-indigo-500/30 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-60 h-60 rounded-full bg-purple-500/15 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Student Experience Platform • Phase 12</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {welcome?.greeting || "Welcome Back"}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">{welcome?.candidateName || "Valued Candidate"}</span>!
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl font-light">
              Your centralized command console to launch technical assessments, inspect authoritative evaluation reports, download immutable digital credentials, and track your engineering excellence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab("catalog")}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Launch Assessment</span>
            </button>
            <button
              onClick={() => onNavigateTab("credentials")}
              className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-medium border border-slate-600/60 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>My Credentials</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Stats Showcase Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assessments */}
        <div
          onClick={() => onNavigateTab("results")}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 p-5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Attempts</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{progress.totalAssessments || 0}</div>
          <div className="mt-2 flex items-center text-xs text-slate-400 gap-1">
            <span>Overall completion rate:</span>
            <span className="text-blue-400 font-semibold">{progress.completionRate || 0}%</span>
          </div>
        </div>

        {/* Passed Assessments */}
        <div
          onClick={() => onNavigateTab("results")}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 p-5 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passed Mastery</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{progress.passedCount || 0}</div>
          <div className="mt-2 flex items-center text-xs text-emerald-500/80 font-medium">
            <span>Verified above passing criteria</span>
          </div>
        </div>

        {/* Failed / Reattempt needed */}
        <div
          onClick={() => onNavigateTab("results")}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 p-5 hover:border-rose-500/50 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Needs Practice</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{progress.failedCount || 0}</div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Eligible for reattempt</span>
          </div>
        </div>

        {/* Certificates Earned */}
        <div
          onClick={() => onNavigateTab("credentials")}
          className="group cursor-pointer rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 p-5 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-300/80 uppercase tracking-wider">Certificates Earned</span>
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:rotate-12 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white flex items-baseline gap-2">
            <span>{progress.certificatesEarned || 0}</span>
            <span className="text-xs text-amber-400/80 font-normal">Verified & Active</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-amber-300 font-medium">
            <span>View & Download PDFs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Active Assessments & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sessions Panel (1 col) */}
        <div className="lg:col-span-1 bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-white tracking-wide">Active Assessments</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold text-xs border border-cyan-500/30">
                {activeSessions.length} Running
              </span>
            </div>

            {activeSessions.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/50">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">No active attempts</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  All your previous assessment attempts have been submitted and locked for evaluation.
                </p>
                <button
                  onClick={() => onNavigateTab("catalog")}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs rounded-lg transition-colors border border-slate-700"
                >
                  Explore Catalog →
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {activeSessions.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white truncate max-w-[180px]">{s.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                        {s.status}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(10, Math.min(100, (s.answeredCount / (s.totalQuestions || 1)) * 100))}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{s.answeredCount || 0} / {s.totalQuestions || 20} Completed</span>
                      <button
                        onClick={() => onNavigateTab("active")}
                        className="font-semibold text-cyan-400 hover:underline flex items-center gap-0.5 text-xs"
                      >
                        <span>Resume Now</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Server status: Healthy & Secure</span>
            </span>
          </div>
        </div>

        {/* Recent Activity Timeline Preview (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-white tracking-wide">Recent Assessment Activity</h2>
              </div>
              <button
                onClick={() => onNavigateTab("timeline")}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline flex items-center gap-1"
              >
                <span>View Full Audit Timeline</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/50">
                <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">No activity recorded yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your milestone achievements, assessment submissions, and certificate issuances will automatically populate here in real-time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentActivity.map((act, i) => {
                  const isCert = act.type === "CERTIFICATE_ISSUED";
                  const isComp = act.type === "ASSESSMENT_COMPLETED";
                  return (
                    <div
                      key={act.id || i}
                      onClick={() => onNavigateTab(isCert ? "credentials" : isComp ? "results" : "active")}
                      className="py-3.5 px-2 -mx-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isCert
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : isComp
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {isCert ? <Award className="w-5 h-5" /> : isComp ? <CheckCircle2 className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {act.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{isCert ? "Competency Badge Issued" : isComp ? "Submission Locked & Evaluated" : "In Progress"}</span>
                            <span>•</span>
                            <span>{act.timestamp ? new Date(act.timestamp).toLocaleDateString() : "Today"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            isCert
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : isComp
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                          }`}
                        >
                          {isCert ? "Verified PDF" : isComp ? "Result Ready" : "Continue"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
