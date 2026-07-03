import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mic, Brain, MessageSquare, ArrowRight, Video, Target, Zap } from 'lucide-react';

const MockInterviewCTA = () => {
  const navigate = useNavigate();
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5004'}/api/admin/interview-settings`);
        if (res.data.success && res.data.enabled !== undefined) {
          setIsEnabled(res.data.enabled);
        }
      } catch (error) {
        console.error("Failed to fetch interview settings", error);
      }
    };
    fetchSettings();
  }, []);

  const handleCTAClick = () => {
    const token = localStorage.getItem('interviewToken');
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/student-login');
    }
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <section className="relative py-24 overflow-hidden bg-white font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-50 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-50 rounded-full mix-blend-multiply filter blur-[80px] opacity-70"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBMMDAgMCIgc3Ryb2tlPSJyZ2JhKDAsIDAsIDAsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPHBhdGggZD0iTTQwIDBMMCAwIiBzdHJva2UPSJyZ2JhKDAsIDAsIDAsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-50"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Content Left Side */}
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm mb-6 border border-indigo-100">
              <Zap className="w-4 h-4 text-indigo-500" />
              <span>New Feature Alert</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Master Your Next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                Tech Interview
              </span>
            </h2>
            
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
              Don't leave your career to chance. Practice with our advanced AI Interviewer that simulates real-world tech interviews, provides instant feedback, and helps you land your dream job.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button 
                onClick={handleCTAClick}
                className="group relative px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg overflow-hidden shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <span>Try AI Interview Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="text-slate-900 font-bold">Smart AI</span>
                <span className="text-xs text-slate-500">Context-aware questions</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-slate-900 font-bold">Real Feel</span>
                <span className="text-xs text-slate-500">Like a real video call</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-slate-900 font-bold">Feedback</span>
                <span className="text-xs text-slate-500">Actionable insights</span>
              </div>
            </div>
          </div>

          {/* Visual Right Side */}
          <div className="order-1 lg:order-2 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-transparent rounded-[3rem] transform rotate-3 scale-105 filter blur-xl opacity-60"></div>
            
            <div className="relative bg-white border border-slate-200 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl shadow-slate-200/50 overflow-hidden group">
              
              {/* Mock Video UI */}
              <div className="relative rounded-[2rem] overflow-hidden bg-slate-50 aspect-video border border-slate-200 mb-4 group-hover:border-indigo-300 transition-colors duration-500 shadow-sm">
                {/* Simulated Video feed (Abstract) */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-200 animate-ping opacity-75"></div>
                    <Brain className="w-12 h-12 text-indigo-600" />
                  </div>
                </div>

                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    REC
                  </span>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                </div>
              </div>

              {/* Mock Chat UI */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                    <Brain className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700 shadow-sm">
                    Can you explain the difference between REST and GraphQL?
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center shrink-0 border border-cyan-200">
                    <span className="text-[10px] font-black text-cyan-700">YOU</span>
                  </div>
                  <div className="bg-indigo-600 border border-indigo-500 rounded-2xl rounded-tr-none p-3 text-sm text-white shadow-sm shadow-indigo-200">
                    Sure! REST exposes multiple endpoints for different resources, while GraphQL uses a single endpoint...
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MockInterviewCTA;
