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

  // handleApplyClick removed as we now only navigate to details

  return (
    <Link 
      to={`/jobs/${job._id}`}
      onClick={(e) => {
        const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
        if (!token) {
          e.preventDefault();
          handleUnauthenticated('View Job Details');
        }
      }}
      className="bg-white rounded-[20px] shadow-sm border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 relative group flex flex-col h-full"
    >
      {/* Top floating NEW Badge */}
      {job.createdAt && (new Date() - new Date(job.createdAt)) < 24 * 60 * 60 * 1000 && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
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
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200">
          <MapPin className="w-3.5 h-3.5" />
          {job.location}
        </span>
        {job.isRemote && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200">
            Remote
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200">
          <DollarSign className="w-3.5 h-3.5" />
          {job.salary || 'Not disclosed'}
        </span>
      </div>

      {/* Description */}
      <p className="text-[13px] text-slate-500 line-clamp-2 mb-5 flex-grow font-medium">
        {job.description || "No description provided. Click to view more details about this role."}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100 relative z-10">
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
            if (!token) {
              handleUnauthenticated('View Details');
            } else {
              navigate(`/jobs/${job._id}`);
            }
          }}
          className="flex-1 inline-flex justify-center items-center gap-1.5 bg-indigo-600 text-white px-3 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 text-sm"
        >
          View Details
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        
        <button 
          type="button"
          onClick={(e) => checkLoginAndExecute(e, () => onSave(job._id), 'Bookmark Job')}
          className={`w-10 h-10 flex shrink-0 items-center justify-center rounded-xl transition-all border ${
            isSaved 
              ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title={isSaved ? "Saved Bookmark" : "Bookmark Job"}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>
    </Link>
  );
};

export default JobCard;
