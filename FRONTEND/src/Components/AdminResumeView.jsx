import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FileText, Download, Loader2, Coins, Search, User, Shield, CheckCircle, Power, UserPlus } from 'lucide-react';

const AdminResumeView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resumeEnabled, setResumeEnabled] = useState(true);
  const [whitelistEmail, setWhitelistEmail] = useState('');
  const [whitelistLoading, setWhitelistLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const [analyticsRes, resumesRes, settingsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume-settings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
      if (resumesRes.data.success) setResumes(resumesRes.data.resumes);
      if (settingsRes.data.success) setResumeEnabled(settingsRes.data.enabled);
    } catch (err) {
      toast.error('Failed to load resume data');
    } finally {
      setLoading(false);
    }
  };

  const filteredResumes = resumes.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.userId?.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

  const toggleResumeFeature = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume-settings/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setResumeEnabled(res.data.enabled);
        toast.success(`Resume feature ${res.data.enabled ? 'enabled' : 'disabled'} globally!`);
      }
    } catch (err) {
      toast.error('Failed to toggle feature');
    }
  };

  const handleWhitelist = async (e) => {
    e.preventDefault();
    if (!whitelistEmail) return;
    setWhitelistLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume-settings/override-by-email`, { email: whitelistEmail, override: true }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        toast.success(`Granted access to ${whitelistEmail}!`);
        setWhitelistEmail('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant access');
    } finally {
      setWhitelistLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feature Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Global Toggle */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800">Global Feature Access</h3>
            </div>
            <p className="text-sm text-slate-500 mb-6">Enable or disable the AI Resume Builder for all users globally.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleResumeFeature}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${resumeEnabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
            >
              <Power className="w-4 h-4" />
              {resumeEnabled ? 'Feature Enabled' : 'Feature Disabled'}
            </button>
            <span className="text-xs text-slate-400 font-medium">{resumeEnabled ? 'Visible to everyone' : 'Hidden from everyone (except whitelisted)'}</span>
          </div>
        </div>

        {/* Whitelist Input */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-800">Grant Exclusive Access</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">Give a specific user access to the Resume feature even if it is globally disabled.</p>
          
          <form onSubmit={handleWhitelist} className="flex gap-2">
            <input 
              type="email" 
              required
              value={whitelistEmail}
              onChange={(e) => setWhitelistEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={whitelistLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {whitelistLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Grant Access
            </button>
          </form>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500"/> Total Resumes</div>
          <div className="text-3xl font-black text-slate-800">{analytics?.totalResumes}</div>
          <div className="text-xs font-medium text-slate-500 mt-1">Today: {analytics?.todayResumes}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-2"><Download className="w-4 h-4 text-purple-500"/> Total PDF Downloads</div>
          <div className="text-3xl font-black text-slate-800">{analytics?.totalDownloads}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-2"><Coins className="w-4 h-4 text-amber-500"/> Token Economics</div>
          <div className="text-lg font-black text-slate-800">{analytics?.totalTokensEarned} Tokens Earned</div>
          <div className="text-xs font-medium text-slate-500 mt-1">{analytics?.paidDownloads} Paid Downloads</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-500"/> Free Usage</div>
          <div className="text-lg font-black text-slate-800">{analytics?.freeDownloads} Free DLs</div>
          <div className="text-xs font-medium text-slate-500 mt-1">First Resume is Free</div>
        </div>
      </div>

      {/* Resumes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">All User Resumes</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search user or resume..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">Resume Name</th>
                <th className="p-4">User</th>
                <th className="p-4">Type</th>
                <th className="p-4">Downloads</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredResumes.map(r => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{r.name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700"><User className="w-4 h-4"/></div>
                      <div>
                        <div className="font-medium text-slate-900">{r.userId?.name}</div>
                        <div className="text-xs text-slate-500">{r.userId?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {r.isFree ? <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">FREE</span> : <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold">PAID</span>}
                  </td>
                  <td className="p-4 font-medium text-slate-700">{r.downloadsUsed}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${r.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{r.status}</span>
                  </td>
                  <td className="p-4 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {filteredResumes.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No resumes found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminResumeView;
