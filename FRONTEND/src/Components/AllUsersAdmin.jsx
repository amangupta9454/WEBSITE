import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Search,
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Award,
  Loader2,
  RefreshCw,
  Eye,
  X,
  BrainCircuit,
  FileText,
  ExternalLink,
  Github,
  Linkedin,
  IndianRupee,
  BookOpen
} from "lucide-react";
import { toast } from "react-toastify";

const AllUsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, interns: 0, registered: 0, quiz: 0 });
  const [filterType, setFilterType] = useState("all"); // 'all', 'intern', 'registered', 'quiz'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const handleViewDetails = async (userSummary) => {
    setLoadingDetails(true);
    setSelectedUser({ ...userSummary, isLoading: true });
    setActiveTab("profile");
    try {
      const token = localStorage.getItem("adminToken");
      const baseUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
      const res = await axios.get(`${baseUrl}/api/admin/users/${userSummary._id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSelectedUser({ 
          ...userSummary, 
          fullData: res.data.user, 
          quizzesData: res.data.quizzes, 
          isQuizOnly: res.data.isQuizOnly, 
          isLoading: false 
        });
      }
    } catch (err) {
      toast.error("Failed to fetch full user details");
      setSelectedUser(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const baseUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
      const res = await axios.get(
        `${baseUrl}/api/admin/users`,
        {
          params: { type: filterType, search: searchQuery },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setUsers(res.data.users);
        setStats(res.data.stats || { total: 0, interns: 0, registered: 0, quiz: 0 });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [filterType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            Website Users Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Overview of all registered accounts, interns, and quiz applicants across Code-A-Nova.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterType("all")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            filterType === "all"
              ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-600 shadow-lg shadow-blue-500/25"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${filterType === "all" ? "text-blue-100" : "text-slate-500"}`}>
              Total Users
            </span>
            <Users className={`w-5 h-5 ${filterType === "all" ? "text-blue-200" : "text-blue-600"}`} />
          </div>
          <div className="text-3xl font-black mt-2">{stats.total}</div>
          <p className={`text-xs mt-1 ${filterType === "all" ? "text-blue-100" : "text-slate-500"}`}>
            All registered accounts & applicants
          </p>
        </div>

        <div
          onClick={() => setFilterType("intern")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            filterType === "intern"
              ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-lg shadow-emerald-500/25"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${filterType === "intern" ? "text-emerald-100" : "text-slate-500"}`}>
              Enrolled Interns
            </span>
            <UserCheck className={`w-5 h-5 ${filterType === "intern" ? "text-emerald-200" : "text-emerald-600"}`} />
          </div>
          <div className="text-3xl font-black mt-2">{stats.interns}</div>
          <p className={`text-xs mt-1 ${filterType === "intern" ? "text-emerald-100" : "text-slate-500"}`}>
            Applied for 1 or more internships
          </p>
        </div>

        <div
          onClick={() => setFilterType("quiz")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            filterType === "quiz"
              ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-indigo-600 shadow-lg shadow-indigo-500/25"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${filterType === "quiz" ? "text-indigo-100" : "text-slate-500"}`}>
              Quiz Users
            </span>
            <BrainCircuit className={`w-5 h-5 ${filterType === "quiz" ? "text-indigo-200" : "text-indigo-600"}`} />
          </div>
          <div className="text-3xl font-black mt-2">{stats.quiz}</div>
          <p className={`text-xs mt-1 ${filterType === "quiz" ? "text-indigo-100" : "text-slate-500"}`}>
            Imported / Registered for Quizzes
          </p>
        </div>

        <div
          onClick={() => setFilterType("registered")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            filterType === "registered"
              ? "bg-gradient-to-br from-purple-600 to-pink-700 text-white border-purple-600 shadow-lg shadow-purple-500/25"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${filterType === "registered" ? "text-purple-100" : "text-slate-500"}`}>
              Registered / Signup Only
            </span>
            <UserPlus className={`w-5 h-5 ${filterType === "registered" ? "text-purple-200" : "text-purple-600"}`} />
          </div>
          <div className="text-3xl font-black mt-2">{stats.registered}</div>
          <p className={`text-xs mt-1 ${filterType === "registered" ? "text-purple-100" : "text-slate-500"}`}>
            Signed up on website with no activity yet
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterType === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Users ({stats.total})
          </button>
          <button
            onClick={() => setFilterType("intern")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterType === "intern"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Interns Only ({stats.interns})
          </button>
          <button
            onClick={() => setFilterType("quiz")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterType === "quiz"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Quiz Users ({stats.quiz})
          </button>
          <button
            onClick={() => setFilterType("registered")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterType === "registered"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Registered / Signup Only ({stats.registered})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium">Loading user directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No users found</h3>
            <p className="text-xs text-slate-500 mt-1">Try tweaking your search or filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">User Details</th>
                  <th className="py-3.5 px-4">Account / Badges</th>
                  <th className="py-3.5 px-4">Mobile / Whatsapp</th>
                  <th className="py-3.5 px-4">Applications & Quizzes</th>
                  <th className="py-3.5 px-4">Tokens</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {user.name}
                            {user.referredByCode && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
                                Ref: {user.referredByCode}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {user.isIntern && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck className="w-3.5 h-3.5" /> Intern ({user.internshipsCount})
                          </span>
                        )}
                        {user.isQuizUser && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" /> Quiz ({user.quizzesCount})
                          </span>
                        )}
                        {!user.isIntern && !user.isQuizUser && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <UserPlus className="w-3.5 h-3.5" /> Registered User
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {user.mobile || "N/A"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        {user.appliedDomains && user.appliedDomains.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {user.appliedDomains.map((d, i) => (
                              <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                        {user.quizzes && user.quizzes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {user.quizzes.map((q, i) => (
                              <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-100">
                                {q.quizName}
                              </span>
                            ))}
                          </div>
                        )}
                        {(!user.appliedDomains || user.appliedDomains.length === 0) && (!user.quizzes || user.quizzes.length === 0) && (
                          <span className="text-xs text-slate-400 italic">No applications</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        <Award className="w-3.5 h-3.5" />
                        {user.interviewCredits || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }) : "N/A"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-4">
                {selectedUser.fullData?.profileImage ? (
                  <img src={selectedUser.fullData.profileImage} alt="Profile" className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    {selectedUser.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    {selectedUser.name}
                    {selectedUser.isQuizOnly && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Quiz Only</span>}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedUser.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedUser.mobile || "N/A"}</span>
                    {!selectedUser.isQuizOnly && (
                      <span className="flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        <IndianRupee className="w-3.5 h-3.5" /> {selectedUser.fullData?.interviewCredits || 0} Tokens
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedUser.isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-500">Loading complete profile...</p>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="px-6 pt-4 border-b border-slate-100 flex gap-6 overflow-x-auto shrink-0 scrollbar-hide">
                  {[
                    { id: "profile", label: "Profile", icon: UserCheck },
                    { id: "platform", label: "Platform & Payments", icon: IndianRupee },
                    { id: "internships", label: `Internships (${selectedUser.fullData?.internships?.length || 0})`, icon: Briefcase },
                    { id: "quizzes", label: `Quizzes (${selectedUser.quizzesData?.length || 0})`, icon: BrainCircuit },
                    { id: "projects", label: "Projects & Tasks", icon: BookOpen }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-700"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  {/* Profile Tab */}
                  {activeTab === "profile" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Account Information</h4>
                          <div className="grid grid-cols-2 gap-y-3 text-sm">
                            <div className="text-slate-500">Role</div>
                            <div className="font-bold text-slate-900 capitalize">{selectedUser.fullData?.role || "User"}</div>
                            <div className="text-slate-500">Status</div>
                            <div className="font-bold text-slate-900">{selectedUser.fullData?.status || "Registered"}</div>
                            <div className="text-slate-500">Joined</div>
                            <div className="font-bold text-slate-900">{selectedUser.fullData?.createdAt ? new Date(selectedUser.fullData.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}</div>
                            <div className="text-slate-500">Referred By</div>
                            <div className="font-bold text-slate-900">{selectedUser.fullData?.referredByCode || "None"}</div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Social Links</h4>
                          <div className="space-y-3">
                            <a href={selectedUser.fullData?.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                              <Github className="w-4 h-4 text-slate-400" /> {selectedUser.fullData?.github || "Not provided"}
                            </a>
                            <a href={selectedUser.fullData?.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                              <Linkedin className="w-4 h-4 text-slate-400" /> {selectedUser.fullData?.linkedin || "Not provided"}
                            </a>
                            <a href={selectedUser.fullData?.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                              <ExternalLink className="w-4 h-4 text-slate-400" /> {selectedUser.fullData?.portfolio || "Not provided"}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Platform Tab */}
                  {activeTab === "platform" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                          <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Tokens</div>
                          <div className="text-2xl font-black text-indigo-950">{selectedUser.fullData?.interviewCredits || 0}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
                          <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Premium Status</div>
                          <div className="text-lg font-black text-amber-950 mt-1">{selectedUser.fullData?.jobPortalPremium ? "Active" : "Inactive"}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                          <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Free Resumes</div>
                          <div className="text-2xl font-black text-emerald-950">{selectedUser.fullData?.freeResumesGranted || 0}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                          <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Synergy Points</div>
                          <div className="text-2xl font-black text-blue-950">{selectedUser.fullData?.synergyPoints || 0}</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-emerald-600" /> Razorpay Payments Ledger
                          </h4>
                        </div>
                        {(!selectedUser.fullData?.interviewPayments || selectedUser.fullData.interviewPayments.length === 0) ? (
                          <div className="p-6 text-center text-sm font-medium text-slate-400 italic">No payments recorded.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="bg-white text-slate-400 text-xs uppercase font-bold border-b border-slate-100">
                                  <th className="p-3">Date</th>
                                  <th className="p-3">Package ID</th>
                                  <th className="p-3">Amount</th>
                                  <th className="p-3">Payment ID</th>
                                  <th className="p-3">Order ID</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {selectedUser.fullData.interviewPayments.map((p, i) => (
                                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 text-slate-600 font-medium">{new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="p-3 text-slate-800 font-bold">{p.packageId}</td>
                                    <td className="p-3 text-emerald-600 font-black">₹{p.amount}</td>
                                    <td className="p-3 text-slate-500 font-mono text-xs">{p.razorpayPaymentId}</td>
                                    <td className="p-3 text-slate-500 font-mono text-xs">{p.razorpayOrderId}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Internships Tab */}
                  {activeTab === "internships" && (
                    <div className="space-y-4">
                      {(!selectedUser.fullData?.internships || selectedUser.fullData.internships.length === 0) ? (
                        <div className="p-8 text-center text-sm font-medium text-slate-400 italic bg-white rounded-2xl border border-slate-200">No internship applications found.</div>
                      ) : (
                        selectedUser.fullData.internships.map((app, idx) => (
                          <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                              <h4 className="text-base font-black text-slate-900">{app.domain}</h4>
                              <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md font-bold text-xs tracking-wider">
                                ID: {app.studentId}
                              </span>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                              <div>
                                <span className="block text-xs font-bold text-slate-400 mb-1">Details</span>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between"><span className="text-slate-500">Duration:</span> <span className="font-bold text-slate-800">{app.duration} Months</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="font-bold text-slate-800">{app.internshipType}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Batch:</span> <span className="font-bold text-slate-800">{app.batch || "N/A"}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Applied:</span> <span className="font-bold text-slate-800">{new Date(app.appliedAt).toLocaleDateString('en-GB')}</span></div>
                                </div>
                              </div>
                              <div>
                                <span className="block text-xs font-bold text-slate-400 mb-1">Status</span>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between"><span className="text-slate-500">Payment:</span> <span className={`font-bold ${app.hasPaid ? 'text-emerald-600' : 'text-amber-600'}`}>{app.hasPaid ? `Paid (₹${app.paymentAmount || 0})` : 'Unpaid'}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Offer Letter:</span> <span className="font-bold text-slate-800">{app.offerLetterStatus}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Stipend:</span> <span className={`font-bold ${app.stipendStatus === 'Paid' ? 'text-emerald-600' : 'text-slate-800'}`}>{app.stipendStatus}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Certificate:</span> <span className="font-bold text-slate-800">{app.isCertificateSent ? "Sent" : "Pending"}</span></div>
                                </div>
                              </div>
                              <div className="col-span-full pt-2 mt-2 border-t border-slate-100">
                                <span className="block text-xs font-bold text-slate-400 mb-1">Why Hire?</span>
                                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{app.whyHire || "N/A"}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Quizzes Tab */}
                  {activeTab === "quizzes" && (
                    <div className="space-y-4">
                      {(!selectedUser.quizzesData || selectedUser.quizzesData.length === 0) ? (
                        <div className="p-8 text-center text-sm font-medium text-slate-400 italic bg-white rounded-2xl border border-slate-200">No quizzes found.</div>
                      ) : (
                        selectedUser.quizzesData.map((quiz, idx) => (
                          <div key={idx} className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-indigo-50 bg-indigo-50/30 flex justify-between items-center">
                              <h4 className="text-base font-black text-indigo-950">{quiz.quizName}</h4>
                              {quiz.registrationId && (
                                <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md font-bold text-xs tracking-wider">
                                  ID: {quiz.registrationId}
                                </span>
                              )}
                            </div>
                            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div><span className="block text-xs font-bold text-slate-400 mb-0.5">Score</span> <div className="font-black text-indigo-900 text-lg">{quiz.score || 0} / {quiz.totalScore || 0}</div></div>
                              <div><span className="block text-xs font-bold text-slate-400 mb-0.5">Percentage</span> <div className="font-black text-indigo-900 text-lg">{quiz.percentage || "N/A"}</div></div>
                              <div><span className="block text-xs font-bold text-slate-400 mb-0.5">Result</span> <div className={`font-black text-lg ${quiz.result === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>{quiz.result || "N/A"}</div></div>
                              <div><span className="block text-xs font-bold text-slate-400 mb-0.5">Imported</span> <div className="font-bold text-slate-700">{quiz.importedAt ? new Date(quiz.importedAt).toLocaleDateString('en-GB') : "N/A"}</div></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Projects Tab */}
                  {activeTab === "projects" && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                          <h4 className="text-sm font-black text-slate-800">Assigned Repos & Summer Projects</h4>
                        </div>
                        {(!selectedUser.fullData?.internships || selectedUser.fullData.internships.every(i => !i.assignedRepos || i.assignedRepos.length === 0)) ? (
                          <div className="p-6 text-center text-sm font-medium text-slate-400 italic">No assigned projects found.</div>
                        ) : (
                          <div className="p-4 space-y-4">
                            {selectedUser.fullData.internships.map(internship => 
                              internship.assignedRepos?.map((repo, idx) => (
                                <div key={`${internship._id}-${idx}`} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">{internship.domain || "General"}</div>
                                      <div className="font-bold text-slate-900">{repo.projectId?.title || "Project ID: " + repo.projectId}</div>
                                    </div>
                                    <div className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">SP: {repo.spAwarded || 0}</div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                                    <div>Review Status: <strong className="text-slate-900">{repo.reviewStatus}</strong></div>
                                    <div>Final Submitted: <strong className="text-slate-900">{repo.isFinalSubmitted ? "Yes" : "No"}</strong></div>
                                    <div className="col-span-full pt-1">
                                      Link: <a href={repo.repoLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{repo.repoLink}</a>
                                    </div>
                                    {repo.feedback && (
                                      <div className="col-span-full pt-2">
                                        <span className="text-xs font-bold text-slate-400 block mb-1">Feedback:</span>
                                        <div className="text-slate-700 bg-white p-2 rounded border border-slate-200 text-xs">{repo.feedback}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AllUsersAdmin;
