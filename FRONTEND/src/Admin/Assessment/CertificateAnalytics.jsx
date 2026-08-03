import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";
import { 

  Award, CheckCircle2, AlertOctagon, RefreshCw, Eye, Download, 
  Calendar, TrendingUp, Loader2, ShieldCheck 
} from "lucide-react";

const CertificateAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("monthly"); // 'daily' | 'monthly'

  const fetchCertAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE}/api/admin/assessment/analytics/certificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load certificate analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs font-semibold">Gathering digital credential verification logs...</p>
      </div>
    );
  }

  const chartData = timeframe === "daily" ? (data.dailyIssuance || []) : (data.monthlyIssuance || []);
  const maxVal = Math.max(1, ...chartData.map(d => d.issued));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Verifiable Digital Credential & Certificate Telemetry
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only surveillance tracking authentic certificates issued, revocation events, external third-party verifications, and PDF credential downloads.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          Cryptographically Validated
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Issued Active
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{data.issued}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" /> Revoked
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">{data.revoked}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Reissued
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">{data.reissued}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-500" /> Verifications
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{data.verificationCount}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-purple-500" /> Downloads
          </div>
          <div className="text-2xl font-black text-purple-600 mt-1">{data.downloadCount}</div>
        </div>
      </div>

      {/* Issuance Histogram / Timeline Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Credential Issuance Trajectory
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Chronological frequency of successfully evaluated certificates delivered to candidates.</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setTimeframe("daily")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === "daily" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Daily (Last 7 Days)
            </button>
            <button 
              onClick={() => setTimeframe("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === "monthly" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Monthly (Last 6 Months)
            </button>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="pt-6 pb-2">
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-6 px-4 bg-slate-50/80 rounded-2xl border border-slate-100 p-6">
            {chartData.map((item, idx) => {
              const heightPct = Math.max(12, Math.round((item.issued / maxVal) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition-all absolute -top-2 bg-slate-800 text-white text-[11px] font-black px-2 py-0.5 rounded shadow-md pointer-events-none">
                    {item.issued} Issued
                  </div>
                  <div 
                    style={{ height: `${heightPct}%` }} 
                    className="w-full max-w-[48px] bg-indigo-600 hover:bg-indigo-500 rounded-t-xl transition-all relative group-hover:shadow-lg"
                  >
                    <div className="absolute top-1 inset-x-0 text-[10px] font-black text-indigo-100 text-center opacity-80">
                      {item.issued > 0 ? item.issued : ""}
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-2 text-center whitespace-nowrap truncate w-full">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateAnalytics;
