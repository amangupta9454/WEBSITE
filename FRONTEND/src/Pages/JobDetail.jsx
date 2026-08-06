import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import { MapPin, DollarSign, Briefcase, ExternalLink, ArrowLeft, Clock, Bookmark, Building, CheckCircle, Lock, Crown, Mail, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState(199);

  useEffect(() => {
    const fetchJob = async () => {
      const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data.success) {
          setJob(res.data.data);
          if (res.data.premiumPrice) {
            setPremiumPrice(res.data.premiumPrice);
          }
        }
      } catch (error) {
        console.error('Failed to fetch job details:', error);
        toast.error('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    const checkSaved = async () => {
      const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
      if (!token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/saved`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const saved = res.data.data.some(sj => sj.job._id === id);
          setIsSaved(saved);
        }
      } catch (error) {
        console.error('Failed to fetch saved jobs:', error);
      }
    };

    const checkApplied = async () => {
      const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
      if (!token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/applied`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const applied = res.data.data.some(aj => aj.job._id === id);
          setIsApplied(applied);
        }
      } catch (error) {
        console.error('Failed to fetch applied jobs:', error);
      }
    };

    fetchJob();
    checkSaved();
    checkApplied();
  }, [id]);

  const toggleSaveJob = async () => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) {
      toast.error('Please login to save jobs');
      return;
    }

    try {
      if (isSaved) {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/save/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsSaved(false);
        toast.success('Job removed from saved list');
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/save/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsSaved(true);
        toast.success('Job saved successfully');
      }
    } catch (error) {
      console.error('Failed to toggle save job:', error);
      toast.error('Operation failed');
    }
  };

  const toggleApplyJob = async () => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) {
      toast.error('Please login first to record application');
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/apply/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.isApplied) {
        setIsApplied(true);
        toast.success('✅ Marked as Applied!');
      } else {
        setIsApplied(false);
        toast.success('Removed from applied list');
      }
    } catch (error) {
      console.error('Failed to toggle apply job:', error);
      toast.error('Operation failed');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="bg-[#FAFAFA] min-h-screen pt-24 pb-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout>
        <div className="bg-[#FAFAFA] min-h-screen pt-24 pb-20 flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Job Not Found</h1>
          <p className="text-slate-600 mb-8">The job you are looking for might have been removed or is no longer available.</p>
          <Link to="/jobs" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            Browse Other Jobs
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Helper function to format raw job description text nicely
  const formatDescription = (text) => {
    if (!text) return null;
    
    // Check if it already contains HTML
    if (text.includes('<p>') || text.includes('<ul>') || text.includes('<br>')) {
      return <div dangerouslySetInnerHTML={{ __html: text }} />;
    }

    // Split text by newlines
    const lines = text.split('\n').filter(line => line.trim() !== '');

    return (
      <div className="space-y-4">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          
          const isHeading = 
            trimmed.length < 60 && 
            (!trimmed.endsWith('.') || trimmed.endsWith(':')) &&
            !trimmed.startsWith('-') &&
            !trimmed.startsWith('•') &&
            !trimmed.startsWith('*');

          const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*');

          if (isHeading) {
            return (
              <h3 key={index} className="text-lg font-bold text-slate-800 mt-6 mb-2">
                {trimmed}
              </h3>
            );
          }

          if (isBullet) {
            return (
              <ul key={index} className="list-disc pl-5 my-1 text-slate-600">
                <li>{trimmed.replace(/^[-•*]\s*/, '')}</li>
              </ul>
            );
          }

          return (
            <p key={index} className="text-slate-600 leading-relaxed">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="bg-[#FAFAFA] min-h-screen pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          
          <Link to="/jobs" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-bold mb-8 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Board
          </Link>

          {/* Header Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl md:text-3xl border border-indigo-200 shadow-sm shrink-0 mt-1">
                  {job.company.charAt(0)}
                </div>
                <div>
                  <div className="mb-2.5 flex items-center gap-2">
                    {job.planType === 'Premium' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 shadow-sm border border-amber-300">
                        👑 Premium Exclusive Opportunity
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        🟢 Basic Free Role
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex items-center text-slate-600 font-medium text-base md:text-lg gap-2">
                    <Building className="w-5 h-5 text-indigo-500 shrink-0" />
                    {job.company}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto shrink-0 pt-1">
                <button 
                  onClick={toggleSaveJob}
                  className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl border-2 transition-all ${
                    isSaved 
                      ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-400'
                  }`}
                  title={isSaved ? "Saved Bookmark" : "Bookmark Job"}
                >
                  <Bookmark className={`w-5 h-5 md:w-6 md:h-6 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={toggleApplyJob}
                  className={`flex items-center justify-center gap-1.5 px-4 h-12 md:h-14 rounded-2xl border-2 font-black transition-all text-sm ${
                    isApplied 
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
                  title="Toggle Application Status"
                >
                  <span>{isApplied ? '✅ Applied' : '☑️ Mark Applied'}</span>
                </button>
                {job.isLocked ? (
                  <Link 
                    to="/jobs"
                    className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-black hover:from-amber-300 hover:to-yellow-300 transition-all shadow-lg shadow-amber-500/20 hover:-translate-y-1 text-sm md:text-base"
                  >
                    🔒 Unlock Premium to Apply
                  </Link>
                ) : (
                  <button 
                    onClick={() => {
                      if (!isApplied) toggleApplyJob();
                      if (job.applyUrl) {
                        window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
                      } else if (job.applyEmail) {
                        window.location.href = `mailto:${job.applyEmail}?subject=Application for ${encodeURIComponent(job.title)}`;
                      } else {
                        toast.error('Application link is not currently specified.');
                      }
                    }}
                    className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-black hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-600/20 hover:-translate-y-1 text-sm md:text-base cursor-pointer"
                  >
                    {job.applyEmail && !job.applyUrl ? '📧 Click to Email' : '🚀 Apply Now'}
                    <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6 pt-6 md:mt-8 md:pt-8 border-t border-slate-100 relative z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 text-slate-700 rounded-xl text-xs md:text-sm font-bold border border-slate-200">
                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 shrink-0" />
                {job.location}
              </span>
              {job.isRemote && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs md:text-sm font-bold border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600 shrink-0" />
                  Remote OK
                </span>
              )}
              <span className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-amber-50 text-amber-800 rounded-xl text-xs md:text-sm font-bold border border-amber-200">
                <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 shrink-0" />
                {job.salary || 'Not disclosed'}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-violet-50 text-violet-800 rounded-xl text-xs md:text-sm font-bold border border-violet-200">
                <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-600 shrink-0" />
                {job.jobType || 'Full-Time'}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 text-slate-500 rounded-xl text-xs md:text-sm font-semibold border border-slate-200">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                Posted {new Date(job.postedAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Box or Locked VIP Banner */}
          {job.isLocked ? (
            <div className="bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border-2 border-amber-400 rounded-3xl p-8 my-8 text-center relative overflow-hidden shadow-sm">
              <div className="max-w-xl mx-auto">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900 shadow-lg shadow-amber-500/30">
                  <Lock className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  👑 Exclusive Premium Opportunity
                </h3>
                <p className="text-slate-600 font-medium mb-6 text-sm sm:text-base leading-relaxed">
                  This job opportunity (including direct recruiter email & application links) is reserved exclusively for Job Portal Premium subscribers. Upgrade to our VIP plan for just <b>{premiumPrice} Tokens</b> to access 10 daily premium roles for 3 full months!
                </p>
                <Link
                  to="/jobs"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-900 px-8 py-4 rounded-2xl font-black text-base shadow-xl shadow-amber-500/25 transition-all"
                >
                  <Crown className="w-5 h-5 fill-current" />
                  Unlock Premium Plan on Job Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-200/80 rounded-3xl p-6 md:p-8 my-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
              <div>
                <h3 className="text-lg font-black text-indigo-950 mb-1 flex items-center gap-2">
                  <span>🎯 Ready to apply for this role?</span>
                </h3>
                <p className="text-indigo-900/70 text-sm font-semibold">Use our interactive click-to-apply protection buttons below to open the application or email the recruiter.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                {job.applyEmail && (
                  <button
                    onClick={() => {
                      if (!isApplied) toggleApplyJob();
                      window.location.href = `mailto:${job.applyEmail}?subject=Application for ${encodeURIComponent(job.title)}`;
                    }}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-indigo-700 border-2 border-indigo-200 px-6 py-3.5 rounded-2xl font-extrabold shadow-sm transition-all text-sm cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-indigo-600" />
                    📧 Click to Email Recruiter
                  </button>
                )}
                {job.applyUrl && (
                  <button
                    onClick={() => {
                      if (!isApplied) toggleApplyJob();
                      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-600/20 transition-all text-sm cursor-pointer"
                  >
                    🚀 Click to Open Career Link
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                {!job.applyEmail && !job.applyUrl && (
                  <span className="px-5 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl text-sm">
                    Application portal temporarily offline
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Details Section with Copy Protection */}
          <div 
            className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10 select-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
            onCopy={(e) => {
              e.preventDefault();
              toast.error('🔒 Copying job descriptions is disabled to protect content.');
              return false;
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              toast.error('🔒 Right-click context menu is disabled on job listings.');
              return false;
            }}
            onCut={(e) => e.preventDefault()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-slate-100 pb-4 gap-2">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Job Description & Requirements
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-black rounded-lg border border-amber-200/80 self-start sm:self-auto">
                🔒 Content Copy-Protected
              </span>
            </div>

            <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-headings:text-slate-800 prose-li:text-slate-600 prose-strong:text-slate-800 prose-strong:font-black">
              {job.description ? (
                formatDescription(job.description)
              ) : (
                <p>No detailed description provided by the employer.</p>
              )}
            </div>
            
            {/* Disclaimer */}
            <div className="mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-200 text-sm text-slate-500">
              <p className="font-semibold text-slate-700 mb-2">Please note:</p>
              Code-A-Nova is a curated career platform for finding tech jobs. We do not guarantee employment. Always verify company details before sharing confidential documents.
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default JobDetail;
