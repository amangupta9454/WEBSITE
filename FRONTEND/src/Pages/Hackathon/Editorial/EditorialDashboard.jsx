import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Shield,
  Award,
  Users,
  CheckCircle2,
  Clock,
  LogOut,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Sparkles,
  FileText,
  Github,
  Globe,
  Linkedin,
  Video,
  Lock,
  ChevronRight,
  Save,
  KeyRound,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function EditorialDashboard() {
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const [judge, setJudge] = useState(null);
  const [stats, setStats] = useState({ assignedCount: 0, pendingCount: 0, completedCount: 0 });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [trackFilter, setTrackFilter] = useState("ALL");

  // Selected Project for Evaluation Drawer
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [evaluationDetail, setEvaluationDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Evaluation Form State
  const [scores, setScores] = useState([]);
  const [comments, setComments] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const getJudgeToken = () => localStorage.getItem("editorialToken");

  // Logout handler
  const handleLogout = async () => {
    try {
      const token = getJudgeToken();
      if (token) {
        await axios.post(
          `${BACKEND_URL}/api/hackathon/editorial/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("editorialToken");
      localStorage.removeItem("editorialUser");
      toast.success("Logged out successfully.");
      navigate("/editorial/login");
    }
  };

  // Fetch Dashboard & Projects
  const fetchDashboardData = async () => {
    const token = getJudgeToken();
    if (!token) {
      navigate("/editorial/login");
      return;
    }

    try {
      setLoading(true);

      // Fetch Profile
      const profileRes = await axios.get(`${BACKEND_URL}/api/hackathon/editorial/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.data?.success) {
        setJudge(profileRes.data.member);
      }

      // Fetch Stats
      const statsRes = await axios.get(`${BACKEND_URL}/api/hackathon/editorial/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }

      // Fetch Projects
      const projectsRes = await axios.get(`${BACKEND_URL}/api/hackathon/editorial/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (projectsRes.data?.success) {
        setProjects(projectsRes.data.projects || []);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired or unauthorized. Please login again.");
        handleLogout();
      } else {
        toast.error("Failed to load evaluation data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Open Project Detail & Initialize Evaluation
  const openProjectEvaluation = async (teamId) => {
    setSelectedTeamId(teamId);
    setLoadingDetail(true);
    const token = getJudgeToken();

    try {
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/editorial/projects/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setEvaluationDetail(res.data);

        const criteriaList = res.data.judgingCriteria || [];
        const existingScores = res.data.evaluation?.scores || [];

        // Initialize score form from criteria and previous evaluation state
        const initialScores = criteriaList.map((crit) => {
          const matched = existingScores.find(
            (s) => s.criterion.toLowerCase().trim() === crit.title.toLowerCase().trim()
          );
          return {
            criterion: crit.title,
            score: matched ? matched.score : 0,
            maxScore: crit.maxScore || 25,
            description: crit.description || "",
          };
        });

        setScores(initialScores);
        setComments(res.data.evaluation?.comments || "");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load project details.");
      setSelectedTeamId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Safe Deliverable Click with Audit Logging
  const handleDeliverableClick = async (linkType, url) => {
    if (!url) return;
    try {
      const token = getJudgeToken();
      await axios.post(
        `${BACKEND_URL}/api/hackathon/editorial/projects/${selectedTeamId}/audit-link-click`,
        { linkType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn("Audit log call failed:", err);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Score Slider Change Handler
  const handleScoreChange = (criterionTitle, newScore) => {
    setScores((prev) =>
      prev.map((item) =>
        item.criterion === criterionTitle
          ? { ...item, score: Math.max(0, Math.min(item.maxScore, Number(newScore) || 0)) }
          : item
      )
    );
  };

  const calculatedCurrentTotal = scores.reduce((sum, s) => sum + Number(s.score || 0), 0);

  // Save Draft
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const token = getJudgeToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/editorial/projects/${selectedTeamId}/evaluation/draft`,
        {
          scores,
          comments,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success("Draft evaluation saved successfully!");
        setEvaluationDetail((prev) => ({
          ...prev,
          evaluation: res.data.evaluation,
        }));
        // Refresh project list status
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save evaluation draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  // Finalize Evaluation
  const handleFinalize = async () => {
    try {
      setFinalizing(true);
      const token = getJudgeToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/hackathon/editorial/projects/${selectedTeamId}/evaluation/finalize`,
        {
          scores,
          comments,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success("Evaluation finalized and locked successfully!");
        setEvaluationDetail((prev) => ({
          ...prev,
          evaluation: res.data.evaluation,
        }));
        setShowFinalizeModal(false);
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to finalize evaluation.");
    } finally {
      setFinalizing(false);
    }
  };

  // Self-service Password Change
  const handleSelfPasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setUpdatingPassword(true);
      const token = getJudgeToken();
      const res = await axios.put(
        `${BACKEND_URL}/api/hackathon/editorial/password`,
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success("Password updated successfully!");
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Filtered Projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.teamId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.leaderName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || p.evaluationStatus === statusFilter;

    const matchesTrack =
      trackFilter === "ALL" || p.track === trackFilter;

    return matchesSearch && matchesStatus && matchesTrack;
  });

  const isLocked = evaluationDetail?.evaluation?.isLocked || evaluationDetail?.evaluation?.status === "FINALIZED";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900/90 border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">Code-A-Nova</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-wide">
                  Editorial Panel
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Official Evaluation Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {judge && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white">{judge.name}</span>
                <span className="text-[10px] text-slate-400">{judge.email}</span>
              </div>
            )}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Change Password"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Projects</p>
                <h3 className="text-3xl font-extrabold text-white mt-1">{stats.assignedCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Projects assigned to your judging panel</p>
          </div>

          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Evaluations</p>
                <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{stats.pendingCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Awaiting your final evaluation & scores</p>
          </div>

          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Evaluations</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{stats.completedCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Finalized & locked for official ranking</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by team, ID, or leader..."
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">Draft in Progress</option>
              <option value="FINALIZED">Finalized</option>
            </select>

            {/* Track Filter */}
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Tracks</option>
              <option value="AI & Machine Learning">AI & Machine Learning</option>
              <option value="Web3 & Decentralized Tech">Web3 & Decentralized Tech</option>
              <option value="Full Stack & Cloud Native">Full Stack & Cloud Native</option>
              <option value="Open Innovation & Social Good">Open Innovation & Social Good</option>
            </select>

            <button
              onClick={fetchDashboardData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading assigned projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-12 text-center">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">No Projects Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {projects.length === 0
                ? "You currently have no hackathon projects assigned to evaluate. Once administrators assign submissions, they will appear here."
                : "No assigned projects match your active search or filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <div
                key={project.teamId}
                className="bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {project.track}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {project.teamId}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                    {project.teamName}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                    <p>
                      Leader: <span className="font-semibold text-slate-300">{project.leaderName}</span>
                    </p>
                    <p>
                      Team Size: <span className="font-semibold text-slate-300">{project.memberCount} Members</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    {project.evaluationStatus === "FINALIZED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Finalized ({project.totalScore}/100)
                      </span>
                    ) : project.evaluationStatus === "IN_PROGRESS" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        Draft Saved ({project.totalScore}/100)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-white/10">
                        Not Started
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => openProjectEvaluation(project.teamId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer"
                  >
                    <span>{project.evaluationStatus === "FINALIZED" ? "View Scores" : "Evaluate"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Evaluation Drawer / Modal */}
      {selectedTeamId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-4xl bg-slate-900 border-l border-white/10 h-full overflow-y-auto flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  {selectedTeamId.slice(-4)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {evaluationDetail?.team?.teamName || "Loading Project..."}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Track: {evaluationDetail?.team?.track} | ID: {selectedTeamId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTeamId(null);
                  setEvaluationDetail(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-400">Loading project deliverables & evaluation criteria...</p>
              </div>
            ) : evaluationDetail ? (
              <div className="flex-1 p-6 space-y-6">
                {/* Finalized Status Alert Banner */}
                {isLocked && (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300">
                        Evaluation Finalized & Locked ({evaluationDetail.evaluation?.totalScore}/100)
                      </h4>
                      <p className="text-[11px] text-emerald-400/80">
                        This evaluation was finalized on{" "}
                        {new Date(evaluationDetail.evaluation?.finalizedAt).toLocaleDateString()} at{" "}
                        {new Date(evaluationDetail.evaluation?.finalizedAt).toLocaleTimeString()}.
                        Scores are frozen. Contact hackathon organizers to request an unlock.
                      </p>
                    </div>
                  </div>
                )}

                {/* Section 1: Team & Project Deliverables */}
                <div className="bg-slate-850/60 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Project Deliverables & Submission
                    </h3>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {evaluationDetail.submission?.projectName || evaluationDetail.team?.teamName}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {evaluationDetail.submission?.projectDescription || "No detailed description provided."}
                    </p>
                  </div>

                  {/* Problem & Solution */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <p className="font-semibold text-slate-400 mb-1">Problem Statement</p>
                      <p className="text-slate-300">
                        {evaluationDetail.submission?.problemStatement || evaluationDetail.team?.initialIdea?.problemStatement || "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <p className="font-semibold text-slate-400 mb-1">Proposed Solution</p>
                      <p className="text-slate-300">
                        {evaluationDetail.submission?.proposedSolution || evaluationDetail.team?.initialIdea?.proposedSolution || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Deliverable Action Buttons with Auditing */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {evaluationDetail.team?.initialIdea?.pptUrl && (
                      <button
                        onClick={() => handleDeliverableClick("PPT", evaluationDetail.team.initialIdea.pptUrl)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inspect Unstop PPT</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {evaluationDetail.submission?.githubUrl && (
                      <button
                        onClick={() => handleDeliverableClick("GITHUB", evaluationDetail.submission.githubUrl)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10 transition-all cursor-pointer"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub Repository</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {evaluationDetail.submission?.hostedProjectUrl && (
                      <button
                        onClick={() => handleDeliverableClick("HOSTED_LINK", evaluationDetail.submission.hostedProjectUrl)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Hosted Application</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {evaluationDetail.submission?.demoVideoUrl && (
                      <button
                        onClick={() => handleDeliverableClick("DEMO", evaluationDetail.submission.demoVideoUrl)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30 transition-all cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Demo Video</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {evaluationDetail.submission?.linkedInUrl && (
                      <button
                        onClick={() => handleDeliverableClick("LINKEDIN", evaluationDetail.submission.linkedInUrl)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        <span>LinkedIn</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 2: Evaluation Scoring Form */}
                <div className="bg-slate-850/60 border border-white/10 rounded-2xl p-5 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-indigo-400" />
                      Judging Criteria & Scores
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold">Total Score:</span>
                      <span className="text-base font-extrabold text-indigo-400 bg-indigo-500/10 px-3 py-0.5 rounded-lg border border-indigo-500/20">
                        {calculatedCurrentTotal} / 100
                      </span>
                    </div>
                  </div>

                  {/* Criteria Sliders */}
                  <div className="space-y-5">
                    {scores.map((criterionItem) => (
                      <div
                        key={criterionItem.criterion}
                        className="bg-slate-900/70 border border-white/5 rounded-xl p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white">
                              {criterionItem.criterion}
                            </span>
                            {criterionItem.description && (
                              <p className="text-[11px] text-slate-400">
                                {criterionItem.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              min={0}
                              max={criterionItem.maxScore}
                              value={criterionItem.score}
                              onChange={(e) => handleScoreChange(criterionItem.criterion, e.target.value)}
                              className="w-16 bg-slate-800 border border-white/10 rounded-lg py-1 px-2 text-center text-xs font-bold text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                            />
                            <span className="text-xs text-slate-400">/ {criterionItem.maxScore}</span>
                          </div>
                        </div>

                        <input
                          type="range"
                          disabled={isLocked}
                          min={0}
                          max={criterionItem.maxScore}
                          value={criterionItem.score}
                          onChange={(e) => handleScoreChange(criterionItem.criterion, e.target.value)}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Feedback / Comments */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Editorial Review & Qualitative Feedback
                    </label>
                    <textarea
                      disabled={isLocked}
                      rows={3}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Enter feedback regarding code quality, architectural depth, UI/UX, or potential improvements..."
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Evaluation Actions */}
                  {!isLocked && (
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                      <button
                        type="button"
                        disabled={savingDraft || finalizing}
                        onClick={handleSaveDraft}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingDraft ? "Saving..." : "Save Progress Draft"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={savingDraft || finalizing}
                        onClick={() => setShowFinalizeModal(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Finalize & Lock Evaluation</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Finalize */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 text-indigo-400 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Finalize & Lock Evaluation?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              You are about to submit a final score of{" "}
              <strong className="text-indigo-400 text-sm font-bold">{calculatedCurrentTotal} / 100</strong> for{" "}
              <strong>{evaluationDetail?.team?.teamName}</strong>.
            </p>
            <div className="bg-slate-800/80 border border-white/10 rounded-xl p-3 mb-5 text-[11px] text-slate-400 space-y-1">
              <p>• Once finalized, your scores will be frozen immediately.</p>
              <p>• You will not be able to edit or adjust scores unless reopened by Admin.</p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={finalizing}
                onClick={handleFinalize}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {finalizing ? "Finalizing..." : "Yes, Finalize & Lock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self-service Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                Change Account Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSelfPasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {updatingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
