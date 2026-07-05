import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Zap, CheckCircle, Award, ArrowRight, Plus, Eye, Sparkles } from 'lucide-react';

const ResumeBuilderCTA = () => {
  const navigate = useNavigate();
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/admin/resume-settings`);
        if (res.data.success && res.data.enabled !== undefined) {
          setIsEnabled(res.data.enabled);
        }
      } catch (error) {
        console.error("Failed to fetch resume settings", error);
      }
    };
    fetchSettings();
  }, []);

  const isLoggedIn = () => {
    return !!localStorage.getItem('studentToken');
  };

  const handleCreateResume = () => {
    if (isLoggedIn()) {
      // User is logged in — go directly to my-resumes to create
      navigate('/my-resumes');
    } else {
      // Not logged in — send to login page
      navigate('/student-login');
    }
  };

  const handleViewResumes = () => {
    if (isLoggedIn()) {
      navigate('/my-resumes');
    } else {
      navigate('/student-login');
    }
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-slate-50 to-white font-sans">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-violet-100 rounded-full blur-[90px] opacity-60" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[90px] opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">

        {/* Section Label */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 text-violet-700 font-bold text-sm mb-4 border border-violet-100">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span>AI-Powered Resume Builder</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-5 tracking-tight">
            Free Online{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500">
              Resume Builder
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Create professional, ATS-friendly resumes online for free. Bypass automated filters and land directly in front of hiring managers with our advanced resume maker.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* Left — Feature list */}
          <div className="space-y-5">
            {[
              {
                icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
                bg: 'bg-emerald-50 border-emerald-100',
                title: '100% ATS Compatible',
                desc: 'Our templates are optimized to pass every major applicant tracking system.',
              },
              {
                icon: <Zap className="w-5 h-5 text-amber-600" />,
                bg: 'bg-amber-50 border-amber-100',
                title: 'Instant Smart Formatting',
                desc: 'No design skills needed — fill in your details and get a professional layout instantly.',
              },
              {
                icon: <Award className="w-5 h-5 text-indigo-600" />,
                bg: 'bg-indigo-50 border-indigo-100',
                title: 'Industry-Standard Templates',
                desc: 'Designs approved for FAANG, startups, and everything in between.',
              },
              {
                icon: <FileText className="w-5 h-5 text-violet-600" />,
                bg: 'bg-violet-50 border-violet-100',
                title: 'First Resume — Absolutely Free',
                desc: 'Create your first resume for free. No credit card required.',
              },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-4 rounded-2xl p-5 border ${item.bg} transition-all hover:shadow-md hover:-translate-y-0.5 duration-300`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm`}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                id="resume-create-btn"
                onClick={handleCreateResume}
                className="group relative flex-1 px-8 py-4 bg-violet-600 text-white rounded-2xl font-bold text-base overflow-hidden shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <Plus className="w-5 h-5" />
                <span>Create My Resume</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="resume-view-btn"
                onClick={handleViewResumes}
                className="flex-1 px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-base hover:border-violet-300 hover:text-violet-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                <span>View My Resumes</span>
              </button>
            </div>

            {!isLoggedIn() && (
              <p className="text-xs text-slate-400 font-medium pt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                You'll be asked to sign in first before creating a resume.
              </p>
            )}
          </div>

          {/* Right — Decorative Resume Card */}
          <div className="relative hidden lg:flex justify-center items-center">
            {/* Glow ring */}
            <div className="absolute w-[420px] h-[420px] bg-gradient-to-tr from-violet-200 to-indigo-100 rounded-full blur-[60px] opacity-60" />

            {/* Resume card */}
            <div className="relative w-80 bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-300/40 p-8 overflow-hidden group cursor-pointer hover:shadow-violet-200/60 hover:-translate-y-1 transition-all duration-500" onClick={handleViewResumes}>
              {/* Card header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-slate-900">My Resume</p>
                  <p className="text-xs text-slate-400 font-medium">ATS Score: 98%</p>
                </div>
                <div className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-lg border border-emerald-200">
                  Draft
                </div>
              </div>

              {/* Skeleton lines */}
              <div className="space-y-3 mb-5">
                <div className="h-3 bg-slate-100 rounded-full w-full" />
                <div className="h-3 bg-slate-100 rounded-full w-4/5" />
                <div className="h-3 bg-slate-100 rounded-full w-5/6" />
              </div>

              <div className="h-px bg-slate-100 mb-5" />

              <div className="space-y-2 mb-5">
                <div className="h-2.5 bg-violet-50 rounded-full w-1/2" />
                <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                <div className="h-2.5 bg-slate-100 rounded-full w-5/6" />
                <div className="h-2.5 bg-slate-100 rounded-full w-3/4" />
              </div>

              <div className="h-px bg-slate-100 mb-5" />

              <div className="space-y-2">
                <div className="h-2.5 bg-indigo-50 rounded-full w-2/5" />
                <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                <div className="h-2.5 bg-slate-100 rounded-full w-4/5" />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-violet-600/90 opacity-0 group-hover:opacity-100 rounded-[2rem] transition-opacity duration-300">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Eye className="w-8 h-8" />
                  <span className="font-black text-base">View My Resumes</span>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute top-6 right-6 bg-white shadow-xl rounded-2xl px-4 py-3 border border-slate-100 flex items-center gap-2 animate-bounce-slow">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">1st Resume</p>
                <p className="text-[10px] text-emerald-600 font-bold">FREE!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResumeBuilderCTA;
