import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../animations/variants';
import { 
  Code2, 
  Server, 
  Layers, 
  Cpu, 
  Palette, 
  Binary, 
  Clock, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Sparkles, 
  Search,
  ShieldCheck,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const assessmentCatalog = [
  {
    id: "frontend-react",
    title: "Frontend Engineering (React & Modern JS)",
    category: "Web Development",
    icon: <Code2 className="text-blue-600" size={26} />,
    duration: "45 Mins",
    questions: "30 Questions",
    difficulty: "Intermediate",
    skills: ["React Hooks & State", "ES6+ JavaScript", "DOM & Event Handling", "Responsive CSS / Tailwind"],
    badge: "Most Popular",
    color: "bg-blue-50 border-blue-100"
  },
  {
    id: "backend-node",
    title: "Backend & API Systems (Node.js & Express)",
    category: "Backend Development",
    icon: <Server className="text-purple-600" size={26} />,
    duration: "45 Mins",
    questions: "30 Questions",
    difficulty: "Intermediate",
    skills: ["Node.js Runtime", "RESTful Architecture", "MongoDB & Mongoose", "JWT Auth & Middleware"],
    badge: "Core Stack",
    color: "bg-purple-50 border-purple-100"
  },
  {
    id: "fullstack-mern",
    title: "Full-Stack Software Engineering",
    category: "Full-Stack",
    icon: <Layers className="text-emerald-600" size={26} />,
    duration: "60 Mins",
    questions: "40 Questions",
    difficulty: "Advanced",
    skills: ["Full-Stack Integration", "Database Design", "Performance & Caching", "Deployment Architecture"],
    badge: "Comprehensive",
    color: "bg-emerald-50 border-emerald-100"
  },
  {
    id: "dsa-algorithms",
    title: "Data Structures & Algorithmic Problem Solving",
    category: "Computer Science",
    icon: <Binary className="text-amber-600" size={26} />,
    duration: "50 Mins",
    questions: "25 Questions",
    difficulty: "Intermediate to Hard",
    skills: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "Time & Space Complexity"],
    badge: "Foundational",
    color: "bg-amber-50 border-amber-100"
  },
  {
    id: "python-ai",
    title: "Python, Automation & AI Fundamentals",
    category: "Artificial Intelligence",
    icon: <Cpu className="text-rose-600" size={26} />,
    duration: "45 Mins",
    questions: "30 Questions",
    difficulty: "Intermediate",
    skills: ["Python 3 Core", "Data Pipelines & ETL", "LLM APIs & Prompting", "Basic Machine Learning"],
    badge: "Trending",
    color: "bg-rose-50 border-rose-100"
  },
  {
    id: "uiux-design",
    title: "UI/UX Design Systems & Human-Centered Prototyping",
    category: "Design",
    icon: <Palette className="text-indigo-600" size={26} />,
    duration: "40 Mins",
    questions: "25 Questions",
    difficulty: "All Levels",
    skills: ["Figma Component Libraries", "Design Systems", "User Research & Flows", "Accessibility (a11y)"],
    badge: "Creative",
    color: "bg-indigo-50 border-indigo-100"
  }
];

const PublicAssessments = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const isLoggedIn = () => {
    return !!(localStorage.getItem('studentToken') || localStorage.getItem('interviewToken'));
  };

  const handleStartAssessment = (assessment) => {
    if (isLoggedIn()) {
      navigate('/dashboard/assessment');
    } else {
      toast.error("Please login to your account to start this assessment.", {
        icon: "🔒",
        duration: 3500,
      });
      setTimeout(() => {
        navigate('/student-login');
      }, 1000);
    }
  };

  const filtered = assessmentCatalog.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <MainLayout>
      <SEO 
        title="Technical Skill Assessments & Verified Credentials | Code-A-Nova"
        description="Browse Code-A-Nova's technical skill assessment catalog in Frontend, Backend, Full-Stack, DSA, and AI. Take assessments and earn verifiable certificates."
        canonicalUrl="https://code-a-nova.online/assessments"
      />
      <Toaster position="top-right" />

      <div className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[#FAFAFA] min-h-screen relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/50 to-indigo-100/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-purple-100/40 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 font-bold text-xs uppercase tracking-wider mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Verifiable Skill Evaluations
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-5">
              Validate Your Skills <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Earn Recognized Credentials
              </span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg font-medium leading-relaxed mb-8">
              Take timed, domain-specific technical evaluations designed by senior developers. Earn verifiable digital completion certificates with unique verification IDs to showcase on LinkedIn and resumes.
            </p>

            {/* Search Input */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessments (e.g. React, Node, Python, DSA)..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-gray-400"
              />
            </div>
          </motion.div>

          {/* Assessment Catalog Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-20"
          >
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                variants={fadeUp}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-slate-50 group-hover:bg-blue-50 rounded-2xl transition-colors border border-gray-100">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {item.badge}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {item.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  {/* Badges Bar */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <Clock size={12} />
                      {item.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <FileCheck size={12} />
                      {item.questions}
                    </span>
                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                      {item.difficulty}
                    </span>
                  </div>

                  {/* Evaluated Skills */}
                  <div className="space-y-1.5 mb-6">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Topics Evaluated:</span>
                    {item.skills.map((skill, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 text-xs font-medium text-gray-600">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartAssessment(item)}
                  className="w-full py-3 bg-gray-900 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-auto"
                >
                  <Play size={14} />
                  <span>Take Assessment</span>
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* Verification & Certification Highlight */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl mb-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 font-bold text-xs">
                  <ShieldCheck size={14} />
                  <span>Cryptographically Verifiable</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                  Permanent Verification IDs
                </h2>
                <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed">
                  Every candidate who scores above the passing benchmark receives an authentic digital certificate equipped with a unique alphanumeric verification link and QR code, verifiable by recruiters anytime.
                </p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                  <span>Certificate Format</span>
                  <span className="text-emerald-400">PDF & Public URL</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                  <span>Passing Score</span>
                  <span className="text-blue-400">70% or Higher</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                  <span>Retake Policy</span>
                  <span className="text-slate-300">Available after 7 days</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span>Try a sample verification:</span>
                  <a href="/verify" className="text-blue-400 hover:underline font-bold">Public Verification Portal →</a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default PublicAssessments;
