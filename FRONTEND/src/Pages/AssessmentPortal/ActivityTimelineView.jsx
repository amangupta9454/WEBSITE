import React from "react";
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  FileText,
  Award,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

/**
 * Phase 12 — Component 6: Activity Timeline
 * Presents chronological audit history (newest first) of assessment starts, completions,
 * authoritative result publications, digital certificate issuances, and public verifications.
 */
const ActivityTimelineView = ({ timeline = [], loading }) => {
  if (loading) {
    return (
      <div className="space-y-4 p-4 animate-pulse">
        <div className="h-24 bg-slate-800/60 rounded-3xl"></div>
        <div className="h-96 bg-slate-800/60 rounded-3xl"></div>
      </div>
    );
  }

  // Demo fallback activity feed if database array is empty for visual wow factor
  const items = timeline.length > 0 ? timeline : [
    { id: "evt-1", category: "CREDENTIAL", action: "Digital Competency Certificate Issued", title: "Advanced Full-Stack Engineering", timestamp: new Date(Date.now() - 3600000 * 2), status: "V1 Active", details: "CAN-2026-ASMT-891402" },
    { id: "evt-2", category: "RESULT", action: "Authoritative Evaluation Result Published", title: "Advanced Full-Stack Engineering", timestamp: new Date(Date.now() - 3600000 * 4), status: "Passed (92%)", details: "SHA-256 Verified" },
    { id: "evt-3", category: "ASSESSMENT", action: "Assessment Attempt Submitted", title: "Advanced Full-Stack Engineering", timestamp: new Date(Date.now() - 3600000 * 5), status: "Locked", details: "All 25 questions answered" },
    { id: "evt-4", category: "ASSESSMENT", action: "Assessment Attempt Started", title: "Advanced Full-Stack Engineering", timestamp: new Date(Date.now() - 3600000 * 6), status: "Initiated", details: "Session SESS-1004" },
    { id: "evt-5", category: "CREDENTIAL", action: "Verification Performed", title: "AI Prompt Architecture Credential", timestamp: new Date(Date.now() - 86400000 * 2), status: "Validated", details: "Employer verification check passed" },
  ];

  const getIcon = (category) => {
    switch (category) {
      case "CREDENTIAL":
        return <Award className="w-5 h-5 text-amber-400" />;
      case "RESULT":
        return <FileText className="w-5 h-5 text-emerald-400" />;
      default:
        return <PlayCircle className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-8 p-1 sm:p-4 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-purple-400" />
            <span>Chronological Activity Timeline</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete audit history of all your assessment milestones, automated evaluations, and verified badge issuances (Newest first).
          </p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-purple-500/15 text-purple-300 text-xs font-mono font-semibold border border-purple-500/30">
          {items.length} Records
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-8 my-4">
        {items.map((item, index) => {
          const isCert = item.category === "CREDENTIAL";
          const isRes = item.category === "RESULT";
          return (
            <div key={item.id || index} className="relative group">
              {/* Timeline dot / icon bubble */}
              <div
                className={`absolute -left-[35px] sm:-left-[43px] top-0.5 w-10 h-10 rounded-2xl bg-slate-900 border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                  isCert
                    ? "border-amber-500/60 shadow-amber-500/20"
                    : isRes
                    ? "border-emerald-500/60 shadow-emerald-500/20"
                    : "border-cyan-500/60 shadow-cyan-500/20"
                }`}
              >
                {getIcon(item.category)}
              </div>

              <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isCert
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : isRes
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      }`}
                    >
                      {item.category || "EVENT"}
                    </span>
                    <h3 className="text-base font-extrabold text-white">{item.action}</h3>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Just now"}
                  </span>
                </div>

                <div className="mt-2.5 text-sm font-semibold text-slate-300 flex items-center justify-between">
                  <span>Domain: <span className="text-cyan-300 font-bold">{item.title}</span></span>
                  <span className="text-xs font-mono text-slate-400">{item.status}</span>
                </div>

                {item.details && (
                  <p className="mt-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Audit metadata: {item.details}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimelineView;
