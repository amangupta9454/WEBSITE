import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Award, ShieldCheck, CheckCircle2, AlertOctagon, 
  Clock, Hash, Building2, Lock, Loader2, Search 
} from "lucide-react";

const PublicVerification = ({ initialCertificateId = null }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const [certIdInput, setCertIdInput] = useState(initialCertificateId || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const executePublicVerify = async (idToVerify) => {
    if (!idToVerify || !idToVerify.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      setResult(null);
      // Query public zero-sensitive verification API gateway
      const res = await axios.get(`${backendUrl}/api/public/assessment/verify/${encodeURIComponent(idToVerify.trim())}`);
      if (res.data) {
        setResult(res.data);
      }
    } catch (err) {
      setResult({
        success: false,
        status: "Unknown",
        message: err.response?.data?.message || "This credential reference token is unrecognized in our authority archive."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCertificateId) {
      executePublicVerify(initialCertificateId);
    }
  }, [initialCertificateId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    executePublicVerify(certIdInput);
  };

  const renderStatusBadge = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "VERIFIED":
        return (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-300 font-black text-base shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <div className="leading-tight">VERIFIED AUTHENTIC</div>
              <div className="text-[10px] font-semibold text-emerald-600">Tamper Seal Intact & Active</div>
            </div>
          </div>
        );
      case "REVOKED":
        return (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-50 text-rose-800 border-2 border-rose-300 font-black text-base shadow-sm">
            <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <div className="leading-tight">CREDENTIAL REVOKED</div>
              <div className="text-[10px] font-semibold text-rose-600">Withdrawn by Issuing Authority</div>
            </div>
          </div>
        );
      case "EXPIRED":
        return (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-50 text-amber-800 border-2 border-amber-300 font-black text-base shadow-sm">
            <Clock className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <div className="leading-tight">EXPIRED CREDENTIAL</div>
              <div className="text-[10px] font-semibold text-amber-600">Recertification Required</div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 border-2 border-slate-300 font-black text-base shadow-sm">
            <AlertOctagon className="w-6 h-6 text-slate-500 shrink-0" />
            <div>
              <div className="leading-tight">UNKNOWN / UNVERIFIED</div>
              <div className="text-[10px] font-semibold text-slate-500">Not Found in Official Registry</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in text-slate-800 py-6">
      {/* Privacy Shield Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
        <Lock className="w-5 h-5 text-indigo-600 shrink-0" />
        <p className="text-xs text-indigo-900 font-semibold leading-relaxed">
          <strong className="font-black uppercase tracking-wider text-indigo-700 block">Zero-Trust Privacy Protection Active:</strong>
          This public employer gateway strictly prevents enumeration and blocks exposure of private candidate emails, phone numbers, internal database IDs, granular marks breakdown, and proprietary test items.
        </p>
      </div>

      {/* Public Search Input (when not embedded directly from URL) */}
      {!initialCertificateId && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center max-w-2xl mx-auto">
          <Award className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
          <h2 className="text-2xl font-black text-slate-900">Official Competency Verification</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Validate the digital authenticity and current governance standing of any Code-A-Nova certified technical diploma or certificate.
          </p>
          
          <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Enter Certificate Reference ID (e.g., CAN-2026-ASMT-000001)..."
                value={certIdInput}
                onChange={(e) => setCertIdInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !certIdInput.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Now"}
            </button>
          </form>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Consulting Cryptographic Ledger & Audit Logs...</p>
        </div>
      )}

      {/* Verification Results Display */}
      {searched && !loading && result && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 block mb-1">
                Verified Employer Presentation Report
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                {result.data?.assessmentTitle || "Unrecognized Credential Token"}
              </h1>
              <p className="text-sm font-bold text-slate-600 mt-1">
                Candidate Name: <span className="text-slate-900 font-black underline decoration-indigo-300">{result.data?.candidateName || "Restricted / Unknown"}</span>
              </p>
            </div>

            <div className="shrink-0">
              {renderStatusBadge(result.status)}
            </div>
          </div>

          {result.success && result.data ? (
            <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase text-[11px]">Certificate Identifier:</span>
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm">{result.data.certificateId}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase text-[11px]">Specification Version:</span>
                  <span className="font-bold text-slate-800">{result.data.version}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase text-[11px]">Issue Timestamp:</span>
                  <span className="font-bold text-slate-800">
                    {result.data.issueDate ? new Date(result.data.issueDate).toLocaleDateString('en-GB', { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-slate-400 font-semibold uppercase text-[11px]">Issuing Authority:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" /> {result.data.issuedBy}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between shadow-inner">
                <div>
                  <div className="flex items-center justify-between text-indigo-400 text-xs font-black uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5"><Hash className="w-4 h-4" /> Cryptographic Integrity Seal</span>
                    <span className="text-[10px] text-emerald-400 font-mono">SHA-256 MATCHED</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    The evaluation results that generated this certificate are permanently anchored to an immutable verification signature in our zero-trust ledger.
                  </p>
                  <div className="p-3 bg-slate-950 text-indigo-300 font-mono text-[10px] rounded-xl break-all border border-slate-800">
                    {result.data.verificationHash}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400 font-semibold">
                  <span>Audit Event Automatically Recorded</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Official Validation
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-6 text-center">
              <p className="text-sm font-semibold text-rose-600 mb-2">{result.message || "This credential cannot be validated against official records."}</p>
              <span className="text-[11px] font-mono text-slate-400">An immutable audit verification event has been recorded for security tracking.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicVerification;
