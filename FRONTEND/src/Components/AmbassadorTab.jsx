import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  GraduationCap,
  Copy,
  Check,
  Search,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  MousePointer,
  RefreshCw,
  Loader2,
  Award,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";

const AmbassadorTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedFeature, setCopiedFeature] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAmbassadorStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("studentToken") || localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

      const res = await axios.get(`${apiUrl}/api/student/ambassador-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Error fetching ambassador stats:", error);
      toast.error(error.response?.data?.message || "Failed to load Campus Ambassador data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbassadorStats();
  }, []);

  const getBaseUrl = () => window.location.origin;

  const links = [
    { title: "General Website Link", key: "general", url: `${getBaseUrl()}/?ref=${stats?.ambassadorCode || ""}` },
    { title: "Internship Application", key: "internship", url: `${getBaseUrl()}/registration?ref=${stats?.ambassadorCode || ""}` },
    { title: "AI Resume Builder", key: "resume", url: `${getBaseUrl()}/my-resumes?ref=${stats?.ambassadorCode || ""}` },
    { title: "AI Mock Interview", key: "interview", url: `${getBaseUrl()}/my-interviews?ref=${stats?.ambassadorCode || ""}` },
    { title: "Job Portal", key: "jobs", url: `${getBaseUrl()}/jobs?ref=${stats?.ambassadorCode || ""}` },
  ];

  const handleCopyLink = (url, key) => {
    navigator.clipboard.writeText(url);
    setCopiedFeature(key);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopiedFeature(null), 2000);
  };

  const filteredConversions = stats?.conversions?.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.mobile?.toLowerCase().includes(q) ||
      u.appliedFeatures?.toLowerCase().includes(q)
    );
  }) || [];

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold">Loading Campus Ambassador Portal...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Campus Ambassador Access Required</h3>
        <p className="text-sm text-slate-500 mt-1">Contact admin if you are an ambassador for your college.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile & College Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-purple-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                Official Campus Ambassador
              </span>
              {stats.ambassadorCollege && (
                <span className="text-xs font-bold text-purple-200">
                  • {stats.ambassadorCollege}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              Your Ambassador Referral Code:{" "}
              <span className="font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/20">
                {stats.ambassadorCode}
              </span>
            </h2>
          </div>
        </div>

        <button
          onClick={fetchAmbassadorStats}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Referral Link Clicks</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{stats.clicks}</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <MousePointer className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Successful Signups</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{stats.totalSignups}</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ambassador Status</span>
            <div className="text-lg font-black text-purple-600 mt-1 flex items-center gap-1.5">
              <Award className="w-5 h-5" /> Active Partner
            </div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Shareable Referral Links Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">Your Shareable Feature Referral Links</h3>
        </div>
        <p className="text-xs text-slate-500">
          Share these links with students in your college. When they register or apply using your link, they will be tracked under your ambassador profile.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((link) => {
            const isCopied = copiedFeature === link.key;
            return (
              <div key={link.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                <div>
                  <span className="font-bold text-xs text-slate-800">{link.title}</span>
                  <div className="font-mono text-[11px] text-slate-500 truncate mt-1 bg-white p-2 rounded-lg border border-slate-200">
                    {link.url}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleCopyLink(link.url, link.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-500/20"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referred Students Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Referred Students & Applied Features ({filteredConversions.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              List of all students who joined via your referral link, their phone numbers, and what features they applied for.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Student Name & Email</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">What They Applied For / Did</th>
                <th className="py-3 px-4">Date Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConversions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                    No referred students found matching your search.
                  </td>
                </tr>
              ) : (
                filteredConversions.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {user.email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {user.mobile || "N/A"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.appliedItems && user.appliedItems.length > 0 ? (
                          user.appliedItems.map((item, idx) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Registered</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {user.registeredAt ? new Date(user.registeredAt).toLocaleDateString("en-IN", {
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

export default AmbassadorTab;
