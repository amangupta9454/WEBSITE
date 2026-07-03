import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Brain, MessageSquare, ArrowRight, Video, Target, Zap } from 'lucide-react';

const MockInterviewCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-24 overflow-hidden bg-slate-900 font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBMMDAgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KPHBhdGggZD0iTTQwIDBMMCAwIiBzdHJva2UPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Content Left Side */}
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-300 font-bold text-sm mb-6 border border-indigo-500/20 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>New Feature Alert</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Master Your Next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Tech Interview
              </span>
            </h2>
            
            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-xl">
              Don't leave your career to chance. Practice with our advanced AI Interviewer that simulates real-world tech interviews, provides instant feedback, and helps you land your dream job.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button 
                onClick={() => navigate('/interview-dashboard')}
                className="group relative px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <span>Try AI Interview Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-700/50">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="text-slate-200 font-bold">Smart AI</span>
                <span className="text-xs text-slate-400">Context-aware questions</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-slate-200 font-bold">Real Feel</span>
                <span className="text-xs text-slate-400">Like a real video call</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-slate-200 font-bold">Feedback</span>
                <span className="text-xs text-slate-400">Actionable insights</span>
              </div>
            </div>
          </div>

          {/* Visual Right Side */}
          <div className="order-1 lg:order-2 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent rounded-[3rem] transform rotate-3 scale-105 filter blur-xl"></div>
            
            <div className="relative bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl overflow-hidden group">
              
              {/* Mock Video UI */}
              <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 aspect-video border border-slate-700/50 mb-4 group-hover:border-indigo-500/50 transition-colors duration-500">
                {/* Simulated Video feed (Abstract) */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-slate-900 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-indigo-500/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping"></div>
                    <Brain className="w-12 h-12 text-indigo-400" />
                  </div>
                </div>

                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    REC
                  </span>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500/80 backdrop-blur-md border border-red-500 flex items-center justify-center text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                </div>
              </div>

              {/* Mock Chat UI */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="bg-slate-700/50 border border-slate-600 rounded-2xl rounded-tl-none p-3 text-sm text-slate-200">
                    Can you explain the difference between REST and GraphQL?
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-cyan-400">YOU</span>
                  </div>
                  <div className="bg-indigo-600/80 border border-indigo-500 rounded-2xl rounded-tr-none p-3 text-sm text-white">
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
