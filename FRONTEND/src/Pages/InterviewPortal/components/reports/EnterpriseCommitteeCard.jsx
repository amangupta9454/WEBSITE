import React from 'react';
import { Users, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EnterpriseCommitteeCard({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 p-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Users className="text-indigo-400" /> Independent Committee Vote
        </h2>
        <p className="text-slate-400 text-sm mt-1">Enterprise Hiring Consensus</p>
      </div>
      
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Sarah Vote */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sarah (HR)</p>
            <p className="text-xl font-black text-slate-800">{data.sarah_vote}</p>
          </div>
          
          {/* David Vote */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">David (Tech Lead)</p>
            <p className="text-xl font-black text-slate-800">{data.david_vote}</p>
          </div>
          
          {/* Final Consensus */}
          <div className="p-5 rounded-2xl border-2 border-indigo-500 bg-indigo-50 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-200/50 rounded-full blur-xl -mr-4 -mt-4"></div>
            <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-2 relative z-10">Final Consensus</p>
            <p className="text-2xl font-black text-indigo-900 relative z-10">{data.final_consensus}</p>
          </div>
        </div>

        {data.disagreement_reason && (
          <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">Committee Disagreement Context</p>
              <p className="text-sm text-amber-700">{data.disagreement_reason}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
