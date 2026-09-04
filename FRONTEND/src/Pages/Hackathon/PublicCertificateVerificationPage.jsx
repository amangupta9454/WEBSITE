import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Trophy,
  Terminal,
  FileCheck,
  Layers,
} from "lucide-react";
import SEO from "../../Components/SEO";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5006";

export default function PublicCertificateVerificationPage() {
  const { verificationCode: paramCode } = useParams();
  const [searchCode, setSearchCode] = useState(paramCode || "");
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  const performVerification = async (codeToVerify) => {
    if (!codeToVerify || !codeToVerify.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `${BACKEND_URL}/api/hackathon/certificates/verify/${encodeURIComponent(codeToVerify.trim())}`
      );
      if (res.data?.success) {
        setVerificationResult(res.data);
      } else {
        setVerificationResult(res.data || { isValid: false });
      }
    } catch (err) {
      if (err.response?.data) {
        setVerificationResult(err.response.data);
      } else {
        setError("Network error verifying credential. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramCode) {
      setSearchCode(paramCode);
      performVerification(paramCode);
    }
  }, [paramCode]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCode.trim()) {
      performVerification(searchCode.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      <SEO
        title="Verify Hackathon Certificate | Code-A-Nova Official Registry"
        description="Verify the authenticity of an official Code-A-Nova National Hackathon credential."
      />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/hackathon"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Back to Hackathon"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-[1.5px]">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                  CODE-A-NOVA <span className="text-cyan-400 font-extrabold text-xs">REGISTRY</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
                  Certificate Authentication
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/hackathon/results"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Search / Verify Bar */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Cryptographic Credential Verification
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Official Hackathon Credential Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Verify the validity and achievement credentials of any participant or winning team from the Code-A-Nova National Hackathon 2026.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter Certificate No. (e.g. CAN-2026-XXXX) or Token..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchCode.trim()}
              className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        </div>

        {/* Verification Outcome */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Authenticating cryptographic record...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
            <XCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-bold text-rose-300">{error}</p>
          </div>
        ) : verificationResult ? (
          verificationResult.isValid ? (
            /* VALID CERTIFICATE CARD */
            <div className="bg-gradient-to-b from-emerald-950/20 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-10 border border-emerald-500/40 shadow-2xl shadow-emerald-500/5 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Certificate Verified Active
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Authoritative Credential
                    </h2>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Certificate No.</div>
                  <div className="font-mono text-sm font-black text-emerald-400">
                    {verificationResult.certificateNumber}
                  </div>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Recipient Name</div>
                  <div className="text-base font-black text-white">
                    {verificationResult.recipientName}
                  </div>
                  <div className="text-[11px] text-slate-400">Authenticated Participant</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Award / Title</div>
                  <div className="text-base font-black text-amber-400">
                    {verificationResult.award}
                    {verificationResult.rank ? ` (Rank #${verificationResult.rank})` : ""}
                  </div>
                  <div className="text-[11px] text-slate-400">Official Standing</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Project / Prototype</div>
                  <div className="text-sm font-bold text-slate-200 truncate">
                    {verificationResult.projectName || "Innovator Project"}
                  </div>
                  <div className="text-[11px] text-slate-400">Track: {verificationResult.track}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Issue Date</div>
                  <div className="text-sm font-bold text-slate-200">
                    {verificationResult.issueDate
                      ? new Date(verificationResult.issueDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Verified"}
                  </div>
                  <div className="text-[11px] text-slate-400">Issuer: Code-A-Nova Committee</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Verification Authority: <strong>Code-A-Nova National Hackathon</strong></span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Cryptographically Sealed
                </span>
              </div>
            </div>
          ) : verificationResult.isRevoked ? (
            /* REVOKED CERTIFICATE CARD */
            <div className="bg-gradient-to-b from-rose-950/30 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-10 border border-rose-500/40 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    ✕ Certificate Revoked
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">This Credential Has Been Revoked</h2>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Certificate No:</span>
                  <span className="font-mono font-bold text-white">{verificationResult.certificateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient Name:</span>
                  <span className="font-bold text-white">{verificationResult.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Revocation Reason:</span>
                  <span className="text-rose-400 font-medium">{verificationResult.revocationReason || "Superseded or withdrawn"}</span>
                </div>
              </div>
            </div>
          ) : (
            /* INVALID / NOT FOUND CARD */
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Certificate Not Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {verificationResult.message || "The verification code does not match any active certificate issued by Code-A-Nova."}
                </p>
              </div>
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}
