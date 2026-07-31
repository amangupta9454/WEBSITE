import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Layers,
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  Edit,
  CheckSquare,
  Loader2,
  FolderTree,
  Sparkles
} from "lucide-react";
import { toast } from "react-toastify";

const SubcategoryManager = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    description: "",
    targetQuestionCount: 250,
    supportedDifficulties: ["easy", "medium", "hard", "expert"],
    isActive: true
  });

  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/assessment/categories?limit=100", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load categories for dropdown:", err);
    }
  };

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/assessment/subcategories", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 15,
          search,
          categoryId: categoryFilter,
          status: statusFilter,
          sort: sortBy
        }
      });
      if (res.data && res.data.success) {
        setSubcategories(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error("Failed to load subcategories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSubcategories();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter, sortBy]);

  useEffect(() => {
    fetchSubcategories();
  }, [page]);

  const getHealthBadge = (status) => {
    switch (status) {
      case "Healthy":  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Healthy</span>;
      case "Medium":   return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Medium</span>;
      case "Low":      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Low</span>;
      default:         return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Critical</span>;
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      categoryId: categories.length > 0 ? categories[0]._id : "",
      name: "",
      description: "",
      targetQuestionCount: 250,
      supportedDifficulties: ["easy", "medium", "hard", "expert"],
      isActive: true
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.name) {
      return toast.warn("Category and Name are required!");
    }
    try {
      const token = localStorage.getItem("token");
      if (editingId) {
        await axios.put(`/api/admin/assessment/subcategories/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Subcategory updated successfully!");
      } else {
        await axios.post("/api/admin/assessment/subcategories", formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Subcategory created with default config & AI blueprint!");
      }
      setShowModal(false);
      fetchSubcategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed.");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`/api/admin/assessment/subcategories/${id}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Status toggled!");
      fetchSubcategories();
    } catch (err) {
      toast.error("Failed to toggle status.");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/admin/assessment/subcategories/${id}/copy`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Subcategory duplicated!");
      fetchSubcategories();
    } catch (err) {
      toast.error("Failed to duplicate subcategory.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subcategory and its configurations?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/assessment/subcategories/${id}?force=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Subcategory deleted.");
      fetchSubcategories();
    } catch (err) {
      toast.error("Failed to delete subcategory.");
    }
  };

  const toggleDifficulty = (diff) => {
    const current = [...formData.supportedDifficulties];
    if (current.includes(diff)) {
      if (current.length === 1) return toast.warn("At least one difficulty must be enabled!");
      setFormData({ ...formData, supportedDifficulties: current.filter(d => d !== diff) });
    } else {
      setFormData({ ...formData, supportedDifficulties: [...current, diff] });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-800">Subcategories & AI Blueprint Links</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage unlimited topic domains under parent categories with individual question inventory progress.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subcategory</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subcategories..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Parent Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">Category: All Parents</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="newest">Sort: Newest</option>
            <option value="mostQuestions">Sort: Most Questions</option>
            <option value="alphabetical">Sort: Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && subcategories.length === 0 ? (
          <div className="p-14 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs font-semibold">Loading Subcategories...</span>
          </div>
        ) : subcategories.length === 0 ? (
          <div className="p-14 text-center text-slate-400">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No subcategories found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4">Subcategory</th>
                  <th className="py-3.5 px-4">Parent Category</th>
                  <th className="py-3.5 px-4">Supported Difficulties</th>
                  <th className="py-3.5 px-4">Inventory Progress</th>
                  <th className="py-3.5 px-4">Health</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {subcategories.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">{sub.name}</td>
                    <td className="py-4 px-4">
                      <span
                        className="px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-xs inline-block"
                        style={{ backgroundColor: sub.categoryId?.color || "#6366f1" }}
                      >
                        {sub.categoryId?.name || "Unlinked"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {sub.supportedDifficulties?.map((d) => (
                          <span key={d} className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 w-44">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${sub.inventoryPercentage >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${sub.inventoryPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{sub.currentQuestionCount}/{sub.targetQuestionCount}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getHealthBadge(sub.healthStatus)}</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(sub._id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${sub.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {sub.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditingId(sub._id);
                          setFormData({
                            categoryId: sub.categoryId?._id || "",
                            name: sub.name,
                            description: sub.description || "",
                            targetQuestionCount: sub.targetQuestionCount,
                            supportedDifficulties: sub.supportedDifficulties,
                            isActive: sub.isActive
                          });
                          setShowModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDuplicate(sub._id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-600">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(sub._id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-lg font-black text-slate-800 mb-4">
              {editingId ? "Edit Subcategory" : "Create New Subcategory"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-500">Parent Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold"
                >
                  <option value="" disabled>Select parent category...</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-slate-500">Subcategory Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Java, Next.js, React Hooks..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-500">Target Question Inventory</label>
                <input
                  type="number"
                  min="10"
                  value={formData.targetQuestionCount}
                  onChange={(e) => setFormData({ ...formData, targetQuestionCount: parseInt(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-500">Supported Difficulties</label>
                <div className="flex gap-2 pt-1">
                  {["easy", "medium", "hard", "expert"].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleDifficulty(d)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-bold transition-all ${
                        formData.supportedDifficulties.includes(d)
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl">Save & Link Defaults</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubcategoryManager;
