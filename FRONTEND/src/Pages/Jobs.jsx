import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import JobCard from '../Components/JobCard';
import { Search, MapPin, Filter, Briefcase, Bookmark } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobObjects, setSavedJobObjects] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 12,
        ...(role && { role }),
        ...(location && { location }),
        ...(remote && { remote: 'true' })
      });

      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs?${queryParams}`);
      if (res.data.success) {
        setJobs(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSavedJobs(res.data.data.map(sj => sj.job._id));
        setSavedJobObjects(res.data.data.map(sj => sj.job));
      }
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const toggleSaveJob = async (jobId) => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) {
      toast.error('Please login to save jobs');
      return;
    }

    try {
      const isSaved = savedJobs.includes(jobId);
      if (isSaved) {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/save/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedJobs(prev => prev.filter(id => id !== jobId));
        setSavedJobObjects(prev => prev.filter(j => j && j._id !== jobId));
        toast.success('Job removed from saved list');
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/save/${jobId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedJobs(prev => [...prev, jobId]);
        const jobToAdd = jobs.find(j => j._id === jobId);
        if (jobToAdd) {
          setSavedJobObjects(prev => [...prev, jobToAdd]);
        }
        toast.success('Job saved successfully');
      }
    } catch (error) {
      console.error('Failed to toggle save job:', error);
      toast.error('Operation failed');
    }
  };

  const filteredSavedJobs = React.useMemo(() => {
    return savedJobObjects.filter(job => {
      if (!job) return false;
      const matchRole = job.title?.toLowerCase().includes(role.toLowerCase()) || job.company?.toLowerCase().includes(role.toLowerCase());
      const matchLocation = job.location?.toLowerCase().includes(location.toLowerCase());
      const matchRemote = remote ? job.isRemote : true;
      return matchRole && matchLocation && matchRemote;
    });
  }, [savedJobObjects, role, location, remote]);

  return (
    <MainLayout>
      <div className="bg-[#FAFAFA] min-h-screen pt-16 pb-24">
        
        {/* Premium Hero Section */}
        <div className="bg-white border-b border-slate-200 py-12 md:py-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[100px] -mr-96 -mt-96 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[100px] -ml-64 -mb-64 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest mb-6">
                  <Briefcase className="w-4 h-4" /> Code-A-Nova Jobs
                </div>
                <h1 className="font-black mb-4 leading-none md:leading-tight text-slate-900">
                  <span className="block md:inline text-2xl sm:text-4xl md:text-5xl">Find Your Next</span>
                  <span className="hidden md:inline"> </span>
                  <span className="block md:inline text-4xl sm:text-5xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 -mt-1 md:mt-0">
                    Tech Job
                  </span>
                </h1>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                  Browse the latest job openings, updated daily. Filter by role, location, and apply directly to top tech companies around the world.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <Search className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800">Smart Search</span>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">Remote Options</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-blue-800">Verified Roles</span>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                  <div className="flex-1 flex items-center bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Job title, keywords..." 
                      className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400 font-medium text-sm"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="bg-gradient-to-r from-brand-purple to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-brand-purple/20 flex items-center justify-center shrink-0">
                    Search Jobs
                  </button>
                </form>
              </div>

              {/* Job Stats Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 w-full md:w-80 shrink-0 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="font-bold text-slate-500 text-xs md:text-sm uppercase tracking-wider">Your Dashboard</h3>
                  <div className="bg-indigo-50 text-indigo-700 px-2 py-0.5 md:px-3 md:py-1 rounded-lg font-black text-base md:text-lg border border-indigo-100">
                    {savedJobs.length} <span className="text-[9px] md:text-[10px] font-bold uppercase">Saved</span>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                  <div className="flex justify-between text-xs md:text-sm items-center">
                    <span className="text-slate-600 font-medium">Remote Roles:</span>
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 md:px-2 rounded text-[10px] md:text-xs">AVAILABLE</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm items-center">
                    <span className="text-slate-600 font-medium">Daily Updates:</span>
                    <span className="text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 md:px-2 rounded text-[10px] md:text-xs">ACTIVE</span>
                  </div>
                  <div className="w-full h-px bg-slate-100 my-2"></div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <MapPin className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                      <input 
                        type="text" 
                        placeholder="Location filter..." 
                        className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400 font-medium text-xs"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10 mt-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
              {showSaved ? (
                <><Bookmark className="w-7 h-7 text-indigo-600 fill-indigo-100" /> Saved Jobs</>
              ) : (
                <><Briefcase className="w-7 h-7 text-indigo-600" /> Latest Openings</>
              )}
            </h2>
            
            <div className="flex items-center gap-3 md:gap-4">
              <button 
                onClick={() => setShowSaved(!showSaved)} 
                className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 md:px-5 md:py-2.5 rounded-2xl font-bold text-sm md:text-base border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm"
              >
                {showSaved ? (
                  <><Briefcase className="w-4 h-4 md:w-5 md:h-5" /><span className="hidden sm:inline">Latest Openings</span></>
                ) : (
                  <><Bookmark className="w-4 h-4 md:w-5 md:h-5" /><span className="hidden sm:inline">Saved Jobs</span></>
                )}
              </button>
              
              <label className="flex items-center gap-3 cursor-pointer select-none bg-white px-4 py-2 md:px-5 md:py-2.5 rounded-2xl border border-slate-200 shadow-sm hover:shadow hover:border-indigo-200 transition-all group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={remote}
                    onChange={(e) => setRemote(e.target.checked)}
                  />
                  <div className={`block w-11 h-6 md:w-12 md:h-7 rounded-full transition-colors duration-300 ease-in-out ${remote ? 'bg-indigo-600' : 'bg-slate-200 group-hover:bg-slate-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 md:w-5 md:h-5 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${remote ? 'translate-x-5 md:translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className={`font-bold text-sm md:text-base transition-colors duration-300 ${remote ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-800'}`}>
                  Remote Only
                </span>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-72 animate-pulse p-6 border border-slate-100">
                   <div className="w-2/3 h-6 bg-slate-200 rounded mb-2"></div>
                   <div className="w-1/3 h-4 bg-slate-200 rounded mb-6"></div>
                   <div className="flex gap-2 mb-6">
                     <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                     <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                   </div>
                   <div className="w-full h-16 bg-slate-100 rounded mb-6"></div>
                   <div className="flex gap-4">
                     <div className="flex-1 h-10 bg-slate-200 rounded-xl"></div>
                     <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                   </div>
                </div>
              ))}
            </div>
          ) : showSaved ? (
            filteredSavedJobs.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {filteredSavedJobs.map((job) => (
                  <JobCard 
                    key={job._id} 
                    job={job} 
                    isSaved={true}
                    onSave={toggleSaveJob}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm mt-8 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bookmark className="w-8 h-8 text-indigo-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No saved jobs found</h3>
                <p className="text-slate-500 mb-8">
                  {savedJobs.length > 0 
                    ? "We couldn't find any saved jobs matching your current search filters. Try adjusting your filters." 
                    : "You haven't bookmarked any jobs. Browse the job board and save opportunities you're interested in."}
                </p>
                <button 
                  onClick={() => setShowSaved(false)}
                  className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors inline-block"
                >
                  Browse Jobs
                </button>
              </div>
            )
          ) : jobs.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {jobs.map((job) => (
                  <JobCard 
                    key={job._id} 
                    job={job} 
                    isSaved={savedJobs.includes(job._id)}
                    onSave={toggleSaveJob}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-medium disabled:opacity-50 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <span className="text-slate-600 font-medium px-4">
                    Page {page} of {totalPages}
                  </span>
                  <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-medium disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm mt-8">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Filter className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No jobs found</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                We couldn't find any jobs matching your current search filters. Try adjusting your search or checking back later.
              </p>
              <button 
                onClick={() => { setRole(''); setLocation(''); setRemote(false); setPage(1); fetchJobs(); }}
                className="bg-indigo-50 text-indigo-700 font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Jobs;
