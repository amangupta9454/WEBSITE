import React from 'react';
import { FileText, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function ResumeVerificationCard({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <FileText className="text-indigo-500" /> Resume Verification Matrix
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Skill</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Evidence Found</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, i) => {
              // Map legacy format (skill, confidence, etc) to new UI
              const status = item.confidence > 0.8 ? 'Verified' : item.confidence > 0.4 ? 'Partial' : 'Missing';
              
              return (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-black text-slate-700">{item.skill}</td>
                  <td className="py-3 px-4">
                    {status === 'Verified' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"><CheckCircle2 size={12} /> Verified</span>}
                    {status === 'Partial' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200"><AlertCircle size={12} /> Partial</span>}
                    {status === 'Missing' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200"><XCircle size={12} /> Missing</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-bold text-slate-600">{(item.confidence * 100).toFixed(0)}%</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 hidden md:table-cell italic max-w-xs truncate">
                    "{item.evidence}"
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
