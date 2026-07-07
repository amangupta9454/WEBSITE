import React from 'react';
import { Briefcase, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';

export default function CommitteeDecisionCard({ data }) {
  if (!data) return null;

  const isHire = String(data.committee_decision).includes('Hire') && !String(data.committee_decision).includes('No');
  
  const getVoteColor = (vote) => {
    const v = String(vote).toLowerCase();
    if (v.includes('strong hire')) return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    if (v.includes('hire') && !v.includes('no')) return 'text-emerald-600 bg-emerald-50/50 border-emerald-100';
    if (v.includes('lean hire')) return 'text-lime-600 bg-lime-50 border-lime-100';
    if (v.includes('strong no hire')) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (v.includes('no hire')) return 'text-red-500 bg-red-50 border-red-100';
    return 'text-slate-500 bg-slate-50 border-slate-200';
  };

  return (
    <div className="bg-slate-900 rounded-2xl border-2 border-slate-800 p-6 md:p-8 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
        <Briefcase className="text-indigo-400" size={28} /> Hiring Committee Decision
      </h3>

      {/* Voting Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2">Sarah's Vote (HR)</p>
          <div className={`px-3 py-1.5 rounded-md inline-block text-sm font-black border ${getVoteColor(data.sarah_vote)}`}>
            {data.sarah_vote || "Abstain"}
          </div>
        </div>
        
        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-2">David's Vote (Tech)</p>
          <div className={`px-3 py-1.5 rounded-md inline-block text-sm font-black border ${getVoteColor(data.david_vote)}`}>
            {data.david_vote || "Abstain"}
          </div>
        </div>

        <div className={`p-5 rounded-xl border-2 backdrop-blur-sm flex flex-col justify-center ${isHire ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-rose-900/30 border-rose-500/50'}`}>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">Final Consensus</p>
          <p className={`text-2xl font-black ${isHire ? 'text-emerald-400' : 'text-rose-400'}`}>
            {data.committee_decision || "Pending"}
          </p>
        </div>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 relative z-10 mb-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Committee Summary</p>
        <p className="text-sm md:text-base font-medium text-slate-200 leading-relaxed italic mb-6">
          "{data.committee_summary}"
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700/50">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Risk Assessment</p>
            <p className={`text-sm font-bold ${data.risk_assessment?.includes('High') ? 'text-red-400' : 'text-emerald-400'}`}>{data.risk_assessment || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Technical Bar</p>
            <p className="text-sm font-bold text-white">{data.technical_bar || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Behavioral Bar</p>
            <p className="text-sm font-bold text-white">{data.behavioral_bar || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Production Readiness</p>
            <p className="text-sm font-bold text-white">{data.production_readiness || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Supporting Reasons</p>
        <ul className="space-y-3">
          {data.reasons?.map((r, i) => (
            <li key={i} className="text-sm text-slate-300 flex items-start gap-3">
              <ArrowRight size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
