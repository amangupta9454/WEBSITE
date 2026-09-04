import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Trophy,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Code2,
  FileText,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Bot,
  Layers,
  Award,
  Terminal,
  MessageSquare,
  HelpCircle,
  LogIn,
  Check,
  Zap,
  Info,
  Lock,
  CreditCard,
  Loader2,
  Send,
  Save,
  Github,
  Globe,
  Linkedin,
  Video,
  AlertTriangle,
  X,
  Copy,
  Rocket,
  Edit2,
  Medal,
  Download,
  Gift,
} from "lucide-react";
import SEO from "../../Components/SEO";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5006";

export default function HackathonPortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeFaq, setActiveFaq] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // Phase 5: Submission Portal State
  const [submissionData, setSubmissionData] = useState(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [submissionFormError, setSubmissionFormError] = useState(null);
  const [submissionFormSuccess, setSubmissionFormSuccess] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    projectName: "",
    projectDescription: "",
    problemStatement: "",
    proposedSolution: "",
    techStack: "",
    githubUrl: "",
    hostedProjectUrl: "",
    linkedInUrl: "",
    demoVideoUrl: "",
    otherLinks: "",
    additionalNotes: "",
  });
  const [deadlineCountdown, setDeadlineCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPassed: false,
  });

  const fetchSubmissionData = async (explicitTeamId = null) => {
    const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
    if (!token) return;
    try {
      setLoadingSubmission(true);
      const tid = explicitTeamId || userTeam?.teamId;
      const teamIdParam = tid ? `?teamId=${encodeURIComponent(tid)}` : "";
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/submission/my-submission${teamIdParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.submission) {
        const sub = res.data.submission;
        setSubmissionData(sub);
        setSubmissionForm({
          projectName: sub.projectName || "",
          projectDescription: sub.projectDescription || "",
          problemStatement: sub.problemStatement || "",
          proposedSolution: sub.proposedSolution || "",
          techStack: Array.isArray(sub.techStack) ? sub.techStack.join(", ") : "",
          githubUrl: sub.githubUrl || "",
          hostedProjectUrl: sub.hostedProjectUrl || "",
          linkedInUrl: sub.linkedInUrl || "",
          demoVideoUrl: sub.demoVideoUrl || "",
          otherLinks: Array.isArray(sub.otherLinks) ? sub.otherLinks.join("\n") : "",
          additionalNotes: sub.additionalNotes || "",
        });
      }
    } catch (err) {
      console.log("Submission info check:", err.response?.data?.message);
    } finally {
      setLoadingSubmission(false);
    }
  };

  // Phase 7: Participant Official Result State
  const [myResultData, setMyResultData] = useState(null);
  const [loadingMyResult, setLoadingMyResult] = useState(false);

  const fetchMyResult = async () => {
    const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
    if (!token) return;
    try {
      setLoadingMyResult(true);
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/results/my-result`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setMyResultData(res.data);
      }
    } catch (err) {
      console.log("Participant result check:", err.response?.data?.message);
    } finally {
      setLoadingMyResult(false);
    }
  };

  // Phase 8: Participant Certificates & Prizes State
  const [myCertificates, setMyCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [myPrizes, setMyPrizes] = useState([]);
  const [loadingPrizes, setLoadingPrizes] = useState(false);

  const fetchMyCertificates = async () => {
    const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
    if (!token) return;
    try {
      setLoadingCertificates(true);
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/certificates/my-certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setMyCertificates(res.data.certificates || []);
      }
    } catch (err) {
      console.log("Certificates fetch check:", err.response?.data?.message);
    } finally {
      setLoadingCertificates(false);
    }
  };

  const fetchMyPrizes = async () => {
    const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
    if (!token) return;
    try {
      setLoadingPrizes(true);
      const res = await axios.get(`${BACKEND_URL}/api/hackathon/prizes/my-prizes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setMyPrizes(res.data.prizes || []);
      }
    } catch (err) {
      console.log("Prizes fetch check:", err.response?.data?.message);
    } finally {
      setLoadingPrizes(false);
    }
  };

  // Check auth and fetch data
  useEffect(() => {
    const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
    setIsLoggedIn(!!token);

    const loadData = async () => {
      try {
        setLoading(true);
        // 1. Fetch public hackathon details
        const infoRes = await axios.get(`${BACKEND_URL}/api/hackathon/info`);
        if (infoRes.data?.success) {
          setSettings(infoRes.data.data);
        }

        // 2. If logged in, fetch participant's team
        if (token) {
          try {
            const teamRes = await axios.get(`${BACKEND_URL}/api/hackathon/my-team`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (teamRes.data?.success && teamRes.data?.hasTeam) {
              const t = teamRes.data.team;
              setUserTeam(t);
              setIsLeader(teamRes.data.isLeader);

              // If confirmed/submitted/shortlisted, fetch submission details, results, certificates & prizes
              if (["CONFIRMED", "SUBMISSION_PENDING", "SUBMITTED", "RESULT_PUBLISHED", "SHORTLISTED"].includes(t.status)) {
                fetchSubmissionData(t.teamId);
                fetchMyResult();
                fetchMyCertificates();
                fetchMyPrizes();
              }
            }
          } catch (teamErr) {
            console.log("No hackathon team attached to current session.");
          }
        }
      } catch (err) {
        console.error("Hackathon Portal Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Live dynamic submission deadline countdown
  useEffect(() => {
    if (!settings?.submissionDeadline) return;

    const deadlineTime = new Date(settings.submissionDeadline).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = deadlineTime - now;

      if (distance <= 0) {
        setDeadlineCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true });
        clearInterval(interval);
      } else {
        setDeadlineCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
          isPassed: false,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings?.submissionDeadline]);

  // Confirmation deadline: exactly 1 hour before hackathon start
  const confirmationDeadline = useMemo(() => {
    if (!settings?.startDate) return null;
    const startMs = new Date(settings.startDate).getTime();
    if (isNaN(startMs)) return null;
    return new Date(startMs - 60 * 60 * 1000);
  }, [settings?.startDate]);

  const isConfirmationExpired = useMemo(() => {
    if (!confirmationDeadline) return false;
    return Date.now() > confirmationDeadline.getTime();
  }, [confirmationDeadline]);

  // Live dynamic event start countdown timer
  useEffect(() => {
    if (!settings?.startDate && !settings?.submissionDeadline) return;

    const targetDate = new Date(settings.startDate || settings.submissionDeadline).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings]);

  const handleSaveDraft = async () => {
    if (!isLeader) {
      alert("Only the Team Leader is authorized to save submission drafts.");
      return;
    }
    try {
      setSavingDraft(true);
      setSubmissionFormError(null);
      setSubmissionFormSuccess(null);
      const token = localStorage.getItem("studentToken") || localStorage.getItem("token");

      const payload = {
        teamId: userTeam?.teamId,
        projectName: submissionForm.projectName,
        projectDescription: submissionForm.projectDescription,
        problemStatement: submissionForm.problemStatement,
        proposedSolution: submissionForm.proposedSolution,
        techStack: submissionForm.techStack
          ? submissionForm.techStack.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        githubUrl: submissionForm.githubUrl,
        hostedProjectUrl: submissionForm.hostedProjectUrl,
        linkedInUrl: submissionForm.linkedInUrl,
        demoVideoUrl: submissionForm.demoVideoUrl,
        otherLinks: submissionForm.otherLinks
          ? submissionForm.otherLinks.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
        additionalNotes: submissionForm.additionalNotes,
      };

      const res = await axios.post(`${BACKEND_URL}/api/hackathon/submission/save-draft`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setSubmissionData(res.data.submission);
        setSubmissionFormSuccess("Draft saved successfully!");
        setTimeout(() => setSubmissionFormSuccess(null), 4000);
      }
    } catch (err) {
      setSubmissionFormError(err.response?.data?.message || "Failed to save draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!isLeader) {
      alert("Only the Team Leader is authorized to finalize and submit the project.");
      return;
    }
    try {
      setSubmittingFinal(true);
      setSubmissionFormError(null);
      setSubmissionFormSuccess(null);
      const token = localStorage.getItem("studentToken") || localStorage.getItem("token");

      const payload = {
        teamId: userTeam?.teamId,
        projectName: submissionForm.projectName,
        projectDescription: submissionForm.projectDescription,
        problemStatement: submissionForm.problemStatement,
        proposedSolution: submissionForm.proposedSolution,
        techStack: submissionForm.techStack
          ? submissionForm.techStack.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        githubUrl: submissionForm.githubUrl,
        hostedProjectUrl: submissionForm.hostedProjectUrl,
        linkedInUrl: submissionForm.linkedInUrl,
        demoVideoUrl: submissionForm.demoVideoUrl,
        otherLinks: submissionForm.otherLinks
          ? submissionForm.otherLinks.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
        additionalNotes: submissionForm.additionalNotes,
      };

      const res = await axios.post(`${BACKEND_URL}/api/hackathon/submission/final-submit`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setSubmissionData(res.data.submission);
        setShowConfirmSubmitModal(false);
        setSubmissionFormSuccess(
          "Project finalized and submitted successfully! Your submission is now permanently locked."
        );
        if (userTeam) {
          setUserTeam({ ...userTeam, status: "SUBMITTED" });
        }
      }
    } catch (err) {
      setSubmissionFormError(err.response?.data?.message || "Failed to submit project.");
      setShowConfirmSubmitModal(false);
    } finally {
      setSubmittingFinal(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      IMPORTED: { text: "Imported from Unstop", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      UNDER_REVIEW: { text: "PPT Under Review", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      SHORTLISTED: { text: "Shortlisted 🎉", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      REJECTED: { text: "Not Shortlisted", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
      PAYMENT_PENDING: { text: "Fee Pending (₹49)", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
      CONFIRMED: { text: "Confirmed Participant ✅", color: "bg-green-500/20 text-green-400 border-green-500/30" },
      SUBMISSION_PENDING: { text: "Submission Pending", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
      SUBMITTED: { text: "Project Submitted 🚀", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
      UNDER_EVALUATION: { text: "Under Judging", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
      EVALUATED: { text: "Evaluated", color: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30" },
      RESULT_PUBLISHED: { text: "Results Published", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      CERTIFICATE_AVAILABLE: { text: "Certificate Ready", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    };
    return map[status] || { text: status, color: "bg-slate-700 text-slate-300 border-slate-600" };
  };

  const handlePayConfirmation = async () => {
    if (isConfirmationExpired) {
      alert("Participation confirmation payment window has closed. Payments were accepted until 1 hour before the hackathon start time.");
      return;
    }
    if (!isLeader) {
      alert("Only the Team Leader can complete the participation fee payment.");
      return;
    }
    try {
      setPaymentLoading(true);
      setPaymentError(null);
      setPaymentSuccess(null);
      const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const orderRes = await axios.post(
        `${BACKEND_URL}/api/hackathon/payment/create-order`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || "Failed to create payment order");
      }

      const { order, key, team } = orderRes.data;
      const orderId = order?.id || orderRes.data.orderId;
      const amountInPaise = order?.amount || orderRes.data.amountInPaise || (orderRes.data.amount ? Math.round(orderRes.data.amount * 100) : 4900);
      const teamName = team?.teamName || orderRes.data.teamName || userTeam?.teamName || "Hackathon Team";

      if (!orderId) {
        throw new Error("Unable to obtain payment order from gateway. Please try again.");
      }

      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay SDK is not loaded. Please verify your connection and try again.");
      }

      const options = {
        key: key || orderRes.data.key,
        amount: amountInPaise,
        currency: order?.currency || orderRes.data.currency || "INR",
        name: "Code-A-Nova Hackathon",
        description: `Team Participation Fee — ${teamName}`,
        order_id: orderId,
        prefill: {
          name: userTeam?.leader?.name || team?.leaderName || "",
          email: userTeam?.leader?.email || team?.leaderEmail || "",
          contact: userTeam?.leader?.phone || userTeam?.leader?.mobile || team?.leaderMobile || "",
        },
        theme: {
          color: "#6366f1",
        },
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            const verifyRes = await axios.post(
              `${BACKEND_URL}/api/hackathon/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data?.success) {
              setPaymentSuccess("Participation confirmed successfully! WhatsApp group unlocked.");
              // Reload team details
              const teamRes = await axios.get(`${BACKEND_URL}/api/hackathon/my-team`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (teamRes.data?.success && teamRes.data?.hasTeam) {
                setUserTeam(teamRes.data.team);
                setIsLeader(teamRes.data.isLeader);
              }
            } else {
              setPaymentError(verifyRes.data?.message || "Payment verification failed.");
            }
          } catch (vErr) {
            console.error("Verification error:", vErr);
            setPaymentError(vErr.response?.data?.message || "Payment verification failed. Please contact support.");
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setPaymentError(response.error?.description || "Payment transaction was declined or failed.");
        setPaymentLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error("handlePayConfirmation error:", err);
      setPaymentError(err.response?.data?.message || err.message || "Failed to initiate payment.");
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <SEO
        title="Code-A-Nova National Hackathon 2026 | Innovate, Build & Lead"
        description="Join India's premier student innovation hackathon. Compete across AI, Web3, and Full Stack tracks with cash prizes, mentorship, and direct internship opportunities."
      />

      {/* Futuristic Background Lights & Glowing Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-80 left-1/3 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Hackathon Top Navigation */}
      <header className="border-b border-slate-800/80 backdrop-blur-xl bg-slate-950/70 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                  CODE-A-NOVA <span className="text-cyan-400 font-extrabold text-xs">HACKATHON</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium -mt-0.5">National Edition 2026</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#tracks"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors hidden sm:inline-block"
            >
              Tracks
            </a>
            <a
              href="#timeline"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors hidden sm:inline-block"
            >
              Timeline
            </a>
            <a
              href="#rules"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors hidden sm:inline-block"
            >
              Rules
            </a>
            <Link
              to="/hackathon/results"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-xl hover:bg-amber-500/10 border border-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </Link>

            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
              >
                <span>My Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Participant Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Live Countdown */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
          <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>India’s Most Dynamic Student Hackathon</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping ml-1" />
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Build The Future. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Compete, Innovate & Dominate.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {settings?.description ||
              "From initial Unstop ideation to prototype deployment, experience a streamlined national hackathon with live judge evaluations, cash prizes, and tech recognition."}
          </p>
        </div>

        {/* Live Dynamic Countdown Box */}
        <div className="max-w-2xl mx-auto bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-2xl shadow-indigo-950/50 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" /> Hackathon Countdown
            </span>
            <span className="text-[11px] text-slate-500">
              Target: {settings?.startDate ? new Date(settings.startDate).toLocaleDateString() : "Upcoming"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { val: timeLeft.days, label: "Days" },
              { val: timeLeft.hours, label: "Hours" },
              { val: timeLeft.minutes, label: "Mins" },
              { val: timeLeft.seconds, label: "Secs" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950/90 rounded-xl p-3 sm:p-4 border border-slate-800/80 flex flex-col items-center justify-center shadow-inner"
              >
                <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  {String(item.val).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {settings?.resultDate && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs px-2 text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Trophy className="w-3.5 h-3.5" /> Official Result Announcement:
              </span>
              <span className="font-bold text-white font-mono">
                {new Date(settings.resultDate).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Quick Hero Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {isLoggedIn ? (
            <a
              href="#team-status"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-103"
            >
              <Users className="w-4 h-4" /> View My Team Status
            </a>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-103"
            >
              <LogIn className="w-4 h-4" /> Check Team Review Status
            </Link>
          )}

          <a
            href="#tracks"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
          >
            <Code2 className="w-4 h-4 text-purple-400" /> Explore Tracks
          </a>
        </div>
      </section>

      {/* ─── PARTICIPANT TEAM DASHBOARD CARD (If Logged In) ─── */}
      <section id="team-status" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Participant Portal
                </span>
                {userTeam && (
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                      getStatusBadge(userTeam.status).color
                    }`}
                  >
                    {getStatusBadge(userTeam.status).text}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {userTeam ? userTeam.teamName : "Your Hackathon Journey"}
              </h2>
              <p className="text-xs text-slate-400">
                {userTeam
                  ? `Team ID: ${userTeam.teamId} • Track: ${userTeam.track}`
                  : "Track your review progress, confirmation, and hackathon project submission."}
              </p>
            </div>

            {userTeam && (
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">Confirmation Fee</div>
                <div className="text-lg font-black text-emerald-400">
                  {userTeam.paymentStatus === "PAID" ? "Paid ✅" : `₹${settings?.participationFee ?? 49} / Team`}
                </div>
              </div>
            )}
          </div>

          {/* If Team Found */}
          {userTeam ? (
            <div className="space-y-6">
              {/* PHASE 4: SHORTLIST NOTIFICATION & CONFIRMATION ACTION BANNER */}
              {userTeam.status === "SHORTLISTED" && userTeam.paymentStatus !== "PAID" && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-950 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-950/80 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                        <span>Congratulations! Your Team is Shortlisted 🎉</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Confirm Participation — Code-A-Nova Hackathon
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                        Your PPT and project idea have cleared the initial review. Confirm your team slot by paying the
                        one-time team confirmation fee of{" "}
                        <span className="font-extrabold text-emerald-400">
                          ₹{settings?.participationFee ?? 49}
                        </span>
                        . Once confirmed, you will instantly unlock the official WhatsApp group and finalist briefings.
                      </p>

                      {confirmationDeadline && (
                        <div
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                            isConfirmationExpired
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {isConfirmationExpired ? (
                            <Lock className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>
                            {isConfirmationExpired
                              ? `Confirmation Closed: Ended ${confirmationDeadline.toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })} at ${confirmationDeadline.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })} (1 hr before hackathon start)`
                              : `Confirmation Closes: ${confirmationDeadline.toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })} at ${confirmationDeadline.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })} (1 hour before hackathon start)`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
                      {isLeader ? (
                        <>
                          <button
                            onClick={handlePayConfirmation}
                            disabled={paymentLoading || isConfirmationExpired}
                            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 shadow-xl shadow-emerald-500/25 transition-all hover:scale-102 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {paymentLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Processing Payment...</span>
                              </>
                            ) : isConfirmationExpired ? (
                              <>
                                <Lock className="w-4 h-4" />
                                <span>CONFIRMATION CLOSED</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                <span>CONFIRM PARTICIPATION — ₹{settings?.participationFee ?? 49}</span>
                              </>
                            )}
                          </button>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {isConfirmationExpired
                              ? "Window closed: confirmation was open until 1 hour before start."
                              : `₹${settings?.participationFee ?? 49} per team (one payment confirms all members).`}
                          </span>
                        </>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs text-slate-300 space-y-1 max-w-sm">
                          <div className="font-bold text-amber-400 flex items-center gap-1.5">
                            <Info className="w-4 h-4" /> Leader Action Required
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Participation confirmation is being completed by your Team Leader (
                            <span className="text-white font-bold">{userTeam.leader?.name || "Team Leader"}</span>
                            ). Once payment is verified, your team will be confirmed automatically.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {paymentError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {paymentSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{paymentSuccess}</span>
                    </div>
                  )}
                </div>
              )}

              {/* CONFIRMED PARTICIPANT BANNER */}
              {(userTeam.status === "CONFIRMED" || userTeam.paymentStatus === "PAID") && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/30">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" /> Team Participation Confirmed ✅
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Your team is officially registered for the Code-A-Nova Hackathon Grand Finale.
                      {userTeam.confirmedAt && (
                        <span className="text-slate-400 block text-[11px] mt-0.5">
                          Confirmed on {new Date(userTeam.confirmedAt).toLocaleDateString()} at{" "}
                          {new Date(userTeam.confirmedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </p>
                  </div>
                  {userTeam.whatsAppLink && (
                    <a
                      href={userTeam.whatsAppLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all shrink-0 hover:scale-102"
                    >
                      <MessageSquare className="w-4 h-4" /> Join Official WhatsApp Group
                    </a>
                  )}
                </div>
              )}

              {/* Leader & Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Leader Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" /> Team Leader
                    </span>
                    {isLeader && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300">
                        You (Leader)
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-black text-white">{userTeam.leader?.name}</div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div>{userTeam.leader?.email}</div>
                    <div>{userTeam.leader?.college || "College not specified"}</div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> Team Members (
                    {(userTeam.members || []).length})
                  </div>
                  {(userTeam.members || []).length === 0 ? (
                    <div className="text-xs text-slate-500 py-2">Solo participation (No additional members).</div>
                  ) : (
                    <div className="space-y-1.5">
                      {userTeam.members.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                          <span className="font-semibold">{m.name}</span>
                          <span className="text-slate-500 text-[11px]">{m.college || m.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Initial Idea & Submitted PPT Card */}
              {userTeam.initialIdea?.title && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" /> Registered Idea & Submission
                    </span>
                    {userTeam.initialIdea.pptUrl && (
                      <a
                        href={userTeam.initialIdea.pptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Submitted PPT
                      </a>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white">{userTeam.initialIdea.title}</div>
                  <p className="text-xs text-slate-400 line-clamp-2">{userTeam.initialIdea.description}</p>
                </div>
              )}

              {/* PHASE 5: FINAL PROJECT SUBMISSION SECTION (Steps 6, 7, 8, 10, 12, 13, 14) */}
              {(userTeam.paymentStatus === "PAID" || ["CONFIRMED", "SUBMISSION_PENDING", "SUBMITTED", "UNDER_EVALUATION", "EVALUATED", "RESULT_PUBLISHED", "CERTIFICATE_AVAILABLE"].includes(userTeam.status)) && (
                <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-950 border-2 border-indigo-500/40 shadow-2xl space-y-6">
                  {/* Top Bar: Title, Badges, Deadline Status */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                          <Rocket className="w-3.5 h-3.5 text-indigo-400" />
                          Phase 5 Portal
                        </span>

                        {/* Status badge */}
                        {submissionData?.status === "SUBMITTED" || userTeam.status === "SUBMITTED" ? (
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            🟢 Project Submitted (Locked)
                          </span>
                        ) : submissionData?.status === "DRAFT" ? (
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Draft in Progress
                          </span>
                        ) : (
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Not Started
                          </span>
                        )}

                        {/* Submission Window / Deadline status badge */}
                        {(!settings?.isSubmissionOpen || deadlineCountdown.isPassed) && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            🔒 Submission Closed
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                        FINAL PROJECT SUBMISSION
                      </h3>
                      <p className="text-xs text-slate-400 max-w-2xl">
                        Your team is confirmed. Develop your project and submit your code repository, hosted preview, and architecture before the deadline.
                      </p>
                    </div>

                    {/* Deadline & Countdown Block */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 space-y-2 text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-end gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        Submission Deadline
                      </div>
                      <div className="text-xs font-semibold text-slate-300">
                        {settings?.submissionDeadline
                          ? new Date(settings.submissionDeadline).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Announced Soon"}
                      </div>
                      {/* Countdown Timer */}
                      {!deadlineCountdown.isPassed ? (
                        <div className="flex items-center gap-1.5 justify-end text-xs font-mono font-black text-amber-400">
                          <span className="px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                            {deadlineCountdown.days}d
                          </span>
                          :
                          <span className="px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                            {deadlineCountdown.hours}h
                          </span>
                          :
                          <span className="px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                            {deadlineCountdown.minutes}m
                          </span>
                          :
                          <span className="px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                            {deadlineCountdown.seconds}s
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs font-black text-rose-400">Deadline Passed</div>
                      )}
                    </div>
                  </div>

                  {/* Body Content based on submission status */}
                  {submissionData?.status === "SUBMITTED" || userTeam.status === "SUBMITTED" || userTeam.status === "RESULT_PUBLISHED" || userTeam.finalSubmission?.projectTitle ? (
                    /* Finalized & Locked view for both Leader and Members */
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-sm font-black text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            🟢 Project Submitted (Locked)
                          </div>
                          <p className="text-xs text-slate-300">
                            Submitted on{" "}
                            <span className="font-bold text-white">
                              {submissionData?.submittedAt || userTeam.finalSubmission?.submittedAt
                                ? new Date(submissionData?.submittedAt || userTeam.finalSubmission?.submittedAt).toLocaleString()
                                : "Recently"}
                            </span>{" "}
                            by <span className="font-bold text-white">{submissionData?.submitterName || userTeam.leader?.name || "Team Leader"}</span>.
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {isLeader
                              ? "An immutable snapshot has been frozen for the judging committee."
                              : "Your team submission has been finalized. All submitted deliverables are detailed below."}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowSubmissionModal(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer shrink-0"
                        >
                          <FileText className="w-4 h-4 text-emerald-400" /> Full Submission Modal
                        </button>
                      </div>

                      {/* Submitted Project Details Card */}
                      <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Project Title</div>
                            <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                              {submissionData?.projectName || userTeam.finalSubmission?.projectTitle || userTeam.initialIdea?.title || "Submitted Project"}
                            </h4>
                          </div>
                          <span className="self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Track: {userTeam.track || "General"}
                          </span>
                        </div>

                        {/* Description / Summary */}
                        {(submissionData?.projectDescription || userTeam.finalSubmission?.description || userTeam.initialIdea?.description) && (
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Description</div>
                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                              {submissionData?.projectDescription || userTeam.finalSubmission?.description || userTeam.initialIdea?.description}
                            </p>
                          </div>
                        )}

                        {/* Problem & Solution (if present) */}
                        {(submissionData?.problemStatement || submissionData?.proposedSolution) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {submissionData.problemStatement && (
                              <div className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Problem Statement</div>
                                <p className="text-xs text-slate-300 leading-relaxed">{submissionData.problemStatement}</p>
                              </div>
                            )}
                            {submissionData.proposedSolution && (
                              <div className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Proposed Solution</div>
                                <p className="text-xs text-slate-300 leading-relaxed">{submissionData.proposedSolution}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tech Stack Badges */}
                        {((Array.isArray(submissionData?.techStack) && submissionData.techStack.length > 0) ||
                          (Array.isArray(userTeam.finalSubmission?.techStack) && userTeam.finalSubmission.techStack.length > 0)) && (
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tech Stack & Tools</div>
                            <div className="flex flex-wrap gap-1.5">
                              {(submissionData?.techStack?.length ? submissionData.techStack : userTeam.finalSubmission?.techStack || []).map((t, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Submitted Deliverable Links */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Submitted Links & Deliverables</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(submissionData?.githubUrl || userTeam.finalSubmission?.githubUrl || userTeam.submittedLinks?.githubUrl) && (
                              <a
                                href={submissionData?.githubUrl || userTeam.finalSubmission?.githubUrl || userTeam.submittedLinks?.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 transition-colors"
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <Github className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="truncate">GitHub Repo</span>
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              </a>
                            )}
                            {(submissionData?.hostedProjectUrl || userTeam.finalSubmission?.liveDemoUrl || userTeam.submittedLinks?.hostedProjectUrl) && (
                              <a
                                href={submissionData?.hostedProjectUrl || userTeam.finalSubmission?.liveDemoUrl || userTeam.submittedLinks?.hostedProjectUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 transition-colors"
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <Globe className="w-4 h-4 text-teal-400 shrink-0" />
                                  <span className="truncate">Live Deployment</span>
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              </a>
                            )}
                            {(submissionData?.demoVideoUrl || userTeam.finalSubmission?.videoDemoUrl || userTeam.submittedLinks?.demoVideoUrl) && (
                              <a
                                href={submissionData?.demoVideoUrl || userTeam.finalSubmission?.videoDemoUrl || userTeam.submittedLinks?.demoVideoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 transition-colors"
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <Video className="w-4 h-4 text-purple-400 shrink-0" />
                                  <span className="truncate">Demo Video</span>
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : submissionData?.status === "DRAFT" ? (
                    /* Draft saved view */
                    <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-amber-400 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Status: DRAFT
                        </div>
                        <p className="text-xs text-slate-300">
                          Last saved:{" "}
                          <span className="font-semibold text-white">
                            {submissionData?.draftSavedAt
                              ? new Date(submissionData.draftSavedAt).toLocaleString()
                              : "Recently"}
                          </span>
                          . Your progress is saved.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Make sure to perform final submission before the deadline.
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <button
                          onClick={() => setShowSubmissionModal(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                          {isLeader ? "Continue Submission" : "View Draft"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Not Started view */
                    <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-200">
                          Status: NOT STARTED
                        </div>
                        <p className="text-xs text-slate-400">
                          Your team is confirmed. Start your project submission form, save drafts anytime, and finalize when your prototype is ready.
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isLeader ? (
                          <button
                            onClick={() => setShowSubmissionModal(true)}
                            disabled={!settings?.isSubmissionOpen || deadlineCountdown.isPassed}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Rocket className="w-4 h-4" /> Start Submission
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Leader ({userTeam.leader?.name}) will submit project.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── PHASE 7: OFFICIAL EVALUATION & RESULTS CARD ─── */}
              {(() => {
                const participantResult = myResultData?.result || (myResultData?.rank !== undefined ? myResultData : null);
                if (myResultData?.isPublished && participantResult) {
                  return (
                    <div
                      className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden space-y-6 ${
                        participantResult.isWinner || participantResult.rank <= 3
                          ? "bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/50 shadow-amber-500/10"
                          : "bg-gradient-to-b from-indigo-950/30 via-slate-900 to-slate-950 border-indigo-500/40 shadow-indigo-500/10"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-amber-400" />
                              Official Result Declared
                            </span>
                            {participantResult.category && (
                              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                {participantResult.category}
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-black text-white pt-1">
                            {participantResult.isWinner || participantResult.rank <= 3
                              ? "🎉 Congratulations, Champions!"
                              : "🎖️ Final Evaluation Complete"}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                            {participantResult.isWinner || participantResult.rank <= 3
                              ? `Outstanding performance! Your team has secured a podium rank in the Code-A-Nova National Hackathon 2026.`
                              : `Great job on completing your project submission and participating in Code-A-Nova 2026. Here is your verified evaluation score.`}
                          </p>
                        </div>

                        <Link
                          to="/hackathon/results"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer self-start sm:self-center"
                        >
                          <Trophy className="w-4 h-4" /> View Full Leaderboard
                        </Link>
                      </div>

                      {/* Score & Rank Highlights Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Official Rank</div>
                          <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-center gap-1">
                            {participantResult.rank === 1 ? "🥇 #1" : participantResult.rank === 2 ? "🥈 #2" : participantResult.rank === 3 ? "🥉 #3" : `#${participantResult.rank}`}
                          </div>
                          <div className="text-[10px] text-slate-500">National Finalist</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Final Score</div>
                          <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                            {Number(participantResult.finalScore || 0).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-500">Out of 100.00 pts</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Award Status</div>
                          <div className="text-sm sm:text-base font-black text-white truncate">
                            {participantResult.category || (participantResult.rank <= 10 ? "Top 10 Finalist" : "Finalist")}
                          </div>
                          <div className="text-[10px] text-slate-500">Editorial Verified</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Prize Package</div>
                          <div className="text-sm sm:text-base font-black text-emerald-400 truncate">
                            {participantResult.prize || "Certificate of Excellence"}
                          </div>
                          <div className="text-[10px] text-slate-500">Merit Recognition</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (submissionData?.status === "SUBMITTED" || userTeam.status === "SUBMITTED" || userTeam.status === "RESULT_PUBLISHED" || userTeam.paymentStatus === "PAID") {
                  return (
                    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Jury Evaluation In Progress
                        </div>
                        <h4 className="text-base font-bold text-white">Results are currently under deliberation</h4>
                        <p className="text-xs text-slate-400 max-w-xl">
                          Your project code repository and live deployment are being evaluated by our editorial panel. Rankings and awards will be announced on the public leaderboard.
                        </p>
                        {(settings?.resultDate || myResultData?.resultDate) && (
                          <div className="pt-2 flex items-center gap-2 text-xs font-bold text-cyan-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              Official Result Announcement:{" "}
                              <span className="text-white font-mono font-bold">
                                {new Date(settings?.resultDate || myResultData?.resultDate).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                      <Link
                        to="/hackathon/results"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all shrink-0 self-start sm:self-center"
                      >
                        Leaderboard Preview <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                }

                return null;
              })()}

              {/* ─── PHASE 8: PRIZE FULFILLMENT PIPELINE (If Won Prize) ─── */}
              {myPrizes.length > 0 && (
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5" /> Prize Fulfillment
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-white">Award & Reward Package</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myPrizes.map((p, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-400">{p.award}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              p.status === 'FULFILLED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : p.status === 'PROCESSING'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {p.status === 'FULFILLED' ? '✓ Dispatched & Fulfilled' : p.status}
                          </span>
                        </div>
                        <div>
                          <div className="text-lg font-black text-white">{p.prizeName}</div>
                          {p.sponsorName && (
                            <div className="text-xs text-indigo-400 font-semibold">
                              Sponsored by {p.sponsorName}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                          <span className="text-slate-400">Value / Package:</span>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            {p.currency} {p.amount ? p.amount.toLocaleString() : 'Merit Package'}
                          </span>
                        </div>
                        {p.voucherCodeMasked && (
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
                            <span className="text-slate-400">Voucher / Code:</span>
                            <span className="font-mono font-bold text-white">{p.voucherCodeMasked}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Card (Strict PRD rule: Only shown if CONFIRMED / PAID) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" /> Official Hackathon WhatsApp Community
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl">
                    {userTeam.whatsAppLink
                      ? "Join the private hackathon group for instant organizer announcements, mentor Q&A, and live schedule updates."
                      : "Access to the private WhatsApp group is unlocked once your team's ₹49 confirmation payment is verified."}
                  </p>
                </div>

                {userTeam.whatsAppLink ? (
                  <a
                    href={userTeam.whatsAppLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all shrink-0"
                  >
                    <MessageSquare className="w-4 h-4" /> Join WhatsApp Group
                  </a>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed shrink-0"
                  >
                    Locked Until Confirmation
                  </button>
                )}
              </div>
            </div>
          ) : isLoggedIn ? (
            /* Logged in, but no team attached */
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">No Team Linked Yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You are logged in, but your account email is not yet linked to an imported Unstop hackathon team.
                  Once the organizers complete shortlisting and Unstop data sync, your team details will appear here
                  automatically.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/dashboard"
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                >
                  Return to Student Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* Visitor / Not logged in */
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                <LogIn className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">Registered on Unstop?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Log in with your registered Code-A-Nova student account to view your team's real-time review
                  status, confirmation instructions, and final submission portal.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
                >
                  <LogIn className="w-4 h-4" /> Participant Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── TRACKS & THEMES ─── */}
      <section id="tracks" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">Innovation Arenas</span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Hackathon Tracks</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Choose a challenge domain that inspires your team. Solutions are evaluated against originality, tech stack
            depth, and real-world utility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(settings?.tracks || [
            { name: "AI & Machine Learning", description: "LLM workflows, agents, automation, and computer vision." },
            { name: "Web3 & Decentralized Tech", description: "Smart contracts, decentralized apps, and transparency." },
            { name: "Full Stack & Cloud", description: "High-scale platforms, microservices, and dev tools." },
            { name: "Open Innovation", description: "EdTech, HealthTech, Agritech, and social impact." },
          ]).map((track, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 flex items-center justify-center mb-4 transition-all">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                {track.name}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{track.description}</p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] font-bold text-indigo-400">
                <span>Selectable in submission</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WORKFLOW & TIMELINE STEPPER ─── */}
      <section id="timeline" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-black text-purple-400 uppercase tracking-widest">The Journey</span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Hackathon Progression</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            From initial registration on Unstop to national ranking on Code-A-Nova.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {[
            { step: "01", title: "Unstop Entry", desc: "Team registration & PPT idea submission on Unstop." },
            { step: "02", title: "Idea Review", desc: "Organizer evaluation and shortlist declaration." },
            { step: "03", title: "₹49 Confirmation", desc: "Shortlisted teams confirm participation & join WhatsApp." },
            { step: "04", title: "Build Phase", desc: "Sprint development of prototype & live demo." },
            { step: "05", title: "Final Submit", desc: "Submit GitHub repo, video demo & hosted link." },
            { step: "06", title: "Judging & Awards", desc: "Editorial scoring, national rank & certificates." },
          ].map((s, idx) => (
            <div
              key={idx}
              className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/80 relative space-y-2 hover:bg-slate-900 transition-colors"
            >
              <span className="text-xs font-black text-cyan-400 font-mono">{s.step}</span>
              <h4 className="text-xs font-black text-white">{s.title}</h4>
              <p className="text-[11px] text-slate-400 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── RULES & FAQ ─── */}
      <section id="rules" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Guidelines</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Hackathon Rules & FAQ</h2>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Official Rules
          </h3>
          <div className="space-y-2">
            {(settings?.rules || [
              "Teams must consist of 1 to 4 members.",
              "Shortlisted teams must confirm participation with the ₹49 confirmation fee.",
              "All code must be written during the hackathon development window.",
              "Plagiarized code or copy-pasting existing open-source repos leads to disqualification.",
              "Judges' decisions are final and binding.",
            ]).map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PHASE 5: SUBMISSION MODAL & CONFIRMATION DIALOG ─── */}
      {showSubmissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Final Submission
                  </span>
                  {submissionData?.isLocked ? (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      🟢 Locked
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Editable
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-white">
                  {userTeam?.teamName || "Team"} — Project Submission
                </h3>
                <p className="text-xs text-slate-400">
                  Track: <strong className="text-indigo-300">{userTeam?.track}</strong> • Team ID:{" "}
                  <strong className="text-slate-300">{userTeam?.teamId}</strong>
                </p>
              </div>

              <button
                onClick={() => setShowSubmissionModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Informational banners */}
              {submissionData?.isLocked ? (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">🟢 FINAL SUBMISSION LOCKED</div>
                    <p className="text-[11px] text-emerald-400/90 mt-0.5">
                      This project has been finalized and locked. An immutable snapshot was captured on{" "}
                      {submissionData.submittedAt ? new Date(submissionData.submittedAt).toLocaleString() : "submission"}.
                    </p>
                  </div>
                </div>
              ) : !isLeader ? (
                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 flex items-center gap-3">
                  <Info className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Read-Only Participant View</div>
                    <p className="text-[11px] text-indigo-300/80 mt-0.5">
                      Only your Team Leader ({userTeam?.leader?.name}) can modify fields, save drafts, or finalize the submission.
                    </p>
                  </div>
                </div>
              ) : deadlineCountdown.isPassed ? (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 flex items-center gap-3">
                  <Lock className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">🔒 Submission Closed</div>
                    <p className="text-[11px] text-rose-400/90 mt-0.5">
                      The official submission deadline has passed. Edits or new submissions cannot be accepted.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Status messages */}
              {submissionFormError && (
                <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submissionFormError}</span>
                </div>
              )}

              {submissionFormSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{submissionFormSuccess}</span>
                </div>
              )}

              {/* Form Inputs */}
              <div className="space-y-4">
                {/* Project Name */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center justify-between">
                    <span>Project Name <span className="text-rose-400">*</span></span>
                    <span className="text-[10px] text-slate-500">Official name of your product</span>
                  </label>
                  <input
                    type="text"
                    disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                    placeholder="e.g., NovaAI Autonomous Code Reviewer"
                    value={submissionForm.projectName}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, projectName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Project Description */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center justify-between">
                    <span>Project Description <span className="text-rose-400">*</span></span>
                    <span className="text-[10px] text-slate-500">High-level summary of your project</span>
                  </label>
                  <textarea
                    rows={3}
                    disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                    placeholder="Explain what your project does, target audience, and key features..."
                    value={submissionForm.projectDescription}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, projectDescription: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Problem Statement & Proposed Solution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold block">
                      Problem Statement <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                      placeholder="What exact friction or inefficiency does your project address?"
                      value={submissionForm.problemStatement}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, problemStatement: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold block">
                      Proposed Solution <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                      placeholder="How does your architecture solve the problem?"
                      value={submissionForm.proposedSolution}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, proposedSolution: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center justify-between">
                    <span>Tech Stack <span className="text-rose-400">*</span></span>
                    <span className="text-[10px] text-slate-500">Comma-separated</span>
                  </label>
                  <input
                    type="text"
                    disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                    placeholder="React, Node.js, MongoDB, Express, Docker, TailwindCSS"
                    value={submissionForm.techStack}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, techStack: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* URLs Grid: GitHub, Hosted Link, LinkedIn, Demo Video */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* GitHub Repo */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-slate-400" />
                      GitHub Repository <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="url"
                      disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                      placeholder="https://github.com/your-username/repo-name"
                      value={submissionForm.githubUrl}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, githubUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Hosted Project URL */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-400" />
                      Hosted Live Project <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="url"
                      disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                      placeholder="https://your-project.vercel.app"
                      value={submissionForm.hostedProjectUrl}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, hostedProjectUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* LinkedIn Post URL */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                      LinkedIn Post / Share <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="url"
                      disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                      placeholder="https://www.linkedin.com/posts/..."
                      value={submissionForm.linkedInUrl}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, linkedInUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Demo Video URL */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-purple-400" />
                      Demo Video (YouTube / Loom / Drive) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="url"
                      disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                      placeholder="https://youtu.be/... or Loom URL"
                      value={submissionForm.demoVideoUrl}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, demoVideoUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Other Links & Additional Notes */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center justify-between">
                    <span>Other Links (Optional)</span>
                    <span className="text-[10px] text-slate-500">One link per line (Figma, Slide Deck, API Docs)</span>
                  </label>
                  <textarea
                    rows={2}
                    disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                    placeholder="https://www.figma.com/file/...&#10;https://docs.google.com/presentation/..."
                    value={submissionForm.otherLinks}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, otherLinks: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">
                    Additional Information / Deployment Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    disabled={submissionData?.isLocked || !isLeader || deadlineCountdown.isPassed}
                    placeholder="Any test credentials, special setup, or architecture notes for reviewers..."
                    value={submissionForm.additionalNotes}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, additionalNotes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                {submissionData?.isLocked ? (
                  <span className="text-emerald-400 font-bold">Project is locked from editing.</span>
                ) : (
                  <span>Draft saves do not finalize your project.</span>
                )}
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Close
                </button>

                {!submissionData?.isLocked && isLeader && !deadlineCountdown.isPassed && settings?.isSubmissionOpen && (
                  <>
                    <button
                      onClick={handleSaveDraft}
                      disabled={savingDraft}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Draft
                    </button>

                    <button
                      onClick={() => setShowConfirmSubmitModal(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:scale-102"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Final Submit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PHASE 5: TWO-STEP FINAL SUBMISSION CONFIRMATION DIALOG (Step 10) ─── */}
      {showConfirmSubmitModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">Confirm Final Submission?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Once submitted, your project details, GitHub repository, and hosted links will be{" "}
                <strong className="text-amber-400">permanently locked</strong> from further editing.
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                An immutable snapshot will be captured immediately and transferred to the judging panel. Are you sure you want to submit?
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmSubmitModal(false)}
                disabled={submittingFinal}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleFinalSubmit}
                disabled={submittingFinal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingFinal ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Yes, Final Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Code-A-Nova. Built for builders, innovators, and the next generation of engineers.</p>
      </footer>
    </div>
  );
}
