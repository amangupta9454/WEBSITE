import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Loader2,
  Search,
  BrainCircuit,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  Eye,
  Trash2,
  X,
  GraduationCap,
  Building2,
  MapPin,
  UserCheck,
  FileText,
  Award,
  AlertTriangle
} from 'lucide-react';

const QuizUsersAdmin = () => {
  const [quizApplicants, setQuizApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [applicantToDelete, setApplicantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchQuizApplicants();
  }, []);

  const fetchQuizApplicants = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/quiz-applicants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizApplicants(res.data.applicants || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch quiz applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplicant = async () => {
    if (!applicantToDelete) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('adminToken');
      const res = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/quiz-applicants/${applicantToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success('Quiz applicant deleted successfully');
        setQuizApplicants(prev => prev.filter(app => app._id !== applicantToDelete._id));
        setApplicantToDelete(null);
        if (selectedApplicant?._id === applicantToDelete._id) {
          setSelectedApplicant(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete applicant');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredApplicants = quizApplicants.filter(app => {
    const q = searchQuery.toLowerCase();
    const quizNames = app.quizzes?.map(qz => qz.quizName?.toLowerCase()).join(" ") || "";
    return (
      app.name?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.quizName?.toLowerCase().includes(q) ||
      quizNames.includes(q) ||
      app.registrationId?.toLowerCase().includes(q) ||
      app.organisation?.toLowerCase().includes(q) ||
      app.domain?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600" />
            Imported Quiz Users ({quizApplicants.length})
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            View all candidate data imported from Unstop for different quizzes.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, quiz, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full sm:w-72 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz Registrations</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score / Result</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Domain & Organisation</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((app) => {
                  const quizList = app.quizzes && app.quizzes.length > 0
                    ? app.quizzes
                    : [{ quizName: app.quizName, registrationId: app.registrationId, score: app.score, result: app.result }];
                  
                  return (
                    <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                            {app.name}
                            {quizList.length > 1 && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">
                                {quizList.length} Quizzes
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{app.email}</span>
                          </div>
                          {app.mobile && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-500">{app.mobile}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {quizList.slice(0, 2).map((q, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {q.quizName}
                              </span>
                              {q.registrationId && (
                                <span className="text-[11px] text-slate-400 font-mono">({q.registrationId})</span>
                              )}
                            </div>
                          ))}
                          {quizList.length > 2 && (
                            <span className="text-[11px] text-indigo-600 font-medium cursor-pointer" onClick={() => setSelectedApplicant(app)}>
                              +{quizList.length - 2} more quizzes
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          {app.score && app.score !== "N/A" ? (
                            <span className="font-bold text-slate-900">
                              Score: {app.score} {app.totalScore && app.totalScore !== "N/A" ? `/ ${app.totalScore}` : ""}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Score: N/A</span>
                          )}
                          {app.result && app.result !== "N/A" ? (
                            <span className="text-emerald-700 font-semibold mt-0.5">{app.result}</span>
                          ) : (
                            <span className="text-slate-400 text-[11px] mt-0.5">Result: N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{app.domain || "N/A"}</span>
                          {app.course && <span className="text-xs text-slate-500 mt-0.5">{app.course}</span>}
                          {app.organisation && <span className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{app.organisation}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details Button */}
                          <button
                            onClick={() => setSelectedApplicant(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-lg transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>

                          {/* Resume Link */}
                          {app.resumeUrl && app.resumeUrl !== 'NA' && app.resumeUrl !== 'N/A' && (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Resume"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => setApplicantToDelete(app)}
                            className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Applicant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium">No quiz applicants found</p>
                      <p className="text-slate-400 text-sm mt-1">Try adjusting your search query or import new data.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  {selectedApplicant.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    {selectedApplicant.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedApplicant.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Mobile Number</span>
                <span className="text-slate-800 font-bold text-sm mt-0.5 block">{selectedApplicant.mobile || "N/A"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Gender</span>
                <span className="text-slate-800 font-bold text-sm mt-0.5 block">{selectedApplicant.gender || "N/A"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Location</span>
                <span className="text-slate-800 font-bold text-sm mt-0.5 block">{selectedApplicant.location || "N/A"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Domain</span>
                <span className="text-indigo-700 font-bold text-sm mt-0.5 block">{selectedApplicant.domain || "N/A"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Course</span>
                <span className="text-slate-800 font-bold text-sm mt-0.5 block">{selectedApplicant.course || "N/A"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Graduation Year</span>
                <span className="text-slate-800 font-bold text-sm mt-0.5 block">{selectedApplicant.yearOfGraduation || "N/A"}</span>
              </div>
            </div>

            {/* Academic & Organisation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span><strong>Organisation / College:</strong> {selectedApplicant.organisation || "N/A"}</span>
              </div>
              {selectedApplicant.specialization && (
                <div className="flex items-center gap-2 text-slate-700">
                  <GraduationCap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span><strong>Specialization:</strong> {selectedApplicant.specialization}</span>
                </div>
              )}
              {selectedApplicant.resumeUrl && selectedApplicant.resumeUrl !== 'NA' && selectedApplicant.resumeUrl !== 'N/A' && (
                <div className="flex items-center gap-2 pt-1">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <a
                    href={selectedApplicant.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    View Candidate Resume <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* All Quiz Registrations & Results */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Quiz Registrations & Results ({(selectedApplicant.quizzes?.length || 1)})
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-3">Quiz Name</th>
                      <th className="p-3">Registration ID</th>
                      <th className="p-3">Score / Marks</th>
                      <th className="p-3">Result / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedApplicant.quizzes && selectedApplicant.quizzes.length > 0
                      ? selectedApplicant.quizzes
                      : [{
                          quizName: selectedApplicant.quizName,
                          registrationId: selectedApplicant.registrationId,
                          score: selectedApplicant.score,
                          result: selectedApplicant.result
                        }]
                    ).map((qz, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">{qz.quizName}</td>
                        <td className="p-3 font-mono text-slate-600">{qz.registrationId || "N/A"}</td>
                        <td className="p-3 font-bold text-slate-800">
                          {qz.score || "N/A"} {qz.totalScore && qz.totalScore !== "N/A" ? `/ ${qz.totalScore}` : ""}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            qz.result?.toLowerCase().includes("pass") || qz.result?.toLowerCase().includes("qual")
                              ? "bg-emerald-100 text-emerald-800"
                              : qz.result && qz.result !== "N/A"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {qz.result || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {applicantToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Delete Quiz Applicant?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete applicant <strong className="text-slate-800">{applicantToDelete.name}</strong> ({applicantToDelete.email})? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setApplicantToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApplicant}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Applicant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizUsersAdmin;
