import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, MapPin, ExternalLink, ArrowRight, Zap, CheckCircle, Search } from 'lucide-react';

const JobPortalCTA = () => {
  const navigate = useNavigate();
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Check if feature is enabled, assuming similar admin settings exists or default to true
    // If backend doesn't have this setting yet, it defaults to true
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/admin/settings/job-portal`);
        if (res.data.success && res.data.enabled !== undefined) {
          setIsEnabled(res.data.enabled);
        }
      } catch (error) {
        // Ignored, defaults to true
      }
    };
    fetchSettings();
  }, []);

  if (!isEnabled) {
    return null;
  }

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-white to-slate-50 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-sm mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              Real-time Job Updates
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
              Find Your Dream Tech Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Faster</span>
            </h2>
            
            <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
              Browse thousands of fresh job openings from top tech companies. Filter by role, location, and apply directly to accelerate your career growth.
            </p>

            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-slate-700 font-semibold">Jobs updated daily via smart APIs</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-slate-700 font-semibold">Track & Save your favorite opportunities</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-slate-700 font-semibold">100% Free for Code-A-Nova students</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/jobs')}
                className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                Browse Jobs <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Visual (Mock Job Cards) */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-violet-50 rounded-[3rem] transform rotate-3 scale-105 opacity-50"></div>
            <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-4 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
              
              {/* Fake Search Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 mb-6">
                <Search className="w-5 h-5 text-slate-400" />
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              </div>

              {/* Mock Job 1 */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:border-indigo-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">Software Development Engineer</h3>
                    <p className="text-sm text-slate-500 font-medium">TechNova Solutions</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">T</div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-bold rounded border border-slate-200 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Bangalore
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded border border-emerald-100">
                    Full-time
                  </span>
                </div>
              </div>

              {/* Mock Job 2 */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:border-indigo-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">Frontend React Developer</h3>
                    <p className="text-sm text-slate-500 font-medium">Creative Startup</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold">C</div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-bold rounded border border-slate-200 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Remote
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[11px] font-bold rounded border border-amber-100 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Hot
                  </span>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default JobPortalCTA;
