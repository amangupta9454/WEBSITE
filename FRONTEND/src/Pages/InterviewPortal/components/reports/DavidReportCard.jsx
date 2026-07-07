import React from 'react';
import { User, Code2, Database, ShieldAlert, Cpu, Network, Server, TrendingUp, AlertCircle } from 'lucide-react';

export default function DavidReportCard({ data }) {
  if (!data) return null;

  const metrics = [
    { label: 'Technical Depth', score: data.technical_depth, icon: <Code2 size={12} /> },
    { label: 'Problem Solving', score: data.problem_solving, icon: <Cpu size={12} /> },
    { label: 'Coding Fundamentals', score: data.coding_fundamentals, icon: <Code2 size={12} /> },
    { label: 'Architecture', score: data.architecture, icon: <Server size={12} /> },
    { label: 'System Design', score: data.system_design, icon: <Network size={12} /> },
    { label: 'API Design', score: data.api_design, icon: <Network size={12} /> },
    { label: 'Database Knowledge', score: data.database_knowledge, icon: <Database size={12} /> },
    { label: 'Security Awareness', score: data.security_awareness, icon: <ShieldAlert size={12} /> }
  ];

  return (
    <div className="bg-emerald-50/50 rounded-2xl border-2 border-emerald-100 p-6 shadow-sm">
      <h3 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-2">
        <User className="text-emerald-500" /> David (Tech Lead) Feedback
      </h3>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white p-3 rounded-xl border border-emerald-50 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              {m.icon} {m.label}
            </p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-emerald-900">{m.score || 0}<span className="text-xs text-emerald-300">/10</span></span>
              <div className={`w-2 h-2 rounded-full ${m.score >= 8 ? 'bg-emerald-400' : m.score >= 6 ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp size={14} /> Technical Strengths
          </h4>
          <ul className="space-y-2">
            {data.strengths?.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border border-emerald-50 shadow-sm">{s}</li>
            ))}
            {!data.strengths?.length && <li className="text-sm text-slate-400 italic">None highlighted.</li>}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle size={14} /> Knowledge Gaps
          </h4>
          <ul className="space-y-2">
            {data.knowledge_gaps?.map((g, i) => (
              <li key={i} className="text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border border-amber-50 shadow-sm">{g}</li>
            ))}
            {!data.knowledge_gaps?.length && <li className="text-sm text-slate-400 italic">No gaps noted.</li>}
          </ul>
        </div>
      </div>
      
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">General Weaknesses</h4>
        <ul className="list-disc pl-4 space-y-1 mb-2">
          {data.weaknesses?.map((w, i) => <li key={i} className="text-sm text-slate-600">{w}</li>)}
          {!data.weaknesses?.length && <li className="text-sm text-slate-400 italic">None highlighted.</li>}
        </ul>
      </div>
    </div>
  );
}
