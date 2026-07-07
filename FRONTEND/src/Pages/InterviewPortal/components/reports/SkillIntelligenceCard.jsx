import React from 'react';
import { Network, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SkillIntelligenceCard({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Network className="text-indigo-500" /> Skill Intelligence
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} /> Verified Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.verified_skills?.map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-md shadow-sm">
                {skill}
              </span>
            ))}
            {!data.verified_skills?.length && <span className="text-sm text-slate-400 italic">No skills verified.</span>}
          </div>
        </div>

        <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100">
          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle size={14} /> Weak / Missing Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.weak_skills?.map((skill, i) => (
              <span key={`weak-${i}`} className="px-2 py-1 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-md shadow-sm">
                {skill} (Weak)
              </span>
            ))}
            {data.missing_skills?.map((skill, i) => (
              <span key={`missing-${i}`} className="px-2 py-1 bg-white border border-rose-200 text-rose-700 text-xs font-bold rounded-md shadow-sm">
                {skill} (Missing)
              </span>
            ))}
            {!data.weak_skills?.length && !data.missing_skills?.length && <span className="text-sm text-slate-400 italic">No weak skills identified.</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Unverified Claims</h4>
          <ul className="space-y-1">
            {data.unverified_claims?.map((claim, i) => (
              <li key={i} className="text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">{claim}</li>
            ))}
            {!data.unverified_claims?.length && <li className="text-sm text-slate-400 italic">No unverified claims.</li>}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Contradictions</h4>
          <ul className="space-y-1">
            {data.contradictions?.map((c, i) => (
              <li key={i} className="text-sm text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">{c}</li>
            ))}
            {!data.contradictions?.length && <li className="text-sm text-slate-400 italic">No contradictions found.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
