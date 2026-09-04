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
  Unlock,
  Lock,
  UserCheck,
  UserX,
  KeyRound,
  RotateCcw,
  Medal,
  Check,
  X,
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
            { id: "editorial", label: "Editorial & Judges", icon: Award, badge: editorialMembers.length > 0 ? `${editorialMembers.length} Judges` : "Active" },
            {
              id: "submissions",
              label: "Submissions",
              icon: FileText,
              badge: stats.finalSubmissions > 0 ? `${stats.finalSubmissions} Submissions` : "Active",
            },
            { id: "judging", label: "Judging & Evaluations", icon: Sparkles, badge: aggregatedResults.length > 0 ? `${aggregatedResults.length} Evaluated` : "Active" },
            { id: "results", label: "Results", icon: Trophy, badge: resultsSummary.total > 0 ? `${resultsSummary.total} Ranked` : "Official" },
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

      {/* ─── PLACEHOLDER TABS (Scheduled for Later Phases) ─── */}
      {activeTab === "certificates" && (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-black text-slate-900 capitalize">
              Certificates Module
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

