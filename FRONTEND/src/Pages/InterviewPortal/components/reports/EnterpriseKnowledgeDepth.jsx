import React from 'react';
import { Layers } from 'lucide-react';

export default function EnterpriseKnowledgeDepth({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Layers className="text-indigo-500" /> Knowledge Depth Graph
      </h3>

      <div className="space-y-4">
        {data.map((item, i) => {
          const depthLower = item.depth.toLowerCase();
          let depthColor = "bg-slate-100 text-slate-600";
          let dots = 1;
          
          if (depthLower.includes('expert')) {
            depthColor = "bg-purple-100 text-purple-700 border-purple-200";
            dots = 4;
          } else if (depthLower.includes('deep')) {
            depthColor = "bg-indigo-100 text-indigo-700 border-indigo-200";
            dots = 3;
          } else if (depthLower.includes('working')) {
            depthColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
            dots = 2;
          } else if (depthLower.includes('surface')) {
            depthColor = "bg-amber-100 text-amber-700 border-amber-200";
            dots = 1;
          }

          return (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 gap-4">
              <div className="flex-1">
                <p className="text-sm font-black text-slate-800">{item.topic}</p>
                <p className="text-xs text-slate-500 mt-1 italic">"{item.evidence}"</p>
              </div>
              
              <div className="flex flex-col items-end shrink-0">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${depthColor} mb-2`}>
                  {item.depth}
                </span>
                <div className="flex gap-1">
                  {[...Array(4)].map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-2 h-2 rounded-full ${idx < dots ? (dots === 4 ? 'bg-purple-500' : dots === 3 ? 'bg-indigo-500' : dots === 2 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
