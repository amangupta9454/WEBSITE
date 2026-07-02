import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const InterviewSetup = () => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobDescription: '',
    experienceYears: '',
    durationMinutes: 15
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('interviewToken');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5004'}/api/interview-session/create`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        // Update user credits locally
        const userStr = localStorage.getItem('interviewUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.credits = res.data.creditsRemaining;
          localStorage.setItem('interviewUser', JSON.stringify(user));
        }

        // Navigate to active interview
        navigate(`/interview-active/${res.data.session._id}`);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4 pt-28 pb-16 font-sans">
      {/* Decorative background elements matching Code-A-Nova */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none rounded-b-[3rem]"></div>
      <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute top-40 left-10 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl w-full bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-slate-200 p-8 sm:p-10">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Configure Interview</h2>
          <p className="text-slate-500 mt-2 text-sm">Set up the parameters for your AI mock interview session.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              required
              value={formData.jobTitle}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 text-slate-700 transition-all outline-none"
              placeholder="e.g. Frontend Developer"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">Job Description</label>
            <textarea
              name="jobDescription"
              required
              rows={4}
              value={formData.jobDescription}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 text-slate-700 transition-all outline-none resize-none"
              placeholder="Paste the key responsibilities or requirements here..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Experience Required</label>
              <input
                type="text"
                name="experienceYears"
                required
                value={formData.experienceYears}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 text-slate-700 transition-all outline-none"
                placeholder="e.g. 2 years"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Duration (Minutes)</label>
              <input
                type="number"
                name="durationMinutes"
                required
                min="5"
                max="60"
                value={formData.durationMinutes}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 text-slate-700 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 shadow-indigo-600/30 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Starting...
                </div>
              ) : 'Start Interview (10 Credit)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewSetup;
