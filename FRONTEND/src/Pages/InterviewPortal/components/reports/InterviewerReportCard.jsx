import React from 'react';
import { User, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

export default function InterviewerReportCard({ data }) {
  if (!data) return null;

  // Use a default theme color if needed, or stick to indigo/slate
  const theme = "indigo";
  const bg = `bg-${theme}-50/50`;
  const border = `border-${theme}-100`;
  const textTitle = `text-${theme}-900`;
  const textIcon = `text-${theme}-500`;

  return (
    <div className={`bg-slate-50/50 rounded-2xl border-2 border-slate-200 p-6 shadow-sm`}>
      <h3 className={`text-xl font-black text-slate-800 mb-6 flex items-center gap-2`}>
        <User className="text-indigo-500" /> {data.interviewer_name || "Interviewer"} ({data.role || "Expert"}) Feedback
      </h3>

      {/* Dynamic Scores Grid */}
      {data.scores && Object.keys(data.scores).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(data.scores).map(([key, score], i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <p className={`text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1`}>
                <Sparkles size={12} className="text-indigo-400" /> {key.replace(/_/g, ' ')}
              </p>
              <div className="flex items-end justify-between">
                <span className={`text-xl font-black text-slate-800`}>{score || 0}<span className="text-xs text-slate-400">/10</span></span>
                <div className={`w-2 h-2 rounded-full ${score >= 8 ? 'bg-emerald-400' : score >= 6 ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp size={14} /> Key Strengths
          </h4>
          <div className="space-y-4">
            {data.strengths?.map((s, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-emerald-50 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                <p className="text-sm font-bold text-slate-800 mb-1">{typeof s === 'string' ? s : s.observed_issue}</p>
                {typeof s === 'object' && s.impact && <p className="text-xs text-slate-600 mb-2"><span className="font-semibold">Impact:</span> {s.impact}</p>}
                {typeof s === 'object' && s.recommendation && <p className="text-xs text-emerald-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50"><span className="font-semibold">Note:</span> {s.recommendation}</p>}
              </div>
            ))}
            {!data.strengths?.length && <p className="text-sm text-slate-400 italic">None highlighted.</p>}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle size={14} /> Areas for Growth
          </h4>
          <div className="space-y-4">
            {data.weaknesses?.map((w, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-amber-50 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                <p className="text-sm font-bold text-slate-800 mb-1">{typeof w === 'string' ? w : w.observed_issue}</p>
                {typeof w === 'object' && w.impact && <p className="text-xs text-slate-600 mb-2"><span className="font-semibold">Impact:</span> {w.impact}</p>}
                {typeof w === 'object' && w.recommendation && (
                  <div className="text-xs text-amber-800 bg-amber-50/50 p-2 rounded-lg border border-amber-100/50 flex flex-col gap-1">
                    <p><span className="font-semibold">Action:</span> {w.recommendation}</p>
                    {w.practice_resource && <p className="text-indigo-600"><span className="font-semibold">Resource:</span> {w.practice_resource}</p>}
                  </div>
                )}
              </div>
            ))}
            {!data.weaknesses?.length && <p className="text-sm text-slate-400 italic">None highlighted.</p>}
          </div>
        </div>
      </div>
      
      {data.questions_asked && data.questions_asked.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Questions Asked By {data.interviewer_name || "Interviewer"}</h4>
          <ul className="list-disc pl-4 space-y-2">
            {data.questions_asked.map((q, i) => <li key={i} className="text-sm text-slate-600 font-medium">{q}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
