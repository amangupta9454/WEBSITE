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
  AlertTriangle,
  Lock,
  Star,
  MessageSquare,
  Users
} from "lucide-react";
import { toast } from "react-toastify";
import AmbassadorIdCardModal from "./AmbassadorIdCardModal";
import { Download } from "lucide-react";

const AmbassadorTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedFeature, setCopiedFeature] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        if (!res.data.ambassadorLinkedInPost) {
          setIsModalOpen(true);
        }
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

  // Fallback links if backend does not supply availableFeatures
  const rawFallbackLinks = [
    { title: "General Website Referral Link", key: "general", url: `${getBaseUrl()}/?ref=${stats?.ambassadorCode || ""}`, enabled: true, isFullWidth: true },
    { title: "Internship Application", key: "internship", url: `${getBaseUrl()}/registration?ref=${stats?.ambassadorCode || ""}`, enabled: stats?.featureFlags?.registrationEnabled !== false, isFullWidth: false },
    { title: "AI Resume Builder", key: "resume", url: `${getBaseUrl()}/my-resumes?ref=${stats?.ambassadorCode || ""}`, enabled: true, isFullWidth: false },
    { title: "AI Mock Interview", key: "interview", url: `${getBaseUrl()}/my-interviews?ref=${stats?.ambassadorCode || ""}`, enabled: stats?.featureFlags?.interviewEnabled !== false, isFullWidth: false },
    { title: "Job Portal", key: "jobs", url: `${getBaseUrl()}/jobs?ref=${stats?.ambassadorCode || ""}`, enabled: stats?.featureFlags?.jobPortalEnabled !== false, isFullWidth: false },
  ];

  // Dynamically build link list from backend availableFeatures (future proof)
  const availableLinks = stats?.availableFeatures
    ? stats.availableFeatures
        .filter((f) => f.enabled !== false)
        .map((f) => ({
          title: f.title,
          key: f.id,
          url: `${getBaseUrl()}${f.path || "/"}?ref=${stats?.ambassadorCode || ""}`,
          isFullWidth: Boolean(f.isFullWidth || f.id === "general"),
        }))
    : rawFallbackLinks.filter((l) => l.enabled);

  const handleCopyLink = (url, key) => {
    if (stats?.isActive === false) {
      toast.warning("Admin marked your Ambassador account as Inactive. Referral links are currently paused.");
      return;
    }
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
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-full overflow-hidden">
      {/* Inactive Account Alert Banner */}
      {stats.isActive === false && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-5 rounded-2xl shadow-sm flex items-start gap-3.5 border border-amber-200 animate-in fade-in duration-300">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-900 font-bold text-sm sm:text-base">Admin Marked Your Account as Inactive</h3>
            <p className="text-amber-800 text-xs sm:text-sm mt-1 leading-relaxed">
              Your Campus Ambassador referral links & tracking are currently marked inactive by Admin. Referral tracking is paused. Please contact support for assistance.
            </p>
          </div>
        </div>
      )}

      {/* Profile & College Banner (Compact Height) */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-purple-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 max-w-full">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs">
              <span className="font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-md border border-purple-400/30">
                Official Campus Ambassador
              </span>
              {stats.ambassadorCollege && (
                <span className="font-bold text-purple-200 truncate">
                  • {stats.ambassadorCollege}
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-white flex flex-wrap items-center gap-2 pt-0.5">
              <span>Ambassador Code:</span>
              <span className="font-mono text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-400/30 text-xs sm:text-sm font-bold inline-block">
                {stats.ambassadorCode}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={fetchAmbassadorStats}
          className="flex items-center justify-center gap-1.5 w-full md:w-auto px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all border border-white/10 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
        </button>
      </div>

      {/* Download ID Card Button */}
      <div className="flex justify-center my-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
        >
          <Download className="w-5 h-5" />
          Download Ambassador ID Card
        </button>
      </div>

      {isModalOpen && (
        <AmbassadorIdCardModal 
          stats={stats} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(url) => {
            setStats({...stats, ambassadorLinkedInPost: url});
            setIsModalOpen(false);
            toast.success("Successfully verified! Dashboard unlocked.");
          }} 
        />
      )}

      {/* Join Official Ambassador Group Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm sm:text-base flex flex-wrap items-center gap-2">
              <span>Join Official Campus Ambassador Group</span>
              <span className="bg-emerald-400/30 text-emerald-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-300/30">
                Official Community
              </span>
            </h3>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Connect with fellow Campus Ambassadors, get exclusive updates, guidance, & rewards announcements!
            </p>
          </div>
        </div>

        <a
          href={stats.ambassadorGroupUrl || "https://chat.whatsapp.com/"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow-md transition-all shrink-0 w-full sm:w-auto"
        >
          <Users className="w-4 h-4 text-emerald-700" />
          Join WhatsApp Group Now
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Link Clicks</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.clicks}</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <MousePointer className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Successful Signups</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.totalSignups}</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Ambassador Status</span>
            <div className="mt-1">
              {stats.isActive !== false ? (
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Award className="w-4 h-4" /> Active Partner
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Lock className="w-4 h-4" /> Inactive (Paused)
                </span>
              )}
            </div>
          </div>
          <div className={`p-2.5 sm:p-3 rounded-2xl ${stats.isActive !== false ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-600"}`}>
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Shareable Referral Links Box */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Your Shareable Feature Referral Links</h3>
        </div>
        <p className="text-xs text-slate-500">
          Share these links with students in your college. When they register or apply using your link, they will be tracked under your ambassador profile.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {availableLinks.map((link) => {
            const isCopied = copiedFeature === link.key;

            if (link.isFullWidth) {
              return (
                <div
                  key={link.key}
                  className="col-span-1 md:col-span-2 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl shadow-xl border border-purple-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-2 min-w-0 w-full sm:w-auto flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3 fill-slate-950" /> Primary Link
                      </span>
                      <h4 className="font-black text-sm sm:text-base text-white tracking-wide uppercase">
                        {link.title}
                      </h4>
                    </div>
                    <div className="font-mono font-bold text-xs sm:text-sm text-amber-300 bg-black/40 p-3 rounded-xl border border-purple-500/30 break-all shadow-inner">
                      {link.url}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyLink(link.url, link.key)}
                    disabled={stats?.isActive === false}
                    className={`shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all w-full sm:w-auto ${
                      stats?.isActive === false
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25"
                    }`}
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {isCopied ? "Copied!" : "Copy General Link"}
                  </button>
                </div>
              );
            }

            return (
              <div key={link.key} className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-800">{link.title}</span>
                  <div className="font-mono text-[11px] text-slate-500 truncate mt-1 bg-white p-2 rounded-lg border border-slate-200 break-all">
                    {link.url}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleCopyLink(link.url, link.key)}
                    disabled={stats?.isActive === false}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      stats?.isActive === false
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-500/20"
                    }`}
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
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
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
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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
