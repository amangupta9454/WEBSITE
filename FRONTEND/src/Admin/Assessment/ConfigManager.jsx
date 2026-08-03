import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";
import {

  Sliders,
  Save,
  RotateCcw,
  Search,
  CheckCircle,
  AlertCircle,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  Cpu,
  Award,
  BookOpen,
  Filter,
  Layers,
  ArrowRight,
  HelpCircle,
  Eye,
  Globe,
  Lock,
  Copy,
  CheckSquare,
  Square,
  History,
  ShieldAlert,
  Sparkles,
  Zap,
  Check,
  X
} from "lucide-react";

const SYSTEM_DEFAULTS = {
  totalQuestions: 20,
  passingPercentage: 75, // Refinement 1: Default 75%
  timeLimitMinutes: 20,
  difficultyDistribution: { easy: 6, medium: 8, hard: 4, expert: 2 }, // Refinement 2: Exact question count
  assessmentType: "MCQ", // Refinement 5: Clean enums
  aiFirst: true,
  aiTimeoutSeconds: 7, // Refinement 4: AI Timeout default
  batchSize: 5,
  allowRetake: true,
  cooldownHours: 24,
  maximumAttempts: 3,
  shuffleQuestions: true,
  shuffleOptions: true,
  autoSubmit: true,
  negativeMarking: false,
  certificateEnabled: true,
  leaderboardEnabled: true,
  aiFeedbackEnabled: true,
  fullscreenRequired: true,
  maximumTabSwitches: 3,
  showResultImmediately: true,
  visibility: "Public",
  isActive: true,
  inventoryTarget: { easy: 30, medium: 40, hard: 20, expert: 10 },
  lowInventoryThreshold: 20
};

const ConfigManager = () => {
  // Navigation & Hierarchy State (Refinement 3)
  const [activeView, setActiveView] = useState("domain_grid"); // 'domain_grid', 'studio', 'global'
  const [configs, setConfigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [globalConfig, setGlobalConfig] = useState(SYSTEM_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Selection & Studio Editor
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(SYSTEM_DEFAULTS);
  const [versionSummaryNote, setVersionSummaryNote] = useState("");
  
  // Bulk Operations State (Refinement 10)
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({
    totalQuestions: 20,
    passingPercentage: 75,
    timeLimitMinutes: 20,
    aiFirst: true,
    aiTimeoutSeconds: 7,
    certificateEnabled: true,
    leaderboardEnabled: true,
    visibility: "Public"
  });

  // Clone Modal State (Refinement 9)
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTargetIds, setCloneTargetIds] = useState([]);
  const [cloneSourceItem, setCloneSourceItem] = useState(null);

  // Version History Modal State (Refinement 8)
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  // Alerts & Notifications
  const [alert, setAlert] = useState(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const showAlertMessage = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    fetchCategories();
    fetchConfigs();
    fetchGlobalConfig();
  }, [page, selectedCategoryId, search]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/assessment/categories`, getAuthHeaders());
      if (res.data.success) setCategories(res.data.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchGlobalConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/assessment/configs/global`, getAuthHeaders());
      if (res.data.success) {
        setGlobalConfig(res.data.data || SYSTEM_DEFAULTS);
      }
    } catch (err) {
      console.error("Failed to load global config:", err);
    }
  };

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/assessment/configs`, {
        params: { page, limit: 12, search, categoryId: selectedCategoryId },
        ...getAuthHeaders()
      });
      if (res.data.success) {
        setConfigs(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
      }
    } catch (err) {
      showAlertMessage("error", "Failed to load assessment domain configurations.");
    } finally {
      setLoading(false);
    }
  };

  // Open Studio for Subcategory
  const handleOpenStudio = (item) => {
    setSelectedItem(item);
    const conf = item.config ? item.config : SYSTEM_DEFAULTS;
    setFormData({
      ...SYSTEM_DEFAULTS,
      ...conf,
      difficultyDistribution: { ...SYSTEM_DEFAULTS.difficultyDistribution, ...(conf.difficultyDistribution || {}) },
      inventoryTarget: { ...SYSTEM_DEFAULTS.inventoryTarget, ...(conf.inventoryTarget || {}) }
    });
    setVersionSummaryNote("");
    setActiveView("studio");
  };

  // Open Studio for Global Defaults
  const handleOpenGlobalStudio = () => {
    setSelectedItem({ isGlobal: true, subcategory: { name: "System Global Baseline", color: "#6366f1" } });
    setFormData({
      ...SYSTEM_DEFAULTS,
      ...globalConfig,
      difficultyDistribution: { ...SYSTEM_DEFAULTS.difficultyDistribution, ...(globalConfig.difficultyDistribution || {}) },
      inventoryTarget: { ...SYSTEM_DEFAULTS.inventoryTarget, ...(globalConfig.inventoryTarget || {}) }
    });
    setVersionSummaryNote("");
    setActiveView("global_studio");
  };

  // Refinement 2: Question Count calculation & parity check
  const getCountSum = (diff = formData.difficultyDistribution) => {
    return (Number(diff?.easy) || 0) + (Number(diff?.medium) || 0) + (Number(diff?.hard) || 0) + (Number(diff?.expert) || 0);
  };

  const isCountValid = () => {
    return getCountSum() === Number(formData.totalQuestions);
  };

  // Calculate dynamic percentages from question counts
  const calcPercent = (count) => {
    const total = Number(formData.totalQuestions) || 1;
    return Math.round(((Number(count) || 0) / total) * 100);
  };

  // Save Configuration (Global or Subcategory)
  const handleSaveConfig = async () => {
    if (!isCountValid()) {
      showAlertMessage("error", `Question Count distribution sum (${getCountSum()}) must equal Total Questions (${formData.totalQuestions}).`);
      return;
    }

    setSaving(true);
    try {
      const endpoint = activeView === "global_studio" 
        ? `${API_BASE}/api/admin/assessment/configs/global` 
        : `${API_BASE}/api/admin/assessment/configs/${selectedItem.subcategory._id}`;

      const payload = { ...formData, versionSummary: versionSummaryNote || "Updated operational parameters and rules" };

      const res = await axios.put(endpoint, payload, getAuthHeaders());
      if (res.data.success) {
        showAlertMessage("success", `Operational configuration successfully applied and archived to version history.`);
        if (activeView === "global_studio") {
          setGlobalConfig(res.data.data);
        } else {
          await fetchConfigs();
        }
        setActiveView("domain_grid");
      }
    } catch (err) {
      showAlertMessage("error", err.response?.data?.message || "Failed to save operational test rules.");
    } finally {
      setSaving(false);
    }
  };

  // Reset Configuration
  const handleResetConfig = async () => {
    setSaving(true);
    try {
      if (activeView === "global_studio") {
        const res = await axios.put(`${API_BASE}/api/admin/assessment/configs/global`, { ...SYSTEM_DEFAULTS, versionSummary: "Reset global defaults" }, getAuthHeaders());
        if (res.data.success) setGlobalConfig(res.data.data);
      } else {
        await axios.post(`${API_BASE}/api/admin/assessment/configs/${selectedItem.subcategory._id}/reset`, {}, getAuthHeaders());
        await fetchConfigs();
      }
      showAlertMessage("success", "Configuration reset to system baseline parameters (75% Passing, 20 Qs, 7s AI Timeout).");
      setResetConfirmOpen(false);
      setActiveView("domain_grid");
    } catch (err) {
      showAlertMessage("error", "Failed to reset operational configuration.");
    } finally {
      setSaving(false);
    }
  };

  // Refinement 9: Clone Operations
  const openCloneModal = (item, e) => {
    if (e) e.stopPropagation();
    setCloneSourceItem(item);
    setCloneTargetIds([]);
    setShowCloneModal(true);
  };

  const handleExecuteClone = async () => {
    if (cloneTargetIds.length === 0) {
      showAlertMessage("error", "Please select at least one target subcategory domain.");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/api/admin/assessment/configs/${cloneSourceItem.subcategory._id}/clone`, {
        targetSubcategoryIds: cloneTargetIds
      }, getAuthHeaders());
      if (res.data.success) {
        showAlertMessage("success", res.data.message);
        setShowCloneModal(false);
        fetchConfigs();
      }
    } catch (err) {
      showAlertMessage("error", "Failed to execute cloning operation.");
    } finally {
      setSaving(false);
    }
  };

  // Refinement 10: Bulk Update Operations
  const toggleSelectAll = () => {
    if (selectedIds.length === configs.length && configs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(configs.map(c => c.subcategory._id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExecuteBulkUpdate = async () => {
    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/api/admin/assessment/configs/bulk-update`, {
        subcategoryIds: selectedIds,
        updateData: bulkData
      }, getAuthHeaders());
      if (res.data.success) {
        showAlertMessage("success", res.data.message);
        setShowBulkModal(false);
        setSelectedIds([]);
        fetchConfigs();
      }
    } catch (err) {
      showAlertMessage("error", "Failed to execute bulk update.");
    } finally {
      setSaving(false);
    }
  };

  // Refinement 8: Version History View
  const handleOpenHistory = (item, e) => {
    if (e) e.stopPropagation();
    setHistoryList(item?.config?.versionHistory || []);
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  // Refinement 7: Live Assessment Preview Card Component
  const AssessmentPreviewCard = ({ data, subcatName }) => {
    const totalQ = Number(data.totalQuestions) || 0;
    const estTime = Math.max(1, Math.round(Number(data.timeLimitMinutes || 20) * 0.9));
    const countEasy = Number(data.difficultyDistribution?.easy || 0);
    const countMed = Number(data.difficultyDistribution?.medium || 0);
    const countHard = Number(data.difficultyDistribution?.hard || 0);
    const countExp = Number(data.difficultyDistribution?.expert || 0);

    return (
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-400/30">
              Refinement 7: Live Candidate Preview
            </span>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> {data.visibility || "Public"} Catalog
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
          {subcatName} Assessment
        </h3>
        <p className="text-sm text-indigo-200/80 mb-6 font-medium">
          Verify configuration consistency and test limits before committing rules to the live examination engine.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
            <p className="text-xs text-indigo-300 font-semibold uppercase">Questions</p>
            <p className="text-xl font-black text-white mt-0.5">{totalQ}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
            <p className="text-xs text-indigo-300 font-semibold uppercase">Time Limit</p>
            <p className="text-xl font-black text-white mt-0.5">{data.timeLimitMinutes}m</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
            <p className="text-xs text-indigo-300 font-semibold uppercase">Passing Cutoff</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{data.passingPercentage}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
            <p className="text-xs text-indigo-300 font-semibold uppercase">Est. Duration</p>
            <p className="text-xl font-black text-amber-300 mt-0.5">~{estTime}m</p>
          </div>
        </div>

        {/* Refinement 2: Exact Question Count Distribution Preview */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3">
            Question Count Distribution ({countEasy + countMed + countHard + countExp} of {totalQ})
          </p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-2 text-center">
              <span className="text-xs font-bold text-emerald-300">Easy</span>
              <p className="text-base font-black text-emerald-400">{countEasy} <span className="text-xs opacity-75">({calcPercent(countEasy)}%)</span></p>
            </div>
            <div className="bg-sky-500/20 border border-sky-500/30 rounded-xl p-2 text-center">
              <span className="text-xs font-bold text-sky-300">Medium</span>
              <p className="text-base font-black text-sky-400">{countMed} <span className="text-xs opacity-75">({calcPercent(countMed)}%)</span></p>
            </div>
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-2 text-center">
              <span className="text-xs font-bold text-amber-300">Hard</span>
              <p className="text-base font-black text-amber-400">{countHard} <span className="text-xs opacity-75">({calcPercent(countHard)}%)</span></p>
            </div>
            <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-2 text-center">
              <span className="text-xs font-bold text-rose-300">Expert</span>
              <p className="text-base font-black text-rose-400">{countExp} <span className="text-xs opacity-75">({calcPercent(countExp)}%)</span></p>
            </div>
          </div>
          
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${calcPercent(countEasy)}%` }} className="bg-emerald-500 transition-all duration-300" title={`Easy: ${countEasy}`} />
            <div style={{ width: `${calcPercent(countMed)}%` }} className="bg-sky-500 transition-all duration-300" title={`Medium: ${countMed}`} />
            <div style={{ width: `${calcPercent(countHard)}%` }} className="bg-amber-500 transition-all duration-300" title={`Hard: ${countHard}`} />
            <div style={{ width: `${calcPercent(countExp)}%` }} className="bg-rose-500 transition-all duration-300" title={`Expert: ${countExp}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-indigo-200">
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>AI First: <strong className="text-white font-bold">{data.aiFirst ? `${data.aiTimeoutSeconds}s Limit` : "Disabled"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Certificate: <strong className="text-white font-bold">{data.certificateEnabled ? "Enabled" : "Disabled"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Modality: <strong className="text-white font-bold">{data.assessmentType || "MCQ"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Proctoring: <strong className="text-white font-bold">{data.fullscreenRequired ? "Strict Max" : "Basic"}</strong></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Alert Notification Banner */}
      {alert && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg transition-all animate-fade-in ${
          alert.type === "error" 
            ? "bg-rose-50 text-rose-900 border border-rose-200" 
            : "bg-emerald-50 text-emerald-900 border border-emerald-200"
        }`}>
          <div className="flex items-center gap-3">
            {alert.type === "error" ? <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" /> : <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />}
            <span className="text-sm font-bold">{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="p-1 rounded-lg hover:bg-black/5">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* VIEW 1: DOMAIN GRID & HIERARCHY SWITCHER */}
      {activeView === "domain_grid" && (
        <>
          {/* Top Navigation & Refinement 3: Global Override Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30 inline-block mb-3">
                  Phase 3.1 — Architecture Refinement Live
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Assessment Operational Rules Engine
                </h2>
                <p className="text-indigo-200/80 text-sm mt-1 max-w-2xl font-medium leading-relaxed">
                  Manage Question Count distributions, hierarchical inheritance (Global &rarr; Category &rarr; Subcategory), advanced proctoring controls, and AI-First fallback boundaries.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleOpenGlobalStudio}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] border border-indigo-400/30"
                >
                  <SlidersHorizontal className="w-4 h-4 text-indigo-200" />
                  Global Defaults (Root)
                </button>

                <button
                  onClick={() => fetchConfigs()}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all"
                  title="Refresh Domains"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-indigo-300" : ""}`} />
                </button>
              </div>
            </div>

            {/* Refinement 10: Bulk Operation Banner */}
            {selectedIds.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-500/10 p-4 rounded-2xl border border-indigo-400/20">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-base font-black text-white">{selectedIds.length} Domain(s) Selected</span>
                    <p className="text-xs text-indigo-200">Ready for synchronized batch operation overrides.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Sliders className="w-4 h-4" /> Bulk Edit Parameters
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-indigo-200 text-xs font-semibold rounded-xl"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search subcategory domains, slugs, or competencies..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="relative min-w-[200px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedCategoryId}
                  onChange={(e) => { setSelectedCategoryId(e.target.value); setPage(1); }}
                  className="w-full pl-11 pr-8 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all cursor-pointer"
                >
                  <option value="all">All Category Domains</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={toggleSelectAll}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shrink-0"
              >
                {selectedIds.length === configs.length && configs.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                {selectedIds.length === configs.length && configs.length > 0 ? "Unselect All" : "Select All"}
              </button>
            </div>
          </div>

          {/* Subcategory Operational Grid */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-slate-600 font-bold text-sm">Loading domain rules & hierarchy overrides...</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-800">No Assessment Domains Discovered</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                No active subcategory items matched your search criteria. Try broadening your category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configs.map(({ subcategory, config, effectiveConfig }) => {
                const isSelected = selectedIds.includes(subcategory._id);
                const diff = effectiveConfig?.difficultyDistribution || SYSTEM_DEFAULTS.difficultyDistribution;
                const totalQ = Number(effectiveConfig?.totalQuestions || SYSTEM_DEFAULTS.totalQuestions);

                return (
                  <div
                    key={subcategory._id}
                    onClick={() => handleOpenStudio({ subcategory, config: effectiveConfig })}
                    className={`bg-white rounded-3xl border transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between p-6 ${
                      isSelected ? "border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-600/20" : "border-slate-200 shadow-sm hover:border-indigo-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleSelectOne(subcategory._id); }}
                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                          >
                            {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                          </button>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 inline-block mb-1">
                              {subcategory.categoryId ? subcategory.categoryId.name : "Unassigned"}
                            </span>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight line-clamp-1">
                              {subcategory.name}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => openCloneModal({ subcategory, config: effectiveConfig }, e)}
                            className="p-2 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all border border-slate-200"
                            title="Clone operational configuration"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenHistory({ subcategory, config }, e)}
                            className="p-2 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all border border-slate-200"
                            title="View version history archives"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 py-3 border-y border-slate-100 mb-4">
                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-500">Volume</p>
                          <p className="text-base font-black text-slate-800 mt-0.5">{totalQ} Qs</p>
                        </div>
                        <div className="text-center border-x border-slate-100">
                          <p className="text-xs font-semibold text-slate-500">Passing Cutoff</p>
                          <p className="text-base font-black text-emerald-600 mt-0.5">{effectiveConfig?.passingPercentage}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-500">Time Limit</p>
                          <p className="text-base font-black text-indigo-600 mt-0.5">{effectiveConfig?.timeLimitMinutes}m</p>
                        </div>
                      </div>

                      {/* Question Count Share Summary */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600">Tier Distribution (Counts):</span>
                          <span className="text-slate-800 font-mono">
                            {diff.easy}E / {diff.medium}M / {diff.hard}H / {diff.expert}X
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                          <div style={{ width: `${(Number(diff.easy || 0) / totalQ) * 100}%` }} className="bg-emerald-500" title="Easy count" />
                          <div style={{ width: `${(Number(diff.medium || 0) / totalQ) * 100}%` }} className="bg-sky-500" title="Medium count" />
                          <div style={{ width: `${(Number(diff.hard || 0) / totalQ) * 100}%` }} className="bg-amber-500" title="Hard count" />
                          <div style={{ width: `${(Number(diff.expert || 0) / totalQ) * 100}%` }} className="bg-rose-500" title="Expert count" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>AI First: <strong className="text-slate-800">{effectiveConfig?.aiTimeoutSeconds || 7}s Limit</strong></span>
                      </div>
                      <span className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold">
                        Configure <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-sm font-bold text-slate-600">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total domains)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Previous
                </button>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl"
                >
                  Next Page
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2 & 3: OPERATIONAL RULES STUDIO (Subcategory or Global Root) */}
      {(activeView === "studio" || activeView === "global_studio") && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Bar */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveView("domain_grid")}
                className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl flex items-center justify-center transition-all shrink-0"
              >
                &larr;
              </button>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 inline-block mb-1">
                  {activeView === "global_studio" ? "Root System Global Hierarchy" : `Domain Override: ${selectedItem.subcategory.name}`}
                </span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {activeView === "global_studio" ? "Global System Operational Defaults" : `${selectedItem.subcategory.name} Evaluation Rules`}
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  {activeView === "global_studio" 
                    ? "Changes applied here set the root parameters for all assessments unless explicitly overridden by category or subcategory rules." 
                    : "Configure Question Count distribution, AI timeout boundaries, and proctoring parameters specifically for this domain."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeView === "studio" && (
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all flex items-center gap-2 border border-slate-200"
                >
                  <RotateCcw className="w-4 h-4" /> Reset to Defaults
                </button>
              )}
              <button
                type="button"
                disabled={!isCountValid() || saving}
                onClick={handleSaveConfig}
                className={`px-6 py-3 rounded-2xl font-black text-sm text-white shadow-lg transition-all flex items-center gap-2 ${
                  !isCountValid() ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02]"
                }`}
              >
                <Save className="w-5 h-5" />
                {saving ? "Archiving..." : "Commit Operational Rules"}
              </button>
            </div>
          </div>

          {/* Refinement 7: Live CANDIDATE ASSESSMENT PREVIEW */}
          <AssessmentPreviewCard
            data={formData}
            subcatName={activeView === "global_studio" ? "Global System" : selectedItem.subcategory.name}
          />

          {/* STUDIO GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN (2 span): CORE TEST RULES & QUESTION COUNT DISTRIBUTION */}
            <div className="lg:col-span-2 space-y-8">
              {/* CARD 1: QUESTION COUNT DISTRIBUTION (Refinement 2) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Refinement 2</span>
                    <h3 className="text-lg font-black text-slate-800">Question Count Distribution</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Define exact item counts per tier. The engine dynamically calculates percentages automatically.
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl font-black text-sm border flex items-center gap-2 ${
                    isCountValid() ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                  }`}>
                    <span>Sum: {getCountSum()} / {formData.totalQuestions} Qs</span>
                    {isCountValid() ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  </div>
                </div>

                {!isCountValid() && (
                  <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>Distribution error: Easy ({formData.difficultyDistribution?.easy || 0}) + Med ({formData.difficultyDistribution?.medium || 0}) + Hard ({formData.difficultyDistribution?.hard || 0}) + Exp ({formData.difficultyDistribution?.expert || 0}) equals {getCountSum()} Qs, but Total Questions is set to {formData.totalQuestions}.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { key: "easy", label: "Easy Tier", color: "emerald", desc: "Fundamental definitions & basic terms" },
                    { key: "medium", label: "Medium Tier", color: "sky", desc: "Standard syntax & practical application" },
                    { key: "hard", label: "Hard Tier", color: "amber", desc: "Complex architectural & logic problems" },
                    { key: "expert", label: "Expert Tier", color: "rose", desc: "Deep systems & edge case troubleshooting" }
                  ].map((tier) => {
                    const val = formData.difficultyDistribution?.[tier.key] ?? 0;
                    return (
                      <div key={tier.key} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className={`text-xs font-bold uppercase text-${tier.color}-600`}>{tier.label}</span>
                            <p className="text-xs text-slate-500 font-medium">{tier.desc}</p>
                          </div>
                          <span className={`text-base font-black px-2.5 py-1 rounded-xl bg-${tier.color}-50 text-${tier.color}-700 border border-${tier.color}-200`}>
                            {val} Qs <span className="text-xs opacity-80">({calcPercent(val)}%)</span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={formData.totalQuestions}
                          value={val}
                          onChange={(e) => {
                            const num = parseInt(e.target.value) || 0;
                            setFormData({
                              ...formData,
                              difficultyDistribution: { ...formData.difficultyDistribution, [tier.key]: num }
                            });
                          }}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CARD 2: ADVANCED ASSESSMENT CONFIGURATION (Refinement 6) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Refinement 6</span>
                  <h3 className="text-lg font-black text-slate-800">Advanced Assessment Configuration</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Production-ready proctoring controls, candidate retake cooldowns, and real-time evaluation feedback flags.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Modality (Refinement 5) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Evaluation Modality</label>
                    <select
                      value={formData.assessmentType || "MCQ"}
                      onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                      className="w-full py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {["MCQ", "Coding", "Mixed", "AI Viva", "Subjective"].map((type) => (
                        <option key={type} value={type}>{type} Assessment</option>
                      ))}
                    </select>
                  </div>

                  {/* Passing Percentage (Refinement 1) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex justify-between">
                      <span>Passing Cutoff (%)</span>
                      <span className="text-indigo-600 font-bold">Default: 75%</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.passingPercentage}
                      onChange={(e) => setFormData({ ...formData, passingPercentage: Number(e.target.value) })}
                      className="w-full py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-black text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Time Limit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Session Time Limit (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={formData.timeLimitMinutes}
                      onChange={(e) => setFormData({ ...formData, timeLimitMinutes: Number(e.target.value) })}
                      className="w-full py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-black text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Cooldown Hours */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Retake Cooldown (Hours)</label>
                    <input
                      type="number"
                      min="0"
                      max="720"
                      value={formData.cooldownHours || 24}
                      onChange={(e) => setFormData({ ...formData, cooldownHours: Number(e.target.value) })}
                      className="w-full py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-black text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Maximum Attempts */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Max Allowed Attempts</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.maximumAttempts || 3}
                      onChange={(e) => setFormData({ ...formData, maximumAttempts: Number(e.target.value) })}
                      className="w-full py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-black text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Maximum Tab Switches */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Max Allowable Tab Switches</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={formData.maximumTabSwitches ?? 3}
                      onChange={(e) => setFormData({ ...formData, maximumTabSwitches: Number(e.target.value) })}
                      className="w-full py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-black text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Advanced Flag Toggles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  {[
                    { id: "allowRetake", label: "Allow Candidate Retakes", desc: "Enables multiple evaluation tries" },
                    { id: "shuffleQuestions", label: "Shuffle Question Order", desc: "Randomizes batch delivery queue" },
                    { id: "shuffleOptions", label: "Shuffle Option Choices", desc: "Prevents memorized choice patterns" },
                    { id: "autoSubmit", label: "Auto-Submit on Timeout", desc: "Submits answers upon timer expiry" },
                    { id: "negativeMarking", label: "Apply Negative Marking", desc: "Deducts 25% credit per error" },
                    { id: "fullscreenRequired", label: "Require Fullscreen Lock", desc: "Blocks session outside fullscreen" },
                    { id: "certificateEnabled", label: "Issue PDF Credential", desc: "Generates QR verified certificate" },
                    { id: "leaderboardEnabled", label: "Publish to Leaderboards", desc: "Includes scores in domain rankings" },
                    { id: "showResultImmediately", label: "Show Instant Results", desc: "Displays score upon completion" }
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        formData[item.id] ? "bg-indigo-50/40 border-indigo-200 font-bold" : "bg-slate-50/60 border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800">{item.label}</span>
                        <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!formData[item.id]}
                        onChange={(e) => setFormData({ ...formData, [item.id]: e.target.checked })}
                        className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (1 span): AI TIMEOUT HIERARCHY & VERSION AUDIT */}
            <div className="space-y-8">
              {/* CARD 3: AI TIMEOUT HIERARCHY (Refinement 4) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Refinement 4</span>
                  <h3 className="text-lg font-black text-slate-800">AI-First Timeout Hierarchy</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Governs Groq LLM real-time attempt ceilings before triggering zero-pause database fallback.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-indigo-900">AI-First Strategy</p>
                    <p className="text-[11px] text-indigo-700">Real-time inference first</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.aiFirst !== false}
                      onChange={(e) => setFormData({ ...formData, aiFirst: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Fallback Timeout Boundary</span>
                    <span className="text-indigo-600">{formData.aiTimeoutSeconds} Seconds</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="1"
                    value={formData.aiTimeoutSeconds}
                    onChange={(e) => setFormData({ ...formData, aiTimeoutSeconds: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    If AI generation response time exceeds <strong>{formData.aiTimeoutSeconds}s</strong>, the session engine immediately delivers approved fallback questions from the database with <strong>zero UI pause</strong>.
                  </p>
                </div>
              </div>

              {/* CARD 4: VERSION HISTORY AUDIT NOTE (Refinement 8) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Refinement 8</span>
                    <h3 className="text-lg font-black text-slate-800">Version Archiving</h3>
                  </div>
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl border border-indigo-100">
                    v{selectedItem?.config?.currentVersion || 1} Active
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Version Change Summary (Audit Note)</label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Increased passing percentage to 75% and set strict 7s AI timeout for upcoming tech recruitment drive..."
                    value={versionSummaryNote}
                    onChange={(e) => setVersionSummaryNote(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none"
                  ></textarea>
                </div>

                {selectedItem?.config?.versionHistory?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenHistory(selectedItem)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <History className="w-4 h-4" /> View {selectedItem.config.versionHistory.length} Past Archived Snapshot(s)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: RESET CONFIRMATION */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-800">Reset to System Defaults?</h3>
              <p className="text-sm text-slate-500">
                This will revert all operational test rules, timers, and question count distributions back to the recommended system baseline (75% passing, 20 Qs, 7s timeout).
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfig}
                disabled={saving}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg transition-all"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CLONE CONFIGURATION (Refinement 9) */}
      {showCloneModal && cloneSourceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase">Refinement 9</span>
                  <h3 className="text-lg font-black text-slate-800">Clone Operational Rules</h3>
                </div>
              </div>
              <button onClick={() => setShowCloneModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
                Copying rules from source: <strong className="text-slate-800 font-bold">{cloneSourceItem.subcategory.name}</strong> ({cloneSourceItem.config?.totalQuestions || 20} Qs, {cloneSourceItem.config?.passingPercentage || 75}% passing). Select destination target subcategories below:
              </div>

              <div className="space-y-2">
                {configs.filter(c => c.subcategory._id !== cloneSourceItem.subcategory._id).map(({ subcategory }) => {
                  const selected = cloneTargetIds.includes(subcategory._id);
                  return (
                    <div
                      key={subcategory._id}
                      onClick={() => {
                        if (selected) setCloneTargetIds(cloneTargetIds.filter(id => id !== subcategory._id));
                        else setCloneTargetIds([...cloneTargetIds, subcategory._id]);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selected ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-sm">{subcategory.name} ({subcategory.categoryId?.name})</span>
                      {selected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowCloneModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteClone}
                disabled={saving || cloneTargetIds.length === 0}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {saving ? "Cloning..." : `Confirm Clone (${cloneTargetIds.length} Targets)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BULK CONFIGURATION (Refinement 10) */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase">Refinement 10</span>
                  <h3 className="text-lg font-black text-slate-800">Bulk Operational Override</h3>
                </div>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Parameters configured below will be applied simultaneously across all <strong className="text-indigo-600 font-bold">{selectedIds.length}</strong> selected assessment domain subcategories.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Total Questions</label>
                <input
                  type="number"
                  value={bulkData.totalQuestions}
                  onChange={(e) => setBulkData({ ...bulkData, totalQuestions: Number(e.target.value) })}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Passing Cutoff (%)</label>
                <input
                  type="number"
                  value={bulkData.passingPercentage}
                  onChange={(e) => setBulkData({ ...bulkData, passingPercentage: Number(e.target.value) })}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Time Limit (Mins)</label>
                <input
                  type="number"
                  value={bulkData.timeLimitMinutes}
                  onChange={(e) => setBulkData({ ...bulkData, timeLimitMinutes: Number(e.target.value) })}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">AI Timeout (Seconds)</label>
                <input
                  type="number"
                  value={bulkData.aiTimeoutSeconds}
                  onChange={(e) => setBulkData({ ...bulkData, aiTimeoutSeconds: Number(e.target.value) })}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkUpdate}
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-md transition-all"
              >
                {saving ? "Applying..." : `Apply Bulk Update`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VERSION HISTORY AUDIT LOGS (Refinement 8) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase">Refinement 8</span>
                  <h3 className="text-lg font-black text-slate-800">Configuration Version Archives</h3>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {historyList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
                  <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No Historical Versions Recorded</p>
                  <p className="text-xs text-slate-500 mt-1">Version snapshots are archived here whenever modifications are saved.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyList.map((ver, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-black">
                          Version {ver.version}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(ver.updatedAt).toLocaleString()} by <strong>{ver.updatedBy}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-bold bg-white p-2.5 rounded-xl border border-slate-200">
                        "{ver.summary}"
                      </p>
                      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600 font-semibold">
                        <span>Questions: <strong>{ver.snapshot?.totalQuestions} Qs</strong></span>
                        <span>Passing: <strong>{ver.snapshot?.passingPercentage}%</strong></span>
                        <span>AI Timeout: <strong>{ver.snapshot?.aiTimeoutSeconds}s</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all"
              >
                Close Audit Archives
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigManager;
