import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Trash2, Calendar, LayoutTemplate, Layers } from "lucide-react";

const NormalTasksAdmin = ({ domains = [] }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newTask, setNewTask] = useState({
    domain: "",
    monthNumber: 1,
    task1Title: "",
    task1Desc: "",
    task1Pdf: null,
    task2Title: "",
    task2Desc: "",
    task2Pdf: null
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/normal-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) {
      toast.error("Failed to fetch normal tasks");
    } finally {
      setLoading(false);
    }
  };



  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.domain || !newTask.monthNumber || !newTask.task1Title || !newTask.task1Pdf) {
      toast.error("Domain, Month, Task 1 Title and Task 1 PDF are required.");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("domain", newTask.domain);
      formData.append("monthNumber", newTask.monthNumber);
      
      formData.append("task1Title", newTask.task1Title);
      formData.append("task1Desc", newTask.task1Desc);
      formData.append("pdfs", newTask.task1Pdf);
      
      if (newTask.task2Title && newTask.task2Pdf) {
        formData.append("task2Title", newTask.task2Title);
        formData.append("task2Desc", newTask.task2Desc);
        formData.append("pdfs", newTask.task2Pdf);
      } else if (newTask.task2Title || newTask.task2Pdf) {
        toast.error("For Task 2, both title and PDF are required if one is provided.");
        return;
      }

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/normal-tasks`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Task template saved successfully");
      setNewTask({ 
        ...newTask, 
        task1Title: "", task1Desc: "", task1Pdf: null,
        task2Title: "", task2Desc: "", task2Pdf: null,
        monthNumber: parseInt(newTask.monthNumber) + 1 
      });
      const fileInput1 = document.getElementById("task1PdfUpload");
      if (fileInput1) fileInput1.value = "";
      const fileInput2 = document.getElementById("task2PdfUpload");
      if (fileInput2) fileInput2.value = "";
      fetchTasks();
    } catch (err) {
      toast.error("Failed to create task template");
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task template?")) return;
    
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/normal-tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Task template deleted");
      fetchTasks();
    } catch (err) {
      toast.error("Failed to delete task template");
    }
  };

  // Group tasks by domain
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.domain]) acc[task.domain] = [];
    acc[task.domain].push(task);
    return acc;
  }, {});



  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutTemplate className="text-blue-600" /> Global Task Templates
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Define default monthly tasks for Normal Interns. These tasks will be automatically assigned based on their domain.
          </p>
        </div>
      </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus size={18} /> Add New Template
            </h3>
            <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Domain *</label>
                <select
                  required
                  value={newTask.domain}
                  onChange={(e) => setNewTask({ ...newTask, domain: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Domain</option>
                  {domains.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Month Number *</label>
                <select
                  required
                  value={newTask.monthNumber}
                  onChange={(e) => setNewTask({ ...newTask, monthNumber: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>Month {num}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-sm text-slate-800 mb-3">Task 1 (Days 1-15) *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                    <input
                      required
                      type="text"
                      value={newTask.task1Title}
                      onChange={(e) => setNewTask({ ...newTask, task1Title: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="E.g., UI Clone"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">PDF Document *</label>
                    <input
                      id="task1PdfUpload"
                      required
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setNewTask({ ...newTask, task1Pdf: e.target.files[0] })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={newTask.task1Desc}
                      onChange={(e) => setNewTask({ ...newTask, task1Desc: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                <h4 className="font-bold text-sm text-slate-800 mb-3">Task 2 (Days 16-30) (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={newTask.task2Title}
                      onChange={(e) => setNewTask({ ...newTask, task2Title: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="E.g., Backend Integration"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">PDF Document</label>
                    <input
                      id="task2PdfUpload"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setNewTask({ ...newTask, task2Pdf: e.target.files[0] })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={newTask.task2Desc}
                      onChange={(e) => setNewTask({ ...newTask, task2Desc: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 mt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-500/20"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            {loading ? (
              <p className="text-center text-slate-500">Loading templates...</p>
            ) : Object.keys(groupedTasks).length === 0 ? (
              <div className="text-center bg-white border border-slate-200 border-dashed rounded-2xl p-8">
                <p className="text-slate-500">No task templates defined yet.</p>
              </div>
            ) : (
              Object.entries(groupedTasks).map(([domain, domainTasks]) => (
                <div key={domain} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-lg mb-4">{domain}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {domainTasks.map(task => (
                      <div key={task._id} className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 group">
                        <button 
                          onClick={() => handleDeleteTask(task._id)}
                          className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded mb-2">
                          Month {task.monthNumber}
                        </span>
                        {task.tasks && task.tasks.length > 0 ? (
                          <div className="space-y-3 mt-3">
                            {task.tasks.map((t, idx) => (
                              <div key={idx} className="bg-white p-2 rounded border border-slate-200">
                                <p className="text-xs font-bold text-slate-700">{t.title}</p>
                                <a href={t.pdfUrl} target="_blank" rel="noreferrer" className="inline-block text-blue-600 hover:text-blue-700 text-[10px] font-bold underline">
                                  View PDF
                                </a>
                                {t.description && <p className="text-[10px] text-slate-500 mt-1">{t.description}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <a href={task.pdfUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-blue-600 hover:text-blue-700 text-xs font-bold underline">
                              View Task Document (Legacy)
                            </a>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{task.description}</p>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
    </div>
  );
};

export default NormalTasksAdmin;
