import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  X,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  Video,
  FileText,
  User,
  Users,
  Lightbulb,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Star,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Award,
  AlertTriangle,
  Info,
  Calendar,
  Building2,
  MapPin,
  Phone,
  Mail,
  Layers,
  Save,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5006";

const AVAILABLE_TAGS = [
  "Innovative",
  "Strong Idea",
  "High Potential",
  "Needs Improvement",
  "Feasible",
  "Scalable",
  "Unique Approach",
  "Other",
];

export default function TeamDetailDrawer({
  teamId,
  isOpen,
  onClose,
  onTeamUpdated,
  onOpenEdit,
  onOpenDelete,
}) {
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showRawData, setShowRawData] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Review Form State
  const [scores, setScores] = useState({
    innovation: "",
    ideaQuality: "",
    feasibility: "",
    presentation: "",
  });
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [savingReview, setSavingReview] = useState(false);

  // Status Action Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const getAdminToken = () => {
    return localStorage.getItem("adminToken") || localStorage.getItem("token");
  };

  const fetchTeamDetails = async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const token = getAdminToken();
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/admin/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        const t = res.data.team;
        setTeam(t);
        setAuditLogs(res.data.auditLogs || []);

        // Populate Review state
        const rev = t.adminReview || {};
        setScores({
          innovation: rev.scores?.innovation ?? "",
          ideaQuality: rev.scores?.ideaQuality ?? "",
          feasibility: rev.scores?.feasibility ?? "",
          presentation: rev.scores?.presentation ?? "",
        });
        setReviewNotes(rev.notes || "");
        setSelectedTags(rev.tags || []);
      }
    } catch (err) {
      console.error("fetchTeamDetails error:", err);
      toast.error(err.response?.data?.message || "Failed to load team details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && teamId) {
      fetchTeamDetails();
    }
  }, [isOpen, teamId]);

  const handleScoreChange = (field, val) => {
    if (val === "") {
      setScores((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    const num = Math.min(10, Math.max(0, Number(val)));
    setScores((prev) => ({ ...prev, [field]: num }));
  };

  const calculateTotalScore = () => {
    const vals = [scores.innovation, scores.ideaQuality, scores.feasibility, scores.presentation]
      .filter((v) => v !== "" && v !== null && !isNaN(v))
      .map(Number);
    if (vals.length === 0) return null;
    return vals.reduce((acc, c) => acc + c, 0);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveReview = async (e) => {
    e?.preventDefault();
    try {
      setSavingReview(true);
      const token = getAdminToken();
      const payload = {
        scores: {
          innovation: scores.innovation !== "" ? Number(scores.innovation) : null,
          ideaQuality: scores.ideaQuality !== "" ? Number(scores.ideaQuality) : null,
          feasibility: scores.feasibility !== "" ? Number(scores.feasibility) : null,
          presentation: scores.presentation !== "" ? Number(scores.presentation) : null,
        },
        notes: reviewNotes,
        tags: selectedTags,
      };

      const res = await axios.put(
        `${BACKEND_URL}/api/hackathon/admin/teams/${team.teamId}/review`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success("Initial review saved successfully!");
        setTeam((prev) => ({
          ...prev,
          adminReview: res.data.adminReview,
          status: res.data.status,
        }));
        if (onTeamUpdated) onTeamUpdated();
      }
    } catch (err) {
      console.error("handleSaveReview error:", err);
      toast.error(err.response?.data?.message || "Failed to save review");
    } finally {
      setSavingReview(false);
    }
  };

  const handleShortlist = async () => {
    try {
      setUpdatingStatus(true);
      const token = getAdminToken();
      const res = await axios.put(
        `${BACKEND_URL}/api/hackathon/admin/teams/${team.teamId}/status`,
        { status: "SHORTLISTED", note: "Admin shortlisted team during initial review" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Team shortlisted successfully!");
        setTeam((prev) => ({
          ...prev,
          status: "SHORTLISTED",
          shortlistedAt: res.data.team?.shortlistedAt,
        }));
        if (onTeamUpdated) onTeamUpdated();
      }
    } catch (err) {
      console.error("handleShortlist error:", err);
      toast.error(err.response?.data?.message || "Failed to shortlist team");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRejectConfirm = async () => {
    try {
      setUpdatingStatus(true);
      const token = getAdminToken();
      const res = await axios.put(
        `${BACKEND_URL}/api/hackathon/admin/teams/${team.teamId}/status`,
        { status: "REJECTED", rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast.success("Team rejected.");
        setTeam((prev) => ({
          ...prev,
          status: "REJECTED",
          rejectionReason,
        }));
        setShowRejectModal(false);
        setRejectionReason("");
        if (onTeamUpdated) onTeamUpdated();
      }
    } catch (err) {
      console.error("handleRejectConfirm error:", err);
      toast.error(err.response?.data?.message || "Failed to reject team");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCopyRaw = () => {
    if (team?.rawUnstopData) {
      navigator.clipboard.writeText(JSON.stringify(team.rawUnstopData, null, 2));
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
      toast.info("Raw JSON copied to clipboard");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "SHORTLISTED":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          text: "Shortlisted",
        };
      case "REJECTED":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
          text: "Rejected",
        };
      case "UNDER_REVIEW":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
          text: "Under Review",
        };
      case "IMPORTED":
      default:
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
          text: status || "Imported",
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-4xl bg-slate-50 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 border-l border-slate-200">
        {/* Top Sticky Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 tracking-tight truncate">
                  {loading ? "Loading Team Details..." : team?.teamName || "Team Profile"}
                </h2>
                {team?.teamId && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                    {team.teamId}
                  </span>
                )}
                {team?.source === "MANUAL_ADMIN" ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                    Manual Team
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    Unstop Import
                  </span>
                )}
                {team?.status && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      getStatusBadge(team.status).bg
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        getStatusBadge(team.status).dot
                      }`}
                    />
                    {getStatusBadge(team.status).text}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Track: <span className="font-semibold text-slate-700">{team?.track || "General Track"}</span>
                {team?.unstopApplicationId && (
                  <> • Unstop App ID: <span className="font-mono text-slate-700">{team.unstopApplicationId}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEdit(team)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              Edit
            </button>
            <button
              onClick={() => onOpenDelete(team)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Delete
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
            <div className="space-y-3 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Loading complete team record...</p>
            </div>
          </div>
        ) : !team ? (
          <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
            <p className="text-sm font-semibold">Team record not found or has been deleted.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Action Banner: Shortlist / Reject / Current Lifecycle */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Initial Review Decision
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Current Phase 3 Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                      getStatusBadge(team.status).bg
                    }`}
                  >
                    {team.status}
                  </span>
                </div>
                {team.shortlistedAt && (
                  <p className="text-[11px] text-emerald-600">
                    Shortlisted on {new Date(team.shortlistedAt).toLocaleDateString()} at{" "}
                    {new Date(team.shortlistedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
                {team.rejectionReason && (
                  <p className="text-[11px] text-rose-600">
                    Rejection Note: <span className="font-medium italic">{team.rejectionReason}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {team.status !== "SHORTLISTED" && (
                  <button
                    disabled={updatingStatus}
                    onClick={handleShortlist}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Shortlist Team
                  </button>
                )}

                {team.status !== "REJECTED" && (
                  <button
                    disabled={updatingStatus}
                    onClick={() => setShowRejectModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Team
                  </button>
                )}
              </div>
            </div>

            {/* SECTION 1: ADMIN REVIEW & SCORING WORKFLOW (Step 12) */}
            <form onSubmit={handleSaveReview} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Admin Initial Review & Scoring (Internal)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Internal notes and scorecards. Strictly hidden from participants and external users.
                  </p>
                </div>
                {calculateTotalScore() !== null && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Score</span>
                    <div className="text-lg font-black text-indigo-600">
                      {calculateTotalScore()} <span className="text-xs text-slate-400 font-normal">/ 40</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Score Sliders / Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: "innovation", label: "Innovation", desc: "Novelty & originality" },
                  { key: "ideaQuality", label: "Idea Quality", desc: "Clarity & depth" },
                  { key: "feasibility", label: "Feasibility", desc: "Technical viability" },
                  { key: "presentation", label: "Presentation", desc: "PPT & structure" },
                ].map((crit) => (
                  <div key={crit.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">{crit.label}</label>
                      <span className="text-[11px] font-extrabold text-indigo-600">
                        {scores[crit.key] !== "" ? `${scores[crit.key]}/10` : "—/10"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{crit.desc}</p>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      placeholder="0 - 10"
                      value={scores[crit.key]}
                      onChange={(e) => handleScoreChange(crit.key, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>

              {/* Tags Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Assessment Tags</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Notes Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Internal Review Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter private observations, questions for participants, or reasons for shortlisting/rejection..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-400">
                  {team.adminReview?.reviewedBy && (
                    <>
                      Last reviewed by <span className="font-semibold text-slate-600">{team.adminReview.reviewedBy}</span>
                      {team.adminReview.reviewedAt && (
                        <> on {new Date(team.adminReview.reviewedAt).toLocaleDateString()}</>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={savingReview}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${savingReview ? "animate-spin" : ""}`} />
                  {savingReview ? "Saving Review..." : "Save Review"}
                </button>
              </div>
            </form>

            {/* SECTION 2: IDEA & PROJECT INFORMATION (Step 5) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Idea & Project Submission
                </h3>
                {team.initialIdea?.pptUrl && (
                  <a
                    href={team.initialIdea.pptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Open PPT Deck <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project / Idea Title</span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    {team.initialIdea?.title || "No title provided"}
                  </h4>
                </div>

                {team.initialIdea?.theme && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Theme</span>
                    <p className="text-xs font-semibold text-indigo-600 mt-0.5">{team.initialIdea.theme}</p>
                  </div>
                )}

                {team.initialIdea?.problemStatement && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Problem Statement
                    </span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {team.initialIdea.problemStatement}
                    </p>
                  </div>
                )}

                {team.initialIdea?.proposedSolution && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Proposed Solution
                    </span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {team.initialIdea.proposedSolution}
                    </p>
                  </div>
                )}

                {team.initialIdea?.description && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Overview Description
                    </span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {team.initialIdea.description}
                    </p>
                  </div>
                )}

                {team.initialIdea?.techStack && team.initialIdea.techStack.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Technologies & Tech Stack
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {team.initialIdea.techStack.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: SUBMITTED LINKS (Step 7) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Globe className="w-4 h-4 text-indigo-600" />
                Submitted Project Links
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {team.submittedLinks?.githubUrl ? (
                  <a
                    href={team.submittedLinks.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Github className="w-4 h-4 text-slate-700" />
                      <span className="truncate">GitHub Repo</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                    <Github className="w-4 h-4 opacity-40" />
                    <span>No GitHub repository</span>
                  </div>
                )}

                {team.submittedLinks?.hostedProjectUrl ? (
                  <a
                    href={team.submittedLinks.hostedProjectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span className="truncate">Hosted Live Demo</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                    <Globe className="w-4 h-4 opacity-40" />
                    <span>No hosted link</span>
                  </div>
                )}

                {team.submittedLinks?.linkedInUrl ? (
                  <a
                    href={team.submittedLinks.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      <span className="truncate">LinkedIn</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                    <Linkedin className="w-4 h-4 opacity-40" />
                    <span>No LinkedIn link</span>
                  </div>
                )}

                {team.submittedLinks?.demoVideoUrl ? (
                  <a
                    href={team.submittedLinks.demoVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Video className="w-4 h-4 text-rose-600" />
                      <span className="truncate">Demo Video</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                    <Video className="w-4 h-4 opacity-40" />
                    <span>No demo video</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: TEAM LEADER & MEMBERS (Steps 4 & 5) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Team Members ({(team.members || []).length + 1})
                </h3>
              </div>

              {/* Leader Card */}
              <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {team.leader?.name?.slice(0, 1) || "L"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{team.leader?.name || "—"}</h4>
                      <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                        Team Leader
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    Primary Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{team.leader?.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{team.leader?.mobile || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{team.leader?.college || "No college"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{team.leader?.state || "No state"}</span>
                  </div>
                </div>
              </div>

              {/* Other Members Cards */}
              <div className="space-y-2">
                {(team.members || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No additional team members listed.</p>
                ) : (
                  team.members.map((member, idx) => (
                    <div
                      key={member._id || idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {member.name?.slice(0, 1) || "M"}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800">{member.name}</h5>
                            <span className="text-[10px] text-slate-400 font-semibold">{member.role || "Member"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{member.mobile || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{member.college || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{member.state || "—"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION 5: ORIGINAL UNSTOP DATA (Collapsible Accordion - Step 8) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRawData(!showRawData)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-black text-slate-900">
                    Original Unstop Data (Collapsible • Admin Only)
                  </span>
                  {team.rawUnstopData && Object.keys(team.rawUnstopData).length > 0 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {Object.keys(team.rawUnstopData).length} fields preserved
                    </span>
                  )}
                </div>
                {showRawData ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showRawData && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500">
                      Exact raw key-value attributes imported from the Unstop Excel file without alterations.
                    </p>
                    <button
                      onClick={handleCopyRaw}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      {copiedRaw ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedRaw ? "Copied" : "Copy JSON"}
                    </button>
                  </div>

                  {!team.rawUnstopData || Object.keys(team.rawUnstopData).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No extra unmapped Unstop fields recorded.</p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5 w-1/3">Original Column Name</th>
                            <th className="p-2.5">Imported Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(team.rawUnstopData).map(([key, val], idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono text-[11px] text-slate-700 font-semibold">{key}</td>
                              <td className="p-2.5 font-mono text-[11px] text-slate-500 break-all">
                                {typeof val === "object" ? JSON.stringify(val) : String(val || "—")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 6: AUDIT TRAIL FOR THIS TEAM (Step 17) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                Team Audit Trail ({auditLogs.length} events)
              </h3>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No specific audit history for this team yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div
                      key={log._id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-600">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Actor: <span className="font-semibold text-slate-800">{log.actorName}</span> ({log.role})
                        {log.reason && <> • {log.reason}</>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Rejection */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center font-bold">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Reject Team Confirmation</h3>
                <p className="text-xs text-slate-500">Set lifecycle status to REJECTED</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to mark <span className="font-bold text-slate-900">{team?.teamName}</span> (
              <span className="font-mono font-bold text-indigo-600">{team?.teamId}</span>) as Rejected?
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Internal Rejection Reason / Feedback (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Reason for rejection (e.g., project out of scope, incomplete deck, duplicate submission)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleRejectConfirm}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-50"
              >
                {updatingStatus ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
