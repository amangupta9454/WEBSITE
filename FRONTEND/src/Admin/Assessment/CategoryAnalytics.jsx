import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";
import { 

  FolderTree, BookOpen, Users, TrendingUp, AlertTriangle, 
  CheckCircle, PieChart, Loader2 
} from "lucide-react";

const CategoryAnalytics = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE}/api/admin/assessment/analytics/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setCategories(res.data.data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch category domain analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            Domain Category Intelligence & Topic Diagnostics
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only evaluation telemetry by major academic and technological categories, highlighting candidate competency strengths and weak topic vulnerability patterns.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs font-semibold">Aggregating category diagnostic maps...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-bold">No domain categories found in platform database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-black text-slate-800">{cat.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{cat.description || "Core assessment technology domain."}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-black text-xs rounded-lg border border-indigo-100">
                    {cat.averageScore}% Avg
                  </span>
                </div>

                {/* KPI Tri-grid */}
                <div className="grid grid-cols-3 gap-3 my-5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Assessments</div>
                    <div className="text-sm font-black text-slate-800 mt-0.5">{cat.assessmentCount}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Questions</div>
                    <div className="text-sm font-black text-indigo-600 mt-0.5">{cat.questionCount}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Students</div>
                    <div className="text-sm font-black text-emerald-600 mt-0.5">{cat.studentCount}</div>
                  </div>
                </div>

                {/* Strong & Weak Topics */}
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <div className="text-[11px] font-black uppercase text-emerald-700 flex items-center gap-1.5 mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> High Competency (Strong Topics)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(cat.strongTopics || []).map((t, i) => (
                        <span key={i} className="text-xs bg-white px-2 py-0.5 rounded-md text-emerald-800 font-bold border border-emerald-200 shadow-2xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                    <div className="text-[11px] font-black uppercase text-rose-700 flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Diagnostic Focus (Weak Topics)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(cat.weakTopics || []).map((t, i) => (
                        <span key={i} className="text-xs bg-white px-2 py-0.5 rounded-md text-rose-800 font-bold border border-rose-200 shadow-2xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Difficulty Mix Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold flex items-center gap-1"><PieChart className="w-3.5 h-3.5 text-slate-400" /> Difficulty Mix:</span>
                <div className="flex items-center gap-2 font-semibold text-[11px]">
                  <span className="text-emerald-600 font-bold">{cat.difficultyMix?.easy} E</span> •
                  <span className="text-blue-600 font-bold">{cat.difficultyMix?.medium} M</span> •
                  <span className="text-amber-600 font-bold">{cat.difficultyMix?.hard} H</span> •
                  <span className="text-purple-600 font-bold">{cat.difficultyMix?.expert} X</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryAnalytics;
