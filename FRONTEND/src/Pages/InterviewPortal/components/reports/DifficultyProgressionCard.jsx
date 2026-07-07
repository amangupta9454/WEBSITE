import React from 'react';
import { BarChart2 } from 'lucide-react';

export default function DifficultyProgressionCard({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <BarChart2 className="text-indigo-500" /> Difficulty Progression
      </h3>

      <div className="flex flex-wrap gap-2 mb-6">
        {data.map((item, i) => {
          const diff = String(item.difficulty).toLowerCase();
          const isHard = diff.includes('hard') || diff.includes('bar');
          const isMedium = diff.includes('medium');
          
          return (
            <div key={i} className="flex items-center gap-1">
              <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex flex-col ${item.struggled ? 'bg-rose-50 border-rose-200' : isHard ? 'bg-purple-50 border-purple-200 text-purple-700' : isMedium ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <span className="opacity-60 uppercase text-[8px] mb-0.5">{item.difficulty}</span>
                <span className={item.struggled ? 'text-rose-700 line-through opacity-70' : ''}>{item.topic}</span>
              </div>
              {i < data.length - 1 && <div className="w-4 h-0.5 bg-slate-200"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
