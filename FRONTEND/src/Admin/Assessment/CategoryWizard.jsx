import React, { useState } from "react";
import axios from "axios";
import {
  FolderTree,
  Layers,
  Sliders,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  HelpCircle,
  Zap
} from "lucide-react";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

const CategoryWizard = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Category basic info
  const [categoryData, setCategoryData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    icon: "FolderTree",
    targetQuestionCount: 1000,
    aiEnabled: true,
    dbFallbackEnabled: true
  });

  // Step 2: Dynamic list of subcategories
  const [subcategories, setSubcategories] = useState([
    { name: "Core Fundamentals", description: "Basic syntactic rules, architectural overview, and core philosophy.", targetQuestionCount: 250 },
    { name: "Advanced Patterns", description: "Design patterns, optimization techniques, and edge case problem solving.", targetQuestionCount: 250 },
    { name: "Real-world Debugging", description: "Error isolation, stack trace diagnostics, and production troubleshooting.", targetQuestionCount: 250 }
  ]);

  // Step 3: Default Assessment Configuration
  const [defaultConfig, setDefaultConfig] = useState({
    totalQuestions: 20,
    passingPercentage: 70,
    timeLimitMinutes: 30,
    difficultyDistribution: { easy: 30, medium: 40, hard: 20, expert: 10 }
  });

  // Step 4: AI Prompt Blueprint configuration
  const [aiBlueprint, setAiBlueprint] = useState({
    baseSystemPrompt: "You are an enterprise AI technical interviewer and certification evaluator. Generate mathematically sound, unambiguous multiple-choice questions with practical scenarios, precise distractors, and rigorous educational explanations.",
    topics: ["Syntax & Architecture", "Memory Management", "Concurrency", "Security Best Practices"]
  });

  const handleAddSubcategory = () => {
    setSubcategories([
      ...subcategories,
      { name: "", description: "", targetQuestionCount: 250 }
    ]);
  };

  const handleRemoveSubcategory = (index) => {
    if (subcategories.length <= 1) {
      return toast.warn("At least one subcategory is required!");
    }
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleSubcategoryChange = (index, field, value) => {
    const updated = [...subcategories];
    updated[index][field] = value;
    setSubcategories(updated);
  };

  const handlePublish = async () => {
    if (!categoryData.name.trim()) {
      return toast.warn("Category Name is required!");
    }
    for (const sub of subcategories) {
      if (!sub.name.trim()) {
        return toast.warn("All subcategories must have a name!");
      }
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("adminToken"); // Fix: admin login stores JWT as 'adminToken', not 'token'

      // Prepare enriched payload matching backend atomic wizard expects
      const payload = {
        categoryData,
        subcategoriesData: subcategories.map((s) => ({
          ...s,
          supportedDifficulties: ["easy", "medium", "hard", "expert"],
          totalQuestions: defaultConfig.totalQuestions,
          passingPercentage: defaultConfig.passingPercentage,
          timeLimitMinutes: defaultConfig.timeLimitMinutes,
          difficultyDistribution: defaultConfig.difficultyDistribution,
          systemPrompt: `${aiBlueprint.baseSystemPrompt} Focus topic domain: ${s.name} under ${categoryData.name}.`,
          topics: [s.name, ...aiBlueprint.topics]
        }))
      };

      const res = await axios.post(`${API_BASE}/api/admin/assessment/categories/wizard`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        toast.success("🚀 Assessment Category Suite Published Immediately!");
        onComplete();
      }
    } catch (err) {
      console.error("Wizard publication failed:", err);
      toast.error(err.response?.data?.message || "Failed to publish via wizard.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "Create Category", icon: FolderTree },
    { num: 2, label: "Subcategories", icon: Layers },
    { num: 3, label: "Assessment Config", icon: Sliders },
    { num: 4, label: "AI Blueprint", icon: Cpu },
    { num: 5, label: "Review & Publish", icon: CheckCircle2 },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Wizard Header & Stepper */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">
              Atomic Multi-Step Wizard
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Publish New Assessment Domain</h2>
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between relative before:absolute before:top-1/2 before:left-0 before:right-0 before:h-0.5 before:bg-slate-200 before:-translate-y-1/2 before:z-0 px-2 sm:px-6">
          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.num;
            const isCur = currentStep === s.num;
            return (
              <div key={s.num} onClick={() => s.num <= currentStep && setCurrentStep(s.num)} className="relative z-10 flex flex-col items-center cursor-pointer group">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all shadow-xs border-2 ${
                  isCur ? "bg-indigo-600 border-indigo-600 text-white scale-110 shadow-md shadow-indigo-200" : isDone ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300 text-slate-400"
                }`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[11px] font-extrabold mt-2 hidden sm:block ${isCur ? "text-indigo-700" : "text-slate-500"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Card */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 shadow-xs min-h-[360px]">
        {/* Step 1: Create Category */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <FolderTree className="w-5 h-5 text-indigo-600" />
              <span>Step 1: Parent Category Configuration</span>
            </h3>
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-500 mb-1">Category Domain Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Programming, Cloud DevOps, Cybersecurity, Data Science..."
                  value={categoryData.name}
                  onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-600 focus:outline-none shadow-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Description & Scope</label>
                <textarea
                  rows="2"
                  placeholder="Brief overview of what skills and technologies this category covers..."
                  value={categoryData.description}
                  onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-normal focus:border-indigo-600 focus:outline-none shadow-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Target Question Inventory</label>
                  <input
                    type="number"
                    min="100"
                    value={categoryData.targetQuestionCount}
                    onChange={(e) => setCategoryData({ ...categoryData, targetQuestionCount: parseInt(e.target.value) })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Theme Color</label>
                  <div className="flex gap-2">
                    {["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map((col) => (
                      <button
                        type="button"
                        key={col}
                        onClick={() => setCategoryData({ ...categoryData, color: col })}
                        className={`w-9 h-9 rounded-xl transition-transform ${categoryData.color === col ? "scale-110 ring-2 ring-slate-800" : "opacity-80"}`}
                        style={{ backgroundColor: col }}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex-1">
                  <input
                    type="checkbox"
                    checked={categoryData.aiEnabled}
                    onChange={(e) => setCategoryData({ ...categoryData, aiEnabled: e.target.checked })}
                    className="rounded text-indigo-600 w-4 h-4 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-slate-800">Enable Groq AI Question Generation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex-1">
                  <input
                    type="checkbox"
                    checked={categoryData.dbFallbackEnabled}
                    onChange={(e) => setCategoryData({ ...categoryData, dbFallbackEnabled: e.target.checked })}
                    className="rounded text-indigo-600 w-4 h-4 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-slate-800">Enable Database Fallback (Zero downtime)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Subcategories */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Step 2: Define Unlimited Subcategories</span>
              </h3>
              <button
                type="button"
                onClick={handleAddSubcategory}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subcategory</span>
              </button>
            </div>
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {subcategories.map((sub, index) => (
                <div key={index} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 relative">
                  <div className="flex items-center justify-between gap-3">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-extrabold text-[11px] rounded-lg">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Subcategory Title (e.g. React Hooks, Java Collections)"
                        value={sub.name}
                        onChange={(e) => handleSubcategoryChange(index, "name", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div className="w-40 flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 font-bold">Target:</span>
                      <input
                        type="number"
                        value={sub.targetQuestionCount}
                        onChange={(e) => handleSubcategoryChange(index, "targetQuestionCount", parseInt(e.target.value))}
                        className="w-24 p-1.5 border border-slate-200 rounded-lg text-xs font-bold text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubcategory(index)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Assessment Configuration */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>Step 3: Default Assessment Session Parameters</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <label className="block text-slate-500 mb-2">Total Questions / Exam</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={defaultConfig.totalQuestions}
                  onChange={(e) => setDefaultConfig({ ...defaultConfig, totalQuestions: parseInt(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base font-black text-center"
                />
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <label className="block text-slate-500 mb-2">Passing Threshold (%)</label>
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={defaultConfig.passingPercentage}
                  onChange={(e) => setDefaultConfig({ ...defaultConfig, passingPercentage: parseInt(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base font-black text-center text-emerald-600"
                />
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <label className="block text-slate-500 mb-2">Time Limit (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={defaultConfig.timeLimitMinutes}
                  onChange={(e) => setDefaultConfig({ ...defaultConfig, timeLimitMinutes: parseInt(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base font-black text-center text-indigo-600"
                />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block mb-2">Difficulty Distribution Breakdown (%)</span>
              <div className="grid grid-cols-4 gap-3 text-center">
                {Object.keys(defaultConfig.difficultyDistribution).map((k) => (
                  <div key={k}>
                    <span className="text-[11px] uppercase font-extrabold text-slate-400 block mb-1">{k}</span>
                    <input
                      type="number"
                      value={defaultConfig.difficultyDistribution[k]}
                      onChange={(e) => setDefaultConfig({
                        ...defaultConfig,
                        difficultyDistribution: { ...defaultConfig.difficultyDistribution, [k]: parseInt(e.target.value) }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: AI Prompt Blueprint */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <span>Step 4: AI Prompt Blueprint & Telemetry Rules</span>
            </h3>
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-500 mb-1">GroqManager System Prompt Template</label>
                <textarea
                  rows="4"
                  value={aiBlueprint.baseSystemPrompt}
                  onChange={(e) => setAiBlueprint({ ...aiBlueprint, baseSystemPrompt: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium leading-relaxed focus:border-indigo-600 focus:outline-none shadow-xs"
                />
              </div>
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-indigo-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] leading-normal">
                  Each subcategory created in Step 2 will receive this template automatically augmented with its domain-specific keywords and validation constraints!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Publish */}
        {currentStep === 5 && (
          <div className="text-center py-6 space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
              <Zap className="w-8 h-8 fill-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Ready for Immediate Production Deployment!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Upon clicking publish, <span className="font-bold text-slate-800">{categoryData.name}</span> along with its <span className="font-bold text-slate-800">{subcategories.length} subcategories</span>, assessment configs, and AI prompt blueprints will become instantly live and selectable by students. Zero server restarts required!
            </p>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto text-left text-xs font-medium space-y-2 shadow-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Domain Target Questions:</span>
                <span className="font-black text-indigo-600">{categoryData.targetQuestionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Groq AI Engine Status:</span>
                <span className="font-bold text-emerald-600">Active (Round-Robin Pool)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Database Fallback Protection:</span>
                <span className="font-bold text-emerald-600">Enabled (0ms gap)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          disabled={currentStep === 1 || submitting}
          onClick={() => setCurrentStep(currentStep - 1)}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={() => {
              if (currentStep === 1 && !categoryData.name.trim()) return toast.warn("Please enter a category name.");
              setCurrentStep(currentStep + 1);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm shadow-indigo-200"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handlePublish}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black transition-all shadow-md shadow-emerald-200 hover:scale-105 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            <span>Publish Assessment Suite Now</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryWizard;
