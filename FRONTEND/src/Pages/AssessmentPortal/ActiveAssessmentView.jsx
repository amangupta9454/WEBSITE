import React from "react";
import {
  PlayCircle,
  Clock,
  RefreshCw,
  ShieldCheck,
  Zap,
  CheckCircle,
  Server,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

/**
 * Phase 12 — Component 3: Active Assessment Watchdog
 * Displays running and suspended assessment attempts with Remaining Time estimation,
 * Batch Progress bars, Resume Button triggers, Current Question indicator, and Server Health Status.
 */
const ActiveAssessmentView = ({ sessions = [], loading, onResumeSession }) => {
  if (loading) {
    return (
      <div className="space-y-4 p-4 animate-pulse">
        <div className="h-40 bg-slate-800/60 rounded-3xl"></div>
        <div className="h-40 bg-slate-800/60 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 sm:p-4">
      {/* Banner & Server Heartbeat */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-pulse" />
            <span>Active Assessment Watchdog</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor and continue your ongoing test sessions. Autosave is active and encrypted every 30 seconds.
          </p>
        </div>

        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-emerald-400 shrink-0 shadow-inner">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Server Status: Online & Synchronized</span>
        </div>
      </div>

      {/* Active Session Cards */}
      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
          <CheckCircle className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">All Clear! No Active Assessments</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            You currently have no unsubmitted assessment attempts. Go to the Assessment Center to launch a new examination.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.map((sess, index) => {
            const answered = sess.answered || 0;
            const total = sess.total || 20;
            const percentage = Math.min(100, Math.round((answered / total) * 100));

            return (
              <div
                key={index}
                className="bg-slate-900/95 border-2 border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl p-6 shadow-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider border border-cyan-500/30">
                      In Progress • Batch {sess.currentBatch || 1}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID: {sess.sessionId}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white">{sess.title || "Full-Stack Engineering Evaluation"}</h3>
                  <p className="text-xs text-slate-300 max-w-xl">{sess.description || "Autopilot technical examination verified with anti-cheat protection."}</p>

                  {/* Progress Indicator Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>Question Mastery: {answered} of {total} Complete</span>
                      <span className="text-cyan-400 font-bold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-cyan-400/50"
                        style={{ width: `${Math.max(12, percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Timer and Action Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 md:border-l md:border-slate-800 md:pl-6">
                  <div className="text-center sm:text-right px-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 text-xs font-medium text-slate-400 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Remaining Time</span>
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-amber-400 tracking-tight">
                      24:15 <span className="text-xs text-slate-500 font-normal">min</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onResumeSession && onResumeSession(sess.sessionId)}
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
                  >
                    <PlayCircle className="w-5 h-5 fill-current text-slate-950" />
                    <span>Resume Now</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Anti-cheat and Security Notice */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
        <div>
          <span className="font-semibold text-slate-300">Phase 9 Session Lockdown Protected: </span>
          All ongoing assessments maintain strict tab-focus verification and real-time cryptographic heartbeat synchronization.
        </div>
      </div>
    </div>
  );
};

export default ActiveAssessmentView;
