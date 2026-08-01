import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Cpu, BarChart3, 
  FileText, Play, RefreshCw, Eye, Search, Filter, HelpCircle, Layers, 
  Sparkles, Sliders, ArrowUpRight, Lock, Database
} from "lucide-react";

/**
 * QuestionIntelligenceGate.jsx — Admin UI for Phase 6 Question Intelligence Engine
 * Provides interactive visualization of the 7-stage AI Quality Gate pipeline, bulk batch testing
 * (1 to 200 questions), Bloom's taxonomy stratification, SHA-256 duplicate inspection, and
 * human review readiness simulations—strictly in temporary memory without Question Bank saving.
 */
const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

const QuestionIntelligenceGate = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState("batch_validator"); // batch_validator | telemetry | review_sandbox | settings
  const [loading, setLoading] = useState(false);
  
  // Evaluation Pipeline Results (Ephemereal Memory State)
  const [batchResults, setBatchResults] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterState, setFilterState] = useState("ALL"); // ALL, Approved, Needs Review, Rejected
  
  // Simulation Controls
  const [simulateSize, setSimulateSize] = useState(10);
  const [customJsonInput, setCustomJsonInput] = useState("");
  const [useCustomJson, setUseCustomJson] = useState(false);

  // Runtime Telemetry Metrics
  const [metrics, setMetrics] = useState({
    totalValidated: 0,
    approved: 0,
    needsReview: 0,
    rejected: 0,
    averageQuality: 0,
    averageValidationTimeMs: 0,
    duplicateRate: "0%",
    topicDistribution: {},
    difficultyDistribution: {},
    bloomDistribution: {}
  });

  // Threshold Config State
  const [thresholds, setThresholds] = useState({
    approvedThreshold: 90,
    needsReviewThreshold: 75,
    maxDuplicateRiskAllowed: 70
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/assessment/intelligence/metrics`, {
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (data.success && data.telemetry) {
        setMetrics(data.telemetry);
      }
    } catch (err) {
      console.error("Failed to fetch Question Intelligence metrics:", err);
    }
  };

  const handleRunBatchValidation = async () => {
    setLoading(true);
    setSelectedReport(null);
    try {
      let payload = {
        thresholdConfig: thresholds,
        fallbackModality: "MCQ",
        requestedDifficulty: "Medium"
      };

      if (useCustomJson && customJsonInput.trim()) {
        try {
          const parsed = JSON.parse(customJsonInput);
          payload.questions = Array.isArray(parsed) ? parsed : [parsed];
        } catch (jsonErr) {
          if (showNotification) showNotification("Invalid JSON syntax in custom input field.", "error");
          setLoading(false);
          return;
        }
      } else {
        payload.simulateBatchSize = simulateSize;
      }

      const res = await fetch(`${API_BASE}/api/admin/assessment/intelligence/validate-batch`, {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.report) {
        setBatchResults(data.report);
        if (showNotification) {
          showNotification(`Validated ${data.report.batchMetrics.itemsProcessed} questions in memory (${data.report.batchMetrics.totalExecutionTimeMs}ms). Zero DB saving!`, "success");
        }
        fetchMetrics(); // Refresh telemetry stats
      } else {
        if (showNotification) showNotification(data.message || data.error || "Batch validation failed", "error");
      }
    } catch (err) {
      if (showNotification) showNotification("Network error executing Quality Gate batch.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSimulation = async (questionId, actionState) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/assessment/intelligence/review-action`, {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({
          questionId,
          actionState,
          reason: `Admin sandboxed override via Quality Gate dashboard (${actionState})`
        })
      });
      const data = await res.json();
      if (data.success) {
        if (showNotification) showNotification(`Item ${questionId} state updated to "${actionState}" in memory!`, "success");
        // Update local memory representation
        if (batchResults) {
          const updatedNeedsReview = batchResults.needsReviewQuestionSet.map(q => {
            if (q.temporaryId === questionId) {
              return { ...q, intelligenceReport: { ...q.intelligenceReport, approvalStatus: actionState } };
            }
            return q;
          });
          setBatchResults({ ...batchResults, needsReviewQuestionSet: updatedNeedsReview });
        }
      }
    } catch (err) {
      if (showNotification) showNotification("Failed to execute review simulation.", "error");
    }
  };

  const handleResetMemory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/assessment/intelligence/reset`, {
        method: "POST",
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (data.success) {
        if (showNotification) showNotification("Question Intelligence ephemeral memory cleanly reset.", "success");
        setBatchResults(null);
        setSelectedReport(null);
        fetchMetrics();
      }
    } catch (err) {
      if (showNotification) showNotification("Failed to reset memory stats.", "error");
    }
  };

  // Combine items for filtered rendering
  const getDisplayedQuestions = () => {
    if (!batchResults) return [];
    let list = [
      ...(batchResults.approvedQuestionSet || []),
      ...(batchResults.needsReviewQuestionSet || []),
      ...(batchResults.rejectedQuestionSet || [])
    ].sort((a, b) => a.originalIndex - b.originalIndex);

    if (filterState === "Approved") return list.filter(q => q.intelligenceReport?.approvalStatus === "Approved");
    if (filterState === "Needs Review") return list.filter(q => q.intelligenceReport?.approvalStatus === "Needs Review" || q.intelligenceReport?.approvalStatus === "Pending Review");
    if (filterState === "Rejected") return list.filter(q => q.intelligenceReport?.approvalStatus === "Rejected");
    return list;
  };

  return (
    <div className="space-y-6 text-gray-100">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Phase 6: AI Quality Gate
              </span>
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Ephemeral Memory Only
              </span>
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Database className="w-3 h-3" /> No DB Persistence (Phase 7)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Question Intelligence Engine
            </h1>
            <p className="text-sm text-gray-300 mt-1 max-w-3xl">
              Production-grade 7-stage quality evaluation pipeline analyzing structure, duplicate risk (SHA-256), Bloom's cognitive taxonomy, grammar heuristics, and topic classification before storage eligibility.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleResetMemory}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-sm font-medium rounded-xl border border-slate-700 transition-colors flex items-center gap-2 shadow-sm"
              title="Reset ephemeral memory metrics and fingerprint pool"
            >
              <RefreshCw className="w-4 h-4" /> Reset Memory Pool
            </button>
          </div>
        </div>

        {/* Live Telemetry Ribbon */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Validated</p>
            <p className="text-2xl font-bold text-white mt-1 flex items-center gap-1">
              <Layers className="w-5 h-5 text-indigo-400" /> {metrics.totalValidated || 0}
            </p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Approved (% Rate)</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-5 h-5" /> {metrics.approved || 0}
              <span className="text-xs text-emerald-500 font-normal ml-1">
                ({metrics.totalValidated ? Math.round((metrics.approved / metrics.totalValidated) * 100) : 0}%)
              </span>
            </p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Needs Review</p>
            <p className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-5 h-5" /> {metrics.needsReview || 0}
            </p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Rejected (% Rate)</p>
            <p className="text-2xl font-bold text-rose-400 mt-1 flex items-center gap-1">
              <XCircle className="w-5 h-5" /> {metrics.rejected || 0}
              <span className="text-xs text-rose-500 font-normal ml-1">
                ({metrics.totalValidated ? Math.round((metrics.rejected / metrics.totalValidated) * 100) : 0}%)
              </span>
            </p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 col-span-2 md:col-span-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Avg Quality & Speed</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1 flex items-center gap-2">
              <span>{metrics.averageQuality || 0} pts</span>
              <span className="text-xs text-gray-400 font-normal">| {metrics.averageValidationTimeMs || 0} ms/q</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("batch_validator")}
          className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "batch_validator"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Play className="w-4 h-4" /> Quality Gate Batch Validator (1–200 Qs)
        </button>
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "telemetry"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Intelligence & Bloom's Analytics
        </button>
        <button
          onClick={() => setActiveTab("review_sandbox")}
          className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "review_sandbox"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Sliders className="w-4 h-4" /> Human Review Readiness (Component 16)
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "settings"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Configurable Thresholds & Rules
        </button>
      </div>

      {/* ── TAB 1: QUALITY GATE BATCH VALIDATOR ───────────────────────────── */}
      {activeTab === "batch_validator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Question List (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Execute Batch Validation Pipeline
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inputType"
                      checked={!useCustomJson}
                      onChange={() => setUseCustomJson(false)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-300">Simulate Diagnostic AI Batch</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inputType"
                      checked={useCustomJson}
                      onChange={() => setUseCustomJson(true)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-300">Paste Custom JSON Payload</span>
                  </label>
                </div>

                {!useCustomJson ? (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block">
                      Select Batch Size (Bulk Performance Test):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 10, 50, 100, 200].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSimulateSize(val)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            simulateSize === val
                              ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                              : "bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          {val} {val === 1 ? "Question" : "Questions"}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 italic mt-1">
                      * Synthesizes realistic evaluation questions with ~10% injected duplicates, grammar defects, and structure errors to test Quality Gate filtering.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1">
                      Paste AI Runtime Output JSON Array:
                    </label>
                    <textarea
                      value={customJsonInput}
                      onChange={e => setCustomJsonInput(e.target.value)}
                      placeholder={`[\n  {"type": "MCQ", "question": "What is Docker?", "options": ["Container engine", "VM"], "correctAnswer": "Container engine", "explanation": "Docker utilizes OS-level containerization."}\n]`}
                      className="w-full h-32 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <button
                  onClick={handleRunBatchValidation}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-white" />
                      Running 7-Stage Intelligence Pipeline...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Run Quality Gate Validation ({useCustomJson ? "Custom Payload" : `${simulateSize} Questions`})
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Evaluated Questions Table */}
            {batchResults && (
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-base flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-400" /> Batch Results ({batchResults.batchMetrics.itemsProcessed} Evaluated)
                    </h4>
                    <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                      ✓ Execution Speed: {batchResults.batchMetrics.avgTimePerItemMs} ms/item ({batchResults.batchMetrics.totalExecutionTimeMs}ms total)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {["ALL", "Approved", "Needs Review", "Rejected"].map(f => (
                      <button
                        key={f}
                        onClick={() => setFilterState(f)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          filterState === f
                            ? "bg-indigo-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {getDisplayedQuestions().map((item, idx) => {
                    const rep = item.intelligenceReport || {};
                    const isSelected = selectedReport?.questionId === rep.questionId;
                    const status = rep.approvalStatus || "Approved";

                    return (
                      <div
                        key={item.temporaryId || idx}
                        onClick={() => setSelectedReport(item)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-slate-800/90 border-indigo-500 shadow-md"
                            : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded mt-0.5 shrink-0 ${
                              status === "Approved" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                              status === "Needs Review" || status === "Pending Review" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                              "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}>
                              {status === "Approved" ? "✓ APPROVED" : status === "Rejected" ? "✗ REJECTED" : "⚠ REVIEW"}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-200 truncate">
                                {item.questionText || item.title || "[Question Stem]"}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 flex-wrap">
                                <span><strong className="text-indigo-300">Type:</strong> {item.modality || "MCQ"}</span>
                                <span><strong className="text-indigo-300">Topic:</strong> {rep.subtopic || "Core"}</span>
                                <span><strong className="text-indigo-300">Bloom:</strong> <span className="text-cyan-400 font-semibold">{rep.bloomLevel || "Remember"}</span></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-sm font-black text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                              {rep.qualityScore ?? 100}%
                            </span>
                            <span className="text-[10px] text-gray-500 mt-1 uppercase">Quality Score</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {getDisplayedQuestions().length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      No questions match filter "{filterState}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Component 17: Intelligence Report Panel (5 Columns) */}
          <div className="lg:col-span-5">
            {selectedReport ? (
              <div className="bg-slate-900 p-6 rounded-xl border border-indigo-500/30 shadow-2xl space-y-5 sticky top-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Component 17: Intelligence Report
                  </span>
                  <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {selectedReport.temporaryId}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Approval Decision Engine</p>
                    <p className={`text-lg font-black mt-1 ${
                      selectedReport.intelligenceReport?.approvalStatus === "Approved" ? "text-emerald-400" :
                      selectedReport.intelligenceReport?.approvalStatus === "Rejected" ? "text-rose-400" : "text-amber-400"
                    }`}>
                      {selectedReport.intelligenceReport?.approvalStatus || "Approved"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-semibold uppercase">Overall Quality</p>
                    <p className="text-2xl font-black text-white mt-0.5">
                      {selectedReport.intelligenceReport?.qualityScore}%
                    </p>
                  </div>
                </div>

                {/* Question Preview */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <p className="text-xs text-indigo-300 font-bold uppercase tracking-wide">Question Stem Preview:</p>
                  <p className="text-sm text-gray-200 leading-relaxed font-medium">
                    {selectedReport.questionText || selectedReport.problemStatement || "N/A"}
                  </p>

                  {selectedReport.options && (
                    <div className="space-y-1 pt-2 border-t border-slate-800/60">
                      <p className="text-[11px] text-gray-400 font-semibold uppercase">Options & Answer:</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {selectedReport.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`px-2 py-1 rounded text-xs truncate font-mono ${
                            opt === selectedReport.correctAnswer ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold" : "bg-slate-900 text-gray-400"
                          }`}>
                            {String.fromCharCode(65 + oIdx)}. {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedReport.explanation && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <p className="text-[11px] text-gray-400 font-semibold uppercase mb-1">Explanation / Rationale:</p>
                      <p className="text-xs text-gray-300 italic">{selectedReport.explanation}</p>
                    </div>
                  )}
                </div>

                {/* 6 Quality Pillar Breakdown */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-300 font-bold uppercase tracking-wide">Component 11: Modular Quality Scoring</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Structure</p>
                      <p className="text-sm font-black text-indigo-400 mt-1">{selectedReport.validationReport?.qualityScores?.structureScore}%</p>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Grammar</p>
                      <p className="text-sm font-black text-emerald-400 mt-1">{selectedReport.intelligenceReport?.grammarScore}%</p>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Topic Match</p>
                      <p className="text-sm font-black text-cyan-400 mt-1">{selectedReport.validationReport?.qualityScores?.topicMatchScore}%</p>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Difficulty</p>
                      <p className="text-sm font-black text-purple-400 mt-1">{selectedReport.validationReport?.qualityScores?.difficultyScore}%</p>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Completeness</p>
                      <p className="text-sm font-black text-teal-400 mt-1">{selectedReport.validationReport?.qualityScores?.completenessScore}%</p>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Dup. Risk</p>
                      <p className="text-sm font-black text-amber-400 mt-1">{selectedReport.intelligenceReport?.duplicateRisk}%</p>
                    </div>
                  </div>
                </div>

                {/* Metadata & SHA-256 Fingerprint */}
                <div className="space-y-2 border-t border-slate-800 pt-4 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hierarchical Topic:</span>
                    <span className="text-white font-semibold text-right">{selectedReport.validationReport?.detectedTopic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verified Difficulty:</span>
                    <span className="text-white font-semibold">{selectedReport.intelligenceReport?.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bloom's Taxonomy:</span>
                    <span className="text-cyan-400 font-bold">{selectedReport.intelligenceReport?.bloomLevel}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-gray-400 block text-[10px]">Normalized SHA-256 Fingerprint (Component 6):</span>
                    <p className="bg-slate-950 text-indigo-300 p-2 rounded text-[11px] truncate mt-1 border border-slate-800">
                      {selectedReport.intelligenceReport?.fingerprint}
                    </p>
                  </div>
                </div>

                {/* Validation Reasons & Warnings */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wide">Validation Decision Notes:</p>
                  <p className="text-xs text-gray-300 font-sans leading-normal">
                    {selectedReport.intelligenceReport?.validationNotes}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 p-12 rounded-xl text-center flex flex-col items-center justify-center h-96">
                <FileText className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-base font-semibold text-gray-400">No Question Item Selected</p>
                <p className="text-xs text-gray-500 max-w-xs mt-1">
                  Click on any question row from the batch validation table to inspect its comprehensive 7-stage Intelligence Report & SHA-256 fingerprint.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: INTELLIGENCE & BLOOM'S ANALYTICS ─────────────────────────── */}
      {activeTab === "telemetry" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Topic Distribution */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-5 h-5 text-indigo-400" /> Component 7: Topic Domain Breakdown
            </h4>
            <div className="space-y-3">
              {Object.keys(metrics.topicDistribution || {}).length > 0 ? (
                Object.entries(metrics.topicDistribution).map(([domain, count]) => {
                  const pct = Math.round((count / Math.max(1, metrics.totalValidated)) * 100);
                  return (
                    <div key={domain} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-300">{domain}</span>
                        <span className="text-indigo-400">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-6">No validated telemetry recorded yet.</p>
              )}
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-purple-400" /> Component 8: Verified Difficulty
            </h4>
            <div className="space-y-3">
              {Object.keys(metrics.difficultyDistribution || {}).length > 0 ? (
                Object.entries(metrics.difficultyDistribution).map(([diff, count]) => {
                  const pct = Math.round((count / Math.max(1, metrics.totalValidated)) * 100);
                  const color = diff === "Hard" || diff === "Expert" ? "bg-purple-500" : diff === "Medium" ? "bg-indigo-500" : "bg-emerald-500";
                  return (
                    <div key={diff} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-300">{diff} Level</span>
                        <span className="text-purple-400">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`${color} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-6">No difficulty distribution recorded yet.</p>
              )}
            </div>
          </div>

          {/* Bloom's Taxonomy Distribution */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu className="w-5 h-5 text-cyan-400" /> Component 9: Bloom's Cognitive Taxonomy
            </h4>
            <div className="space-y-3">
              {Object.keys(metrics.bloomDistribution || {}).length > 0 ? (
                Object.entries(metrics.bloomDistribution).map(([bloom, count]) => {
                  const pct = Math.round((count / Math.max(1, metrics.totalValidated)) * 100);
                  return (
                    <div key={bloom} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-300 font-mono">{bloom}</span>
                        <span className="text-cyan-400">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-6">No Bloom's cognitive taxonomy recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: HUMAN REVIEW READINESS SANDBOX ────────────────────────────── */}
      {activeTab === "review_sandbox" && (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" /> Component 16: Human Review Readiness Sandbox
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Prepares state model infrastructure for human admin action workflows (Pending Review $\rightarrow$ Approved / Rejected / Force Approved). Demonstrates state transitions in temporary RAM without Question Bank database persistence.
            </p>
          </div>

          {batchResults && batchResults.needsReviewQuestionSet?.length > 0 ? (
            <div className="space-y-3">
              {batchResults.needsReviewQuestionSet.map((item) => (
                <div key={item.temporaryId} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                        {item.intelligenceReport?.approvalStatus || "Pending Review"}
                      </span>
                      <span className="text-xs font-mono text-gray-400">{item.temporaryId}</span>
                      <span className="text-xs font-bold text-indigo-400">Score: {item.intelligenceReport?.qualityScore}%</span>
                    </div>
                    <p className="text-sm font-medium text-gray-200">{item.questionText || item.title}</p>
                    <p className="text-xs text-amber-400 italic">{item.intelligenceReport?.validationNotes}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewSimulation(item.temporaryId, "Approved")}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/40 transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReviewSimulation(item.temporaryId, "Force Approved")}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold rounded-lg border border-purple-500/40 transition-colors"
                    >
                      ⚡ Force Approve
                    </button>
                    <button
                      onClick={() => handleReviewSimulation(item.temporaryId, "Rejected")}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/40 transition-colors"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-base font-semibold text-gray-300">No Items Currently Pending Review</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                Run a diagnostic batch validation in Tab 1 to discover questions whose overall quality scores fall into the configurable review window (75%–89%).
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: CONFIGURABLE THRESHOLDS & RULES ──────────────────────────── */}
      {activeTab === "settings" && (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md max-w-2xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" /> Component 12: Configurable Decision Engine Thresholds
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Threshold values are fully dynamic and configurable per system specifications (never hardcoded!). Adjust operational bounds below for live batch testing.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-300 block mb-1">
                Approved Threshold (≥ %): Default 90%
              </label>
              <input
                type="number"
                min="70"
                max="100"
                value={thresholds.approvedThreshold}
                onChange={e => setThresholds({ ...thresholds, approvedThreshold: Number(e.target.value) })}
                className="w-full bg-slate-950 text-white text-sm font-bold rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-gray-300 block mb-1">
                Needs Review Floor (≥ %): Default 75%
              </label>
              <input
                type="number"
                min="50"
                max="90"
                value={thresholds.needsReviewThreshold}
                onChange={e => setThresholds({ ...thresholds, needsReviewThreshold: Number(e.target.value) })}
                className="w-full bg-slate-950 text-white text-sm font-bold rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-gray-300 block mb-1">
                Max Duplicate Risk Ceiling (%): Default 70%
              </label>
              <input
                type="number"
                min="30"
                max="95"
                value={thresholds.maxDuplicateRiskAllowed}
                onChange={e => setThresholds({ ...thresholds, maxDuplicateRiskAllowed: Number(e.target.value) })}
                className="w-full bg-slate-950 text-white text-sm font-bold rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (showNotification) showNotification("Threshold rules updated for current validation session!", "success");
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition-colors"
            >
              Apply Dynamic Threshold Configurations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionIntelligenceGate;
