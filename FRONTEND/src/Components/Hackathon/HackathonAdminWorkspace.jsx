import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Trophy,
  Users,
  Settings as SettingsIcon,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Send,
  Award,
  ShieldAlert,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Code2,
  Flame,
  Calendar,
  Layers,
  Sparkles,
  Info,
  UploadCloud,
  Search,
  Filter,
  Eye,
  Edit2,
  PlusCircle,
  Github,
  Globe,
  Linkedin,
  Video,
  Unlock,
  Lock,
} from "lucide-react";
import UnstopImportModal from "./UnstopImportModal";
import TeamDetailDrawer from "./TeamDetailDrawer";
import TeamFormModal from "./TeamFormModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5006";

export default function HackathonAdminWorkspace() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [stats, setStats] = useState({
    totalTeams: 0,
    pptSubmitted: 0,
    underReview: 0,
    shortlisted: 0,
    paymentPending: 0,
    confirmed: 0,
    finalSubmissions: 0,
    evaluated: 0,
  });
  const [settings, setSettings] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Unstop Import & Teams State
  const [showImportModal, setShowImportModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsPage, setTeamsPage] = useState(1);
  const [teamsTotalPages, setTeamsTotalPages] = useState(1);
  const [teamsTotal, setTeamsTotal] = useState(0);
  const [teamsSearch, setTeamsSearch] = useState("");
  const [teamsStatusFilter, setTeamsStatusFilter] = useState("");
  const [teamsTrackFilter, setTeamsTrackFilter] = useState("");
  const [teamsPaymentFilter, setTeamsPaymentFilter] = useState("");

  // Phase 3: Team Profile Drawer & Action Modals State
  const [selectedTeamIdForDrawer, setSelectedTeamIdForDrawer] = useState(null);
  const [showTeamDrawer, setShowTeamDrawer] = useState(false);
  const [showTeamFormModal, setShowTeamFormModal] = useState(false);
  const [teamFormMode, setTeamFormMode] = useState("create");
  const [selectedTeamForForm, setSelectedTeamForForm] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeamForDelete, setSelectedTeamForDelete] = useState(null);

  const fetchTeams = async (page = 1) => {
    try {
      setLoadingTeams(true);
      const token = getAdminToken();
      let url = `${BACKEND_URL}/api/hackathon/admin/teams?page=${page}&limit=15`;
      if (teamsSearch) url += `&search=${encodeURIComponent(teamsSearch)}`;
      if (teamsStatusFilter) url += `&status=${encodeURIComponent(teamsStatusFilter)}`;
      if (teamsTrackFilter) url += `&track=${encodeURIComponent(teamsTrackFilter)}`;
      if (teamsPaymentFilter) url += `&paymentStatus=${encodeURIComponent(teamsPaymentFilter)}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setTeams(res.data.teams || []);
        setTeamsPage(res.data.pagination?.page || 1);
        setTeamsTotalPages(res.data.pagination?.totalPages || 1);
        setTeamsTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("fetchTeams error:", err);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Phase 5: Submissions Management State
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsTotalPages, setSubmissionsTotalPages] = useState(1);
  const [submissionsTotal, setSubmissionsTotal] = useState(0);
  const [submissionsSearch, setSubmissionsSearch] = useState("");
  const [submissionsStatusFilter, setSubmissionsStatusFilter] = useState("ALL");
  const [submissionsTrackFilter, setSubmissionsTrackFilter] = useState("ALL");

  const fetchSubmissions = async (page = 1) => {
    try {
      setLoadingSubmissions(true);
      const token = getAdminToken();
      let url = `${BACKEND_URL}/api/hackathon/admin/submissions?page=${page}&limit=15`;
      if (submissionsSearch) url += `&search=${encodeURIComponent(submissionsSearch)}`;
      if (submissionsStatusFilter && submissionsStatusFilter !== "ALL") {
        url += `&status=${encodeURIComponent(submissionsStatusFilter)}`;
      }
      if (submissionsTrackFilter && submissionsTrackFilter !== "ALL") {
        url += `&track=${encodeURIComponent(submissionsTrackFilter)}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setSubmissions(res.data.submissions || []);
        setSubmissionsPage(res.data.pagination?.page || 1);
        setSubmissionsTotalPages(res.data.pagination?.totalPages || 1);
        setSubmissionsTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("fetchSubmissions error:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleWorkspaceUnlockSubmission = async (submissionId, teamId) => {
    const confirmUnlock = window.confirm(
      "Are you sure you want to unlock this team's submission? The team leader will be permitted to edit and re-submit."
    );
    if (!confirmUnlock) return;

    try {
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/submissions/${submissionId || teamId}/unlock`,
        { reason: "Admin unlocked submission from Submissions tab" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Submission unlocked successfully");
        fetchSubmissions(submissionsPage);
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unlock submission");
    }
  };

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    tagline: "",
    description: "",
    startDate: "",
    endDate: "",
    submissionDeadline: "",
    resultDate: "",
    participationFee: 49,
    whatsAppLink: "",
    rules: [],
    tracks: [],
    isRegistrationOpen: true,
    isSubmissionOpen: false,
    isResultsPublished: false,
  });

  const [newRule, setNewRule] = useState("");
  const [newTrack, setNewTrack] = useState({ name: "", description: "" });

  const getAdminToken = () => {
    return localStorage.getItem("adminToken") || localStorage.getItem("token");
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setStats(res.data.stats || {});
        setSettings(res.data.settings || {});
        setRecentLogs(res.data.recentLogs || []);

        if (res.data.settings) {
          const s = res.data.settings;
          setSettingsForm({
            name: s.name || "",
            tagline: s.tagline || "",
            description: s.description || "",
            startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0, 16) : "",
            endDate: s.endDate ? new Date(s.endDate).toISOString().slice(0, 16) : "",
            submissionDeadline: s.submissionDeadline
              ? new Date(s.submissionDeadline).toISOString().slice(0, 16)
              : "",
            resultDate: s.resultDate ? new Date(s.resultDate).toISOString().slice(0, 16) : "",
            participationFee: s.participationFee ?? 49,
            whatsAppLink: s.whatsAppLink || "",
            rules: s.rules || [],
            tracks: s.tracks || [],
            isRegistrationOpen: s.isRegistrationOpen ?? true,
            isSubmissionOpen: s.isSubmissionOpen ?? false,
            isResultsPublished: s.isResultsPublished ?? false,
          });
        }
      }
    } catch (err) {
      console.error("fetchOverview error:", err);
      toast.error(err.response?.data?.message || "Failed to load hackathon overview");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    try {
      setLoadingLogs(true);
      const token = getAdminToken();
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/admin/audit-logs?page=${page}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setAuditLogs(res.data.logs || []);
        setAuditPage(res.data.pagination?.page || 1);
        setAuditTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("fetchAuditLogs error:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "audit_logs") {
      fetchAuditLogs(1);
    }
    if (activeTab === "teams") {
      fetchTeams(1);
    }
    if (activeTab === "submissions") {
      fetchSubmissions(1);
    }
  }, [activeTab, teamsStatusFilter, teamsTrackFilter, submissionsStatusFilter, submissionsTrackFilter]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const token = getAdminToken();
      const payload = {
        ...settingsForm,
        startDate: settingsForm.startDate ? new Date(settingsForm.startDate) : undefined,
        endDate: settingsForm.endDate ? new Date(settingsForm.endDate) : undefined,
        submissionDeadline: settingsForm.submissionDeadline
          ? new Date(settingsForm.submissionDeadline)
          : undefined,
        resultDate: settingsForm.resultDate ? new Date(settingsForm.resultDate) : undefined,
      };

      const res = await axios.put(`${BACKEND_URL}/api/hackathon/admin/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        toast.success("Hackathon settings updated successfully!");
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error("handleSaveSettings error:", err);
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setSettingsForm((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule.trim()],
    }));
    setNewRule("");
  };

  const handleRemoveRule = (index) => {
    setSettingsForm((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleAddTrack = () => {
    if (!newTrack.name.trim()) return;
    setSettingsForm((prev) => ({
      ...prev,
      tracks: [...prev.tracks, { ...newTrack }],
    }));
    setNewTrack({ name: "", description: "" });
  };

  const handleRemoveTrack = (index) => {
    setSettingsForm((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Workspace Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> Phase 1 Foundation Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Code-A-Nova Workspace
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              Hackathon Management Workspace
            </h1>
            <p className="text-sm text-indigo-200/80">
              One centralized hub for participant lifecycle, team reviews, shortlisting, judging, and settings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Import Unstop Excel
            </button>
            <a
              href="/hackathon"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shadow-sm backdrop-blur-md"
            >
              <ExternalLink className="w-4 h-4 text-indigo-300" />
              Preview /hackathon
            </a>
            <button
              onClick={fetchOverview}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Centralized Workspace Sub-Tabs Navigation */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: Layers, badge: null },
            { id: "teams", label: "Teams", icon: Users, badge: stats.totalTeams > 0 ? `${stats.totalTeams} Teams` : "Active" },
            { id: "editorial", label: "Editorial & Judges", icon: Award, badge: "Phase 9" },
            {
              id: "submissions",
              label: "Submissions",
              icon: FileText,
              badge: stats.finalSubmissions > 0 ? `${stats.finalSubmissions} Submissions` : "Active",
            },
            { id: "judging", label: "Judging", icon: Sparkles, badge: "Phase 10" },
            { id: "results", label: "Results", icon: Trophy, badge: "Phase 11" },
            { id: "certificates", label: "Certificates", icon: CheckCircle2, badge: "Phase 12" },
            { id: "settings", label: "Settings", icon: SettingsIcon, badge: "Active" },
            { id: "audit_logs", label: "Audit Logs", icon: ShieldAlert, badge: "Active" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 shadow-md scale-102"
                    : "text-indigo-200/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-indigo-300"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                      tab.badge === "Active"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-700/60 text-slate-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "Total Teams", val: stats.totalTeams, color: "from-blue-600 to-indigo-600", icon: Users },
              { label: "PPT Submitted", val: stats.pptSubmitted, color: "from-indigo-600 to-violet-600", icon: FileText },
              { label: "Under Review", val: stats.underReview, color: "from-amber-600 to-orange-600", icon: Clock },
              { label: "Shortlisted", val: stats.shortlisted, color: "from-emerald-600 to-teal-600", icon: Award },
              { label: "Payment Pending", val: stats.paymentPending, color: "from-rose-600 to-pink-600", icon: CreditCard },
              { label: "Confirmed", val: stats.confirmed, color: "from-green-600 to-emerald-600", icon: CheckCircle2 },
              { label: "Submissions", val: stats.finalSubmissions, color: "from-cyan-600 to-blue-600", icon: Code2 },
              { label: "Evaluated", val: stats.evaluated, color: "from-purple-600 to-fuchsia-600", icon: Trophy },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 line-clamp-1">{card.label}</span>
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                    {loading ? "..." : card.val}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                    Live database count
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hackathon Status & Live Schedule Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Active Hackathon Schedule & Timelines
                  </h3>
                  <p className="text-xs text-slate-500">Configured dates that power participant countdown timers</p>
                </div>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <SettingsIcon className="w-3.5 h-3.5" /> Modify Dates
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Start Date</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {settings?.startDate ? new Date(settings.startDate).toLocaleDateString() : "Not scheduled"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {settings?.startDate ? new Date(settings.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Submission Deadline</div>
                  <div className="text-sm font-bold text-amber-700 mt-1">
                    {settings?.submissionDeadline ? new Date(settings.submissionDeadline).toLocaleDateString() : "Not scheduled"}
                  </div>
                  <div className="text-[10px] text-amber-600/80">
                    {settings?.submissionDeadline ? new Date(settings.submissionDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">End Date</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {settings?.endDate ? new Date(settings.endDate).toLocaleDateString() : "Not scheduled"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {settings?.endDate ? new Date(settings.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Participation Fee</div>
                  <div className="text-base font-black text-emerald-600 mt-1">
                    ₹{settings?.participationFee ?? 49}
                    <span className="text-[10px] text-slate-400 font-normal"> / team</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Configurable in settings</div>
                </div>
              </div>

              {/* Status Toggles Display */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        settings?.isRegistrationOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Registration: {settings?.isRegistrationOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        settings?.isSubmissionOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Final Submission: {settings?.isSubmissionOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        settings?.isResultsPublished ? "bg-purple-500 animate-pulse" : "bg-slate-300"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Results: {settings?.isResultsPublished ? "Published" : "Hidden"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
                >
                  Configure Toggles →
                </button>
              </div>
            </div>

            {/* Recent Audit Log Preview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  Recent Audit Trail
                </h3>
                <button
                  onClick={() => setActiveTab("audit_logs")}
                  className="text-xs font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
                >
                  View All ({recentLogs.length})
                </button>
              </div>

              <div className="space-y-3">
                {recentLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    No actions recorded yet. Audit records will appear when settings or team statuses are changed.
                  </div>
                ) : (
                  recentLogs.slice(0, 5).map((log) => (
                    <div key={log._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{log.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        By <span className="font-semibold">{log.actorName}</span> ({log.role}) • {log.reason || "General update"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: SETTINGS ─── */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-indigo-600" />
                Hackathon Configuration & Rules
              </h2>
              <p className="text-xs text-slate-500">
                All values here are dynamic and immediately reflect across the participant portal and admin dashboards.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${savingSettings ? "animate-spin" : ""}`} />
              {savingSettings ? "Saving Changes..." : "Save All Settings"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">1. Basic Information</h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hackathon Name</label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={settingsForm.tagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Participation Confirmation Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settingsForm.participationFee}
                  onChange={(e) => setSettingsForm({ ...settingsForm, participationFee: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  PRD standard is ₹49 per shortlisted team. Configurable without code edits.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official WhatsApp Group Invite Link
                </label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={settingsForm.whatsAppLink}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsAppLink: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Per PRD rules: Only teams with CONFIRMED / PAID status can view this link.
                </p>
              </div>
            </div>

            {/* Dates & Schedule */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">2. Schedule & Deadlines</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={settingsForm.startDate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={settingsForm.endDate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline</label>
                  <input
                    type="datetime-local"
                    value={settingsForm.submissionDeadline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, submissionDeadline: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Results Announcement Date</label>
                  <input
                    type="datetime-local"
                    value={settingsForm.resultDate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, resultDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700">Feature Status Toggles</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-150 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.isRegistrationOpen}
                      onChange={(e) => setSettingsForm({ ...settingsForm, isRegistrationOpen: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Registration Open (Accepting participant logins & queries)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-150 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.isSubmissionOpen}
                      onChange={(e) => setSettingsForm({ ...settingsForm, isSubmissionOpen: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Final Submission Open (Allow confirmed teams to submit GitHub & Demo links)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-150 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.isResultsPublished}
                      onChange={(e) => setSettingsForm({ ...settingsForm, isResultsPublished: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Publish Results (Display winners and score rankings to participants)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Rules & Tracks Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Rules */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">3. Official Rules</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a new hackathon rule..."
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRule();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {settingsForm.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-xs text-slate-700"
                  >
                    <span>
                      {idx + 1}. {rule}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracks */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">4. Innovation Tracks</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Track Name (e.g. AI & Machine Learning)"
                  value={newTrack.name}
                  onChange={(e) => setNewTrack({ ...newTrack, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Short Track Description..."
                    value={newTrack.description}
                    onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTrack();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTrack}
                    className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {settingsForm.tracks.map((track, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-xs text-slate-700 flex items-start justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{track.name}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{track.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTrack(idx)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ─── TAB: AUDIT LOGS ─── */}
      {activeTab === "audit_logs" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                Immutable System Audit Logs
              </h2>
              <p className="text-xs text-slate-500">
                Detailed audit trail of administrative modifications, settings adjustments, and judging activities.
              </p>
            </div>
            <button
              onClick={() => fetchAuditLogs(auditPage)}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} /> Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No audit records found yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{log.actorName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {log.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-indigo-600">{log.action}</span>
                      </td>
                      <td className="p-3 text-slate-500">{log.targetEntity}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{log.reason || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {auditTotalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                disabled={auditPage <= 1}
                onClick={() => fetchAuditLogs(auditPage - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {auditPage} of {auditTotalPages}
              </span>
              <button
                disabled={auditPage >= auditTotalPages}
                onClick={() => fetchAuditLogs(auditPage + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: TEAMS MANAGEMENT (PHASE 3) ─── */}
      {activeTab === "teams" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Hackathon Teams ({teamsTotal})
              </h2>
              <p className="text-xs text-slate-500">
                Manage, review, edit, and evaluate all imported and manual hackathon teams.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setTeamFormMode("create");
                  setSelectedTeamForForm(null);
                  setShowTeamFormModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Team
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Import Unstop Excel
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by team name, team ID, leader email or Unstop ID..."
                value={teamsSearch}
                onChange={(e) => setTeamsSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTeams(1)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={teamsTrackFilter}
              onChange={(e) => setTeamsTrackFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
            >
              <option value="">All Tracks</option>
              {(settings?.tracks || []).map((t, idx) => (
                <option key={idx} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={teamsStatusFilter}
              onChange={(e) => setTeamsStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="IMPORTED">Imported</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="REJECTED">Rejected</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="EVALUATED">Evaluated</option>
            </select>
            <select
              value={teamsPaymentFilter}
              onChange={(e) => setTeamsPaymentFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
            >
              <option value="">All Payments</option>
              <option value="PAID">Paid (₹49)</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="NOT_REQUIRED">Not Required</option>
            </select>
            <button
              onClick={() => fetchTeams(1)}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Filter
            </button>
          </div>

          {/* Teams Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Team ID</th>
                  <th className="p-3">Team Name</th>
                  <th className="p-3">Leader</th>
                  <th className="p-3">Track</th>
                  <th className="p-3">Members</th>
                  <th className="p-3">PPT / Idea</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Source</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingTeams ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Loading team records...
                    </td>
                  </tr>
                ) : teams.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center space-y-3">
                      <div className="text-slate-400 text-sm font-semibold">No teams found matching your query.</div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setTeamFormMode("create");
                            setSelectedTeamForForm(null);
                            setShowTeamFormModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Add Team Manually
                        </button>
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4" /> Import Teams from Unstop
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  teams.map((t) => {
                    let statusBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                    if (t.status === "SHORTLISTED") {
                      statusBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    } else if (t.status === "REJECTED") {
                      statusBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                    } else if (t.status === "UNDER_REVIEW") {
                      statusBadgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                    } else if (t.status === "IMPORTED") {
                      statusBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                    }

                    return (
                      <tr key={t._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-3 font-mono font-bold text-indigo-600">
                          <button
                            onClick={() => {
                              setSelectedTeamIdForDrawer(t.teamId);
                              setShowTeamDrawer(true);
                            }}
                            className="hover:underline text-left cursor-pointer"
                          >
                            {t.teamId}
                          </button>
                          {t.unstopApplicationId && (
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              {t.unstopApplicationId}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedTeamIdForDrawer(t.teamId);
                              setShowTeamDrawer(true);
                            }}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors cursor-pointer"
                          >
                            {t.teamName}
                          </button>
                          <div className="text-[10px] text-slate-400">
                            Created {new Date(t.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{t.leader?.name || "—"}</div>
                          <div className="text-[11px] text-slate-400">{t.leader?.email}</div>
                        </td>
                        <td className="p-3 text-slate-600">{t.track}</td>
                        <td className="p-3 text-slate-500">{(t.members || []).length + 1} members</td>
                        <td className="p-3 max-w-xs">
                          <div className="font-semibold text-slate-800 truncate">{t.initialIdea?.title || "—"}</div>
                          {t.initialIdea?.pptUrl ? (
                            <a
                              href={t.initialIdea.pptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1"
                            >
                              View PPT <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No PPT</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeClass}`}
                            >
                              {t.status}
                            </span>
                            {t.status === "SHORTLISTED" && (
                              <div className="text-[9px]">
                                {t.shortlistEmailStatus === "SENT" ? (
                                  <span className="text-emerald-600 font-semibold">✉️ Sent</span>
                                ) : t.shortlistEmailStatus === "FAILED" ? (
                                  <span className="text-rose-600 font-semibold">✉️ Failed</span>
                                ) : (
                                  <span className="text-slate-400 font-medium">✉️ Not sent</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {t.paymentStatus === "PAID" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid (₹49)
                            </span>
                          ) : t.paymentStatus === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" /> Failed
                            </span>
                          ) : t.status === "SHORTLISTED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Due (₹49)
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              {t.paymentStatus || "—"}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {t.source === "MANUAL_ADMIN" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              Manual
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                              Unstop
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedTeamIdForDrawer(t.teamId);
                                setShowTeamDrawer(true);
                              }}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="View Full Profile & Review"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTeamForForm(t);
                                setTeamFormMode("edit");
                                setShowTeamFormModal(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit Team"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTeamForDelete(t);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Team"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {teamsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={teamsPage <= 1}
                onClick={() => fetchTeams(teamsPage - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {teamsPage} of {teamsTotalPages} ({teamsTotal} total teams)
              </span>
              <button
                disabled={teamsPage >= teamsTotalPages}
                onClick={() => fetchTeams(teamsPage + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── PHASE 5: SUBMISSIONS MANAGEMENT TAB (Step 16) ─── */}
      {activeTab === "submissions" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Phase 5 Module
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {submissionsTotal} Total Records
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">Project Submissions Workspace</h2>
              <p className="text-xs text-slate-500">
                Inspect code repositories, hosted deployments, demo videos, and locked snapshots submitted by confirmed teams.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchSubmissions(submissionsPage)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSubmissions ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search project, team, email, team ID..."
                value={submissionsSearch}
                onChange={(e) => setSubmissionsSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    fetchSubmissions(1);
                  }
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <select
                value={submissionsStatusFilter}
                onChange={(e) => setSubmissionsStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ALL">All Submission States</option>
                <option value="SUBMITTED">Submitted & Locked Only</option>
                <option value="DRAFT">Draft In Progress Only</option>
                <option value="NOT_STARTED">Not Started Only</option>
              </select>
            </div>

            <div>
              <select
                value={submissionsTrackFilter}
                onChange={(e) => setSubmissionsTrackFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ALL">All Tracks</option>
                {(settingsForm.tracks || []).map((t, idx) => (
                  <option key={idx} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          {loadingSubmissions ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No project submissions found</p>
              <p className="text-xs text-slate-500">
                Try adjusting your search keywords, status filter, or track filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Team & ID</th>
                    <th className="py-3 px-4">Leader / Submitter</th>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4">Project Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4">Deliverables</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => {
                    const teamData = sub.team || {};
                    return (
                      <tr key={sub._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{teamData.teamName || sub.teamId}</div>
                          <div className="text-[11px] text-slate-500">{sub.teamId}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {sub.submitterName || teamData.leader?.name || "—"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {sub.submitterEmail || teamData.leader?.email || "—"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {teamData.track || "General Track"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">
                            {sub.projectName || "Untitled Project"}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {sub.projectDescription || "No description provided"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {sub.status === "SUBMITTED" || sub.isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              SUBMITTED
                            </span>
                          ) : sub.status === "DRAFT" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              DRAFT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              NOT STARTED
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-slate-600 whitespace-nowrap">
                          {sub.submittedAt ? (
                            <div>
                              <div>{new Date(sub.submittedAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(sub.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not finalized</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {sub.githubUrl ? (
                              <a
                                href={sub.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                                title="Open GitHub Repository"
                              >
                                <Github className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="w-7 h-7 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center">
                                <Github className="w-3.5 h-3.5" />
                              </span>
                            )}

                            {sub.hostedProjectUrl ? (
                              <a
                                href={sub.hostedProjectUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors"
                                title="Open Hosted Project"
                              >
                                <Globe className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="w-7 h-7 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center">
                                <Globe className="w-3.5 h-3.5" />
                              </span>
                            )}

                            {sub.linkedInUrl ? (
                              <a
                                href={sub.linkedInUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center transition-colors"
                                title="Open LinkedIn Post"
                              >
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="w-7 h-7 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center">
                                <Linkedin className="w-3.5 h-3.5" />
                              </span>
                            )}

                            {sub.demoVideoUrl ? (
                              <a
                                href={sub.demoVideoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center transition-colors"
                                title="Open Demo Video"
                              >
                                <Video className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="w-7 h-7 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center">
                                <Video className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedTeamIdForDrawer(sub.teamId || teamData._id);
                                setShowTeamDrawer(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>

                            {sub.isLocked && (
                              <button
                                onClick={() => handleWorkspaceUnlockSubmission(sub._id, sub.teamId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                                title="Unlock submission"
                              >
                                <Unlock className="w-3 h-3" />
                                Unlock
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Submissions Pagination */}
          {submissionsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={submissionsPage <= 1}
                onClick={() => fetchSubmissions(submissionsPage - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {submissionsPage} of {submissionsTotalPages} ({submissionsTotal} total submissions)
              </span>
              <button
                disabled={submissionsPage >= submissionsTotalPages}
                onClick={() => fetchSubmissions(submissionsPage + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── PLACEHOLDER TABS (Scheduled for Later Phases) ─── */}
      {["editorial", "judging", "results", "certificates"].includes(activeTab) && (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-black text-slate-900 capitalize">
              {activeTab.replace("_", " ")} Module
            </h2>
            <p className="text-xs text-slate-500">
              This module is scheduled for development in accordance with the sequential phases outlined in{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-semibold">
                docs/Hackathon_PRD.md
              </code>
              .
            </p>
          </div>
          <div className="pt-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
              Foundation Active • Scheduled in Next Phase
            </span>
          </div>
        </div>
      )}

      {/* Unstop Import Modal */}
      <UnstopImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          fetchOverview();
          fetchTeams(1);
        }}
      />

      {/* Phase 3: Team Detail & Review Drawer */}
      <TeamDetailDrawer
        teamId={selectedTeamIdForDrawer}
        isOpen={showTeamDrawer}
        onClose={() => {
          setShowTeamDrawer(false);
          setSelectedTeamIdForDrawer(null);
        }}
        onTeamUpdated={() => {
          fetchTeams(teamsPage);
          fetchOverview();
        }}
        onOpenEdit={(team) => {
          setShowTeamDrawer(false);
          setSelectedTeamForForm(team);
          setTeamFormMode("edit");
          setShowTeamFormModal(true);
        }}
        onOpenDelete={(team) => {
          setShowTeamDrawer(false);
          setSelectedTeamForDelete(team);
          setShowDeleteModal(true);
        }}
      />

      {/* Phase 3: Team Form Modal (Create / Edit) */}
      <TeamFormModal
        isOpen={showTeamFormModal}
        mode={teamFormMode}
        team={selectedTeamForForm}
        tracks={settings?.tracks || []}
        onClose={() => {
          setShowTeamFormModal(false);
          setSelectedTeamForForm(null);
        }}
        onSuccess={() => {
          fetchTeams(teamsPage);
          fetchOverview();
        }}
      />

      {/* Phase 3: Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        team={selectedTeamForDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTeamForDelete(null);
        }}
        onDeleted={() => {
          fetchTeams(teamsPage);
          fetchOverview();
        }}
      />
    </div>
  );
}

