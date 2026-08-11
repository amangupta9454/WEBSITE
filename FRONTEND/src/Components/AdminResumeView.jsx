import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FileText, Download, Loader2, Coins, Search, User, Shield, CheckCircle, Power, UserPlus, ToggleLeft, ToggleRight, Activity, CreditCard, RefreshCw } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm ${color.border}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color.iconBg}`}>
        <Icon className={`w-5 h-5 ${color.icon}`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

const AdminResumeView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resumeEnabled, setResumeEnabled] = useState(true);
  const [whitelistEmail, setWhitelistEmail] = useState('');
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [whitelistedUsers, setWhitelistedUsers] = useState([]);
  
  const [grantEmail, setGrantEmail] = useState('');
  const [grantResumes, setGrantResumes] = useState(1);
  const [grantDownloads, setGrantDownloads] = useState(3);
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantedUsers, setGrantedUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const [analyticsRes, resumesRes, settingsRes, whitelistedRes, grantedRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume-settings`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/whitelisted-users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume-settings/granted-users`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
      if (resumesRes.data.success) setResumes(resumesRes.data.resumes);
      if (settingsRes.data.success) setResumeEnabled(settingsRes.data.enabled);
      if (whitelistedRes.data.success) setWhitelistedUsers(whitelistedRes.data.resume);
      if (grantedRes.data.success) setGrantedUsers(grantedRes.data.users);
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

  const handleWhitelist = async (e, overrideStatus = true, emailToUpdate = whitelistEmail) => {
    if (e) e.preventDefault();
    if (!emailToUpdate) return;
    setWhitelistLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume-settings/override-by-email`, { email: emailToUpdate, override: overrideStatus }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        toast.success(`${overrideStatus ? 'Granted access to' : 'Revoked access from'} ${emailToUpdate}!`);
        if (emailToUpdate === whitelistEmail) setWhitelistEmail('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${overrideStatus ? 'grant' : 'revoke'} access`);
    } finally {
      setWhitelistLoading(false);
    }
  };

  const handleGrantFree = async (e) => {
    e.preventDefault();
    if (!grantEmail) return;
    setGrantLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume-settings/grant-free`, 
        { email: grantEmail, freeResumes: grantResumes, freeDownloads: grantDownloads }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Granted ${grantResumes} free resumes to ${grantEmail}!`);
        setGrantEmail('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to grant free resumes`);
    } finally {
      setGrantLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Feature Toggle Banner */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 rounded-2xl border gap-4 ${resumeEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <div>
          <p className={`font-black text-base ${resumeEnabled ? 'text-emerald-800' : 'text-red-800'}`}>
            Resume Feature is {resumeEnabled ? '✅ Active' : '🔴 Disabled'}
          </p>
          <p className={`text-xs font-medium mt-0.5 ${resumeEnabled ? 'text-emerald-600' : 'text-red-500'}`}>
            {resumeEnabled ? 'Students can access the AI Resume Builder.' : 'Students will see the feature greyed out on the dashboard.'}
          </p>
        </div>
        <button
          onClick={toggleResumeFeature}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${resumeEnabled ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'}`}
        >
          {resumeEnabled ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
          {resumeEnabled ? 'Disable Feature' : 'Enable Feature'}
        </button>
      </div>

      {/* Grant Access by Email */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Grant Individual Access</h3>
            <p className="text-xs text-slate-500">Provide feature access to a user by email even if disabled.</p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <input 
            type="email" 
            required
            value={whitelistEmail}
            onChange={(e) => setWhitelistEmail(e.target.value)}
            placeholder="User Email"
            className="flex-1 sm:w-64 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm font-medium" 
          />
          <button 
            type="button"
            onClick={(e) => handleWhitelist(e, true)}
            disabled={whitelistLoading}
            className="px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            {whitelistLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Grant
          </button>
          <button 
            type="button"
            onClick={(e) => handleWhitelist(e, false)}
            disabled={whitelistLoading}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-sm rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            Revoke
          </button>
        </div>
        {whitelistedUsers.length > 0 && (
          <div className="w-full mt-3">
            <details className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <summary className="cursor-pointer font-bold text-sm text-slate-700 px-4 py-2 hover:bg-slate-100 transition-colors list-none flex justify-between items-center select-none">
                <span>View Users with Individual Access ({whitelistedUsers.length})</span>
                <span className="text-slate-400 text-xs">Click to expand</span>
              </summary>
              <div className="px-4 py-2 text-sm divide-y divide-slate-200 max-h-48 overflow-y-auto bg-white border-t border-slate-200">
                {whitelistedUsers.map(u => (
                  <div key={u.email} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{u.email}</div>
                    </div>
                    <button 
                      onClick={() => handleWhitelist(null, false, u.email)}
                      className="text-[11px] bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-bold transition-colors"
                    >
                      Remove Access
                    </button>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Grant Free Resumes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col items-start gap-4">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Coins className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Grant Free Resumes & Downloads</h3>
            <p className="text-xs text-slate-500">Provide specific users with a set number of free resumes and downloads per resume.</p>
          </div>
        </div>
        <form onSubmit={handleGrantFree} className="flex flex-col sm:flex-row w-full items-end sm:items-center gap-3">
          <div className="w-full sm:flex-1">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">User Email</label>
            <input 
              type="email" 
              required
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm font-medium" 
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Free Resumes</label>
            <input 
              type="number" 
              required
              min="0"
              value={grantResumes}
              onChange={(e) => setGrantResumes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm font-medium" 
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Free Downloads (Per)</label>
            <input 
              type="number" 
              required
              min="0"
              value={grantDownloads}
              onChange={(e) => setGrantDownloads(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm font-medium" 
            />
          </div>
          <button 
            type="submit"
            disabled={grantLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {grantLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Apply
          </button>
        </form>

        {grantedUsers.length > 0 && (
          <div className="w-full mt-2">
            <details className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <summary className="cursor-pointer font-bold text-sm text-slate-700 px-4 py-2 hover:bg-slate-100 transition-colors list-none flex justify-between items-center select-none">
                <span>View Granted Users ({grantedUsers.length})</span>
                <span className="text-slate-400 text-xs">Click to expand</span>
              </summary>
              <div className="px-4 py-2 text-sm divide-y divide-slate-200 max-h-48 overflow-y-auto bg-white border-t border-slate-200">
                {grantedUsers.map(u => (
                  <div key={u.email} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{u.email}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-bold text-blue-700">{u.freeResumesGranted} Free Resumes</div>
                      <div className="text-slate-500">{u.freeDownloadsPerResume} DLs/Resume</div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Resumes" value={analytics?.totalResumes || 0} icon={FileText} color={{ border: "border-indigo-200", iconBg: "bg-indigo-100", icon: "text-indigo-600" }} />
        <StatCard label="PDF Downloads" value={analytics?.totalDownloads || 0} icon={Download} color={{ border: "border-blue-200", iconBg: "bg-blue-100", icon: "text-blue-600" }} />
        <StatCard label="Tokens Earned" value={analytics?.totalTokensEarned || 0} icon={Coins} color={{ border: "border-emerald-200", iconBg: "bg-emerald-100", icon: "text-emerald-600" }} />
        <StatCard label="Free Downloads" value={analytics?.freeDownloads || 0} icon={Activity} color={{ border: "border-amber-200", iconBg: "bg-amber-100", icon: "text-amber-600" }} />
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
                  <td className="p-4 text-slate-500">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
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
