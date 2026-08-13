import React, { useState, useEffect, useMemo } from "react";
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
  const [dateFilter, setDateFilter] = useState("All Time");
  const [appFilter, setAppFilter] = useState("All");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  const [ambassadorDashboardEnabled, setAmbassadorDashboardEnabled] = useState(true);

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
    const savedAmbassadorSettings = localStorage.getItem("CAN_AMBASSADOR_GENERAL_SETTINGS");
    if (savedAmbassadorSettings) {
      try {
        const parsed = JSON.parse(savedAmbassadorSettings);
        setAmbassadorDashboardEnabled(parsed.ambassadorDashboardEnabled);
      } catch (err) {
        console.error("Failed to load ambassador settings:", err);
      }
    }
  }, []);

  const handleToggleAmbassadorDashboard = () => {
    const newState = !ambassadorDashboardEnabled;
    setAmbassadorDashboardEnabled(newState);
    localStorage.setItem("CAN_AMBASSADOR_GENERAL_SETTINGS", JSON.stringify({ ambassadorDashboardEnabled: newState }));
    toast.success(`Campus Ambassador Dashboard is now ${newState ? "ENABLED" : "DISABLED"}`);
  };

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

  
  const handleDownloadAmbassadorReport = (amb) => {
    if (!amb.filteredReferredUsers || amb.filteredReferredUsers.length === 0) {
      toast.error("No users to export for this ambassador.");
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Student Email,Phone Number,Applied Features,Joined Date\n";
    
    amb.filteredReferredUsers.forEach(u => {
      const joinedDate = u.registeredAt ? new Date(u.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A";
      const row = [
        `"${u.name}"`,
        `"${u.email}"`,
        `"${u.mobile || "N/A"}"`,
        `"${u.appliedFeatures || "N/A"}"`,
        `"${joinedDate}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${amb.name.replace(/\s+/g, '_')}_referrals_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Ambassador Name,Ambassador Code,Student Name,Student Email,Phone Number,Applied Features,Joined Date\n";
    
    processedAmbassadors.forEach(amb => {
      amb.filteredReferredUsers.forEach(u => {
        const joinedDate = u.registeredAt ? new Date(u.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A";
        const row = [
          `"${amb.name}"`,
          `"${amb.code}"`,
          `"${u.name}"`,
          `"${u.email}"`,
          `"${u.mobile || "N/A"}"`,
          `"${u.appliedFeatures || "N/A"}"`,
          `"${joinedDate}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ambassador_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const processedAmbassadors = useMemo(() => {
    let list = ambassadors.map((amb) => {
      let filteredReferredUsers = amb.referredUsers || [];
      if (dateFilter !== "All Time") {
        const now = new Date();
        const pastDate = new Date();
        let filterActive = true;

        if (dateFilter === "This Week") {
          pastDate.setDate(now.getDate() - 7);
        } else if (dateFilter === "This Month") {
          pastDate.setDate(now.getDate() - 30);
        } else if (dateFilter === "Custom Range") {
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            filteredReferredUsers = filteredReferredUsers.filter((u) => {
              const registeredAt = new Date(u.registeredAt);
              return registeredAt >= start && registeredAt <= end;
            });
          }
          filterActive = false; // already filtered or missing dates
        }

        if (filterActive) {
          filteredReferredUsers = filteredReferredUsers.filter((u) => {
            const registeredAt = new Date(u.registeredAt);
            return registeredAt >= pastDate && registeredAt <= now;
          });
        }
      }

      if (appFilter !== "All") {
        filteredReferredUsers = filteredReferredUsers.filter(u => {
          const features = (u.appliedFeatures || "").toLowerCase();
          return features.includes(appFilter.toLowerCase());
        });
      }

      return {
        ...amb,
        filteredReferredUsers,
        displayUsesCount: filteredReferredUsers.length,
      };
    });

    list.sort((a, b) => b.displayUsesCount - a.displayUsesCount);
    return list;
  }, [ambassadors, dateFilter, customStartDate, customEndDate, appFilter]);

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
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Ambassador Dashboard</span>
              <span className="text-[10px] text-slate-500 font-medium">Student visibility</span>
            </div>
            <button
              onClick={handleToggleAmbassadorDashboard}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                ambassadorDashboardEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  ambassadorDashboardEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Stats
          </button>
        </div>
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
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Campus Ambassadors Directory</h3>
                <p className="text-xs text-slate-500 mt-0.5">List of designated ambassadors, total clicks, conversions, and student lists.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                {dateFilter === "Custom Range" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <span className="text-slate-500 font-medium text-sm">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                )}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="All Time">All Time (Total Signups)</option>
                  <option value="This Week">This Week (Last 7 Days)</option>
                  <option value="This Month">This Month (Last 30 Days)</option>
                  <option value="Custom Range">Custom Date Range</option>
                </select>

                <select
                  value={appFilter}
                  onChange={(e) => setAppFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="All">All Features</option>
                  <option value="internship">Internship</option>
                  <option value="job portal">Job Portal</option>
                  <option value="ai resume">AI Resume</option>
                  <option value="ai interview">AI Interview</option>
                </select>
                
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Download CSV
                </button>
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
                  {processedAmbassadors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        No Campus Ambassadors assigned yet. Use the form above to designate a student as an Ambassador!
                      </td>
                    </tr>
                  ) : (
                    processedAmbassadors.map((amb) => {
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
                                {amb.displayUsesCount} Signups
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                onClick={() => setExpandedAmbassador(isExpanded ? null : amb._id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                              >
                                <Users className="w-3.5 h-3.5" />
                                View Users ({amb.filteredReferredUsers?.length || 0})
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
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                      <UserCheck className="w-4 h-4 text-purple-600" />
                                      Users Referred by {amb.name} ({amb.filteredReferredUsers?.length || 0})
                                    </h4>
                                    {amb.filteredReferredUsers && amb.filteredReferredUsers.length > 0 && (
                                      <button 
                                        onClick={() => handleDownloadAmbassadorReport(amb)}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                        Export List
                                      </button>
                                    )}
                                  </div>
                                  {amb.filteredReferredUsers && amb.filteredReferredUsers.length > 0 ? (
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
                                          {amb.filteredReferredUsers.map((u) => (
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
                                                {u.registeredAt ? new Date(u.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A"}
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
                                                <td className="py-2 px-3 text-slate-500">{ex.attemptedAt ? new Date(ex.attemptedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A"}</td>
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
