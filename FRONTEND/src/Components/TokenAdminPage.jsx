import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Users, Search, RefreshCw, Database, Save, Plus, Minus, History, CheckCircle, IndianRupee, ShieldAlert, Star
} from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

function TokenHistoryModal({ user, onClose }) {
  if (!user) return null;
  
  // Combine tokenHistory and interviewPayments
  const history = [];
  
  if (user.tokenHistory) {
    user.tokenHistory.forEach(h => history.push({ ...h, source: 'token' }));
  }
  
  if (user.interviewPayments) {
    user.interviewPayments.forEach(p => {
      let tknMatch = p.packageId ? p.packageId.match(/(\d+)/) : null;
      let tknAmount = tknMatch ? parseInt(tknMatch[1]) : 0;
      
      // Fix for legacy typo where 100_tokens might have been saved as 10_tokens
      if (tknAmount === 10 && p.amount === 299) {
        tknAmount = 100;
      }
      if (tknAmount === 50 && p.amount === 199) {
         tknAmount = 50;
      }

      history.push({ 
        source: 'payment', 
        type: 'PURCHASE', 
        amount: tknAmount, 
        reason: `Purchased Package: ${tknAmount} Tokens (₹${p.amount})`, 
        date: p.paidAt 
      });
    });
  }

  history.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">Token History: {user.name}</h3>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {history.length === 0 ? (
            <p className="text-center text-slate-500 italic py-8">No token history found.</p>
          ) : (
            <div className="space-y-4">
              {history.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'ADD' || item.type === 'PURCHASE' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {item.type === 'ADD' ? <Plus className="w-5 h-5" /> : item.type === 'PURCHASE' ? <IndianRupee className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">
                      {item.type === 'PURCHASE' ? 'Token Purchase' : item.type === 'ADD' ? 'Tokens Added' : item.type === 'USE' ? 'Tokens Used' : 'Tokens Deducted'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{item.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-black ${item.type === 'ADD' || item.type === 'PURCHASE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.type === 'ADD' || item.type === 'PURCHASE' ? '+' : '-'}{item.amount}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(item.date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdjustTokenModal({ user, onClose, onRefresh }) {
  const [type, setType] = useState('ADD');
  const [amount, setAmount] = useState(10);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleAdjust = async () => {
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(`${BACKEND}/api/admin/interview-settings/tokens/adjust`, {
        userId: user._id,
        type,
        amount,
        reason
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success(`Tokens ${type === 'ADD' ? 'added' : 'deducted'} successfully`);
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to adjust tokens");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Adjust Tokens</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm font-semibold text-slate-700">{user.name}</p>
            <p className="text-xs text-slate-500">Current Balance: <span className="font-bold text-indigo-600">{user.interviewCredits}</span></p>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setType('ADD')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${type === 'ADD' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              Add Tokens
            </button>
            <button
              onClick={() => setType('DEDUCT')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${type === 'DEDUCT' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              Deduct Tokens
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Amount</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Reason (Optional)</label>
            <input 
              type="text" 
              placeholder={type === 'ADD' ? "e.g. Bonus for good project" : "e.g. Penalty or correction"}
              value={reason} 
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-sm"
            />
          </div>

          <button
            onClick={handleAdjust}
            disabled={saving}
            className={`w-full py-2.5 rounded-lg text-white font-bold text-sm transition-colors mt-2 ${type === 'ADD' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : type === 'ADD' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            {type === 'ADD' ? 'Add Tokens' : 'Deduct Tokens'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TokenAdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tokenSettings, setTokenSettings] = useState({ freeTokens: 30, interviewCost: 10 });
  const [savingTokens, setSavingTokens] = useState(false);
  
  const [selectedHistoryUser, setSelectedHistoryUser] = useState(null);
  const [selectedAdjustUser, setSelectedAdjustUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const [usersRes, settingsRes] = await Promise.all([
        axios.get(`${BACKEND}/api/admin/token-data`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BACKEND}/api/admin/interview-settings/tokens`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);
      
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
      if (settingsRes && settingsRes.data && settingsRes.data.success) {
        setTokenSettings({
          freeTokens: settingsRes.data.freeTokens,
          interviewCost: settingsRes.data.interviewCost
        });
      }
    } catch (err) {
      toast.error("Failed to load token data");
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
      toast.success("Token settings updated successfully");
    } catch (err) {
      toast.error("Failed to update token settings");
    } finally {
      setSavingTokens(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Token Settings Banner */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Database className="w-32 h-32 text-indigo-600" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
          <Database className="w-4 h-4 text-indigo-600" /> Global Token Settings
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-end relative z-10">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Free Tokens (New Users)</label>
            <input 
              type="number" 
              value={tokenSettings.freeTokens} 
              onChange={(e) => setTokenSettings({...tokenSettings, freeTokens: Number(e.target.value)})}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700" 
            />
          </div>
          <button 
            onClick={saveTokenSettings}
            disabled={savingTokens}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 h-[42px] shadow-md shadow-indigo-200"
          >
            {savingTokens ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingTokens ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Users Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
          />
        </div>
        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200"
        >
          <RefreshCw className="w-4 h-4" /> Refresh List
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 text-center">Current Tokens</th>
                  <th className="px-6 py-4">Account Type</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(user => (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-sm border border-indigo-100">
                        {user.interviewCredits || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.interviewIsUnlimited ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-md">
                          <Star className="w-3 h-3 fill-current" /> Unlimited
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedAdjustUser(user)}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors border border-slate-200 hover:border-indigo-200"
                          title="Adjust Tokens"
                        >
                          <Database className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedHistoryUser(user)}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors border border-slate-200"
                          title="View History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <TokenHistoryModal user={selectedHistoryUser} onClose={() => setSelectedHistoryUser(null)} />
      <AdjustTokenModal user={selectedAdjustUser} onClose={() => setSelectedAdjustUser(null)} onRefresh={fetchData} />
    </div>
  );
}
