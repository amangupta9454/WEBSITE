import React from 'react';
import { BookOpen, Target, Clock, AlertTriangle } from 'lucide-react';

export default function KnowledgeGapCard({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <BookOpen className="text-indigo-500" /> Knowledge Gap Analysis
      </h3>
      
      <div className="space-y-4">
        {data.map((gap, i) => (
          <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="font-black text-indigo-900">{gap.concept}</h4>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${gap.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-200' : gap.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                {gap.priority} Priority
              </span>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">{gap.revise}</p>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-100">
                <Target size={14} className="text-indigo-400" /> {gap.learning_path}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-100">
                <Clock size={14} className="text-emerald-400" /> {gap.estimated_time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
