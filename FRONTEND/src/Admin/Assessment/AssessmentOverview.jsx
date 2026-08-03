import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FolderTree,
  Layers,
  Database,
  Cpu,
  Award,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  PlusCircle
} from "lucide-react";

const AssessmentOverview = ({ onNavigate, onLaunchWizard }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("/api/admin/assessment/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Failed to load assessment dashboard analytics:", err);
      setError("Failed to synchronize with live database metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-800">Assessment Operations Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live database-driven inventory tracking and GroqManager AI health telemetry.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold rounded-xl text-xs transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => onNavigate("wizard")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-indigo-200 hover:shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch Category Wizard</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Categories */}
        <div 
          onClick={() => onNavigate("categories")}
          className="bg-white hover:border-indigo-300 border border-slate-200 rounded-2xl p-5 shadow-xs cursor-pointer transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Categories</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{stats?.totalCategories ?? 0}</div>
          <p className="text-xs text-indigo-600 font-medium mt-2 flex items-center gap-1">
            <span>Manage inventory hierarchies</span>
            <span>&rarr;</span>
          </p>
        </div>

        {/* Total Subcategories */}
        <div 
          onClick={() => onNavigate("subcategories")}
          className="bg-white hover:border-blue-300 border border-slate-200 rounded-2xl p-5 shadow-xs cursor-pointer transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Subcategories</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{stats?.totalSubcategories ?? 0}</div>
          <p className="text-xs text-slate-500 mt-2">
            Linked to AI blueprints & configs
          </p>
        </div>

        {/* Total Questions & Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs sm:col-span-2">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Question Bank Inventory</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-black text-slate-800">{stats?.totalQuestions ?? 0}</div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                AI: {stats?.questionSources?.ai ?? 0}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                Manual: {stats?.questionSources?.manual ?? 0}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                CSV: {stats?.questionSources?.csv ?? 0}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden flex">
            <div className="bg-indigo-600 h-full" style={{ width: `${Math.min(100, ((stats?.questionSources?.ai ?? 0) / Math.max(1, stats?.totalQuestions ?? 1)) * 100)}%` }}></div>
            <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, ((stats?.questionSources?.manual ?? 0) / Math.max(1, stats?.totalQuestions ?? 1)) * 100)}%` }}></div>
            <div className="bg-purple-500 h-full" style={{ width: `${Math.min(100, ((stats?.questionSources?.csv ?? 0) / Math.max(1, stats?.totalQuestions ?? 1)) * 100)}%` }}></div>
          </div>
        </div>

        {/* AI Background Jobs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending / Running AI Jobs</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-2xl font-black text-slate-800">
            <span>{stats?.aiJobs?.pending ?? 0}</span>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-600">{stats?.aiJobs?.running ?? 0}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Worker queues active</span>
          </p>
        </div>

        {/* Certificates Issued */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Certificates Issued</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{stats?.certificatesIssued ?? 0}</div>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Publicly verifiable IDs</span>
          </p>
        </div>

        {/* Assessments Completed & Pass Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs sm:col-span-2">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assessment Success Rate</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-black text-slate-800">{stats?.assessments?.completed ?? 0} <span className="text-xs font-medium text-slate-400">Completed</span></div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Pass: {stats?.assessments?.passRate ?? 0}%
              </span>
              <span className="text-rose-600 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" /> Fail: {stats?.assessments?.failRate ?? 0}%
              </span>
            </div>
          </div>
          <div className="w-full bg-rose-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${stats?.assessments?.passRate ?? 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Live AI Status Module */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider mb-2">
              <Zap className="w-3 h-3 text-indigo-400 fill-indigo-400" />
              <span>Live Telemetry</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">GroqManager AI Key Pool Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Round-robin traffic balancer with automated cooldown recovery and real-time latency monitoring.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate && onNavigate("ai_config")}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
            >
              <Cpu className="w-4 h-4 text-purple-200" /> Launch Prompt Studio
            </button>
            <div className="text-right border-l border-slate-700 pl-4 hidden sm:block">
              <span className="text-xs font-medium text-slate-400 block">Active Pool Health</span>
              <span className="text-lg font-black text-emerald-400">
                {stats?.liveAiStatus?.healthyKeys ?? 0} / {stats?.liveAiStatus?.totalKeys ?? 0} Ready
              </span>
            </div>
          </div>
        </div>

        {/* Key table inside card */}
        <div className="relative z-10">
          {stats?.liveAiStatus?.poolDetails && stats.liveAiStatus.poolDetails.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {stats.liveAiStatus.poolDetails.map((k) => (
                <div key={k.index} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">GROQ_KEY_{k.index}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${k.status === "healthy" ? "bg-emerald-400 shadow-xs shadow-emerald-400" : "bg-amber-400 animate-pulse"}`}></span>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Reqs Handled:</span>
                      <span className="font-semibold text-slate-200">{k.totalRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failures:</span>
                      <span className={`font-semibold ${k.totalFailures > 0 ? "text-rose-400" : "text-slate-400"}`}>{k.totalFailures}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 text-center border border-slate-800 rounded-2xl bg-slate-800/30">
              <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-200">AI Pool Ready for Initialization</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Configure GROQ_KEY_1 to GROQ_KEY_10 in your backend production environment to begin live generation.
              </p>
            </div>
          )}
        </div>
        <Cpu className="absolute right-4 -bottom-8 w-60 h-60 text-indigo-500/5 pointer-events-none" />
      </div>
    </div>
  );
};

export default AssessmentOverview;
