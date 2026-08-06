import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, MapPin, ArrowRight, Zap, CheckCircle, Search, Gift, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';

const JobPortalCTA = () => {
  const navigate = useNavigate();
  const [isEnabled, setIsEnabled] = useState(true);
  const [isFreePromo, setIsFreePromo] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState(199);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/admin/settings/job-portal`);
        if (res.data) {
          if (res.data.jobPortalEnabled !== undefined) {
            setIsEnabled(Boolean(res.data.jobPortalEnabled));
          } else if (res.data.enabled !== undefined) {
            setIsEnabled(Boolean(res.data.enabled));
          }
          if (res.data.jobPortalFreeMode !== undefined) {
            setIsFreePromo(Boolean(res.data.jobPortalFreeMode));
          }
          if (res.data.jobPortalPremiumPrice !== undefined) {
            setPremiumPrice(Number(res.data.jobPortalPremiumPrice) || 199);
          }
        }
      } catch (error) {
        console.error("Failed to fetch job portal settings for home banner:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleCTA = () => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (token) {
      navigate('/jobs');
    } else {
      sessionStorage.setItem('redirectAfterLogin', '/jobs');
      navigate('/student-login');
    }
  };

  // Turn off completely if disabled from Admin Panel
  if (!isEnabled) {
    return null;
  }

  const totalOpportunities = 1080; // 12 jobs/day * 90 days
  const perJobCost = (premiumPrice / totalOpportunities).toFixed(2);

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Top Celebration Promo Banner (When Free Mode is Active) */}
        {isFreePromo && (
          <div className="mb-12 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 rounded-2xl p-0.5 shadow-xl shadow-emerald-500/10 animate-fade-in">
            <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-400/20 rounded-xl text-emerald-300 font-bold animate-bounce">
                  🎁
                </span>
                <div>
                  <div className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start">
                    <Sparkles className="w-3.5 h-3.5" /> Limited Time Promotional Offer
                  </div>
                  <div className="text-white text-base md:text-lg font-black">
                    🎉 1 MONTH FREE VIP ACCESS ACTIVE! Unlock Daily 10 Premium & 2 Basic Jobs at ₹0!
                  </div>
                </div>
              </div>
              <button
                onClick={handleCTA}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs md:text-sm hover:scale-105 transition-transform shadow-lg shadow-emerald-400/20 whitespace-nowrap shrink-0"
              >
                Claim Free Access Now →
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Content */}
          <div className="lg:col-span-7 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-sm mb-6 shadow-xs">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              Official Career & Job Portal
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Unlock Your Dream Career For Less Than <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">₹{perJobCost} per Job!</span>
            </h2>
            
            <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
              Access curated full-time jobs, high-paying tech internships, and part-time opportunities. We filter out the noise and deliver verified listings with official recruiter contact links directly to your dashboard.
            </p>

            {/* Jaw-Dropping Offer Math & Value Breakdown Box */}
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-100 shadow-lg shadow-indigo-500/5 mb-8">
              <div className="flex items-center gap-2 text-indigo-900 font-black text-base mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <span>Why Our Job Portal is Better:</span>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 text-center sm:text-left mb-4">
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Daily Flow</div>
                  <div className="text-lg font-black text-slate-900">12 Jobs / Day</div>
                  <div className="text-[11px] font-semibold text-indigo-600">10 VIP + 2 Basic Roles</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">90-Day Access</div>
                  <div className="text-lg font-black text-slate-900">1,080+ Openings</div>
                  <div className="text-[11px] font-semibold text-emerald-600">Verified Direct Links</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-3.5 text-white shadow-md">
                  <div className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">Cost / Opportunity</div>
                  <div className="text-xl font-black text-white">
                    {isFreePromo ? "FREE ₹0" : `₹${perJobCost}`}
                  </div>
                  <div className="text-[11px] text-indigo-100 font-bold">
                    {isFreePromo ? "1-Month Free active!" : `₹${premiumPrice} for 3 Months`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pt-3 border-t border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Includes direct Official Application Web URLs & Recruiter Click-to-Email links!</span>
              </div>
            </div>

            {/* Feature Checkmarks */}
            <div className="space-y-3 mb-8 text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Login once to unlock complete salary descriptions and recruiter contact info</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Save your favorite jobs and monitor your application statuses</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={handleCTA}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white px-8 py-4 rounded-2xl font-black text-lg hover:opacity-95 hover:shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 group"
              >
                <span>{isFreePromo ? "Claim Free VIP Access" : "Explore Job Portal Now"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <span className="text-xs font-bold text-slate-400">
                🔒 Requires Student Login
              </span>
            </div>
          </div>

          {/* Right Visual (Mock Job Cards & Ambassador Showcase) */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 via-purple-100 to-violet-100 rounded-[3rem] transform rotate-2 scale-105 opacity-60"></div>
            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-4 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
              
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Live Feed Preview</div>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              {/* Fake Search Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 mb-6">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Search Internships, Full-time, Remote...</span>
              </div>

              {/* Mock Job 1 */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Frontend Engineering Intern</h3>
                    <p className="text-xs text-slate-500 font-medium">TechNova AI • Bangalore / Hybrid</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-black text-[10px] rounded border border-indigo-100">
                    💼 Internship
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-bold text-amber-700">₹35,000 / month</span>
                  <span className="text-indigo-600 font-extrabold flex items-center gap-1">Apply Now →</span>
                </div>
              </div>

              {/* Mock Job 2 */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Full-Stack SDE (React + Node)</h3>
                    <p className="text-xs text-slate-500 font-medium">Global Cloud Corp • Remote</p>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-black text-[10px] rounded border border-purple-100">
                    💼 Full-time
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-bold text-emerald-700">₹12 - 18 LPA</span>
                  <span className="text-indigo-600 font-extrabold flex items-center gap-1">Apply Now →</span>
                </div>
              </div>

              {/* Promo badge inside mock card */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 text-center">
                <div className="text-xs font-black text-purple-900 mb-1">
                  🎓 Want to build leadership skills & earn certifications?
                </div>
                <button 
                  onClick={() => navigate('/campus-ambassador')}
                  className="text-xs font-extrabold text-indigo-700 hover:text-indigo-900 underline"
                >
                  Apply to Become a Campus Ambassador →
                </button>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default JobPortalCTA;
