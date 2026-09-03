import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../animations/variants';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Download, 
  Eye, 
  ShieldCheck, 
  Layout, 
  Cpu, 
  Layers,
  Plus
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const templates = [
  {
    name: "Modern Tech",
    badge: "Popular with Tech Giants",
    color: "from-blue-500 to-indigo-600",
    desc: "Clean two-column layout optimized for software developers, highlighting technical skills and live project demos."
  },
  {
    name: "Minimalist ATS",
    badge: "100% ATS Friendly",
    color: "from-slate-700 to-slate-900",
    desc: "Single-column typographical layout with high ATS parser compatibility, perfect for enterprise engineering roles."
  },
  {
    name: "Creative Engineering",
    badge: "Design & Full-Stack",
    color: "from-purple-500 to-pink-600",
    desc: "Subtle accent lines and visual skill pills designed for frontend, full-stack, and UI/UX engineering candidates."
  }
];

const features = [
  {
    icon: <Cpu className="w-6 h-6 text-blue-600" />,
    title: "ATS-Optimized Architecture",
    desc: "Engineered specifically to parse flawlessly through Greenhouse, Lever, Workday, and standard enterprise ATS parsers."
  },
  {
    icon: <Download className="w-6 h-6 text-purple-600" />,
    title: "Vector PDF Generation",
    desc: "One-click export produces crisp, selectable-text vector PDF documents formatted precisely for recruiters."
  },
  {
    icon: <Layout className="w-6 h-6 text-emerald-600" />,
    title: "Modular Section Ordering",
    desc: "Easily drag and arrange sections—Work History, Academic Education, Projects, and Certifications—to suit your experience level."
  },
  {
    icon: <Sparkles className="w-6 h-6 text-amber-600" />,
    title: "Pre-Formatted Project Bullets",
    desc: "Guided prompts structured around the Google XYZ framework (Accomplished X, measured by Y, by doing Z)."
  }
];

const PublicResumeBuilder = () => {
  const navigate = useNavigate();

  const isLoggedIn = () => {
    return !!(localStorage.getItem('studentToken') || localStorage.getItem('interviewToken'));
  };

  const handleStartBuilding = () => {
    if (isLoggedIn()) {
      navigate('/my-resumes');
    } else {
      toast.error("Please login to your student account to build and save your resume.", {
        icon: "🔒",
        duration: 3500,
      });
      setTimeout(() => {
        navigate('/student-login');
      }, 1000);
    }
  };

  return (
    <MainLayout>
      <SEO 
        title="Free ATS-Friendly Resume Builder | Code-A-Nova"
        description="Create professional, ATS-optimized engineering resumes in minutes with Code-A-Nova. Choose modern templates, customize sections, and download clean PDFs."
        canonicalUrl="https://code-a-nova.online/resume-builder"
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 font-bold text-xs uppercase tracking-wider mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Career Acceleration Tool
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-5">
              Craft High-Impact <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                ATS-Optimized Resumes
              </span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg font-medium leading-relaxed mb-8">
              Build clean, recruiter-approved software engineering resumes designed to pass automated applicant tracking systems and land high-yield interview callbacks.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleStartBuilding}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 hover:bg-blue-600 text-white font-bold text-sm rounded-full transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Plus size={18} />
                <span>Create Your Resume</span>
              </button>
              <button
                type="button"
                onClick={handleStartBuilding}
                className="inline-flex items-center gap-2 px-7 py-4 bg-white text-gray-800 border border-gray-200 font-bold text-sm rounded-full hover:bg-gray-50 transition-all shadow-2xs cursor-pointer"
              >
                <Eye size={16} />
                <span>View Saved Resumes</span>
              </button>
            </div>
          </motion.div>

          {/* Feature Pillars */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24"
          >
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-3 bg-slate-50 rounded-2xl w-fit mb-4 border border-gray-100">
                  {feat.icon}
                </div>
                <h3 className="text-base font-black text-gray-900 mb-2">
                  {feat.title}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Templates Showcase */}
          <div className="mb-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                Proven Recruitment Templates
              </h2>
              <p className="text-gray-500 text-sm font-medium">
                Engineered with clean typography, balanced whitespace, and standards-compliant headings.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {templates.map((tpl, i) => (
                <div 
                  key={i} 
                  className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-44 bg-slate-50 rounded-2xl border border-gray-100 mb-6 p-4 flex flex-col justify-between overflow-hidden relative group">
                      <div className="space-y-2">
                        <div className="h-3 w-2/3 bg-slate-300 rounded" />
                        <div className="h-2 w-1/2 bg-slate-200 rounded" />
                      </div>
                      <div className="space-y-1.5 pt-4 border-t border-slate-200">
                        <div className="h-2 w-full bg-slate-200 rounded" />
                        <div className="h-2 w-4/5 bg-slate-200 rounded" />
                        <div className="h-2 w-3/4 bg-slate-200 rounded" />
                      </div>
                      <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600 bg-white px-3 py-1.5 rounded-full shadow-sm">
                          ATS Tested
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full inline-block mb-3 border border-blue-100">
                      {tpl.badge}
                    </span>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{tpl.name}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed mb-6">
                      {tpl.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartBuilding}
                    className="w-full py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer mt-auto"
                  >
                    <span>Use Template</span>
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

export default PublicResumeBuilder;
