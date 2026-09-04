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
  AlertTriangle,
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
  EyeOff,
  Edit2,
  PlusCircle,
  Github,
  Globe,
  Linkedin,
  Unlock,
  Lock,
  UserCheck,
  UserX,
  KeyRound,
  RotateCcw,
  Medal,
  Check,
  X,
  Mail,
  Printer,
  Download,
  Gift,
  Tag,
  Building,
  Activity,
  DownloadCloud,
  FileSpreadsheet,
  AlertOctagon,
  Compass,
  Video,
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

  // ─── PHASE 6: EDITORIAL & JUDGES MANAGEMENT STATE ───
  const [editorialMembers, setEditorialMembers] = useState([]);
  const [loadingEditorialMembers, setLoadingEditorialMembers] = useState(false);
  const [editorialSearch, setEditorialSearch] = useState("");

  const [showCreateJudgeModal, setShowCreateJudgeModal] = useState(false);
  const [createJudgeForm, setCreateJudgeForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    isActive: true,
  });
  const [creatingJudge, setCreatingJudge] = useState(false);

  const [showResetJudgeModal, setShowResetJudgeModal] = useState(false);
  const [selectedJudgeForReset, setSelectedJudgeForReset] = useState(null);
  const [resetJudgePasswordForm, setResetJudgePasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [resettingJudgePassword, setResettingJudgePassword] = useState(false);

  const fetchEditorialMembers = async () => {
    try {
      setLoadingEditorialMembers(true);
      const token = getAdminToken();
      let url = `${BACKEND_URL}/api/hackathon/admin/editorial-members`;
      if (editorialSearch) url += `?search=${encodeURIComponent(editorialSearch)}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setEditorialMembers(res.data.members || []);
      }
    } catch (err) {
      console.error("fetchEditorialMembers error:", err);
    } finally {
      setLoadingEditorialMembers(false);
    }
  };

  const handleCreateJudge = async (e) => {
    e.preventDefault();
    if (!createJudgeForm.name || !createJudgeForm.email || !createJudgeForm.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (createJudgeForm.password !== createJudgeForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setCreatingJudge(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/editorial-members`,
        createJudgeForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Editorial Judge created successfully!");
        setShowCreateJudgeModal(false);
        setCreateJudgeForm({ name: "", email: "", password: "", confirmPassword: "", isActive: true });
        fetchEditorialMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create judge.");
    } finally {
      setCreatingJudge(false);
    }
  };

  const handleToggleJudgeActive = async (judge) => {
    try {
      const token = getAdminToken();
      const res = await axios.put(
        `${BACKEND_URL}/api/hackathon/admin/editorial-members/${judge._id}`,
        { isActive: !judge.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success(`Judge account ${!judge.isActive ? "activated" : "deactivated"} successfully.`);
        fetchEditorialMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update judge status.");
    }
  };

  const handleResetJudgePassword = async (e) => {
    e.preventDefault();
    if (resetJudgePasswordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (resetJudgePasswordForm.newPassword !== resetJudgePasswordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setResettingJudgePassword(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/editorial-members/${selectedJudgeForReset._id}/reset-password`,
        resetJudgePasswordForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Password reset successfully. Judge must change it on first login.");
        setShowResetJudgeModal(false);
        setResetJudgePasswordForm({ newPassword: "", confirmPassword: "" });
        setSelectedJudgeForReset(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setResettingJudgePassword(false);
    }
  };

  // ─── ASSIGNMENTS MANAGEMENT STATE ───
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignForm, setAssignForm] = useState({
    teamId: "",
    editorialMemberId: "",
    notes: "",
  });
  const [assigningJudge, setAssigningJudge] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const token = getAdminToken();
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/admin/editorial-assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setAssignments(res.data.assignments || []);
      }
    } catch (err) {
      console.error("fetchAssignments error:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignForm.teamId || !assignForm.editorialMemberId) {
      toast.error("Please select both a team and a judge.");
      return;
    }
    try {
      setAssigningJudge(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/editorial-assignments`,
        assignForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Project assigned to judge successfully!");
        setAssignForm({ teamId: "", editorialMemberId: "", notes: "" });
        fetchAssignments();
        fetchEditorialMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign project.");
    } finally {
      setAssigningJudge(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to remove this judge assignment?")) return;
    try {
      const token = getAdminToken();
      const res = await axios.delete(
        `${BACKEND_URL}/api/hackathon/admin/editorial-assignments/${assignmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Assignment removed successfully.");
        fetchAssignments();
        fetchEditorialMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove assignment.");
    }
  };

  // ─── JUDGING & EVALUATIONS STATE ───
  const [evaluations, setEvaluations] = useState([]);
  const [aggregatedResults, setAggregatedResults] = useState([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [evaluationsTrackFilter, setEvaluationsTrackFilter] = useState("ALL");
  const [evaluationsStatusFilter, setEvaluationsStatusFilter] = useState("ALL");

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedEvaluationToReopen, setSelectedEvaluationToReopen] = useState(null);
  const [reopenReasonText, setReopenReasonText] = useState("");
  const [reopeningEvaluation, setReopeningEvaluation] = useState(false);

  const fetchEvaluations = async () => {
    try {
      setLoadingEvaluations(true);
      const token = getAdminToken();
      let url = `${BACKEND_URL}/api/hackathon/admin/editorial-evaluations?`;
      if (evaluationsTrackFilter && evaluationsTrackFilter !== "ALL") {
        url += `&track=${encodeURIComponent(evaluationsTrackFilter)}`;
      }
      if (evaluationsStatusFilter && evaluationsStatusFilter !== "ALL") {
        url += `&status=${encodeURIComponent(evaluationsStatusFilter)}`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setEvaluations(res.data.evaluations || []);
        setAggregatedResults(res.data.aggregatedResults || []);
      }
    } catch (err) {
      console.error("fetchEvaluations error:", err);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  const handleReopenEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedEvaluationToReopen) return;
    try {
      setReopeningEvaluation(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/editorial-evaluations/${selectedEvaluationToReopen._id}/reopen`,
        { reason: reopenReasonText || "Admin reopened evaluation for review" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Evaluation reopened successfully. Judge can now edit scores.");
        setShowReopenModal(false);
        setSelectedEvaluationToReopen(null);
        setReopenReasonText("");
        fetchEvaluations();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reopen evaluation.");
    } finally {
      setReopeningEvaluation(false);
    }
  };

  // ==========================================
  // PHASE 7: RESULTS & WINNERS STATE & HANDLERS
  // ==========================================
  const [results, setResults] = useState([]);
  const [resultsSummary, setResultsSummary] = useState({
    total: 0,
    eligible: 0,
    pending: 0,
    ineligible: 0,
    ties: 0,
    approved: 0,
    published: 0,
    locked: 0,
  });
  const [resultsSetting, setResultsSetting] = useState({
    isResultsPublished: false,
    resultsLocked: false,
    resultsLockedAt: null,
    resultsLockedBy: null,
    winnerCategories: [],
  });
  const [loadingResults, setLoadingResults] = useState(false);
  const [calculatingResults, setCalculatingResults] = useState(false);
  const [resultsSearch, setResultsSearch] = useState("");
  const [resultsTrackFilter, setResultsTrackFilter] = useState("ALL");
  const [resultsStatusFilter, setResultsStatusFilter] = useState("ALL");

  // Inspection Drawer
  const [selectedResultDrilldown, setSelectedResultDrilldown] = useState(null);

  // Winner Assignment Modal State
  const [winnerModalResult, setWinnerModalResult] = useState(null);
  const [winnerCategoryInput, setWinnerCategoryInput] = useState("");
  const [winnerPrizeInput, setWinnerPrizeInput] = useState("");
  const [isWinnerInput, setIsWinnerInput] = useState(false);
  const [isRunnerUpInput, setIsRunnerUpInput] = useState(false);
  const [savingWinner, setSavingWinner] = useState(false);

  // Tie Resolution Modal State
  const [showTieModal, setShowTieModal] = useState(false);
  const [tieOrders, setTieOrders] = useState([]);
  const [tieBreakReason, setTieBreakReason] = useState("");
  const [resolvingTie, setResolvingTie] = useState(false);

  // Approval & Lock & Reopen Modals
  const [showApproveResultsModal, setShowApproveResultsModal] = useState(false);
  const [approvingResults, setApprovingResults] = useState(false);
  const [showLockResultsModal, setShowLockResultsModal] = useState(false);
  const [confirmLockChecked, setConfirmLockChecked] = useState(false);
  const [lockResultsReason, setLockResultsReason] = useState("");
  const [lockingResults, setLockingResults] = useState(false);
  const [showReopenResultsModal, setShowReopenResultsModal] = useState(false);
  const [reopenResultsReason, setReopenResultsReason] = useState("");
  const [reopeningResults, setReopeningResults] = useState(false);
  const [publishingResults, setPublishingResults] = useState(false);

  const fetchResults = async () => {
    try {
      setLoadingResults(true);
      const token = getAdminToken();
      let url = `${BACKEND_URL}/api/hackathon/admin/results?`;
      if (resultsTrackFilter && resultsTrackFilter !== "ALL") {
        url += `&track=${encodeURIComponent(resultsTrackFilter)}`;
      }
      if (resultsStatusFilter && resultsStatusFilter !== "ALL") {
        url += `&status=${encodeURIComponent(resultsStatusFilter)}`;
      }
      if (resultsSearch && resultsSearch.trim()) {
        url += `&search=${encodeURIComponent(resultsSearch.trim())}`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setResults(res.data.results || []);
        setResultsSummary(res.data.summary || {});
        if (res.data.setting) {
          setResultsSetting(res.data.setting);
        }
      }
    } catch (err) {
      console.error("fetchResults error:", err);
      toast.error(err.response?.data?.message || "Failed to load results");
    } finally {
      setLoadingResults(false);
    }
  };

  const handleCalculateResults = async () => {
    try {
      setCalculatingResults(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/results/calculate`,
        { hackathonId: "can-hackathon-2026" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success(res.data.message || "Results calculated successfully!");
        fetchResults();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to calculate results.");
    } finally {
      setCalculatingResults(false);
    }
  };

  const handleOpenWinnerModal = (item) => {
    setWinnerModalResult(item);
    setWinnerCategoryInput(item.category || "");
    setWinnerPrizeInput(item.prize || "");
    setIsWinnerInput(item.isWinner || false);
    setIsRunnerUpInput(item.isRunnerUp || false);
  };

  const handleSaveWinnerAssignment = async (e) => {
    e.preventDefault();
    if (!winnerModalResult) return;
    try {
      setSavingWinner(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/results/${winnerModalResult.teamId}/assign-winner`,
        {
          hackathonId: "can-hackathon-2026",
          category: winnerCategoryInput || null,
          prize: winnerPrizeInput || null,
          isWinner: isWinnerInput,
          isRunnerUp: isRunnerUpInput,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success(`Winner category assigned to ${winnerModalResult.teamName}`);
        setWinnerModalResult(null);
        fetchResults();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign winner.");
    } finally {
      setSavingWinner(false);
    }
  };

  const handleOpenTieModal = () => {
    const tiedTeams = results
      .filter((r) => r.rankingStatus === "TIE")
      .map((r) => ({ teamId: r.teamId, teamName: r.teamName, rank: r.rank || 1, finalScore: r.finalScore }));
    setTieOrders(tiedTeams);
    setTieBreakReason("");
    setShowTieModal(true);
  };

  const handleResolveTieSubmit = async (e) => {
    e.preventDefault();
    if (!tieBreakReason.trim()) {
      toast.error("Please provide an administrative tie-break reason.");
      return;
    }
    try {
      setResolvingTie(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/results/resolve-tie`,
        {
          hackathonId: "can-hackathon-2026",
          teamOrders: tieOrders.map((t) => ({ teamId: t.teamId, rank: Number(t.rank) })),
          tieBreakReason: tieBreakReason.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Tie successfully resolved!");
        setShowTieModal(false);
        fetchResults();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve tie.");
    } finally {
      setResolvingTie(false);
    }
  };

  const handleApproveResultsSubmit = async () => {
    try {
      setApprovingResults(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/results/approve`,
        { hackathonId: "can-hackathon-2026" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Official results approved!");
        setShowApproveResultsModal(false);
        fetchResults();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve results.");
    } finally {
      setApprovingResults(false);
    }
  };

  const handlePublishResultsToggle = async (shouldPublish) => {
    try {
      setPublishingResults(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/results/publish`,
        { hackathonId: "can-hackathon-2026", publish: shouldPublish },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchResults();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update publication status.");
    } finally {
      setPublishingResults(false);
    }
  };

  const handleLockResultsSubmit = async (e) => {
    e.preventDefault();
    if (!confirmLockChecked) {
      toast.error("Please check the confirmation box to lock results.");
      return;
    }
    try {
      setLockingResults(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/results/lock`,
        {
          hackathonId: "can-hackathon-2026",
          confirmLock: true,
          reason: lockResultsReason || "Official results locked by admin.",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Official results locked permanently!");
        setShowLockResultsModal(false);
        setConfirmLockChecked(false);
        setLockResultsReason("");
        fetchResults();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to lock results.");
    } finally {
      setLockingResults(false);
    }
  };

  const handleReopenResultsSubmit = async (e) => {
    e.preventDefault();
    if (!reopenResultsReason.trim()) {
      toast.error("A mandatory reason is required to unlock official results.");
      return;
    }
    try {
      setReopeningResults(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/results/reopen`,
        {
          hackathonId: "can-hackathon-2026",
          reason: reopenResultsReason.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Results unlocked for revisions!");
        setShowReopenResultsModal(false);
        setReopenResultsReason("");
        fetchResults();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reopen results.");
    } finally {
      setReopeningResults(false);
    }
  };

  // ─── PHASE 8: CERTIFICATES STATE & HANDLERS ───
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [certificatesPage, setCertificatesPage] = useState(1);
  const [certificatesTotalPages, setCertificatesTotalPages] = useState(1);
  const [certificatesTotal, setCertificatesTotal] = useState(0);
  const [certificatesSearch, setCertificatesSearch] = useState("");
  const [certificatesTypeFilter, setCertificatesTypeFilter] = useState("ALL");
  const [certificatesStatusFilter, setCertificatesStatusFilter] = useState("ALL");
  const [generatingCertificates, setGeneratingCertificates] = useState(false);
  const [emailingCertificates, setEmailingCertificates] = useState(false);
  const [selectedCertForRevoke, setSelectedCertForRevoke] = useState(null);
  const [revocationReasonInput, setRevocationReasonInput] = useState("");
  const [revokingCertificate, setRevokingCertificate] = useState(false);
  const [selectedCertForView, setSelectedCertForView] = useState(null);

  const fetchCertificates = async (page = 1) => {
    try {
      setLoadingCertificates(true);
      const token = getAdminToken();
      let url = `${BACKEND_URL}/api/hackathon/admin/certificates?page=${page}&limit=15`;
      if (certificatesSearch) url += `&search=${encodeURIComponent(certificatesSearch)}`;
      if (certificatesTypeFilter && certificatesTypeFilter !== "ALL") {
        url += `&type=${encodeURIComponent(certificatesTypeFilter)}`;
      }
      if (certificatesStatusFilter && certificatesStatusFilter !== "ALL") {
        url += `&status=${encodeURIComponent(certificatesStatusFilter)}`;
      }
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setCertificates(res.data.certificates || []);
        setCertificatesPage(res.data.pagination?.page || 1);
        setCertificatesTotalPages(res.data.pagination?.totalPages || 1);
        setCertificatesTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("fetchCertificates error:", err);
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleGenerateCertificates = async () => {
    if (!window.confirm("Generate certificates for all eligible participants based on finalized Phase 7 results? Existing valid certificates will be safely skipped.")) {
      return;
    }
    try {
      setGeneratingCertificates(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/certificates/generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success(res.data.message || `Generated ${res.data.generatedCount} certificates successfully!`);
        fetchCertificates(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate certificates");
    } finally {
      setGeneratingCertificates(false);
    }
  };

  const handleBulkEmailCertificates = async () => {
    if (!window.confirm("Send email with download and verification links to all active certificates that have not yet been emailed?")) {
      return;
    }
    try {
      setEmailingCertificates(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/certificates/email-bulk`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success(res.data.message || `Bulk dispatched ${res.data.sentCount} certificate emails!`);
        fetchCertificates(certificatesPage);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch certificate emails");
    } finally {
      setEmailingCertificates(false);
    }
  };

  const handleEmailSingleCertificate = async (certificateId) => {
    try {
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/certificates/${certificateId}/email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Certificate email dispatched successfully!");
        fetchCertificates(certificatesPage);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch email");
    }
  };

  const handleRevokeCertificateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCertForRevoke) return;
    if (!revocationReasonInput.trim()) {
      toast.error("Please state an administrative reason for revocation.");
      return;
    }
    try {
      setRevokingCertificate(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/certificates/${selectedCertForRevoke.certificateId}/revoke`,
        { reason: revocationReasonInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Certificate marked as REVOKED.");
        setSelectedCertForRevoke(null);
        setRevocationReasonInput("");
        fetchCertificates(certificatesPage);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke certificate");
    } finally {
      setRevokingCertificate(false);
    }
  };

  // ─── PHASE 8: PRIZES & SPONSORS STATE & HANDLERS ───
  const [prizes, setPrizes] = useState([]);
  const [loadingPrizes, setLoadingPrizes] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeFormMode, setPrizeFormMode] = useState("create");
  const [selectedPrizeForForm, setSelectedPrizeForForm] = useState(null);
  const [prizeFormData, setPrizeFormData] = useState({
    name: "",
    category: "WINNER_1ST",
    description: "",
    amount: 0,
    currency: "INR",
    sponsorId: "",
    quantity: 1,
    eligibility: "WINNER",
    trackRestriction: "",
    rankRestriction: 1,
    fulfillmentMethod: "BANK_TRANSFER",
    status: "ACTIVE",
  });
  const [savingPrize, setSavingPrize] = useState(false);

  const [sponsors, setSponsors] = useState([]);
  const [loadingSponsors, setLoadingSponsors] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorFormMode, setSponsorFormMode] = useState("create");
  const [selectedSponsorForForm, setSelectedSponsorForForm] = useState(null);
  const [sponsorFormData, setSponsorFormData] = useState({
    name: "",
    logoUrl: "",
    websiteUrl: "",
    description: "",
    tier: "SILVER",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    benefits: [],
    active: true,
    displayOrder: 0,
  });
  const [newBenefitInput, setNewBenefitInput] = useState("");
  const [savingSponsor, setSavingSponsor] = useState(false);

  const [prizeFulfillments, setPrizeFulfillments] = useState([]);
  const [loadingFulfillments, setLoadingFulfillments] = useState(false);
  const [selectedFulfillmentForEdit, setSelectedFulfillmentForEdit] = useState(null);
  const [fulfillmentStatusInput, setFulfillmentStatusInput] = useState("PENDING");
  const [fulfillmentTxRefInput, setFulfillmentTxRefInput] = useState("");
  const [fulfillmentVoucherInput, setFulfillmentVoucherInput] = useState("");
  const [fulfillmentNotesInput, setFulfillmentNotesInput] = useState("");
  const [savingFulfillment, setSavingFulfillment] = useState(false);
  const [notifyingFulfillmentId, setNotifyingFulfillmentId] = useState(null);

  const fetchPrizes = async () => {
    try {
      setLoadingPrizes(true);
      const token = getAdminToken();
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/admin/prizes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setPrizes(res.data.prizes || []);
      }
    } catch (err) {
      console.error("fetchPrizes error:", err);
    } finally {
      setLoadingPrizes(false);
    }
  };

  const handleSavePrize = async (e) => {
    e.preventDefault();
    try {
      setSavingPrize(true);
      const token = getAdminToken();
      if (prizeFormMode === "create") {
        const res = await axios.post(`${BACKEND_URL}/api/hackathon/admin/prizes`, prizeFormData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          toast.success("Prize created successfully!");
          setShowPrizeModal(false);
          fetchPrizes();
        }
      } else {
        const res = await axios.put(
          `${BACKEND_URL}/api/hackathon/admin/prizes/${selectedPrizeForForm.prizeId}`,
          prizeFormData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.success) {
          toast.success("Prize updated successfully!");
          setShowPrizeModal(false);
          fetchPrizes();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save prize");
    } finally {
      setSavingPrize(false);
    }
  };

  const handleDeletePrize = async (prizeId) => {
    if (!window.confirm("Are you sure you want to delete this prize? If fulfillments exist, deletion will be rejected.")) {
      return;
    }
    try {
      const token = getAdminToken();
      const res = await axios.delete(`${BACKEND_URL}/api/hackathon/admin/prizes/${prizeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        toast.success("Prize deleted successfully!");
        fetchPrizes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete prize");
    }
  };

  const fetchSponsors = async () => {
    try {
      setLoadingSponsors(true);
      const token = getAdminToken();
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/admin/sponsors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setSponsors(res.data.sponsors || []);
      }
    } catch (err) {
      console.error("fetchSponsors error:", err);
    } finally {
      setLoadingSponsors(false);
    }
  };

  const handleSaveSponsor = async (e) => {
    e.preventDefault();
    try {
      setSavingSponsor(true);
      const token = getAdminToken();
      if (sponsorFormMode === "create") {
        const res = await axios.post(`${BACKEND_URL}/api/hackathon/admin/sponsors`, sponsorFormData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          toast.success("Sponsor created successfully!");
          setShowSponsorModal(false);
          fetchSponsors();
        }
      } else {
        const res = await axios.put(
          `${BACKEND_URL}/api/hackathon/admin/sponsors/${selectedSponsorForForm.sponsorId}`,
          sponsorFormData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.success) {
          toast.success("Sponsor updated successfully!");
          setShowSponsorModal(false);
          fetchSponsors();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save sponsor");
    } finally {
      setSavingSponsor(false);
    }
  };

  const handleDeleteSponsor = async (sponsorId) => {
    if (!window.confirm("Are you sure you want to delete this sponsor?")) return;
    try {
      const token = getAdminToken();
      const res = await axios.delete(`${BACKEND_URL}/api/hackathon/admin/sponsors/${sponsorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        toast.success("Sponsor deleted successfully!");
        fetchSponsors();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete sponsor");
    }
  };

  const fetchPrizeFulfillments = async () => {
    try {
      setLoadingFulfillments(true);
      const token = getAdminToken();
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/admin/prize-fulfillments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setPrizeFulfillments(res.data.fulfillments || []);
      }
    } catch (err) {
      console.error("fetchPrizeFulfillments error:", err);
    } finally {
      setLoadingFulfillments(false);
    }
  };

  const handleSaveFulfillment = async (e) => {
    e.preventDefault();
    if (!selectedFulfillmentForEdit) return;
    try {
      setSavingFulfillment(true);
      const token = getAdminToken();
      const res = await axios.patch(
        `${BACKEND_URL}/api/hackathon/admin/prize-fulfillments/${selectedFulfillmentForEdit.fulfillmentId}`,
        {
          status: fulfillmentStatusInput,
          transactionReference: fulfillmentTxRefInput,
          voucherCodeMasked: fulfillmentVoucherInput,
          notes: fulfillmentNotesInput,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Fulfillment status updated successfully!");
        setSelectedFulfillmentForEdit(null);
        fetchPrizeFulfillments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update fulfillment");
    } finally {
      setSavingFulfillment(false);
    }
  };

  const handleNotifyFulfillment = async (fulfillmentId) => {
    try {
      setNotifyingFulfillmentId(fulfillmentId);
      const token = getAdminToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/prize-fulfillments/${fulfillmentId}/notify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Winner prize notification dispatched via email!");
        fetchPrizeFulfillments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to notify winner");
    } finally {
      setNotifyingFulfillmentId(null);
    }
  };

  // ─── PHASE 9: OPERATIONS, HEALTH, ALERTS & EXPORTS STATE ───
  const [opsHealth, setOpsHealth] = useState(null);
  const [loadingOps, setLoadingOps] = useState(false);
  const [opsAlerts, setOpsAlerts] = useState([]);
  const [emailStats, setEmailStats] = useState(null);
  const [securitySummary, setSecuritySummary] = useState(null);

  // Operational Search State
  const [opsSearchQuery, setOpsSearchQuery] = useState("");
  const [opsSearchResults, setOpsSearchResults] = useState(null);
  const [searchingOps, setSearchingOps] = useState(false);
  const [showOpsSearchModal, setShowOpsSearchModal] = useState(false);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingResource, setExportingResource] = useState(null);

  // Enhanced Audit Logs Filter State
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActor, setAuditActor] = useState("");
  const [auditTeamId, setAuditTeamId] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditEntityFilter, setAuditEntityFilter] = useState("");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");

  const fetchOpsData = async () => {
    try {
      setLoadingOps(true);
      const token = getAdminToken();
      const [healthRes, alertsRes, emailRes, secRes] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/api/hackathon/admin/health`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BACKEND_URL}/api/hackathon/admin/alerts`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BACKEND_URL}/api/hackathon/admin/email-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BACKEND_URL}/api/hackathon/admin/security-summary`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (healthRes.status === "fulfilled" && healthRes.value.data?.success) {
        setOpsHealth(healthRes.value.data);
      }
      if (alertsRes.status === "fulfilled" && alertsRes.value.data?.success) {
        setOpsAlerts(alertsRes.value.data.alerts || []);
      }
      if (emailRes.status === "fulfilled" && emailRes.value.data?.success) {
        setEmailStats(emailRes.value.data);
      }
      if (secRes.status === "fulfilled" && secRes.value.data?.success) {
        setSecuritySummary(secRes.value.data);
      }
    } catch (err) {
      console.error("fetchOpsData error:", err);
    } finally {
      setLoadingOps(false);
    }
  };

  const handleExecuteOpsSearch = async (e) => {
    if (e) e.preventDefault();
    if (!opsSearchQuery.trim()) return;
    try {
      setSearchingOps(true);
      const token = getAdminToken();
      const res = await axios.get(
        `${BACKEND_URL}/api/hackathon/admin/search?q=${encodeURIComponent(opsSearchQuery.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setOpsSearchResults(res.data.results || null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Operational search failed");
    } finally {
      setSearchingOps(false);
    }
  };

  const handleDownloadExport = async (resource) => {
    try {
      setExportingResource(resource);
      const token = getAdminToken();
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/admin/export/${resource}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      // Trigger browser download
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `hackathon-${resource}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Successfully exported ${resource} dataset!`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to export ${resource}`);
    } finally {
      setExportingResource(null);
    }
  };

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
    isActive: true,
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
            isActive: s.isActive !== false,
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
      let url = `${BACKEND_URL}/api/hackathon/admin/audit-logs?page=${page}&limit=20`;
      if (auditActionFilter) url += `&action=${encodeURIComponent(auditActionFilter)}`;
      if (auditEntityFilter) url += `&targetEntity=${encodeURIComponent(auditEntityFilter)}`;
      if (auditSearch) url += `&search=${encodeURIComponent(auditSearch)}`;
      if (auditActor) url += `&actor=${encodeURIComponent(auditActor)}`;
      if (auditTeamId) url += `&teamId=${encodeURIComponent(auditTeamId)}`;
      if (auditStartDate) url += `&startDate=${encodeURIComponent(auditStartDate)}`;
      if (auditEndDate) url += `&endDate=${encodeURIComponent(auditEndDate)}`;

      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
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
    fetchOpsData();
  }, []);

  useEffect(() => {
    if (activeTab === "operations" || activeTab === "overview") {
      fetchOpsData();
    }
    if (activeTab === "audit_logs") {
      fetchAuditLogs(1);
    }
    if (activeTab === "teams") {
      fetchTeams(1);
    }
    if (activeTab === "submissions") {
      fetchSubmissions(1);
    }
    if (activeTab === "editorial") {
      fetchEditorialMembers();
      fetchAssignments();
      fetchTeams(1);
    }
    if (activeTab === "judging") {
      fetchEvaluations();
    }
    if (activeTab === "results") {
      fetchResults();
    }
    if (activeTab === "certificates") {
      fetchCertificates(1);
    }
    if (activeTab === "prizes") {
      fetchPrizes();
      fetchPrizeFulfillments();
      fetchSponsors();
    }
    if (activeTab === "sponsors") {
      fetchSponsors();
    }
  }, [
    activeTab,
    teamsStatusFilter,
    teamsTrackFilter,
    submissionsStatusFilter,
    submissionsTrackFilter,
    evaluationsTrackFilter,
    evaluationsStatusFilter,
    resultsTrackFilter,
    resultsStatusFilter,
    certificatesTypeFilter,
    certificatesStatusFilter,
    auditActionFilter,
    auditEntityFilter,
  ]);

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

  const [togglingActive, setTogglingActive] = useState(false);

  const handleToggleActive = async () => {
    try {
      setTogglingActive(true);
      const token = getAdminToken();
      const currentActive = settings?.isActive !== false;
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/admin/settings/toggle-active`,
        { isActive: !currentActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success(res.data.message);
        setSettings((prev) => ({ ...prev, isActive: res.data.isActive }));
        setSettingsForm((prev) => ({ ...prev, isActive: res.data.isActive }));
      }
    } catch (err) {
      console.error("handleToggleActive error:", err);
      toast.error(err.response?.data?.message || "Failed to toggle active status");
    } finally {
      setTogglingActive(false);
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
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleToggleActive}
              disabled={togglingActive}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer border ${
                settings?.isActive !== false
                  ? "bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-emerald-900/20"
                  : "bg-rose-600/90 hover:bg-rose-500 text-white border-rose-400/40 shadow-rose-900/20"
              }`}
              title={
                settings?.isActive !== false
                  ? "Click to Disable / Hide Hackathon from Student Dashboard"
                  : "Click to Enable / Show Hackathon on Student Dashboard"
              }
            >
              {togglingActive ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : settings?.isActive !== false ? (
                <Eye className="w-4 h-4 text-emerald-200" />
              ) : (
                <EyeOff className="w-4 h-4 text-rose-200" />
              )}
              <span>
                {settings?.isActive !== false ? "Dashboard: ON (Visible)" : "Dashboard: OFF (Hidden)"}
              </span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Import Unstop Excel
            </button>
            <button
              onClick={() => {
                setOpsSearchQuery("");
                setOpsSearchResults(null);
                setShowOpsSearchModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shadow-sm cursor-pointer"
            >
              <Search className="w-4 h-4 text-indigo-300" />
              Quick Search
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shadow-sm cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-indigo-300" />
              Export CSV
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
              onClick={() => {
                fetchOverview();
                fetchOpsData();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading || loadingOps ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Centralized Workspace Sub-Tabs Navigation */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: Layers, badge: null },
            {
              id: "operations",
              label: "Operations & Health",
              icon: Activity,
              badge: opsAlerts.filter((a) => a.severity === "CRITICAL").length > 0 ? "Alerts" : "Live",
            },
            { id: "teams", label: "Teams", icon: Users, badge: stats.totalTeams > 0 ? `${stats.totalTeams} Teams` : "Active" },
            { id: "editorial", label: "Editorial & Judges", icon: Award, badge: editorialMembers.length > 0 ? `${editorialMembers.length} Judges` : "Active" },
            {
              id: "submissions",
              label: "Submissions",
              icon: FileText,
              badge: stats.finalSubmissions > 0 ? `${stats.finalSubmissions} Submissions` : "Active",
            },
            { id: "judging", label: "Judging & Evaluations", icon: Sparkles, badge: aggregatedResults.length > 0 ? `${aggregatedResults.length} Evaluated` : "Active" },
            { id: "results", label: "Results", icon: Trophy, badge: resultsSummary.total > 0 ? `${resultsSummary.total} Ranked` : "Official" },
            { id: "certificates", label: "Certificates", icon: CheckCircle2, badge: certificatesTotal > 0 ? `${certificatesTotal} Issued` : "Active" },
            { id: "prizes", label: "Prizes & Fulfillment", icon: Medal, badge: prizeFulfillments.length > 0 ? `${prizeFulfillments.length} Pipeline` : "Active" },
            { id: "sponsors", label: "Sponsors", icon: Sparkles, badge: sponsors.length > 0 ? `${sponsors.length} Partners` : "Active" },
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
                  <div className="flex items-center gap-2 pl-2 border-l border-indigo-200/60">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        settings?.isActive !== false ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Dashboard Card:{" "}
                      <span className={settings?.isActive !== false ? "text-emerald-700 font-black" : "text-rose-600 font-black"}>
                        {settings?.isActive !== false ? "Visible (Active)" : "Hidden (Disabled)"}
                      </span>
                    </span>
                    <button
                      onClick={handleToggleActive}
                      disabled={togglingActive}
                      className={`ml-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        settings?.isActive !== false
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {togglingActive ? "Updating..." : settings?.isActive !== false ? "Turn Off" : "Turn On"}
                    </button>
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
                  <p className="text-[11px] text-slate-400 mt-1">
                    Confirmation payment closes automatically 1 hour before this start time.
                  </p>
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
                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    settingsForm.isActive !== false
                      ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                      : "bg-rose-50/70 border-rose-300 text-rose-900"
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settingsForm.isActive !== false}
                        onChange={(e) => setSettingsForm({ ...settingsForm, isActive: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold block">
                          Hackathon Dashboard Card Visibility ({settingsForm.isActive !== false ? "Visible / Enabled" : "Hidden / Disabled"})
                        </span>
                        <span className="text-[11px] opacity-80 block">
                          {settingsForm.isActive !== false
                            ? "Hackathon card is visible to students on the main dashboard (/dashboard)."
                            : "Hackathon card is completely hidden from the student dashboard (/dashboard)."}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      settingsForm.isActive !== false
                        ? "bg-emerald-200 text-emerald-800 border border-emerald-300"
                        : "bg-rose-200 text-rose-800 border border-rose-300"
                    }`}>
                      {settingsForm.isActive !== false ? "ON" : "OFF"}
                    </span>
                  </label>

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

          {/* Audit Filters Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Text Search</label>
                <div className="relative mt-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Action, reason, target..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Actor</label>
                <input
                  type="text"
                  placeholder="Actor name / email"
                  value={auditActor}
                  onChange={(e) => setAuditActor(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Entity</label>
                <select
                  value={auditEntityFilter}
                  onChange={(e) => setAuditEntityFilter(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Entities</option>
                  <option value="TEAM">TEAM</option>
                  <option value="HACKATHON_SETTINGS">HACKATHON_SETTINGS</option>
                  <option value="SUBMISSION">SUBMISSION</option>
                  <option value="EDITORIAL_MEMBER">EDITORIAL_MEMBER</option>
                  <option value="ASSIGNMENT">ASSIGNMENT</option>
                  <option value="EVALUATION">EVALUATION</option>
                  <option value="RESULTS">RESULTS</option>
                  <option value="CERTIFICATE">CERTIFICATE</option>
                  <option value="PRIZE_FULFILLMENT">PRIZE_FULFILLMENT</option>
                  <option value="SPONSOR">SPONSOR</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Action</label>
                <input
                  type="text"
                  placeholder="e.g. UPDATE_STATUS, APPROVE"
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Date Range:</span>
                <input
                  type="date"
                  value={auditStartDate}
                  onChange={(e) => setAuditStartDate(e.target.value)}
                  className="px-2 py-1 bg-white rounded-md border border-slate-200 text-xs text-slate-700"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={auditEndDate}
                  onChange={(e) => setAuditEndDate(e.target.value)}
                  className="px-2 py-1 bg-white rounded-md border border-slate-200 text-xs text-slate-700"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuditSearch("");
                    setAuditActor("");
                    setAuditEntityFilter("");
                    setAuditActionFilter("");
                    setAuditStartDate("");
                    setAuditEndDate("");
                    setTimeout(() => fetchAuditLogs(1), 0);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={() => fetchAuditLogs(1)}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
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

      {/* ─── TAB: OPERATIONS & PRODUCTION HEALTH (PHASE 9) ─── */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          {/* Top Operational Status Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
                      Production Operations & Health Center
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                          opsHealth?.status === "HEALTHY"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : opsHealth?.status === "DEGRADED"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {opsHealth?.status || "HEALTHY"}
                      </span>
                    </h2>
                    <p className="text-xs text-indigo-200/80">
                      Real-time telemetry, server-clock deadline enforcement, email deliverability, and audit integrity
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Server Clock:</span>
                    <strong className="text-white font-mono">
                      {opsHealth?.serverClock?.currentServerTime
                        ? new Date(opsHealth.serverClock.currentServerTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : new Date().toLocaleTimeString()}
                    </strong>
                  </div>
                  <span className="text-slate-600">•</span>
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Active Lifecycle:</span>
                    <strong className="text-cyan-200">{opsHealth?.activePhase || "OPERATIONAL"}</strong>
                  </div>
                </div>
              </div>

              {/* Health Score Circle & Quick Actions */}
              <div className="flex items-center gap-6 self-start lg:self-center">
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Health Index</div>
                    <div className="text-2xl font-black text-white">
                      {opsHealth?.healthScore ?? 100}
                      <span className="text-xs font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-400 flex items-center justify-center font-black text-emerald-300 text-sm">
                    {opsHealth?.healthScore ?? 100}%
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all hover:scale-102"
                  >
                    <DownloadCloud className="w-4 h-4" /> Export CSV Data
                  </button>
                  <button
                    onClick={() => {
                      setOpsSearchQuery("");
                      setOpsSearchResults(null);
                      setShowOpsSearchModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 cursor-pointer transition-all"
                  >
                    <Search className="w-4 h-4 text-cyan-300" /> Operational Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Alerts Panel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Actionable Operational Alerts</h3>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {opsAlerts.length}
                </span>
              </div>
              <button
                onClick={fetchOpsData}
                disabled={loadingOps}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOps ? "animate-spin" : ""}`} /> Refresh Telemetry
              </button>
            </div>

            {opsAlerts.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-4 text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">All Operational Workflows Nominal</h4>
                  <p className="text-xs text-emerald-700/90 mt-0.5">
                    No critical bottlenecks, unassigned evaluations, or webhook discrepancies detected across the system.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {opsAlerts.map((alert) => {
                  const isCritical = alert.severity === "CRITICAL";
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isCritical
                          ? "bg-rose-50/70 border-rose-200 text-rose-900"
                          : "bg-amber-50/70 border-amber-200 text-amber-900"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`w-5 h-5 mt-0.5 shrink-0 ${isCritical ? "text-rose-600" : "text-amber-600"}`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                isCritical ? "bg-rose-200 text-rose-800" : "bg-amber-200 text-amber-800"
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900">{alert.title}</h4>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                        </div>
                      </div>

                      {alert.actionTab && (
                        <button
                          onClick={() => setActiveTab(alert.actionTab)}
                          className="self-start sm:self-center px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-sm cursor-pointer whitespace-nowrap transition-transform active:scale-95"
                        >
                          {alert.actionLabel || "Resolve in " + alert.actionTab} →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Server-Grounded Timelines & Deadlines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Registration Window</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    opsHealth?.serverClock?.registrationStatus === "OPEN"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {opsHealth?.serverClock?.registrationStatus || "OPEN"}
                </span>
              </div>
              <div className="text-base font-black text-slate-800">
                {settings?.startDate ? new Date(settings.startDate).toLocaleDateString() : "Active"}
              </div>
              <p className="text-[11px] text-slate-500">
                Managed via Hackathon Settings & registration toggle
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Submission Deadline</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    opsHealth?.serverClock?.submissionStatus === "CLOSED"
                      ? "bg-rose-100 text-rose-700"
                      : opsHealth?.serverClock?.submissionStatus === "CLOSING_SOON"
                      ? "bg-amber-100 text-amber-700 animate-pulse"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {opsHealth?.serverClock?.submissionStatus || "OPEN"}
                </span>
              </div>
              <div className="text-base font-black text-slate-800">
                {settings?.submissionDeadline
                  ? new Date(settings.submissionDeadline).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Not configured"}
              </div>
              <p className="text-[11px] text-slate-500">
                {opsHealth?.serverClock?.timeUntilSubmissionCloses !== null &&
                opsHealth?.serverClock?.timeUntilSubmissionCloses !== undefined
                  ? opsHealth.serverClock.timeUntilSubmissionCloses > 0
                    ? `${opsHealth.serverClock.timeUntilSubmissionCloses}h remaining on server clock`
                    : "Deadline passed"
                  : "Standard schedule active"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Results Publication</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    opsHealth?.serverClock?.resultsStatus === "PUBLISHED"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {opsHealth?.serverClock?.resultsStatus || "PENDING"}
                </span>
              </div>
              <div className="text-base font-black text-slate-800">
                {settings?.resultDate
                  ? new Date(settings.resultDate).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "TBD"}
              </div>
              <p className="text-[11px] text-slate-500">
                {settings?.isResultsPublished ? "Publicly viewable by participants" : "Draft state"}
              </p>
            </div>
          </div>

          {/* 9-Point System Completion Checklist */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Hackathon Lifecycle Readiness Checklist (Phases 1–9)
                </h3>
                <p className="text-xs text-slate-500">
                  Comprehensive audit across all operational subsystems
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(opsHealth?.systemCompletionMatrix || [
                { item: "Participant Import (Unstop)", phase: "Phase 1-2", status: "COMPLETE", details: "Ready" },
                { item: "Team Management & Review", phase: "Phase 3", status: "COMPLETE", details: "Active" },
                { item: "Payment Gateway Integration", phase: "Phase 4", status: "COMPLETE", details: "Configured" },
                { item: "Submissions & Lockdown", phase: "Phase 5", status: "COMPLETE", details: "Active" },
                { item: "Editorial & Blind Judging", phase: "Phase 6", status: "COMPLETE", details: "Active" },
                { item: "Result Aggregation & Ranking", phase: "Phase 7", status: "COMPLETE", details: "Active" },
                { item: "Official Result Lockdown", phase: "Phase 7", status: "COMPLETE", details: "Secure" },
                { item: "Certificates & Prizes", phase: "Phase 8", status: "COMPLETE", details: "Enabled" },
                { item: "Operational Health & Analytics", phase: "Phase 9", status: "COMPLETE", details: "Active" },
              ]).map((step, idx) => {
                const isComplete = step.status === "COMPLETE";
                const isInProgress = step.status === "IN_PROGRESS";
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-colors flex items-start gap-3"
                  >
                    <div className="mt-0.5">
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isInProgress ? (
                        <Clock className="w-4 h-4 text-amber-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{step.item}</h4>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            isComplete
                              ? "bg-emerald-100 text-emerald-800"
                              : isInProgress
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{step.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operations Double Grid: Email Deliverability & Security Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Deliverability Widget */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-900">Email Deliverability Monitor</h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {emailStats?.successRate ?? 100}% Success Rate
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Total Sent</div>
                  <div className="text-xl font-black text-slate-800 mt-1">{emailStats?.totalSent ?? 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Delivered</div>
                  <div className="text-xl font-black text-emerald-600 mt-1">{emailStats?.delivered ?? 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Bounces</div>
                  <div className="text-xl font-black text-amber-600 mt-1">{emailStats?.bounced ?? 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Retry Queue</div>
                  <div className="text-xl font-black text-slate-800 mt-1">{emailStats?.retryQueueSize ?? 0}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Spam Complaints: <strong className="text-slate-800">{emailStats?.spamComplaints ?? 0}</strong></span>
                <span>
                  Last Transmitted:{" "}
                  <strong className="text-slate-800">
                    {emailStats?.lastSentAt ? new Date(emailStats.lastSentAt).toLocaleTimeString() : "Recent"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Security Events Widget */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-900">Security Events & Telemetry (24h)</h3>
                </div>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    securitySummary?.status === "SECURE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {securitySummary?.status || "SECURE"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Failed Logins</div>
                  <div className="text-xl font-black text-slate-800 mt-1">
                    {securitySummary?.failedAdminLogins ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Bad Lookups</div>
                  <div className="text-xl font-black text-slate-800 mt-1">
                    {securitySummary?.invalidCertificateVerifications ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Unauthorized</div>
                  <div className="text-xl font-black text-slate-800 mt-1">
                    {securitySummary?.unauthorizedAccessAttempts ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Rate Limited</div>
                  <div className="text-xl font-black text-slate-800 mt-1">
                    {securitySummary?.rateLimitHits ?? 0}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                <span className="font-bold text-slate-700">Security Advice: </span>
                {securitySummary?.recommendations?.[0] || "All authentication and verification layers fully secured."}
              </div>
            </div>
          </div>
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

      {/* ─── PHASE 6: EDITORIAL & JUDGES MANAGEMENT TAB ─── */}
      {activeTab === "editorial" && (
        <div className="space-y-8">
          {/* Section A: Editorial Members */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">Editorial & Judge Accounts</h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {editorialMembers.length} Provisioned
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Manage independent judging accounts. Passwords are encrypted; initial credentials require first-login update.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={editorialSearch}
                    onChange={(e) => setEditorialSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchEditorialMembers()}
                    placeholder="Search judges..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => setShowCreateJudgeModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Judge</span>
                </button>
              </div>
            </div>

            {loadingEditorialMembers ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading judges...</p>
              </div>
            ) : editorialMembers.length === 0 ? (
              <div className="p-12 text-center">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No Editorial Accounts Provisioned</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Click "Add Judge" to create official judge credentials for the hackathon.
                </p>
                <button
                  onClick={() => setShowCreateJudgeModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Judge</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Judge Name</th>
                      <th className="py-3.5 px-4">Login Email</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Assigned Projects</th>
                      <th className="py-3.5 px-4 text-center">Finalized</th>
                      <th className="py-3.5 px-4">Last Login</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {editorialMembers.map((member) => (
                      <tr key={member._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {member.name.charAt(0)}
                          </div>
                          <span>{member.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{member.email}</td>
                        <td className="py-3.5 px-4 text-center">
                          {member.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                              <UserX className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                          {member.assignedTeamsCount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-emerald-600">
                          {member.completedEvaluationsCount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : "Never"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedJudgeForReset(member);
                                setShowResetJudgeModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Reset initial password"
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleToggleJudgeActive(member)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                member.isActive
                                  ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {member.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section B: Judge Project Assignments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-base font-extrabold text-slate-900">Project Evaluation Assignments</h2>
              <p className="text-xs text-slate-500 mt-1">
                Assign eligible confirmed & submitted hackathon teams to judges. Multiple judges can evaluate each project independently.
              </p>
            </div>

            {/* Assignment Form */}
            <form
              onSubmit={handleCreateAssignment}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Submitted Team
                </label>
                <select
                  value={assignForm.teamId}
                  onChange={(e) => setAssignForm({ ...assignForm, teamId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Eligible Team --</option>
                  {teams
                    .filter((t) => ["CONFIRMED", "SUBMITTED", "UNDER_EVALUATION", "EVALUATED"].includes(t.status))
                    .map((team) => (
                      <option key={team._id} value={team.teamId}>
                        {team.teamId} — {team.teamName} ({team.track}) [{team.status}]
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Judge
                </label>
                <select
                  value={assignForm.editorialMemberId}
                  onChange={(e) => setAssignForm({ ...assignForm, editorialMemberId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Active Judge --</option>
                  {editorialMembers
                    .filter((m) => m.isActive)
                    .map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="e.g. Track lead reviewer"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={assigningJudge}
                className="w-full md:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {assigningJudge ? "Assigning..." : "Assign Project"}
              </button>
            </form>

            {/* Assignments Table */}
            {loadingAssignments ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading assignments...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
                <p className="text-xs text-slate-400">No project assignments created yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4">Track</th>
                      <th className="py-3 px-4">Assigned Judge</th>
                      <th className="py-3 px-4 text-center">Evaluation Status</th>
                      <th className="py-3 px-4 text-center">Total Score</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {assignments.map((assignment) => (
                      <tr key={assignment._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {assignment.team?.teamName || assignment.teamId}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{assignment.team?.track || "General"}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900">
                            {assignment.editorialMember?.name || "Judge"}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {assignment.editorialMember?.email}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {assignment.evaluation?.status === "FINALIZED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Finalized
                            </span>
                          ) : assignment.evaluation?.status === "IN_PROGRESS" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Not Started
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {assignment.evaluation?.status === "FINALIZED"
                            ? `${assignment.evaluation.totalScore} / 100`
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteAssignment(assignment._id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            Unassign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PHASE 6: JUDGING & EVALUATIONS TAB ─── */}
      {activeTab === "judging" && (
        <div className="space-y-8">
          {/* Header & Filter Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Judging Progress & Score Aggregations</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Compare independent judge evaluations, track average scores, inspect criteria feedback, and reopen evaluations if needed.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={evaluationsTrackFilter}
                  onChange={(e) => setEvaluationsTrackFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Tracks</option>
                  <option value="AI & Machine Learning">AI & Machine Learning</option>
                  <option value="Web3 & Decentralized Tech">Web3 & Decentralized Tech</option>
                  <option value="Full Stack & Cloud Native">Full Stack & Cloud Native</option>
                  <option value="Open Innovation & Social Good">Open Innovation & Social Good</option>
                </select>

                <select
                  value={evaluationsStatusFilter}
                  onChange={(e) => setEvaluationsStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="FINALIZED">Finalized Only</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REOPENED">Reopened</option>
                </select>

                <button
                  onClick={fetchEvaluations}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                  title="Refresh evaluations"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingEvaluations ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Aggregated Score Ranking Summary */}
            <div className="pt-6">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Aggregated Leaderboard Foundation (Average of Finalized Judge Scores)
              </h3>

              {loadingEvaluations ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Calculating aggregations...</p>
                </div>
              ) : aggregatedResults.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-400">No project evaluations submitted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 text-center">Rank</th>
                        <th className="py-3 px-4">Team Name</th>
                        <th className="py-3 px-4">Track</th>
                        <th className="py-3 px-4 text-center">Judges Completed</th>
                        <th className="py-3 px-4 text-center">Average Final Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {aggregatedResults.map((item, index) => (
                        <tr key={item.teamId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-extrabold">
                            {index === 0 ? (
                              <span className="inline-block w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold leading-6">
                                1
                              </span>
                            ) : index === 1 ? (
                              <span className="inline-block w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold leading-6">
                                2
                              </span>
                            ) : index === 2 ? (
                              <span className="inline-block w-6 h-6 rounded-full bg-amber-600/20 text-amber-800 text-xs font-bold leading-6">
                                3
                              </span>
                            ) : (
                              `#${index + 1}`
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {item.teamName} <span className="text-[10px] text-slate-400 font-normal">({item.teamId})</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{item.track}</td>
                          <td className="py-3 px-4 text-center font-semibold">
                            {item.finalizedCount} / {item.evaluations.length} Judges
                          </td>
                          <td className="py-3 px-4 text-center font-extrabold text-sm text-indigo-700">
                            {item.finalizedCount > 0 ? `${item.averageScore} / 100` : "Pending"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Individual Judge Evaluation Detail Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Judge-by-Judge Evaluation Breakdown</h3>
            <p className="text-xs text-slate-500">
              Inspect criteria-wise scoring, judge remarks, and reopen finalized evaluations for re-scoring.
            </p>

            <div className="space-y-4 pt-2">
              {evaluations.map((evaluation) => (
                <div
                  key={evaluation._id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {evaluation.team?.teamName || evaluation.teamId}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {evaluation.team?.track}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Evaluated by: <strong className="text-slate-800">{evaluation.editorialMember?.name}</strong>{" "}
                        ({evaluation.editorialMember?.email})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-indigo-600 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
                        {evaluation.totalScore} / 100
                      </span>

                      {evaluation.status === "FINALIZED" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Locked
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          {evaluation.status}
                        </span>
                      )}

                      {evaluation.status === "FINALIZED" && (
                        <button
                          onClick={() => {
                            setSelectedEvaluationToReopen(evaluation);
                            setShowReopenModal(true);
                          }}
                          className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 transition-colors cursor-pointer"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Criteria Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {(evaluation.scores || []).map((scoreItem) => (
                      <div
                        key={scoreItem.criterion}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 text-center"
                      >
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                          {scoreItem.criterion}
                        </p>
                        <p className="text-sm font-black text-slate-900 mt-1">
                          {scoreItem.score} <span className="text-slate-400 text-xs font-normal">/ {scoreItem.maxScore}</span>
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Comments */}
                  {evaluation.comments && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                      <p className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">Judge Comments:</p>
                      <p className="text-slate-700 italic">"{evaluation.comments}"</p>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Version: {evaluation.version || 1}</span>
                    <span>
                      {evaluation.finalizedAt ? `Finalized: ${new Date(evaluation.finalizedAt).toLocaleString()}` : `Updated: ${new Date(evaluation.updatedAt).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE JUDGE ACCOUNT ─── */}
      {showCreateJudgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Provision New Editorial Judge
              </h3>
              <button
                onClick={() => setShowCreateJudgeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJudge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judge Full Name</label>
                <input
                  type="text"
                  required
                  value={createJudgeForm.name}
                  onChange={(e) => setCreateJudgeForm({ ...createJudgeForm, name: e.target.value })}
                  placeholder="e.g. Dr. Sarah Connor"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Login Email</label>
                <input
                  type="email"
                  required
                  value={createJudgeForm.email}
                  onChange={(e) => setCreateJudgeForm({ ...createJudgeForm, email: e.target.value })}
                  placeholder="e.g. judge@code-a-nova.online"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={createJudgeForm.password}
                  onChange={(e) => setCreateJudgeForm({ ...createJudgeForm, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Initial Password</label>
                <input
                  type="password"
                  required
                  value={createJudgeForm.confirmPassword}
                  onChange={(e) => setCreateJudgeForm({ ...createJudgeForm, confirmPassword: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateJudgeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingJudge}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {creatingJudge ? "Creating..." : "Create Judge Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: RESET JUDGE PASSWORD ─── */}
      {showResetJudgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Reset Password for {selectedJudgeForReset?.name}
              </h3>
              <button
                onClick={() => setShowResetJudgeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetJudgePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={resetJudgePasswordForm.newPassword}
                  onChange={(e) => setResetJudgePasswordForm({ ...resetJudgePasswordForm, newPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={resetJudgePasswordForm.confirmPassword}
                  onChange={(e) => setResetJudgePasswordForm({ ...resetJudgePasswordForm, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetJudgeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingJudgePassword}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {resettingJudgePassword ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADMIN REOPEN EVALUATION ─── */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Reopen Finalized Evaluation</h3>
              <button onClick={() => setShowReopenModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReopenEvaluation} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Reopening this evaluation will unlock it and allow Judge{" "}
                <strong>{selectedEvaluationToReopen?.editorialMember?.name}</strong> to adjust and re-submit scores.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Reopening</label>
                <textarea
                  rows={2}
                  required
                  value={reopenReasonText}
                  onChange={(e) => setReopenReasonText(e.target.value)}
                  placeholder="e.g. Tie-break reconsideration or technical adjustment requested."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopeningEvaluation}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {reopeningEvaluation ? "Reopening..." : "Confirm Reopen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB: RESULTS & WINNERS (Phase 7) ─── */}
      {activeTab === "results" && (
        <div className="space-y-6">
          {/* Top Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-black text-slate-900">
                    Official Hackathon Results & Winner Management
                  </h2>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Phase 7 Official
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Server-side deterministic aggregation, ranking, tie resolution, and winner category allocation based on finalized editorial evaluations.
                </p>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCalculateResults}
                  disabled={calculatingResults || resultsSetting.resultsLocked}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                  title={resultsSetting.resultsLocked ? "Results are locked. Unlock to recalculate." : "Calculate/Recalculate scores from finalized evaluations"}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${calculatingResults ? "animate-spin" : ""}`} />
                  {calculatingResults ? "Calculating..." : results.length > 0 ? "Recalculate Results" : "Calculate Results"}
                </button>

                {resultsSummary.ties > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenTieModal}
                    disabled={resultsSetting.resultsLocked}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Resolve Ties ({resultsSummary.ties})
                  </button>
                )}

                {!resultsSetting.resultsLocked && (
                  <button
                    type="button"
                    onClick={() => setShowApproveResultsModal(true)}
                    disabled={results.length === 0 || resultsSummary.ties > 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
                    title={resultsSummary.ties > 0 ? "Resolve ties before approval" : "Approve calculated rankings"}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Approve Results
                  </button>
                )}

                {/* Publish Toggle */}
                <button
                  type="button"
                  onClick={() => handlePublishResultsToggle(!resultsSetting.isResultsPublished)}
                  disabled={publishingResults || results.length === 0}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                    resultsSetting.isResultsPublished
                      ? "text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                      : "text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  {publishingResults
                    ? "Updating..."
                    : resultsSetting.isResultsPublished
                    ? "Unpublish Results"
                    : "Publish Official Results"}
                </button>

                {/* Lock / Unlock */}
                {resultsSetting.resultsLocked ? (
                  <button
                    type="button"
                    onClick={() => setShowReopenResultsModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5 text-amber-700" />
                    Unlock Results
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLockResultsModal(true)}
                    disabled={results.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Lock Results Permanently
                  </button>
                )}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Considered
                </span>
                <span className="text-xl font-black text-slate-900">{resultsSummary.total || 0}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Eligible & Ranked
                </span>
                <span className="text-xl font-black text-emerald-700">{resultsSummary.eligible || 0}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  Pending Judging
                </span>
                <span className="text-xl font-black text-amber-700">{resultsSummary.pending || 0}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                  Ineligible Teams
                </span>
                <span className="text-xl font-black text-rose-700">{resultsSummary.ineligible || 0}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                  Ties Detected
                </span>
                <span className="text-xl font-black text-purple-700">{resultsSummary.ties || 0}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                  Official Status
                </span>
                <span className="text-xs font-black uppercase text-indigo-800 flex items-center gap-1 mt-1">
                  {resultsSetting.resultsLocked ? (
                    <>
                      <Lock className="w-3 h-3 text-rose-600" /> LOCKED
                    </>
                  ) : resultsSetting.isResultsPublished ? (
                    <>
                      <Globe className="w-3 h-3 text-emerald-600" /> PUBLISHED
                    </>
                  ) : resultsSummary.approved > 0 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> APPROVED
                    </>
                  ) : results.length > 0 ? (
                    <>
                      <Clock className="w-3 h-3 text-amber-600" /> CALCULATED
                    </>
                  ) : (
                    "NOT CALCULATED"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team, ID, or award..."
                value={resultsSearch}
                onChange={(e) => setResultsSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchResults()}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
              <select
                value={resultsStatusFilter}
                onChange={(e) => setResultsStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="READY">Ready & Eligible</option>
                <option value="PENDING_EVALUATIONS">Pending Judging</option>
                <option value="TIE">Ties Detected</option>
                <option value="INELIGIBLE">Ineligible</option>
              </select>

              <select
                value={resultsTrackFilter}
                onChange={(e) => setResultsTrackFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Tracks</option>
                <option value="AI & Machine Learning">AI & ML</option>
                <option value="Web3 & Decentralized Tech">Web3</option>
                <option value="Full Stack & Cloud Native">Full Stack</option>
                <option value="Open Innovation & Social Good">Open Innovation</option>
              </select>

              <button
                type="button"
                onClick={fetchResults}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                title="Refresh results table"
              >
                <RefreshCw className={`w-4 h-4 ${loadingResults ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingResults ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading official results...</div>
            ) : results.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No results calculated yet.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click the <strong>Calculate Results</strong> button above to aggregate finalized editorial evaluations.
                </p>
                <button
                  type="button"
                  onClick={handleCalculateResults}
                  disabled={calculatingResults}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${calculatingResults ? "animate-spin" : ""}`} />
                  Calculate Results Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Rank</th>
                      <th className="p-3.5">Team & Project</th>
                      <th className="p-3.5">Track</th>
                      <th className="p-3.5">Final Score</th>
                      <th className="p-3.5">Judging Progress</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Award / Category</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((item) => {
                      const isPodium = item.rank && item.rank <= 3;
                      const podiumBg =
                        item.rank === 1
                          ? "bg-amber-50/40"
                          : item.rank === 2
                          ? "bg-slate-100/40"
                          : item.rank === 3
                          ? "bg-amber-100/20"
                          : "";

                      return (
                        <tr key={item._id} className={`hover:bg-slate-50/80 transition-colors ${podiumBg}`}>
                          {/* Rank */}
                          <td className="p-3.5 font-bold">
                            {item.rank ? (
                              <div className="flex items-center gap-1.5">
                                {item.rank === 1 ? (
                                  <span className="w-6 h-6 rounded-full bg-amber-400 text-white font-black text-xs flex items-center justify-center shadow-sm">
                                    1
                                  </span>
                                ) : item.rank === 2 ? (
                                  <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-sm">
                                    2
                                  </span>
                                ) : item.rank === 3 ? (
                                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                                    3
                                  </span>
                                ) : (
                                  <span className="font-mono text-slate-600 font-black px-1.5">
                                    #{item.rank}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono">—</span>
                            )}
                          </td>

                          {/* Team Name */}
                          <td className="p-3.5">
                            <div className="font-black text-slate-900">{item.teamName}</div>
                            <div className="font-mono text-[10px] text-indigo-600 font-bold">{item.teamId}</div>
                            {item.submissionId?.projectName && (
                              <div className="text-[11px] text-slate-500 italic truncate max-w-xs">
                                {item.submissionId.projectName}
                              </div>
                            )}
                          </td>

                          {/* Track */}
                          <td className="p-3.5 text-slate-600 font-medium whitespace-nowrap">
                            {item.track}
                          </td>

                          {/* Final Score */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="text-sm font-black text-slate-900">
                              {item.finalScore.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Avg score</span>
                          </td>

                          {/* Judging Progress */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.pendingJudgeCount === 0 && item.finalizedJudgeCount > 0
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {item.finalizedJudgeCount} / {item.judgeCount} Finalized
                              </span>
                            </div>
                            {item.pendingJudgeCount > 0 && (
                              <span className="text-[10px] text-amber-600 block mt-0.5">
                                {item.pendingJudgeCount} pending
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                item.rankingStatus === "READY"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : item.rankingStatus === "TIE"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : item.rankingStatus === "PENDING_EVALUATIONS"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
                              }`}
                              title={item.statusReason}
                            >
                              {item.rankingStatus}
                            </span>
                            {item.statusReason && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-xs mt-0.5">
                                {item.statusReason}
                              </span>
                            )}
                          </td>

                          {/* Category / Prize */}
                          <td className="p-3.5">
                            {item.category ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                  <Award className="w-3 h-3 text-amber-600" />
                                  {item.category}
                                </span>
                                {item.prize && (
                                  <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                                    {item.prize}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No award</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedResultDrilldown(item)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                              title="Inspect judge scores and submission drilldown"
                            >
                              Drill-down
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenWinnerModal(item)}
                              disabled={resultsSetting.resultsLocked}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40"
                              title="Assign Winner Award or Category"
                            >
                              Assign Award
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score Drill-Down Modal (Read-Only Inspection) */}
      {selectedResultDrilldown && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Score Drill-down: {selectedResultDrilldown.teamName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{selectedResultDrilldown.teamId} • {selectedResultDrilldown.track}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResultDrilldown(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary Box */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Official Rank</span>
                <span className="text-lg font-black text-slate-900">
                  {selectedResultDrilldown.rank ? `#${selectedResultDrilldown.rank}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Score (Avg)</span>
                <span className="text-lg font-black text-indigo-600">
                  {selectedResultDrilldown.finalScore.toFixed(2)} pts
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Judges</span>
                <span className="text-lg font-black text-slate-900">
                  {selectedResultDrilldown.finalizedJudgeCount} / {selectedResultDrilldown.judgeCount}
                </span>
              </div>
            </div>

            {/* Judge-wise Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Judge-wise Finalized Scores ({selectedResultDrilldown.scoreSnapshot?.length || 0})
              </h4>

              {(!selectedResultDrilldown.scoreSnapshot || selectedResultDrilldown.scoreSnapshot.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No finalized judge score snapshots recorded.</p>
              ) : (
                <div className="space-y-3">
                  {selectedResultDrilldown.scoreSnapshot.map((ev, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                            {ev.judgeName?.slice(0, 1) || "J"}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{ev.judgeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{ev.judgeEmail}</span>
                          </div>
                        </div>
                        <span className="text-sm font-black text-slate-900">
                          {ev.totalScore} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                        </span>
                      </div>

                      {/* Criteria */}
                      {ev.criteriaScores && ev.criteriaScores.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {ev.criteriaScores.map((crit, cIdx) => (
                            <div key={cIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-slate-600 truncate font-medium">{crit.criterionName}</span>
                              <span className="font-bold text-slate-900">
                                {crit.score} <span className="text-slate-400 font-normal">/ {crit.maxScore}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Judge Comments */}
                      {ev.comments && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Judge Feedback:
                          </span>
                          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 whitespace-pre-wrap">
                            {ev.comments}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedResultDrilldown(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winner Assignment Modal */}
      {winnerModalResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Assign Award: {winnerModalResult.teamName}
              </h3>
              <button
                type="button"
                onClick={() => setWinnerModalResult(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWinnerAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Award / Winner Category
                </label>
                <select
                  value={winnerCategoryInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWinnerCategoryInput(val);
                    if (val === "Winner (1st Place)") {
                      setWinnerPrizeInput("₹15,000 + Certificate + Trophy");
                      setIsWinnerInput(true);
                      setIsRunnerUpInput(false);
                    } else if (val === "1st Runner Up (2nd Place)") {
                      setWinnerPrizeInput("₹10,000 + Certificate");
                      setIsWinnerInput(false);
                      setIsRunnerUpInput(true);
                    } else if (val === "2nd Runner Up (3rd Place)") {
                      setWinnerPrizeInput("₹5,000 + Certificate");
                      setIsWinnerInput(false);
                      setIsRunnerUpInput(true);
                    } else if (!val) {
                      setWinnerPrizeInput("");
                      setIsWinnerInput(false);
                      setIsRunnerUpInput(false);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">None (Standard Ranking)</option>
                  <option value="Winner (1st Place)">Winner (1st Place)</option>
                  <option value="1st Runner Up (2nd Place)">1st Runner Up (2nd Place)</option>
                  <option value="2nd Runner Up (3rd Place)">2nd Runner Up (3rd Place)</option>
                  <option value="Best Innovation Award">Best Innovation Award</option>
                  <option value="Best Technical Implementation">Best Technical Implementation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Prize / Recognition Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹15,000 + Trophy"
                  value={winnerPrizeInput}
                  onChange={(e) => setWinnerPrizeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWinnerInput}
                    onChange={(e) => setIsWinnerInput(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  Mark as Overall Winner
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRunnerUpInput}
                    onChange={(e) => setIsRunnerUpInput(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  Mark as Runner-Up
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWinnerModalResult(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWinner}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingWinner ? "Saving..." : "Save Award Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tie Resolution Modal */}
      {showTieModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Resolve Ranking Ties
              </h3>
              <button
                type="button"
                onClick={() => setShowTieModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Multiple teams have identical final scores. Set their official designated rank ordering and specify the administrative rationale.
            </p>

            <form onSubmit={handleResolveTieSubmit} className="space-y-4">
              <div className="space-y-2">
                {tieOrders.map((t, idx) => (
                  <div key={t.teamId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{t.teamName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{t.teamId} • Score: {t.finalScore?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-semibold">Rank:</span>
                      <input
                        type="number"
                        min="1"
                        value={t.rank}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTieOrders((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, rank: val } : item))
                          );
                        }}
                        className="w-16 px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-center font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Administrative Tie-Break Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="State rule or justification (e.g., Higher Technical Complexity score, unanimous panel vote)..."
                  value={tieBreakReason}
                  onChange={(e) => setTieBreakReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTieModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolvingTie || !tieBreakReason.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {resolvingTie ? "Resolving..." : "Confirm Tie Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Results Modal */}
      {showApproveResultsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Approve Official Results</h3>
                <p className="text-xs text-slate-500">Freeze ranking snapshot and mark as APPROVED</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to approve official rankings for {results.length} teams? This freezes the calculation snapshot and authorizes publication.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApproveResultsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={approvingResults}
                onClick={handleApproveResultsSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
              >
                {approvingResults ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Results Modal */}
      {showLockResultsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Lock Official Results Permanently</h3>
                <p className="text-xs text-slate-500">Prevent any further modifications or recalculation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Locking official results makes rankings, winner categories, and score snapshots completely immutable.
            </p>

            <form onSubmit={handleLockResultsSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Locking Reason / Context (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Winners announced at official closing ceremony."
                  value={lockResultsReason}
                  onChange={(e) => setLockResultsReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={confirmLockChecked}
                  onChange={(e) => setConfirmLockChecked(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 mt-0.5"
                />
                <span>I confirm that these results are final and should be permanently locked.</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLockResultsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lockingResults || !confirmLockChecked}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {lockingResults ? "Locking..." : "Confirm & Lock Results"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Results Modal */}
      {showReopenResultsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center font-bold">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Unlock Official Results</h3>
                <p className="text-xs text-slate-500">Allow administrative edits and recalculation</p>
              </div>
            </div>

            <form onSubmit={handleReopenResultsSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Administrative Reopening Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State mandatory reason for reopening locked results (e.g. sponsor added special category award, calculation revision)..."
                  value={reopenResultsReason}
                  onChange={(e) => setReopenResultsReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReopenResultsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopeningResults || !reopenResultsReason.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {reopeningResults ? "Unlocking..." : "Confirm & Unlock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PHASE 8: CERTIFICATES TAB ─── */}
      {activeTab === "certificates" && (
        <div className="space-y-6">
          {/* Header & Main Actions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Phase 8 Active
                </span>
                <span className="text-xs text-slate-500 font-medium">Cryptographic Credential Engine</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Official Hackathon Certificates
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic numbering (<code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-mono">CAN-2026-XXXXXX</code>), SHA-256 verification tokens, and public authentication.
              </p>
            </div>
            <div className="flex items-center flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleGenerateCertificates}
                disabled={generatingCertificates}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                {generatingCertificates ? "Generating..." : "Generate All Eligible"}
              </button>
              <button
                type="button"
                onClick={handleBulkEmailCertificates}
                disabled={emailingCertificates}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {emailingCertificates ? "Dispatching..." : "Bulk Email Active"}
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Issued</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{certificatesTotal}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Active & Valid</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {certificates.filter((c) => !c.isRevoked).length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Email Delivered</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {certificates.filter((c) => c.emailStatus === "SENT").length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Revoked</span>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {certificates.filter((c) => c.isRevoked).length}
              </p>
            </div>
          </div>

          {/* Search, Filter & Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search certificate #, recipient name, email, or team..."
                value={certificatesSearch}
                onChange={(e) => setCertificatesSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCertificates(1)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={certificatesTypeFilter}
                onChange={(e) => setCertificatesTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ALL">All Award Types</option>
                <option value="WINNER">Winner (1st Place)</option>
                <option value="RUNNER_UP">Runner-Up</option>
                <option value="SPECIAL_RECOGNITION">Special Recognition</option>
                <option value="PARTICIPATION">Participation</option>
              </select>
              <select
                value={certificatesStatusFilter}
                onChange={(e) => setCertificatesStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="REVOKED">Revoked Only</option>
              </select>
              <button
                type="button"
                onClick={() => fetchCertificates(1)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
                title="Refresh Certificates"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCertificates ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingCertificates ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
                <p className="text-xs font-semibold">Loading certificates registry...</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Award className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No certificates found</p>
                <p className="text-xs">Click "Generate All Eligible" to create certificates from finalized Phase 7 results.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Serial & Code</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Team & Track</th>
                      <th className="py-3 px-4">Type & Award</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certificates.map((cert) => (
                      <tr key={cert._id || cert.certificateId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-indigo-600">{cert.certificateNumber}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-400">{cert.verificationCode}</span>
                            <a
                              href={`/hackathon/certificate/verify/${cert.verificationCode}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Verify Publicly"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{cert.recipientName}</div>
                          <div className="text-[11px] text-slate-500">{cert.recipientEmail}</div>
                          <div className="text-[10px] text-slate-400">
                            {cert.recipientRole} • {cert.recipientCollege || "College N/A"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{cert.team?.name || "Team"}</div>
                          <div className="text-[10px] text-slate-500">{cert.track || "General"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              cert.type === "WINNER"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : cert.type === "RUNNER_UP"
                                ? "bg-purple-100 text-purple-800 border border-purple-300"
                                : cert.type === "SPECIAL_RECOGNITION"
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {cert.type?.replace("_", " ")}
                          </span>
                          {cert.award && (
                            <div className="text-[10px] font-medium text-slate-600 mt-1 truncate max-w-[140px]">
                              {cert.award}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {cert.isRevoked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <ShieldAlert className="w-3 h-3" /> REVOKED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cert.emailStatus === "SENT"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : cert.emailStatus === "FAILED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <Mail className="w-3 h-3" /> {cert.emailStatus || "NOT_SENT"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCertForView(cert)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                              title="View & Print Certificate"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEmailSingleCertificate(cert.certificateId)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                              title="Dispatch Email"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                            {!cert.isRevoked && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCertForRevoke(cert);
                                  setRevocationReasonInput("");
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                                title="Revoke Certificate"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {certificatesTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {certificatesPage} of {certificatesTotalPages} ({certificatesTotal} total certificates)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={certificatesPage <= 1}
                    onClick={() => fetchCertificates(certificatesPage - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={certificatesPage >= certificatesTotalPages}
                    onClick={() => fetchCertificates(certificatesPage + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PHASE 8: PRIZES & FULFILLMENT TAB ─── */}
      {activeTab === "prizes" && (
        <div className="space-y-8">
          {/* Header & Main Actions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5" /> Phase 8 Active
                </span>
                <span className="text-xs text-slate-500 font-medium">Prize Pool & Fulfillment Pipeline</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Prize Fulfillment & Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure reward pools, connect corporate sponsors, track winner payouts, and maintain bank/voucher audit trails.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPrizeFormMode("create");
                setSelectedPrizeForForm(null);
                setPrizeFormData({
                  name: "",
                  category: "WINNER_1ST",
                  description: "",
                  amount: 0,
                  currency: "INR",
                  sponsorId: "",
                  quantity: 1,
                  eligibility: "WINNER",
                  trackRestriction: "",
                  rankRestriction: 1,
                  fulfillmentMethod: "BANK_TRANSFER",
                  status: "ACTIVE",
                });
                setShowPrizeModal(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Prize
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Configured Prizes</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{prizes.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Pool Value</span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                ₹{prizes.reduce((acc, p) => acc + (p.amount || 0) * (p.quantity || 1), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Pending Fulfillments</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {prizeFulfillments.filter((f) => f.status === "PENDING").length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Completed Payouts</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {prizeFulfillments.filter((f) => f.status === "COMPLETED").length}
              </p>
            </div>
          </div>

          {/* Section: Configured Prizes Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" /> Configured Prize Catalogue ({prizes.length})
              </h3>
            </div>

            {loadingPrizes ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-1" />
                <p className="text-xs">Loading prize configuration...</p>
              </div>
            ) : prizes.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 space-y-2">
                <Gift className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-700">No prizes created yet</p>
                <p className="text-[11px]">Click "Add New Prize" to set up awards, amounts, and sponsor backing.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {prizes.map((pz) => (
                  <div key={pz.prizeId} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {pz.category?.replace("_", " ")}
                        </span>
                        <span className="text-base font-black text-amber-600">
                          {pz.currency === "INR" ? "₹" : pz.currency} {pz.amount?.toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-sm">{pz.name}</h4>
                      {pz.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{pz.description}</p>
                      )}
                      <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                        {pz.sponsorNameSnapshot && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                            Sponsor: {pz.sponsorNameSnapshot}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                          Method: {pz.fulfillmentMethod}
                        </span>
                        {pz.trackRestriction && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                            Track: {pz.trackRestriction}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPrizeFormMode("edit");
                          setSelectedPrizeForForm(pz);
                          setPrizeFormData({
                            name: pz.name,
                            category: pz.category,
                            description: pz.description || "",
                            amount: pz.amount,
                            currency: pz.currency || "INR",
                            sponsorId: pz.sponsorId || "",
                            quantity: pz.quantity || 1,
                            eligibility: pz.eligibility || "WINNER",
                            trackRestriction: pz.trackRestriction || "",
                            rankRestriction: pz.rankRestriction || 1,
                            fulfillmentMethod: pz.fulfillmentMethod || "BANK_TRANSFER",
                            status: pz.status || "ACTIVE",
                          });
                          setShowPrizeModal(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                        title="Edit Prize"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePrize(pz.prizeId)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                        title="Delete Prize"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Fulfillment Pipeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-600" /> Prize Fulfillment Pipeline ({prizeFulfillments.length})
              </h3>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loadingFulfillments ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-1" />
                  <p className="text-xs">Loading fulfillment tracker...</p>
                </div>
              ) : prizeFulfillments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Medal className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">No prize fulfillments recorded</p>
                  <p className="text-[11px]">When winners are assigned in the Results tab, fulfillment records are created automatically.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Winner & Team</th>
                        <th className="py-3 px-4">Prize & Amount</th>
                        <th className="py-3 px-4">Recipient</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Audit / TxRef</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prizeFulfillments.map((ful) => (
                        <tr key={ful.fulfillmentId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{ful.team?.name || "Team"}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{ful.teamId}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-black text-amber-600">
                              {ful.currency === "INR" ? "₹" : ful.currency} {ful.amount?.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">ID: {ful.prizeId}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{ful.recipient?.name || "Team Leader"}</div>
                            <div className="text-[11px] text-slate-500">{ful.recipient?.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {ful.fulfillmentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                ful.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : ful.status === "PROCESSING"
                                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                                  : ful.status === "FAILED"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {ful.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {ful.transactionReference ? (
                              <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {ful.transactionReference}
                              </span>
                            ) : ful.voucherCodeMasked ? (
                              <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {ful.voucherCodeMasked}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No Reference</span>
                            )}
                            {ful.notes && <div className="text-[10px] text-slate-500 mt-0.5">{ful.notes}</div>}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFulfillmentForEdit(ful);
                                  setFulfillmentStatusInput(ful.status);
                                  setFulfillmentTxRefInput(ful.transactionReference || "");
                                  setFulfillmentVoucherInput(ful.voucherCodeMasked || "");
                                  setFulfillmentNotesInput(ful.notes || "");
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                                title="Update Status & Payout Proof"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNotifyFulfillment(ful.fulfillmentId)}
                                disabled={notifyingFulfillmentId === ful.fulfillmentId}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer disabled:opacity-40"
                                title="Send Winner Email Notification"
                              >
                                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── PHASE 8: SPONSORS TAB ─── */}
      {activeTab === "sponsors" && (
        <div className="space-y-6">
          {/* Header & Main Actions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Phase 8 Active
                </span>
                <span className="text-xs text-slate-500 font-medium">Corporate Partnership Directory</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Hackathon Sponsors & Partners
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage tiered brand placements (<code className="bg-slate-100 text-purple-600 px-1 py-0.5 rounded font-mono">TITLE, PLATINUM, GOLD, SILVER, COMMUNITY</code>), benefits, and confidential contact directory.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSponsorFormMode("create");
                setSelectedSponsorForForm(null);
                setSponsorFormData({
                  name: "",
                  logoUrl: "",
                  websiteUrl: "",
                  description: "",
                  tier: "SILVER",
                  contactName: "",
                  contactEmail: "",
                  contactPhone: "",
                  benefits: [],
                  active: true,
                  displayOrder: 0,
                });
                setNewBenefitInput("");
                setShowSponsorModal(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Sponsor
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Partners</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{sponsors.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Active Sponsors</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {sponsors.filter((s) => s.active).length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Title & Platinum</span>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {sponsors.filter((s) => ["TITLE", "PLATINUM"].includes(s.tier)).length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Gold & Silver</span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {sponsors.filter((s) => ["GOLD", "SILVER"].includes(s.tier)).length}
              </p>
            </div>
          </div>

          {/* Sponsors Cards Grid */}
          {loadingSponsors ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
              <p className="text-xs font-semibold">Loading sponsors registry...</p>
            </div>
          ) : sponsors.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 space-y-2">
              <Building className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No sponsors registered</p>
              <p className="text-xs">Click "Add New Sponsor" to register corporate partners and showcase logos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {sponsors.map((sp) => (
                <div key={sp.sponsorId} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          sp.tier === "TITLE"
                            ? "bg-purple-100 text-purple-800 border border-purple-300"
                            : sp.tier === "PLATINUM"
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                            : sp.tier === "GOLD"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : sp.tier === "SILVER"
                            ? "bg-slate-100 text-slate-800 border border-slate-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {sp.tier} Partner
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sp.active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {sp.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {sp.logoUrl ? (
                        <img
                          src={sp.logoUrl}
                          alt={sp.name}
                          className="w-12 h-12 object-contain rounded-xl border border-slate-100 p-1 bg-slate-50"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-base border border-purple-100">
                          {sp.name?.slice(0, 2)?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-black text-slate-900 text-base">{sp.name}</h4>
                        {sp.websiteUrl && (
                          <a
                            href={sp.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-purple-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Globe className="w-3 h-3" /> Visit Website
                          </a>
                        )}
                      </div>
                    </div>

                    {sp.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">{sp.description}</p>
                    )}

                    {sp.benefits && sp.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {sp.benefits.map((b, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700 font-medium">
                            {b}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Confidential Contact Details for Admin */}
                    {(sp.contactName || sp.contactEmail || sp.contactPhone) && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                          Internal POC
                        </span>
                        {sp.contactName && <div className="font-bold text-slate-800">{sp.contactName}</div>}
                        {sp.contactEmail && <div>{sp.contactEmail}</div>}
                        {sp.contactPhone && <div>{sp.contactPhone}</div>}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSponsorFormMode("edit");
                        setSelectedSponsorForForm(sp);
                        setSponsorFormData({
                          name: sp.name,
                          logoUrl: sp.logoUrl || "",
                          websiteUrl: sp.websiteUrl || "",
                          description: sp.description || "",
                          tier: sp.tier || "SILVER",
                          contactName: sp.contactName || "",
                          contactEmail: sp.contactEmail || "",
                          contactPhone: sp.contactPhone || "",
                          benefits: sp.benefits || [],
                          active: sp.active ?? true,
                          displayOrder: sp.displayOrder || 0,
                        });
                        setNewBenefitInput("");
                        setShowSponsorModal(true);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      title="Edit Sponsor"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-purple-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSponsor(sp.sponsorId)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                      title="Delete Sponsor"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: VIEW & PRINT CERTIFICATE ─── */}
      {selectedCertForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Certificate: {selectedCertForView.certificateNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Issued to {selectedCertForView.recipientName} ({selectedCertForView.recipientEmail})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      printWindow.document.write(selectedCertForView.htmlContent);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => printWindow.print(), 250);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCertForView(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
              <iframe
                title="Certificate Preview"
                srcDoc={selectedCertForView.htmlContent}
                className="w-full h-[550px] rounded-lg border-0 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REVOKE CERTIFICATE ─── */}
      {selectedCertForRevoke && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Revoke Certificate
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCertForRevoke(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="font-bold">Serial: {selectedCertForRevoke.certificateNumber}</div>
              <div>Recipient: {selectedCertForRevoke.recipientName} ({selectedCertForRevoke.recipientEmail})</div>
              <div>Team: {selectedCertForRevoke.team?.name || "Team"}</div>
              <p className="text-[11px] text-rose-700 pt-1">
                Warning: Revocation is irreversible. The public verification page will display this certificate as permanently invalidated.
              </p>
            </div>

            <form onSubmit={handleRevokeCertificateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Revocation Rationale / Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Disqualified due to plagiarism / code submission violation..."
                  value={revocationReasonInput}
                  onChange={(e) => setRevocationReasonInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCertForRevoke(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revokingCertificate}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {revokingCertificate ? "Revoking..." : "Confirm Revocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT PRIZE ─── */}
      {showPrizeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-500" />
                {prizeFormMode === "create" ? "Add New Hackathon Prize" : "Edit Prize Configuration"}
              </h3>
              <button
                type="button"
                onClick={() => setShowPrizeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrize} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Prize Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Place Overall Champion"
                  value={prizeFormData.name}
                  onChange={(e) => setPrizeFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={prizeFormData.category}
                    onChange={(e) => setPrizeFormData((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="WINNER_1ST">Winner (1st Place)</option>
                    <option value="RUNNER_UP_2ND">Runner-Up (2nd Place)</option>
                    <option value="RUNNER_UP_3RD">2nd Runner-Up (3rd Place)</option>
                    <option value="SPECIAL_TRACK">Special Track Award</option>
                    <option value="CONSOLATION">Consolation Prize</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reward Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prizeFormData.amount}
                    onChange={(e) => setPrizeFormData((p) => ({ ...p, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fulfillment Method</label>
                  <select
                    value={prizeFormData.fulfillmentMethod}
                    onChange={(e) => setPrizeFormData((p) => ({ ...p, fulfillmentMethod: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                    <option value="UPI">UPI Payout</option>
                    <option value="VOUCHER">Digital Voucher / Coupon</option>
                    <option value="SWAG_PHYSICAL">Physical Swag / Kit</option>
                    <option value="CERTIFICATE_ONLY">Certificate Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sponsor Allocation</label>
                  <select
                    value={prizeFormData.sponsorId}
                    onChange={(e) => setPrizeFormData((p) => ({ ...p, sponsorId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Organizer Direct (No Sponsor)</option>
                    {sponsors.map((sp) => (
                      <option key={sp.sponsorId} value={sp.sponsorId}>
                        {sp.name} ({sp.tier})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Track Restriction (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. AI / Machine Learning"
                    value={prizeFormData.trackRestriction}
                    onChange={(e) => setPrizeFormData((p) => ({ ...p, trackRestriction: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rank Restriction</label>
                  <input
                    type="number"
                    min="1"
                    value={prizeFormData.rankRestriction}
                    onChange={(e) => setPrizeFormData((p) => ({ ...p, rankRestriction: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Prize Description</label>
                <textarea
                  rows={2}
                  placeholder="Details of the prize package, cloud credits, gadgets, or trophies..."
                  value={prizeFormData.description}
                  onChange={(e) => setPrizeFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPrizeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrize}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingPrize ? "Saving..." : "Save Prize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: UPDATE FULFILLMENT STATUS ─── */}
      {selectedFulfillmentForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-600" />
                Update Fulfillment: {selectedFulfillmentForEdit.team?.name || "Team"}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedFulfillmentForEdit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFulfillment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Fulfillment Status</label>
                <select
                  value={fulfillmentStatusInput}
                  onChange={(e) => setFulfillmentStatusInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PENDING">PENDING (Awaiting Banking Info)</option>
                  <option value="PROCESSING">PROCESSING (Transfer Initiated)</option>
                  <option value="COMPLETED">COMPLETED (Delivered & Verified)</option>
                  <option value="FAILED">FAILED (Invalid Account / Returned)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Bank UTR / Transaction Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR1234567890 / IMPS-987654"
                  value={fulfillmentTxRefInput}
                  onChange={(e) => setFulfillmentTxRefInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Masked Voucher Code (if voucher reward)
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWS-XXXX-YYYY-1234"
                  value={fulfillmentVoucherInput}
                  onChange={(e) => setFulfillmentVoucherInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Administrative Notes</label>
                <textarea
                  rows={2}
                  placeholder="Internal audit notes, receipt link, or payment proof notes..."
                  value={fulfillmentNotesInput}
                  onChange={(e) => setFulfillmentNotesInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFulfillmentForEdit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFulfillment}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingFulfillment ? "Updating..." : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT SPONSOR ─── */}
      {showSponsorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                {sponsorFormMode === "create" ? "Add Corporate Sponsor" : "Edit Sponsor Details"}
              </h3>
              <button
                type="button"
                onClick={() => setShowSponsorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSponsor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Company / Organization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Cloud Systems"
                  value={sponsorFormData.name}
                  onChange={(e) => setSponsorFormData((s) => ({ ...s, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sponsorship Tier</label>
                  <select
                    value={sponsorFormData.tier}
                    onChange={(e) => setSponsorFormData((s) => ({ ...s, tier: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="TITLE">TITLE Partner</option>
                    <option value="PLATINUM">PLATINUM Partner</option>
                    <option value="GOLD">GOLD Partner</option>
                    <option value="SILVER">SILVER Partner</option>
                    <option value="COMMUNITY">COMMUNITY Partner</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Display Priority Order</label>
                  <input
                    type="number"
                    value={sponsorFormData.displayOrder}
                    onChange={(e) => setSponsorFormData((s) => ({ ...s, displayOrder: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://.../logo.png"
                    value={sponsorFormData.logoUrl}
                    onChange={(e) => setSponsorFormData((s) => ({ ...s, logoUrl: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://acme.com"
                    value={sponsorFormData.websiteUrl}
                    onChange={(e) => setSponsorFormData((s) => ({ ...s, websiteUrl: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description / Tagline</label>
                <textarea
                  rows={2}
                  placeholder="Empowering developers with state-of-the-art APIs..."
                  value={sponsorFormData.description}
                  onChange={(e) => setSponsorFormData((s) => ({ ...s, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Benefits Tag Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sponsor Deliverables / Benefits</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Logo on T-Shirt, Keynote Speech, Hiring Pipeline"
                    value={newBenefitInput}
                    onChange={(e) => setNewBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newBenefitInput.trim()) {
                          setSponsorFormData((s) => ({ ...s, benefits: [...s.benefits, newBenefitInput.trim()] }));
                          setNewBenefitInput("");
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newBenefitInput.trim()) {
                        setSponsorFormData((s) => ({ ...s, benefits: [...s.benefits, newBenefitInput.trim()] }));
                        setNewBenefitInput("");
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {sponsorFormData.benefits?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sponsorFormData.benefits.map((ben, bIdx) => (
                      <span key={bIdx} className="px-2 py-0.5 rounded-md text-[10px] bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 font-semibold">
                        {ben}
                        <button
                          type="button"
                          onClick={() => setSponsorFormData((s) => ({ ...s, benefits: s.benefits.filter((_, i) => i !== bIdx) }))}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Confidential POC Details */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wider">
                  Confidential Contact (Admin View Only)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={sponsorFormData.contactName}
                    onChange={(e) => setSponsorFormData((s) => ({ ...s, contactName: e.target.value }))}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={sponsorFormData.contactEmail}
                    onChange={(e) => setSponsorFormData((s) => ({ ...s, contactEmail: e.target.value }))}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={sponsorFormData.contactPhone}
                    onChange={(e) => setSponsorFormData((s) => ({ ...s, contactPhone: e.target.value }))}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sponsorFormData.active}
                    onChange={(e) => setSponsorFormData((s) => ({ ...s, active: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  Publish Sponsor Publicly on Portal
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSponsorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSponsor}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingSponsor ? "Saving..." : "Save Sponsor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PHASE 9: OPERATIONAL QUICK SEARCH MODAL ─── */}
      {showOpsSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Search className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Operational Quick Search</h3>
                  <p className="text-xs text-slate-500">
                    Find teams, participants, submissions, certificates, judges, and sponsors instantly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOpsSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteOpsSearch} className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type team name, email, submission title, certificate code, judge..."
                  value={opsSearchQuery}
                  onChange={(e) => setOpsSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-24 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  {opsSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpsSearchQuery("");
                        setOpsSearchResults(null);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={searchingOps || !opsSearchQuery.trim()}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {searchingOps ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>
            </form>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {searchingOps ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">Scanning all hackathon datasets...</span>
                </div>
              ) : opsSearchResults ? (
                <div className="space-y-6">
                  {/* Teams Results */}
                  {opsSearchResults.teams?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Teams ({opsSearchResults.teams.length})
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                        {opsSearchResults.teams.map((t) => (
                          <div
                            key={t._id}
                            className="p-3 bg-white hover:bg-slate-50/80 flex items-center justify-between gap-3 transition-colors"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900">{t.teamName}</div>
                              <div className="text-[11px] text-slate-500">
                                Track: {t.track || "Default"} • Leader: {t.leader?.email || "—"} • {t.members?.length || 0} members
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {t.status}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedTeamIdForDrawer(t._id);
                                  setShowTeamDrawer(true);
                                  setShowOpsSearchModal(false);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
                              >
                                View 360 →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submissions Results */}
                  {opsSearchResults.submissions?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Submissions ({opsSearchResults.submissions.length})
                      </span>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                        {opsSearchResults.submissions.map((s) => (
                          <div
                            key={s._id}
                            className="p-3 bg-white hover:bg-slate-50/80 flex items-center justify-between gap-3 transition-colors"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900">{s.projectTitle}</div>
                              <div className="text-[11px] text-slate-500">
                                Track: {s.track} • Locked: {s.isLocked ? "Yes" : "No"}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setActiveTab("submissions");
                                setShowOpsSearchModal(false);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              Jump to Submissions →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certificates Results */}
                  {opsSearchResults.certificates?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Certificates ({opsSearchResults.certificates.length})
                      </span>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                        {opsSearchResults.certificates.map((c) => (
                          <div
                            key={c._id}
                            className="p-3 bg-white hover:bg-slate-50/80 flex items-center justify-between gap-3 transition-colors"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900">{c.recipientName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Code: {c.verificationCode} • Num: {c.certificateNumber}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setActiveTab("certificates");
                                setShowOpsSearchModal(false);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              Certificates →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Judges Results */}
                  {opsSearchResults.judges?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Judges ({opsSearchResults.judges.length})
                      </span>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                        {opsSearchResults.judges.map((j) => (
                          <div
                            key={j._id}
                            className="p-3 bg-white hover:bg-slate-50/80 flex items-center justify-between gap-3 transition-colors"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900">{j.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {j.email} • Domain: {j.domainExpertise?.join(", ") || "General"}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setActiveTab("editorial");
                                setShowOpsSearchModal(false);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              Judges →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sponsors Results */}
                  {opsSearchResults.sponsors?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Sponsors ({opsSearchResults.sponsors.length})
                      </span>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                        {opsSearchResults.sponsors.map((sp) => (
                          <div
                            key={sp._id}
                            className="p-3 bg-white hover:bg-slate-50/80 flex items-center justify-between gap-3 transition-colors"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900">{sp.name}</div>
                              <div className="text-[11px] text-slate-500">Tier: {sp.tier}</div>
                            </div>
                            <button
                              onClick={() => {
                                setActiveTab("sponsors");
                                setShowOpsSearchModal(false);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              Sponsors →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {opsSearchResults.teams?.length === 0 &&
                    opsSearchResults.submissions?.length === 0 &&
                    opsSearchResults.certificates?.length === 0 &&
                    opsSearchResults.judges?.length === 0 &&
                    opsSearchResults.sponsors?.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No records matched your search query "{opsSearchQuery}".
                      </div>
                    )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Type a keyword above to search teams, participants, codes, judges, or projects.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── PHASE 9: CONTROLLED CSV DATA EXPORT MODAL ─── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <DownloadCloud className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Export Hackathon Datasets</h3>
                  <p className="text-xs text-slate-500">
                    Formula-injection sanitized CSV files with sensitive credentials stripped
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {[
                {
                  id: "teams",
                  title: "Teams & Participants",
                  desc: "Complete roster of registered and confirmed teams, tracks, leader contacts, and payment status.",
                },
                {
                  id: "submissions",
                  title: "Final Submissions",
                  desc: "Project titles, GitHub repo URLs, demo links, locks, and final submission timestamps.",
                },
                {
                  id: "editorial-assignments",
                  title: "Editorial Assignments",
                  desc: "Judge assignments, domain allocations, evaluation statuses, and blind review IDs.",
                },
                {
                  id: "editorial-evaluations",
                  title: "Editorial Evaluations",
                  desc: "Granular scores per criterion, judge comments, and feedback rubrics.",
                },
                {
                  id: "results",
                  title: "Official Results & Rankings",
                  desc: "Final computed scores, global ranks, tiebreak resolutions, and winner allocations.",
                },
                {
                  id: "certificates",
                  title: "Issued Certificates",
                  desc: "Recipient names, certificate numbers, track, verification codes, and issuance timestamps.",
                },
                {
                  id: "prizes",
                  title: "Prize Fulfillment Pipeline",
                  desc: "Prize allocation amounts, claim statuses, payment modes, and delivery tracking notes.",
                },
                {
                  id: "sponsors",
                  title: "Sponsors & Partners",
                  desc: "Partner directory, tier classifications, order rank, and official website URLs.",
                },
              ].map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      {res.title}
                    </h4>
                    <p className="text-[11px] text-slate-500">{res.desc}</p>
                  </div>
                  <button
                    disabled={exportingResource !== null}
                    onClick={() => handleDownloadExport(res.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5 disabled:opacity-40 transition-transform active:scale-95"
                  >
                    {exportingResource === res.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" /> Exporting...
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-3.5 h-3.5 text-slate-500" /> Download
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Encrypted transfer via Admin JWT</span>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
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

