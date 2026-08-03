import React from "react";
import {
  PlayCircle,
  Clock,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  Server,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/**
 * Resume Assessment (Part 10 — formerly Active Assessment Watchdog)
 * Displays running and suspended attempts in existing platform Light Theme.
 * Zero mock sessions; shows professional empty states when no active attempt exists.
 */
const ActiveAssessmentView = ({ activeSessions = [], onRefresh }) => {
  const navigate = useNavigate();
  
  const handleResume = (sess) => {
    toast.success(`▶️ Resuming session (${sess.sessionId || sess._id}). Loading secure terminal...`);
    navigate(`/assessment-terminal/${sess.sessionId || sess._id}`);
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-indigo-600" />
            <span>Resume Assessment</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor and continue uncompleted test sessions. Your progress and answer buffers auto-save continuously.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 shrink-0">
          <Server className="w-3.5 h-3.5" />
          <span>Autosave Watchdog Online</span>
        </div>
      </div>

      {/* Active Session Cards or Empty State */}
      {activeSessions.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm space-y-3">
          <FolderOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Active Session</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You do not have any unfinished or paused examinations. Launch a new domain test from the Assessment Center when you are ready to evaluate your mastery.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSessions.map((sess, index) => {
            const answered = sess.answeredCount || 0;
            const total = sess.totalQuestions || 20;
            const percent = Math.min(100, Math.round((answered / total) * 100));
            const remainingMins = sess.remainingSeconds ? Math.floor(sess.remainingSeconds / 60) : 25;

            return (
              <div
                key={sess._id || sess.sessionId || index}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">
                      IN PROGRESS
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400">
                      ID: {sess.sessionId || sess._id}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 leading-snug">
                    {sess.title || "Technical Competency Evaluation"}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-indigo-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{remainingMins} mins left</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Tab Protections Active</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Trigger Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="space-y-1.5 w-full sm:w-48">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Batch Progress</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResume(sess)}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Resume Attempt</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveAssessmentView;
