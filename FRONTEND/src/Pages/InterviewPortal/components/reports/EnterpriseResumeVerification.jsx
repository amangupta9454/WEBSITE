import React from 'react';
import { FileText, CheckCircle2, AlertCircle, XCircle, Search, HelpCircle } from 'lucide-react';

export default function EnterpriseResumeVerification({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <FileText className="text-indigo-500" /> Evidence-Based Resume Verification
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tl-lg">Claim / Skill</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Status</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tr-lg">Interview Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, i) => {
              const statusLower = item.status.toLowerCase();
              let icon = <HelpCircle size={14} />;
              let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";

              if (statusLower.includes('strong evidence') || statusLower === 'verified') {
                icon = <CheckCircle2 size={14} />;
                badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
              } else if (statusLower.includes('partially') || statusLower.includes('follow-up')) {
                icon = <AlertCircle size={14} />;
                badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
              } else if (statusLower.includes('contradicted') || statusLower.includes('unsupported')) {
                icon = <XCircle size={14} />;
                badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
              }

              return (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 align-top w-1/4">
                    <span className="font-black text-slate-800">{item.skill}</span>
                  </td>
                  <td className="py-4 px-4 align-top w-1/5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${badgeClass}`}>
                      {icon} {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="flex gap-2">
                      <Search className="text-slate-400 shrink-0 mt-0.5" size={14} />
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        "{item.evidence}"
                      </p>
                    </div>
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
