import React, { useState } from "react";
import axios from "axios";
import { 
  ShieldCheck, Search, Award, CheckCircle2, AlertOctagon, 
  Clock, Hash, Building2, UserCheck, ExternalLink, QrCode, Loader2 
} from "lucide-react";

const CertificateVerification = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const [searchInput, setSearchInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${backendUrl}/api/admin/assessment/recruiter/certificate/${encodeURIComponent(searchInput.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setResult(res.data);
      } else {
        setError(res.data.message || "Credential verification failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "No authentic digital competency certificate found matching this reference identifier.");
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Authentic
          </span>
        );
      case "REVOKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wide">
            <AlertOctagon className="w-4 h-4 text-rose-600" /> Revoked Credential
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-wide">
            <Clock className="w-4 h-4 text-amber-600" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-xs font-black uppercase tracking-wide">
            Unknown Status
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Search Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Real-Time Credential Authenticity Inspector
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Enter a Certificate ID (e.g. <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold">CAN-2026-ASMT-000001</code>), cryptographic SHA-256 seal hash, or scanned QR code payload to instantly authenticate competency badges.
        </p>

        <form onSubmit={handleVerify} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Enter Certificate ID, SHA-256 Hash, or QR payload..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchInput.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Verify Authenticity
          </button>
        </form>
      </div>

      {/* Error / Not Found Display */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-xs animate-fade-in">
          <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h4 className="text-base font-black text-rose-800">Verification Inspection Negative</h4>
          <p className="text-xs text-rose-600 font-semibold mt-1 max-w-md mx-auto">{error}</p>
          <div className="mt-4 text-[11px] font-mono text-slate-400">
            Immutable audit log created: Verification attempt flagged as UNKNOWN/FAILED.
          </div>
        </div>
      )}

      {/* Validated Credential Profile */}
      {result && result.certificate && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md animate-fade-in">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 pointer-events-none">
              <Award className="w-64 h-64 text-indigo-400" />
            </div>
            <div className="z-10">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span className="text-xs uppercase font-black tracking-widest text-slate-400">Code-A-Nova Certification Authority</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {result.certificate.assessmentTitle}
              </h2>
              <p className="text-sm font-semibold text-slate-300 mt-1 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" /> Issued to: <span className="font-bold text-white underline">{result.certificate.candidateName}</span>
              </p>
            </div>
            <div className="z-10 self-start sm:self-center">
              {renderStatusBadge(result.certificate.status)}
            </div>
          </div>

          {/* Details Matrix */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-indigo-600" /> Cryptographic Identity & Metadata
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Certificate Reference ID:</span>
                  <span className="font-mono font-black text-slate-800 bg-slate-100 px-2 py-1 rounded">{result.certificate.certificateId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Specification Version:</span>
                  <span className="font-bold text-indigo-600">{result.certificate.version}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Issuance Authority:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {result.certificate.issuedBy}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-semibold">Issuance Timestamp:</span>
                  <span className="font-bold text-slate-800">
                    {result.certificate.issueDate ? new Date(result.certificate.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-3">
                  <QrCode className="w-4 h-4 text-indigo-600" /> SHA-256 Digital Verification Seal
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  This credential underwent zero-trust tamper inspection. The evaluation signature has been mathematically verified against the immutable database registry.
                </p>
                <div className="mt-4 p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[10px] break-all border border-slate-700 shadow-inner">
                  {result.certificate.verificationHash}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Audit Log Recorded
                </span>
                <a 
                  href={`/verify/${result.certificate.certificateId}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                >
                  View Public URL <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateVerification;
