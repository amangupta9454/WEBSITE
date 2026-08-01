import React, { useState } from "react";
import {
  Search,
  BookOpen,
  Award,
  FileText,
  Layers,
  ArrowRight,
  ExternalLink,
  Zap,
} from "lucide-react";
import axios from "axios";

/**
 * Phase 12 — Component 9: Global Student Search
 * Enables universal real-time candidate search across available assessments, authoritative results,
 * digital certificates, categories, and subcategories.
 */
const StudentSearchView = ({ onNavigateTab }) => {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL | ASSESSMENT | RESULT | CERTIFICATE

  // Responsive instant results demonstration
  const mockDatabase = [
    { type: "ASSESSMENT", title: "Full-Stack Web Architecture & Deployments", category: "Software Engineering", id: "sub-101", status: "Available Catalog", link: "catalog" },
    { type: "ASSESSMENT", title: "AI Prompt Architecture & LLM Engineering", category: "Artificial Intelligence", id: "sub-102", status: "Available Catalog", link: "catalog" },
    { type: "RESULT", title: "Cloud Microservices Evaluation", score: "88%", status: "Passed Report", id: "REP-2026-09", link: "results" },
    { type: "CERTIFICATE", title: "Certified Domain Competency — Full-Stack", id: "CAN-2026-ASMT-891402", status: "V1 Active Credential", link: "credentials" },
  ];

  const results = mockDatabase.filter((item) => {
    const matchesQ = (item.title + " " + item.id + " " + (item.category || "")).toLowerCase().includes(query.toLowerCase());
    const matchesT = filterType === "ALL" || item.type === filterType;
    return matchesQ && matchesT;
  });

  return (
    <div className="space-y-6 p-1 sm:p-4 max-w-4xl mx-auto">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Search className="w-8 h-8 text-cyan-400" />
            <span>Global Student Assessment Search</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Search instantaneously across your active test items, historical evaluation reports, digital certificates, and examination subcategories.
          </p>
        </div>

        {/* Big Premium Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type assessment domain, certificate ID (CAN-2026...), or result keyword..."
            className="w-full pl-12 pr-4 py-4 bg-slate-950 border-2 border-slate-800 focus:border-cyan-400 rounded-2xl text-white text-base shadow-inner focus:outline-none transition-all"
            autoFocus
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          {[
            { id: "ALL", label: "All Items", icon: Layers },
            { id: "ASSESSMENT", label: "Assessments", icon: BookOpen },
            { id: "RESULT", label: "Results", icon: FileText },
            { id: "CERTIFICATE", label: "Certificates", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSel ? "bg-cyan-500 text-slate-950 font-extrabold shadow-lg" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Results Display */}
      <div className="space-y-3.5">
        {results.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
            <Zap className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-300">No matching search items</h3>
            <p className="text-xs text-slate-500 mt-1">Try entering different domain terms or switching filter category tabs.</p>
          </div>
        ) : (
          results.map((res, i) => (
            <div
              key={i}
              onClick={() => onNavigateTab(res.link)}
              className="p-5 rounded-2xl bg-slate-900/95 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer shadow-xl transition-all flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${res.type === "CERTIFICATE" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : res.type === "RESULT" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"}`}>
                  {res.type === "CERTIFICATE" ? <Award className="w-6 h-6" /> : res.type === "RESULT" ? <FileText className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span className="text-cyan-400">{res.type}</span>
                    <span>•</span>
                    <span>{res.id}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors mt-0.5">
                    {res.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {res.category ? `Domain: ${res.category}` : `Score: ${res.score || "Verified"}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                  {res.status}
                </span>
                <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentSearchView;
