import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Trash2, Calendar, LayoutTemplate, Layers } from "lucide-react";

const NormalTasksAdmin = ({ domains = [] }) => {
  const [activeTab, setActiveTab] = useState("v1");
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [v2Tasks, setV2Tasks] = useState([]);
  const [v2Loading, setV2Loading] = useState(true);

  const [newTask, setNewTask] = useState({
    domain: "",
    monthNumber: 1,
    pdf: null,
    description: ""
  });

  const [newV2Task, setNewV2Task] = useState({
    domain: "",
    monthNumber: 1,
    p1Name: "",
    p1Deadline: "15 Days",
    p1Repo: "",
    p1Resources: "",
    p2Name: "",
    p2Deadline: "15 Days",
    p2Repo: "",
    p2Resources: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchV2Tasks();
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

  const fetchV2Tasks = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/v2-global-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setV2Tasks(res.data);
    } catch (err) {
      toast.error("Failed to fetch V2 global tasks");
    } finally {
      setV2Loading(false);
    }
  };

  const handleCreateV2Task = async (e) => {
    e.preventDefault();
    if (!newV2Task.domain || !newV2Task.p1Name || !newV2Task.p2Name) {
      toast.error("Please fill in domain and project names.");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        domain: newV2Task.domain,
        monthNumber: newV2Task.monthNumber,
        projects: [
          {
            projectNumber: 1,
            projectName: newV2Task.p1Name,
            deadline: newV2Task.p1Deadline,
            repository: newV2Task.p1Repo,
            resources: newV2Task.p1Resources,
          },
          {
            projectNumber: 2,
            projectName: newV2Task.p2Name,
            deadline: newV2Task.p2Deadline,
            repository: newV2Task.p2Repo,
            resources: newV2Task.p2Resources,
          }
        ]
      };

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/v2-global-tasks`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("V2 Task template saved successfully");
      setNewV2Task({
        domain: newV2Task.domain,
        monthNumber: parseInt(newV2Task.monthNumber) + 1,
        p1Name: "", p1Deadline: "15 Days", p1Repo: "", p1Resources: "",
        p2Name: "", p2Deadline: "15 Days", p2Repo: "", p2Resources: "",
      });
      fetchV2Tasks();
    } catch (err) {
      toast.error("Failed to save V2 task template");
    }
  };

  const handleDeleteV2Task = async (id) => {
    if (!window.confirm("Are you sure you want to delete this V2 task template?")) return;
    
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/v2-global-tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("V2 Task template deleted");
      fetchV2Tasks();
    } catch (err) {
      toast.error("Failed to delete V2 task template");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.domain || !newTask.pdf || !newTask.monthNumber) {
      toast.error("Please fill in all required fields (including PDF).");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("domain", newTask.domain);
      formData.append("monthNumber", newTask.monthNumber);
      formData.append("pdf", newTask.pdf);
      if (newTask.description) formData.append("description", newTask.description);

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/normal-tasks`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Task template saved successfully");
      setNewTask({ ...newTask, pdf: null, description: "", monthNumber: parseInt(newTask.monthNumber) + 1 });
      document.getElementById("taskPdfUpload").value = "";
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

  const groupedV2Tasks = v2Tasks.reduce((acc, task) => {
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
      
      {/* Workflow Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-max">
        <button
          onClick={() => setActiveTab("v1")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "v1" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          V1 (Legacy PDF)
        </button>
        <button
          onClick={() => setActiveTab("v2")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "v2" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          V2 (2-Project Workflow)
        </button>
      </div>

      {activeTab === "v1" && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus size={18} /> Add New Template (V1)
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
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Task Document (PDF) *</label>
                <input
                  id="taskPdfUpload"
                  required
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setNewTask({ ...newTask, pdf: e.target.files[0] })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Brief description of the task"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-500/20"
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
                        <a href={task.pdfUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-blue-600 hover:text-blue-700 text-xs font-bold underline">
                          View Task Document
                        </a>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "v2" && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm border-l-4 border-l-indigo-500">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-indigo-600" /> Add New Template (V2)
            </h3>
            <form onSubmit={handleCreateV2Task} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Domain *</label>
                  <select
                    required
                    value={newV2Task.domain}
                    onChange={(e) => setNewV2Task({ ...newV2Task, domain: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    value={newV2Task.monthNumber}
                    onChange={(e) => setNewV2Task({ ...newV2Task, monthNumber: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>Month {num}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project 1 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-500" /> Project 1
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Project Name *</label>
                    <input type="text" required value={newV2Task.p1Name} onChange={e => setNewV2Task({...newV2Task, p1Name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="e.g. Portfolio Website" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Deadline</label>
                      <input type="text" value={newV2Task.p1Deadline} onChange={e => setNewV2Task({...newV2Task, p1Deadline: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="e.g. 15 Days" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Repository Link</label>
                    <input type="text" value={newV2Task.p1Repo} onChange={e => setNewV2Task({...newV2Task, p1Repo: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="e.g. https://github.com/..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Resources Link</label>
                    <input type="text" value={newV2Task.p1Resources} onChange={e => setNewV2Task({...newV2Task, p1Resources: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="e.g. Drive Link" />
                  </div>
                </div>

                {/* Project 2 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-500" /> Project 2
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Project Name *</label>
                    <input type="text" required value={newV2Task.p2Name} onChange={e => setNewV2Task({...newV2Task, p2Name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="e.g. E-Commerce App" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Deadline</label>
                      <input type="text" value={newV2Task.p2Deadline} onChange={e => setNewV2Task({...newV2Task, p2Deadline: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="e.g. 15 Days" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Repository Link</label>
                    <input type="text" value={newV2Task.p2Repo} onChange={e => setNewV2Task({...newV2Task, p2Repo: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="e.g. https://github.com/..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Resources Link</label>
                    <input type="text" value={newV2Task.p2Resources} onChange={e => setNewV2Task({...newV2Task, p2Resources: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder="e.g. Drive Link" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
                >
                  Save V2 Template
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            {v2Loading ? (
              <p className="text-center text-slate-500">Loading V2 templates...</p>
            ) : Object.keys(groupedV2Tasks).length === 0 ? (
              <div className="text-center bg-white border border-slate-200 border-dashed rounded-2xl p-8">
                <p className="text-slate-500">No V2 task templates defined yet.</p>
              </div>
            ) : (
              Object.entries(groupedV2Tasks).map(([domain, domainTasks]) => (
                <div key={domain} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm border-l-4 border-l-indigo-500">
                  <h3 className="font-bold text-slate-800 text-lg mb-4">{domain}</h3>
                  <div className="space-y-4">
                    {domainTasks.map(task => (
                      <div key={task._id} className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 group">
                        <button 
                          onClick={() => handleDeleteV2Task(task._id)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded mb-3">
                          Month {task.monthNumber}
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {task.projects && task.projects.map((proj, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 text-sm">
                              <p className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                                <Layers size={14} className="text-indigo-500" />
                                Project {proj.projectNumber}: {proj.projectName}
                              </p>
                              <div className="space-y-1 text-xs text-slate-600">
                                <p><span className="font-semibold">Deadline:</span> {proj.deadline}</p>
                                {proj.repository && <p><span className="font-semibold">Repo:</span> <a href={proj.repository} className="text-blue-600 underline" target="_blank" rel="noreferrer">Link</a></p>}
                                {proj.resources && <p><span className="font-semibold">Resources:</span> <a href={proj.resources} className="text-blue-600 underline" target="_blank" rel="noreferrer">Link</a></p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NormalTasksAdmin;
