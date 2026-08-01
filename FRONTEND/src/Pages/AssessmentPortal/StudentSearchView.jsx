import React, { useState } from "react";
import {
  Search,
  BookOpen,
  Award,
  FileText,
  FolderOpen,
  ArrowRight,
} from "lucide-react";

/**
 * Global Student Assessment Search (Component 9)
 * Enables search across live available assessments, authoritative results, and digital certificates in Light Theme.
 * Zero hardcoded items; exclusively searches actual database arrays passed via props.
 */
const StudentSearchView = ({ catalog = [], results = [], credentials = [], onSelect }) => {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL | ASSESSMENT | RESULT | CERTIFICATE

  // Combine live real datasets into searchable index without any mock items
  const combinedDatabase = [
    ...catalog.map(a => ({ type: "ASSESSMENT", title: a.name, category: a.parentCategoryName, id: a._id, status: "Available in Catalog", data: a })),
    ...results.map(r => ({ type: "RESULT", title: r.title || "Evaluation Result", id: r._id || r.sessionId, status: `${r.percentage || 0}% (${r.passed ? "PASSED" : "FAILED"})`, data: r })),
    ...credentials.map(c => ({ type: "CERTIFICATE", title: c.assessmentName || "Digital Credential", id: c.certificateId || c._id, status: `v${c.version || 1} Verified`, data: c })),
  ];

  const matchedResults = combinedDatabase.filter((item) => {
    if (!query.trim()) return true;
    const searchString = (item.title + " " + item.id + " " + (item.category || "")).toLowerCase();
    const matchesQ = searchString.includes(query.trim().toLowerCase());
    const matchesT = filterType === "ALL" || item.type === filterType;
    return matchesQ && matchesT;
  });

  const getIcon = (type) => {
    if (type === "CERTIFICATE") return <Award className="w-4 h-4 text-amber-500" />;
    if (type === "RESULT") return <FileText className="w-4 h-4 text-emerald-600" />;
    return <BookOpen className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-600" />
            <span>Search Assessments & Records</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search instantaneously across live assessment catalogs, authoritative evaluation results, and earned certificates.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by assessment name, certificate ID, or domain category..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 font-medium text-sm shadow-inner focus:outline-none transition-all"
            autoFocus
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {["ALL", "ASSESSMENT", "RESULT", "CERTIFICATE"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold capitalize transition-all whitespace-nowrap ${
                filterType === type
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type === "ALL" ? "All Records" : `${type.toLowerCase()}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {matchedResults.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs space-y-2">
            <FolderOpen className="w-9 h-9 mx-auto text-slate-400" />
            <h4 className="font-bold text-slate-800 text-sm">No Matching Records Found</h4>
            <p className="max-w-sm mx-auto">
              We could not find any live assessments, completed attempts, or verified credentials matching your query.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matchedResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelect && onSelect(item, item.type.toLowerCase())}
                className="p-4 rounded-xl border border-slate-100 hover:border-indigo-300 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 mr-2 inline-block">
                      {item.type}
                    </span>
                    <span className="font-bold text-sm text-slate-900 truncate block sm:inline mt-0.5">
                      {item.title}
                    </span>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                      ID: {item.id} {item.category && `• Domain: ${item.category}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-extrabold text-slate-600 bg-slate-200/70 px-2.5 py-1 rounded-lg">
                    {item.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSearchView;
