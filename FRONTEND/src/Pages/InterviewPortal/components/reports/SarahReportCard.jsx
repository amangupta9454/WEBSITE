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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">Strengths</h4>
          <ul className="list-disc pl-4 space-y-1">
            {data.strengths?.map((s, i) => <li key={i} className="text-sm text-slate-600">{s}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">Areas for Growth</h4>
          <ul className="list-disc pl-4 space-y-1">
            {data.weaknesses?.map((w, i) => <li key={i} className="text-sm text-slate-600">{w}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
