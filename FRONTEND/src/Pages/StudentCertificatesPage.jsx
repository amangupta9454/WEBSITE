import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Award, 
  Search, 
  Download, 
  Eye, 
  Share2, 
  CheckCircle, 
  FolderOpen, 
  ArrowLeft, 
  Sparkles, 
  RefreshCw, 
  Calendar,
  ShieldCheck,
  X
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import QuizCertificate from "../Components/QuizCertificate";

const StudentCertificatesPage = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/student/my-certificates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.certificates) {
        setCertificates(res.data.certificates);
      }
    } catch (err) {
      console.error("Error fetching student certificates:", err);
      toast.error("Failed to load certificates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCerts = certificates.filter((c) =>
    (c.title && c.title.toLowerCase().includes(search.toLowerCase())) ||
    (c.quizName && c.quizName.toLowerCase().includes(search.toLowerCase())) ||
    (c.certificateId && c.certificateId.toLowerCase().includes(search.toLowerCase()))
  );

  const handleShare = (cert) => {
    const text = `🎉 I earned a verified certificate for "${cert.title || cert.quizName}" on Code-A-Nova! Check it out!`;
    if (navigator.share) {
      navigator.share({
        title: cert.title || cert.quizName,
        text: text,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Certificate share text copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Breadcrumb & Action Bar */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <button 
            onClick={fetchCertificates}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none p-6">
            <Award className="w-48 h-48 sm:w-64 sm:h-64 text-amber-400" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Competency Credentials</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              My Certifications & Badges
            </h1>
            <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
              Track and download all verifiable certificates earned across Code-A-Nova quizzes, assessments, and internship programs.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Earned Certificates ({certificates.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All credentials are tamper-proof and verifiable.
            </p>
          </div>

          {certificates.length > 0 && (
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search certificate or quiz name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Certificates Grid / Empty State */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 text-xs font-bold gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Fetching your verified credentials from Code-A-Nova servers...</span>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl shadow-sm space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">No Certificates Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {search
                  ? `No certificates matching "${search}". Try searching with another keyword.`
                  : "You haven't earned any certificates yet. Participate in Code-A-Nova live quizzes or assessments to earn official credentials!"}
              </p>
            </div>
            {!search && (
              <button
                onClick={() => navigate('/my-quizzes')}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200"
              >
                <span>View Live Quizzes</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCerts.map((cert, idx) => (
              <div
                key={cert.certificateId || cert.id || idx}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between space-y-5 relative overflow-hidden group"
              >
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{cert.status || "VERIFIED & ISSUED"}</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      ID: {cert.certificateId || cert.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wide">
                      {cert.type || cert.category || "Competency Credential"}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug mt-0.5 group-hover:text-indigo-600 transition-colors">
                      {cert.title || cert.quizName}
                    </h3>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Recipient:</span>
                      <span className="font-bold text-slate-800">{cert.recipientName || "Participant"}</span>
                    </div>
                    {cert.score && cert.score !== "N/A" && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Score:</span>
                        <span className="font-bold text-indigo-600">{cert.score} / {cert.totalScore || "100"}</span>
                      </div>
                    )}
                    {cert.result && cert.result !== "N/A" && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Result:</span>
                        <span className="font-extrabold text-amber-600">{cert.result}</span>
                      </div>
                    )}
                    {cert.issueDate && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> Date:
                        </span>
                        <span className="font-medium text-slate-700">
                          {typeof cert.issueDate === "string" ? cert.issueDate : new Date(cert.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 relative z-10">
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm shadow-indigo-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View & Download</span>
                  </button>

                  <button
                    onClick={() => handleShare(cert)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
                    title="Share Certificate"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Certificate Viewer Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative my-8 space-y-6">
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Official Digital Certificate
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Issued by Code-A-Nova for {selectedCert.recipientName || "Participant"}
              </p>
            </div>

            {/* Certificate Render */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-md flex justify-center bg-slate-50 p-2 sm:p-4">
              <QuizCertificate
                applicant={{
                  name: selectedCert.recipientName || selectedCert.name || "Participant",
                  email: selectedCert.email || ""
                }}
                quizData={{
                  quizName: selectedCert.quizName || selectedCert.title,
                  score: selectedCert.score,
                  totalScore: selectedCert.totalScore,
                  result: selectedCert.result,
                  percentage: selectedCert.percentage,
                  registrationId: selectedCert.registrationId || selectedCert.certificateId,
                  sponsorName: selectedCert.sponsorName,
                  sponsorLogo: selectedCert.sponsorLogo,
                  sponsorSignature: selectedCert.sponsorSignature,
                  sponsorSignatoryName: selectedCert.sponsorSignatoryName,
                  quizDate: selectedCert.issueDate
                }}
                sponsorLogoUrl={selectedCert.sponsorLogo}
                onClose={() => setSelectedCert(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCertificatesPage;
