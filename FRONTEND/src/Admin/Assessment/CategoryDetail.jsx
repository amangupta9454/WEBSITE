import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowLeft,
  FolderTree,
  Layers,
  Database,
  ShieldAlert,
  Zap,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  Award,
  BarChart,
  FileCheck
} from "lucide-react";

const CategoryDetail = ({ categoryId, onBack, onSelectSubcategory }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/admin/assessment/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error loading category detail:", err);
      setError("Failed to load category statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) fetchDetail();
  }, [categoryId]);

  const getHealthBadge = (status) => {
    switch (status) {
      case "Healthy":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Healthy</span>;
      case "Medium":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Medium</span>;
      case "Low":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">Low</span>;
      case "Critical":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Critical</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Unknown</span>;
    }
  };

  if (loading || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <span className="text-sm font-bold">Synchronizing Category Analytics...</span>
      </div>
    );
  }

  const { category, subcategories, statistics, recentAiJobs, recentAssessments } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || "#6366f1" }}></span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Category Detail</span>
              {getHealthBadge(statistics.healthStatus)}
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{category.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{category.description || "No description provided."}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Inventory Progress</span>
            <span className="text-lg font-black text-slate-800">
              {statistics.currentCount} / {statistics.targetCount} <span className="text-xs font-medium text-indigo-600">({statistics.inventoryPercentage}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Inventory Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex justify-between items-center text-xs font-bold mb-2">
          <span className="text-slate-700">Total Category Question Inventory</span>
          <span className="text-slate-600">{statistics.currentCount} of {statistics.targetCount} Target Questions ({statistics.inventoryPercentage}%)</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              statistics.inventoryPercentage >= 80
                ? "bg-emerald-500"
                : statistics.inventoryPercentage >= 50
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
            style={{ width: `${statistics.inventoryPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Subcategories</span>
          <span className="text-2xl font-black text-slate-800">{subcategories.length}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">AI Questions</span>
          <span className="text-2xl font-black text-indigo-600">{statistics.sources.ai}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Manual Questions</span>
          <span className="text-2xl font-black text-amber-600">{statistics.sources.manual}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">CSV Imports</span>
          <span className="text-2xl font-black text-purple-600">{statistics.sources.csv}</span>
        </div>
      </div>

      {/* Difficulty Distribution Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart className="w-4 h-4 text-indigo-600" />
          <span>Difficulty Distribution</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="text-xs font-bold text-emerald-700 block uppercase">Easy</span>
            <span className="text-xl font-black text-emerald-900 mt-1 block">{statistics.difficultyDistribution.easy}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
            <span className="text-xs font-bold text-blue-700 block uppercase">Medium</span>
            <span className="text-xl font-black text-blue-900 mt-1 block">{statistics.difficultyDistribution.medium}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
            <span className="text-xs font-bold text-amber-700 block uppercase">Hard</span>
            <span className="text-xl font-black text-amber-900 mt-1 block">{statistics.difficultyDistribution.hard}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100">
            <span className="text-xs font-bold text-rose-700 block uppercase">Expert</span>
            <span className="text-xl font-black text-rose-900 mt-1 block">{statistics.difficultyDistribution.expert}</span>
          </div>
        </div>
      </div>

      {/* Subcategory Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Subcategories & Inventory Progress</span>
          </h3>
          <span className="text-xs font-semibold text-slate-400">Total {subcategories.length} item(s)</span>
        </div>
        {subcategories.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            No subcategories configured under this category yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-5">Subcategory Name</th>
                  <th className="py-3.5 px-5">Questions / Target</th>
                  <th className="py-3.5 px-5">Inventory Progress</th>
                  <th className="py-3.5 px-5">Health</th>
                  <th className="py-3.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {subcategories.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{sub.name}</div>
                      <div className="text-xs text-slate-400">{sub.description || sub.slug}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-black text-slate-800">{sub.currentQuestionCount}</span>
                      <span className="text-slate-400 text-xs"> / {sub.targetQuestionCount}</span>
                    </td>
                    <td className="py-4 px-5 w-56">
                      <div className="flex items-center gap-2.5">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              sub.inventoryPercentage >= 80 ? "bg-emerald-500" : sub.inventoryPercentage >= 50 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${sub.inventoryPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600 min-w-[35px] text-right">{sub.inventoryPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">{getHealthBadge(sub.healthStatus)}</td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${sub.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                        {sub.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetail;
