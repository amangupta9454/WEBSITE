import React, { useState, useEffect } from "react";
import axios from "axios";
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle, ChevronDown, BarChart2, Loader2, Zap } from "lucide-react";

const API = import.meta.env.VITE_BACKEND_URL || "";
const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
const DIFF_COLORS = {
  easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  hard: "bg-orange-100 text-orange-700 border-orange-200",
  expert: "bg-rose-100 text-rose-700 border-rose-200",
};
const DIFF_DOT = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-orange-500",
  expert: "bg-rose-500",
};

export default function SimpleQuestionGenerator() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [questionsPerDiff, setQuestionsPerDiff] = useState(5);
  const [counts, setCounts] = useState({});
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loadingCounts, setLoadingCounts] = useState(false);

  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  // Load categories on mount
  useEffect(() => {
    axios.get(`${API}/api/admin/assessment/categories?limit=100`, { headers })
      .then(r => setCategories(r.data?.data || []))
      .catch(() => {});
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!selectedCategory) { setSubcategories([]); setSelectedSubcategory(""); return; }
    axios.get(`${API}/api/admin/assessment/subcategories?categoryId=${selectedCategory}&limit=100`, { headers })
      .then(r => setSubcategories(r.data?.data || []))
      .catch(() => {});
    setSelectedSubcategory("");
    setCounts({});
    setResult(null);
  }, [selectedCategory]);

  // Load counts when subcategory changes
  useEffect(() => {
    if (!selectedSubcategory) { setCounts({}); return; }
    fetchCounts();
  }, [selectedSubcategory]);

  const fetchCounts = async () => {
    setLoadingCounts(true);
    try {
      const r = await axios.get(`${API}/api/admin/assessment/generate-questions/count?subcategoryId=${selectedSubcategory}`, { headers });
      setCounts(r.data?.counts || {});
    } catch {
      setCounts({});
    } finally {
      setLoadingCounts(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCategory || !selectedSubcategory) {
      setError("Please select both a category and subcategory.");
      return;
    }
    setError("");
    setResult(null);
    setGenerating(true);
    try {
      const r = await axios.post(`${API}/api/admin/assessment/generate-questions`, {
        categoryId: selectedCategory,
        subcategoryId: selectedSubcategory,
        questionsPerDifficulty: questionsPerDiff,
      }, { headers });
      setResult(r.data);
      await fetchCounts(); // Refresh counts after generation
    } catch (err) {
      setError(err.response?.data?.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const catName = categories.find(c => c._id === selectedCategory)?.name || "";
  const subName = subcategories.find(s => s._id === selectedSubcategory)?.name || "";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">AI Question Generator</h2>
            <p className="text-sm text-slate-500">Select category + subcategory → AI generates MCQs per difficulty → saved to DB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Category Select */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
              >
                <option value="">-- Select Category --</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Subcategory Select */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subcategory</label>
            <div className="relative">
              <select
                value={selectedSubcategory}
                onChange={e => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Subcategory --</option>
                {subcategories.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Questions per difficulty */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Questions per Difficulty
            </label>
            <div className="flex items-center gap-3">
              {[3, 5, 8, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setQuestionsPerDiff(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${questionsPerDiff === n ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">Total: {questionsPerDiff * 4} questions (4 difficulties)</p>
          </div>

          {/* Generate Button */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedCategory || !selectedSubcategory}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
            ) : (
              <><Zap className="w-5 h-5" /> Generate Questions</>
            )}
          </button>
          {generating && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-700 font-medium space-y-2">
              <p className="font-bold">⏳ AI is generating questions...</p>
              {DIFFICULTIES.map(d => (
                <div key={d} className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span className="capitalize">{d} difficulty</span>
                </div>
              ))}
              <p className="text-xs text-indigo-500 mt-1">This may take 20–30 seconds per difficulty.</p>
            </div>
          )}
        </div>

        {/* Right: Current Inventory + Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current DB Counts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                Current Question Inventory
              </h3>
              {selectedSubcategory && (
                <button
                  onClick={fetchCounts}
                  disabled={loadingCounts}
                  className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCounts ? "animate-spin" : ""}`} /> Refresh
                </button>
              )}
            </div>

            {!selectedSubcategory ? (
              <div className="text-center py-8 text-slate-400">
                <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a subcategory to see counts</p>
              </div>
            ) : loadingCounts ? (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading counts...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 mb-3">
                  {catName && subName ? `${catName} → ${subName}` : ""}
                </p>
                {DIFFICULTIES.map(d => {
                  const count = counts[d] || 0;
                  const maxDisplay = 50;
                  const pct = Math.min((count / maxDisplay) * 100, 100);
                  return (
                    <div key={d} className="flex items-center gap-3">
                      <div className={`w-20 text-center text-xs font-bold px-2 py-1 rounded-lg border capitalize ${DIFF_COLORS[d]}`}>
                        {d}
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${DIFF_DOT[d]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
                <p className="text-xs text-slate-400 mt-2">
                  Total: <strong className="text-slate-600">{Object.values(counts).reduce((a, b) => a + b, 0)}</strong> approved questions
                </p>
              </div>
            )}
          </div>

          {/* Generation Result */}
          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-800">Generation Complete!</h3>
              </div>
              <p className="text-sm text-emerald-700 mb-4">
                <strong>{result.total}</strong> questions saved for{" "}
                <span className="font-bold">{result.categoryName} → {result.subcategoryName}</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DIFFICULTIES.map(d => {
                  const info = result.perDifficulty?.[d] || {};
                  const hasError = !!info.error;
                  return (
                    <div
                      key={d}
                      className={`rounded-xl p-3 text-center border ${hasError ? "bg-rose-50 border-rose-200" : "bg-white border-emerald-200"}`}
                    >
                      <div className={`text-xs font-bold capitalize mb-1 ${hasError ? "text-rose-600" : "text-emerald-700"}`}>{d}</div>
                      <div className={`text-2xl font-black ${hasError ? "text-rose-600" : "text-emerald-800"}`}>
                        {hasError ? "✕" : info.saved || 0}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {hasError ? "Failed" : `of ${info.generated || 0}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
