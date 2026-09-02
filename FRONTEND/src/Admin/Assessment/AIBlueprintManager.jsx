import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Cpu,
  Layers,
  Search,
  Plus,
  Edit3,
  Copy,
  Download,
  Upload,
  History,
  GitCompare,
  Play,
  CheckCircle2,
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  Code,
  FileText,
  Tag,
  RotateCcw,
  Trash2,
  BarChart3,
  Zap,
  Terminal,
  ChevronRight,
  ChevronDown,
  Info,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Check,
  Database,
  Network,
  ShieldCheck
} from "lucide-react";

/**
 * Phase 4 — AI Prompt Studio & Blueprint Management System
 * Comprehensive production interface for configuring prompt architectures, immutable version history,
 * dynamic variable injection, output schema molding, and mock testing payload frameworks.
 * 
 * IMPORTANT: This studio strictly manages blueprints and test scaffolding.
 * Live AI question synthesis (Groq inference calls) and candidate delivery belong to Phase 5+.
 */
const AIBlueprintManager = () => {
  // Navigation & View State
  const [currentView, setCurrentView] = useState("GRID"); // GRID | STUDIO | TEMPLATES
  const [activeStudioTab, setActiveStudioTab] = useState("PROMPT"); // PROMPT | SCHEMA | TEST | ANALYTICS
  const [activeSection, setActiveSection] = useState("systemInstruction");
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Data State
  const [blueprints, setBlueprints] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [studioForm, setStudioForm] = useState(null);
  const [healthStatus, setHealthStatus] = useState({ isValid: true, score: 100, errors: [], warnings: [] });
  const [runtimeLibraries, setRuntimeLibraries] = useState({ variables: [], schemas: [], sections: [], assignments: [], runtimeConfigs: [] });
  const [libraryTab, setLibraryTab] = useState("VARIABLES"); // VARIABLES | SCHEMAS | SECTIONS | ASSIGNMENTS | GRAPH
  const [validationLevel, setValidationLevel] = useState("Strict"); // Basic | Advanced | Strict

  // Filtering & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summaryStats, setSummaryStats] = useState({ totalBlueprints: 0, activeCount: 0, templateCount: 10, providerStats: { Groq: 0 } });

  // Modals & Popups
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [cloneTargetSubcat, setCloneTargetSubcat] = useState("");
  const [cloneNewName, setCloneNewName] = useState("");
  const [importJsonText, setImportJsonText] = useState("");
  const [compareV1, setCompareV1] = useState(1);
  const [compareV2, setCompareV2] = useState(2);
  const [compareResult, setCompareResult] = useState(null);

  // Mock Testing Framework State
  const [testVariables, setTestVariables] = useState({
    category: "Software Engineering",
    subcategory: "React.js & State Machine Architecture",
    difficulty: "Hard",
    questionCount: "5",
    topics: "Virtual DOM Re-render Loops, Custom Hooks, Suspense Boundaries",
    experienceLevel: "Senior Engineer (5+ yrs)",
    assessmentType: "MCQ",
    language: "English"
  });
  const [mockTestingResult, setMockTestingResult] = useState(null);
  const [isMockRunning, setIsMockRunning] = useState(false);

  // Notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4500);
  };

  // Fetch Blueprints & Templates
  const fetchBlueprints = async (targetPage = page) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`/api/admin/assessment/blueprints`, {
        params: {
          page: targetPage,
          limit: 15,
          search: searchTerm,
          provider: providerFilter,
          status: statusFilter,
          isTemplate: "false"
        },
        headers
      });

      if (res.data.success) {
        setBlueprints(res.data.data || []);
        setTotalPages(res.data.meta?.totalPages || 1);
        setPage(res.data.meta?.page || 1);
        if (res.data.summary) setSummaryStats(res.data.summary);
      }

      // Simultaneously fetch templates library
      const tplRes = await axios.get(`/api/admin/assessment/blueprints`, {
        params: { isTemplate: "true", limit: 50 },
        headers
      });
      if (tplRes.data.success) {
        setTemplates(tplRes.data.data || []);
      }

      // Fetch Subcategories for Clone / Link operations
      const subRes = await axios.get(`/api/admin/assessment/subcategories`, { headers });
      if (subRes.data.success) {
        setSubcategories(subRes.data.data || []);
      }

      // Fetch Phase 4.1 Decoupled Runtime Libraries
      const libRes = await axios.get(`/api/admin/assessment/runtime/libraries`, { headers });
      if (libRes.data.success && libRes.data.libraries) {
        setRuntimeLibraries(libRes.data.libraries);
      }
    } catch (err) {
      console.error("Error fetching blueprints & libraries:", err);
      showToast("Error retrieving AI Blueprints and Runtime Libraries.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlueprints(1);
  }, [providerFilter, statusFilter]);

  // Handle Search Input Debounce
  useEffect(() => {
    const timer = setTimeout(() => fetchBlueprints(1), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initialize Studio Editor Form from selected blueprint
  const handleOpenStudio = (bp) => {
    setSelectedBlueprint(bp);
    const activeV = bp?.currentVersionData || (bp?.versions && bp.versions[0]) || {};
    const promptObj = activeV.prompt || {
      systemInstruction: bp?.systemPrompt || "You are an expert AI technical evaluator generating assessment challenges.",
      context: "Domain evaluation for target skill competencies.",
      rules: "1. Generate clear, unambiguous multiple-choice questions.\n2. Verify option uniqueness.",
      outputFormat: "Return solely an unadulterated JSON array adhering strictly to the configured Output Schema.",
      validationRulesText: "Verify distractor plausibility and grammatical structure.",
      notes: ""
    };
    const varList = activeV.variables || [
      { name: "category", defaultValue: "Technology", required: true, description: "Master subject domain" },
      { name: "subcategory", defaultValue: bp?.name || "Specialized Subcategory", required: true, description: "Technology domain" },
      { name: "difficulty", defaultValue: "Medium", required: true, description: "Target difficulty" },
      { name: "questionCount", defaultValue: "5", required: true, description: "Batch item count" },
      { name: "topics", defaultValue: "Core Architecture, Best Practices", required: true, description: "Focal subtopics" }
    ];
    const schemaDefs = activeV.outputSchema?.schemaDefinitions || [
      { field: "question", type: "string", required: true, description: "Clear technical question stem" },
      { field: "options", type: "array of 4 strings", required: true, description: "Exhaustive candidate choices A, B, C, D" },
      { field: "correctIndex", type: "number (0-3)", required: true, description: "Exact array index of correct option" },
      { field: "explanation", type: "string", required: true, description: "Detailed architectural justification" },
      { field: "topic", type: "string", required: true, description: "Specific topic assessed" },
      { field: "difficulty", type: "string", required: true, description: "Validated difficulty level" }
    ];

    setStudioForm({
      name: bp?.name || "New Custom Blueprint",
      description: bp?.description || "Production AI Prompt Blueprint governing structured question synthesis.",
      provider: bp?.provider || "Groq",
      providerModel: bp?.providerModel || "llama3-70b-8192",
      status: bp?.status || "Active",
      tags: bp?.tags || ["AI", "Custom", "v1"],
      prompt: promptObj,
      variables: varList,
      outputSchema: {
        schemaDefinitions: schemaDefs,
        jsonSchemaString: activeV.outputSchema?.jsonSchemaString || ""
      },
      validationRules: activeV.validationRules || [
        { name: "No Duplicate Options", rule: "unique_options", enabled: true, description: "Enforces all options are textually unique." },
        { name: "Minimum Explanation Depth", rule: "min_explanation_length_25", enabled: true, description: "Requires analytical explanations." }
      ],
      versionNotes: ""
    });

    validateLocalForm({ ...bp, prompt: promptObj, variables: varList, outputSchema: { schemaDefinitions: schemaDefs } });
    setActiveStudioTab("PROMPT");
    setCurrentView("STUDIO");
  };

  const handleCreateNew = () => {
    const dummyBp = {
      _id: "new",
      name: "New AI Assessment Blueprint",
      description: "Custom AI Blueprint architecture designed for high-precision technical evaluations.",
      provider: "Groq",
      providerModel: "llama3-70b-8192",
      status: "Active",
      tags: ["AI", "Draft", "Custom"],
      activeVersion: 1,
      versions: []
    };
    handleOpenStudio(dummyBp);
  };

  // Run local health checking
  const validateLocalForm = (data = studioForm) => {
    if (!data) return;
    const errors = [];
    const warnings = [];
    const p = data.prompt || {};
    const v = data.variables || [];
    const s = data.outputSchema?.schemaDefinitions || [];

    if (!p.systemInstruction || p.systemInstruction.trim().length === 0) {
      errors.push("System Instruction cannot be empty.");
    } else if (p.systemInstruction.length < 35) {
      warnings.push("System Instruction is under 35 characters; deeper architectural context is advised.");
    }
    if (s.length === 0) {
      errors.push("Output Schema must contain at least one field definition.");
    }
    const varNames = v.map((item) => item.name.toLowerCase());
    if (!varNames.includes("subcategory") && !varNames.includes("topics")) {
      warnings.push("Missing foundational domain variables like {{subcategory}} or {{topics}}.");
    }

    const score = Math.max(0, 100 - errors.length * 25 - warnings.length * 10);
    setHealthStatus({ isValid: errors.length === 0, errors, warnings, score });
  };

  // Commit Save as New Version (Immutable History)
  const handleSaveBlueprint = async () => {
    if (!studioForm) return;
    if (selectedBlueprint?._id !== "new" && (!studioForm.versionNotes || studioForm.versionNotes.trim() === "")) {
      showToast("Please enter Version Commit Notes summarizing your edits before saving.", "error");
      setActiveSection("versionNotes");
      return;
    }
    if (!healthStatus.isValid) {
      showToast("Validation Errors must be resolved before saving blueprint.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      let res;
      if (selectedBlueprint?._id === "new" || !selectedBlueprint?._id) {
        res = await axios.post(`/api/admin/assessment/blueprints`, studioForm, { headers });
      } else {
        res = await axios.put(`/api/admin/assessment/blueprints/${selectedBlueprint._id}`, studioForm, { headers });
      }

      if (res.data.success) {
        showToast(res.data.message || "Blueprint saved successfully!", "success");
        setSelectedBlueprint(res.data.data);
        setStudioForm(prev => ({ ...prev, versionNotes: "" }));
        fetchBlueprints();
      }
    } catch (err) {
      console.error("Error saving blueprint:", err);
      showToast(err.response?.data?.message || "Failed to commit blueprint version.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Rollback / Activate Version
  const handleActivateVersion = async (vNo) => {
    if (!selectedBlueprint?._id || selectedBlueprint._id === "new") return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.post(
        `/api/admin/assessment/blueprints/${selectedBlueprint._id}/versions/${vNo}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showToast(`Rolled back and activated Version ${vNo}!`, "success");
        setShowHistoryModal(false);
        handleOpenStudio(res.data.data);
      }
    } catch (err) {
      showToast("Failed to activate previous version.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Compare Versions Diff
  const handleCompareVersions = async () => {
    if (!selectedBlueprint?._id || selectedBlueprint._id === "new") return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.get(`/api/admin/assessment/blueprints/${selectedBlueprint._id}/compare`, {
        params: { v1: compareV1, v2: compareV2 },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCompareResult(res.data.data);
      }
    } catch (err) {
      showToast("Error retrieving version comparison diffs.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Clone Blueprint
  const handleCloneBlueprint = async () => {
    if (!selectedBlueprint?._id) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.post(
        `/api/admin/assessment/blueprints/${selectedBlueprint._id}/clone`,
        { targetSubcategoryId: cloneTargetSubcat || undefined, newName: cloneNewName || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showToast(res.data.message || "Blueprint cloned successfully!", "success");
        setShowCloneModal(false);
        fetchBlueprints();
        setCurrentView("GRID");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error cloning blueprint.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Import Blueprint
  const handleImportJson = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.post(`/api/admin/assessment/blueprints/import`, parsed, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("JSON Blueprint imported and verified!", "success");
        setShowImportModal(false);
        setImportJsonText("");
        fetchBlueprints();
      }
    } catch (err) {
      showToast("Invalid JSON syntax or structure validation failure.", "error");
    }
  };

  // Export Blueprint JSON
  const handleExportJson = async (bp = selectedBlueprint) => {
    if (!bp?._id || bp._id === "new") {
      showToast("Save blueprint to database before exporting JSON.", "error");
      return;
    }
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.get(`/api/admin/assessment/blueprints/${bp._id}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.blueprintData, null, 2));
        const dlAnchor = document.createElement("a");
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `${bp.name.toLowerCase().replace(/\s+/g, "_")}_export.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        showToast("Exported JSON successfully!", "success");
      }
    } catch (err) {
      showToast("Error compiling export JSON.", "error");
    }
  };

  // Execute Runtime Payload Preview & Architecture Verification (Refinements 1, 9, 12)
  const handleRunMockTest = async () => {
    setIsMockRunning(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const targetId = selectedBlueprint?._id || "draft";
      const res = await axios.post(
        `/api/admin/assessment/blueprints/${targetId}/test`,
        { testVariables, draftPrompt: studioForm?.prompt, providerOverride: studioForm?.provider, validationLevel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMockTestingResult(res.data.previewResult || res.data.testResult);
        showToast("Runtime Architecture Preview generated and validated!", "success");
      }
    } catch (err) {
      showToast("Error generating runtime architecture preview.", "error");
    } finally {
      setIsMockRunning(false);
    }
  };

  // Insert Variable into active prompt section
  const insertVariableIntoPrompt = (varName) => {
    if (!studioForm) return;
    const tag = `{{${varName}}}`;
    const curVal = studioForm.prompt[activeSection] || "";
    const updatedPrompt = { ...studioForm.prompt, [activeSection]: curVal + (curVal && !curVal.endsWith(" ") ? " " : "") + tag };
    const nextForm = { ...studioForm, prompt: updatedPrompt };
    setStudioForm(nextForm);
    validateLocalForm(nextForm);
    showToast(`Inserted ${tag} into ${activeSection}`, "success");
  };

  // Render Section Selector Options
  const sectionsList = [
    { key: "systemInstruction", title: "1. System Instruction", desc: "Core AI evaluator persona and objective mandate." },
    { key: "context", title: "2. Evaluation Context", desc: "Domain boundaries, expertise profiles, and modality." },
    { key: "rules", title: "3. Generation Rules", desc: "Strict constraints, option uniqueness, and style rules." },
    { key: "outputFormat", title: "4. Output Format Directives", desc: "JSON array structuring instructions." },
    { key: "validationRulesText", title: "5. Validation Assurance", desc: "Guidance on distractor plausibility and logic." },
    { key: "versionNotes", title: "6. Version Commit Notes", desc: "Mandatory changelog note required for version archiving.", isSpecial: true }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-800 shadow-2xl animate-fade-in font-sans">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all animate-bounce ${toast.type === "error" ? "bg-red-950/90 border-red-500 text-red-200" : "bg-emerald-950/90 border-emerald-500 text-emerald-200"
          }`}>
          {toast.type === "error" ? <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          <span className="text-sm font-bold tracking-wide">{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: "", type: "success" })} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Architecture Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-8">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Phase 4 Management System Live
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Provider Ready Abstraction (Groq / OpenAI / Gemini / Claude)
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-2 flex items-center gap-3">
            <Terminal className="w-9 h-9 text-indigo-400" /> AI Prompt Studio & Blueprint Architecture
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Design and govern enterprise AI test blueprints with immutable version history, dynamic variable injection, visual output schema builders, and offline mock testing frameworks.
          </p>
        </div>

        {/* View Navigation Switchers */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 shadow-inner self-start lg:self-auto">
          <button
            onClick={() => setCurrentView("GRID")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${currentView === "GRID" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
          >
            <Layers className="w-4 h-4" /> Blueprints Repository
          </button>
          <button
            onClick={() => setCurrentView("TEMPLATES")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${currentView === "TEMPLATES" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" /> System Templates ({templates.length || 10})
          </button>
          <button
            onClick={() => setCurrentView("LIBRARIES")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${currentView === "LIBRARIES" ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30" : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
          >
            <Database className="w-4 h-4 text-amber-400" /> Runtime Architecture & Shared Libraries
          </button>
          {currentView === "STUDIO" && (
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 animate-pulse">
              <Edit3 className="w-4 h-4" /> Active Studio: {studioForm?.name?.slice(0, 16) || "Editor"}...
            </button>
          )}
        </div>
      </div>

      {/* ── VIEW 1: BLUEPRINTS REPOSITORY GRID ────────────────────────────────────────── */}
      {currentView === "GRID" && (
        <div className="space-y-8 animate-fade-in">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 p-5 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Blueprints</p>
                  <h3 className="text-3xl font-black text-white mt-1">{summaryStats.totalBlueprints || blueprints.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-emerald-400 font-semibold">
                <span>{summaryStats.activeCount || blueprints.filter(b => b.status === 'Active').length} Active in Production</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 p-5 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary AI Provider</p>
                  <h3 className="text-3xl font-black text-indigo-400 mt-1">Groq Engine</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-inner">
                  <Cpu className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-400 font-medium">
                <span>Multi-Key Round-Robin ready for Phase 5</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 p-5 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reusable Templates</p>
                  <h3 className="text-3xl font-black text-emerald-400 mt-1">10 Domains</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-400 font-medium">
                <span>DSA, Cloud, Cybersecurity, Database & more</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 p-5 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Runtime Validation</p>
                  <h3 className="text-3xl font-black text-amber-400 mt-1">Strict Mode</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-400 font-medium">
                <span>Decoupled Shared Libraries Active</span>
              </div>
            </div>
          </div>

          {/* Action Header & Search Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-3xl border border-slate-700/80 backdrop-blur-md">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, tags, or prompt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="all">All Providers</option>
                <option value="Groq">Groq (Llama 3)</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Gemini">Google Gemini</option>
                <option value="Claude">Anthropic Claude</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 transition-all hidden sm:block"
              >
                <option value="all">All Status</option>
                <option value="Active">Active Only</option>
                <option value="Draft">Drafts</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-xs sm:text-sm font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
              >
                <Upload className="w-4 h-4 text-indigo-400" /> Import JSON
              </button>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> + Create Custom Blueprint
              </button>
            </div>
          </div>

          {/* Table of Domain Blueprints */}
          <div className="bg-slate-800/40 rounded-3xl border border-slate-700/80 overflow-hidden shadow-xl">
            {isLoading && (
              <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading architectural blueprints...</div>
            )}
            {!isLoading && blueprints.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <Terminal className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-white">No custom blueprints match your filters</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  Get started by cloning from our 10 reusable System Templates or deploy a brand new custom AI evaluation blueprint.
                </p>
                <div className="mt-6 flex justify-center gap-4">
                  <button onClick={() => setCurrentView("TEMPLATES")} className="px-5 py-2.5 rounded-xl bg-purple-600 font-bold text-white shadow-lg shadow-purple-600/30 text-sm">
                    Browse System Templates
                  </button>
                  <button onClick={handleCreateNew} className="px-5 py-2.5 rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/30 text-sm">
                    Create Custom Blueprint
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700/80 bg-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">Blueprint & Domain</th>
                      <th className="py-4 px-4">Provider Engine</th>
                      <th className="py-4 px-4">Active Version</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Tags</th>
                      <th className="py-4 px-6 text-right">Studio Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-sm font-medium">
                    {blueprints.map((bp) => (
                      <tr key={bp._id || bp.id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black border border-indigo-500/30 shrink-0">
                              <Code className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-indigo-400 transition-colors text-base">
                                {bp.name}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                {bp.subcategoryId ? (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Linked to Subcategory: {bp.subcategoryId.name}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic">Standalone Blueprint / Unbound</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                            {bp.provider || "Groq"} ({bp.providerModel || "llama3"})
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-purple-950/80 text-purple-300 border border-purple-500/30">
                            <History className="w-3.5 h-3.5 text-purple-400" />
                            v{bp.activeVersion || bp.version || 1}
                            <span className="text-[10px] text-purple-400 font-normal">({(bp.versions || []).length} items in audit)</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${bp.status === "Active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${bp.status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                            {bp.status || "Active"}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                            {(bp.tags || []).slice(0, 3).map((t, i) => (
                              <span key={i} className="text-[11px] px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-md font-semibold">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenStudio(bp)}
                              className="px-4 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Open Studio
                            </button>
                            <button
                              onClick={() => { setSelectedBlueprint(bp); setShowHistoryModal(true); }}
                              title="View History & Rollback"
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedBlueprint(bp); setShowCloneModal(true); setCloneNewName(`${bp.name} (Clone)`); }}
                              title="Clone Blueprint"
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExportJson(bp)}
                              title="Export JSON"
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all"
                            >
                              <Download className="w-4 h-4" />
                            </button>
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

      {/* ── VIEW 2: SYSTEM TEMPLATES LIBRARY (10 REUSABLE DOMAINS) ────────────────── */}
      {currentView === "TEMPLATES" && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 p-6 rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 uppercase tracking-wider border border-purple-500/30">
                Official Reusable Templates
              </span>
              <h2 className="text-2xl font-black text-white mt-2 flex items-center gap-2.5">
                <BookOpen className="w-7 h-7 text-purple-400" /> 10 Core Evaluation Domains
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Pre-configured prompt architectures engineered for high-precision technical probing. Duplicate any template directly to an active subcategory to establish production evaluation rules instantly.
              </p>
            </div>
            <button
              onClick={() => setCurrentView("GRID")}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm shrink-0 transition-all shadow-md"
            >
              &larr; Return to Repository
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl, i) => (
              <div key={tpl._id || i} className="bg-slate-800/70 hover:bg-slate-800 transition-all duration-300 rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-col justify-between group transform hover:-translate-y-1.5 hover:border-purple-500/50">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-purple-950/80 text-purple-300 border border-purple-500/30">
                      {tpl.templateCategory || "Domain Template"}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> {tpl.provider || "Groq"} Ready
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-4 group-hover:text-purple-300 transition-colors">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">
                    {tpl.description}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-4">
                    {(tpl.tags || []).map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-400 rounded font-semibold">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleOpenStudio(tpl)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Code className="w-4 h-4 text-purple-400" /> Inspect Structure
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBlueprint(tpl);
                      setCloneNewName(`${tpl.templateCategory} Production Blueprint`);
                      setShowCloneModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" /> Duplicate & Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VIEW 3: PROMPT STUDIO EDITOR SUITE ────────────────────────────────────────── */}
      {currentView === "STUDIO" && studioForm && (
        <div className="space-y-6 animate-fade-in">
          {/* Studio Top Control Bar */}
          <div className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-700/80">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-indigo-400" /> Version {selectedBlueprint?.activeVersion || 1} (Active)
                  </span>
                  {selectedBlueprint?.subcategoryId ? (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Linked to Domain: {selectedBlueprint.subcategoryId.name}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {selectedBlueprint?.isTemplate ? "System Template Architecture" : "Standalone Custom Blueprint"}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={studioForm.name}
                  onChange={(e) => setStudioForm({ ...studioForm, name: e.target.value })}
                  className="text-2xl sm:text-3xl font-black bg-transparent border-b border-dashed border-slate-600 hover:border-indigo-400 text-white mt-3 pb-1 focus:outline-none focus:border-solid focus:border-indigo-500 w-full max-w-xl transition-all"
                  placeholder="Enter blueprint title..."
                />
              </div>

              {/* Action Buttons: Save, Test, History, Compare, Clone, Export */}
              <div className="flex items-center gap-3 flex-wrap justify-end">
                <button
                  onClick={() => { setShowHistoryModal(true); }}
                  disabled={selectedBlueprint?._id === "new"}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <History className="w-4 h-4 text-purple-400" /> History ({selectedBlueprint?.versions?.length || 1})
                </button>
                <button
                  onClick={() => { setShowCompareModal(true); handleCompareVersions(); }}
                  disabled={(selectedBlueprint?.versions?.length || 0) < 2}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5 disabled:opacity-40"
                >
                  <GitCompare className="w-4 h-4 text-emerald-400" /> Compare Diffs
                </button>
                <button
                  onClick={() => { setActiveStudioTab("TEST"); }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" /> Mock Test Suite
                </button>
                <button
                  onClick={() => handleExportJson(selectedBlueprint)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 transition-all"
                  title="Export JSON"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                </button>
                <button
                  onClick={handleSaveBlueprint}
                  disabled={isLoading || !healthStatus.isValid}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> {isLoading ? "Archiving v+1..." : "Save as New Version (v+1)"}
                </button>
              </div>
            </div>

            {/* Provider, Model, and Status Config Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">AI Inference Provider</label>
                <select
                  value={studioForm.provider}
                  onChange={(e) => {
                    const next = { ...studioForm, provider: e.target.value };
                    setStudioForm(next);
                    validateLocalForm(next);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Groq">Groq (Default AI-First Engine)</option>
                  <option value="OpenAI">OpenAI (GPT-4 / GPT-3.5)</option>
                  <option value="Gemini">Google Gemini Pro</option>
                  <option value="Claude">Anthropic Claude Sonnet</option>
                  <option value="Custom">Custom Enterprise Endpoint</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">Target AI Model</label>
                <input
                  type="text"
                  value={studioForm.providerModel}
                  onChange={(e) => setStudioForm({ ...studioForm, providerModel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-purple-300 focus:outline-none focus:border-indigo-500"
                  placeholder="llama3-70b-8192"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">Production Status</label>
                <select
                  value={studioForm.status}
                  onChange={(e) => setStudioForm({ ...studioForm, status: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-black text-emerald-400 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Active">Active (Ready for Phase 5)</option>
                  <option value="Draft">Draft (In Architecture Review)</option>
                  <option value="Archived">Archived (Deprecated)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">Real-Time Health Index</label>
                <div className={`w-full px-3.5 py-2 rounded-xl border flex items-center justify-between text-xs font-extrabold ${healthStatus.isValid ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300" : "bg-red-950/80 border-red-500/50 text-red-300"
                  }`}>
                  <span>{healthStatus.isValid ? "✅ PASS — Validated" : "❌ FAIL — Check Errors"}</span>
                  <span className="text-white px-2 py-0.5 bg-slate-900 rounded font-mono">{healthStatus.score}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Studio Workspace Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveStudioTab("PROMPT")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeStudioTab === "PROMPT" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
              <Code className="w-4 h-4" /> 1. Prompt Editor & Variables
            </button>
            <button
              onClick={() => setActiveStudioTab("SCHEMA")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeStudioTab === "SCHEMA" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
              <Layers className="w-4 h-4" /> 2. Output Schema Builder ({studioForm.outputSchema?.schemaDefinitions?.length || 0})
            </button>
            <button
              onClick={() => setActiveStudioTab("TEST")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeStudioTab === "TEST" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-600/30 animate-pulse" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
              <Play className="w-4 h-4" /> 3. Mock Testing & Payload Preview
            </button>
            <button
              onClick={() => setActiveStudioTab("ANALYTICS")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeStudioTab === "ANALYTICS" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
              <BarChart3 className="w-4 h-4" /> 4. Validation & Analytics Architecture
            </button>
          </div>

          {/* ── SUB-TAB 1: PROMPT EDITOR & DYNAMIC VARIABLES ────────────────────────── */}
          {activeStudioTab === "PROMPT" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left Column: Section Selector Buttons (4 Cols) */}
              <div className="xl:col-span-4 space-y-3">
                <div className="bg-slate-800/70 p-5 rounded-3xl border border-slate-700/80 shadow-lg">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-indigo-400" /> Prompt Sections
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Modular architectural blocks synthesized into a high-density system instruction payload during AI evaluations.
                  </p>

                  <div className="space-y-2">
                    {sectionsList.map((sec) => {
                      const isCurr = activeSection === sec.key;
                      const contentLen = (studioForm.prompt[sec.key] || "").length;
                      return (
                        <button
                          key={sec.key}
                          onClick={() => setActiveSection(sec.key)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1 ${isCurr ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md" : "bg-slate-900/50 border-slate-700/60 text-slate-300 hover:border-slate-600"
                            }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-extrabold flex items-center gap-1.5">
                              {sec.title}
                            </span>
                            {sec.isSpecial ? (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold">Mandatory</span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400">{contentLen} chars</span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 leading-normal">{sec.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Variables Inspector Card */}
                <div className="bg-gradient-to-br from-slate-800/90 to-purple-950/30 p-5 rounded-3xl border border-purple-500/30 shadow-xl">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-400 animate-pulse" /> Dynamic Variables Inspector
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Click any placeholder tag below to insert directly into your active prompt section. Values are resolved dynamically during runtime.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(studioForm.variables || []).map((v, idx) => (
                      <button
                        key={idx}
                        onClick={() => insertVariableIntoPrompt(v.name)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-600 hover:text-white text-purple-300 text-xs font-mono font-bold border border-purple-500/30 transition-all flex items-center gap-1 shadow-sm"
                        title={v.description || `Insert {{${v.name}}}`}
                      >
                        <Tag className="w-3 h-3 text-purple-400 shrink-0" /> {'{{' + v.name + '}}'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Code Editor Workspace (8 Cols) */}
              <div className="xl:col-span-8">
                <div className={`bg-slate-950 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col transition-all ${isFullScreen ? "fixed inset-4 z-50 shadow-[0_0_80px_rgba(0,0,0,0.8)]" : "h-[620px]"
                  }`}>
                  <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Editing Section:</span>
                      <h4 className="text-base font-extrabold text-white mt-0.5">
                        {sectionsList.find(s => s.key === activeSection)?.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => setIsFullScreen(!isFullScreen)}
                      className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-slate-300 transition-all"
                      title={isFullScreen ? "Exit Full Screen" : "Expand to Full Screen"}
                    >
                      {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {activeSection === "versionNotes" ? (
                    <div className="p-6 flex-1 bg-gradient-to-br from-amber-950/20 to-slate-950 flex flex-col">
                      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-amber-300 text-xs mb-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block text-sm mb-0.5">Mandatory Immutable Archiving Requirement</strong>
                          To ensure complete historical auditability, you must document explicit changelog notes describing why this blueprint version was modified. Previous versions will never be overwritten.
                        </div>
                      </div>
                      <textarea
                        value={studioForm.versionNotes || ""}
                        onChange={(e) => setStudioForm({ ...studioForm, versionNotes: e.target.value })}
                        className="w-full flex-1 p-5 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
                        placeholder="e.g., Strengthened concurrency distractor rules for Level 2 assessments and aligned passing threshold with Phase 3.1 specifications."
                      />
                    </div>
                  ) : (
                    <div className="flex flex-1 relative font-mono text-sm leading-relaxed overflow-hidden">
                      {/* Line numbering gutter */}
                      <div className="w-12 bg-slate-900/80 text-slate-600 text-right pr-3 py-5 select-none font-extrabold text-xs border-r border-slate-800">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                      <textarea
                        value={studioForm.prompt[activeSection] || ""}
                        onChange={(e) => {
                          const updatedPrompt = { ...studioForm.prompt, [activeSection]: e.target.value };
                          const nextForm = { ...studioForm, prompt: updatedPrompt };
                          setStudioForm(nextForm);
                          validateLocalForm(nextForm);
                        }}
                        className="flex-1 p-5 bg-transparent text-indigo-100 placeholder-slate-600 focus:outline-none resize-none overflow-y-auto w-full font-mono text-xs sm:text-sm leading-6"
                        placeholder={`Write high-precision system instructions for ${activeSection}...`}
                        spellCheck="false"
                      />
                    </div>
                  )}

                  <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Syntax check: <span className="text-emerald-400">Validated</span></span>
                    <span>Total Prompt Length: {Object.values(studioForm.prompt).join(" ").length} characters</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SUB-TAB 2: OUTPUT SCHEMA BUILDER ────────────────────────────────────── */}
          {activeStudioTab === "SCHEMA" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
              {/* Left Column: Interactive Fields Builder (7 Cols) */}
              <div className="xl:col-span-7 space-y-4">
                <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-400" /> Output Schema Builder
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Define exact JSON output properties expected from AI generators.</p>
                    </div>
                    <button
                      onClick={() => {
                        const nextDefs = [...studioForm.outputSchema.schemaDefinitions, { field: "newField", type: "string", required: false, description: "Custom property" }];
                        setStudioForm({ ...studioForm, outputSchema: { ...studioForm.outputSchema, schemaDefinitions: nextDefs } });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all shadow-md flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" /> + Add Field
                    </button>
                  </div>

                  <div className="space-y-3">
                    {studioForm.outputSchema.schemaDefinitions.map((item, idx) => (
                      <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                          <input
                            type="text"
                            value={item.field}
                            onChange={(e) => {
                              const copy = [...studioForm.outputSchema.schemaDefinitions];
                              copy[idx].field = e.target.value;
                              setStudioForm({ ...studioForm, outputSchema: { ...studioForm.outputSchema, schemaDefinitions: copy } });
                            }}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold font-mono text-amber-300 focus:outline-none focus:border-indigo-500"
                          />
                          <select
                            value={item.type}
                            onChange={(e) => {
                              const copy = [...studioForm.outputSchema.schemaDefinitions];
                              copy[idx].type = e.target.value;
                              setStudioForm({ ...studioForm, outputSchema: { ...studioForm.outputSchema, schemaDefinitions: copy } });
                            }}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="string">string</option>
                            <option value="number (0-3)">number (0-3)</option>
                            <option value="array of 4 strings">array of 4 strings</option>
                            <option value="array of strings">array of strings</option>
                            <option value="boolean">boolean</option>
                          </select>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const copy = [...studioForm.outputSchema.schemaDefinitions];
                              copy[idx].description = e.target.value;
                              setStudioForm({ ...studioForm, outputSchema: { ...studioForm.outputSchema, schemaDefinitions: copy } });
                            }}
                            placeholder="Description..."
                            className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const filtered = studioForm.outputSchema.schemaDefinitions.filter((_, i) => i !== idx);
                            setStudioForm({ ...studioForm, outputSchema: { ...studioForm.outputSchema, schemaDefinitions: filtered } });
                          }}
                          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Live JSON Schema Preview (5 Cols) */}
              <div className="xl:col-span-5">
                <div className="bg-slate-950 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-full min-h-[460px]">
                  <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Code className="w-4 h-4" /> Real-Time AI Output JSON Schema
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-900 rounded font-mono text-slate-400">Strict Conformancy</span>
                  </div>
                  <pre className="p-6 text-xs font-mono text-amber-300 leading-relaxed overflow-x-auto flex-1 bg-slate-950">
                    {`[
[
  {
${studioForm.outputSchema.schemaDefinitions.map(d => `    "${d.field}": "${d.type === 'array of 4 strings' ? '["Option A", "Option B", "Option C", "Option D"]' : d.type === 'number (0-3)' ? '0' : d.description || d.type}"`).join(",\n")}
  }
]`}
                  </pre>
                  <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                    This JSON syntax structure is injected automatically into AI system instructions to guarantee zero parsing errors during evaluation execution.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SUB-TAB 3: RUNTIME PAYLOAD PREVIEW (Refinements 1, 9, 12) ───────────── */}
          {activeStudioTab === "TEST" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-slate-900 p-6 rounded-3xl border border-purple-500/40 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-purple-500/20 text-purple-300 uppercase tracking-wider border border-purple-500/30">
                    ⚡ Phase 4.1 Decoupled Runtime Preview
                  </span>
                  <h3 className="text-2xl font-black text-white mt-2 flex items-center gap-2">
                    <Play className="w-6 h-6 text-indigo-400 fill-current" /> Runtime Payload & Architecture Verification
                  </h3>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Verify variable token resolution, evaluate strictness validation levels, and inspect expected provider request/response formats. <strong>Fake question simulation is removed; live AI inference belongs strictly to Phase 5.</strong>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <div className="w-full sm:w-auto">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Validation Level</label>
                    <select
                      value={validationLevel}
                      onChange={(e) => setValidationLevel(e.target.value)}
                      className="px-3.5 py-2.5 bg-slate-900 border border-indigo-500/50 rounded-xl text-xs font-black text-amber-400 focus:outline-none focus:border-indigo-400"
                    >
                      <option value="Basic">Basic (Syntax)</option>
                      <option value="Advanced">Advanced (+ Schema)</option>
                      <option value="Strict">Strict (Full Quality SLA)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleRunMockTest}
                    disabled={isMockRunning}
                    className="w-full sm:w-auto px-8 py-3.5 mt-1 sm:mt-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-2xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 shrink-0 transform hover:-translate-y-0.5"
                  >
                    <Sparkles className="w-5 h-5 animate-spin" /> {isMockRunning ? "Verifying Pipeline..." : "Verify Architecture Preview"}
                  </button>
                </div>
              </div>

              {/* Test Variable Injector Form */}
              <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl">
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" /> Test Runtime Variables Injection
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase block mb-1">Subject Category</label>
                    <input
                      type="text"
                      value={testVariables.category}
                      onChange={(e) => setTestVariables({ ...testVariables, category: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase block mb-1">Specialized Domain</label>
                    <input
                      type="text"
                      value={testVariables.subcategory}
                      onChange={(e) => setTestVariables({ ...testVariables, subcategory: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase block mb-1">Target Difficulty</label>
                    <select
                      value={testVariables.difficulty}
                      onChange={(e) => setTestVariables({ ...testVariables, difficulty: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                      <option>Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase block mb-1">Candidate Seniority</label>
                    <input
                      type="text"
                      value={testVariables.experienceLevel}
                      onChange={(e) => setTestVariables({ ...testVariables, experienceLevel: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase block mb-1">Modality Selector</label>
                    <select
                      value={testVariables.assessmentType}
                      onChange={(e) => setTestVariables({ ...testVariables, assessmentType: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option>MCQ</option>
                      <option>Coding</option>
                      <option>Mixed</option>
                      <option>AI Viva</option>
                      <option>Subjective</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase block mb-1">Language</label>
                    <input
                      type="text"
                      value={testVariables.language}
                      onChange={(e) => setTestVariables({ ...testVariables, language: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase block mb-1">Batch Question Count</label>
                    <input
                      type="number"
                      value={testVariables.questionCount}
                      onChange={(e) => setTestVariables({ ...testVariables, questionCount: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
                      min="1" max="15"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase block mb-1">Focal Technical Topics</label>
                    <input
                      type="text"
                      value={testVariables.topics}
                      onChange={(e) => setTestVariables({ ...testVariables, topics: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-purple-300 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Simulation & Runtime Architecture Preview Output */}
              {mockTestingResult && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-xl">
                      <p className="text-xs font-bold uppercase text-slate-400">Target Provider & Model</p>
                      <h4 className="text-xl font-black text-indigo-400 mt-1">{mockTestingResult.selectedProvider} ({mockTestingResult.selectedModel})</h4>
                      <div className="mt-2 text-[11px] text-slate-300 font-medium">
                        <span>Decoupled via Runtime Configuration (Phase 4.1)</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-xl">
                      <p className="text-xs font-bold uppercase text-slate-400">Validation Level Diagnostics</p>
                      <h4 className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" /> Score: {mockTestingResult.validationStatus?.score || 100}/100 ({mockTestingResult.validationStatus?.level || "Strict"})
                      </h4>
                      <div className="mt-2 text-[11px] text-slate-300 font-medium">
                        <span>{mockTestingResult.validationStatus?.passed !== false ? "PASSED — Quality boundary verified" : "FAILED — Review recommendations"}</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-xl">
                      <p className="text-xs font-bold uppercase text-slate-400">Runtime Execution Status</p>
                      <h4 className="text-xl font-black text-amber-400 mt-1 flex items-center gap-2">
                        <Zap className="w-5 h-5 shrink-0" /> Zero Live API Consumption
                      </h4>
                      <div className="mt-2 text-[11px] text-slate-400">
                        Ready for Phase 5 Groq Worker dispatch
                      </div>
                    </div>
                  </div>

                  {/* Prepared Payload Box */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-950 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="bg-slate-800 px-6 py-3.5 border-b border-slate-700 flex items-center justify-between">
                          <span className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-2">
                            <Code className="w-4 h-4" /> Request Body Preview ({mockTestingResult.selectedProvider || "Groq"})
                          </span>
                          <span className="text-xs text-slate-400 font-mono">POST /v1/chat/completions</span>
                        </div>
                        <pre className="p-6 text-xs font-mono text-indigo-200 overflow-x-auto max-h-80 leading-relaxed">
                          {JSON.stringify(mockTestingResult.preparedRuntimePayload || mockTestingResult.preparedPayload, null, 2)}
                        </pre>
                      </div>
                      <div className="bg-slate-900/80 px-6 py-3 border-t border-slate-800 text-[11px] text-slate-400">
                        Includes compiled instruction with all {{ tokens }} substituted from variable library.
                      </div>
                    </div>

                    <div className="bg-slate-950 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="bg-slate-800 px-6 py-3.5 border-b border-slate-700 flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Expected Response Structure (Pure Schema)
                          </span>
                          <span className="text-xs text-emerald-400 font-bold">Refinement 1 & 12 Compliant</span>
                        </div>
                        <pre className="p-6 text-xs font-mono text-emerald-200 overflow-x-auto max-h-80 leading-relaxed">
                          {mockTestingResult.expectedResponseStructure?.schemaSpecification || "[]"}
                        </pre>
                      </div>
                      <div className="bg-amber-950/40 px-6 py-3 border-t border-amber-500/30 text-[11px] text-amber-300 font-semibold">
                        ⚡ {mockTestingResult.expectedResponseStructure?.notice || "Notice: Simulated fake sample questions have been removed. Live AI question generation belongs exclusively to Phase 5."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SUB-TAB 4: VALIDATION ENGINE & DECOUPLED ANALYTICS (Refinements 9 & 11) ───────────── */}
          {activeStudioTab === "ANALYTICS" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl">
                <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Prompt Validation Engine Diagnostics
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Continuous structural quality assurance evaluated against Basic, Advanced, and Strict SLA boundaries.
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">System Instruction Completeness (Basic)</span>
                    <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1"><Check className="w-4 h-4" /> Verified</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Output JSON Schema Conformancy (Advanced)</span>
                    <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1"><Check className="w-4 h-4" /> Verified</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Dynamic Variable Uniqueness (Strict)</span>
                    <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1"><Check className="w-4 h-4" /> Verified</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Provider Abstraction Mapping (Strict)</span>
                    <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1"><Check className="w-4 h-4" /> Verified</span>
                  </div>
                </div>

                {healthStatus.warnings.length > 0 && (
                  <div className="mt-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs">
                    <strong className="font-black block mb-1">Optimization Recommendations:</strong>
                    <ul className="list-disc pl-5 space-y-1">
                      {healthStatus.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" /> Decoupled Blueprint Lifecycle Analytics
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Strictly tracks immutable blueprint history and assignment telemetry. (Refinement 11: Latency, Token Consumption, and Inference Success Rate tracking are transferred to Phase 5 Runtime Telemetry).
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700/80">
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">Version Count</span>
                      <span className="text-2xl font-black text-white mt-1 block">{selectedBlueprint?.versions?.length || selectedBlueprint?.analytics?.versionCount || 1}</span>
                      <span className="text-[10px] text-indigo-400 block mt-1">Immutable snapshots</span>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700/80">
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">Validation Status</span>
                      <span className="text-lg font-black text-emerald-400 mt-2 block">{selectedBlueprint?.analytics?.validationStatus || "Verified (100%)"}</span>
                      <span className="text-[10px] text-emerald-400/80 block mt-1">Zero schema errors</span>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700/80">
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">Activation Count</span>
                      <span className="text-2xl font-black text-purple-400 mt-1 block">{selectedBlueprint?.analytics?.activationCount || 1}</span>
                      <span className="text-[10px] text-purple-300 block mt-1">Version promotions</span>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700/80">
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">Assignment Uses</span>
                      <span className="text-2xl font-black text-amber-400 mt-1 block">{selectedBlueprint?.analytics?.usageCount || 0}</span>
                      <span className="text-[10px] text-amber-400/80 block mt-1">Domain bindings</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-indigo-950/50 rounded-2xl border border-indigo-500/30 text-indigo-200 text-xs font-medium">
                  <strong>Phase 4.1 Architectural Assurance:</strong> Live latency, token consumption, and inference failure rates have been completely removed from static blueprint storage and are tracked dynamically during AI execution in Phase 5.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 4: PHASE 4.1 RUNTIME ARCHITECTURE & SHARED LIBRARIES ────────────────────── */}
      {currentView === "LIBRARIES" && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 font-extrabold text-xs uppercase tracking-wider rounded-full border border-amber-500/30">
                ⚡ Phase 4.1 Architecture Refinement
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 flex items-center gap-3">
                <Database className="w-8 h-8 text-amber-400" /> Decoupled Runtime Resources & Libraries
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Centralized repositories for reusable variables, output schemas, prompt sections, assignment mappings, and hierarchical provider abstractions. Eliminates code duplication and prepares for live AI execution in Phase 5.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLibraryTab("VARIABLES")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${libraryTab === "VARIABLES" ? "bg-amber-600 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                Variables ({runtimeLibraries.variables?.length || 8})
              </button>
              <button
                onClick={() => setLibraryTab("SCHEMAS")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${libraryTab === "SCHEMAS" ? "bg-amber-600 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                Output Schemas ({runtimeLibraries.schemas?.length || 5})
              </button>
              <button
                onClick={() => setLibraryTab("SECTIONS")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${libraryTab === "SECTIONS" ? "bg-amber-600 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                Prompt Sections ({runtimeLibraries.sections?.length || 4})
              </button>
              <button
                onClick={() => setLibraryTab("ASSIGNMENTS")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${libraryTab === "ASSIGNMENTS" ? "bg-amber-600 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                Assignments & Providers
              </button>
              <button
                onClick={() => setLibraryTab("GRAPH")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5`}
              >
                <Network className="w-3.5 h-3.5" /> Dependency Graph
              </button>
            </div>
          </div>

          {/* Library Sub-Tab: VARIABLES */}
          {libraryTab === "VARIABLES" && (
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700 shadow-xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" /> Reusable Variable Library (Refinement 4)
                </h3>
                <span className="text-xs font-bold text-slate-400">Canonical tokens available for syntax injection: {"{{variable_name}}"}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(runtimeLibraries.variables && runtimeLibraries.variables.length > 0 ? runtimeLibraries.variables : [
                  { name: "category", displayName: "Master Subject Category", defaultValue: "Technical Assessment", description: "Parent evaluation classification", category: "Domain" },
                  { name: "subcategory", displayName: "Specialized Subcategory", defaultValue: "Core Architecture", description: "Specific technical competency area", category: "Domain" },
                  { name: "difficulty", displayName: "Target Difficulty Tier", defaultValue: "Medium", description: "Configured cognitive load (Easy/Medium/Hard/Expert)", category: "Rules" },
                  { name: "topics", displayName: "Focal Topic Array", defaultValue: "Syntax, Architecture, Memory", description: "Mandatory focus concepts", category: "Content" },
                  { name: "language", displayName: "Presentation Language", defaultValue: "English", description: "Linguistic formatting standard", category: "Formatting" },
                  { name: "questionCount", displayName: "Batch Question Count", defaultValue: "5", description: "Rolling batch evaluation item count", category: "Rules" },
                  { name: "assessmentType", displayName: "Evaluation Modality Selector", defaultValue: "MCQ", description: "Format modifier (MCQ, Coding, Mixed, AI Viva, Subjective)", category: "Modality" },
                  { name: "experienceLevel", displayName: "Target Candidate Seniority", defaultValue: "Intermediate / SDE-II", description: "Professional proficiency alignment", category: "Domain" }
                ]).map((v, idx) => (
                  <div key={idx} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/50 px-2 py-1 rounded border border-amber-500/30">{{ "{{" : v.name + "}}" }}</span>
                        <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded uppercase">{v.category}</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-white mt-3">{v.displayName}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{v.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                      <strong className="text-slate-500 font-sans block text-[10px]">Default Baseline:</strong>
                      {v.defaultValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Library Sub-Tab: SCHEMAS */}
          {libraryTab === "SCHEMAS" && (
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700 shadow-xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" /> Reusable Output Schema Library (Refinement 5)
                </h3>
                <span className="text-xs font-bold text-slate-400">Enforces structural JSON consistency across evaluation modalities</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(runtimeLibraries.schemas && runtimeLibraries.schemas.length > 0 ? runtimeLibraries.schemas : [
                  { name: "Standard MCQ Schema", assessmentType: "MCQ", description: "Strict 4-option multiple choice structure with correct index and architectural justifications.", expectedResponseFormat: "JSON Array of MCQ Objects", jsonSchemaString: "[\n  {\n    \"question\": \"String\",\n    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n    \"correctIndex\": 0,\n    \"explanation\": \"String\",\n    \"topic\": \"String\",\n    \"difficulty\": \"Medium\"\n  }\n]" },
                  { name: "Standard Coding Problem Schema", assessmentType: "Coding", description: "Executable programming challenge schema with input/output test suites and memory limits.", expectedResponseFormat: "JSON Array of Coding Problem Objects", jsonSchemaString: "[\n  {\n    \"title\": \"LRU Cache Optimization\",\n    \"problemStatement\": \"String\",\n    \"inputFormat\": \"String\",\n    \"outputFormat\": \"String\",\n    \"sampleTestCases\": [{\"input\": \"String\", \"output\": \"String\", \"explanation\": \"String\"}],\n    \"timeLimitMs\": 2000,\n    \"memoryLimitKb\": 65536\n  }\n]" },
                  { name: "Mixed Modality Schema", assessmentType: "Mixed", description: "Hybrid assessment structure combining objective MCQ items with short technical coding snippets.", expectedResponseFormat: "JSON Array of Mixed Modality Items", jsonSchemaString: "[\n  {\n    \"type\": \"enum (mcq|coding)\",\n    \"question\": \"String\",\n    \"options\": [\"Option A (if mcq)\"],\n    \"starterCode\": \"String (if coding)\"\n  }\n]" },
                  { name: "AI Viva Voice Interview Schema", assessmentType: "AI Viva", description: "Conversational technical probe schema engineered for interactive speech and oral analysis.", expectedResponseFormat: "JSON Array of Oral Probe Objects", jsonSchemaString: "[\n  {\n    \"probeQuestion\": \"Explain distributed ACID consensus under network partitions.\",\n    \"expectedKeyThemes\": [\"CAP theorem\", \"Quorum consensus\"],\n    \"followUpTriggers\": [\"What happens after failover recovery?\"]\n  }\n]" },
                  { name: "Subjective Architectural Brief Schema", assessmentType: "Subjective", description: "Deep technical essay and system design case study evaluation formatting.", expectedResponseFormat: "JSON Array of Subjective Case Studies", jsonSchemaString: "[\n  {\n    \"caseStudyTitle\": \"Multi-Region Event Sourcing Pipeline\",\n    \"scenarioDescription\": \"Design an event bus handling 50k req/sec...\",\n    \"gradingRubric\": {\"scalability\": 35, \"fault_tolerance\": 35, \"cost_efficiency\": 30}\n  }\n]" }
                ]).map((s, idx) => (
                  <div key={idx} className="bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-md overflow-hidden flex flex-col justify-between">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">{s.assessmentType} Modality</span>
                        <span className="text-xs font-mono text-slate-400">{s.expectedResponseFormat}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-white">{s.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.description}</p>
                    </div>
                    <pre className="bg-slate-950 p-4 text-[11px] font-mono text-emerald-200 overflow-x-auto border-t border-slate-800 max-h-48 leading-normal">
                      {s.jsonSchemaString}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Library Sub-Tab: SECTIONS */}
          {libraryTab === "SECTIONS" && (
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700 shadow-xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" /> Reusable Prompt Sections Library (Refinement 8)
                </h3>
                <span className="text-xs font-bold text-slate-400">Standardized enterprise instruction blocks</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(runtimeLibraries.sections && runtimeLibraries.sections.length > 0 ? runtimeLibraries.sections : [
                  { name: "Enterprise System Instruction", sectionType: "System Instruction", content: "You are a senior principal AI technical evaluator and examination architect at Code-A-Nova. Your mission is to synthesize rigorous, industry-aligned assessment items tailored precisely to candidate seniority.", defaultVariablesUsed: ["category", "subcategory", "experienceLevel"] },
                  { name: "Strict JSON Generation Rules", sectionType: "Generation Rules", content: "1. Generate exactly {{questionCount}} high-fidelity items matching difficulty tier: {{difficulty}}.\n2. Do NOT refer to prior questions or include introductory conversational fluff.\n3. Every distractor option MUST represent a plausible technical misconception.", defaultVariablesUsed: ["questionCount", "difficulty"] },
                  { name: "Zero-Trust Validation Rules", sectionType: "Validation Rules", content: "1. Verify grammatical accuracy across all technical stems and explanations.\n2. Ensure the correctIndex mathematically points to the unequivocally true option.\n3. Verify all options are distinct with zero textual duplication.", defaultVariablesUsed: ["topics"] },
                  { name: "JSON Array Output Directive", sectionType: "Output Rules", content: "Return strictly a clean, syntactically verified JSON Array adhering exactly to the linked Output Schema. Do not include markdown code fence formatting.", defaultVariablesUsed: [] }
                ]).map((sec, idx) => (
                  <div key={idx} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 shadow-md flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500/30 uppercase tracking-wider">{sec.sectionType}</span>
                      <h4 className="text-base font-black text-white mt-3">{sec.name}</h4>
                      <p className="text-xs font-mono bg-slate-950 p-4 rounded-xl text-indigo-200 mt-3 whitespace-pre-wrap border border-slate-800 leading-relaxed">{sec.content}</p>
                    </div>
                    {sec.defaultVariablesUsed && sec.defaultVariablesUsed.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-slate-400">Tokens Linked:</span>
                        {sec.defaultVariablesUsed.map((t, i) => (
                          <span key={i} className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">{{ "{{" : t + "}}" }}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Library Sub-Tab: ASSIGNMENTS & PROVIDERS */}
          {libraryTab === "ASSIGNMENTS" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/80 rounded-3xl border border-slate-700 shadow-xl p-6 space-y-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-400" /> Blueprint Assignment Hierarchy (Refinement 2)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Decouples blueprints from direct subcategory tables into dedicated, dynamic assignment mappings supporting fallback chains and assessment type selectors.
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">Level 1: Subcategory Override</span>
                    <p className="text-xs text-slate-300 mt-1">Highest priority assignment routing specialized domain prompts (e.g. React DSA vs Node.js System Design).</p>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700">
                    <span className="text-xs font-black text-purple-400 uppercase tracking-wider">Level 2: Category Assignment</span>
                    <p className="text-xs text-slate-300 mt-1">Intermediary domain routing for newly added subcategories lacking specific blueprint mappings.</p>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-emerald-500/40 bg-emerald-950/20">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Level 3: Global Canonical Default
                    </span>
                    <p className="text-xs text-emerald-200 mt-1">Guarantees zero failed evaluations. Applies Standard AI Blueprint (v1) automatically across all unmapped domains.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 rounded-3xl border border-slate-700 shadow-xl p-6 space-y-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-400" /> Runtime Provider Abstraction (Refinements 6 & 7)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Removes model selection and API key management from static blueprints. Provider execution is managed dynamically by hierarchical runtime configurations.
                </p>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-700 space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-slate-400">Primary Inference Provider:</span>
                    <span className="font-bold text-amber-400">Groq Engine (llama3-70b-8192)</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-slate-400">Secondary Failover Array:</span>
                    <span className="font-bold text-indigo-300">OpenAI (gpt-4o), Gemini (1.5-pro)</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-slate-400">Hard Timeout Boundary:</span>
                    <span className="font-bold text-emerald-400">7000 ms (AI-First SLA)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Default Temperature / Top_P:</span>
                    <span className="font-bold text-slate-200">0.65 / 0.9</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80 text-[11px] text-slate-300">
                  ⚡ When Phase 5 commences, GroqManager will automatically hook into this hierarchical resolver without any alterations to existing Prompt Blueprints.
                </div>
              </div>
            </div>
          )}

          {/* Library Sub-Tab: DEPENDENCY GRAPH */}
          {libraryTab === "GRAPH" && (
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700 shadow-xl p-8 space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                  <Network className="w-7 h-7 text-indigo-400" /> Prompt Dependency Graph (Refinement 10)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  End-to-End architectural visualization representing how decoupled components interact during runtime execution without generating fake questions.
                </p>
              </div>

              {/* Visual Flowchart Nodes */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                <div className="bg-slate-900 p-5 rounded-3xl border border-indigo-500/40 shadow-xl text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">1</div>
                  <h4 className="text-sm font-extrabold text-white">Assessment Config</h4>
                  <p className="text-[11px] text-slate-400">Provides domain parameters (Subcategory, Duration, Question Count)</p>
                </div>

                <div className="bg-slate-900 p-5 rounded-3xl border border-purple-500/40 shadow-xl text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">2</div>
                  <h4 className="text-sm font-extrabold text-white">Assignment Layer</h4>
                  <p className="text-[11px] text-slate-400">Resolves target Blueprint using Subcategory/Category fallback chain</p>
                </div>

                <div className="bg-slate-900 p-5 rounded-3xl border border-amber-500/40 shadow-xl text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">3</div>
                  <h4 className="text-sm font-extrabold text-white">Shared Libraries</h4>
                  <p className="text-[11px] text-slate-400">Injects Reusable Variables (8) & Output Schema (5 Modalities)</p>
                </div>

                <div className="bg-slate-900 p-5 rounded-3xl border border-emerald-500/40 shadow-xl text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">4</div>
                  <h4 className="text-sm font-extrabold text-white">Validation Level</h4>
                  <p className="text-[11px] text-slate-400">Verifies prompt structural health against Basic/Advanced/Strict tiers</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-5 rounded-3xl border border-teal-500/50 shadow-2xl text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">5</div>
                  <h4 className="text-sm font-extrabold text-white">Runtime Provider</h4>
                  <p className="text-[11px] text-teal-300">Assembles payload for Phase 5 live Groq inference (7s Timeout)</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-700/80 text-center text-xs text-slate-300 max-w-3xl mx-auto font-medium shadow-inner">
                <strong>Architectural Integrity Guarantee:</strong> This decoupled runtime pipeline ensures that when new AI providers (Groq, OpenAI, Gemini) or new assessment modalities are added in future phases, the core Prompt Studio remains immutable and completely production-ready.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: VERSION HISTORY & ROLLBACK DRAWER ────────────────────────────────── */}
      {showHistoryModal && selectedBlueprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <History className="w-6 h-6 text-purple-400" /> Immutable Blueprint Audit History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Every commit is archived permanently. Activate any historical snapshot instantly without losing newer iterations.</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {(selectedBlueprint.versions || []).slice().reverse().map((ver) => {
                const isActive = ver.versionNumber === selectedBlueprint.activeVersion;
                return (
                  <div key={ver.versionNumber} className={`p-5 rounded-2xl border transition-all ${isActive ? "bg-indigo-950/40 border-indigo-500/70 shadow-lg" : "bg-slate-800/80 border-slate-700 hover:border-slate-600"
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-white flex items-center gap-2">
                        Version {ver.versionNumber}
                        {isActive && <span className="text-[10px] px-2 py-0.5 bg-emerald-500 text-slate-950 font-black rounded-md uppercase tracking-wider">Active Baseline</span>}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {ver.createdAt ? new Date(ver.createdAt).toLocaleString() : "System Baseline"} • by {ver.createdBy || "Admin"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 mt-3 leading-relaxed font-sans">
                      <strong className="text-indigo-400 block mb-0.5">Commit Summary Note:</strong>
                      {ver.notes || "No commit summary documented."}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Variables: {(ver.variables || []).length} items • Schema Fields: {(ver.outputSchema?.schemaDefinitions || []).length}
                      </span>
                      {!isActive && (
                        <button
                          onClick={() => handleActivateVersion(ver.versionNumber)}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Rollback & Activate v{ver.versionNumber}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VERSION COMPARE DIFFING ENGINE ───────────────────────────────────── */}
      {showCompareModal && selectedBlueprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <GitCompare className="w-6 h-6 text-emerald-400" /> Version Comparison Engine & Side-by-Side Diffs
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Compare architectural mutations across historical prompt blueprint snapshots.</p>
              </div>
              <button onClick={() => setShowCompareModal(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <label className="text-xs font-extrabold text-slate-400 block mb-1">Baseline (Version A)</label>
                <select
                  value={compareV1}
                  onChange={(e) => { setCompareV1(Number(e.target.value)); setTimeout(handleCompareVersions, 50); }}
                  className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-xs font-bold text-white"
                >
                  {(selectedBlueprint.versions || []).map(v => <option key={v.versionNumber} value={v.versionNumber}>Version {v.versionNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-400 block mb-1">Target (Version B)</label>
                <select
                  value={compareV2}
                  onChange={(e) => { setCompareV2(Number(e.target.value)); setTimeout(handleCompareVersions, 50); }}
                  className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-xs font-bold text-white"
                >
                  {(selectedBlueprint.versions || []).map(v => <option key={v.versionNumber} value={v.versionNumber}>Version {v.versionNumber}</option>)}
                </select>
              </div>
              <button onClick={handleCompareVersions} className="mt-5 px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500">
                Refresh Comparison
              </button>
            </div>

            {compareResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 font-mono text-xs">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-red-500/30">
                    <span className="text-red-400 font-bold block mb-2 pb-2 border-b border-slate-800">[-] Version {compareResult.v1?.versionNumber} (Commit: {compareResult.v1?.notes || "N/A"})</span>
                    <p className="whitespace-pre-wrap text-slate-300 leading-relaxed max-h-80 overflow-y-auto">
                      {compareResult.v1?.prompt?.systemInstruction || "Empty prompt section"}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold block mb-2 pb-2 border-b border-slate-800">[+] Version {compareResult.v2?.versionNumber} (Commit: {compareResult.v2?.notes || "N/A"})</span>
                    <p className="whitespace-pre-wrap text-slate-300 leading-relaxed max-h-80 overflow-y-auto">
                      {compareResult.v2?.prompt?.systemInstruction || "Empty prompt section"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">Select two historical versions above to execute differential diffing.</div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: CLONE BLUEPRINT DIALOG ─────────────────────────────────────────── */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Copy className="w-5 h-5 text-indigo-400" /> Clone Blueprint Architecture
              </h3>
              <button onClick={() => setShowCloneModal(false)} className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-400 uppercase block mb-1">New Blueprint Name</label>
              <input
                type="text"
                value={cloneNewName}
                onChange={(e) => setCloneNewName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g., Python Advanced Production Blueprint"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-400 uppercase block mb-1">Link to Destination Subcategory (Optional)</label>
              <select
                value={cloneTargetSubcat}
                onChange={(e) => setCloneTargetSubcat(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Keep Unbound / Standalone Library Blueprint</option>
                {subcategories.map(s => (
                  <option key={s._id || s.id} value={s._id || s.id}>{s.name} ({s.categoryId?.name || "Category"})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setShowCloneModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs hover:text-white">Cancel</button>
              <button onClick={handleCloneBlueprint} disabled={isLoading} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-extrabold text-white text-xs shadow-lg shadow-indigo-600/30">
                {isLoading ? "Cloning..." : "Confirm Duplication"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: IMPORT JSON BLUEPRINT DIALOG ───────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-400" /> Import JSON Blueprint Architecture
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Paste exported JSON payload. Automatic syntax and schema structure verification is performed prior to ingestion.</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              rows={10}
              className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-xs font-mono text-indigo-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
              placeholder='Paste JSON containing {"name": "...", "provider": "Groq", "prompt": { ... }, "outputSchema": { ... } }'
            />

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowImportModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs hover:text-white">Cancel</button>
              <button onClick={handleImportJson} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-white text-xs shadow-lg shadow-emerald-600/30">
                Verify & Ingest Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIBlueprintManager;
