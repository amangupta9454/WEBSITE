import React from 'react';
import { Map, Flag, Compass, BookMarked, Code2 } from 'lucide-react';

export default function ImprovementRoadmapCard({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Map className="text-indigo-500" /> Improvement Roadmap
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-indigo-50/30 p-5 rounded-xl border border-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-3">30 Day Plan</h4>
          <ul className="space-y-2">
            {data.day_30?.map((item, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-indigo-400 mt-1">•</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-3">60 Day Plan</h4>
          <ul className="space-y-2">
            {data.day_60?.map((item, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-purple-50/30 p-5 rounded-xl border border-purple-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-400"></div>
          <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-wider mb-3">90 Day Plan</h4>
          <ul className="space-y-2">
            {data.day_90?.map((item, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookMarked size={14} className="text-indigo-400" /> Resources
          </h4>
          <ul className="space-y-2">
            {data.resources?.map((r, i) => (
              <li key={i} className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Code2 size={14} className="text-emerald-400" /> Practice Areas
          </h4>
          <ul className="space-y-2">
            {data.practice_areas?.map((p, i) => (
              <li key={i} className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Code2 size={14} className="text-amber-400" /> Projects
          </h4>
          <ul className="space-y-2">
            {data.projects?.map((p, i) => (
              <li key={i} className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookMarked size={14} className="text-rose-400" /> Books
          </h4>
          <ul className="space-y-2">
            {data.books?.map((b, i) => (
              <li key={i} className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{b}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
