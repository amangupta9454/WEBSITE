import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Cpu,
  Server,
  Activity,
  ShieldCheck,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Layers,
  Zap,
  Database,
  Sliders,
  HelpCircle
} from "lucide-react";

/**
 * AIRuntimeMonitor — Phase 5 AI Runtime Engine & Key Pool Router Management UI
 * Provides interactive diagnostic testing, multi-key Round-Robin observability,
 * health status supervision, error mapping verification, and real-time execution logs.
 * strictly adheres to the architectural mandate: ZERO assessment question generation during diagnostics.
 */
const AIRuntimeMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("pool"); // pool | diagnostic | logs
  
  const [poolStatus, setPoolStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [testResult, setTestResult] = useState(null);

  const fetchHealthAndLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [healthRes, logsRes] = await Promise.all([
        axios.get("/api/admin/assessment/runtime-engine/health", { headers }),
        axios.get("/api/admin/assessment/runtime-engine/logs?limit=40", { headers })
      ]);

      if (healthRes.data?.success) {
        setPoolStatus(healthRes.data.poolStatus);
        setMetrics(healthRes.data.metricsSummary);
      }
      if (logsRes.data?.success) {
        setLogs(logsRes.data.logs || []);
      }
    } catch (err) {
      console.error("Error loading Phase 5 Runtime Engine health and logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthAndLogs();
  }, []);

  const runDiagnosticTest = async (testType) => {
    setTesting(true);
    setTestResult(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.post(
        "/api/admin/assessment/runtime-engine/test",
        { testType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setTestResult(res.data.diagnosticReport);
        if (res.data.diagnosticReport?.poolHealthAfterTest) {
          setPoolStatus((prev) => ({
            ...prev,
            groqPoolDetails: res.data.diagnosticReport.poolHealthAfterTest
          }));
        }
        await fetchHealthAndLogs(true);
      }
    } catch (err) {
      setTestResult({
        error: true,
        message: err.response?.data?.error || err.message || "Diagnostic test failed execution."
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetCooldowns = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.post("/api/admin/assessment/runtime-engine/cooldown-reset", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        await fetchHealthAndLogs(true);
      }
    } catch (err) {
      console.error("Failed to reset cooldowns:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const getBadgeColor = (status) => {
    switch (status) {
      case "Healthy":
      case "SUCCESS":
      case "SUCCESS (CACHED)":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Rate Limited":
      case "RATE_LIMITED":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Timeout":
      case "TIMEOUT":
      case "FAILED":
      case "Disabled":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "Cooldown":
      case "FALLBACK_TRIGGERED":
      case "VALIDATION_WARNING":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar / Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-indigo-700">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500 text-white uppercase tracking-wider border border-indigo-400">
                Phase 5 Active Engine
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400 text-emerald-950 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-950 animate-pulse" />
                Multi-Key Round-Robin Router Live
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI Runtime Engine & Key Pool Router
            </h2>
            <p className="text-indigo-200 text-sm mt-1 max-w-2xl font-medium leading-relaxed">
              Decoupled provider abstraction layer supervising multi-credential Round-Robin distribution, SLA timeout protection (7s), automatic retry failover engines, structural response validation, and SHA-256 caching.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => fetchHealthAndLogs(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Updating..." : "Refresh Status"}</span>
            </button>
            <button
              onClick={handleResetCooldowns}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs sm:text-sm shadow-md transition-all border border-amber-300"
            >
              <Zap className="w-4 h-4" />
              <span>Reset Cooldowns</span>
            </button>
          </div>
        </div>

        {/* Quick Operational Telemetry Ribbon */}
        {!loading && metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-8 pt-6 border-t border-white/15 text-xs">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="text-indigo-300 font-semibold uppercase tracking-wider text-[10px]">Total API Traffic</div>
              <div className="text-xl font-black text-white mt-1">{metrics.totalRequests || 0} Req</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="text-emerald-300 font-semibold uppercase tracking-wider text-[10px]">Pool Success SLA</div>
              <div className="text-xl font-black text-white mt-1">{metrics.successRate || 100}%</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="text-purple-300 font-semibold uppercase tracking-wider text-[10px]">Avg Latency / Speed</div>
              <div className="text-xl font-black text-white mt-1">{metrics.avgTotalRuntimeMs || 0} ms</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="text-amber-300 font-semibold uppercase tracking-wider text-[10px]">Retry Rate / Failover</div>
              <div className="text-xl font-black text-white mt-1">{metrics.retryRate || 0}%</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 hidden lg:block">
              <div className="text-indigo-200 font-semibold uppercase tracking-wider text-[10px]">Active Provider</div>
              <div className="text-sm font-black text-emerald-300 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" /> Groq Llama 3
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Navigation Controls */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 bg-white px-4 pt-4 rounded-t-2xl border-x">
        <button
          onClick={() => setActiveSubTab("pool")}
          className={`pb-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === "pool"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Multi-Key Pool & Providers</span>
        </button>
        <button
          onClick={() => setActiveSubTab("diagnostic")}
          className={`pb-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === "diagnostic"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Diagnostic Test Harness</span>
        </button>
        <button
          onClick={() => setActiveSubTab("logs")}
          className={`pb-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === "logs"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Execution Telemetry Logs ({logs.length})</span>
        </button>
      </div>

      {/* Sub-Tab Content: KEY POOL & PROVIDERS */}
      {activeSubTab === "pool" && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl rounded-tr-2xl border border-t-0 border-slate-200 shadow-sm space-y-8">
          {/* Groq Key Pool Router Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  <span>Groq API Key Pool & Round-Robin Router</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamically loaded credentials executing under automatic Round-Robin load distribution and auto-recovery daemon supervision.
                </p>
              </div>
              {poolStatus?.groqPoolDetails && (
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
                  Healthy Pool: {poolStatus.groqPoolDetails.healthyKeys} / {poolStatus.groqPoolDetails.totalKeys} Keys
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 font-semibold animate-pulse">
                Loading Groq credential pool metrics and provider topology...
              </div>
            ) : !poolStatus?.groqPoolDetails?.keys?.length ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">
                No Groq credentials or simulation keys found in current server runtime.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {poolStatus.groqPoolDetails.keys.map((k) => (
                  <div key={k.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-indigo-500" />
                          Key #{k.index}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${getBadgeColor(k.status)}`}>
                          {k.status}
                        </span>
                      </div>
                      <div className="font-mono text-xs font-semibold text-slate-700 bg-white p-2 rounded-lg border border-slate-200 truncate mt-1">
                        {k.maskedKey}
                      </div>
                      {k.lastErrorReason && (
                        <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg mt-2 font-medium border border-rose-200">
                          ⚠️ {k.lastErrorReason}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 text-center text-[11px]">
                      <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                        <div className="text-slate-400 font-medium text-[10px]">Served</div>
                        <div className="font-black text-slate-800">{k.stats?.totalRequests || 0}</div>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                        <div className="text-slate-400 font-medium text-[10px]">Failures</div>
                        <div className="font-black text-rose-600">{k.stats?.totalFailures || 0}</div>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                        <div className="text-slate-400 font-medium text-[10px]">Latency</div>
                        <div className="font-black text-indigo-600">{k.stats?.avgLatencyMs || 0} ms</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fallback Providers & Architectural Readiness */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-purple-600" />
              <span>Multi-Provider Abstraction & Architecture Hooks</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-800">OpenAI Provider Stub</span>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">Fallback Tier 1</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Model: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">gpt-4o</code> — Ready for seamless failover routing upon primary pool exhaustion.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-800">Gemini Provider Stub</span>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">Fallback Tier 2</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Model: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">gemini-1.5-pro</code> — Standby execution adapter configured.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-800">Claude Provider Stub</span>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">Fallback Tier 3</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Model: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">claude-3-5-sonnet</code> — Standby execution adapter configured.
                </p>
              </div>
            </div>

            {/* Architectural Hooks Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center gap-3 text-xs">
                <Zap className="w-6 h-6 text-indigo-600 shrink-0" />
                <div>
                  <div className="font-black text-indigo-950">Streaming Ready Architecture</div>
                  <div className="text-indigo-700 text-[11px]">Component 17 chunked pipeline interface established for future real-time streaming tokens.</div>
                </div>
              </div>
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center gap-3 text-xs">
                <Database className="w-6 h-6 text-purple-600 shrink-0" />
                <div>
                  <div className="font-black text-purple-950">Cache Ready Architecture</div>
                  <div className="text-purple-700 text-[11px]">Component 15 SHA-256 fingerprint computation indexed for immediate reuse.</div>
                </div>
              </div>
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-black text-emerald-950">Zero-Trust Credential Masking</div>
                  <div className="text-emerald-700 text-[11px]">Component 18 security guardrails active. No raw keys logged in persistent storage.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab Content: DIAGNOSTIC TEST HARNESS */}
      {activeSubTab === "diagnostic" && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl rounded-tr-2xl border border-t-0 border-slate-200 shadow-sm space-y-6">
          <div className="border-l-4 border-amber-500 bg-amber-50/60 p-4 rounded-xl text-xs sm:text-sm text-amber-950 font-semibold flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold uppercase tracking-wide block">Architectural Compliance Note:</strong>
              This test harness runs interactive diagnostic verification across Round-Robin load distribution, automatic retry engine failover, SLA timeout handling, and JSON syntax normalization. <strong>Strictly NO assessment question generation occurs during these diagnostic test invocations.</strong> Actual question generation belongs to Phase 7+.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => runDiagnosticTest("ROUND_ROBIN")}
              disabled={testing}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all text-left group flex flex-col justify-between h-32 shadow-xs"
            >
              <div className="font-black text-slate-800 group-hover:text-indigo-900 text-sm flex items-center justify-between">
                <span>Test Round-Robin Router</span>
                <Play className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fires sequential diagnostic requests to observe equal distribution across healthy keys (Key 1 → Key 2 → Key 3).
              </p>
            </button>

            <button
              onClick={() => runDiagnosticTest("SIMULATE_429_RATE_LIMIT")}
              disabled={testing}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all text-left group flex flex-col justify-between h-32 shadow-xs"
            >
              <div className="font-black text-slate-800 group-hover:text-amber-900 text-sm flex items-center justify-between">
                <span>Simulate 429 Rate Limit</span>
                <Play className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Forces an artificial 429 quota exception to verify automatic key cooldown transition and seamless retry failover.
              </p>
            </button>

            <button
              onClick={() => runDiagnosticTest("SIMULATE_TIMEOUT")}
              disabled={testing}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-all text-left group flex flex-col justify-between h-32 shadow-xs"
            >
              <div className="font-black text-slate-800 group-hover:text-rose-900 text-sm flex items-center justify-between">
                <span>Simulate 7000ms Timeout</span>
                <Play className="w-4 h-4 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Forces SLA timeout exception to test automatic fallback across credentials without breaking runtime return.
              </p>
            </button>

            <button
              onClick={() => runDiagnosticTest("COOLDOWN_RECOVERY")}
              disabled={testing}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all text-left group flex flex-col justify-between h-32 shadow-xs"
            >
              <div className="font-black text-slate-800 group-hover:text-emerald-900 text-sm flex items-center justify-between">
                <span>Verify Health Recovery</span>
                <Play className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Triggers immediate manual restoration of all keys currently in cooldown or rate-limited states back to Healthy.
              </p>
            </button>
          </div>

          {/* Test Result Display Block */}
          {testing && (
            <div className="p-8 text-center bg-indigo-50/40 rounded-2xl border border-indigo-200 text-indigo-900 font-bold flex items-center justify-center gap-3 animate-pulse">
              <Activity className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Executing multi-key runtime telemetry test across provider routing pipeline...</span>
            </div>
          )}

          {testResult && !testing && (
            <div className="bg-slate-900 rounded-3xl p-6 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-emerald-400 font-bold font-sans">
                <span className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Diagnostic Execution Complete — Verified Normalized Return
                </span>
                <button onClick={() => setTestResult(null)} className="text-slate-500 hover:text-white text-xs underline">
                  Dismiss Report
                </button>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab Content: EXECUTION TELEMETRY LOGS */}
      {activeSubTab === "logs" && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl rounded-tr-2xl border border-t-0 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <span>AI Runtime Execution Audit Logs (AIRuntimeLog Schema)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time operational records tracking mandatory Request IDs, masked credentials, latency breakdowns, and token estimations.
              </p>
            </div>
            <button
              onClick={() => fetchHealthAndLogs(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-semibold animate-pulse">
              Loading runtime execution telemetry logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">
              No runtime execution events logged in the current database yet. Run a diagnostic test above to populate telemetry records!
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-black border-b border-slate-200 uppercase text-[11px]">
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Provider & Model</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Latency & Retries</th>
                    <th className="py-3 px-4">Tokens / Cost Stub</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.map((log) => (
                    <tr key={log._id || log.requestId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {log.requestId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{log.provider}</div>
                        <div className="text-slate-400 text-[10px] font-mono">{log.model}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] border uppercase ${getBadgeColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-700">{log.metrics?.totalRuntimeMs || log.latencyMs || 0} ms</div>
                        <div className="text-[10px] text-slate-400">Retries: {log.retryCount || 0}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-bold">~{(log.metrics?.estimatedTokens || 0) + (log.metrics?.returnedTokens || 0)} tokens</div>
                        <div className="text-emerald-700 text-[10px] font-mono font-semibold">{log.metrics?.costPlaceholder || "$0.0000"}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-semibold">
                        {new Date(log.requestTimestamp || log.createdAt || Date.now()).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIRuntimeMonitor;
