import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, ShieldCheck, CheckCircle, ChevronLeft, ChevronRight, Save, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

/**
 * Phase 9 Assessment Session Execution Terminal
 * Secure, fullscreen terminal for candidates to complete their assessments.
 */
const AssessmentTerminal = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initializeSession();
  }, [sessionId]);

  // Timer Effect
  useEffect(() => {
    if (!session || remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session, remainingSeconds]);

  const initializeSession = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Resume the session to wake it up
      const resumeRes = await axios.post(`${backendUrl}/api/assessment/sessions/${sessionId}/resume`, {}, { headers });
      if (resumeRes.data.success) {
        setSession(resumeRes.data);
        setRemainingSeconds(resumeRes.data.timer?.remainingSeconds || 1800);
        
        // Populate existing answers if any
        if (resumeRes.data.questionPalette) {
          const loadedAnswers = {};
          resumeRes.data.questionPalette.forEach(a => {
            if (a.selectedOptionId || a.selectedIndex !== undefined) {
               // We fallback to checking if it was answered if selectedOptionId is stripped
               loadedAnswers[a.questionId] = a.selectedOptionId || `option_idx_${a.selectedIndex}`;
            }
          });
          setAnswers(loadedAnswers);
        }
      }

      // 2. Load Question Batch
      const batchRes = await axios.get(`${backendUrl}/api/assessment/sessions/${sessionId}/batch/1`, { headers });
      if (batchRes.data.success) {
        setQuestions(batchRes.data.questions || []);
      }
    } catch (err) {
      console.error("Terminal initialization error:", err);
      toast.error(err.response?.data?.error || "Failed to initialize assessment terminal");
      navigate("/dashboard/assessment/attempt/active");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    const updatedAnswers = { ...answers, [questionId]: optionId };
    setAnswers(updatedAnswers);
    triggerAutosave(updatedAnswers, currentIdx);
  };

  const triggerAutosave = async (currentAnswers, qIdx) => {
    try {
      const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
      const answersArray = Object.keys(currentAnswers).map(qId => ({
        questionId: qId,
        selectedOptionId: currentAnswers[qId],
        timeSpentSeconds: 0
      }));

      await axios.post(`${backendUrl}/api/assessment/sessions/${sessionId}/autosave`, {
        updates: answersArray,
        currentQuestionIndex: qIdx
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn("Autosave failed:", err);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit your assessment? You cannot change answers after submission.")) return;
    executeSubmit("CANDIDATE_SUBMISSION");
  };

  const handleAutoSubmit = async () => {
    toast.error("Time is up! Auto-submitting assessment...");
    executeSubmit("TIME_EXPIRED");
  };

  const executeSubmit = async (reason) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
      const res = await axios.post(`${backendUrl}/api/assessment/sessions/${sessionId}/submit`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Assessment submitted successfully!");
        navigate("/dashboard/assessment/results");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit assessment");
      setIsSubmitting(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium text-sm">Initializing Secure Session Engine...</p>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-lg">
            C<span className="text-indigo-200">A</span>N
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
              {session?.configSnapshot?.categoryName || "Assessment Terminal"}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Phase 9 Live Protection</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 font-mono font-bold text-sm ${remainingSeconds < 300 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(remainingSeconds)}
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Navigation Grid */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col hidden md:flex shrink-0">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" /> Navigation
            </h3>
          </div>
          <div className="p-4 grid grid-cols-4 gap-2 overflow-y-auto">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q._id];
              const isActive = currentIdx === idx;
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`aspect-square rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                    isActive ? "ring-2 ring-indigo-600 ring-offset-1" : ""
                  } ${
                    isAnswered ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-auto p-4 border-t border-slate-100 text-xs font-medium text-slate-500 space-y-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-indigo-600"></div> Answered</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-200"></div> Unanswered</div>
          </div>
        </aside>

        {/* Center: Question Display */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 sm:p-10 flex justify-center">
          <div className="max-w-3xl w-full">
            {currentQ ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md uppercase tracking-wider">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Save className="w-3 h-3" /> Auto-saved
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 leading-relaxed">
                  {currentQ.text}
                </h2>

                <div className="space-y-3 pt-4">
                  {currentQ.options?.map((opt, optIdx) => {
                    const isSelected = answers[currentQ._id] === opt._id;
                    return (
                      <button
                        key={opt._id}
                        onClick={() => handleSelectOption(currentQ._id, opt._id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                          isSelected 
                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm" 
                            : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span className={`text-base font-medium ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                            {opt.text}
                          </span>
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-10 flex items-center justify-between border-t border-slate-200 mt-10">
                  <button
                    onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                    disabled={currentIdx === 0}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                    disabled={currentIdx === questions.length - 1}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">Failed to load question data.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssessmentTerminal;
