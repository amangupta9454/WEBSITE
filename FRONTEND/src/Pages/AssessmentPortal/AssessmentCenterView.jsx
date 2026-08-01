import React, { useState } from "react";
import {
  Search,
  Filter,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
  Award,
  AlertCircle,
} from "lucide-react";

/**
 * Phase 12 — Component 2: Assessment Center
 * Displays Available Assessments, Upcoming, Completed, Expired, and Resume Available attempts
 * with interactive search, domain filtering, and responsive Category/Subcategory cards.
 */
const AssessmentCenterView = ({ catalogData, loading, onStartSession, onResumeSession }) => {
  const [activeFilter, setActiveFilter] = useState("AVAILABLE"); // AVAILABLE | ACTIVE | COMPLETED | EXPIRED
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  if (loading || !catalogData) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-20 bg-slate-800/60 rounded-2xl border border-slate-700/50"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-800/60 rounded-2xl"></div>
          <div className="h-64 bg-slate-800/60 rounded-2xl"></div>
          <div className="h-64 bg-slate-800/60 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const { availableCategories = [], attempts = {} } = catalogData;
  const { active = [], completed = [], expired = [], all = [] } = attempts;

  // Flatten subcategories from available categories for catalog presentation
  const subcategoryList = [];
  availableCategories.forEach((cat) => {
    (cat.subcategories || []).forEach((sub) => {
      subcategoryList.push({ ...sub, parentCategoryName: cat.name, categoryId: cat._id });
    });
  });

  // If no database categories populate in dev mode, provide high-aesthetics default domain cards
  const finalSubcategories = subcategoryList.length > 0 ? subcategoryList : [
    { _id: "sub-dev-1", name: "Full-Stack Web Architecture", parentCategoryName: "Software Engineering", difficulty: "Advanced", questionsCount: 25, durationMinutes: 45, icon: "💻" },
    { _id: "sub-dev-2", name: "Data Structures & Algorithmic Efficiency", parentCategoryName: "Computer Science", difficulty: "Expert", questionsCount: 20, durationMinutes: 40, icon: "⚡" },
    { _id: "sub-dev-3", name: "Cloud Infrastructure & Microservices", parentCategoryName: "Cloud Computing", difficulty: "Intermediate", questionsCount: 15, durationMinutes: 30, icon: "☁️" },
    { _id: "sub-dev-4", name: "AI Prompt Engineering & GenAI Pipelines", parentCategoryName: "Artificial Intelligence", difficulty: "Advanced", questionsCount: 20, durationMinutes: 35, icon: "🤖" },
  ];

  const filteredSubcategories = finalSubcategories.filter((sub) => {
    const matchesSearch = sub.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sub.parentCategoryName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || sub.parentCategoryName === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categoriesSet = ["ALL", ...new Set(finalSubcategories.map((s) => s.parentCategoryName))];

  return (
    <div className="space-y-8 p-1 sm:p-4">
      {/* Header & Filter Console */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-cyan-400" />
              <span>Assessment Center & Catalog</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Browse available domain examinations, resume active sessions, or review your historical submission records.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessments, domains..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Primary Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-800">
          {[
            { id: "AVAILABLE", label: "Available Catalog", count: filteredSubcategories.length, icon: BookOpen },
            { id: "ACTIVE", label: "Resume Available", count: active.length, icon: RefreshCw, color: "text-amber-400" },
            { id: "COMPLETED", label: "Completed History", count: completed.length, icon: CheckCircle2, color: "text-emerald-400" },
            { id: "EXPIRED", label: "Expired Attempts", count: expired.length, icon: AlertCircle, color: "text-rose-400" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 text-white shadow-lg"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color || "text-cyan-400"}`} />
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-300 font-mono text-[11px]">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Category Pill Filters (When in Available Catalog mode) */}
        {activeFilter === "AVAILABLE" && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
            <span className="text-xs text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Domain Category:
            </span>
            {categoriesSet.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-cyan-500 text-slate-950 font-bold shadow"
                    : "bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab Content Display */}
      {activeFilter === "AVAILABLE" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubcategories.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No matching assessments found</h3>
              <p className="text-xs text-slate-500 mt-1">Try refining your search keywords or domain filter selection.</p>
            </div>
          ) : (
            filteredSubcategories.map((sub) => (
              <div
                key={sub._id}
                className="group relative bg-slate-900/95 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 text-2xl border border-cyan-500/20 group-hover:scale-110 transition-transform">
                      {sub.icon || "💻"}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 text-[10px] font-semibold tracking-wider uppercase border border-slate-700/60">
                      {sub.difficulty || "Intermediate"}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-cyan-400 uppercase tracking-wider mb-1">
                    {sub.parentCategoryName}
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {sub.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 line-clamp-2">
                    {sub.description || "Validate your technical proficiency through autonomous AI-calibrated questions and verified digital credentialing."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{sub.durationMinutes || 35} Mins Limit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400/80" />
                      <span>Certificate Eligible</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onStartSession && onStartSession(sub._id)}
                  className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group-hover:shadow-cyan-500/30 transition-all"
                >
                  <span>Start Assessment Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Resume Available Tab */}
      {activeFilter === "ACTIVE" && (
        <div className="space-y-4">
          {active.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
              <RefreshCw className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No suspended assessment sessions found</h3>
              <p className="text-xs text-slate-500 mt-1">When you exit an assessment midway, it will be saved here for immediate resume.</p>
            </div>
          ) : (
            active.map((s, idx) => (
              <div
                key={idx}
                className="bg-slate-900/95 border border-amber-500/40 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "8s" }} />
                    <span>Attempt In Progress • Autosave Intact</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{s.subcategoryId?.name || "Active Technical Domain Assessment"}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Session ID: <span className="font-mono text-slate-300">{s.sessionId || "SESS-2026-1001"}</span> • Started on {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => onResumeSession && onResumeSession(s.sessionId)}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 shrink-0 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Resume Attempt</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Completed & Expired Tab list view */}
      {(activeFilter === "COMPLETED" || activeFilter === "EXPIRED") && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {(activeFilter === "COMPLETED" ? completed : expired).length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No {activeFilter.toLowerCase()} sessions recorded</h3>
              <p className="text-xs text-slate-500 mt-1">Your historical submissions will accumulate in this repository.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {(activeFilter === "COMPLETED" ? completed : expired).map((item, idx) => (
                <div key={idx} className="p-5 hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.subcategoryId?.name || "Completed Assessment Record"}</h4>
                    <span className="text-xs text-slate-400 font-mono">ID: {item.sessionId || item._id}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activeFilter === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}>
                    {item.status || (activeFilter === "COMPLETED" ? "Locked & Evaluated" : "Expired")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssessmentCenterView;
