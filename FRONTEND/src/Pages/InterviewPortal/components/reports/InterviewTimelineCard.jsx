import React from 'react';
import { History, Activity, AlertTriangle } from 'lucide-react';

export default function InterviewTimelineCard({ data }) {
  if (!data || data.length === 0) return null;

  const getDifficultyColor = (diff) => {
    const d = String(diff).toLowerCase();
    if (d.includes('easy')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (d.includes('medium')) return 'text-amber-600 bg-amber-50 border-amber-100';
    if (d.includes('hard')) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (d.includes('bar raiser')) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-slate-600 bg-slate-50 border-slate-100';
  };

  const getPerformanceColor = (perf) => {
    const p = String(perf).toLowerCase();
    if (p.includes('excellent') || p.includes('good')) return 'text-emerald-600';
    if (p.includes('poor') || p.includes('struggle')) return 'text-rose-600';
    return 'text-amber-600';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 relative overflow-hidden">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <History className="text-indigo-500" /> Interview Timeline
      </h3>
      
      <div className="relative border-l-2 border-slate-100 ml-3 md:ml-4 space-y-8 pb-4">
        {data.map((event, i) => (
          <div key={i} className="relative pl-6 md:pl-8">
            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${event.speaker === 'Sarah' ? 'bg-indigo-400' : event.speaker === 'David' ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{event.time}</span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${event.speaker === 'Sarah' ? 'text-indigo-600' : event.speaker === 'David' ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {event.speaker}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getDifficultyColor(event.difficulty)}`}>
                    {event.difficulty}
                  </span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-bold text-slate-800 mb-1">{event.question}</p>
                <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3">"{event.candidate_summary}"</p>
              </div>
              
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                <Activity size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Performance:</span>
                <span className={`text-xs font-bold ${getPerformanceColor(event.performance)}`}>{event.performance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
