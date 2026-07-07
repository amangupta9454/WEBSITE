import React from 'react';
import { Activity } from 'lucide-react';

export default function EnterpriseSkillHeatmap({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Activity className="text-indigo-500" /> Skill Heatmap
      </h3>

      <div className="space-y-5">
        {data.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-bold text-slate-700">{item.category}</span>
              <span className="text-xs font-black text-slate-500">{item.score}/10</span>
            </div>
            
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
              {[...Array(10)].map((_, index) => (
                <div 
                  key={index} 
                  className={`flex-1 h-full ${index < item.score ? (item.score > 7 ? 'bg-indigo-500' : item.score > 4 ? 'bg-amber-400' : 'bg-rose-400') : 'bg-transparent'} border-r border-slate-100 last:border-0 opacity-90`}
                />
              ))}
            </div>
            
            <p className="text-xs text-slate-500 mt-2 italic truncate" title={item.evidence}>
              "{item.evidence}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
