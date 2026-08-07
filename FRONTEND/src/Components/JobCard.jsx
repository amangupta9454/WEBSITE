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
      className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group flex flex-col h-full overflow-hidden block"
    >
      {/* "New" Ribbon Stamp */}
      {job.createdAt && (new Date() - new Date(job.createdAt)) < 24 * 60 * 60 * 1000 && (
        <div className="absolute -top-1 -left-1 overflow-hidden w-28 h-28 rounded-tl-[24px] z-20 pointer-events-none">
          <div className="absolute top-6 -left-8 w-36 -rotate-45 bg-[#ff2a4d] text-white font-bold text-[11px] py-1 text-center tracking-widest shadow-sm">
            NEW
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4 relative z-10 pt-4">
        <div className="pr-2 flex-1">
          <h3 className="text-[22px] leading-tight font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-2">
            {job.title}
          </h3>
          
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="text-slate-500 font-medium flex items-center gap-2 text-[15px]">
              <Building className="w-4 h-4 text-slate-400" />
              {job.company}
            </div>
            {job.createdAt && (
              <div className="text-sm text-slate-400 flex items-center gap-2 ml-2">
                <div className="w-[1px] h-4 bg-slate-200"></div>
                Uploaded: {new Date(job.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 shrink-0 ml-4">
          {job.planType === 'Premium' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-[#ffbc00] text-amber-950 shadow-sm">
              👑 Premium Exclusive
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-emerald-100 text-emerald-800">
              🟢 Basic Free Role
            </span>
          )}
          {/* Placeholder Logo */}
          <div className="w-16 h-16 bg-[#f0f3ff] rounded-[18px] flex items-center justify-center text-[#5536ff] font-bold text-3xl shrink-0 group-hover:scale-105 transition-transform border border-[#e0e7ff]">
            {job.company.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2.5 mb-5 relative z-10 mt-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 rounded-xl text-sm font-semibold border border-slate-200">
          <MapPin className="w-4 h-4" />
          {job.location}
        </span>
        {job.isRemote && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 rounded-xl text-sm font-semibold border border-slate-200">
            Remote
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fffaf0] text-[#c27803] rounded-xl text-sm font-semibold border border-[#ffedd5]">
          <DollarSign className="w-4 h-4" />
          {job.salary || 'Not disclosed'}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f3ff] text-[#4f46e5] rounded-xl text-sm font-semibold border border-[#e0e7ff]">
          💼 {job.jobType || 'Full-time'}
        </span>
      </div>

      <p className="text-[15px] text-slate-500 line-clamp-2 mb-6 relative z-10 flex-grow leading-relaxed">
        {job.description || "No description provided. Click to view more details about this role."}
      </p>

      <div className="w-full h-[1px] bg-slate-100 mb-5 relative z-10"></div>

      <div className="flex items-center justify-between gap-3 relative z-10">
        {job.isLocked ? (
          <button 
            type="button"
            onClick={(e) => checkLoginAndExecute(e, () => navigate(`/jobs/${job._id}`), 'Unlock Premium')}
            className="flex-1 inline-flex justify-center items-center gap-2 bg-[#ffbc00] text-amber-950 px-4 py-3.5 rounded-2xl font-bold hover:bg-[#eab308] transition-colors shadow-sm text-[15px]"
          >
            🔒 Unlock to Apply
          </button>
        ) : (
          <button 
            type="button"
            onClick={handleApplyClick}
            className="flex-1 inline-flex justify-center items-center gap-2 bg-[#5536ff] text-white px-4 py-3.5 rounded-2xl font-bold hover:bg-[#4328e0] transition-colors shadow-sm text-[15px]"
          >
            {job.applyEmail && !job.applyUrl ? '📧 Email Recruiter' : 'Apply Now'}
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
        
        <button 
          type="button"
          onClick={(e) => checkLoginAndExecute(e, () => onSave(job._id), 'Bookmark Job')}
          className={`w-[52px] h-[52px] flex shrink-0 items-center justify-center rounded-[16px] border-2 transition-all ${
            isSaved 
              ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
          }`}
          title={isSaved ? "Saved Bookmark" : "Bookmark Job"}
        >
          <Bookmark className={`w-[22px] h-[22px] ${isSaved ? 'fill-current' : ''}`} />
        </button>
        
        {onToggleApply && (
          <button 
            type="button"
            onClick={(e) => checkLoginAndExecute(e, () => onToggleApply(job._id), 'Record Application')}
            className={`w-[52px] h-[52px] flex shrink-0 items-center justify-center rounded-[16px] border-2 transition-all ${
              isApplied 
                ? 'bg-emerald-100 border-emerald-400 text-emerald-900 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-700'
            }`}
            title={isApplied ? "Unmark Applied" : "Mark as Applied"}
          >
            <CheckSquare className={`w-[22px] h-[22px] ${isApplied ? 'fill-current' : 'fill-slate-500 stroke-white'}`} />
          </button>
        )}
      </div>
    </Link>
  );
};

export default JobCard;
