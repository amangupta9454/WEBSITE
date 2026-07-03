import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Eye, ShieldAlert, Video, Upload, FileText, X } from 'lucide-react';

const InterviewSetup = () => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobDescription: '',
    experienceYears: '',
    durationMinutes: 15
  });
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState(10);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [resume, setResume] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('interviewToken');
    if(token) {
        axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/my-credits`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            if(res.data.success) {
                setCost(res.data.interviewCost || 10);
                setIsUnlimited(res.data.isUnlimited || false);
            }
        }).catch(err => console.error(err));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are supported.');
      setResume(null);
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setResumeError('File size must be less than 4MB.');
      setResume(null);
      return;
    }
    setResumeError('');
    setResume(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (resumeError) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('interviewToken');
      let data = formData;
      let headers = { Authorization: `Bearer ${token}` };

      if (resume) {
        data = new FormData();
        data.append('jobTitle', formData.jobTitle);
        data.append('jobDescription', formData.jobDescription);
        data.append('experienceYears', formData.experienceYears);
        data.append('durationMinutes', formData.durationMinutes);
        data.append('resume', resume);
        // Let browser set Content-Type for FormData
      }

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/create`, data, {
        headers
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
        <div className="mb-6">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Configure Interview</h2>
          <p className="text-slate-500 mt-2 text-sm">Set up the parameters for your AI mock interview session.</p>
        </div>

        {/* Rules & Instructions Alert */}
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600" /> Important Rules & Guidelines
          </h3>
          <ul className="space-y-3 text-sm text-amber-700">
            <li className="flex items-start gap-2">
              <Video className="text-amber-500 shrink-0 mt-0.5" size={16} />
              <span><strong>Camera & Mic Required:</strong> Ensure your camera and microphone are properly working. You must grant browser permissions to start.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={16} />
              <span><strong>Tab Switching Restricted:</strong> Do not switch tabs or open other applications during the interview. This will generate a warning.</span>
            </li>
            <li className="flex items-start gap-2">
              <Eye className="text-amber-500 shrink-0 mt-0.5" size={16} />
              <span><strong>AI Proctoring Active:</strong> Your eye contact, face visibility, and attention span are monitored in real-time. Looking away frequently will negatively affect your score.</span>
            </li>
          </ul>
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
          
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">Resume (Optional)</label>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`relative flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all ${
                resume ? 'border-indigo-400 bg-indigo-50' : 
                resumeError ? 'border-red-400 bg-red-50' : 
                'border-slate-300 hover:border-indigo-300 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-center">
                {resume ? (
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 text-indigo-500 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                      <FileText size={24} />
                    </div>
                    <div className="flex items-center gap-2 text-indigo-700 font-bold">
                      <span className="truncate max-w-[200px] sm:max-w-xs">{resume.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setResume(null)}
                        className="text-indigo-400 hover:text-indigo-600 focus:outline-none"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-indigo-500 mt-1">Ready to be parsed by AI</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="mt-4 flex text-sm text-slate-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a PDF file</span>
                        <input id="file-upload" name="file-upload" type="file" accept=".pdf,application/pdf" className="sr-only" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">PDF up to 4MB</p>
                  </>
                )}
              </div>
            </div>
            {resumeError && (
              <p className="text-red-500 text-sm font-semibold mt-1 flex items-center gap-1">
                <AlertCircle size={14} /> {resumeError}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Uploading a resume helps the AI tailor the interview specifically to your background and prior projects.
            </p>
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
              ) : `Start Interview${isUnlimited ? '' : ` (${cost} Tokens)`}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewSetup;
