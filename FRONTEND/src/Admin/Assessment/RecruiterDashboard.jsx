import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  ShieldCheck, Award, Users, History, Globe, CheckCircle2, 
  AlertOctagon, RefreshCw, TrendingUp, Building2, Search, Loader2, Lock 
} from "lucide-react";

// Import verification sub-modules
import CertificateVerification from "./CertificateVerification";
import CandidateVerification from "./CandidateVerification";
import VerificationHistory from "./VerificationHistory";
import PublicVerification from "./PublicVerification";

const RecruiterDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("/api/admin/assessment/recruiter/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load recruiter verification dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboard();
    }
  }, [activeTab]);

  const tabs = [
    { id: "dashboard", label: "Recruiter Dashboard & KPIs", icon: TrendingUp },
    { id: "certificate_verify", label: "Certificate Authenticate", icon: ShieldCheck },
    { id: "candidate_verify", label: "Candidate Dossier Search", icon: Users },
    { id: "history", label: "Verification Audit Trail", icon: History },
    { id: "public_portal", label: "Public Gateway Preview", icon: Globe },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-800">
      {/* Read-Only Governance Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Phase 14 Recruiter Verification Platform
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Enterprise Employer Validation & Credential Audit
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl mt-1">
            Strict Read-Only governance module dedicated to third-party employer verification, cryptographic tamper seal audits, and candidate technical dossier inspection without modifying historical results or business data.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-200 text-xs font-bold shrink-0">
          <Lock className="w-4 h-4 text-emerald-600" /> Zero-Trust Immutable Audit Active
        </div>
      </div>

      {/* Navigation Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs overflow-x-auto">
        <nav className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

      {/* Content Area */}
      <div className="transition-all duration-200">
        {activeTab === "dashboard" && (
          loading || !dashboardData ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-3xl">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-semibold">Aggregating employer verification telemetry and KPI indices...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Executive KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-indigo-600" /> Certificates Verified
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-2">{dashboardData.kpi?.certificatesVerified || 0}</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" /> Candidates Verified
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-2">{dashboardData.kpi?.candidatesVerified || 0}</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Search className="w-3.5 h-3.5 text-blue-600" /> Today's Searches
                  </span>
                  <span className="text-2xl font-black text-blue-600 mt-2">{dashboardData.kpi?.todaysSearches || 0}</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verification Success
                  </span>
                  <span className="text-2xl font-black text-emerald-600 mt-2">{dashboardData.kpi?.verificationSuccessPercent || 100}%</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-500" /> Revoked Found
                  </span>
                  <span className="text-2xl font-black text-rose-600 mt-2">{dashboardData.kpi?.revokedCertificates || 0}</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-purple-500" /> Reissued Found
                  </span>
                  <span className="text-2xl font-black text-purple-600 mt-2">{dashboardData.kpi?.reissuedCertificates || 0}</span>
                </div>
              </div>

              {/* Intelligence Columns: Recent Verifications vs Most Verified vs Top Companies */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Verifications Stream */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-600" /> Recent Employer Verification Checks
                    </h4>
                    <button 
                      onClick={() => setActiveTab("history")} 
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      View All Audit Logs →
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {dashboardData.recentVerifications && dashboardData.recentVerifications.length > 0 ? (
                      dashboardData.recentVerifications.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 font-mono text-indigo-600">{item.certificateId}</span>
                            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" /> {item.companyName || item.verifiedBy || "External Employer"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold text-slate-400">
                              {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.verificationStatus === "Verified" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                              {item.verificationStatus || "Verified"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400 font-semibold">No recent employer verifications recorded yet today.</div>
                    )}
                  </div>
                </div>

                {/* Most Verified & Top Companies */}
                <div className="space-y-6">
                  {/* Most Verified Certificates */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Award className="w-4 h-4 text-amber-500" /> Most Verified Credentials
                    </h4>
                    <div className="space-y-2.5">
                      {dashboardData.mostVerifiedCertificates && dashboardData.mostVerifiedCertificates.length > 0 ? (
                        dashboardData.mostVerifiedCertificates.map((cert, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs font-bold py-1.5 border-b border-slate-50 last:border-b-0">
                            <div className="truncate pr-2">
                              <span className="text-indigo-600 block truncate font-mono">{cert.certificateId}</span>
                              <span className="text-[10px] text-slate-400 block truncate font-normal">{cert.assessmentTitle}</span>
                            </div>
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg font-black shrink-0 border border-amber-200 text-[11px]">
                              {cert.verificationCount} checks
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-400 font-semibold">No verification frequency patterns detected.</div>
                      )}
                    </div>
                  </div>

                  {/* Top Companies */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Building2 className="w-4 h-4 text-emerald-600" /> Top Verifying Organizations
                    </h4>
                    <div className="space-y-2">
                      {dashboardData.topCompanies && dashboardData.topCompanies.length > 0 ? (
                        dashboardData.topCompanies.map((comp, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs font-semibold py-1">
                            <span className="text-slate-700">{comp.name}</span>
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">{comp.verifications}</span>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-400 font-semibold">No employer organization clusters recorded yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === "certificate_verify" && <CertificateVerification />}
        {activeTab === "candidate_verify" && <CandidateVerification />}
        {activeTab === "history" && <VerificationHistory />}
        {activeTab === "public_portal" && <PublicVerification />}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
