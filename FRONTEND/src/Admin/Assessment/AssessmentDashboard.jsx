import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  FolderTree,
  Layers,
  Sliders,
  Cpu,
  Database,
  FileCheck,
  Award,
  BarChart3,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Zap
} from "lucide-react";
import { toast } from "react-toastify";

const AssessmentDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [groqHealth, setGroqHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, phase: "Phase 1 / Overview" },
    { id: "categories", label: "Categories", icon: FolderTree, phase: "Phase 2" },
    { id: "subcategories", label: "Sub Categories", icon: Layers, phase: "Phase 2" },
    { id: "config", label: "Assessment Configuration", icon: Sliders, phase: "Phase 3" },
    { id: "ai_config", label: "AI Configuration", icon: Cpu, phase: "Phase 3" },
    { id: "questions", label: "Question Bank", icon: Database, phase: "Phase 4 & 5" },
    { id: "assessments", label: "Assessments", icon: FileCheck, phase: "Phase 7 & 8" },
    { id: "certificates", label: "Certificates", icon: Award, phase: "Phase 9" },
    { id: "analytics", label: "Analytics", icon: BarChart3, phase: "Phase 11" },
    { id: "jobs", label: "Background Jobs", icon: RefreshCw, phase: "Phase 6" },
    { id: "settings", label: "Settings", icon: Settings, phase: "Phase 1 & 14" }
  ];

  const fetchGroqHealth = async () => {
    try {
      setLoadingHealth(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/assessment/groq/health", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setGroqHealth(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch Groq health status:", err);
      // Fallback display if API offline or token expired
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchGroqHealth();
    }
  }, [activeTab]);

  return (
    <div className="bg-slate-50 min-h-screen rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 tracking-wide uppercase">
              AI Powered Module
            </span>
            <span className="text-xs text-slate-400 font-medium">Enterprise Edition</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-1">
            Assessment & Certification
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Categories, AI Blueprints, Question Bank & Automated Certifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchGroqHealth}
            disabled={loadingHealth}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
          >
            {loadingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh AI Health
          </button>
        </div>
      </div>

      {/* Main Container with Sidebar + Content */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Navigation / Module Sub-menu */}
        <div className="xl:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex xl:flex-col flex-wrap gap-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden xl:block">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100/60 shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium hidden xl:inline-block ${
                    isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {item.phase.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="xl:col-span-4">
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              {/* Stats & AI Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">AI Question Source</span>
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-800">Groq Manager</div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Round-Robin & Failover Active</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Configured AI Keys</span>
                    <Cpu className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-800">
                    {groqHealth ? `${groqHealth.healthyKeys} / ${groqHealth.totalKeys} Healthy` : "Checking..."}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Auto-recovery cooldown enabled (1 min)
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Question Inventory</span>
                    <Database className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-800">Ready</div>
                  <p className="text-xs text-slate-500 mt-2">
                    Background workers scheduled (Phase 6)
                  </p>
                </div>
              </div>

              {/* AI Key Health Detailed Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  Groq API Key Pool Status
                </h3>
                {loadingHealth && !groqHealth ? (
                  <div className="flex items-center justify-center py-10 text-slate-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <span>Inspecting Groq Manager key array...</span>
                  </div>
                ) : groqHealth && groqHealth.keys && groqHealth.keys.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
                          <th className="pb-3 px-4">Key ID</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 px-4">Requests Handled</th>
                          <th className="pb-3 px-4">Failures</th>
                          <th className="pb-3 px-4">Avg Latency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {groqHealth.keys.map((k) => (
                          <tr key={k.index} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 font-bold text-slate-900">GROQ_KEY_{k.index}</td>
                            <td className="py-3.5 px-4">
                              {k.status === "healthy" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Healthy
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  Cooldown
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">{k.totalRequests}</td>
                            <td className="py-3.5 px-4 text-rose-600">{k.totalFailures}</td>
                            <td className="py-3.5 px-4 text-slate-500">{k.avgLatencyMs ? `${k.avgLatencyMs} ms` : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No Groq keys reported yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Ensure GROQ_KEY_1 to GROQ_KEY_4 are configured in your backend `.env` file to empower AI question generation.
                    </p>
                  </div>
                )}
              </div>

              {/* Module Implementation Roadmap Indicator */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 uppercase tracking-wider mb-2 inline-block">
                    Phase 1 Completed
                  </span>
                  <h3 className="text-xl font-bold tracking-tight mt-1">Foundation & AI Architecture Ready</h3>
                  <p className="text-indigo-200 text-sm mt-2 leading-relaxed">
                    Database models, round-robin GroqManager failover service, and admin module routing are established. Select tabs on the left as implementation advances phase-by-phase.
                  </p>
                </div>
                <Award className="absolute right-6 -bottom-6 w-40 h-40 text-indigo-500/10 pointer-events-none" />
              </div>
            </div>
          )}

          {activeTab !== "dashboard" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm max-w-3xl mx-auto my-6 animate-fade-in">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs border border-indigo-100">
                {React.createElement(navItems.find(i => i.id === activeTab)?.icon || FolderTree, { className: "w-8 h-8" })}
              </div>
              <h3 className="text-xl font-black text-slate-800 capitalize">
                {navItems.find(i => i.id === activeTab)?.label}
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                This management console is scheduled for implementation in <span className="font-bold text-indigo-600">{navItems.find(i => i.id === activeTab)?.phase}</span>. 
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                Awaiting instruction: <code className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">Next Phase</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentDashboard;
