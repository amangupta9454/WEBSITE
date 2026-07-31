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
  ChevronRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";

const AllUsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, interns: 0, registered: 0 });
  const [filterType, setFilterType] = useState("all"); // 'all', 'intern', 'registered'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

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
        setStats(res.data.stats || { total: 0, interns: 0, registered: 0 });
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
            Overview of all registered accounts, interns, and sign-ups across Code-A-Nova.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Total Website Users
            </span>
            <Users className={`w-5 h-5 ${filterType === "all" ? "text-blue-200" : "text-blue-600"}`} />
          </div>
          <div className="text-3xl font-black mt-2">{stats.total}</div>
          <p className={`text-xs mt-1 ${filterType === "all" ? "text-blue-100" : "text-slate-500"}`}>
            All registered accounts
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
          onClick={() => setFilterType("registered")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            filterType === "registered"
              ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-purple-600 shadow-lg shadow-purple-500/25"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${filterType === "registered" ? "text-purple-100" : "text-slate-500"}`}>
              Registered / Non-Intern Users
            </span>
            <UserPlus className={`w-5 h-5 ${filterType === "registered" ? "text-purple-200" : "text-purple-600"}`} />
          </div>
          <div className="text-3xl font-black mt-2">{stats.registered}</div>
          <p className={`text-xs mt-1 ${filterType === "registered" ? "text-purple-100" : "text-slate-500"}`}>
            Signed up via Google or Form (No internships yet)
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setFilterType("all")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterType === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Users ({stats.total})
          </button>
          <button
            onClick={() => setFilterType("intern")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterType === "intern"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Interns Only ({stats.interns})
          </button>
          <button
            onClick={() => setFilterType("registered")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterType === "registered"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Registered Users ({stats.registered})
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
                  <th className="py-3.5 px-4">Account Type</th>
                  <th className="py-3.5 px-4">Mobile / Whatsapp</th>
                  <th className="py-3.5 px-4">Applications / Domains</th>
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
                      {user.isIntern ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <UserCheck className="w-3.5 h-3.5" /> Intern ({user.internshipsCount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <UserPlus className="w-3.5 h-3.5" /> Registered User
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {user.mobile || "N/A"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {user.appliedDomains && user.appliedDomains.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.appliedDomains.map((d, i) => (
                            <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                              {d}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No applications</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        <Award className="w-3.5 h-3.5" />
                        {user.interviewCredits}
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
                        onClick={() => setSelectedUser(user)}
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
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                  {selectedUser.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Details Cards */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Mobile Number</span>
                <span className="text-slate-800 font-bold text-sm">{selectedUser.mobile}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Account Role</span>
                <span className="text-slate-800 font-bold text-sm capitalize">{selectedUser.role}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Interview Tokens</span>
                <span className="text-indigo-600 font-bold text-sm">{selectedUser.interviewCredits} Credits</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block">Referred By Code</span>
                <span className="text-amber-700 font-mono font-bold text-sm">{selectedUser.referredByCode || "None (Direct)"}</span>
              </div>
            </div>

            {/* Internship Applications Breakdown */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Internship Applications ({selectedUser.internships?.length || 0})
              </h4>
              {selectedUser.internships && selectedUser.internships.length > 0 ? (
                <div className="space-y-3">
                  {selectedUser.internships.map((app, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-sm">{app.domain || "General"}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                          ID: {app.studentId}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div>Duration: <strong className="text-slate-800">{app.duration}</strong></div>
                        <div>Batch: <strong className="text-slate-800">{app.batch || "N/A"}</strong></div>
                        <div>Payment Status: <strong className={app.hasPaid ? "text-emerald-600" : "text-amber-600"}>{app.hasPaid ? "Paid" : "Unpaid"}</strong></div>
                        <div>Applied Date: <strong className="text-slate-800">{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "N/A"}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
                  This user has signed up but has not submitted any internship applications yet.
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsersAdmin;
