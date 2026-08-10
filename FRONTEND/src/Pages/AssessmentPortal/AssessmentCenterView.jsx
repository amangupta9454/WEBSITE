import React, { useState, useEffect } from "react";
import {
  ChevronRight, ChevronLeft, Play, RefreshCw, Sparkles,
  BookOpen, Clock, Target, CheckCircle2, Loader2, ArrowRight,
  Lock, Database, Zap, Award
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const DIFFICULTIES = [
  { id: "easy",   label: "Easy",     color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", desc: "Basic concepts & recall" },
  { id: "medium", label: "Medium",   color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-500",   desc: "Application & analysis" },
  { id: "hard",   label: "Hard",     color: "bg-orange-100 text-orange-700 border-orange-200",    dot: "bg-orange-500",  desc: "Deep understanding" },
  { id: "expert", label: "Expert",   color: "bg-rose-100 text-rose-700 border-rose-200",          dot: "bg-rose-500",    desc: "Professional mastery" },
];

/**
 * Assessment Center — Clean 3-step flow:
 * Step 1: Select Category
 * Step 2: Select Subcategory
 * Step 3: Select Difficulty → Start (AI-first 7s, then DB fallback)
 */
const AssessmentCenterView = ({ catalogData, onRefresh }) => {
  const navigate = useNavigate();

  // Step: 1=category, 2=subcategory, 3=difficulty
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [starting, setStarting] = useState(false);
  const [aiStatus, setAiStatus] = useState(null); // null | "generating" | "success" | "fallback"

  // Pull data from catalogData prop (already fetched by parent)
  const categories = (catalogData?.availableCategories || []);

  const subcategories = selectedCategory
    ? (selectedCategory.subcategories || []).filter(s => s.isActive !== false)
    : [];

  const handleStartAssessment = async () => {
    if (!selectedSubcategory) return;
    setStarting(true);
    setAiStatus("generating");

    const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.post(`${API}/api/assessment/sessions/start-smart`, {
        subcategoryId: selectedSubcategory._id,
        categoryId: selectedCategory._id,
        difficulty: selectedDifficulty,
      }, { headers });

      if (res.data.success) {
        const { aiGenerated, data } = res.data;
        setAiStatus(aiGenerated ? "success" : "fallback");
        toast.success(
          aiGenerated
            ? "✨ AI generated fresh questions for you!"
            : "📚 Loaded questions from our database."
        );
        setTimeout(() => {
          onRefresh?.();
          if (data.sessionId) {
            navigate(`/assessment-terminal/${data.sessionId}`);
          } else {
            navigate("/dashboard/assessment/attempt/active");
          }
        }, 800);
      } else {
        setAiStatus(null);
        toast.error(res.data.error || "Failed to start assessment.");
      }
    } catch (err) {
      setAiStatus(null);
      const errMsg = err.response?.data?.error || err.response?.data?.message || "Failed to start session.";
      if (err.response?.status === 409 && err.response?.data?.sessionId) {
        toast.error("You already have an active session! Launching it now...");
        navigate(`/assessment-terminal/${err.response.data.sessionId}`);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setStarting(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedDifficulty("medium");
    setAiStatus(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Assessment Center</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Select a topic → pick difficulty → AI generates fresh questions in real-time
          </p>
        </div>
        <button
          onClick={() => { resetFlow(); onRefresh?.(); }}
          className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          {["Category", "Topic", "Difficulty"].map((label, idx) => {
            const num = idx + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <React.Fragment key={num}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                    isDone ? "bg-indigo-600 text-white" :
                    isActive ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600" :
                    "bg-slate-100 text-slate-400"
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : num}
                  </div>
                  <span className={`text-xs font-bold hidden sm:block ${isActive ? "text-indigo-700" : isDone ? "text-slate-700" : "text-slate-400"}`}>
                    {label}
                  </span>
                </div>
                {idx < 2 && <div className={`flex-1 h-px ${step > num ? "bg-indigo-300" : "bg-slate-200"}`} />}
              </React.Fragment>
            );
          })}
        </div>
        {/* Breadcrumb */}
        {(selectedCategory || selectedSubcategory) && (
          <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-slate-500">
            {selectedCategory && (
              <button onClick={() => { setStep(1); setSelectedSubcategory(null); }} className="hover:text-indigo-600">
                {selectedCategory.name}
              </button>
            )}
            {selectedSubcategory && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <button onClick={() => setStep(2)} className="hover:text-indigo-600">
                  {selectedSubcategory.name}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* STEP 1: Category */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-600 px-1">Choose a Category</p>
          {categories.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium text-sm">No categories available yet.</p>
              <p className="text-slate-400 text-xs mt-1">Ask admin to add categories & generate questions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => { setSelectedCategory(cat); setStep(2); }}
                  className="group bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-5 text-left transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-all mb-3">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="font-black text-slate-900 group-hover:text-indigo-700 transition-colors">{cat.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description || "Click to explore topics"}</p>
                  <div className="mt-3 text-xs font-bold text-slate-400">
                    {(cat.subcategories || []).length} topic{(cat.subcategories || []).length !== 1 ? "s" : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Subcategory */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setStep(1); setSelectedSubcategory(null); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-bold text-slate-600">Choose a Topic in <span className="text-indigo-600">{selectedCategory?.name}</span></p>
          </div>

          {subcategories.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium text-sm">No topics in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map(sub => (
                <button
                  key={sub._id}
                  onClick={() => { setSelectedSubcategory(sub); setStep(3); }}
                  className="group bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-5 text-left transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center transition-all">
                      <Target className="w-5 h-5 text-violet-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="font-black text-slate-900 group-hover:text-indigo-700 transition-colors">{sub.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sub.description || "AI-powered assessment available"}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" /> AI Ready
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Difficulty + Launch */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setStep(2); setSelectedSubcategory(null); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-bold text-slate-600">
              Choose Difficulty for <span className="text-indigo-600">{selectedSubcategory?.name}</span>
            </p>
          </div>

          {/* Difficulty Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDifficulty(d.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedDifficulty === d.id
                    ? "border-indigo-600 bg-indigo-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`w-3 h-3 rounded-full mb-3 ${d.dot}`} />
                <div className={`inline-block px-2 py-0.5 rounded-md text-xs font-black border mb-1.5 ${d.color}`}>
                  {d.label}
                </div>
                <p className="text-xs text-slate-500">{d.desc}</p>
                {selectedDifficulty === d.id && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-2" />
                )}
              </button>
            ))}
          </div>

          {/* AI Info Card */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-800">AI-Powered Questions</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                When you start, AI generates fresh questions specifically for <strong>{selectedSubcategory?.name}</strong> at <strong>{selectedDifficulty}</strong> difficulty.
                If AI takes more than 7 seconds, we'll use our question bank instead.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <Zap className="w-3 h-3" /> AI First (≤7s)
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-slate-600">
                  <Database className="w-3 h-3" /> DB Fallback
                </span>
              </div>
            </div>
          </div>

          {/* AI Status Indicator */}
          {aiStatus === "generating" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-800">Generating questions with AI...</p>
                <p className="text-xs text-amber-600">This may take up to 7 seconds</p>
              </div>
            </div>
          )}
          {aiStatus === "success" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-bold">AI generated fresh questions! Launching quiz...</span>
            </div>
          )}
          {aiStatus === "fallback" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-slate-600">
              <Database className="w-4 h-4" />
              <span className="text-sm font-bold">Using question bank. Launching quiz...</span>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartAssessment}
            disabled={starting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-200 text-base"
          >
            {starting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Starting Assessment...</>
            ) : (
              <><Play className="w-5 h-5" /> Start {selectedSubcategory?.name} Assessment</>
            )}
          </button>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Target, label: "Category", value: selectedCategory?.name },
              { icon: BookOpen, label: "Topic", value: selectedSubcategory?.name },
              { icon: Award, label: "Difficulty", value: selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                <Icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-xs font-black text-slate-800 mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentCenterView;
