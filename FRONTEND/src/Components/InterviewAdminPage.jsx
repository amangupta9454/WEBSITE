import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Users, CreditCard, Activity, ChevronDown, ChevronUp,
  CheckCircle, Search, RefreshCw, Star, TrendingUp, IndianRupee,
  ToggleLeft, ToggleRight, Calendar, Database, Save
} from "lucide-react";
import { FeedbackModal } from "../Pages/InterviewPortal/components/InterviewDashboardContent";
import { useInterviewConfig } from "../context/InterviewConfigContext";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

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

function SessionRow({ session }) {
  const [open, setOpen] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const feedback = session.feedback || {};
  const evaluation = feedback.ai_evaluation;
  
  const deduplicatedConversation = feedback.conversation?.reduce((acc, curr) => {
    if (acc.length === 0) return [{ ...curr }];
    const last = acc[acc.length - 1];
    const currText = (curr.transcript || curr.text || '').trim();
    const lastText = (last.transcript || last.text || '').trim();
    
    if (last.role === curr.role && (currText === lastText || currText.includes(lastText) || lastText.includes(currText))) {
      // Keep the longer text as it's likely the final transcript
      if (currText.length > lastText.length) {
        last.transcript = currText;
        last.text = currText;
      }
      return acc;
    }
    acc.push({ ...curr });
    return acc;
  }, []) || [];
  
  const overallScore = evaluation?.overall_score || feedback.overallScore || feedback.overall_score || null;
  const statusColor = session.status === "Completed"
    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : session.status === "Started"
    ? "text-blue-600 bg-blue-50 border-blue-200"
    : "text-red-600 bg-red-50 border-red-200";

  const formatMetricValue = (key, value) => {
    if (key === 'eyeContactScore' || key === 'attentionScore') return `${value}/10`;
    if (key === 'faceVisibilityPct') return `${value}%`;
    if (key === 'lookAwayDurationSec') return `${value}s`;
    if (key === 'interviewDurationMin') return `${value}m`;
    return value;
  };

  return (
    <div className="border border-slate-100 rounded-xl mb-2 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>{session.status}</span>
          <span className="text-sm font-semibold text-slate-700 truncate">{session.jobTitle}</span>
          <span className="text-xs text-slate-400 hidden sm:block">{session.experienceYears} yrs · {session.durationMinutes} min</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {overallScore != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-amber-700 bg-amber-100">
              <Star className="w-3 h-3" />{overallScore}/10
            </span>
          )}
          <span className="text-xs text-slate-400">{new Date(session.createdAt).toLocaleDateString("en-GB")}</span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-3 bg-white border-t border-slate-100">
          {Object.keys(feedback).length === 0 ? (
            <p className="text-sm text-slate-400 italic">No feedback data yet.</p>
          ) : (
            <div className="space-y-4">
              {/* AI Evaluation Section */}
              {feedback.ai_evaluation ? (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Premium AI Evaluation Report</h4>
                    <p className="text-xs text-slate-500">Includes Enterprise Feedback, Speech Analytics, Knowledge Gaps, and Hiring Recommendation.</p>
                  </div>
                  <button onClick={() => setShowFullReport(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors whitespace-nowrap">
                    View Full Report
                  </button>
                  
                  {showFullReport && <FeedbackModal feedback={session} onClose={() => setShowFullReport(false)} />}
                </div>
              ) : (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center mb-6">
                  <p className="text-amber-700 font-medium text-sm">No structured AI evaluation available for this session.</p>
                </div>
              )}
          
          <div className="space-y-6 mt-6 pt-6 border-t border-slate-100">
            {/* Attention Metrics Section */}
            {feedback.attentionMetrics && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attention Metrics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(feedback.attentionMetrics).map(([k, v]) => (
                    <div key={k} className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-sm font-bold text-slate-700">{formatMetricValue(k, v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript Section */}
            {deduplicatedConversation.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Transcript</h4>
                <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {deduplicatedConversation.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'}`}>
                        <p className="text-[9px] uppercase font-bold opacity-70 mb-1">{msg.role === 'user' ? 'Candidate' : 'AI'}</p>
                        <p>{msg.transcript || msg.text || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    )}
  </div>
);
}

function UserCard({ user }) {
  const [open, setOpen] = useState(false);
  const [override, setOverride] = useState(user.interviewAccessOverride || false);
  const totalSessions = user.sessions?.length || 0;
  const completedSessions = user.sessions?.filter(s => s.status === "Completed").length || 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4 min-w-0">
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-slate-100" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-base shrink-0">
              {(user.name || "U").charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${user.isUnlimited ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-blue-100 text-blue-700 border border-blue-200"}`}>
                {user.isUnlimited ? "Unlimited Tier" : "Standard Tier"}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-center hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Credits</p>
            <p className="text-lg font-black text-indigo-600">{user.isUnlimited ? "∞" : user.credits}</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Sessions</p>
            <p className="text-lg font-black text-slate-700">{totalSessions}</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Done</p>
            <p className="text-lg font-black text-emerald-600">{completedSessions}</p>
          </div>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Joined Date</p>
              <p className="text-sm font-semibold text-slate-700">{new Date(user.createdAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Active</p>
              <p className="text-sm font-semibold text-slate-700">{new Date(user.updatedAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Credits</p>
              <p className="text-sm font-semibold text-slate-700">{user.isUnlimited ? "Unlimited" : `${user.credits + totalSessions}`}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account ID</p>
              <p className="text-xs font-mono text-slate-500">{user._id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-5">
            <input 
              type="checkbox" 
              id={`override-${user._id}`} 
              checked={override}
              onChange={async () => {
                const newValue = !override;
                setOverride(newValue);
                try {
                  const token = localStorage.getItem("adminToken");
                  await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/admin/interview-settings/override/${user._id}`, { override: newValue }, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  toast.success(newValue ? "Granted feature access to this user." : "Revoked feature access from this user.");
                } catch (err) {
                  setOverride(!newValue);
                  toast.error("Failed to update feature override");
                }
              }}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor={`override-${user._id}`} className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
              Override Access (Allow access even if globally disabled)
            </label>
          </div>

          <div className="flex gap-4 mb-4 sm:hidden">
            <div className="text-center"><p className="text-[10px] text-slate-400 uppercase font-bold">Credits</p><p className="text-lg font-black text-indigo-600">{user.isUnlimited ? "∞" : user.credits}</p></div>
            <div className="text-center"><p className="text-[10px] text-slate-400 uppercase font-bold">Sessions</p><p className="text-lg font-black text-slate-700">{totalSessions}</p></div>
            <div className="text-center"><p className="text-[10px] text-slate-400 uppercase font-bold">Done</p><p className="text-lg font-black text-emerald-600">{completedSessions}</p></div>
          </div>
          {totalSessions === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-4">No interview sessions yet.</p>
          ) : (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Interview Sessions</p>
              {user.sessions.map(s => <SessionRow key={s._id} session={s} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InterviewAdminPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [earnings, setEarnings] = useState(null);
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [tokenSettings, setTokenSettings] = useState({ freeTokens: 30, interviewCost: 10 });
  const [savingTokens, setSavingTokens] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [granting, setGranting] = useState(false);
  const [whitelistedUsers, setWhitelistedUsers] = useState([]);
  const { configs: contextConfigs, refreshConfigs } = useInterviewConfig();
  const [interviewConfigs, setInterviewConfigs] = useState([]);
  const [savingConfigId, setSavingConfigId] = useState(null);

  useEffect(() => {
    if (contextConfigs && contextConfigs.length > 0) {
      setInterviewConfigs(contextConfigs);
    }
  }, [contextConfigs]);

  const handleGrantAccessByEmail = async (overrideStatus = true, emailToUpdate = grantEmail) => {
    if (!emailToUpdate) return toast.error("Please enter an email");
    setGranting(true);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(`${BACKEND}/api/admin/interview-settings/override-by-email`, { email: emailToUpdate, override: overrideStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Access ${overrideStatus ? 'granted to' : 'revoked from'} ${emailToUpdate}`);
      if (emailToUpdate === grantEmail) setGrantEmail("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${overrideStatus ? 'grant' : 'revoke'} access`);
    } finally {
      setGranting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const [dataRes, settingRes, tokenSettingsRes, whitelistedRes] = await Promise.all([
        axios.get(`${BACKEND}/api/admin/interview-data`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BACKEND}/api/admin/interview-settings`),
        axios.get(`${BACKEND}/api/admin/interview-settings/tokens`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        axios.get(`${BACKEND}/api/admin/whitelisted-users`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);
      
      if (dataRes.data.success) {
        const usersArray = dataRes.data.data || [];
        const filteredUsers = usersArray.filter(u => (u.sessions && u.sessions.length > 0) || u.interviewAccessOverride);
        setData(filteredUsers);
        setEarnings(dataRes.data.earnings || null);
      }
      if (settingRes.data.success) {
        setFeatureEnabled(settingRes.data.enabled);
      }
      if (tokenSettingsRes && tokenSettingsRes.data && tokenSettingsRes.data.success) {
        setTokenSettings({
          freeTokens: tokenSettingsRes.data.freeTokens,
          interviewCost: tokenSettingsRes.data.interviewCost
        });
      }
      if (whitelistedRes && whitelistedRes.data && whitelistedRes.data.success) {
        setWhitelistedUsers(whitelistedRes.data.interview);
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const saveTokenSettings = async () => {
    setSavingTokens(true);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(`${BACKEND}/api/admin/interview-settings/tokens`, tokenSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Legacy token settings updated successfully");
    } catch (err) {
      toast.error("Failed to update legacy token settings");
    } finally {
      setSavingTokens(false);
    }
  };

  const saveConfig = async (modeId, updatedConfig) => {
    setSavingConfigId(modeId);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.put(`${BACKEND}/api/interview-config/admin/${modeId}`, {
        tokenCost: updatedConfig.tokenCost,
        enabled: updatedConfig.enabled
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(`${updatedConfig.name} updated successfully!`);
        refreshConfigs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update configuration");
    } finally {
      setSavingConfigId(null);
    }
  };

  const toggleFeature = async () => {
    setToggling(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(`${BACKEND}/api/admin/interview-settings/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeatureEnabled(res.data.enabled);
      toast.success(`Interview feature ${res.data.enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error("Failed to toggle feature");
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = data.length;
  const totalSessions = data.reduce((acc, u) => acc + (u.sessions?.length || 0), 0);
  const completedSessions = data.reduce((acc, u) => acc + (u.sessions?.filter(s => s.status === "Completed").length || 0), 0);
  const unlimitedUsers = data.filter(u => u.isUnlimited).length;

  // Daily bar chart
  const dailyData = earnings?.dailyEarnings ? Object.entries(earnings.dailyEarnings) : [];
  const maxDay = dailyData.length ? Math.max(...dailyData.map(([, v]) => v), 1) : 1;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Feature Toggle Banner */}
      <div className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${featureEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <div>
          <p className={`font-black text-base ${featureEnabled ? 'text-emerald-800' : 'text-red-800'}`}>
            Interview Feature is {featureEnabled ? '✅ Active' : '🔴 Disabled'}
          </p>
          <p className={`text-xs font-medium mt-0.5 ${featureEnabled ? 'text-emerald-600' : 'text-red-500'}`}>
            {featureEnabled ? 'Students can access mock interviews.' : 'Students will see "Coming Soon" on the dashboard.'}
          </p>
        </div>
        <button
          onClick={toggleFeature}
          disabled={toggling}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${featureEnabled ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'} disabled:opacity-50`}
        >
          {featureEnabled ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
          {toggling ? 'Updating...' : featureEnabled ? 'Disable Feature' : 'Enable Feature'}
        </button>
      </div>

      {/* Interview Modes Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Interview Modes Configuration</h3>
            <p className="text-sm text-slate-500">Manage pricing and availability for different interview types.</p>
          </div>
        </div>

        <div className="space-y-4">
          {interviewConfigs.map((config) => (
            <div key={config.modeId} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-base">{config.name}</h4>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${config.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {config.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{config.description}</p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Token Cost</label>
                  <input 
                    type="number"
                    min="0"
                    value={config.tokenCost}
                    onChange={(e) => {
                      const newCost = Number(e.target.value);
                      setInterviewConfigs(prev => prev.map(c => c.modeId === config.modeId ? { ...c, tokenCost: newCost } : c));
                    }}
                    className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center font-bold"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                  <button
                    onClick={() => {
                      const newEnabled = !config.enabled;
                      setInterviewConfigs(prev => prev.map(c => c.modeId === config.modeId ? { ...c, enabled: newEnabled } : c));
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${config.enabled ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}
                  >
                    {config.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>

                <div className="flex flex-col self-end">
                  <button
                    onClick={() => saveConfig(config.modeId, config)}
                    disabled={savingConfigId === config.modeId}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 h-[34px]"
                  >
                    {savingConfigId === config.modeId ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>
            </div>
          ))}
          {interviewConfigs.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-4">No interview configurations found. Did the database seeder run?</p>
          )}
        </div>
      </div>

      {/* Grant Access by Email */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Grant Individual Access</h3>
            <p className="text-xs text-slate-500">Provide feature access to a user by email.</p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <input 
            type="email" 
            placeholder="User Email"
            value={grantEmail} 
            onChange={(e) => setGrantEmail(e.target.value)}
            className="flex-1 sm:w-64 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm font-medium" 
          />
          <button 
            onClick={() => handleGrantAccessByEmail(true)}
            disabled={granting}
            className="px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            {granting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Grant
          </button>
          <button 
            onClick={() => handleGrantAccessByEmail(false)}
            disabled={granting}
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
                      onClick={() => handleGrantAccessByEmail(false, u.email)}
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

      {/* User Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={totalUsers} icon={Users} color={{ border: "border-indigo-200", iconBg: "bg-indigo-100", icon: "text-indigo-600" }} />
        <StatCard label="Total Sessions" value={totalSessions} icon={Activity} color={{ border: "border-blue-200", iconBg: "bg-blue-100", icon: "text-blue-600" }} />
        <StatCard label="Completed" value={completedSessions} icon={CheckCircle} color={{ border: "border-emerald-200", iconBg: "bg-emerald-100", icon: "text-emerald-600" }} />
        <StatCard label="Unlimited Users" value={unlimitedUsers} icon={CreditCard} color={{ border: "border-amber-200", iconBg: "bg-amber-100", icon: "text-amber-600" }} />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
          />
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No users found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => <UserCard key={user._id} user={user} />)}
        </div>
      )}
    </div>
  );
}
