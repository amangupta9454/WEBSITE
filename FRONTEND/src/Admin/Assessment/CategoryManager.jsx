import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FolderTree,
  Search,
  Filter,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Edit,
  Eye,
  RefreshCw,
  MoreVertical,
  Loader2,
  AlertTriangle,
  Sparkles,
  Layers,
  CheckSquare
} from "lucide-react";
import { toast } from "react-toastify";

const CategoryManager = ({ onSelectCategory, onLaunchWizard }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [aiFilter, setAiFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingCat, setEditingCat] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("/api/admin/assessment/categories", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 12,
          search,
          status: statusFilter,
          health: healthFilter,
          aiEnabled: aiFilter,
          sort: sortBy
        }
      });
      if (res.data && res.data.success) {
        setCategories(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCategories();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, healthFilter, aiFilter, sortBy]);

  useEffect(() => {
    fetchCategories();
  }, [page]);

  const getHealthBadge = (status) => {
    switch (status) {
      case "Healthy":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">Healthy</span>;
      case "Medium":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">Medium</span>;
      case "Low":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200/80">Low</span>;
      case "Critical":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">Critical</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Unknown</span>;
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.patch(`/api/admin/assessment/categories/${id}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Status toggled successfully!");
      fetchCategories();
    } catch (err) {
      toast.error("Failed to toggle category status.");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(`/api/admin/assessment/categories/${id}/copy`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Category duplicated!");
      fetchCategories();
    } catch (err) {
      toast.error("Failed to duplicate category.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`/api/admin/assessment/categories/${id}?force=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Category deleted!");
      setConfirmDeleteId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category.");
    }
  };

  const handleBulkStatus = async (isActive) => {
    if (selectedIds.length === 0) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post("/api/admin/assessment/categories/bulk-status", { ids: selectedIds, isActive }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Updated ${selectedIds.length} categories.`);
      setSelectedIds([]);
      fetchCategories();
    } catch (err) {
      toast.error("Bulk status update failed.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} category(s)?`)) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post("/api/admin/assessment/categories/bulk-delete", { ids: selectedIds, force: true }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Deleted ${selectedIds.length} categories.`);
      setSelectedIds([]);
      fetchCategories();
    } catch (err) {
      toast.error("Bulk delete failed.");
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCat) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(`/api/admin/assessment/categories/${editingCat._id}`, editingCat, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Category updated successfully!");
      setShowEditModal(false);
      fetchCategories();
    } catch (err) {
      toast.error("Failed to update category.");
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(categories.map(c => c._id));
    else setSelectedIds([]);
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-800">Categories & Inventory Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Assessment hierarchies, monitor AI target question counts, and run batch actions.
          </p>
        </div>
        <button
          onClick={onLaunchWizard}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Category Wizard</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name, slug or description..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Status: All</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Health Filter */}
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Health: All</option>
            <option value="Healthy">Healthy (80%+)</option>
            <option value="Medium">Medium (50-79%)</option>
            <option value="Low">Low (20-49%)</option>
            <option value="Critical">Critical (&lt;20%)</option>
          </select>

          {/* AI Enabled Filter */}
          <select
            value={aiFilter}
            onChange={(e) => setAiFilter(e.target.value)}
            className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">AI Engine: All</option>
            <option value="true">AI Enabled</option>
            <option value="false">AI Disabled</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="mostQuestions">Sort: Most Questions</option>
            <option value="leastQuestions">Sort: Least Questions</option>
            <option value="alphabetical">Sort: Alphabetical</option>
            <option value="recentlyUpdated">Sort: Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-indigo-900 text-white rounded-2xl shadow-sm text-xs font-medium animate-fade-in">
          <span className="flex items-center gap-2 font-bold pl-2">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span>Selected {selectedIds.length} item(s)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatus(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold transition-all"
            >
              Enable All
            </button>
            <button
              onClick={() => handleBulkStatus(false)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 font-bold transition-all"
            >
              Disable All
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 font-bold transition-all"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Categories Table View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && categories.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs font-semibold">Loading Assessment Categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No matching categories found</p>
            <p className="text-xs mt-1 text-slate-400">Adjust your search filters or create a new category using the wizard.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={selectedIds.length === categories.length && categories.length > 0}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-4">Inventory Progress</th>
                  <th className="py-3.5 px-4">Health</th>
                  <th className="py-3.5 px-4">AI Engine</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(cat._id)}
                        onChange={() => toggleSelectOne(cat._id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs text-xs flex-shrink-0"
                          style={{ backgroundColor: cat.color || "#6366f1" }}
                        >
                          {cat.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div
                            onClick={() => onSelectCategory(cat._id)}
                            className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            {cat.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">Slug: {cat.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 w-52">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>{cat.currentQuestionCount} / {cat.targetQuestionCount}</span>
                          <span className="text-slate-500">{cat.inventoryPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              cat.inventoryPercentage >= 80 ? "bg-emerald-500" : cat.inventoryPercentage >= 50 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${cat.inventoryPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getHealthBadge(cat.healthStatus)}</td>
                    <td className="py-4 px-4">
                      {cat.aiEnabled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                          <Sparkles className="w-3 h-3" /> Enabled
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Disabled</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(cat._id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          cat.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {cat.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onSelectCategory(cat._id)}
                          title="View Details"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingCat({ ...cat }); setShowEditModal(true); }}
                          title="Edit Category"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(cat._id)}
                          title="Duplicate Category"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-600 transition-all"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toast.info(`AI Question Generation worker scheduled for Phase 5 & 6!`)}
                          title="Generate AI Questions"
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === cat._id ? (
                          <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                            <button onClick={() => handleDelete(cat._id)} className="text-xs font-bold text-rose-700 px-2">Yes</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-bold text-slate-500 px-1">No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(cat._id)}
                            title="Delete Category"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Category Modal */}
      {showEditModal && editingCat && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-lg font-black text-slate-800 mb-4">Edit Assessment Category</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-500">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCat.name}
                  onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-500">Description</label>
                <textarea
                  value={editingCat.description || ""}
                  onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                  rows="3"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-normal"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-500">Target Question Count</label>
                  <input
                    type="number"
                    min="10"
                    value={editingCat.targetQuestionCount}
                    onChange={(e) => setEditingCat({ ...editingCat, targetQuestionCount: parseInt(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Theme Color</label>
                  <input
                    type="color"
                    value={editingCat.color || "#6366f1"}
                    onChange={(e) => setEditingCat({ ...editingCat, color: e.target.value })}
                    className="w-full h-11 p-1 border border-slate-200 rounded-xl cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCat.aiEnabled}
                    onChange={(e) => setEditingCat({ ...editingCat, aiEnabled: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                  />
                  <span>Enable AI Generation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCat.isActive}
                    onChange={(e) => setEditingCat({ ...editingCat, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                  />
                  <span>Active & Visible</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
