import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { RefreshCw, Edit, Trash2, Eye, EyeOff, Loader2, ToggleLeft, ToggleRight, Plus, Sparkles, ExternalLink, Info, Activity, Globe, ChevronDown, ChevronUp, Clock, X, Shield } from 'lucide-react';

const JobAdminPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [jobPortalEnabled, setJobPortalEnabled] = useState(true);
  const [jobPortalFreeMode, setJobPortalFreeMode] = useState(true);
  const [jobPortalPremiumPrice, setJobPortalPremiumPrice] = useState(199);
  const [priceInput, setPriceInput] = useState('199');
  const [freeModeExpires, setFreeModeExpires] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [interactionType, setInteractionType] = useState('applied');
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [interactionSearch, setInteractionSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [expandedIps, setExpandedIps] = useState({});
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [creatingJob, setCreatingJob] = useState(false);

  const groupedAuditLogs = useMemo(() => {
    const map = {};
    auditLogs.forEach(log => {
      const ip = log.ip || 'Unknown IP';
      if (!map[ip]) {
        map[ip] = {
          ip,
          emails: new Set(),
          actionsCount: 0,
          latestActionAt: log.createdAt,
          actionCounts: {},
          logs: []
        };
      }
      map[ip].actionsCount++;
      if (log.email && log.email !== 'Anonymous / Guest') {
        map[ip].emails.add(log.email);
      } else if (map[ip].emails.size === 0) {
        map[ip].emails.add(log.email || 'Anonymous / Guest');
      }
      map[ip].actionCounts[log.action] = (map[ip].actionCounts[log.action] || 0) + 1;
      map[ip].logs.push(log);
      if (new Date(log.createdAt) > new Date(map[ip].latestActionAt)) {
        map[ip].latestActionAt = log.createdAt;
      }
    });
    return Object.values(map).sort((a, b) => new Date(b.latestActionAt) - new Date(a.latestActionAt));
  }, [auditLogs]);

  // Student Plans management state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [modifyingUser, setModifyingUser] = useState(null);
  const [planForm, setPlanForm] = useState({ plan: 'basic', durationDays: 30 });
  const [updatingPlan, setUpdatingPlan] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    jobType: 'Full-time',
    applyUrl: '',
    applyEmail: '',
    description: '',
    planType: 'Basic',
    isRemote: false
  });

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    jobType: 'Full-time',
    applyUrl: '',
    applyEmail: '',
    description: '',
    planType: 'Basic',
    isRemote: false
  });

  useEffect(() => {
    fetchGlobalSetting();
    fetchJobs();
    fetchInteractions('applied');
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStudents(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students list:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleUpdateUserPlan = async (e) => {
    e.preventDefault();
    if (!modifyingUser) return;
    setUpdatingPlan(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/admin/user-plan/${modifyingUser._id}`, {
        plan: planForm.plan,
        durationDays: Number(planForm.durationDays) || 30
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Plan updated successfully!');
        setModifyingUser(null);
        fetchStudents();
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
      toast.error(error.response?.data?.message || 'Error modifying plan');
    } finally {
      setUpdatingPlan(false);
    }
  };

  const fetchInteractions = async (type) => {
    setLoadingInteractions(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/admin/interactions?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setInteractions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch student interactions', err);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAuditLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const handleTabChange = (type) => {
    setInteractionType(type);
    if (type === 'audit') {
      fetchAuditLogs();
    } else {
      fetchInteractions(type);
    }
  };

  const fetchGlobalSetting = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/job-portal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobPortalEnabled(res.data.jobPortalEnabled);
      setJobPortalFreeMode(res.data.jobPortalFreeMode);
      setFreeModeExpires(res.data.jobPortalFreeModeExpires || null);
      setJobPortalPremiumPrice(res.data.jobPortalPremiumPrice || 199);
      setPriceInput(String(res.data.jobPortalPremiumPrice || 199));
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

  const toggleFreeModeSetting = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/job-portal/free-mode`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setJobPortalFreeMode(res.data.jobPortalFreeMode);
        setFreeModeExpires(res.data.jobPortalFreeModeExpires || null);
        toast.success(res.data.message, { autoClose: 6000 });
      }
    } catch (err) {
      toast.error('Failed to toggle Free Promo Mode');
    }
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/job-portal/price`, {
        price: priceInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setJobPortalPremiumPrice(res.data.jobPortalPremiumPrice);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update token price');
    }
  };

  const handleExcelUploadSubmit = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      toast.error('Please select an Excel (.xlsx or .csv) file first');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', excelFile);

    try {
      setUploadingExcel(true);
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/import-excel`, formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowExcelModal(false);
        setExcelFile(null);
        fetchJobs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload spreadsheet');
    } finally {
      setUploadingExcel(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/jobs?admin=true&limit=200`);
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
      jobType: job.jobType || 'Full-time',
      applyUrl: job.applyUrl || '',
      applyEmail: job.applyEmail || '',
      description: job.description || '',
      planType: job.planType || 'Basic',
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/create`, createForm);
      if (res.data.success) {
        toast.success('🎉 Job opportunity uploaded successfully!');
        setCreatingJob(false);
        setCreateForm({
          title: '',
          company: '',
          location: '',
          salary: '',
          jobType: 'Full-time',
          applyUrl: '',
          applyEmail: '',
          description: '',
          planType: 'Basic',
          isRemote: false
        });
        fetchJobs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job opportunity');
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

      {/* Subscription & Pricing Configuration Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Promo Mode Card */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all shadow-sm ${jobPortalFreeMode ? 'bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-amber-500/5 border-2 border-amber-400' : 'bg-slate-50 border-slate-200'}`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500 fill-current" />
              <h3 className="font-black text-slate-900 text-lg">1st Month Free Promo Mode</h3>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm font-semibold mb-3">
              {jobPortalFreeMode 
                ? '🎉 ACTIVE: All students get FREE VIP access without spending tokens!' 
                : '🔒 INACTIVE: Premium jobs are locked behind Token subscriptions.'}
            </p>
            {jobPortalFreeMode && freeModeExpires && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-200/60 border border-amber-400 text-amber-950 text-xs font-black mb-4">
                <span>🗓️ Valid until {new Date(freeModeExpires).toLocaleDateString()} (Auto-reverts to Paid Mode in 30 days)</span>
              </div>
            )}
            {jobPortalFreeMode && !freeModeExpires && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-200/60 border border-amber-400 text-amber-950 text-xs font-black mb-4">
                <span>🗓️ Active Promo (Re-toggle ON to start 30-day auto-expiry & +30 days subscriber extension)</span>
              </div>
            )}
          </div>
          <button
            onClick={toggleFreeModeSetting}
            className={`self-start flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md ${jobPortalFreeMode ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
          >
            {jobPortalFreeMode ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {jobPortalFreeMode ? 'Turn OFF Free Promo (Switch to Paid Mode)' : 'Turn ON Free Promo (Make All Jobs Free)'}
          </button>
        </div>

        {/* Configure 3-Month Subscription Price Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-lg mb-1 flex items-center gap-2">
              <span>🪙 3-Month Premium Plan Token Price</span>
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mb-4">
              Set the exact number of tokens required for students to purchase a 90-day VIP subscription (currently <b>{jobPortalPremiumPrice} Tokens</b>).
            </p>
          </div>
          <form onSubmit={handleUpdatePrice} className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                min="1"
                required
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-extrabold text-slate-900 focus:outline-none focus:border-indigo-600 transition-all text-sm"
                placeholder="Tokens (e.g. 199)"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Tokens</span>
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              Update Price
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Job Portal Management</h2>
            <p className="text-slate-500 text-sm mt-1">Manage opportunities, set Basic/Premium tiers, and upload jobs</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowExcelModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-indigo-500/20"
            >
              📊 Upload Excel / CSV Jobs
            </button>
            <button
              onClick={() => setCreatingJob(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Create Job Opportunity
            </button>
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync API Jobs
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
                <th className="p-4 font-semibold text-slate-700 text-sm">Plan Tier</th>
                <th className="p-4 font-semibold text-slate-700 text-sm">Location</th>
                <th className="p-4 font-semibold text-slate-700 text-sm">Source</th>
                <th className="p-4 font-semibold text-slate-700 text-sm">Status</th>
                <th className="p-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No jobs found. Click "Create Job Opportunity" or sync from API.
                  </td>
                </tr>
              ) : (
                jobs.map(job => (
                  <tr key={job._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
                        {job.title}
                        {job.createdAt && (new Date() - new Date(job.createdAt)) < 24 * 60 * 60 * 1000 && (
                          <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">New</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">{job.company}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${job.planType === 'Premium' ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                        {job.planType === 'Premium' ? '👑 Premium (199 Plan)' : '🟢 Basic (Free)'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {job.location} {job.isRemote && <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">Remote</span>}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-600 rounded-md text-xs">{job.source || 'Admin Portal'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${job.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {job.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedJobDetails(job)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Job Info & Complete Details"
                        >
                          <Info className="w-4 h-4 stroke-[2.5]" />
                        </button>
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

      {/* Student Activity & Interaction Insights Dashboard */}
      <div className="mt-12 pt-12 border-t-2 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
              <span>👥 Student Activity & Interaction Insights</span>
            </h2>
            <p className="text-slate-600 font-semibold text-sm sm:text-base mt-1">
              Live tracking of who applied/clicked apply on opportunities and who bookmarked roles.
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex bg-slate-200 p-1 rounded-xl font-black text-xs sm:text-sm shadow-inner shrink-0 flex-wrap">
              <button
                onClick={() => handleTabChange('applied')}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-all ${interactionType === 'applied' ? 'bg-white text-emerald-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Applied
              </button>
              <button
                onClick={() => handleTabChange('saved')}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-all ${interactionType === 'saved' ? 'bg-white text-indigo-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Saved
              </button>
              <button
                onClick={() => handleTabChange('audit')}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${interactionType === 'audit' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow' : 'text-purple-700 hover:text-purple-900 font-extrabold'}`}
              >
                <Activity className="w-4 h-4 animate-pulse" />
                <span>Audit Logs (IP Activity)</span>
              </button>
            </div>
            
            <button
              onClick={() => interactionType === 'audit' ? fetchAuditLogs() : fetchInteractions(interactionType)}
              className="p-2.5 sm:p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold flex items-center justify-center shrink-0 shadow-sm"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loadingInteractions ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Search Bar for Interactions */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search activity by student name, email, phone, company, or job title..."
            value={interactionSearch}
            onChange={(e) => setInteractionSearch(e.target.value)}
            className="w-full sm:max-w-md px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        {/* Activity or Audit Log View */}
        {interactionType === 'audit' ? (
          <div className="space-y-4">
            {loadingAuditLogs ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
                <p className="text-slate-600 font-extrabold text-base">Aggregating unique IP visits and portal interactions...</p>
              </div>
            ) : groupedAuditLogs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm text-slate-500 font-extrabold text-base">
                🌐 No visitor activity recorded yet on the Job Portal.
              </div>
            ) : (
              groupedAuditLogs
                .filter(group => {
                  if (!interactionSearch) return true;
                  const q = interactionSearch.toLowerCase();
                  const ipMatch = group.ip.toLowerCase().includes(q);
                  const emailMatch = Array.from(group.emails).some(e => e.toLowerCase().includes(q));
                  const jobMatch = group.logs.some(l => (l.jobTitle || '').toLowerCase().includes(q) || (l.company || '').toLowerCase().includes(q) || (l.action || '').toLowerCase().includes(q));
                  return ipMatch || emailMatch || jobMatch;
                })
                .map((group) => {
                  const isExpanded = expandedIps[group.ip];
                  return (
                    <div key={group.ip} className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden transition-all hover:border-purple-300">
                      {/* Expandable Header Card */}
                      <div 
                        onClick={() => setExpandedIps(prev => ({ ...prev, [group.ip]: !prev[group.ip] }))}
                        className="p-5 bg-gradient-to-r from-slate-50 via-purple-50/20 to-slate-50 hover:bg-slate-100/70 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
                            <Globe className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight">{group.ip}</span>
                              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-black rounded-full border border-purple-200 uppercase tracking-wider">
                                Unique Visitor IP
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                              <span className="text-slate-500">📧 Associated Email(s):</span>
                              {Array.from(group.emails).map((email, idx) => (
                                <span key={idx} className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${email === 'Anonymous / Guest' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
                                  {email}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Count Badges */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:justify-end">
                          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs border border-indigo-100 shadow-2xs">
                            ⚡ {group.actionsCount} Total Actions
                          </span>
                          {Object.entries(group.actionCounts).slice(0, 3).map(([act, count]) => (
                            <span key={act} className="px-2.5 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-extrabold border border-slate-200">
                              {count}x {act}
                            </span>
                          ))}
                          <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs ml-auto lg:ml-0">
                            {isExpanded ? <ChevronUp className="w-5 h-5 stroke-[3]" /> : <ChevronDown className="w-5 h-5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Activity Timeline */}
                      {isExpanded && (
                        <div className="p-5 sm:p-6 border-t-2 border-slate-100 bg-white">
                          <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span>Detailed Activity Timeline for IP: {group.ip}</span>
                            <span>Latest First ↓</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {group.logs.map((log) => (
                              <div key={log._id || Math.random()} className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-xl transition-colors">
                                <div className="flex items-start sm:items-center gap-3">
                                  <span className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide shrink-0 border ${
                                    log.action.includes('Apply') ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                    log.action.includes('Save') ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                                    'bg-purple-50 text-purple-800 border-purple-200'
                                  }`}>
                                    {log.action}
                                  </span>
                                  <div>
                                    <div className="font-extrabold text-slate-900 text-sm">
                                      {log.jobTitle ? `${log.jobTitle} ${log.company ? `— ${log.company}` : ''}` : 'General Job Portal Navigation / Browsing'}
                                    </div>
                                    <div className="text-xs text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                                      <span>Visitor Email: <strong className="text-slate-800">{log.email || 'Anonymous / Guest'}</strong></span>
                                      {log.details && <span>• {log.details}</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1.5 bg-slate-100/80 px-3 py-1 rounded-lg">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(log.createdAt).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        ) : (
        /* Activity Table for Applied / Saved */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Student Info</th>
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Contact & Phone</th>
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Job Opportunity</th>
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Plan Tier</th>
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Action Type</th>
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-sm text-slate-700">
              {loadingInteractions ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading student interaction history...
                  </td>
                </tr>
              ) : interactions.filter(rec => {
                  if (!interactionSearch) return true;
                  const q = interactionSearch.toLowerCase();
                  const uName = rec.user?.name?.toLowerCase() || '';
                  const uEmail = rec.user?.email?.toLowerCase() || '';
                  const uPhone = rec.user?.mobile?.toString() || rec.user?.phone?.toString() || '';
                  const jTitle = rec.job?.title?.toLowerCase() || '';
                  const jComp = rec.job?.company?.toLowerCase() || '';
                  return uName.includes(q) || uEmail.includes(q) || uPhone.includes(q) || jTitle.includes(q) || jComp.includes(q);
                }).length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No matching student interactions found for this view.
                  </td>
                </tr>
              ) : (
                interactions
                  .filter(rec => {
                    if (!interactionSearch) return true;
                    const q = interactionSearch.toLowerCase();
                    const uName = rec.user?.name?.toLowerCase() || '';
                    const uEmail = rec.user?.email?.toLowerCase() || '';
                    const uPhone = rec.user?.mobile?.toString() || rec.user?.phone?.toString() || '';
                    const jTitle = rec.job?.title?.toLowerCase() || '';
                    const jComp = rec.job?.company?.toLowerCase() || '';
                    return uName.includes(q) || uEmail.includes(q) || uPhone.includes(q) || jTitle.includes(q) || jComp.includes(q);
                  })
                  .map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-black text-slate-900">{item.user?.name || 'Unknown Student'}</div>
                        <div className="text-xs text-slate-500 font-medium">{item.user?.email || 'No email'}</div>
                      </td>
                      <td className="py-4 px-6 text-xs font-bold text-slate-600">
                        {item.user?.mobile || item.user?.phone || item.user?.phoneNo || 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{item.job?.title || 'Job Unavailable'}</span>
                          {item.job && (
                            <a 
                              href={item.job?._id ? `${window.location.origin}/jobs?jobId=${item.job._id}` : '/jobs'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded text-[11px] font-black border border-indigo-200 shrink-0 transition-colors"
                              title="Open Job on Our Platform Portal"
                            >
                              <span>Open Portal URL</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">{item.job?.company} ({item.job?.location})</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-black ${
                          item.job?.planType === 'Premium' 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {item.job?.planType === 'Premium' ? '👑 Premium' : '🟢 Basic'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                          interactionType === 'applied' 
                            ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}>
                          {interactionType === 'applied' ? 'Applied / Clicked URL' : 'Saved Job'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 font-bold">
                        {item.createdAt || item.appliedAt || item.savedAt ? new Date(item.createdAt || item.appliedAt || item.savedAt).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Student Plans & Subscriptions Management Dashboard */}
      <div className="mt-14 pt-12 border-t-2 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
              <span>🎓 Student Plans & Membership Tier Management</span>
            </h2>
            <p className="text-slate-600 font-semibold text-sm sm:text-base mt-1">
              Inspect student subscriptions, check wallet balances, and modify membership plans with custom validity durations.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex bg-slate-200 p-1 rounded-xl font-black text-xs sm:text-sm shadow-inner shrink-0">
              <button
                onClick={() => setPlanFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${planFilter === 'all' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All ({students.length})
              </button>
              <button
                onClick={() => setPlanFilter('basic')}
                className={`px-3 py-1.5 rounded-lg transition-all ${planFilter === 'basic' ? 'bg-white text-emerald-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                🟢 Basic
              </button>
              <button
                onClick={() => setPlanFilter('premium')}
                className={`px-3 py-1.5 rounded-lg transition-all ${planFilter === 'premium' ? 'bg-white text-amber-900 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                👑 Premium
              </button>
            </div>
            
            <button
              onClick={fetchStudents}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold flex items-center justify-center shrink-0 shadow-sm"
              title="Refresh Students"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStudents ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search candidate by name, email, or phone number..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="w-full sm:max-w-md px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Candidate Name</th>
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Contact & Phone</th>
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Token Balance</th>
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Current Tier</th>
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider">Plan Validity</th>
                <th className="py-4 px-6 font-black text-xs text-slate-700 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-sm text-slate-700">
              {loadingStudents ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading student membership tiers...
                  </td>
                </tr>
              ) : students.filter(s => {
                if (planFilter === 'basic' && s.isPremium) return false;
                if (planFilter === 'premium' && !s.isPremium) return false;
                if (!studentSearch) return true;
                const q = studentSearch.toLowerCase();
                return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.phone || '').toString().includes(q);
              }).length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No matching candidates found.
                  </td>
                </tr>
              ) : (
                students
                  .filter(s => {
                    if (planFilter === 'basic' && s.isPremium) return false;
                    if (planFilter === 'premium' && !s.isPremium) return false;
                    if (!studentSearch) return true;
                    const q = studentSearch.toLowerCase();
                    return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.phone || '').toString().includes(q);
                  })
                  .map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-black text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                      </td>
                      <td className="py-4 px-6 text-xs font-bold text-slate-600">
                        {user.phone}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-200 shadow-xs whitespace-nowrap">
                          🪙 {user.tokens}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {user.isPremium ? (
                          <span className="inline-block px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 shadow-xs whitespace-nowrap">
                            👑 Premium
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                            🟢 Basic
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs font-bold text-slate-600">
                        {user.isPremium && user.expiresAt ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            🗓️ {new Date(user.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">Free Lifeway</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setModifyingUser(user);
                            setPlanForm({
                              plan: user.isPremium ? 'premium' : 'basic',
                              durationDays: 30
                            });
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all shadow-sm hover:scale-105 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Modify Plan
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modify User Plan Modal */}
      {modifyingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <span>⚙️ Modify Candidate Subscription</span>
              </h3>
              <button onClick={() => setModifyingUser(null)} className="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
            </div>
            <form onSubmit={handleUpdateUserPlan} className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-1">
                <div><span className="font-bold text-slate-500">Candidate:</span> <span className="font-black text-slate-900">{modifyingUser.name} ({modifyingUser.email})</span></div>
                <div><span className="font-bold text-slate-500">Current Balance:</span> <span className="font-black text-indigo-600">🪙 {modifyingUser.tokens} Tokens</span></div>
                <div><span className="font-bold text-slate-500">Current Plan:</span> <span className="font-black text-slate-800">{modifyingUser.isPremium ? '👑 Premium VIP' : '🟢 Basic Free'}</span></div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Select Target Plan Tier</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlanForm({ ...planForm, plan: 'basic' })}
                    className={`py-3 px-4 rounded-2xl font-black text-xs border-2 transition-all flex flex-col items-center gap-1 ${
                      planForm.plan === 'basic' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">🟢</span>
                    <span>Basic (Free Plan)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanForm({ ...planForm, plan: 'premium' })}
                    className={`py-3 px-4 rounded-2xl font-black text-xs border-2 transition-all flex flex-col items-center gap-1 ${
                      planForm.plan === 'premium' ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">👑</span>
                    <span>Premium (VIP Plan)</span>
                  </button>
                </div>
              </div>

              {planForm.plan === 'premium' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Set Plan Duration (In Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={planForm.durationDays}
                    onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-900 text-base focus:border-indigo-600 outline-none text-center shadow-inner"
                    placeholder="Enter days e.g. 30, 90..."
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {[30, 90, 180, 365].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setPlanForm({ ...planForm, durationDays: d })}
                        className={`py-1.5 px-2 rounded-xl text-xs font-black transition-colors ${
                          Number(planForm.durationDays) === d ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        +{d} Days
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModifyingUser(null)}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-extrabold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPlan}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {updatingPlan && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Subscription Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Job Opportunity Modal */}
      {creatingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="text-emerald-600 w-5 h-5" /> Create New Job Opportunity
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Publish either a free Basic role or an exclusive Premium opportunity.</p>
              </div>
              <button onClick={() => setCreatingJob(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full bg-slate-50">
                <span className="text-2xl font-bold leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Job Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Developer Intern"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Google or Tech Corp"
                    value={createForm.company}
                    onChange={(e) => setCreateForm({...createForm, company: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, Mumbai or Remote"
                    value={createForm.location}
                    onChange={(e) => setCreateForm({...createForm, location: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Plan Tier *</label>
                  <select
                    value={createForm.planType}
                    onChange={(e) => setCreateForm({...createForm, planType: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 font-black text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Basic">🟢 Basic (Free for all users - Daily 2 Jobs)</option>
                    <option value="Premium">👑 Premium (Locked behind 199 Plan - Daily 10 Jobs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Apply URL (Link)</label>
                  <input
                    type="url"
                    placeholder="https://company.com/apply"
                    value={createForm.applyUrl}
                    onChange={(e) => setCreateForm({...createForm, applyUrl: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Recruiter Email (Mail)</label>
                  <input
                    type="email"
                    placeholder="recruiter@company.com"
                    value={createForm.applyEmail}
                    onChange={(e) => setCreateForm({...createForm, applyEmail: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 font-semibold">Note: Provide either Apply Link or Recruiter Email (or both).</span>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Salary / Stipend (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000/month or Best in Industry"
                    value={createForm.salary}
                    onChange={(e) => setCreateForm({...createForm, salary: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Employment Type *</label>
                  <select
                    value={createForm.jobType || 'Full-time'}
                    onChange={(e) => setCreateForm({...createForm, jobType: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Full-time">💼 Full-time</option>
                    <option value="Part-time">⏱️ Part-time</option>
                    <option value="Internship">🎓 Internship</option>
                    <option value="Contract">📝 Contract</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="createIsRemote"
                    checked={createForm.isRemote}
                    onChange={(e) => setCreateForm({...createForm, isRemote: e.target.checked})}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <label htmlFor="createIsRemote" className="text-sm font-bold text-slate-700 cursor-pointer">This is a Remote Job / WFH</label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Job Description (JD) & Requirements *</label>
                  <textarea
                    placeholder="Paste full job details here. This section will be copy-protected on student view so users cannot scrape or copy the content!"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                    rows={6}
                    className="w-full p-4 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreatingJob(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Publish Opportunity &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-slate-900">Edit Job Opportunity</h3>
              <button onClick={() => setEditingJob(null)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full bg-slate-50">
                <span className="text-2xl font-bold leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Job Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Plan Tier</label>
                  <select
                    value={editForm.planType}
                    onChange={(e) => setEditForm({...editForm, planType: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 font-black text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Basic">🟢 Basic (Free)</option>
                    <option value="Premium">👑 Premium (199 Tokens)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Apply URL (Link)</label>
                  <input
                    type="text"
                    value={editForm.applyUrl}
                    onChange={(e) => setEditForm({...editForm, applyUrl: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Recruiter Email (Mail)</label>
                  <input
                    type="email"
                    value={editForm.applyEmail}
                    onChange={(e) => setEditForm({...editForm, applyEmail: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Salary (Optional)</label>
                  <input
                    type="text"
                    value={editForm.salary}
                    onChange={(e) => setEditForm({...editForm, salary: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Employment Type *</label>
                  <select
                    value={editForm.jobType || 'Full-time'}
                    onChange={(e) => setEditForm({...editForm, jobType: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Full-time">💼 Full-time</option>
                    <option value="Part-time">⏱️ Part-time</option>
                    <option value="Internship">🎓 Internship</option>
                    <option value="Contract">📝 Contract</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="isRemoteEdit"
                    checked={editForm.isRemote}
                    onChange={(e) => setEditForm({...editForm, isRemote: e.target.checked})}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <label htmlFor="isRemoteEdit" className="text-sm font-bold text-slate-700 cursor-pointer">This is a Remote Job</label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={5}
                    className="w-full p-3 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-colors shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Bulk Upload Modal with Instructions */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>📊 Bulk Import Jobs via Excel or CSV</span>
                </h2>
                <p className="text-sm font-semibold text-slate-500 mt-1">
                  Easily list multiple vacancies in one go by uploading your spreadsheet.
                </p>
              </div>
              <button
                onClick={() => setShowExcelModal(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Formatting Guidelines & Instructions */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 mb-6 text-sm">
              <h3 className="font-black text-indigo-950 mb-2 text-base flex items-center gap-2">
                <span>📋 How to Format Your Excel / CSV Columns</span>
              </h3>
              <p className="text-indigo-900/80 mb-4 font-medium leading-relaxed">
                Create an Excel sheet (<strong>.xlsx</strong>) or <strong>.csv</strong> file with the column headers below in Row 1. The importer automatically detects column names (case-insensitive and ignores spacing).
              </p>
              
              <div className="overflow-x-auto bg-white rounded-xl border border-indigo-100 shadow-xs mb-4">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-indigo-50/50 border-b border-indigo-100 text-indigo-950 font-black">
                      <th className="p-3">Column Name</th>
                      <th className="p-3">Required?</th>
                      <th className="p-3">Accepted Values / Description</th>
                      <th className="p-3">Example Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="p-3 font-bold text-slate-900">title (or jobTitle)</td>
                      <td className="p-3 text-emerald-700 font-bold">✅ Yes</td>
                      <td className="p-3">The job or internship designation</td>
                      <td className="p-3 font-mono bg-slate-50">Frontend Developer</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">company</td>
                      <td className="p-3 text-emerald-700 font-bold">✅ Yes</td>
                      <td className="p-3">Name of the employer or startup</td>
                      <td className="p-3 font-mono bg-slate-50">Google India / Wipro</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">planType (or tier)</td>
                      <td className="p-3 text-slate-400">Optional</td>
                      <td className="p-3">Write <b>Premium</b> for VIP roles, or <b>Basic</b> for free daily opportunities. Defaults to Basic.</td>
                      <td className="p-3 font-mono bg-amber-50 text-amber-900 font-bold">Premium</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">location</td>
                      <td className="p-3 text-slate-400">Optional</td>
                      <td className="p-3">City or workplace location</td>
                      <td className="p-3 font-mono bg-slate-50">Bangalore / Remote</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">salary (or stipend)</td>
                      <td className="p-3 text-slate-400">Optional</td>
                      <td className="p-3">CTC or monthly stipend amount</td>
                      <td className="p-3 font-mono bg-slate-50">₹8 - 12 LPA</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">jobType (or employmentType)</td>
                      <td className="p-3 text-slate-400">Optional</td>
                      <td className="p-3">Specify <b>Full-time</b>, <b>Part-time</b>, <b>Internship</b>, or <b>Contract</b>. Defaults to Full-time.</td>
                      <td className="p-3 font-mono bg-indigo-50 text-indigo-900 font-bold">Internship</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">applyUrl (or applyLink)</td>
                      <td className="p-3 text-slate-400">Optional</td>
                      <td className="p-3">Official career apply URL (opened securely via click protection)</td>
                      <td className="p-3 font-mono bg-slate-50">https://careers.google.com/...</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">applyEmail</td>
                      <td className="p-3 text-slate-400">Optional</td>
                      <td className="p-3">Recruiter email for click-to-email application</td>
                      <td className="p-3 font-mono bg-slate-50">hr@company.com</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">description (or jd)</td>
                      <td className="p-3 text-slate-400">Optional</td>
                      <td className="p-3">Job responsibilities and qualifications</td>
                      <td className="p-3 font-mono bg-slate-50">Looking for React & Node expert...</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">isRemote</td>
                      <td className="p-3 text-slate-400">Optional</td>
                      <td className="p-3">Write <b>true</b> or <b>yes</b> if work-from-home</td>
                      <td className="p-3 font-mono bg-slate-50">true</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="text-indigo-950/80 font-bold bg-white/60 p-3 rounded-xl border border-indigo-100">
                💡 Tip: You can leave optional columns blank; the importer will apply intelligent defaults automatically!
              </div>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleExcelUploadSubmit} className="space-y-6">
              <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-indigo-50/20 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setExcelFile(e.target.files[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <div className="max-w-sm mx-auto pointer-events-none">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-black text-2xl shadow-lg shadow-indigo-500/25">
                    📑
                  </div>
                  <h4 className="text-base font-black text-slate-800 mb-1">
                    {excelFile ? `Selected: ${excelFile.name}` : 'Click or Drag & Drop your Excel/CSV file here'}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500">
                    Supports .XLSX and .CSV files format
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowExcelModal(false);
                    setExcelFile(null);
                  }}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingExcel || !excelFile}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 text-sm inline-flex items-center gap-2"
                >
                  {uploadingExcel ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing Spreadsheet...
                    </>
                  ) : (
                    <>
                      🚀 Upload & Process Spreadsheet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Info Details Modal */}
      {selectedJobDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 mb-6">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl font-black text-xl">
                  ℹ️
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedJobDetails.title}</h3>
                  <p className="text-sm font-semibold text-slate-500">{selectedJobDetails.company} • {selectedJobDetails.location}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedJobDetails(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-4 text-sm font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Plan Tier</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-black inline-block ${
                    selectedJobDetails.planType === 'Premium' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedJobDetails.planType === 'Premium' ? '👑 Premium (199 Plan)' : '🟢 Basic (Free)'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Employment Type</span>
                  <span className="font-extrabold text-slate-900">{selectedJobDetails.jobType || selectedJobDetails.employmentType || 'Full-time'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Salary / Stipend</span>
                  <span className="font-black text-emerald-700 text-base">{selectedJobDetails.salary || 'Not Specified'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Source</span>
                  <span className="font-extrabold text-indigo-700">{selectedJobDetails.source || 'Admin / Excel Import'}</span>
                </div>
              </div>

              {selectedJobDetails.applyUrl && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">External Apply Link</span>
                  <a 
                    href={selectedJobDetails.applyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 hover:text-indigo-800 font-black underline break-all inline-flex items-center gap-1 text-xs"
                  >
                    {selectedJobDetails.applyUrl} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}

              {selectedJobDetails.applyEmail && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Recruiter Email</span>
                  <a href={`mailto:${selectedJobDetails.applyEmail}`} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs underline">
                    {selectedJobDetails.applyEmail}
                  </a>
                </div>
              )}

              {selectedJobDetails.description && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Job Description / Requirements</span>
                  <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {selectedJobDetails.description}
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Database ID: {selectedJobDetails._id}</span>
                <span>Status: {selectedJobDetails.isActive ? '✅ Active' : '⏸️ Hidden'}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setSelectedJobDetails(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl transition-colors shadow-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default JobAdminPage;
