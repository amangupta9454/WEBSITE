import React from 'react';
import { Target, Award, Clock, Calendar } from 'lucide-react';

const CircularScore = ({ score, max = 100, label, colorClass, bgClass, textClass }) => {
  const percentage = (score / max) * 100;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center p-5 rounded-3xl border ${bgClass} border-opacity-60 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${textClass} z-10 opacity-80`}>{label}</p>
      <div className="relative w-24 h-24 flex items-center justify-center z-10">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} className="text-white/50" strokeWidth="8" stroke="currentColor" fill="transparent" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <span className={`absolute text-2xl font-black ${textClass} drop-shadow-sm`}>{score}</span>
      </div>
    </div>
  );
};

export default function ExecutiveSummaryCard({ data, session }) {
  if (!data) return null;
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-1">
            <Target className="text-indigo-400" /> Executive Summary
          </h2>
          <p className="text-slate-400 text-sm">Enterprise Hiring Committee Analysis</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-slate-300 text-sm font-bold">{session?.jobTitle}</p>
          <p className="text-slate-500 text-xs">{new Date(session?.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <CircularScore 
            score={data.overall_score || 0} 
            max={100}
            label="Overall Score" 
            colorClass="text-indigo-500" 
            bgClass="bg-indigo-50 border-indigo-100" 
            textClass="text-indigo-900" 
          />
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl border bg-slate-50 border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Recommendation</p>
            <p className={`text-2xl font-black text-center ${String(data.hiring_recommendation).includes('Hire') && !String(data.hiring_recommendation).includes('No') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {data.hiring_recommendation || "N/A"}
            </p>
          </div>
          <CircularScore 
            score={data.overall_confidence_percent || 0} 
            max={100}
            label="AI Confidence" 
            colorClass="text-emerald-500" 
            bgClass="bg-emerald-50 border-emerald-100" 
            textClass="text-emerald-900" 
          />
        </div>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Committee Summary</h3>
          <p className="text-slate-700 font-medium leading-relaxed italic">"{data.short_ai_summary}"</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Clock size={16} className="text-indigo-500" />
            <span className="font-bold">{session?.durationMinutes || 0}</span> mins
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Award size={16} className="text-indigo-500" />
            <span className="font-bold">{session?.mode || 'Panel'}</span> Interview
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Calendar size={16} className="text-indigo-500" />
            <span className="font-bold">{new Date(session?.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
