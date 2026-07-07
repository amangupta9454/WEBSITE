import React from 'react';
import { LayoutList } from 'lucide-react';

export default function StagePerformanceCard({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <LayoutList className="text-indigo-500" /> Stage Performance
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {data.map((stage, i) => {
          // If we have timestamps, calculate duration. If not, just show stage name.
          return (
            <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400 group-hover:bg-indigo-500 transition-colors"></div>
              <div className="pl-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Stage {i + 1}</p>
                <h4 className="font-bold text-slate-800 mb-2 truncate">{stage.stage}</h4>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>{new Date(stage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Complete</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
