import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { MapPin, DollarSign, Briefcase, ExternalLink, Bookmark, Building, CheckSquare } from 'lucide-react';

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
      className="bg-white rounded-[20px] shadow-sm border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 relative group flex flex-col h-full"
    >
      {/* Top floating NEW Badge */}
      {job.createdAt && (new Date() - new Date(job.createdAt)) < 24 * 60 * 60 * 1000 && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md border-2 border-white relative">
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-100"></span>
            </span>
            ✨ NEW
          </span>
        </div>
      )}

      {/* Top row: Company Info & Plan Badge */}
      <div className="flex justify-between items-start mb-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl border border-indigo-100 shrink-0">
            {job.company.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-700 leading-none mb-1.5">{job.company}</div>
            {job.createdAt && (
              <div className="text-[11px] font-semibold text-slate-400">
                {new Date(job.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
        
        {job.planType === 'Premium' ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 shadow-sm border border-amber-300 uppercase tracking-wide">
            👑 Premium
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
            🟢 Basic
          </span>
        )}
      </div>

      {/* Title */}
      <div className="mb-4">
        <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
          {job.title}
        </h3>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold border border-slate-200">
          <MapPin className="w-3 h-3" />
          {job.location}
        </span>
        {job.isRemote && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-100">
            Remote
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-bold border border-amber-100">
          <DollarSign className="w-3 h-3" />
          {job.salary || 'Not disclosed'}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold border border-indigo-100">
          💼 {job.jobType || 'Full-time'}
        </span>
      </div>

      {/* Description */}
      <p className="text-[13px] text-slate-500 line-clamp-2 mb-5 flex-grow font-medium">
        {job.description || "No description provided. Click to view more details about this role."}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100 relative z-10">
        {job.isLocked ? (
          <button 
            type="button"
            onClick={(e) => checkLoginAndExecute(e, () => navigate(`/jobs/${job._id}`), 'Unlock Premium')}
            className="flex-1 inline-flex justify-center items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 px-3 py-2.5 rounded-xl font-bold hover:from-amber-300 hover:to-yellow-300 transition-all text-sm shadow-sm"
          >
            🔒 Unlock 
          </button>
        ) : (
          <button 
            type="button"
            onClick={handleApplyClick}
            className="flex-1 inline-flex justify-center items-center gap-1.5 bg-indigo-600 text-white px-3 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 text-sm"
          >
            {job.applyEmail && !job.applyUrl ? '📧 Email' : 'Apply Now'}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
        
        <button 
          type="button"
          onClick={(e) => checkLoginAndExecute(e, () => onSave(job._id), 'Bookmark Job')}
          className={`w-10 h-10 flex shrink-0 items-center justify-center rounded-xl border-2 transition-all ${
            isSaved 
              ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
          }`}
          title={isSaved ? "Saved Bookmark" : "Bookmark Job"}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
        
        {onToggleApply && (
          <button 
            type="button"
            onClick={(e) => checkLoginAndExecute(e, () => onToggleApply(job._id), 'Record Application')}
            className={`w-10 h-10 flex shrink-0 items-center justify-center rounded-xl border-2 transition-all ${
              isApplied 
                ? 'bg-emerald-100 border-emerald-400 text-emerald-600 shadow-sm' 
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
            }`}
            title={isApplied ? "Unmark Applied" : "Mark as Applied"}
          >
            <CheckSquare className={`w-4 h-4 ${isApplied ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
    </Link>
  );
};

export default JobCard;
