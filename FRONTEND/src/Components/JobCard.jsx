import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Briefcase, ExternalLink, Bookmark, Building } from 'lucide-react';

const JobCard = ({ job, onSave, isSaved }) => {
  return (
    <Link 
      to={`/jobs/${job._id}`}
      className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col h-full overflow-hidden block"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="pr-4">
          <h3 className="text-lg md:text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 line-clamp-2">
            {job.title}
          </h3>
          <p className="text-slate-500 font-medium flex items-center gap-1.5 text-sm">
            <Building className="w-4 h-4 text-slate-400" />
            {job.company}
          </p>
        </div>
        
        {/* Placeholder Logo */}
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center text-indigo-500 font-black text-2xl border border-indigo-100 shrink-0 shadow-sm group-hover:scale-110 transition-transform">
          {job.company.charAt(0)}
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
      </div>

      <p className="text-sm text-slate-500 line-clamp-3 mb-6 relative z-10 flex-grow">
        {job.description || "No description provided. Click to view more details about this role."}
      </p>

      <div className="flex items-center justify-between gap-3 mt-auto pt-5 border-t border-slate-100 relative z-10">
        <a 
          href={job.applyUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="flex-1 inline-flex justify-center items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
        >
          Apply Now
          <ExternalLink className="w-4 h-4" />
        </a>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSave(job._id);
          }}
          className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${
            isSaved 
              ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
              : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-400'
          }`}
          title={isSaved ? "Saved" : "Save Job"}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
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
