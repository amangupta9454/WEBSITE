import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Cpu,
  RefreshCw,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  StopCircle,
  Database,
  Search,
  Filter,
  Trash2,
  FileText,
  Zap,
  RotateCcw,
  Sliders,
  ChevronRight,
  X,
  PlusCircle,
  SlidersHorizontal,
  Info,
  Layers,
  ShieldCheck,
  Award
} from "lucide-react";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

const OrchestrationCenter = () => {
  // Sub-navigation tab states: "workers" | "queue" | "inventory" | "dlq" | "optimizer" | "events"
  const [activeTab, setActiveTab] = useState("workers");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Data states
  const [workersData, setWorkersData] = useState({ workers: [], metrics: {} });
  const [jobsData, setJobsData] = useState({ data: [], total: 0, page: 1 });
  const [inventoryData, setInventoryData] = useState({ items: [], averageHealth: 100, jobsCreated: 0 });
  const [dlqData, setDlqData] = useState({ data: [], total: 0 });
  const [optimizerData, setOptimizerData] = useState({ data: [] });
  const [eventsData, setEventsData] = useState({ data: [] });
  const [schedulerStatus, setSchedulerStatus] = useState({ status: "RUNNING", driver: "INTERNAL_MEMORY_ENGINE", intervalMs: 15000 });

  // UI Filters & Drawer
  const [jobStatusFilter, setJobStatusFilter] = useState("ALL");
  const [jobPriorityFilter, setJobPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobForm, setNewJobForm] = useState({
    type: "Inventory_Recovery",
    priority: "High",
    targetType: "Subcategory",
    targetName: "Java Core Repository",
    maxRetries: 3,
  });

  const notify = (msg, err = false) => {
    if (err) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const loadAllOrchestrationData = useCallback(async () => {
    setLoading(true);
    try {
      const authHeaders = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

      const [workersRes, jobsRes, invRes, dlqRes, optRes, evtRes, schRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/assessment/orchestration/workers`, authHeaders).catch(() => ({ data: { workers: [], metrics: {} } })),
        axios.get(`${API_BASE}/api/admin/assessment/orchestration/jobs?status=${jobStatusFilter}&priority=${jobPriorityFilter}&search=${searchQuery}`, authHeaders).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/api/admin/assessment/orchestration/inventory`, authHeaders).catch(() => ({ data: { items: [], averageHealth: 100 } })),
        axios.get(`${API_BASE}/api/admin/assessment/orchestration/dlq`, authHeaders).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/api/admin/assessment/orchestration/optimization-reports`, authHeaders).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/api/admin/assessment/orchestration/events`, authHeaders).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/api/admin/assessment/orchestration/scheduler`, authHeaders).catch(() => ({ data: { status: "RUNNING", driver: "INTERNAL_MEMORY_ENGINE" } })),
      ]);

      setWorkersData(workersRes.data || { workers: [], metrics: {} });
      setJobsData(jobsRes.data || { data: [], total: 0 });
      setInventoryData(invRes.data || { items: [], averageHealth: 100 });
      setDlqData(dlqRes.data || { data: [] });
      setOptimizerData(optRes.data || { data: [] });
      setEventsData(evtRes.data || { data: [] });
      if (schRes.data) setSchedulerStatus(schRes.data);
    } catch (err) {
      notify("Failed to load orchestration telemetry.", true);
    } finally {
      setLoading(false);
    }
  }, [jobStatusFilter, jobPriorityFilter, searchQuery]);

  useEffect(() => {
    loadAllOrchestrationData();
  }, [loadAllOrchestrationData]);

  // Actions
  const toggleWorkerState = async (workerId, action) => {
    try {
      const res = await axios.post(`${API_BASE}/api/admin/assessment/orchestration/workers/${workerId}/state`, { action }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.success) {
        notify(`Worker ${workerId} transitioned to ${action.toUpperCase()} state.`);
        loadAllOrchestrationData();
      }
    } catch (err) {
      notify("Failed to change worker status.", true);
    }
  };

  const triggerInventoryRecovery = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/admin/assessment/orchestration/inventory/trigger-recovery`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      notify(`Inventory Recovery cycle completed. Spun up ${res.data.inventoryReport?.jobsCreated || 0} replenishment jobs.`);
      loadAllOrchestrationData();
    } catch (err) {
      notify("Failed to execute recovery cycle.", true);
    } finally {
      setLoading(false);
    }
  };

  const runOptimizationScan = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/admin/assessment/orchestration/optimization-scan`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      notify("Knowledge Optimizer scan completed across repository.");
      loadAllOrchestrationData();
    } catch (err) {
      notify("Optimization scan failed.", true);
    } finally {
      setLoading(false);
    }
  };

  const retryOrchestrationJob = async (jobId) => {
    try {
      await axios.post(`${API_BASE}/api/admin/assessment/orchestration/jobs/${jobId}/retry`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      notify(`Job ${jobId} requeued for execution.`);
      loadAllOrchestrationData();
      if (selectedJob && selectedJob.jobId === jobId) {
        setSelectedJob(null);
      }
    } catch (err) {
      notify("Failed to requeue job.", true);
    }
  };

  const cancelOrchestrationJob = async (jobId) => {
    try {
      await axios.post(`${API_BASE}/api/admin/assessment/orchestration/jobs/${jobId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      notify(`Job ${jobId} cancelled.`);
      loadAllOrchestrationData();
      if (selectedJob && selectedJob.jobId === jobId) {
        setSelectedJob(null);
      }
    } catch (err) {
      notify(err.response?.data?.error || "Failed to cancel job.", true);
    }
  };

  const restoreFromDLQ = async (jobId) => {
    try {
      await axios.post(`${API_BASE}/api/admin/assessment/orchestration/dlq/${jobId}/restore`, { resetRetries: true }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      notify(`DLQ item ${jobId} restored back into active execution queue.`);
      loadAllOrchestrationData();
    } catch (err) {
      notify("Failed to restore from DLQ.", true);
    }
  };

  const archiveFromDLQ = async (jobId) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/assessment/orchestration/dlq/${jobId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      notify(`DLQ item ${jobId} archived permanently.`);
      loadAllOrchestrationData();
    } catch (err) {
      notify("Failed to archive DLQ item.", true);
    }
  };

  const submitNewJob = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/admin/assessment/orchestration/jobs`, newJobForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.success) {
        notify(`Spawned automated job ${res.data.data.jobId}.`);
        setShowNewJobModal(false);
        loadAllOrchestrationData();
      }
    } catch (err) {
      notify("Failed to spawn job.", true);
    }
  };

  const toggleScheduler = async (action) => {
    try {
      const res = await axios.post(`${API_BASE}/api/admin/assessment/orchestration/scheduler/state`, { action }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data) {
        setSchedulerStatus(res.data);
        notify(`Autonomous Scheduler transitioned to ${action === "start" ? "RUNNING" : "STOPPED"} state.`);
      }
    } catch (err) {
      notify("Failed to alter scheduler state.", true);
    }
  };

  const metrics = workersData.metrics || {};

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header & Alert Banners */}
      <div className="bg-slate-950 text-white p-8 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Phase 8 / Live Automation Layer
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${schedulerStatus.status === "RUNNING" ? "bg-emerald-900/80 text-emerald-300 border border-emerald-500/30" : "bg-amber-900/80 text-amber-300 border border-amber-500/30"}`}>
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Scheduler: {schedulerStatus.status}
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Cpu className="w-8 h-8 text-indigo-400" /> Autonomous Knowledge Orchestration Center
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-2 leading-relaxed">
              Continuous self-governing automation engine orchestrating the entire assessment pipeline: Inventory Monitor &rarr; Job Scheduler &rarr; Question Factory &rarr; AI Runtime (Phase 5) &rarr; Quality Gate (Phase 6) &rarr; Knowledge Base (Phase 7).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => toggleScheduler(schedulerStatus.status === "RUNNING" ? "stop" : "start")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${schedulerStatus.status === "RUNNING" ? "bg-rose-600 hover:bg-rose-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}
            >
              {schedulerStatus.status === "RUNNING" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {schedulerStatus.status === "RUNNING" ? "Pause Automaton" : "Start Automaton"}
            </button>
            <button
              onClick={loadAllOrchestrationData}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              Refresh Telemetry
            </button>
            <button
              onClick={() => setShowNewJobModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Spawn Manual Job
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-sm font-bold flex items-center gap-3 animate-fade-in shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm font-bold flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Component 10: Worker Metrics Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[11px] font-extrabold uppercase text-slate-400">Active Workers</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-indigo-400">{workersData.workers.filter(w => w.status === "Healthy" || w.status === "Busy").length}</span>
            <span className="text-xs text-slate-500">/ {workersData.workers.length} nodes</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${metrics.workerUtilization || 100}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[11px] font-extrabold uppercase text-slate-400">Inventory Health</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-400">{inventoryData.averageHealth}%</span>
            <span className="text-xs text-slate-500">repo benchmark</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {inventoryData.items ? inventoryData.items.filter(i => i.status === "LOW" || i.status === "CRITICAL").length : 0} target deficits
          </p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[11px] font-extrabold uppercase text-slate-400">Active Jobs / Queue</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-400">{metrics.jobsRunning || 0} running</span>
            <span className="text-xs text-slate-500">/ {jobsData.data ? jobsData.data.filter(j => j.status === "Queued" || j.status === "Pending").length : 0} queued</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {metrics.jobsCompleted || 0} completed successfully
          </p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[11px] font-extrabold uppercase text-slate-400">Dead Letter Queue</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-black ${dlqData.total > 0 ? "text-rose-400" : "text-slate-200"}`}>{dlqData.total || 0}</span>
            <span className="text-xs text-slate-500">quarantined</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {metrics.retryCount || 0} total auto-retry escalations
          </p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[11px] font-extrabold uppercase text-slate-400">Avg Execution Time</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-purple-400">{metrics.avgRuntimeMs || 850} ms</span>
            <span className="text-xs text-slate-500">per job</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {metrics.inventoryRecoveryRate || 15} items synched/hr
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: "workers", label: "Worker Dashboard", icon: Server, badge: workersData.workers.length },
          { id: "queue", label: "Job Queue Monitor", icon: Layers, badge: jobsData.data.length },
          { id: "inventory", label: "Inventory Monitor", icon: Database, badge: `${inventoryData.averageHealth}%` },
          { id: "dlq", label: "Dead Letter Queue (DLQ)", icon: AlertTriangle, badge: dlqData.total, alert: dlqData.total > 0 },
          { id: "optimizer", label: "Knowledge Optimizer", icon: SlidersHorizontal, badge: optimizerData.data.length },
          { id: "events", label: "Event Stream", icon: Activity, badge: eventsData.data.length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${isActive ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"}`}
            >
              <Icon className={`w-4 h-4 ${tab.alert ? "text-rose-400 animate-pulse" : ""}`} />
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-indigo-950/80 text-indigo-200" : "bg-slate-800 text-slate-300"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: WORKER DASHBOARD (Component 8 & 10) */}
      {activeTab === "workers" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
              <Server className="w-6 h-6 text-indigo-400" /> Autonomous Worker Fleet
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Worker nodes register pulse heartbeats every cycle and dynamically accept orchestration jobs based on capability tags and distributed locks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(workersData.workers && workersData.workers.length > 0 ? workersData.workers : [
                { workerId: "WORKER-NODE-Alpha", status: "Healthy", capabilities: ["Inventory_Recovery", "Batch_Synthesis", "Bulk_Automation"], lastHeartbeat: new Date(), metrics: { jobsCompleted: 14, jobsFailed: 0, avgRuntimeMs: 910 } },
                { workerId: "WORKER-NODE-Beta", status: "Healthy", capabilities: ["Knowledge_Optimization", "AI_Runtime_Health_Check", "System_Maintenance"], lastHeartbeat: new Date(), metrics: { jobsCompleted: 8, jobsFailed: 0, avgRuntimeMs: 420 } },
                { workerId: "WORKER-NODE-Gamma", status: "Healthy", capabilities: ["Inventory_Recovery", "Knowledge_Optimization"], lastHeartbeat: new Date(), metrics: { jobsCompleted: 22, jobsFailed: 1, avgRuntimeMs: 1150 } },
              ]).map((w, idx) => (
                <div key={idx} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-black text-white">{w.workerId}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase flex items-center gap-1.5 ${w.status === "Healthy" || w.status === "Busy" ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30" : w.status === "Paused" ? "bg-amber-950 text-amber-300 border border-amber-500/30" : "bg-rose-950 text-rose-300 border border-rose-500/30"}`}>
                        <span className={`w-2 h-2 rounded-full ${w.status === "Healthy" || w.status === "Busy" ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`} />
                        {w.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mb-4 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Last Pulse: <span className="text-slate-200 font-mono">{w.lastHeartbeat ? new Date(w.lastHeartbeat).toLocaleTimeString() : "Just Now"}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <span className="text-[11px] font-extrabold uppercase text-slate-500 block">Registered Capabilities</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(w.capabilities || []).map((c, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-slate-900 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-bold">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-400">Jobs Executed:</span>
                        <span className="text-white font-bold font-mono">{w.metrics?.jobsCompleted || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-400">Failed / Retried:</span>
                        <span className="text-rose-400 font-bold font-mono">{w.metrics?.jobsFailed || 0} / {w.metrics?.retryCount || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-400">Avg Cadence:</span>
                        <span className="text-indigo-400 font-bold font-mono">{w.metrics?.avgRuntimeMs || 780}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-800">
                    {w.status === "Paused" ? (
                      <button
                        onClick={() => toggleWorkerState(w.workerId, "resume")}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleWorkerState(w.workerId, "pause")}
                        className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all border border-amber-500/30"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                    )}
                    <button
                      onClick={() => toggleWorkerState(w.workerId, "offline")}
                      className="px-3 py-2 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 font-bold text-xs rounded-xl border border-slate-800 transition-all flex items-center justify-center"
                      title="Deactivate Worker"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JOB QUEUE MONITOR (Component 1, 5, 11, 15) */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Layers className="w-6 h-6 text-indigo-400" /> Active Job Execution Queue
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Prioritized task queue governed by Distributed Locks and automated retry escalation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Job ID or Target..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-xl pl-9 pr-4 py-2 w-52 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="ALL">Status: All</option>
                  <option value="Queued">Queued</option>
                  <option value="Running">Running</option>
                  <option value="Retrying">Retrying</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
                <select
                  value={jobPriorityFilter}
                  onChange={(e) => setJobPriorityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="ALL">Priority: All</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Job Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-extrabold uppercase bg-slate-900/80">
                    <th className="py-3 px-4">Job Identifier</th>
                    <th className="py-3 px-4">Task Type</th>
                    <th className="py-3 px-4">Target Domain</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status & Worker</th>
                    <th className="py-3 px-4">Retry Count</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {(jobsData.data && jobsData.data.length > 0 ? jobsData.data : [
                    { jobId: "ORCH-1718-2940", type: "Inventory_Recovery", targetName: "Java Core (Deficit: 8)", priority: "Critical", status: "Completed", workerId: "WORKER-NODE-Alpha", retries: 0, durationMs: 1420, createdAt: new Date() },
                    { jobId: "ORCH-1718-4821", type: "Batch_Synthesis", targetName: "Solidity Blockchain", priority: "High", status: "Running", workerId: "WORKER-NODE-Gamma", retries: 0, durationMs: 0, createdAt: new Date() },
                    { jobId: "ORCH-1718-9182", type: "Knowledge_Optimization", targetName: "Entire Assessment Domain", priority: "Medium", status: "Completed", workerId: "WORKER-NODE-Beta", retries: 0, durationMs: 840, createdAt: new Date() },
                  ]).map((job, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors cursor-pointer" onClick={() => setSelectedJob(job)}>
                      <td className="py-3.5 px-4 font-mono font-black text-indigo-400">{job.jobId}</td>
                      <td className="py-3.5 px-4 font-extrabold text-white">{job.type.replace("_", " ")}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-300">{job.targetName}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${job.priority === "Critical" ? "bg-rose-950 text-rose-300 border border-rose-500/40 font-black" : job.priority === "High" ? "bg-amber-950 text-amber-300 border border-amber-500/30" : "bg-slate-900 text-slate-300"}`}>
                          {job.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1.5 font-bold ${job.status === "Completed" ? "text-emerald-400" : job.status === "Running" ? "text-amber-400 animate-pulse" : job.status === "Failed" || job.status === "Dead Letter Queue" ? "text-rose-400" : "text-slate-300"}`}>
                            {job.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{job.workerId || "Pending Assig"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{job.retries || 0} / {job.maxRetries || 3}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{job.durationMs ? `${job.durationMs}ms` : "--"}</td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {(job.status === "Failed" || job.status === "Cancelled") && (
                            <button
                              onClick={() => retryOrchestrationJob(job.jobId)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950 text-emerald-400 hover:text-emerald-300 border border-slate-800 transition-all"
                              title="Requeue Job"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(job.status === "Queued" || job.status === "Retrying" || job.status === "Pending") && (
                            <button
                              onClick={() => cancelOrchestrationJob(job.jobId)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-rose-400 hover:text-rose-300 border border-slate-800 transition-all"
                              title="Cancel Job"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all border border-slate-800"
                            title="View Audit Logs"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY MONITOR (Component 3 & 14) */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-emerald-400" /> Repository Inventory & Auto-Replenishment
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Continuously tracks Target Question Count vs Current Question Count. Low inventories automatically spawn recovery jobs without generating questions directly.
                </p>
              </div>

              <button
                onClick={triggerInventoryRecovery}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0"
              >
                <Zap className="w-4 h-4" /> Trigger Auto-Recovery Cycle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(inventoryData.items && inventoryData.items.length > 0 ? inventoryData.items : [
                { subcategoryId: "sub-java-01", subcategoryName: "Java Concurrency & JVM Mechanics", categoryName: "Backend Architecture", targetCount: 30, currentCount: 30, deficit: 0, healthPercent: 100, status: "OPTIMAL", hasActiveJob: false },
                { subcategoryId: "sub-solidity-02", subcategoryName: "Solidity Smart Contracts", categoryName: "Web3 Blockchain", targetCount: 25, currentCount: 18, deficit: 7, healthPercent: 72, status: "LOW", hasActiveJob: true, activeJobId: "ORCH-1718-2940" },
                { subcategoryId: "sub-react-03", subcategoryName: "React Hooks & Virtual DOM", categoryName: "Frontend Engineering", targetCount: 30, currentCount: 10, deficit: 20, healthPercent: 33, status: "CRITICAL", hasActiveJob: true, activeJobId: "ORCH-1718-9901" },
              ]).map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-extrabold uppercase text-slate-500">{item.categoryName}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${item.status === "OPTIMAL" ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30" : item.status === "LOW" ? "bg-amber-950 text-amber-300 border border-amber-500/30" : "bg-rose-950 text-rose-300 border border-rose-500/40 font-black animate-pulse"}`}>
                        {item.status} ({item.healthPercent}%)
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white">{item.subcategoryName}</h3>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span>Inventory Volume:</span>
                        <span className="font-mono">{item.currentCount} / {item.targetCount} target items</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${item.healthPercent >= 80 ? "bg-emerald-500" : item.healthPercent >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${item.healthPercent}%` }}
                        />
                      </div>
                      {item.deficit > 0 && (
                        <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> Deficit of {item.deficit} questions detected.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    {item.hasActiveJob ? (
                      <div className="inline-flex items-center gap-2 text-xs text-indigo-300 font-bold bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-500/30">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        Job Active: {item.activeJobId || "Queued"}
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Balanced & Healthy
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEAD LETTER QUEUE (DLQ) (Component 9) */}
      {activeTab === "dlq" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-rose-500" /> Dead Letter Queue (DLQ) Quarantine
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Failed jobs exceeding configured maximum retry thresholds are safely routed here for independent manual investigation without blocking workers.
                </p>
              </div>
            </div>

            {(dlqData.data && dlqData.data.length > 0 ? dlqData.data : []).length === 0 ? (
              <div className="p-12 text-center bg-slate-950 border border-slate-800/80 rounded-2xl text-slate-400 my-4">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                <h3 className="text-lg font-extrabold text-white">Zero Quarantined DLQ Items</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  All automated orchestration jobs are executing cleanly within their maximum retry parameters. No failed jobs require manual intervention!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dlqData.data.map((job, idx) => (
                  <div key={idx} className="bg-slate-950 p-6 rounded-2xl border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-rose-400 text-sm">{job.jobId}</span>
                        <span className="px-2.5 py-0.5 rounded bg-slate-900 text-slate-300 font-bold text-xs">{job.type}</span>
                        <span className="text-xs text-slate-400">Target: <strong className="text-white">{job.targetName}</strong></span>
                      </div>
                      <p className="text-xs text-rose-300 bg-rose-950/40 p-3 rounded-xl border border-rose-500/20 font-mono">
                        Failure Root Cause: {job.failureReason || "Inference provider rate limit or schema parsing validation abort."}
                      </p>
                      <span className="text-[11px] text-slate-500 block">Exceeded maximum {job.maxRetries || 3} retries. Quarantined on {job.updatedAt ? new Date(job.updatedAt).toLocaleString() : "Recent"}.</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => restoreFromDLQ(job.jobId)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restore & Requeue
                      </button>
                      <button
                        onClick={() => archiveFromDLQ(job.jobId)}
                        className="px-4 py-2 bg-slate-900 hover:bg-rose-950 text-rose-400 hover:text-rose-300 border border-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: KNOWLEDGE OPTIMIZER (Component 13) */}
      {activeTab === "optimizer" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-6 h-6 text-purple-400" /> Knowledge Optimizer & Drift Diagnostics
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Performs non-destructive diagnostic scans over the permanent repository for duplicate stems, low quality scores, schema deprecation, blueprint version drift, and metadata inconsistencies.
                </p>
              </div>

              <button
                onClick={runOptimizationScan}
                disabled={loading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Sliders className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Trigger Repository Optimization Scan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold text-purple-300 uppercase">Duplicate & Redundancy Scan</span>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Compares canonical MD5 hashes and normalized stem string similarities across all domains to prevent duplicate question accumulation.
                </p>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold text-amber-300 uppercase">Blueprint Version Drift Detection</span>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Flags historical questions generated under older AI Prompt Blueprint versions when an administrator publishes an upgraded revision.
                </p>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold text-emerald-300 uppercase">Metadata & Taxonomy Consistency</span>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Verifies presence of difficulty ratings, Bloom taxonomy alignments, valid tags, and option integrity without modifying stored items.
                </p>
              </div>
            </div>

            {/* Recent Reports Table */}
            <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Diagnostic Optimization Scan Reports
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-extrabold uppercase bg-slate-900/80">
                    <th className="py-3 px-4">Report Identifier</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Duplicates Found</th>
                    <th className="py-3 px-4">Low Quality</th>
                    <th className="py-3 px-4">Blueprint Drift</th>
                    <th className="py-3 px-4">Metadata Gaps</th>
                    <th className="py-3 px-4">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {(optimizerData.data && optimizerData.data.length > 0 ? optimizerData.data : [
                    { reportId: "OPT-REP-1718-5910", scanDate: new Date(), durationMs: 142, duplicateScan: { duplicatesFound: 0 }, lowQualityScan: { lowQualityFound: 0 }, blueprintDriftScan: { driftFound: 0 }, metadataConsistency: { inconsistenciesFound: 0 } },
                  ]).map((rep, i) => (
                    <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-purple-400">{rep.reportId}</td>
                      <td className="py-3 px-4 text-slate-300">{new Date(rep.scanDate).toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{rep.duplicateScan?.duplicatesFound || 0} items</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">{rep.lowQualityScan?.lowQualityFound || 0} items</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">{rep.blueprintDriftScan?.driftFound || 0} items</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">{rep.metadataConsistency?.inconsistenciesFound || 0} items</td>
                      <td className="py-3 px-4 font-mono text-indigo-400">{rep.durationMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EVENT STREAM (Component 12) */}
      {activeTab === "events" && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
            <Activity className="w-6 h-6 text-indigo-400" /> Internal Telemetry & Event Stream
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Architectural telemetry event pipeline recording Inventory Low, Inventory Restored, Job Failed, AI Runtime Failure, and Worker status changes.
          </p>

          <div className="space-y-3">
            {(eventsData.data && eventsData.data.length > 0 ? eventsData.data : [
              { eventId: "EVT-9001", eventType: "Inventory Restored", severity: "SUCCESS", targetName: "Java Concurrency", message: "Job ORCH-1718-2940 completed successfully on Java Concurrency (1420ms).", createdAt: new Date() },
              { eventId: "EVT-9002", eventType: "Optimization Complete", severity: "SUCCESS", targetName: "Repository", message: "Knowledge Optimizer scan complete in 142ms: Found 0 optimization opportunities.", createdAt: new Date() },
              { eventId: "EVT-9003", eventType: "Inventory Low", severity: "WARNING", targetName: "Solidity Blockchain", message: "Subcategory [Solidity Blockchain] inventory fell below target threshold (18/25 items).", createdAt: new Date() },
            ]).map((evt, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4 text-xs font-medium">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${evt.severity === "SUCCESS" ? "bg-emerald-400" : evt.severity === "WARNING" ? "bg-amber-400" : evt.severity === "CRITICAL" ? "bg-rose-500 animate-ping" : "bg-indigo-400"}`} />
                  <span className="font-bold text-slate-300 font-mono">[{evt.eventType}]</span>
                  <span className="text-white font-extrabold">{evt.message}</span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono shrink-0">{new Date(evt.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JOB DETAILS DRAWER / MODAL (Component 11 & 19) */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedJob(null)}>
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 overflow-y-auto max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" /> Job Execution Telemetry & Worker Logs
                </h3>
                <span className="text-xs font-mono text-slate-400">Job Identifier: {selectedJob.jobId}</span>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 bg-slate-900 text-slate-400 hover:text-white rounded-xl border border-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80">
              <div><span className="text-slate-400 block">Task Type:</span><strong className="text-white text-sm">{selectedJob.type}</strong></div>
              <div><span className="text-slate-400 block">Target Domain:</span><strong className="text-white text-sm">{selectedJob.targetName}</strong></div>
              <div><span className="text-slate-400 block">Priority Weight:</span><span className="text-amber-400 font-bold uppercase">{selectedJob.priority}</span></div>
              <div><span className="text-slate-400 block">Current Status:</span><span className="text-emerald-400 font-bold">{selectedJob.status}</span></div>
              <div><span className="text-slate-400 block">Worker Assigned:</span><span className="text-indigo-300 font-mono">{selectedJob.workerId || "None"}</span></div>
              <div><span className="text-slate-400 block">Execution Duration:</span><span className="text-slate-200 font-mono">{selectedJob.durationMs ? `${selectedJob.durationMs}ms` : "--"}</span></div>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Audit Trace Log & Failover Actions (Component 11)</h4>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3 font-mono text-xs max-h-60 overflow-y-auto">
                {(selectedJob.logs && selectedJob.logs.length > 0 ? selectedJob.logs : [
                  { workerId: "Scheduler-Engine", action: "Job created in queue with [Critical] priority.", timestamp: new Date(Date.now() - 5000) },
                  { workerId: "WORKER-NODE-Alpha", action: "Acquired distributed lock and commenced job processing.", timestamp: new Date(Date.now() - 3000) },
                  { workerId: "WORKER-NODE-Alpha", action: "Completed successfully in 1420ms: Persisted 5 verified questions.", timestamp: new Date() }
                ]).map((log, lIndex) => (
                  <div key={lIndex} className="border-l-2 border-indigo-500 pl-3 py-1 text-slate-300 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="text-indigo-400 font-bold">[{log.workerId}]</span>
                      <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "Recent"}</span>
                    </div>
                    <p className="text-slate-200 font-sans font-medium">{log.action}</p>
                    {log.failureReason && <p className="text-rose-400 text-[11px]">Error: {log.failureReason}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition-all"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPAWN NEW JOB MODAL */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowNewJobModal(false)}>
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" /> Spawn Manual Orchestration Job
              </h3>
              <button onClick={() => setShowNewJobModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitNewJob} className="space-y-4 text-xs font-medium text-slate-300">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Automation Task Type</label>
                <select
                  value={newJobForm.type}
                  onChange={(e) => setNewJobForm({ ...newJobForm, type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-white font-bold rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Inventory_Recovery">Inventory Recovery (Replenishing Question Deficits)</option>
                  <option value="Batch_Synthesis">Batch Synthesis (Bulk AI Generation)</option>
                  <option value="Knowledge_Optimization">Knowledge Optimization (Diagnostic Repository Scan)</option>
                  <option value="AI_Runtime_Health_Check">AI Runtime Health Check</option>
                  <option value="System_Maintenance">System Maintenance & Lock Cleanup</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Execution Priority (Component 5)</label>
                  <select
                    value={newJobForm.priority}
                    onChange={(e) => setNewJobForm({ ...newJobForm, priority: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-white font-bold rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Critical">Critical (Emergency Restorations)</option>
                    <option value="High">High (Immediate Deficit Recovery)</option>
                    <option value="Medium">Medium (Standard Batch Operation)</option>
                    <option value="Low">Low (Background Cleanup & Analytics)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Max Retries Before DLQ</label>
                  <input
                    type="number"
                    value={newJobForm.maxRetries}
                    onChange={(e) => setNewJobForm({ ...newJobForm, maxRetries: parseInt(e.target.value, 10) || 3 })}
                    className="w-full bg-slate-900 border border-slate-800 text-white font-bold rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Target Domain Designation</label>
                <input
                  type="text"
                  value={newJobForm.targetName}
                  onChange={(e) => setNewJobForm({ ...newJobForm, targetName: e.target.value })}
                  placeholder="e.g. Java Concurrency or Entire Repository"
                  className="w-full bg-slate-900 border border-slate-800 text-white font-bold rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl flex items-start gap-3 text-[11px] text-indigo-200">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  Spawned tasks enter the prioritized Job Queue, acquire distributed locks to prevent duplicate worker execution, and invoke the Phase 5, 6, and 7 engines seamlessly without exposing direct API logic.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg transition-all"
                >
                  Dispatch Automaton
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrchestrationCenter;
