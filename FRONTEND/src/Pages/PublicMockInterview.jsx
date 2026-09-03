import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../animations/variants';
import { 
  Mic, 
  Brain, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  Clock, 
  TrendingUp,
  Award
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const interviewTracks = [
  {
    title: "Full-Stack Web Development",
    level: "Junior to Senior",
    duration: "25 Mins",
    topics: ["React Lifecycle & State", "REST & GraphQL APIs", "Database Indexing & Queries", "System Architecture"],
    color: "from-blue-600 to-indigo-600"
  },
  {
    title: "Backend & Distributed Systems",
    level: "Mid-Level",
    duration: "30 Mins",
    topics: ["Node.js & Microservices", "Authentication & JWT", "Caching Strategies (Redis)", "Concurrency & Queues"],
    color: "from-purple-600 to-indigo-600"
  },
  {
    title: "Frontend Engineering",
    level: "All Levels",
    duration: "20 Mins",
    topics: ["Modern JavaScript (ES6+)", "Browser Rendering & DOM", "CSS Architecture & Performance", "Client-Side State"],
    color: "from-emerald-600 to-teal-600"
  },
  {
    title: "Behavioral & Leadership",
    level: "General",
    duration: "15 Mins",
    topics: ["STAR Method Responses", "Conflict Resolution", "Project Leadership", "Adaptability Under Pressure"],
    color: "from-amber-600 to-orange-600"
  }
];

const PublicMockInterview = () => {
  const navigate = useNavigate();

  const isLoggedIn = () => {
    return !!(localStorage.getItem('studentToken') || localStorage.getItem('interviewToken'));
  };

  const handleStart = () => {
    if (isLoggedIn()) {
      navigate('/interview-setup');
    } else {
      toast.error("Please login to your account to launch an AI mock interview.", {
        icon: "🔒",
        duration: 3500,
      });
      setTimeout(() => {
        navigate('/student-login');
      }, 1000);
    }
  };

  const handleHistory = () => {
    if (isLoggedIn()) {
      navigate('/my-interviews');
    } else {
      navigate('/student-login');
    }
  };

  return (
    <MainLayout>
      <SEO 
        title="AI-Powered Mock Interviews & Speech Analysis | Code-A-Nova"
        description="Practice real-time voice AI technical interviews in Full-Stack, Frontend, Backend, and Behavioral tracks with Code-A-Nova. Receive instant score breakdowns."
        canonicalUrl="https://code-a-nova.online/mock-interview"
      />
      <Toaster position="top-right" />

      <div className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/50 to-blue-100/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-purple-100/40 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Conversational Voice AI
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-5">
              Practice Live Interviews <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                With Instant AI Feedback
              </span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg font-medium leading-relaxed mb-8">
              Experience dynamic, voice-driven technical and behavioral mock interview sessions. Get evaluated on technical depth, communication clarity, and response structure before your real-world interviews.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 hover:bg-indigo-600 text-white font-bold text-sm rounded-full transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Play size={16} />
                <span>Start Mock Interview</span>
              </button>
              <button
                type="button"
                onClick={handleHistory}
                className="inline-flex items-center gap-2 px-7 py-4 bg-white text-gray-800 border border-gray-200 font-bold text-sm rounded-full hover:bg-gray-50 transition-all shadow-2xs cursor-pointer"
              >
                <TrendingUp size={16} />
                <span>View Past Sessions</span>
              </button>
            </div>
          </motion.div>

          {/* Three Key Value Props */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
                <Mic size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Real-Time Voice Interaction</h3>
              <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed">
                Speak naturally as you would in a real technical interview. Our conversational audio pipeline listens, evaluates, and responds dynamically.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-4">
                <Brain size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Adaptive Follow-Up Questions</h3>
              <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed">
                The AI probes deeper based on your answers, simulating the rigorous questioning styles of senior engineering interviewers.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
                <Award size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Granular Score Breakdown</h3>
              <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed">
                Receive an immediate evaluation report covering code quality, theoretical accuracy, speech clarity, and actionable tips for improvement.
              </p>
            </div>
          </div>

          {/* Interview Tracks Catalog */}
          <div className="mb-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                Available Interview Tracks
              </h2>
              <p className="text-gray-500 text-sm font-medium">
                Choose your focus domain and test your readiness under realistic interview conditions.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {interviewTracks.map((track, idx) => (
                <div 
                  key={idx}
                  className="bg-white border border-gray-100 rounded-3xl p-7 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-gray-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                        {track.level}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                        <Clock size={13} />
                        {track.duration}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-3">{track.title}</h3>

                    <div className="space-y-1.5 mb-6">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Coverage:</span>
                      {track.topics.map((t, tIdx) => (
                        <div key={tIdx} className="flex items-center gap-2 text-xs font-medium text-gray-600">
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStart}
                    className="w-full py-3 bg-gray-900 hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer mt-auto"
                  >
                    <span>Launch Interview Track</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default PublicMockInterview;
