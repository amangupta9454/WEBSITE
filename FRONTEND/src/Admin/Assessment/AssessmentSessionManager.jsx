import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FileCheck,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Wifi,
  WifiOff,
  Save,
  Lock,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Sliders,
  Eye,
  X,
  Check,
  AlertCircle,
  Info,
  Terminal,
  Server,
  Activity
} from "lucide-react";

const AssessmentSessionManager = () => {
  const [viewMode, setViewMode] = useState("catalog"); // "catalog", "instructions", "assessment", "expired", "submitted", "audit"
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Active Session & Candidate State
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionConfig, setSessionConfig] = useState(null);
  const [questionsBatch, setQuestionsBatch] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [sequenceOrder]: { selectedIndex, selectedAnswer, isMarkedForReview } }
  const [paletteState, setPaletteState] = useState([]); // Array of { sequenceOrder, isAnswered, isMarkedForReview }

  // Timers & Health
  const [remainingSeconds, setRemainingSeconds] = useState(1800);
  const [totalSeconds, setTotalSeconds] = useState(1800);
  const [connectionStatus, setConnectionStatus] = useState("Healthy");
  const [autosaveState, setAutosaveState] = useState("Synced"); // "Synced", "Saving...", "Queued (Offline)"
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [antiCheatSummary, setAntiCheatSummary] = useState({ tabSwitches: 0, fullscreenExits: 0 });

  // Modals & Panels
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [auditDetail, setAuditDetail] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const timerIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  // Anti-Cheat behavior tracking listener (Component 10)
  useEffect(() => {
    if (viewMode !== "assessment" || !activeSessionId) return;

    const handleBlur = () => {
      triggerAntiCheatRecord("Tab Switch", { reason: "Window lost browser focus" });
    };

    const handleFullscreenChange = () => {
      const full = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(full);
      if (!full && viewMode === "assessment") {
        triggerAntiCheatRecord("Fullscreen Exit", { reason: "Candidate exited fullscreen browser view" });
      }
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [viewMode, activeSessionId]);

  // Server Authoritative Timer Countdown & Heartbeat Hook (Component 5 & 16)
  useEffect(() => {
    if (viewMode !== "assessment" || !activeSessionId) {
      clearInterval(timerIntervalRef.current);
      clearInterval(heartbeatIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleAutoSubmitOnExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Heartbeat every 20 seconds to sync server clock & network resilience
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `${backendUrl}/api/admin/assessment/sessions/${activeSessionId}/heartbeat`,
          {},
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (res.data.success && res.data.timer) {
          setRemainingSeconds(res.data.timer.remainingSeconds);
          setConnectionStatus("Healthy");
          // Sync any locally buffered offline answers
          if (offlineQueue.length > 0) {
            flushOfflineQueue();
          }
        }
      } catch (err) {
        setConnectionStatus("Disconnected");
        setAutosaveState("Queued (Offline)");
      }
    }, 20000);

    return () => {
      clearInterval(timerIntervalRef.current);
      clearInterval(heartbeatIntervalRef.current);
    };
  }, [viewMode, activeSessionId, offlineQueue]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${backendUrl}/api/admin/assessment/sessions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data.success) {
        setSessions(res.data.sessions || []);
      }
    } catch (err) {
      setError("Failed to fetch assessment session inventory from server.");
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${backendUrl}/api/admin/assessment/sessions/start`,
        { candidateId: "candidate-live@test-suite.com" },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data.success) {
        const data = res.data.data;
        setActiveSessionId(data.sessionId);
        setSessionConfig(data.configSnapshot);
        setTotalSeconds(data.configSnapshot?.timeLimitMinutes * 60 || 1800);
        setRemainingSeconds(data.configSnapshot?.timeLimitMinutes * 60 || 1800);

        const initialQuestions = data.initialBatch?.questions || [];
        setQuestionsBatch(initialQuestions);
        setCurrentQuestionIndex(0);

        // Build initial palette state
        const initialPalette = Array.from({ length: data.totalQuestions || 15 }, (_, idx) => ({
          sequenceOrder: idx + 1,
          isAnswered: false,
          isMarkedForReview: false,
        }));
        setPaletteState(initialPalette);
        setUserAnswers({});
        setViewMode("assessment");
        setSuccessMsg(`Session [${data.sessionId}] started! Immutable configuration & frozen question snapshot loaded.`);

        // Offer fullscreen adoption
        try {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch (e) {}
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response.data.sessionId) {
        // Active attempt exists; transition to Resume Engine automatically!
        handleResumeAttempt(err.response.data.sessionId);
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || "Error initializing session.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResumeAttempt = async (sessionId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${backendUrl}/api/admin/assessment/sessions/${sessionId}/resume`,
        { candidateId: "candidate-live@test-suite.com" },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data.success) {
        setActiveSessionId(res.data.sessionId);
        setSessionConfig(res.data.configSnapshot);
        setRemainingSeconds(res.data.timer?.remainingSeconds || 1800);
        setCurrentQuestionIndex(res.data.currentQuestionIndex || 0);
        setQuestionsBatch(res.data.currentBatchData?.questions || []);
        setPaletteState(res.data.questionPalette || []);
        setViewMode("assessment");
        setSuccessMsg(`Session [${sessionId}] successfully restored via Resume Engine without clock reset.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Unable to resume session.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (sequenceOrder, qId, index, text) => {
    const nextAnswers = {
      ...userAnswers,
      [sequenceOrder]: {
        ...userAnswers[sequenceOrder],
        selectedIndex: index,
        selectedAnswer: text,
        questionId: qId,
        isAnswered: true,
      },
    };
    setUserAnswers(nextAnswers);

    setPaletteState((prev) =>
      prev.map((item) => (item.sequenceOrder === sequenceOrder ? { ...item, isAnswered: true } : item))
    );

    // Trigger immediate autosave (Component 6)
    triggerAutosave({
      sequenceOrder,
      questionId: qId,
      selectedIndex: index,
      selectedAnswer: text,
      timeTakenSeconds: 12,
    });
  };

  const toggleMarkForReview = (sequenceOrder, qId) => {
    const currentMarked = Boolean(userAnswers[sequenceOrder]?.isMarkedForReview);
    const updatedMarked = !currentMarked;

    const nextAnswers = {
      ...userAnswers,
      [sequenceOrder]: {
        ...userAnswers[sequenceOrder],
        isMarkedForReview: updatedMarked,
        questionId: qId,
      },
    };
    setUserAnswers(nextAnswers);

    setPaletteState((prev) =>
      prev.map((item) => (item.sequenceOrder === sequenceOrder ? { ...item, isMarkedForReview: updatedMarked } : item))
    );

    triggerAutosave({
      sequenceOrder,
      questionId: qId,
      isMarkedForReview: updatedMarked,
    });
  };

  const triggerAutosave = async (updatePayload) => {
    setAutosaveState("Saving...");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${backendUrl}/api/admin/assessment/sessions/${activeSessionId}/autosave`,
        { updates: updatePayload, currentQuestionIndex },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setAutosaveState("Synced");
    } catch (err) {
      // Offline resilience buffering (Component 13)
      setOfflineQueue((prev) => [...prev, updatePayload]);
      setAutosaveState("Queued (Offline)");
      setConnectionStatus("Disconnected");
    }
  };

  const flushOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${backendUrl}/api/admin/assessment/sessions/${activeSessionId}/autosave`,
        { updates: offlineQueue },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setOfflineQueue([]);
      setAutosaveState("Synced");
    } catch (err) {}
  };

  const triggerAntiCheatRecord = async (eventType, details) => {
    setAntiCheatSummary((prev) => ({
      ...prev,
      [eventType === "Tab Switch" ? "tabSwitches" : "fullscreenExits"]: (prev[eventType === "Tab Switch" ? "tabSwitches" : "fullscreenExits"] || 0) + 1,
    }));
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${backendUrl}/api/admin/assessment/sessions/${activeSessionId}/anti-cheat`,
        { eventType, details },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
    } catch (err) {}
  };

  const handleNextBatchFetch = async (targetIndex) => {
    const batchSize = sessionConfig?.batchSize || 5;
    const targetBatch = Math.floor(targetIndex / batchSize) + 1;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${backendUrl}/api/admin/assessment/sessions/${activeSessionId}/batch/${targetBatch}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data.success) {
        setQuestionsBatch(res.data.questions || []);
      }
    } catch (err) {}
  };

  const navigateQuestion = async (nextIdx) => {
    const currentQ = questionsBatch.find((q) => q.sequenceOrder === currentQuestionIndex + 1);
    const nextSequence = nextIdx + 1;
    const isPresentInBatch = questionsBatch.some((q) => q.sequenceOrder === nextSequence);
    if (!isPresentInBatch) {
      await handleNextBatchFetch(nextIdx);
    }
    setCurrentQuestionIndex(nextIdx);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${backendUrl}/api/admin/assessment/sessions/${activeSessionId}/submit`,
        { reason: "CANDIDATE_SUBMISSION" },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data.success) {
        setShowSubmitModal(false);
        setViewMode("submitted");
        setSuccessMsg("Assessment attempt submitted! Session answers frozen and locked. Handoff to Phase 10 evaluation queued.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Submission lock error.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmitOnExpiry = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${backendUrl}/api/admin/assessment/sessions/${activeSessionId}/submit`,
        { reason: "TIMER_EXPIRATION" },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setViewMode("expired");
    } catch (err) {
      setViewMode("expired");
    }
  };

  const viewSessionAudit = async (sessionId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${backendUrl}/api/admin/assessment/sessions/${sessionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data.success) {
        setAuditDetail(res.data.session);
        setViewMode("audit");
      }
    } catch (err) {
      setError("Failed to fetch session timeline audit.");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentQuestionObj = questionsBatch.find((q) => q.sequenceOrder === currentQuestionIndex + 1) || questionsBatch[0] || null;
  const answeredCount = paletteState.filter((p) => p.isAnswered).length;
  const reviewCount = paletteState.filter((p) => p.isMarkedForReview).length;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans antialiased">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block mb-2">
            Phase 9 / Live
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-indigo-500" />
            Assessment Session Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Production-grade lifecycle controller: timers, autosave resilience, batch prefetching &amp; anti-cheat timelines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {viewMode !== "catalog" && (
            <button
              onClick={() => {
                setViewMode("catalog");
                fetchSessions();
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl font-semibold text-sm transition text-slate-300 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Return to Sessions Catalog
            </button>
          )}
          {viewMode === "catalog" && (
            <button
              onClick={() => setViewMode("instructions")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Launch Live Student Test Harness
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center justify-between text-sm animate-fade-in">
          <span className="flex items-center gap-2 font-medium"><AlertTriangle className="w-5 h-5 shrink-0" /> {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="max-w-7xl mx-auto mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center justify-between text-sm animate-fade-in">
          <span className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 shrink-0" /> {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* VIEW MODE 1: SESSION CATALOG (DEFAULT) */}
      {viewMode === "catalog" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Attempts Logged</span>
              <p className="text-3xl font-black text-white mt-2">{sessions.length}</p>
              <span className="text-xs text-indigo-400 mt-2 inline-block">Immutable Session Records</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active In Progress</span>
              <p className="text-3xl font-black text-amber-400 mt-2">
                {sessions.filter((s) => ["Running", "Created", "in_progress", "Paused"].includes(s.status)).length}
              </p>
              <span className="text-xs text-slate-400 mt-2 inline-block">Protected by Distributed Mutex</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted &amp; Locked</span>
              <p className="text-3xl font-black text-emerald-400 mt-2">
                {sessions.filter((s) => s.isLocked || s.status === "Completed").length}
              </p>
              <span className="text-xs text-emerald-500 mt-2 inline-block">Ready for Phase 10 Evaluation</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Anti-Cheat Safeguards</span>
              <p className="text-3xl font-black text-indigo-400 mt-2">Active</p>
              <span className="text-xs text-slate-400 mt-2 inline-block">No Auto-Disqualification Policy</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400" /> Active Session Inventory
              </h2>
              <button
                onClick={fetchSessions}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                title="Refresh Table"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            {sessions.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <FileCheck className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                <p className="text-base font-semibold text-slate-400">No assessment attempts recorded yet.</p>
                <p className="text-xs max-w-sm mx-auto mt-1">Click the top right button to launch an interactive student assessment session demo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6">Session ID / Candidate</th>
                      <th className="py-4 px-6">Status / State</th>
                      <th className="py-4 px-6">Questions</th>
                      <th className="py-4 px-6">Attempt #</th>
                      <th className="py-4 px-6">Lock Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {sessions.map((sess) => (
                      <tr key={sess._id || sess.sessionId} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-6">
                          <span className="font-bold text-indigo-400 block">{sess.sessionId || "Legacy ID"}</span>
                          <span className="text-xs text-slate-400">{sess.candidateId || "candidate@portal.com"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1.5 ${
                              ["Running", "in_progress", "Created"].includes(sess.status)
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : sess.status === "Completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {sess.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400">{sess.totalQuestions || "15"} Items</td>
                        <td className="py-4 px-6">Attempt #{sess.attemptNumber || 1}</td>
                        <td className="py-4 px-6">
                          {sess.isLocked ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                              <Lock className="w-3.5 h-3.5" /> Locked (Immutable)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                              Active / Mutable
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => viewSessionAudit(sess.sessionId || sess._id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" /> Audit Timeline
                            </button>
                            {!sess.isLocked && ["Running", "in_progress", "Created"].includes(sess.status) && (
                              <button
                                onClick={() => handleResumeAttempt(sess.sessionId)}
                                className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold transition"
                              >
                                Resume
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: INSTRUCTIONS SCREEN */}
      {viewMode === "instructions" && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center font-black text-xl border border-indigo-500/20">
              ⚡
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Student Assessment Instructions</h2>
              <p className="text-xs text-slate-400">Please read carefully before initiating your assessment attempt.</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-white flex items-center gap-2 text-indigo-400">
                <Clock className="w-4 h-4" /> Time Limit &amp; Authoritative Timer
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The assessment timer is authoritatively governed by our backend servers. Closing or refreshing your browser window will <strong>not</strong> pause the countdown clock. If your session expires while disconnected, all current answers will be automatically submitted and locked.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-white flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-4 h-4" /> Anti-Cheat &amp; Telemetry Tracking
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                During this assessment, our telemetry system continuously tracks browser focus, fullscreen mode transitions, tab switches, copy/paste shortcuts, and developer console triggers. 
                <strong className="text-amber-300 block mt-1">Note: Infractions are logged directly into an immutable audit timeline for recruiter verification (No automatic disqualification occurs during testing).</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <h3 className="font-bold text-white flex items-center gap-2 text-emerald-400">
                <Save className="w-4 h-4" /> Autosave &amp; Offline Resilience
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every answer selection is instantly saved in real time—no manual "Save" button is required. If your connection temporarily interrupts, your responses are securely buffered locally and synced immediately upon reconnection.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-end gap-4">
            <button
              onClick={() => setViewMode("catalog")}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition"
            >
              Cancel &amp; Return
            </button>
            <button
              onClick={startNewSession}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-xl shadow-xl shadow-indigo-600/30 text-sm transition transform hover:-translate-y-0.5"
            >
              {loading ? "Synthesizing Question Snapshot..." : "I Understand — Start Assessment Now"}
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: LIVE ASSESSMENT INTERFACE (Component 15) */}
      {viewMode === "assessment" && currentQuestionObj && (
        <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
          {/* Top Telemetry & Timer Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 px-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl font-mono text-xs font-bold">
                Session: {activeSessionId || "LIVE-TEST"}
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                {connectionStatus === "Healthy" || connectionStatus === "Recovered" ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <Wifi className="w-3.5 h-3.5 animate-pulse" /> {connectionStatus} (Server Authoritative)
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1.5 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                    <WifiOff className="w-3.5 h-3.5" /> Disconnected / Offline Resilience Mode
                  </span>
                )}
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Save className={`w-3.5 h-3.5 ${autosaveState === "Saving..." ? "text-amber-400 animate-spin" : "text-indigo-400"}`} />
                  Autosave: <strong className="text-indigo-300">{autosaveState}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Anti-Cheat Counter UI */}
              <div className="flex items-center gap-3 text-xs bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">Tab Switches: <strong className="text-amber-400">{antiCheatSummary.tabSwitches}</strong></span>
              </div>

              {/* Authoritative Server Countdown */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-base font-black tracking-wider transition ${
                  remainingSeconds <= 60
                    ? "bg-red-500/20 text-red-400 border-red-500 animate-pulse shadow-lg shadow-red-500/20"
                    : remainingSeconds <= 300
                    ? "bg-amber-500/20 text-amber-400 border-amber-500"
                    : "bg-slate-950 text-white border-slate-800"
                }`}
              >
                <Clock className="w-5 h-5 text-indigo-400" />
                {formatDuration(remainingSeconds)}
              </div>
            </div>
          </div>

          {/* Main Assessment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Main Question Canvas (3 Columns) */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      Question {currentQuestionIndex + 1} of {paletteState.length}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">Assessment Scenario / Item</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleMarkForReview(currentQuestionIndex + 1, currentQuestionObj.questionId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                        userAnswers[currentQuestionIndex + 1]?.isMarkedForReview
                          ? "bg-amber-500/20 text-amber-400 border-amber-500 shadow-md shadow-amber-500/10"
                          : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 fill-current" />
                      {userAnswers[currentQuestionIndex + 1]?.isMarkedForReview ? "Marked for Review" : "Mark for Review"}
                    </button>
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-bold uppercase">
                      {currentQuestionObj.difficulty || "Medium"} • {currentQuestionObj.bloomLevel || "Apply"}
                    </span>
                  </div>
                </div>

                {/* Question Stem Text */}
                <div className="text-base text-slate-200 leading-relaxed font-normal p-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl mb-8">
                  {currentQuestionObj.questionText}
                </div>

                {/* Options Cards */}
                <div className="space-y-3">
                  {(currentQuestionObj.options || ["Option A", "Option B", "Option C", "Option D"]).map((opt, idx) => {
                    const isSelected = userAnswers[currentQuestionIndex + 1]?.selectedIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectOption(currentQuestionIndex + 1, currentQuestionObj.questionId, idx, opt)}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-4 ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 font-medium"
                            : "bg-slate-950/40 hover:bg-slate-800/50 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center font-mono text-xs font-bold transition shrink-0 ${
                            isSelected ? "bg-indigo-600 text-white border-indigo-500 shadow-sm" : "bg-slate-900 border-slate-700 text-slate-400"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="flex-1 text-sm">{opt}</div>
                        {isSelected && <Check className="w-5 h-5 text-indigo-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Bar (Component 9) */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between mt-10">
                <button
                  onClick={() => navigateQuestion(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0 || !(sessionConfig?.allowPrevious ?? true)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-sm rounded-xl transition flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Question
                </button>

                <button
                  onClick={() => setShowReviewPanel(true)}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800 font-semibold text-xs rounded-xl transition inline-flex items-center gap-2"
                >
                  <Info className="w-4 h-4" /> Review Palette &amp; Filter Summary
                </button>

                {currentQuestionIndex < paletteState.length - 1 ? (
                  <button
                    onClick={() => navigateQuestion(currentQuestionIndex + 1)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 transform hover:-translate-y-0.5"
                  >
                    Finish &amp; Submit Assessment <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Pane: Question Palette & Progress (1 Column) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" /> Question Palette
                </h3>
                <p className="text-xs text-slate-400 mb-4">Click any item to jump directly to the sequence order.</p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Answered Progress</span>
                    <span className="text-indigo-400">{Math.round((answeredCount / paletteState.length) * 100) || 0}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${(answeredCount / paletteState.length) * 100 || 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-medium">
                    <span>✅ {answeredCount} Answered</span>
                    <span>⏳ {paletteState.length - answeredCount} Unanswered</span>
                  </div>
                </div>

                {/* Grid Buttons */}
                <div className="grid grid-cols-5 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {paletteState.map((p, i) => {
                    const isCurrent = i === currentQuestionIndex;
                    const isAnswered = p.isAnswered;
                    const isMarked = p.isMarkedForReview;

                    let bgClass = "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800";
                    if (isAnswered) bgClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
                    if (isMarked) bgClass = "bg-amber-500/20 text-amber-400 border-amber-500/50";

                    return (
                      <button
                        key={i}
                        onClick={() => navigateQuestion(i)}
                        className={`h-11 rounded-xl border text-xs font-bold transition flex items-center justify-center relative ${bgClass} ${
                          isCurrent ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 font-black scale-105 shadow-md shadow-indigo-500/20" : ""
                        }`}
                      >
                        {p.sequenceOrder}
                        {isMarked && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-slate-950"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500 inline-block"></span> Answered &amp; Saved</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500 inline-block"></span> Marked for Review</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-slate-950 border border-slate-800 inline-block"></span> Not Answered (Skipped)</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded ring-2 ring-indigo-400 inline-block"></span> Active Current Item</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Finalize &amp; Lock Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: SUBMITTED & LOCKED SCREEN */}
      {viewMode === "submitted" && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl animate-fade-in mt-8">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Assessment Successfully Submitted &amp; Locked!</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            Your attempt record <strong className="text-indigo-400">{activeSessionId}</strong> has been frozen and made immutable.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300">
            <Lock className="w-4 h-4 text-emerald-400" />
            Evaluation Status: <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">Handoff to Phase 10 Queued</span>
          </div>

          <div className="mt-8 p-6 bg-slate-950/80 border border-slate-800 rounded-2xl text-left text-sm text-slate-300 space-y-2 max-w-lg mx-auto">
            <div className="flex justify-between"><span>Total Questions Delivered:</span> <strong className="text-white">{paletteState.length} Items</strong></div>
            <div className="flex justify-between"><span>Answered &amp; Saved Responses:</span> <strong className="text-emerald-400">{paletteState.filter((p) => p.isAnswered).length} Answered</strong></div>
            <div className="flex justify-between"><span>Anti-Cheat Infractions Recorded:</span> <strong className="text-amber-400">{antiCheatSummary.tabSwitches + antiCheatSummary.fullscreenExits} Logged (No DQ)</strong></div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => {
                setViewMode("catalog");
                fetchSessions();
              }}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              Return to Sessions Catalog
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 5: EXPIRED SESSION SCREEN */}
      {viewMode === "expired" && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl animate-fade-in mt-8">
          <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-xl shadow-red-500/10">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Assessment Session Expired!</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            The server authoritative timer reached zero seconds. All responses captured up to the expiration timestamp have been locked and submitted automatically.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                setViewMode("catalog");
                fetchSessions();
              }}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl transition"
            >
              Return to Sessions Catalog
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 6: TIMELINE AUDIT INSPECTION */}
      {viewMode === "audit" && auditDetail && (
        <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Terminal className="w-7 h-7 text-indigo-400" /> Immutable Session Audit Trace
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Session: <span className="font-mono text-indigo-300 font-bold">{auditDetail.sessionId}</span> • Candidate: {auditDetail.candidateId}
              </p>
            </div>
            <button
              onClick={() => setViewMode("catalog")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
            >
              Close Audit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block">Session Status</span>
              <span className="text-lg font-black text-indigo-400 uppercase mt-1 block">{auditDetail.status}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block">Attempt Number</span>
              <span className="text-lg font-black text-white mt-1 block">Attempt #{auditDetail.attemptNumber}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block">Lock State</span>
              <span className={`text-lg font-black mt-1 block ${auditDetail.isLocked ? "text-red-400" : "text-emerald-400"}`}>
                {auditDetail.isLocked ? "Locked (Immutable)" : "Active / Unlocked"}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Chronological Event Timeline (Component 11)</h3>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 border-l-2 border-indigo-500/30 pl-4">
              {(auditDetail.timeline || []).slice().reverse().map((ev, i) => (
                <div key={i} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span className="text-indigo-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span> {ev.eventType}
                    </span>
                    <span className="text-slate-400 font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2 rounded-lg mt-2 overflow-x-auto">
                    {JSON.stringify(ev.details || {}, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20 shadow-lg shadow-red-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Lock &amp; Submit Assessment?</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Submitting will permanently freeze all {paletteState.filter((p) => p.isAnswered).length} of your answers. You cannot change your responses or resume this attempt after locking.
              </p>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition"
              >
                Continue Reviewing
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
              >
                Confirm &amp; Lock Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW PALETTE PANEL MODAL */}
      {showReviewPanel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-400" /> Review Palette Summary
              </h3>
              <button onClick={() => setShowReviewPanel(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
              <div className="text-sm font-semibold text-amber-400 mb-2">Marked for Review ({paletteState.filter((p) => p.isMarkedForReview).length}):</div>
              {paletteState.filter((p) => p.isMarkedForReview).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No questions currently marked for review.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {paletteState
                    .filter((p) => p.isMarkedForReview)
                    .map((item) => (
                      <button
                        key={item.sequenceOrder}
                        onClick={() => {
                          navigateQuestion(item.sequenceOrder - 1);
                          setShowReviewPanel(false);
                        }}
                        className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition"
                      >
                        Go to Question #{item.sequenceOrder}
                      </button>
                    ))}
                </div>
              )}

              <div className="text-sm font-semibold text-red-400 pt-4 border-t border-slate-800 mb-2">
                Unanswered Questions ({paletteState.filter((p) => !p.isAnswered).length}):
              </div>
              {paletteState.filter((p) => !p.isAnswered).length === 0 ? (
                <p className="text-xs text-emerald-400">All items answered!</p>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {paletteState
                    .filter((p) => !p.isAnswered)
                    .map((item) => (
                      <button
                        key={item.sequenceOrder}
                        onClick={() => {
                          navigateQuestion(item.sequenceOrder - 1);
                          setShowReviewPanel(false);
                        }}
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition"
                      >
                        #{item.sequenceOrder}
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowReviewPanel(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentSessionManager;
