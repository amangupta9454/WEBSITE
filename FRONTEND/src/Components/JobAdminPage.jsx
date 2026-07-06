import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { RefreshCw, Edit, Trash2, Eye, EyeOff, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

const JobAdminPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [jobPortalEnabled, setJobPortalEnabled] = useState(true);
  const [editingJob, setEditingJob] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    applyUrl: '',
    description: '',
    isRemote: false
  });

  useEffect(() => {
    fetchGlobalSetting();
    fetchJobs();
  }, []);

  const fetchGlobalSetting = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/job-portal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobPortalEnabled(res.data.jobPortalEnabled);
    } catch (err) {
      console.error('Failed to fetch job portal setting', err);
    }
  };

  const toggleGlobalSetting = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/job-portal`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobPortalEnabled(res.data.jobPortalEnabled);
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to toggle Job Portal feature');
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Pass admin=true to bypass isActive filter and get all jobs
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/jobs?admin=true&limit=100`);
      if (res.data.success) {
        setJobs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/sync`);
      if (res.data.success) {
        toast.success(`Sync successful. Added ${res.data.count} new jobs!`);
        fetchJobs();
      }
    } catch (err) {
      toast.error('Failed to sync jobs');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleJob = async (id) => {
    try {
      const res = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/${id}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        setJobs(jobs.map(job => job._id === id ? { ...job, isActive: !job.isActive } : job));
      }
    } catch (err) {
      toast.error('Failed to toggle job status');
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job permanently?')) return;
    
    try {
      const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/${id}`);
      if (res.data.success) {
        toast.success('Job deleted successfully');
        setJobs(jobs.filter(job => job._id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setEditForm({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      salary: job.salary || '',
      applyUrl: job.applyUrl || '',
      description: job.description || '',
      isRemote: job.isRemote || false
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/${editingJob._id}`, editForm);
      if (res.data.success) {
        toast.success('Job updated successfully');
        setJobs(jobs.map(job => job._id === editingJob._id ? res.data.job : job));
        setEditingJob(null);
      }
    } catch (err) {
      toast.error('Failed to update job');
    }
  };

  return (
    <div className="space-y-6">
      {/* Feature Toggle Banner */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 rounded-2xl border gap-4 ${jobPortalEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <div>
          <p className={`font-black text-base ${jobPortalEnabled ? 'text-emerald-800' : 'text-red-800'}`}>
            Job Portal Feature is {jobPortalEnabled ? '✅ Active' : '🔴 Disabled'}
          </p>
          <p className={`text-xs font-medium mt-0.5 ${jobPortalEnabled ? 'text-emerald-600' : 'text-red-500'}`}>
            {jobPortalEnabled ? 'Students can access the Job Portal from the homepage.' : 'The Job Portal section is hidden from the homepage.'}
          </p>
        </div>
        <button
          onClick={toggleGlobalSetting}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${jobPortalEnabled ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'}`}
        >
          {jobPortalEnabled ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
          {jobPortalEnabled ? 'Disable Feature' : 'Enable Feature'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Job Portal Management</h2>
            <p className="text-slate-500 text-sm mt-1">Manage external jobs and portal settings</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync Jobs
            </button>
          </div>
        </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-4 font-semibold text-slate-700 text-sm">Job Title & Company</th>
                <th className="p-4 font-semibold text-slate-700 text-sm">Location</th>
                <th className="p-4 font-semibold text-slate-700 text-sm">Source</th>
                <th className="p-4 font-semibold text-slate-700 text-sm">Status</th>
                <th className="p-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No jobs found. Try syncing from API.
                  </td>
                </tr>
              ) : (
                jobs.map(job => (
                  <tr key={job._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{job.title}</div>
                      <div className="text-sm text-slate-500">{job.company}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {job.location} {job.isRemote && <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">Remote</span>}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md">{job.source || 'Unknown'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {job.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleJob(job._id)}
                          className={`p-2 rounded-lg transition-colors ${job.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={job.isActive ? 'Hide Job' : 'Show Job'}
                        >
                          {job.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Job"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900">Edit Job</h3>
              <button onClick={() => setEditingJob(null)} className="text-slate-400 hover:text-slate-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary (Optional)</label>
                  <input
                    type="text"
                    value={editForm.salary}
                    onChange={(e) => setEditForm({...editForm, salary: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apply URL</label>
                  <input
                    type="url"
                    value={editForm.applyUrl}
                    onChange={(e) => setEditForm({...editForm, applyUrl: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRemote"
                    checked={editForm.isRemote}
                    onChange={(e) => setEditForm({...editForm, isRemote: e.target.checked})}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isRemote" className="text-sm font-medium text-slate-700">This is a Remote Job</label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default JobAdminPage;
