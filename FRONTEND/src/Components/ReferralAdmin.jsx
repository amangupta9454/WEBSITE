import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Share2,
  Plus,
  Copy,
  Check,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MousePointer,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  Loader2,
  GraduationCap,
  Award,
  Users,
  Eye,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";

const ReferralAdmin = () => {
  const [activeSubTab, setActiveSubTab] = useState("standard"); // 'standard' or 'ambassadors'
  const [referrals, setReferrals] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [ambassadors, setAmbassadors] = useState([]);
  const [stats, setStats] = useState({ totalCodes: 0, totalClicks: 0, totalUses: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form State for Standard Referral
  const [customCode, setCustomCode] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [featureTarget, setFeatureTarget] = useState("General");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Form State for Ambassador Assignment
  const [ambEmail, setAmbEmail] = useState("");
  const [ambCodeInput, setAmbCodeInput] = useState("");
  const [ambCollegeInput, setAmbCollegeInput] = useState("");
  const [assigningAmb, setAssigningAmb] = useState(false);
  const [expandedAmbassador, setExpandedAmbassador] = useState(null);

  // Search State for Conversions
  const [conversionSearch, setConversionSearch] = useState("");
  const [loadingConversions, setLoadingConversions] = useState(false);

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const getReferralUrl = (code, feature) => {
    const base = getBaseUrl();
    if (feature === "Internship") return `${base}/registration?ref=${code}`;
    if (feature === "AI Resume") return `${base}/my-resumes?ref=${code}`;
    if (feature === "AI Interview") return `${base}/my-interviews?ref=${code}`;
    if (feature === "Job Portal") return `${base}/jobs?ref=${code}`;
    return `${base}/?ref=${code}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

      const [refRes, convRes, ambRes] = await Promise.all([
        axios.get(`${apiUrl}/api/admin/referrals`, { headers }),
        axios.get(`${apiUrl}/api/admin/referrals/conversions`, {
          headers,
          params: { search: conversionSearch },
        }),
        axios.get(`${apiUrl}/api/admin/ambassadors`, { headers }),
      ]);

      if (refRes.data.success) {
        setReferrals(refRes.data.referrals || []);
        setStats(refRes.data.stats || { totalCodes: 0, totalClicks: 0, totalUses: 0 });
      }

      if (convRes.data.success) {
        setConversions(convRes.data.conversions || []);
      }

      if (ambRes.data.success) {
        setAmbassadors(ambRes.data.ambassadors || []);
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
      toast.error(error.response?.data?.message || "Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversionsOnly = async () => {
    try {
      setLoadingConversions(true);
      const token = localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

      const res = await axios.get(`${apiUrl}/api/admin/referrals/conversions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: conversionSearch },
      });

      if (res.data.success) {
        setConversions(res.data.conversions || []);
      }
    } catch (error) {
      console.error("Error fetching conversions:", error);
    } finally {
      setLoadingConversions(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchConversionsOnly();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [conversionSearch]);

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const token = localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

      const res = await axios.post(
        `${apiUrl}/api/admin/referrals/create`,
        { customCode, targetEmail, featureTarget, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(`Referral code "${res.data.referral.code}" generated successfully!`);
        setCustomCode("");
        setTargetEmail("");
        setNotes("");
        fetchData();
      }
    } catch (error) {
      console.error("Error creating referral:", error);
      toast.error(error.response?.data?.message || "Failed to create referral code");
    } finally {
      setCreating(false);
    }
  };

  const handleAssignAmbassador = async (e) => {
    e.preventDefault();
    if (!ambEmail) {
      toast.error("User email is required to assign ambassador");
      return;
    }
    try {
      setAssigningAmb(true);
      const token = localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

      const res = await axios.post(
        `${apiUrl}/api/admin/ambassadors/assign`,
        { email: ambEmail, customCode: ambCodeInput, college: ambCollegeInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setAmbEmail("");
        setAmbCodeInput("");
        setAmbCollegeInput("");
        fetchData();
      }
    } catch (error) {
      console.error("Error assigning ambassador:", error);
      toast.error(error.response?.data?.message || "Failed to assign Campus Ambassador");
    } finally {
      setAssigningAmb(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

      const res = await axios.post(
        `${apiUrl}/api/admin/referrals/toggle/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.info(res.data.message);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this referral code?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

      const res = await axios.delete(`${apiUrl}/api/admin/referrals/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        toast.success("Referral code deleted");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to delete referral code");
    }
  };

  const copyToClipboard = (url, code) => {
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Share2 className="w-6 h-6" />
            </div>
            Referral & Campus Ambassador System
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage referral codes, assign Campus Ambassadors, track clicks, user signups, phone numbers, and applied features.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Stats
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Referral Codes</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{stats.totalCodes}</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <LinkIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Campus Ambassadors</span>
            <div className="text-3xl font-black text-purple-600 mt-1">{ambassadors.length}</div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Link Clicks</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{stats.totalClicks}</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <MousePointer className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Successful Signups</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{stats.totalUses}</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab("standard")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "standard"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Share2 className="w-4 h-4" /> Standard Referral Links
        </button>
        <button
          onClick={() => setActiveSubTab("ambassadors")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "ambassadors"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Campus Ambassadors ({ambassadors.length})
        </button>
      </div>

      {/* ─── STANDARD REFERRALS SECTION ─── */}
      {activeSubTab === "standard" && (
        <div className="space-y-8 animate-fade-in">
          {/* Generator Form Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-900/50 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Generate Referral Code / Link</h3>
                <p className="text-xs text-indigo-200/70">Create tracked links tailored for specific features or assigned to specific emails.</p>
              </div>
            </div>

            <form onSubmit={handleCreateReferral} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-indigo-200 mb-1.5">Target Feature / Campaign</label>
                <select
                  value={featureTarget}
                  onChange={(e) => setFeatureTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-indigo-700/50 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="General">General Sign-up</option>
                  <option value="Internship">Internship Program</option>
                  <option value="AI Resume">AI Resume Builder</option>
                  <option value="AI Interview">AI Mock Interview</option>
                  <option value="Job Portal">Job Portal</option>
                  <option value="Custom">Custom Campaign</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-200 mb-1.5">Target User Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. user@example.com"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-indigo-700/50 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-200 mb-1.5">Custom Code String (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-indigo-700/50 rounded-xl text-xs text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-200 mb-1.5">Campaign Notes / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Campus Drive July"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-indigo-700/50 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Generate Referral Link
                </button>
              </div>
            </form>
          </div>

          {/* Generated Referral Codes Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Referral Codes</h3>
                <p className="text-xs text-slate-500 mt-0.5">List of created codes, target emails, clicks, and conversion counts.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Referral Code & Link</th>
                    <th className="py-3 px-4">Feature Target</th>
                    <th className="py-3 px-4">Target Email</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4">Clicks</th>
                    <th className="py-3 px-4">Signups</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        No referral codes generated yet. Create one using the form above!
                      </td>
                    </tr>
                  ) : (
                    referrals.map((ref) => {
                      const fullUrl = getReferralUrl(ref.code, ref.featureTarget);
                      const isCopied = copiedCode === ref.code;

                      return (
                        <tr key={ref._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
                                {ref.code}
                              </span>
                              <button
                                onClick={() => copyToClipboard(fullUrl, ref.code)}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Copy full referral URL"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-400 max-w-xs truncate mt-0.5">{fullUrl}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                              {ref.featureTarget}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {ref.targetEmail ? (
                              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {ref.targetEmail}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Any User</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {ref.notes || "—"}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-700 bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                              {ref.clicks || 0}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {ref.usesCount || 0}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleStatus(ref._id)}
                              className={`flex items-center gap-1 font-semibold text-[11px] ${
                                ref.isActive ? "text-emerald-600" : "text-slate-400"
                              }`}
                            >
                              {ref.isActive ? (
                                <>
                                  <ToggleRight className="w-5 h-5 text-emerald-500" /> Active
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-5 h-5 text-slate-300" /> Inactive
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              onClick={() => copyToClipboard(fullUrl, ref.code)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                            >
                              Copy Link
                            </button>
                            <button
                              onClick={() => handleDelete(ref._id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Delete Code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── CAMPUS AMBASSADORS SECTION ─── */}
      {activeSubTab === "ambassadors" && (
        <div className="space-y-8 animate-fade-in">
          {/* Ambassador Assignment Card */}
          <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-purple-900/50 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Assign Campus Ambassador</h3>
                <p className="text-xs text-purple-200/70">
                  Designate any registered student as a Campus Ambassador. They will automatically get an Ambassador Tab in their Student Dashboard!
                </p>
              </div>
            </div>

            <form onSubmit={handleAssignAmbassador} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5">Student Registered Email *</label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={ambEmail}
                  onChange={(e) => setAmbEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-purple-700/50 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5">College / Institution Name</label>
                <input
                  type="text"
                  placeholder="e.g. IIT Delhi"
                  value={ambCollegeInput}
                  onChange={(e) => setAmbCollegeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-purple-700/50 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5">Custom Ambassador Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AMB-HIMANSHU (Auto if empty)"
                  value={ambCodeInput}
                  onChange={(e) => setAmbCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-purple-700/50 rounded-xl text-xs text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={assigningAmb}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50"
                >
                  {assigningAmb ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                  Assign Campus Ambassador
                </button>
              </div>
            </form>
          </div>

          {/* Ambassador List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Campus Ambassadors Directory</h3>
                <p className="text-xs text-slate-500 mt-0.5">List of designated ambassadors, total clicks, conversions, and student lists.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Ambassador Info</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Ambassador Code</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Clicks</th>
                    <th className="py-3 px-4">Conversions / Signups</th>
                    <th className="py-3 px-4 text-right">Referred Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ambassadors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        No Campus Ambassadors assigned yet. Use the form above to designate a student as an Ambassador!
                      </td>
                    </tr>
                  ) : (
                    ambassadors.map((amb) => {
                      const isExpanded = expandedAmbassador === amb._id;
                      const fullUrl = getReferralUrl(amb.ambassadorCode, "General");

                      return (
                        <React.Fragment key={amb._id}>
                          <tr className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4 text-purple-600" />
                                {amb.name}
                              </div>
                              <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" /> {amb.email}
                              </div>
                              <div className="text-slate-500 text-[11px] flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" /> {amb.mobile}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {amb.ambassadorCollege || "N/A"}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-xs">
                                  {amb.ambassadorCode}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(fullUrl, amb.ambassadorCode)}
                                  className="p-1 text-slate-400 hover:text-purple-600"
                                  title="Copy Link"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {amb.referralId ? (
                                <button
                                  onClick={() => handleToggleStatus(amb.referralId)}
                                  className={`flex items-center gap-1 font-semibold text-[11px] ${
                                    amb.isActive !== false ? "text-emerald-600" : "text-amber-600"
                                  }`}
                                >
                                  {amb.isActive !== false ? (
                                    <>
                                      <ToggleRight className="w-5 h-5 text-emerald-500" /> Active
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft className="w-5 h-5 text-amber-500" /> Inactive
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-bold text-amber-700 bg-amber-50/50">
                              {amb.clicks} Clicks
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                {amb.usesCount} Signups
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setExpandedAmbassador(isExpanded ? null : amb._id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                              >
                                <Users className="w-3.5 h-3.5" />
                                View Users ({amb.referredUsers?.length || 0})
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Referred Users Sub-Table */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="bg-purple-50/30 p-4 border-y border-purple-100">
                                <div className="space-y-3">
                                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-purple-600" />
                                    Users Referred by {amb.name} ({amb.referredUsers?.length || 0})
                                  </h4>
                                  {amb.referredUsers && amb.referredUsers.length > 0 ? (
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                      <table className="w-full text-left text-[11px]">
                                        <thead>
                                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                                            <th className="py-2.5 px-3">Student Name & Email</th>
                                            <th className="py-2.5 px-3">Phone Number</th>
                                            <th className="py-2.5 px-3">Applied Features / Items</th>
                                            <th className="py-2.5 px-3">Joined Date</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {amb.referredUsers.map((u) => (
                                            <tr key={u._id} className="hover:bg-slate-50">
                                              <td className="py-2 px-3 font-semibold text-slate-900">
                                                {u.name}
                                                <div className="text-slate-500 font-normal">{u.email}</div>
                                              </td>
                                              <td className="py-2 px-3 font-mono font-medium text-slate-800">
                                                {u.mobile || "N/A"}
                                              </td>
                                              <td className="py-2 px-3">
                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                                                  {u.appliedFeatures}
                                                </span>
                                              </td>
                                              <td className="py-2 px-3 text-slate-500">
                                                {u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : "N/A"}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-500 italic p-3 bg-white rounded-xl border border-slate-200">
                                      No users have registered using this Ambassador's referral code yet.
                                    </p>
                                  )}

                                  {/* Existing Account Holders Attempted Rejoin Block */}
                                  {amb.existingAttemptedUsers && amb.existingAttemptedUsers.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-purple-100 space-y-2">
                                      <h5 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                        Existing Account Holders Attempted Rejoin via Link ({amb.existingAttemptedUsers.length})
                                      </h5>
                                      <p className="text-[11px] text-amber-700">
                                        These users ALREADY had an account prior to clicking the link. Excluded from Ambassador signup metrics.
                                      </p>
                                      <div className="bg-amber-50/60 rounded-xl border border-amber-200 overflow-hidden">
                                        <table className="w-full text-left text-[11px]">
                                          <thead>
                                            <tr className="bg-amber-100/50 border-b border-amber-200 text-amber-900 font-bold uppercase">
                                              <th className="py-2 px-3">Name & Email</th>
                                              <th className="py-2 px-3">Phone</th>
                                              <th className="py-2 px-3">Attempt Date</th>
                                              <th className="py-2 px-3">Status</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-amber-100">
                                            {amb.existingAttemptedUsers.map((ex) => (
                                              <tr key={ex._id}>
                                                <td className="py-2 px-3 font-semibold text-slate-800">
                                                  {ex.name}
                                                  <div className="text-slate-500 font-normal">{ex.email}</div>
                                                </td>
                                                <td className="py-2 px-3 font-mono">{ex.mobile || "N/A"}</td>
                                                <td className="py-2 px-3 text-slate-500">{ex.attemptedAt ? new Date(ex.attemptedAt).toLocaleDateString() : "N/A"}</td>
                                                <td className="py-2 px-3">
                                                  <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                                                    Existing Account (Not Counted)
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Referred Users & Conversion Tracking Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              All Referred Users & Applied Features Tracker
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Search by referral code, user email, or phone number to see who joined and what they applied for.
            </p>
          </div>

          {/* Conversion Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, email, or phone no..."
              value={conversionSearch}
              onChange={(e) => setConversionSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {conversionSearch && (
              <button
                onClick={() => setConversionSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">User Name & Email</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Referral Code Used</th>
                <th className="py-3 px-4">Target Feature</th>
                <th className="py-3 px-4">What They Applied For / Did</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingConversions ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                    Searching referred users...
                  </td>
                </tr>
              ) : conversions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No referred user conversions found for this search.
                  </td>
                </tr>
              ) : (
                conversions.map((conv) => (
                  <tr key={conv._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{conv.name}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {conv.email}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {conv.mobile || "N/A"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                        {conv.referredByCode}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {conv.featureTarget}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {conv.appliedItems && conv.appliedItems.length > 0 ? (
                          conv.appliedItems.map((item, idx) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Registered</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {conv.registeredAt ? new Date(conv.registeredAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }) : "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReferralAdmin;
