import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { MapPin, DollarSign, Briefcase, ExternalLink, Bookmark, Building } from 'lucide-react';

const JobCard = ({ job, onSave, isSaved, isApplied, onToggleApply }) => {
  const navigate = useNavigate();

  const handleUnauthenticated = (actionName) => {
    // Record unauthenticated guest IP and activity attempt in Admin Audit Logs
    axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/audit-log`, {
      action: `Unauthenticated ${actionName} Attempt / Redirected to Login`,
      jobId: job._id,
      jobTitle: job.title || '',
      company: job.company || ''
    }).catch(() => {});

    toast.error(`🔒 Please login first to ${actionName.toLowerCase()} or interact with job opportunities!`);
    sessionStorage.setItem('redirectAfterLogin', `/jobs/${job._id}`);
    navigate('/student-login');
  };

  const checkLoginAndExecute = (e, callback, actionName) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) {
      handleUnauthenticated(actionName);
      return;
    }
    if (callback) callback();
  };

  const handleApplyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) {
      handleUnauthenticated('Apply');
      return;
    }

    if (onToggleApply && !isApplied) {
      onToggleApply(job._id);
    }
    if (job.applyUrl) {
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    } else if (job.applyEmail) {
      window.location.href = `mailto:${job.applyEmail}?subject=Application for ${encodeURIComponent(job.title)}`;
    } else {
      toast.error('Application link not specified.');
    }
  };

  return (
    <Link 
      to={`/jobs/${job._id}`}
      className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col h-full overflow-hidden block"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* "New" Ribbon Stamp */}
      {job.createdAt && (new Date() - new Date(job.createdAt)) < 24 * 60 * 60 * 1000 && (
        <div className="absolute top-4 -left-9 w-32 -rotate-45 bg-gradient-to-r from-rose-500 to-red-500 text-white font-black text-[10px] py-1 text-center uppercase tracking-widest shadow-lg z-20 pointer-events-none">
          NEW
        </div>
      )}
      
      <div className="flex justify-between items-start mb-5 relative z-10 pt-2">
        <div className="pr-4">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            {isApplied && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                ✅ Applied
              </span>
            )}
          </div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 line-clamp-2">
            {job.title}
          </h3>
          <p className="text-slate-500 font-medium flex items-center gap-1.5 text-sm flex-wrap">
            <Building className="w-4 h-4 text-slate-400" />
            {job.company}
            {job.createdAt && (
              <span className="text-xs text-slate-400 ml-auto border-l border-slate-200 pl-2">
                Uploaded: {new Date(job.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3 shrink-0">
          {job.planType === 'Premium' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 shadow-sm border border-amber-300">
              👑 Premium Exclusive
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              🟢 Basic Free Role
            </span>
          )}
          {/* Placeholder Logo */}
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center text-indigo-500 font-black text-2xl border border-indigo-100 shadow-sm group-hover:scale-110 transition-transform">
            {job.company.charAt(0)}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-5 relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
          <MapPin className="w-3.5 h-3.5" />
          {job.location}
        </span>
        {job.isRemote && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
            Remote
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
          <DollarSign className="w-3.5 h-3.5" />
          {job.salary || 'Not disclosed'}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
          💼 {job.jobType || 'Full-time'}
        </span>
      </div>

      <p className="text-sm text-slate-500 line-clamp-3 mb-6 relative z-10 flex-grow">
        {job.description || "No description provided. Click to view more details about this role."}
      </p>

      <div className="flex items-center justify-between gap-2 mt-auto pt-5 border-t border-slate-100 relative z-10">
        {job.isLocked ? (
          <button 
            type="button"
            onClick={(e) => checkLoginAndExecute(e, () => navigate(`/jobs/${job._id}`), 'Unlock Premium')}
            className="flex-1 inline-flex justify-center items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 px-3 py-3 rounded-xl font-black hover:from-amber-300 hover:to-yellow-300 transition-all shadow-md shadow-amber-500/10 text-xs sm:text-sm cursor-pointer"
          >
            🔒 Unlock to Apply
          </button>
        ) : (
          <button 
            type="button"
            onClick={handleApplyClick}
            className="flex-1 inline-flex justify-center items-center gap-2 bg-indigo-600 text-white px-3 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 text-xs sm:text-sm cursor-pointer"
          >
            {job.applyEmail && !job.applyUrl ? '📧 Email Recruiter' : 'Apply Now'}
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
        <button 
          type="button"
          onClick={(e) => checkLoginAndExecute(e, () => onSave(job._id), 'Bookmark Job')}
          className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl border-2 transition-all ${
            isSaved 
              ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
              : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-400'
          }`}
          title={isSaved ? "Saved Bookmark" : "Bookmark Job"}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
        {onToggleApply && (
          <button 
            type="button"
            onClick={(e) => checkLoginAndExecute(e, () => onToggleApply(job._id), 'Record Application')}
            className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl border-2 transition-all text-sm sm:text-base font-black ${
              isApplied 
                ? 'bg-emerald-100 border-emerald-400 text-emerald-900 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-700'
            }`}
            title={isApplied ? "Unmark Applied" : "Mark as Applied"}
          >
            {isApplied ? "✅" : "☑️"}
          </button>
        )}
      </div>
      
      <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
          View
        </span>
      </div>
    </Link>
  );
};

export default JobCard;
