import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  BarChart3, Layers, Users, FolderTree, Database, Cpu, Award, TrendingUp, 
  Download, ShieldAlert, Sparkles, CheckCircle2, Clock, AlertCircle, Loader2, FileSpreadsheet, FileText 
} from "lucide-react";

// Import analytical sub-modules
import AssessmentAnalytics from "./AssessmentAnalytics";
import StudentAnalytics from "./StudentAnalytics";
import CategoryAnalytics from "./CategoryAnalytics";
import QuestionAnalytics from "./QuestionAnalytics";
import RuntimeAnalytics from "./RuntimeAnalytics";
import CertificateAnalytics from "./CertificateAnalytics";
import TrendAnalytics from "./TrendAnalytics";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";


const AnalyticsDashboard = () => {
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE}/api/admin/assessment/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setOverviewData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load global analytics overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "overview") {
      fetchOverview();
    }
  }, [activeSubTab]);

  const triggerExport = async (reportType, format) => {
    try {
      setExporting(true);
      setExportMenuOpen(false);
      const token = localStorage.getItem("adminToken");
      const url = `/api/admin/assessment/analytics/export?reportType=${reportType}&format=${format}`;
      
      if (format === "csv") {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob"
        });
        const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", `CodeANova_${reportType}_analytics_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Trigger JSON / Excel representation download
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data.exportData, null, 2));
        const link = document.createElement("a");
        link.href = jsonStr;
        link.setAttribute("download", `CodeANova_${reportType}_report_${Date.now()}.${format === "excel" ? "xlsx.json" : "json"}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export analytics report.");
    } finally {
      setExporting(false);
    }
  };

  const subTabs = [
    { id: "overview", label: "Executive Overview", icon: BarChart3 },
    { id: "assessments", label: "Assessment Analytics", icon: Layers },
    { id: "students", label: "Student Intelligence", icon: Users },
    { id: "categories", label: "Category Diagnostics", icon: FolderTree },
    { id: "questions", label: "Question Bank Audit", icon: Database },
    { id: "runtime", label: "AI Runtime Health", icon: Cpu },
    { id: "certificates", label: "Certificate Issuance", icon: Award },
    { id: "trends", label: "Temporal Trends", icon: TrendingUp },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-800">
      {/* Read-Only Governance Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Phase 13 Enterprise Analytics & Intelligence Platform
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Read-Only Telemetry & Evaluation Insights
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Strict non-modifying governance architecture. Consumes existing data from Assessment Sessions, Results, Certificates, Question Bank, and AI Runtime without re-evaluating scores or altering business records.
          </p>
        </div>

        {/* Export Report Control */}
        <div className="relative shrink-0">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            disabled={exporting}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Analytics Report
          </button>

          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-fade-in">
              <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1">Select Report Format</div>
              <button 
                onClick={() => triggerExport(activeSubTab, "csv")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-600" /> Export current domain as CSV
              </button>
              <button 
                onClick={() => triggerExport(activeSubTab, "excel")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export structured Excel / JSON
              </button>
              <button 
                onClick={() => triggerExport("overview", "csv")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 flex items-center gap-2.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Export Master Executive Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Scrollable Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs overflow-x-auto">
        <nav className="flex items-center gap-1 min-w-max">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm font-black"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub-tab Views */}
      <div className="transition-all duration-200">
        {activeSubTab === "overview" && (
          loading || !overviewData ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-3xl">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-semibold">Compiling global assessment data structures...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Primary Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Assessments</span>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Layers className="w-5 h-5" /></div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900">{overviewData.totalAssessments}</div>
                    <div className="text-xs text-emerald-600 font-semibold mt-1">
                      {overviewData.published} Published • {overviewData.draft} Drafts
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase">Sessions Telemetry</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900">{overviewData.completedSessions}</div>
                    <div className="text-xs text-indigo-600 font-semibold mt-1">
                      {overviewData.runningSessions} Active Live Attempts
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase">Certificates Issued</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Award className="w-5 h-5" /></div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900">{overviewData.certificates}</div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">
                      Verifiable & Cryptographically Signed
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase">Question Bank</span>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><Database className="w-5 h-5" /></div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900">{overviewData.questionInventory}</div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">
                      Approved Multi-Difficulty Inventory
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Performance Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Candidate Evaluation Averages</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Pass Rate: {overviewData.passRate}%
                    </span>
                  </div>
                  <div className="my-6 text-center">
                    <div className="text-5xl font-black text-indigo-600 tracking-tight">{overviewData.averageScore}%</div>
                    <span className="text-xs text-slate-400 font-semibold block mt-1">Global Candidate Aggregate Score</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: `${Math.min(100, overviewData.averageScore)}%` }}></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">AI Runtime Cluster Health</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Groq LPU Ready
                    </span>
                  </div>
                  <div className="my-6 text-center">
                    <div className="text-5xl font-black text-emerald-600 tracking-tight">{overviewData.aiRuntimeHealth}%</div>
                    <span className="text-xs text-slate-400 font-semibold block mt-1">High Availability & Zero Downtime</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, overviewData.aiRuntimeHealth)}%` }}></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Operational Efficiency</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700 font-mono">
                      <Clock className="w-3 h-3 inline mr-1" /> {overviewData.averageCompletionTime} mins avg
                    </span>
                  </div>
                  <div className="my-6 text-center">
                    <div className="text-5xl font-black text-slate-800 tracking-tight">{overviewData.questionCoverage}%</div>
                    <span className="text-xs text-slate-400 font-semibold block mt-1">Question Bank Coverage Fulfillment</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-700 h-full" style={{ width: `${Math.min(100, overviewData.questionCoverage)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {activeSubTab === "assessments" && <AssessmentAnalytics />}
        {activeSubTab === "students" && <StudentAnalytics />}
        {activeSubTab === "categories" && <CategoryAnalytics />}
        {activeSubTab === "questions" && <QuestionAnalytics />}
        {activeSubTab === "runtime" && <RuntimeAnalytics />}
        {activeSubTab === "certificates" && <CertificateAnalytics />}
        {activeSubTab === "trends" && <TrendAnalytics />}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
