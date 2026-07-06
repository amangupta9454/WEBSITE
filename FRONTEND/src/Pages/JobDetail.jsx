import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import { MapPin, DollarSign, Briefcase, ExternalLink, ArrowLeft, Clock, Bookmark, Building, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/${id}`);
        if (res.data.success) {
          setJob(res.data.data);
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

    fetchJob();
    checkSaved();
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
          
          // Check if the line looks like a heading:
          // Short length, no trailing period (or ends with a colon), and doesn't start with a typical bullet character
          const isHeading = 
            trimmed.length < 60 && 
            (!trimmed.endsWith('.') || trimmed.endsWith(':')) &&
            !trimmed.startsWith('-') &&
            !trimmed.startsWith('•') &&
            !trimmed.startsWith('*');

          // Check if it looks like a bullet point (starts with -, •, *, or is part of a list)
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
          
          <Link to="/jobs" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>

          {/* Header Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl md:text-3xl border border-indigo-200 shadow-sm shrink-0 mt-1">
                  {job.company.charAt(0)}
                </div>
                <div>
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
                  className={`flex-1 md:flex-none flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl border-2 transition-all ${
                    isSaved 
                      ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-400'
                  }`}
                  title={isSaved ? "Saved" : "Save Job"}
                >
                  <Bookmark className={`w-5 h-5 md:w-6 md:h-6 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <a 
                  href={job.applyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-600/20 hover:-translate-y-1 text-sm md:text-base"
                >
                  Apply Now
                  <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                </a>
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
                {job.jobType}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 text-slate-500 rounded-xl text-xs md:text-sm font-semibold border border-slate-200">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                Posted {new Date(job.postedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              Job Description
            </h2>
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
              Code-A-Nova is a platform for finding tech jobs. We do not guarantee employment. Always verify the company details before sharing personal information.
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default JobDetail;
