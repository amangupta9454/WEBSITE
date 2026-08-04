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
  AlertTriangle,
  X,
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

  const [applications, setApplications] = useState([]);

  // Form State for Standard Referral
  const [customCode, setCustomCode] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [featureTarget, setFeatureTarget] = useState("General");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Form State for Ambassador Assignment
  const [ambEmail, setAmbEmail] = useState("");
  const [ambNameInput, setAmbNameInput] = useState("");
  const [ambCodeInput, setAmbCodeInput] = useState("");
  const [ambCollegeInput, setAmbCollegeInput] = useState("");
  const [assigningAmb, setAssigningAmb] = useState(false);
  const [expandedAmbassador, setExpandedAmbassador] = useState(null);

  // Form State for Ambassador Group URL
  const [groupUrlInput, setGroupUrlInput] = useState("");
  const [updatingGroupUrl, setUpdatingGroupUrl] = useState(false);

  const handleUpdateGroupUrl = async (e) => {
    e.preventDefault();
    try {
      setUpdatingGroupUrl(true);
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

      const res = await axios.post(
        `${apiUrl}/api/admin/ambassador-group-url`,
        { url: groupUrlInput },
        { headers }
      );

      if (res.data.success) {
        toast.success("Official Ambassador WhatsApp Group Link saved successfully!");
      }
    } catch (error) {
      console.error("Error saving group URL:", error);
      toast.error(error.response?.data?.message || "Failed to save group link");
    } finally {
      setUpdatingGroupUrl(false);
    }
  };

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

      const [refRes, convRes, ambRes, appRes] = await Promise.all([
        axios.get(`${apiUrl}/api/admin/referrals`, { headers }),
        axios.get(`${apiUrl}/api/admin/referrals/conversions`, {
          headers,
          params: { search: conversionSearch },
        }),
        axios.get(`${apiUrl}/api/admin/ambassadors`, { headers }),
        axios.get(`${apiUrl}/api/admin/ambassador-applications`, { headers }),
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
        if (ambRes.data.ambassadorGroupUrl) {
          setGroupUrlInput(ambRes.data.ambassadorGroupUrl);
        }
      }

      if (appRes.data.success) {
        setApplications(appRes.data.applications || []);
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
        { email: ambEmail, name: ambNameInput, customCode: ambCodeInput, college: ambCollegeInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setAmbEmail("");
        setAmbNameInput("");
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
  const handleDeleteAmbassador = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Campus Ambassador "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
      const res = await axios.delete(`${apiUrl}/api/admin/ambassador/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || "Campus Ambassador deleted successfully");
        setAmbassadors((prev) => prev.filter((a) => a._id !== id));
      }
    } catch (error) {
      console.error("Error deleting ambassador:", error);
      toast.error(error.response?.data?.message || "Failed to delete Campus Ambassador");
    }
  };

  const handleApproveApplication = async (id, name) => {
    if (!window.confirm(`Approve ${name} as a Campus Ambassador? They will be notified via email.`)) return;
    try {
      const token = localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
      const res = await axios.post(`${apiUrl}/api/admin/ambassador-applications/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || "Ambassador approved successfully!");
        fetchData();
      }
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error(error.response?.data?.message || "Failed to approve application");
    }
  };

  const handleRejectApplication = async (id) => {
    if (!window.confirm("Reject this Campus Ambassador application?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
      const res = await axios.post(`${apiUrl}/api/admin/ambassador-applications/reject/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Application rejected");
        fetchData();
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    }
  };

  const activeAmbassadorsCount = ambassadors.filter((a) => a.isActive !== false).length;

  return (
    <div className="space-y-8">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            Campus Ambassador System
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Assign Campus Ambassadors, manage active/inactive statuses, set WhatsApp group link, and track clicks & signups.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Campus Ambassadors</span>
            <div className="text-3xl font-black text-purple-600 mt-1">{activeAmbassadorsCount}</div>
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

      {/* ─── CAMPUS AMBASSADORS SECTION ─── */}
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
                  Designate ANY student as a Campus Ambassador (even without an existing account!). When they log in or sign up later, their ambassador data and stats will automatically merge with their account!
                </p>
              </div>
            </div>

            <form onSubmit={handleAssignAmbassador} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5">Student Email (Registered or New) *</label>
                <input
                  type="email"
                  required
                  placeholder="anyone@college.edu"
                  value={ambEmail}
                  onChange={(e) => setAmbEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-purple-700/50 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5">Full Name (For ID Card) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={ambNameInput}
                  onChange={(e) => setAmbNameInput(e.target.value)}
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

              <div className="md:col-span-2 flex justify-end">
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

          {/* Official Ambassador Group URL Card */}
          <div className="bg-gradient-to-r from-slate-900 to-purple-950 p-6 rounded-2xl border border-purple-800/40 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Official Campus Ambassador Group Link</h3>
                <p className="text-xs text-purple-200/70">Ambassadors can click "Join WhatsApp Group Now" on their dashboard to join this official community group.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateGroupUrl} className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                placeholder="e.g. https://chat.whatsapp.com/ENwP1eS6F6L9K9yZ2y3z4a"
                value={groupUrlInput}
                onChange={(e) => setGroupUrlInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-purple-700/50 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
              <button
                type="submit"
                disabled={updatingGroupUrl}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
              >
                {updatingGroupUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Group Link
              </button>
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

                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                onClick={() => setExpandedAmbassador(isExpanded ? null : amb._id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                              >
                                <Users className="w-3.5 h-3.5" />
                                View Users ({amb.referredUsers?.length || 0})
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>

                              <button
                                onClick={() => handleDeleteAmbassador(amb._id, amb.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold border border-red-200 transition-all"
                                title="Delete Campus Ambassador"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                Delete
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

        {/* ─── PENDING CAMPUS AMBASSADOR APPLICATIONS ─── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-500 rounded-xl border border-amber-200">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Campus Ambassador Applications</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review and approve/reject student applications for the Campus Ambassador Program.
                </p>
              </div>
            </div>
            <div className="flex gap-2 text-xs font-bold">
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg">
                {applications.filter(a => a.status === "Pending").length} Pending
              </span>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg">
                {applications.filter(a => a.status === "Approved").length} Approved
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {(() => {
              const pendingApps = applications.filter(a => a.status === "Pending");
              return (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Applicant Info</th>
                      <th className="py-3 px-4">College</th>
                      <th className="py-3 px-4">Year / Branch</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4">Applied On</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingApps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                          No pending applications. All applications have been reviewed!
                        </td>
                      </tr>
                    ) : (
                      pendingApps.map((app) => (
                        <tr key={app._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{app.name}</div>
                            <div className="text-slate-400 font-normal">{app.email}</div>
                            {app.reason && (
                              <div className="text-[10px] text-slate-500 mt-1 italic max-w-[200px] truncate" title={app.reason}>
                                "{app.reason}"
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">{app.college}</td>
                          <td className="py-3.5 px-4 text-slate-700">{app.yearBranch}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">{app.mobile}</td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(app.appliedAt || app.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric"
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveApplication(app._id, app.name)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-lg transition-all"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleRejectApplication(app._id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[10px] rounded-lg transition-all"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralAdmin;
