import React, { useState } from 'react';
import { X, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import AmbassadorIdCard from './AmbassadorIdCard';
import axios from 'axios';

const AmbassadorIdCardModal = ({ stats, onClose, onSuccess }) => {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!linkedinUrl.includes('linkedin.com')) {
      setError("Please enter a valid LinkedIn URL");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      
      const token = localStorage.getItem("token") || localStorage.getItem("studentToken");
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
      const res = await axios.post(`${apiUrl}/api/student/ambassador-linkedin-post`, {
        linkedInUrl: linkedinUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        onSuccess(linkedinUrl);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save link. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            🎉 Welcome, Official Ambassador!
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Congratulations on becoming a Campus Lead for Code-A-Nova! We've generated your official Ambassador ID Card. 
            <strong> Please download it and share your new role on LinkedIn.</strong> Once you've posted it, paste the post link below to fully unlock your dashboard.
          </p>

          <div className="flex justify-center mb-8">
            <AmbassadorIdCard stats={stats} inline={true} />
          </div>

          <form onSubmit={handleSubmit} className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Verify Your LinkedIn Post
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                required
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/posts/..."
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={submitting || !linkedinUrl}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {submitting ? "Verifying..." : "Verify & Unlock"}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" />
              Make sure your post is public so we can verify it.
            </p>
          </form>
        </div>
        
      </div>
    </div>
  );
};

export default AmbassadorIdCardModal;
