import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, 
  Layers, Award, Cpu, BookOpen, Loader2, Activity 
} from "lucide-react";

const TrendAnalytics = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const [period, setPeriod] = useState("monthly"); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrends = async (p) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${backendUrl}/api/admin/assessment/analytics/trends?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load trend analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends(period);
  }, [period]);

  if (loading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs font-semibold">Calculating temporal growth trends and trajectory models...</p>
      </div>
    );
  }

  const timeline = data.timeline || [];
  const maxAttempts = Math.max(1, ...timeline.map(t => t.attempts));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Period Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Temporal Growth Trends & Forecasting Intelligence
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only chronological trajectories evaluating attempt expansion velocity, score stabilization, and platform growth rates.
          </p>
        </div>
        
        {/* Period Pills */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {["daily", "weekly", "monthly", "yearly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${period === p ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Period Attempts</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{data.summary?.totalAttemptsPeriod || 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Certificates Issued</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{data.summary?.totalCertificatesPeriod || 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Average Score</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{data.summary?.avgScorePeriod || 0}%</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Growth Velocity</div>
          <div className="text-2xl font-black flex items-center gap-1 mt-1 text-emerald-600">
            {data.summary?.latestGrowthRate >= 0 ? "+" : ""}{data.summary?.latestGrowthRate}%
            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Trajectory Table & Visual Progression */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600">Chronological Telemetry Matrix</span>
          <span className="text-xs text-slate-400 font-semibold">{timeline.length} time intervals mapped</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Period Interval</th>
                <th className="py-3 px-3 text-center">Attempts Volume</th>
                <th className="py-3 px-3 text-center">Certificates</th>
                <th className="py-3 px-3 text-center">Avg Score %</th>
                <th className="py-3 px-3 text-center">Growth Rate</th>
                <th className="py-3 px-3 text-center">AI Runtime Executions</th>
                <th className="py-3 px-4 text-center">Questions Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {timeline.map((item, idx) => {
                const isPositive = (item.growth || 0) >= 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                      {item.label}
                    </td>
                    <td className="py-3.5 px-3 text-center font-black text-indigo-600">
                      {item.attempts}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-600">
                      {item.certificates}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-black">{item.averageScore}%</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-full ${isPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                        {isPositive ? "+" : ""}{item.growth}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-600">
                      {item.runtimeUsage}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      +{item.questionGrowth} Qs
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalytics;
