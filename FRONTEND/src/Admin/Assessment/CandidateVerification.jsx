import React, { useState } from "react";
import axios from "axios";
import { 
  Users, Search, Award, CheckCircle2, History, 
  UserCheck, Loader2, ShieldCheck, Clock, Layers, FileCheck 
} from "lucide-react";

const CandidateVerification = () => {
  const [searchInput, setSearchInput] = useState("");
  const [candidateData, setCandidateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("credentials"); // 'credentials' | 'assessments' | 'history'

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setCandidateData(null);
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/admin/assessment/recruiter/candidate/${encodeURIComponent(searchInput.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setCandidateData(res.data);
      } else {
        setError(res.data.message || "Candidate record not found in verified registry.");
      }
    } catch (err) {
      setError("No certified candidate dossier found matching this identifier, name, or certificate reference.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Candidate Competency Dossier Search
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Search by Candidate Name, Email address, Certificate ID, or Assessment reference to audit all earned credentials and verified technical achievements.
        </p>

        <form onSubmit={handleSearch} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search candidate by name, email, or certificate ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchInput.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Inspect Candidate
          </button>
        </form>
      </div>

      {/* Error Card */}
      {error && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center shadow-2xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No Dossier Discovered</h4>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
        </div>
      )}

      {/* Candidate Dossier Presentation */}
      {candidateData && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary KPI Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <UserCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Authenticated Candidate Profile</span>
                <h2 className="text-2xl font-black text-slate-900 mt-0.5">{candidateData.summary?.candidateName}</h2>
                <span className="text-xs text-indigo-600 font-mono font-semibold block mt-0.5">ID: {candidateData.summary?.candidateId}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
              <div className="px-4 py-2 bg-slate-50 rounded-2xl text-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Certificates</span>
                <span className="text-xl font-black text-indigo-600">{candidateData.summary?.totalCertificates}</span>
              </div>
              <div className="px-4 py-2 bg-slate-50 rounded-2xl text-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Passed Exams</span>
                <span className="text-xl font-black text-emerald-600">{candidateData.summary?.passedAssessmentsCount}</span>
              </div>
              <div className="px-4 py-2 bg-slate-50 rounded-2xl text-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Audit Checks</span>
                <span className="text-xl font-black text-purple-600">{candidateData.summary?.totalVerificationsLogged}</span>
              </div>
            </div>
          </div>

          {/* Dossier Tabs */}
          <div className="flex border-b border-slate-200 gap-6 px-2">
            <button
              onClick={() => setActiveSubTab("credentials")}
              className={`pb-3 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${activeSubTab === "credentials" ? "border-indigo-600 text-indigo-600 font-black" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            >
              <Award className="w-4 h-4" /> Issued Credentials ({candidateData.certificates?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab("assessments")}
              className={`pb-3 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${activeSubTab === "assessments" ? "border-indigo-600 text-indigo-600 font-black" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            >
              <FileCheck className="w-4 h-4" /> Passed Assessments ({candidateData.passedAssessments?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab("history")}
              className={`pb-3 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${activeSubTab === "history" ? "border-indigo-600 text-indigo-600 font-black" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            >
              <History className="w-4 h-4" /> Verification Timeline ({candidateData.verificationHistory?.length || 0})
            </button>
          </div>

          {/* Tab Content: Credentials */}
          {activeSubTab === "credentials" && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase">
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4">Assessment Competency</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4 text-center">Version</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Verification Seal Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {candidateData.certificates && candidateData.certificates.length > 0 ? (
                    candidateData.certificates.map((cert, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{cert.certificateId}</td>
                        <td className="py-3.5 px-4 font-black text-slate-800">{cert.assessmentTitle}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-600">{cert.version}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {cert.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400 truncate max-w-xs">{cert.verificationHash}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No issued credentials present in archive.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Content: Passed Assessments */}
          {activeSubTab === "assessments" && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase">
                    <th className="py-3 px-4">Evaluation Title</th>
                    <th className="py-3 px-4">Domain Subcategory</th>
                    <th className="py-3 px-4">Completion Date</th>
                    <th className="py-3 px-4 text-center">Outcome Score</th>
                    <th className="py-3 px-4">Evaluation Seal Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {candidateData.passedAssessments && candidateData.passedAssessments.length > 0 ? (
                    candidateData.passedAssessments.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-black text-slate-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          {item.assessmentTitle}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{item.subcategoryId || "Core Tech Domain"}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {item.completionDate ? new Date(item.completionDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black border border-indigo-200">
                            {item.scorePercentage}% (Passed)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400 truncate max-w-xs">{item.evaluationHash}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No evaluation results matched criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Content: Verification History Timeline */}
          {activeSubTab === "history" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Chronological Employer Verification Audited Events
              </h4>
              
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pt-2">
                {candidateData.verificationHistory && candidateData.verificationHistory.length > 0 ? (
                  candidateData.verificationHistory.map((log, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-800">
                          Verified by: <span className="text-indigo-600">{log.verifiedBy}</span> ({log.companyName})
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Just now"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Method: <strong className="text-slate-700">{log.method}</strong> • Target Credential: <code className="font-mono bg-slate-50 px-1 py-0.5 rounded text-indigo-700">{log.certificateId}</code>
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="pl-6 py-6 text-xs text-slate-400 font-semibold">No external verification checks logged for this candidate profile yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateVerification;
