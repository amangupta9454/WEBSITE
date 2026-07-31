import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  PlayCircle, Video, Clock, CheckCircle, Loader2, Sparkles,
  Zap, Brain, Target, Star, X, Briefcase, AlertCircle, ArrowRight, Plus, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import BuyTokensModal from './InterviewPortal/components/BuyTokensModal';
import { FeedbackModal } from './InterviewPortal/components/InterviewDashboardContent';
import { clearAllUserData } from '../utils/auth';
import { useInterviewConfig } from '../context/InterviewConfigContext';

/* ─── Razorpay script loader ──────────────────────────────────────────────── */
function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
const MyInterviews = () => {
  const [sessions, setSessions] = useState([]);
  const [credits, setCredits] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [interviewEnabled, setInterviewEnabled] = useState(true);
  const { configs: interviewConfigs, getConfig } = useInterviewConfig();
  const [loading, setLoading] = useState(true);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [rePracticeSession, setRePracticeSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  // Poll sessions that are still being evaluated and auto-retry stuck ones
  useEffect(() => {
    const token = localStorage.getItem('interviewToken');
    if (!token) return;

    const POLL_STATUSES = ['EVALUATION_PENDING', 'EVALUATION_RUNNING'];

    const pendingSessions = sessions.filter(s => POLL_STATUSES.includes(s.status));
    if (pendingSessions.length === 0) return;

    // Auto-retry any session stuck in EVALUATION_PENDING
    pendingSessions
      .filter(s => s.status === 'EVALUATION_PENDING')
      .forEach(s => {
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/retry-evaluation/${s._id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => console.error('Auto-retry evaluation error:', err));
      });

    // Poll every 5 seconds until all are done
    const pollInterval = setInterval(async () => {
      try {
        const sessionsRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/my-sessions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (sessionsRes.data.success) {
          const updated = sessionsRes.data.sessions;
          setSessions(updated);
          const stillPending = updated.some(s => POLL_STATUSES.includes(s.status));
          if (!stillPending) clearInterval(pollInterval);
        }
      } catch (pollErr) {
        console.error('Evaluation poll error:', pollErr);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [sessions.map(s => s._id + s.status).join(',')]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('interviewToken');
      if (!token) {
        navigate('/student-login');
        return;
      }
      const [creditsRes, sessionsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/interview-session/my-credits`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/interview-session/my-sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (creditsRes.data.success) {
        setCredits(creditsRes.data.credits);
        setIsUnlimited(creditsRes.data.isUnlimited);
        if (creditsRes.data.interviewEnabled !== undefined) {
          setInterviewEnabled(creditsRes.data.interviewEnabled);
        }
      }
      if (sessionsRes.data.success) setSessions(sessionsRes.data.sessions);

      // Track feature activity for Ambassador stats
      const activeRef = localStorage.getItem('referralCode') || localStorage.getItem('referredByCode') || sessionStorage.getItem('referralCode');
      axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/student/track-activity`,
        { featureName: "AI Mock Interview Joined", referralCode: activeRef },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {});
    } catch (err) {
      if (err.response?.status === 401) {
        clearAllUserData();
        navigate('/student-login');
      } else {
        toast.error('Failed to load interview sessions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (!isUnlimited && credits <= 0) {
      setIsBuyModalOpen(true);
      return;
    }
    navigate('/interview-setup');
  };

  const handleBuyPackage = async (pkg) => {
    setIsBuyModalOpen(false);
    const token = localStorage.getItem('interviewToken');
    if (!token) return;

    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      return;
    }

    try {
      const toastId = toast.loading('Initializing payment...');
      const orderRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-payment/create-order`,
        { packageId: pkg.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!orderRes.data.success) {
        toast.dismiss(toastId);
        toast.error(orderRes.data.message || 'Failed to create order');
        return;
      }
      toast.dismiss(toastId);
      const { order } = orderRes.data;
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Code-A-Nova',
        description: `Purchase ${pkg.name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packageId: pkg.id,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (verifyRes.data.success) {
              toast.success('Payment Successful! Tokens updated.');
              setCredits(verifyRes.data.credits);
              setIsUnlimited(verifyRes.data.isUnlimited);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error('An error occurred during verification');
          }
        },
        theme: { color: '#4f46e5' },
      };
      new window.Razorpay(options).open();
    } catch (error) {
      toast.error('Something went wrong!');
    }
  };

  const handleRetryEvaluation = async (sessionId) => {
    try {
      const token = localStorage.getItem('interviewToken');
      if (!token) return;
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/retry-evaluation/${sessionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success('Evaluation re-started in background!');
        fetchData(); // refresh the list to show evaluating status
      } else {
        toast.error(res.data.message || 'Failed to retry evaluation');
      }
    } catch (err) {
      toast.error('Error retrying evaluation');
    }
  };

  /* ── Loading ─────────────────────────────────────────── */
  if (loading)
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="animate-spin text-indigo-500 w-12 h-12" />
      </div>
    );

  /* ── Feature disabled ────────────────────────────────── */
  if (!interviewEnabled) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-slate-50 text-center p-6">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-slate-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Feature Disabled</h1>
        <p className="text-slate-500 max-w-md mb-8">
          AI Mock Interviews are currently disabled. Please check back later or contact support.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
        >
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  const recentSession = sessions.length > 0 ? sessions[0] : null;

  /* ── Main UI ─────────────────────────────────────────── */
  return (
    <div className="bg-[#FAFAFA] pt-16 pb-24">

      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[100px] -mr-96 -mt-96 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[100px] -ml-64 -mb-64 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Left — heading */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest mb-6">
                <Sparkles className="w-4 h-4" /> Code-A-Nova Premium
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight text-slate-900">
                AI{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                  Mock Interviews
                </span>
              </h1>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Practice with a hyper-realistic AI interviewer. Get instant feedback, deep analysis, and actionable insights to land your dream job.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-800">Real-time AI Feedback</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">Speech Analytics</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-blue-800">Enterprise Assessment</span>
                </div>
              </div>

              <button 
                onClick={handleStartInterview}
                className="w-full md:w-fit bg-gradient-to-r from-brand-purple to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black py-4 px-8 rounded-xl transition-all shadow-xl shadow-brand-purple/30 flex items-center justify-center gap-2 hover:-translate-y-1 text-lg mb-6 md:mb-0"
              >
                <PlayCircle className="w-6 h-6" /> Start New Interview
              </button>
            </div>

            {/* Right — Token card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 w-full md:w-80 shrink-0 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="font-bold text-slate-500 text-xs md:text-sm uppercase tracking-wider">Your Balance</h3>
                <div className="bg-indigo-50 text-indigo-700 px-2 py-0.5 md:px-3 md:py-1 rounded-lg font-black text-base md:text-lg border border-indigo-100">
                  {isUnlimited ? '∞' : credits}{' '}
                  <span className="text-[9px] md:text-[10px] font-bold uppercase">Tokens</span>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                {interviewConfigs.map((config) => (
                  <div key={config.modeId} className="flex justify-between text-xs md:text-sm items-center">
                    <span className="text-slate-600 font-medium">{config.name}:</span>
                    <span className="text-slate-800 font-bold">{config.tokenCost} Token{config.tokenCost !== 1 ? 's' : ''}</span>
                  </div>
                ))}
                {interviewConfigs.length === 0 && (
                  <div className="flex justify-between text-xs md:text-sm items-center">
                    <span className="text-slate-600 font-medium">Per Interview:</span>
                    <span className="text-slate-800 font-bold">...</span>
                  </div>
                )}
                <div className="flex justify-between text-xs md:text-sm items-center">
                  <span className="text-slate-600 font-medium">Feedback Report:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 md:px-2 rounded text-[10px] md:text-xs">FREE</span>
                </div>
                <div className="w-full h-px bg-slate-100 my-2" />
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-slate-600 font-medium">Enterprise Analysis:</span>
                  <span className="text-slate-800 font-bold">Included</span>
                </div>
              </div>

              {!isUnlimited && (
                <button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 md:py-3 rounded-xl transition-all text-xs md:text-sm shadow-md shadow-indigo-600/20 hover:-translate-y-0.5"
                  onClick={() => setIsBuyModalOpen(true)}
                >
                  Purchase More Tokens
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">

        {/* Recent session highlight */}
        {recentSession && (
          <div className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" /> Most Recent Interview
            </h2>
            <div className="bg-white rounded-3xl border border-indigo-100 p-5 md:p-8 shadow-xl shadow-indigo-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -mr-20 -mt-20 z-0 transition-transform duration-700 group-hover:scale-150" />

              <div className="relative z-10 flex-1 w-full">
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest mb-3 md:mb-4 ${
                    recentSession.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {recentSession.status}
                </div>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 mb-1.5 md:mb-2">
                  {recentSession.jobTitle}
                </h3>
                <p className="text-slate-500 mb-4 md:mb-6 flex items-center gap-2 text-xs md:text-sm font-medium">
                  <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {new Date(recentSession.createdAt).toLocaleDateString()}
                </p>

                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  {(recentSession.status === 'EVALUATION_PENDING' || recentSession.status === 'EVALUATION_RUNNING') ? (
                    <span className="text-sm font-bold text-indigo-500 flex items-center gap-2 bg-indigo-50 px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl">
                      <Loader2 size={16} className="animate-spin" />
                      Generating Evaluation...
                    </span>
                  ) : recentSession.status === 'Completed' && recentSession.feedback ? (
                    <button
                      onClick={() => setSelectedFeedback(recentSession)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl text-sm md:text-base font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5"
                    >
                      <Star className="w-4 h-4 md:w-5 md:h-5" /> View Feedback
                    </button>
                  ) : recentSession.status === 'Aborted' && localStorage.getItem(`repracticed_${recentSession._id}`) !== 'true' ? (
                    <button
                      onClick={() => setRePracticeSession(recentSession)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl text-sm md:text-base font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5"
                    >
                      <PlayCircle className="w-4 h-4 md:w-5 md:h-5" /> Re-practice
                    </button>
                  ) : recentSession.status === 'Failed' ? (
                    <span className="text-xs md:text-sm text-red-400 font-medium">Evaluation Failed</span>
                  ) : (
                    <span className="text-xs md:text-sm text-slate-400 font-medium">Session Closed</span>
                  )}
                </div>
              </div>

              {/* Decorative interview card */}
              <div className="hidden md:block relative z-10 w-48 h-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-5 transform rotate-3 group-hover:rotate-6 transition-transform duration-500">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="w-full h-2 bg-slate-100 rounded mb-2" />
                <div className="w-3/4 h-2 bg-slate-100 rounded mb-2" />
                <div className="w-5/6 h-2 bg-slate-100 rounded mb-5" />
                <div className="w-full h-2 bg-indigo-50 rounded mb-2" />
                <div className="w-4/5 h-2 bg-slate-100 rounded" />
              </div>
            </div>
          </div>
        )}

        {/* All Sessions Grid */}
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
            <Video className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" /> All Interview Sessions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

            {/* Create New Card */}
            <div
              onClick={handleStartInterview}
              className="bg-indigo-50/30 border-2 border-dashed border-indigo-200 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all group min-h-[200px] md:min-h-[280px]"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-indigo-900 mb-1 md:mb-2">Start New Interview</h3>
              <p className="text-xs md:text-sm text-indigo-600/80 px-2 md:px-4 font-medium">
                {isUnlimited
                  ? 'Unlimited access — go ahead!'
                  : credits > 0
                  ? `${credits} token${credits !== 1 ? 's' : ''} available — start practising`
                  : 'Purchase tokens to start a new session'}
              </p>
              {!isUnlimited && credits <= 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsBuyModalOpen(true); }}
                  className="mt-3 md:mt-4 text-xs md:text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors"
                >
                  Buy Tokens
                </button>
              )}
            </div>

            {/* Session Cards */}
            {sessions.map((session) => (
              <div
                key={session._id}
                className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all group flex flex-col"
              >
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Video className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                  </div>
                  <span
                    className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                      session.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : session.status === 'EVALUATION_RUNNING' || session.status === 'EVALUATION_PENDING'
                        ? 'bg-indigo-100 text-indigo-700'
                        : session.status === 'Aborted'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {(session.status === 'EVALUATION_RUNNING' || session.status === 'EVALUATION_PENDING') && (
                      <span className="inline-block w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                    {session.status === 'Completed' ? 'Completed'
                      : session.status === 'EVALUATION_RUNNING' ? 'Evaluating'
                      : session.status === 'EVALUATION_PENDING' ? 'Pending'
                      : session.status}
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-bold text-slate-800 line-clamp-1 mb-1">{session.jobTitle}</h3>
                <p className="text-[10px] md:text-xs text-slate-400 font-medium mb-3 md:mb-4 line-clamp-2">{session.jobDescription}</p>

                <div className="mt-auto">
                  <div className="bg-slate-50 rounded-xl p-2.5 md:p-3 mb-3 md:mb-4 flex items-center justify-between border border-slate-100">
                    <div className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400" />
                      Date
                    </div>
                    <div className="text-xs md:text-sm font-black text-slate-800">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {(session.status === 'EVALUATION_PENDING' || session.status === 'EVALUATION_RUNNING') ? (
                      <div className="flex-1 bg-indigo-50 text-indigo-500 py-2.5 md:py-3 rounded-xl text-[11px] md:text-sm font-bold flex items-center justify-center gap-1.5">
                        <Loader2 size={14} className="animate-spin" /> Generating...
                      </div>
                    ) : session.status === 'Aborted' && localStorage.getItem(`repracticed_${session._id}`) !== 'true' ? (
                      <button
                        onClick={() => setRePracticeSession(session)}
                        className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <PlayCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> Re-practice
                      </button>
                    ) : session.status === 'Completed' && session.feedback ? (
                      (session.feedback.ai_evaluation?.overall_score === 0 || !session.feedback.ai_evaluation?.overall_score) && session.messages?.length > 2 ? (
                        <button
                          onClick={() => handleRetryEvaluation(session._id)}
                          className="flex-1 bg-amber-50 text-amber-700 hover:bg-amber-100 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" /> Retry Eval
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedFeedback(session)}
                          className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5 md:w-4 md:h-4" /> View Feedback
                        </button>
                      )
                    ) : session.status === 'Failed' ? (
                      <div className="flex-1 bg-red-50 text-red-400 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center">
                        Eval Failed
                      </div>
                    ) : (
                      <div className="flex-1 bg-slate-50 text-slate-400 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center border border-slate-100">
                        Session Closed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      {isBuyModalOpen && (
        <BuyTokensModal
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          onSelectPackage={handleBuyPackage}
        />
      )}

      <FeedbackModal
        feedback={selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
      />

      {/* Re-practice confirmation modal */}
      {rePracticeSession && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setRePracticeSession(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlayCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Re-practice Session</h3>
            <p className="text-slate-500 text-sm mb-6">
              You are about to re-practice your interview for{' '}
              <strong>{rePracticeSession.jobTitle}</strong>. No extra credits will be deducted.
            </p>
            <button
              onClick={() => {
                const id = rePracticeSession._id;
                const mode = rePracticeSession.mode;
                const config = getConfig(mode);
                const targetRoute = config?.resumeRoute || '/interview-active';
                localStorage.setItem(`repracticed_${id}`, 'true');
                setRePracticeSession(null);
                navigate(`${targetRoute}/${id}`);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-indigo-200"
            >
              Start Interview Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInterviews;
