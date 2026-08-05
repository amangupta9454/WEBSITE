import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2, Search, BrainCircuit, ExternalLink, Mail, Phone, Calendar } from 'lucide-react';

const QuizUsersAdmin = () => {
  const [quizApplicants, setQuizApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchQuizApplicants();
  }, []);

  const fetchQuizApplicants = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/quiz-applicants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizApplicants(res.data.applicants || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch quiz applicants');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplicants = quizApplicants.filter(app => {
    const q = searchQuery.toLowerCase();
    return (
      app.name?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.quizName?.toLowerCase().includes(q) ||
      app.domain?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600" />
            Imported Quiz Users
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            View all candidate data imported from Unstop for different quizzes.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, quiz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Domain / Course</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm">{app.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">{app.email}</span>
                        </div>
                        {app.mobile && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{app.mobile}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 w-fit">
                          {app.quizName}
                        </span>
                        {app.registrationId && (
                          <span className="text-xs text-slate-500 mt-1.5 font-mono">ID: {app.registrationId}</span>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                           <Calendar className="w-3 h-3 text-slate-400" />
                           <span className="text-[11px] text-slate-400">
                             {new Date(app.createdAt).toLocaleDateString()}
                           </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{app.domain || "N/A"}</span>
                        {app.course && <span className="text-xs text-slate-500 mt-0.5">{app.course}</span>}
                        {app.organisation && <span className="text-xs text-slate-400 mt-0.5">{app.organisation}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {app.resumeUrl && app.resumeUrl !== 'NA' && app.resumeUrl !== 'N/A' ? (
                        <a 
                          href={app.resumeUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Resume"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No Resume</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium">No quiz applicants found</p>
                      <p className="text-slate-400 text-sm mt-1">Try adjusting your search query or import new data.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuizUsersAdmin;
