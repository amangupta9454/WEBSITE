import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";
import { 

  Layers, CheckCircle2, XCircle, Clock, Target, BarChart2, 
  ChevronDown, ChevronUp, AlertCircle, Loader2, PieChart 
} from "lucide-react";

const AssessmentAnalytics = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchAssessmentStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE}/api/admin/assessment/analytics/assessments?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch assessment analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentStats();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Assessment Package Analytics & Telemetry
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive read-only monitoring across active evaluation packages, tracking accuracy rates, completion vs drop rate coefficients, and taxonomic balances.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs font-semibold">Analyzing assessment package trajectories...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No active assessment packages found in inventory.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-100">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-800">{item.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                          {item.isActive ? "Live" : "Draft"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-semibold">{item.categoryName} Domain • {item.questionCount} Questions</span>
                    </div>
                  </div>

                  {/* Quick Telemetry Bar */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Attempts</div>
                      <div className="text-sm font-black text-slate-800">{item.attempts}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Pass / Fail</div>
                      <div className="text-sm font-black flex items-center gap-1">
                        <span className="text-emerald-600">{item.passPercentage}%</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-rose-500">{item.failPercentage}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Avg Score</div>
                      <div className="text-sm font-black text-indigo-600">{item.averageScore}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Accuracy</div>
                      <div className="text-sm font-black text-slate-700">{item.averageAccuracy}%</div>
                    </div>
                    <button 
                      onClick={() => toggleExpand(item.id)}
                      className="p-2 rounded-lg hover:bg-white text-slate-500 hover:text-indigo-600 border border-transparent hover:border-slate-200 transition-all"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Diagnostic Distributions */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    {/* Session Performance Matrix */}
                    <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-3">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-indigo-600" /> Operational Rates
                      </span>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-600">Completion Rate</span>
                            <span className="text-emerald-600 font-bold">{item.completionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${item.completionRate}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-600">Drop Rate (Expired / Abandoned)</span>
                            <span className="text-rose-500 font-bold">{item.dropRate}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full" style={{ width: `${item.dropRate}%` }}></div>
                          </div>
                        </div>
                        <div className="pt-2 flex justify-between items-center text-xs text-slate-600 border-t border-slate-200/60">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400"/> Avg Duration</span>
                          <strong className="text-slate-800">{item.timeTakenMinutes} Mins</strong>
                        </div>
                      </div>
                    </div>

                    {/* Difficulty Distribution */}
                    <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-3">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <PieChart className="w-4 h-4 text-amber-600" /> Difficulty Balance
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-white rounded-lg border border-slate-200/70 flex justify-between items-center">
                          <span className="text-emerald-600 font-bold">Easy</span>
                          <span className="font-black text-slate-800">{item.difficultyDistribution?.easy || 0}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200/70 flex justify-between items-center">
                          <span className="text-blue-600 font-bold">Medium</span>
                          <span className="font-black text-slate-800">{item.difficultyDistribution?.medium || 0}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200/70 flex justify-between items-center">
                          <span className="text-amber-600 font-bold">Hard</span>
                          <span className="font-black text-slate-800">{item.difficultyDistribution?.hard || 0}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200/70 flex justify-between items-center">
                          <span className="text-purple-600 font-bold">Expert</span>
                          <span className="font-black text-slate-800">{item.difficultyDistribution?.expert || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bloom Taxonomy Distribution */}
                    <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-3">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600">Bloom Taxonomy Split</span>
                      <div className="space-y-1.5 text-[11px] font-semibold">
                        {Object.entries(item.bloomDistribution || {}).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center bg-white px-2.5 py-1 rounded border border-slate-100">
                            <span className="capitalize text-slate-600">{key}</span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">{val} Qs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssessmentAnalytics;
