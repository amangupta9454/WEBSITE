import React from "react";
import {
  Clock,
  PlayCircle,
  FileText,
  Award,
  FolderOpen,
} from "lucide-react";

/**
 * Activity Timeline (Component 6)
 * Chronological audit history of candidate assessment milestones in existing Light Theme.
 * Completely zero demo fallback items; shows professional empty state when history is empty.
 */
const ActivityTimelineView = ({ timeline = [] }) => {
  const getIcon = (category) => {
    switch (category) {
      case "CREDENTIAL":
      case "CERTIFICATE_ISSUED":
        return <Award className="w-4 h-4 text-amber-600" />;
      case "RESULT":
      case "ASSESSMENT_COMPLETED":
        return <FileText className="w-4 h-4 text-emerald-600" />;
      default:
        return <PlayCircle className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in max-w-3xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-600" />
          <span>Activity Timeline</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Chronological log of your assessment submissions, authoritative results, and certificate issuances (Newest first).
        </p>
      </div>

      {/* Timeline Stream or Empty State */}
      {timeline.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm space-y-3">
          <FolderOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Activity Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your evaluation submissions and milestone events will automatically record into this immutable audit trail.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-2 sm:before:left-3.5 before:w-0.5 before:bg-slate-200">
          {timeline.map((item, idx) => (
            <div key={item._id || item.id || idx} className="relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-300 transition-all space-y-2">
              {/* Timeline dot */}
              <div className="absolute -left-[29px] sm:-left-[35px] top-5 w-7 h-7 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center shadow-xs">
                {getIcon(item.category || item.type)}
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {item.action || item.type || "Assessment Event"}
                </span>
                <span className="text-[11px] font-mono font-medium text-slate-400">
                  {item.timestamp || item.createdAt ? new Date(item.timestamp || item.createdAt).toLocaleString() : "Recent"}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900">{item.title || "Domain Examination Action"}</h3>
              <div className="text-xs text-slate-500 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
                <span>Status: <strong className="text-slate-800">{item.status || "Completed & Logged"}</strong></span>
                {item.details && <span className="font-mono text-indigo-600 text-[11px]">{item.details}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityTimelineView;
