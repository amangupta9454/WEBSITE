import React, { useState, useRef } from "react";
import {
  Award,
  Download,
  ExternalLink,
  Search,
  Eye,
  ShieldCheck,
  CheckCircle,
  X,
  FolderOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import QuizCertificate from "../../Components/QuizCertificate";

/**
 * My Certificates / Credential Center (Part 10 & Component 5)
 * Lists earned digital credentials with Status, Version, and Verification URLs in existing Light Theme.
 * Completely zero hardcoded demo certificates; shows professional empty state when no credentials exist.
 */
const CredentialCenterView = ({ credentials = [], candidateName = "Participant" }) => {
  const [search, setSearch] = useState("");
  const [selectedCert, setSelectedCert] = useState(null);
  const [downloadingCert, setDownloadingCert] = useState(null);
  const certRef = useRef(null);

  const handleDownload = (id) => {
    const cert = credentials.find((c) => (c.certificateId || c._id) === id);
    if (!cert) return;

    if (cert.category === "Legacy Quiz" && cert.downloadUrl) {
      // It's a legacy quiz, but we can also use our frontend generator if we want.
      // But let's use the exact same template for ALL of them via frontend!
      // This is uniform and avoids backend PDFKit dependencies.
    }

    setDownloadingCert(cert);
    toast.success(`📥 Generating printable certificate ${id}...`);

    setTimeout(() => {
      if (certRef.current) {
        certRef.current.triggerDownload();
        setTimeout(() => setDownloadingCert(null), 1000);
      }
    }, 500);
  };

  const filteredCerts = credentials.filter((c) =>
    (c.assessmentName && c.assessmentName.toLowerCase().includes(search.toLowerCase())) ||
    (c.certificateId && c.certificateId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>My Certificates</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your permanent digital competency credentials. All certificates are traceable, version-controlled, and verifiable.
          </p>
        </div>

        {credentials.length > 0 && (
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search credentials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Certificates List or Empty State */}
      {filteredCerts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm space-y-3">
          <FolderOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Certificates Earned</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? `No certificates found matching "${search}".`
              : "When you successfully pass an assessment evaluation with mastery scores, your verifiable permanent digital certificate will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCerts.map((c) => (
            <div
              key={c.certificateId || c._id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3 h-3" />
                    <span>{c.status || "VERIFIED & ISSUED"}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">v{c.version || 1}</span>
                </div>

                <div>
                  <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wide">
                    {c.category || "Competency Credential"}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-snug mt-0.5">
                    {c.subcategory || c.title || "Technical Domain Credential"}
                  </h3>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
                  <span>ID:</span>
                  <span className="font-bold text-slate-800">{c.certificateId || c._id}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCert(c)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Inspect</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={`/verify/${c.certificateId || c._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1 border border-indigo-200"
                  >
                    <span>Verify</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => handleDownload(c.certificateId || c._id)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Details Modal - Light Theme */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl relative space-y-6 text-slate-800">
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Award className="w-8 h-8" />
              </div>
              <div className="text-[11px] font-extrabold uppercase text-indigo-600 tracking-widest">Verifiable Digital Credential</div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{selectedCert.subcategory || selectedCert.title || selectedCert.assessmentName}</h2>
              <div className="font-mono text-xs font-bold text-slate-600 bg-slate-100 py-1.5 px-4 rounded-xl border border-slate-200 inline-block">
                ID: {selectedCert.certificateId || selectedCert._id}
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-600 border-y border-slate-100 py-4 font-medium">
              <div className="flex justify-between">
                <span>Credential Status:</span>
                <span className="font-extrabold text-emerald-600 uppercase">{selectedCert.status || "Issued & Active"}</span>
              </div>
              <div className="flex justify-between">
                <span>Version Revision:</span>
                <span className="font-mono text-slate-900 font-bold">Version {selectedCert.version || 1} (Immutable)</span>
              </div>
              <div className="flex justify-between">
                <span>Issuance Date:</span>
                <span className="text-slate-900 font-bold">{selectedCert.issueDate ? new Date(selectedCert.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Verified"}</span>
              </div>
              <div className="flex justify-between">
                <span>Public Gateway URL:</span>
                <a href={`/verify/${selectedCert.certificateId || selectedCert._id}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-mono text-[11px]">
                  /verify/{selectedCert.certificateId || selectedCert._id}
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all"
              >
                Close Window
              </button>
              <button
                onClick={() => handleDownload(selectedCert.certificateId || selectedCert._id)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-xs flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Printable PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {downloadingCert && (
        <QuizCertificate
          ref={certRef}
          applicant={{
            name: candidateName,
            email: ""
          }}
          quizData={{
            quizName: downloadingCert.subcategory || downloadingCert.assessmentName || downloadingCert.title || "Technical Domain Credential",
            score: "N/A",
            totalScore: "N/A",
            result: "Assessment Passed",
            percentage: "N/A",
            registrationId: downloadingCert.certificateId || downloadingCert._id,
            sponsorName: "",
            sponsorLogo: "",
            sponsorSignature: "",
            sponsorSignatoryName: "",
            quizDate: downloadingCert.issueDate || downloadingCert.createdAt || new Date().toISOString()
          }}
        />
      )}
    </div>
  );
};

export default CredentialCenterView;
