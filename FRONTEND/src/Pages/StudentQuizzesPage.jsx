import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Trophy, 
  Search, 
  Eye, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Sparkles, 
  RefreshCw, 
  Calendar, 
  Award,
  Zap,
  HelpCircle,
  X,
  FileText,
  Percent,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import QuizCertificate from "../Components/QuizCertificate";

const StudentQuizzesPage = () => {
  const navigate = useNavigate();
  const [liveQuizzes, setLiveQuizzes] = useState([]);
  const [pastQuizzes, setPastQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/student/my-quizzes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setLiveQuizzes(res.data.liveQuizzes || []);
        setPastQuizzes(res.data.pastQuizzes || []);
      }
    } catch (err) {
      console.error("Error fetching student quizzes:", err);
      toast.error("Failed to load quiz records.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPastQuizzes = pastQuizzes.filter((q) =>
    (q.quizName && q.quizName.toLowerCase().includes(search.toLowerCase())) ||
    (q.registrationId && q.registrationId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <button 
            onClick={fetchQuizzes}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none p-6">
            <Trophy className="w-48 h-48 sm:w-64 sm:h-64 text-amber-400" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Assessment & Quiz Portal</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Quizzes & Challenges
            </h1>
            <p className="text-purple-200 text-xs sm:text-base leading-relaxed">
              Participate in upcoming live coding challenges and review scores & certificates from all your completed quizzes.
            </p>
          </div>
        </div>

        {/* SECTION 1: Live / Active Quizzes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>Live & Active Quizzes</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {liveQuizzes.length} Active
              </span>
            </h2>
          </div>

          {liveQuizzes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No Live Quizzes Currently Active</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  There are no live quizzes running at this moment. Stay tuned for upcoming coding challenges and assessments!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveQuizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white border border-emerald-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                      ● LIVE NOW
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Duration: {quiz.duration || "30 Mins"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{quiz.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{quiz.description}</p>
                  </div>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-200">
                    Start Quiz Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Past / Completed Quizzes ("Kaun Kaun Se Quiz Ho Chuke Hain") */}
        <div className="space-y-4 pt-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Completed Quizzes History ({pastQuizzes.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your scores, ranks, and earned certificates from past assessments.
              </p>
            </div>

            {pastQuizzes.length > 0 && (
              <div className="relative w-full sm:w-72 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter past quizzes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 text-xs font-bold gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
              <span>Loading completed quiz records...</span>
            </div>
          ) : filteredPastQuizzes.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Past Quizzes Recorded</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {search
                  ? `No quizzes matching "${search}".`
                  : "You haven't participated in any quizzes yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPastQuizzes.map((quiz, idx) => (
                <div
                  key={quiz.id || idx}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        <CheckCircle className="w-3 h-3" />
                        <span>COMPLETED</span>
                      </span>
                      {quiz.quizDate && (
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {quiz.quizDate}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        {quiz.quizName}
                      </h3>
                      {quiz.registrationId && (
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Reg ID: {quiz.registrationId}
                        </p>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Score</span>
                        <span className="font-extrabold text-slate-800">{quiz.score} / {quiz.totalScore || "100"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Percentage</span>
                        <span className="font-extrabold text-indigo-600">{quiz.percentage || "N/A"}</span>
                      </div>
                      {quiz.result && quiz.result !== "N/A" && (
                        <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Award / Rank</span>
                          <span className="font-extrabold text-amber-600">{quiz.result}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedQuiz(quiz)}
                      className="px-3.5 py-2.5 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {quiz.hasCertificate && (
                      <button
                        onClick={() => {
                          setSelectedQuiz(quiz);
                          setShowCertificateModal(true);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-md shadow-amber-200"
                        title="Download Certificate"
                      >
                        <Award className="w-4 h-4" />
                        <span>Download Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quiz Detail Modal */}
      {selectedQuiz && !showCertificateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setSelectedQuiz(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] uppercase">
                Completed Assessment
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {selectedQuiz.quizName}
              </h2>
              {selectedQuiz.quizDate && (
                <p className="text-xs text-slate-500 font-medium">
                  Held on: {selectedQuiz.quizDate}
                </p>
              )}
            </div>

            {/* Score Summary Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Final Score</span>
                  <span className="text-xl font-black text-slate-900">{selectedQuiz.score} / {selectedQuiz.totalScore || "100"}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Percentage</span>
                  <span className="text-xl font-black text-indigo-600">{selectedQuiz.percentage || "N/A"}</span>
                </div>
              </div>

              {selectedQuiz.result && selectedQuiz.result !== "N/A" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-0.5">
                  <span className="text-amber-700 text-[10px] uppercase font-extrabold tracking-wider block">Award / Position</span>
                  <span className="text-lg font-black text-amber-600">{selectedQuiz.result}</span>
                </div>
              )}

              <div className="space-y-1.5 pt-2 text-xs text-slate-600 border-t border-slate-200/60">
                <div className="flex justify-between">
                  <span className="text-slate-400">Registration ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedQuiz.registrationId || "N/A"}</span>
                </div>
                {selectedQuiz.effectiveScore && selectedQuiz.effectiveScore !== "N/A" && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Effective Score:</span>
                    <span className="font-bold text-slate-800">{selectedQuiz.effectiveScore}</span>
                  </div>
                )}
                {selectedQuiz.sponsorName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sponsor / Partner:</span>
                    <span className="font-bold text-slate-800">{selectedQuiz.sponsorName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {selectedQuiz.hasCertificate && (
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-amber-200 text-xs sm:text-sm"
                >
                  <Award className="w-4 h-4" />
                  <span>View Official Certificate</span>
                </button>
              )}
              <button
                onClick={() => setSelectedQuiz(null)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal from Quiz Detail */}
      {selectedQuiz && showCertificateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative my-8 space-y-6">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Official Digital Certificate
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Issued for {selectedQuiz.name || "Participant"}
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-md flex justify-center bg-slate-50 p-2 sm:p-4">
              <QuizCertificate
                applicant={{
                  name: selectedQuiz.name || "Participant",
                  email: selectedQuiz.email || ""
                }}
                quizData={{
                  quizName: selectedQuiz.quizName,
                  score: selectedQuiz.score,
                  totalScore: selectedQuiz.totalScore,
                  result: selectedQuiz.result,
                  percentage: selectedQuiz.percentage,
                  registrationId: selectedQuiz.registrationId,
                  sponsorName: selectedQuiz.sponsorName,
                  sponsorLogo: selectedQuiz.sponsorLogo,
                  sponsorSignature: selectedQuiz.sponsorSignature,
                  sponsorSignatoryName: selectedQuiz.sponsorSignatoryName,
                  quizDate: selectedQuiz.quizDate
                }}
                sponsorLogoUrl={selectedQuiz.sponsorLogo}
                onClose={() => setShowCertificateModal(false)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentQuizzesPage;
