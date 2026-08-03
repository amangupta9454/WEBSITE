import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Cpu, Zap, Activity, ShieldAlert, RefreshCw, AlertTriangle, 
  CheckCircle, Clock, Server, Loader2, BarChart3 
} from "lucide-react";

const RuntimeAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRuntimeTelemetry = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/assessment/analytics/runtime", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch runtime telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuntimeTelemetry();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs font-semibold">Connecting to multi-provider AI runtime telemetric stream...</p>
      </div>
    );
  }

  const totalCalls = Object.values(data.providerUsage || {}).reduce((a, b) => a + b, 0) || 1;
  const groqShare = Math.round(((data.providerUsage?.Groq || 0) / totalCalls) * 100);
  const openAIShare = Math.round(((data.providerUsage?.OpenAI || 0) / totalCalls) * 100);
  const geminiShare = Math.round(((data.providerUsage?.Gemini || 0) / totalCalls) * 100);
  const claudeShare = Math.round(((data.providerUsage?.Claude || 0) / totalCalls) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            AI Runtime Multi-Provider Telemetry & Health
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only surveillance monitoring SLA latency boundaries, rate limit mitigation (HTTP 429), and automatic fallback circuit execution across LLM clusters.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-200 text-xs font-black shadow-2xs">
          <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
          Runtime Cluster Health: <span className="text-sm font-black">{data.healthPercentage}%</span>
        </div>
      </div>

      {/* Top SLA & Error Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" /> Average SLA Latency
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{data.averageLatencyMs} <span className="text-xs font-bold text-slate-500">ms</span></div>
          <span className="text-[10px] text-emerald-600 font-semibold">Well below &lt; 2000ms target</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Automatic Retries
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{data.retries}</div>
          <span className="text-[10px] text-slate-400 font-semibold">Recovered via exponential backoff</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Circuit Failovers
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{data.failovers}</div>
          <span className="text-[10px] text-amber-700/80 font-semibold">Transparent provider redirection</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> 429 Rate Limits / Timeouts
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">{data.rateLimits429} / {data.timeouts}</div>
          <span className="text-[10px] text-rose-500 font-semibold">Mitigated by Token Budgeting</span>
        </div>
      </div>

      {/* Provider Usage Distribution */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="font-black text-slate-800 text-base">Multi-Provider Execution Distribution</h4>
            <p className="text-xs text-slate-400">Total runtime executions logged across active conversational model pipelines: <strong className="text-slate-700">{data.totalExecutions}</strong></p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
            Groq LPU Principal Active
          </span>
        </div>

        {/* Horizontal Stacked Bar Representation */}
        <div className="h-8 w-full rounded-xl bg-slate-100 overflow-hidden flex shadow-inner border border-slate-200/60">
          <div 
            style={{ width: `${Math.max(5, groqShare)}%` }} 
            className="bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center text-[11px] font-black text-white overflow-hidden" 
            title={`Groq: ${groqShare}%`}
          >
            {groqShare > 15 && `Groq (${groqShare}%)`}
          </div>
          <div 
            style={{ width: `${Math.max(3, openAIShare)}%` }} 
            className="bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center text-[10px] font-bold text-white overflow-hidden" 
            title={`OpenAI: ${openAIShare}%`}
          >
            {openAIShare > 5 && `OAI (${openAIShare}%)`}
          </div>
          <div 
            style={{ width: `${Math.max(3, geminiShare)}%` }} 
            className="bg-amber-500 hover:bg-amber-600 transition-all flex items-center justify-center text-[10px] font-bold text-white overflow-hidden" 
            title={`Gemini: ${geminiShare}%`}
          >
            {geminiShare > 5 && `Gem`}
          </div>
          <div 
            style={{ width: `${Math.max(3, claudeShare)}%` }} 
            className="bg-purple-600 hover:bg-purple-700 transition-all flex items-center justify-center text-[10px] font-bold text-white overflow-hidden" 
            title={`Claude: ${claudeShare}%`}
          >
            {claudeShare > 5 && `Cld`}
          </div>
        </div>

        {/* Detailed Provider Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 flex flex-col justify-between">
            <div>
              <div className="text-xs font-black text-indigo-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" /> Groq LPU Cluster
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Primary lightning-fast inference engine for interactive evaluation sessions.</p>
            </div>
            <div className="mt-4 flex justify-between items-end border-t border-indigo-100/60 pt-3">
              <span className="text-xl font-black text-indigo-700">{data.providerUsage?.Groq || 0}</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">{groqShare}% Share</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col justify-between">
            <div>
              <div className="text-xs font-black text-emerald-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" /> OpenAI GPT-4o
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Secondary fallback layer for complex rubric rationale evaluation.</p>
            </div>
            <div className="mt-4 flex justify-between items-end border-t border-emerald-100/60 pt-3">
              <span className="text-xl font-black text-emerald-700">{data.providerUsage?.OpenAI || 0}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{openAIShare}% Share</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col justify-between">
            <div>
              <div className="text-xs font-black text-amber-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-600" /> Google Gemini Pro
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Tertiary failover provider ensuring regional resilience and token redundancy.</p>
            </div>
            <div className="mt-4 flex justify-between items-end border-t border-amber-100/60 pt-3">
              <span className="text-xl font-black text-amber-700">{data.providerUsage?.Gemini || 0}</span>
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">{geminiShare}% Share</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col justify-between">
            <div>
              <div className="text-xs font-black text-purple-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-600" /> Anthropic Claude 3
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Deep architectural synthesis provider for complex multi-step reasoning.</p>
            </div>
            <div className="mt-4 flex justify-between items-end border-t border-purple-100/60 pt-3">
              <span className="text-xl font-black text-purple-700">{data.providerUsage?.Claude || 0}</span>
              <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">{claudeShare}% Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuntimeAnalytics;
