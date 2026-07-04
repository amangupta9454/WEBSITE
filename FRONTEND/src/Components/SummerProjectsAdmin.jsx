import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, Github, BookOpen, Link as LinkIcon, CheckCircle, XCircle, ExternalLink, Users, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

const SummerProjectsAdmin = ({ applications }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Manage Projects
  const [newProject, setNewProject] = useState({ domain: "", name: "", description: "", dueDate: "", pdf: null });
  const [expandedStudent, setExpandedStudent] = useState(null);
  
  // Extract unique domains from applications and add common fallbacks
  const baseDomains = [
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "C Programming",
    "Python Development",
    "Artificial Intelligence",
    "Figma or UI/UX",
    "Data Science",
    "Machine Learning",
    "App Development",
    "Marketing"
  ];
  const dynamicDomains = applications ? [...new Set(applications.map(app => app.domain).filter(Boolean))] : [];
  const domains = [...new Set([...baseDomains, ...dynamicDomains])].sort();

  // State for Track Repositories
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [repoLinks, setRepoLinks] = useState({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/summer-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
    } catch (err) {
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("domain", newProject.domain);
      formData.append("name", newProject.name);
      formData.append("description", newProject.description);
      formData.append("dueDate", newProject.dueDate);
      if (newProject.pdf) {
        formData.append("pdf", newProject.pdf);
      }

      const uploadToast = toast.loading("Creating project and uploading file...");
      
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/summer-projects`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      
      toast.dismiss(uploadToast);
      toast.success("Project created successfully");
      setNewProject({ domain: "", name: "", description: "", dueDate: "", pdf: null });
      fetchProjects();
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to create project");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/summer-projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Project deleted successfully");
      if (selectedProject === id) setSelectedProject("");
      fetchProjects();
    } catch (err) {
      toast.error("Failed to delete project");
    }
  };

  const handleUpdateRepo = async (applicationId, projectId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const repoLink = repoLinks[`${applicationId}-${projectId}`];
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/update-assigned-repo`, 
        { applicationId, projectId, repoLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Repository linked successfully");
    } catch (err) {
      toast.error("Failed to link repository");
    }
  };

  // Review State
  const [reviewFeedback, setReviewFeedback] = useState({});

  const handleReviewSubmit = async (applicationId, projectId, status) => {
    try {
      const feedback = reviewFeedback[`${applicationId}-${projectId}`] || "";
      if (status === "Changes Requested" && !feedback.trim()) {
        toast.error("Feedback is required when requesting changes.");
        return;
      }
      const token = localStorage.getItem("adminToken");
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/review-summer-project`, 
        { applicationId, projectId, reviewStatus: status, feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Project ${status} successfully.`);
      if (refreshApplications) refreshApplications();
    } catch (err) {
      toast.error("Failed to update project review");
    }
  };

  // Get Summer Interns for selected domain
  const getDomainInterns = () => {
    return applications.filter(app => 
      (app.internshipType === "Summer/Winter Intern" || parseInt(String(app.duration || "").match(/\d+/)?.[0] || "1", 10) > 1) 
      && app.domain === selectedDomain
    );
  };

  const filteredProjects = projects.filter(p => p.domain === selectedDomain);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Manage Projects Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="text-amber-600" /> Manage Project Templates
        </h2>
        
        <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Domain</label>
            <select 
              required
              value={newProject.domain}
              onChange={e => setNewProject({...newProject, domain: e.target.value})}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Select Domain</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Project Name</label>
            <input 
              required
              type="text"
              value={newProject.name}
              onChange={e => setNewProject({...newProject, name: e.target.value})}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="e.g. Portfolio Website"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <input 
              required
              type="text"
              value={newProject.description}
              onChange={e => setNewProject({...newProject, description: e.target.value})}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Brief description of the project"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
            <input 
              required
              type="date"
              value={newProject.dueDate}
              onChange={e => setNewProject({...newProject, dueDate: e.target.value})}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="md:col-span-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Project PDF Document (Optional)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setNewProject({...newProject, pdf: e.target.files[0]})}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
            </div>
            <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap h-[42px] w-full md:w-auto">
              <Plus size={16}/> Add Project
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative group hover:border-amber-300 transition-colors">
              <button 
                onClick={() => handleDeleteProject(project._id)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">{project.domain}</span>
              <h3 className="font-bold text-slate-800 mt-3">{project.name}</h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description}</p>
              {project.pdfUrl && (
                <a href={project.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                  <BookOpen size={14} /> View Document
                </a>
              )}
            </div>
          ))}
          {projects.length === 0 && !loading && (
            <p className="text-slate-500 text-sm col-span-full">No projects created yet.</p>
          )}
        </div>
      </div>

      {/* 2. Track Repositories Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Github className="text-slate-800" /> Track Student Repositories
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select 
            value={selectedDomain}
            onChange={e => { setSelectedDomain(e.target.value); setSelectedProject(""); }}
            className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="">Select Domain</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          
          <select 
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            disabled={!selectedDomain}
            className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px] disabled:opacity-50"
          >
            <option value="">Select Project</option>
            {filteredProjects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        {selectedDomain && selectedProject ? (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">GitHub Repository Link</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {getDomainInterns().length > 0 ? (
                  getDomainInterns().map(app => {
                    const assignedRepo = app.assignedRepos?.find(r => r.projectId === selectedProject);
                    const currentInput = repoLinks[`${app._id}-${selectedProject}`] !== undefined 
                      ? repoLinks[`${app._id}-${selectedProject}`] 
                      : (assignedRepo?.repoLink || "");
                    
                    const isLinked = !!assignedRepo?.repoLink;

                    return (
                      <tr key={app._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{app.studentId || '—'}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{app.name}</td>
                        <td className="px-6 py-4 text-slate-500">{app.email}</td>
                        <td className="px-6 py-4">
                          {isLinked ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 truncate max-w-[300px]">
                                {assignedRepo.repoLink}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 italic">Not added yet</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isLinked ? (
                            <a
                              href={assignedRepo.repoLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
                            >
                              <ExternalLink size={14}/> View Now
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 px-4 py-2">Pending</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                      No Summer/Winter interns found in this domain.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500">
            <BookOpen className="w-12 h-12 mb-3 text-slate-300"/>
            <p>Select a domain and project to track student repositories</p>
          </div>
        )}
      </div>

      {/* 3. Student Progress Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Users className="text-blue-600" /> Student Progress Overview
        </h2>
        
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Domain</th>
                <th className="px-6 py-4 text-center">Projects Assigned</th>
                <th className="px-6 py-4 text-center">Projects Submitted</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {applications
                ?.filter(app => app.internshipType === 'Summer/Winter Intern')
                .map(app => {
                  const domainProjects = projects.filter(p => p.domain === app.domain);
                  const assignedCount = domainProjects.length;
                  const submittedCount = app.assignedRepos?.filter(r => r.isFinalSubmitted).length || 0;
                  const isExpanded = expandedStudent === app._id;

                  return (
                    <React.Fragment key={app._id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{app.studentId || '—'}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{app.name}</td>
                        <td className="px-6 py-4 text-slate-500">{app.email}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">{app.domain}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{assignedCount}</td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-600">{submittedCount}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setExpandedStudent(isExpanded ? null : app._id)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {isExpanded ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" className="p-0 border-b-2 border-slate-200">
                            <div className="bg-slate-50 p-6 shadow-inner">
                              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <BookOpen size={16} className="text-slate-500" />
                                Project Submissions for {app.name}
                              </h4>
                              {domainProjects.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {domainProjects.map(proj => {
                                    const repo = app.assignedRepos?.find(r => r.projectId === proj._id);
                                    return (
                                      <div key={proj._id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                                        <div>
                                          <div className="flex justify-between items-start">
                                            <h5 className="font-bold text-slate-800">{proj.name}</h5>
                                            <div className="flex items-center gap-2">
                                              {repo?.spAwarded > 0 && (
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 shadow-sm border border-blue-200">
                                                  {repo.spAwarded} SP
                                                </span>
                                              )}
                                              {repo?.reviewStatus && (
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border ${repo.reviewStatus === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : repo.reviewStatus === 'Changes Requested' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                  {repo.reviewStatus}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{proj.description}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                          {repo?.repoLink ? (
                                            <div className="flex items-center gap-2">
                                              <a
                                                href={repo.repoLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                              >
                                                <Github size={14} /> View Code
                                              </a>
                                              {!repo.isFinalSubmitted && (
                                                <span className="text-xs font-medium text-amber-600 italic bg-amber-50 px-2 py-1 rounded-md">Draft Link</span>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-xs font-medium text-slate-400 italic bg-slate-100 px-3 py-1.5 rounded-lg">Not Linked Yet</span>
                                          )}
                                          {repo?.isFinalSubmitted && <CheckCircle size={16} className="text-emerald-500" title="Final Submitted" />}
                                        </div>
                                        {repo?.repoLink && repo?.isFinalSubmitted && (
                                          <div className="mt-3 pt-3 border-t border-slate-100">
                                            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Feedback</label>
                                            <textarea 
                                              value={reviewFeedback[`${app._id}-${proj._id}`] !== undefined ? reviewFeedback[`${app._id}-${proj._id}`] : (repo.feedback || "")}
                                              onChange={(e) => setReviewFeedback({...reviewFeedback, [`${app._id}-${proj._id}`]: e.target.value})}
                                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2 min-h-[60px]"
                                              placeholder="Enter feedback to help the student improve..."
                                            />
                                            <div className="flex gap-2">
                                              <button 
                                                onClick={() => handleReviewSubmit(app._id, proj._id, "Accepted")}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-md transition-colors"
                                              >
                                                Accept
                                              </button>
                                              <button 
                                                onClick={() => handleReviewSubmit(app._id, proj._id, "Changes Requested")}
                                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold py-1.5 rounded-md transition-colors"
                                              >
                                                Request Changes
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500 italic">No projects assigned in this domain yet.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              {applications?.filter(app => app.internshipType === 'Summer/Winter Intern').length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    No Summer/Winter interns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummerProjectsAdmin;
