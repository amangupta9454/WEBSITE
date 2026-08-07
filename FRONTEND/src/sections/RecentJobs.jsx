import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../Components/JobCard';
import { fadeUp, staggerContainer } from '../animations/variants';

const RecentJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs`);
        // Filter out closed jobs and sort by newest
        const activeJobs = res.data.filter(j => j.status === 'Open').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        // Take top 6
        setJobs(activeJobs.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch recent jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) return null;
  if (jobs.length === 0) return null;

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-indigo-700 font-bold tracking-wide uppercase">New Opportunities</span>
          </motion.div>
          
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
          >
            Recent Premium Internships
          </motion.h2>
          
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
          >
            Launch your career with our exclusive roles. Apply directly or unlock premium features to fast-track your applications.
          </motion.p>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {jobs.map((job) => (
            <motion.div key={job._id} variants={fadeUp} className="h-full">
              <JobCard 
                job={job} 
                isSaved={false} 
                isApplied={false} 
                onSave={() => {}} 
                onToggleApply={null}
              />
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center"
        >
          <button
            onClick={() => {
              sessionStorage.setItem('redirectAfterLogin', '/jobs');
              navigate('/student-login');
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-1"
          >
            View All Jobs <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default RecentJobs;
