import React from 'react';
import { User, MessageCircle, Heart, Star, Shield, TrendingUp, AlertCircle } from 'lucide-react';

export default function SarahReportCard({ data }) {
  if (!data) return null;

  const metrics = [
    { label: 'Communication', score: data.communication },
    { label: 'Leadership', score: data.leadership },
    { label: 'Behaviour', score: data.behaviour },
    { label: 'Confidence', score: data.confidence },
    { label: 'Culture Fit', score: data.culture_fit },
    { label: 'Teamwork', score: data.teamwork },
    { label: 'Ownership', score: data.ownership }
  ];

  return (
    <div className="bg-indigo-50/50 rounded-2xl border-2 border-indigo-100 p-6 shadow-sm">
      <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-2">
        <User className="text-indigo-500" /> Sarah (HR / Behavioral) Feedback
      </h3>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white p-3 rounded-xl border border-indigo-50 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">{m.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-indigo-900">{m.score || 0}<span className="text-xs text-indigo-300">/10</span></span>
              <div className={`w-2 h-2 rounded-full ${m.score >= 8 ? 'bg-emerald-400' : m.score >= 6 ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp size={14} /> Positive Signals
          </h4>
          <ul className="space-y-2">
            {data.positive_signals?.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border border-indigo-50 shadow-sm">{s}</li>
            ))}
            {!data.positive_signals?.length && <li className="text-sm text-slate-400 italic">None highlighted.</li>}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle size={14} /> Behavioral Concerns
          </h4>
          <ul className="space-y-2">
            {data.concerns?.map((c, i) => (
              <li key={i} className="text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border border-rose-50 shadow-sm">{c}</li>
            ))}
            {!data.concerns?.length && <li className="text-sm text-slate-400 italic">No concerns noted.</li>}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4">Strengths (Evidence-Based)</h4>
          <div className="space-y-4">
            {data.strengths?.map((s, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-emerald-50 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                <p className="text-sm font-bold text-slate-800 mb-1">{typeof s === 'string' ? s : s.observed_issue}</p>
                {typeof s === 'object' && s.impact && <p className="text-xs text-slate-600 mb-2"><span className="font-semibold">Impact:</span> {s.impact}</p>}
                {typeof s === 'object' && s.recommendation && <p className="text-xs text-emerald-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50"><span className="font-semibold">Note:</span> {s.recommendation}</p>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-4">Areas for Growth (Evidence-Based)</h4>
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
          </div>
        </div>
      </div>
    </div>
  );
}
