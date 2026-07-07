import React from 'react';
import { Activity, Clock, MessageSquare, AlertCircle } from 'lucide-react';

export default function PerformanceAnalyticsCard({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Activity className="text-indigo-500" /> Performance Analytics
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Questions Asked</p>
          <p className="text-2xl font-black text-slate-700">{data.questions_asked || 0}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Avg Answer Length</p>
          <p className="text-xl font-black text-slate-700">{data.average_answer_length || '0s'}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Interruptions</p>
          <p className="text-2xl font-black text-slate-700">{data.interruptions || 0}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Tech / Behavior Ratio</p>
          <p className="text-xl font-black text-slate-700">{data.technical_vs_behaviour_ratio || '50/50'}</p>
        </div>
      </div>
    </div>
  );
}
