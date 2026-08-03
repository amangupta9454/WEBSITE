import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Database, Award, Cpu, FileText, Upload, AlertOctagon, 
  BarChart, Sparkles, HelpCircle, Loader2, CheckCircle 
} from "lucide-react";

const QuestionAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("mostUsed"); // 'mostUsed' | 'unused'

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("/api/admin/assessment/analytics/questions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load question analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs font-semibold">Scanning repository question bank inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Question Bank Inventory & Intelligence Telemetry
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only analytical surveillance over question source origin distributions, quality score indices, and usage frequency auditing.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold">
          <Award className="w-4 h-4 text-emerald-600" />
          Average Quality Index: <strong className="text-sm font-black">{stats.qualityScore}%</strong>
        </div>
      </div>

      {/* Inventory Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Approved Active
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{stats.inventory?.approved || 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Archived</div>
          <div className="text-2xl font-black text-slate-600 mt-1">{stats.inventory?.archived || 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Rejected</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.inventory?.rejected || 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-500" /> Duplicates Blocked
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.inventory?.duplicates || 0}</div>
        </div>
      </div>

      {/* Source Split & Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Source Origin */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Source Origin Split
          </span>
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" /> AI Generated (Prompt Studio)
              </span>
              <span className="text-sm font-black text-indigo-700">{stats.sourceSplit?.aiGenerated || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" /> Manual Curated
              </span>
              <span className="text-sm font-black text-slate-700">{stats.sourceSplit?.manual || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" /> CSV Bulk Imported
              </span>
              <span className="text-sm font-black text-slate-700">{stats.sourceSplit?.csv || 0}</span>
            </div>
          </div>
        </div>

        {/* Difficulty Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-black uppercase text-slate-600 tracking-wider">Difficulty Split</span>
          <div className="space-y-2">
            {Object.entries(stats.difficultySplit || {}).map(([diff, count]) => (
              <div key={diff} className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg text-xs font-semibold">
                <span className="capitalize text-slate-700">{diff}</span>
                <span className="font-black text-slate-800">{count} Qs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bloom Taxonomy Split */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-black uppercase text-slate-600 tracking-wider">Bloom Taxonomy Split</span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs font-semibold">
            {Object.entries(stats.bloomSplit || {}).map(([bloom, count]) => (
              <div key={bloom} className="flex justify-between items-center px-3 py-1.5 bg-slate-50 rounded-lg">
                <span className="capitalize text-slate-700">{bloom}</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Used vs Unused Questions Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <span className="text-sm font-black text-slate-800">Inventory Usage Audit</span>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setTab("mostUsed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "mostUsed" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Most Used Questions
            </button>
            <button 
              onClick={() => setTab("unused")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "unused" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Unused Inventory (Zero Attempts)
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-2">
          {(tab === "mostUsed" ? stats.mostUsedQuestions : stats.unusedQuestions || []).map((q) => (
            <div key={q.id} className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{q.text}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">{q.difficulty}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{q.bloomLevel}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Source: {q.source} • Quality: {q.qualityScore}%</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Times Served</div>
                <div className="text-sm font-black text-indigo-600">{q.usageCount}</div>
              </div>
            </div>
          ))}
          {(tab === "mostUsed" ? stats.mostUsedQuestions : stats.unusedQuestions || []).length === 0 && (
            <p className="text-center py-8 text-xs font-semibold text-slate-400">No matching questions in this category.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionAnalytics;
