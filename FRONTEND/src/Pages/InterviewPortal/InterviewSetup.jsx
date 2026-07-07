import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Eye, ShieldAlert, Video, Upload, FileText, X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const InterviewSetup = () => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobDescription: '',
    experienceYears: '',
    durationMinutes: 15,
    mode: 'Standard'
  });
  const [loading, setLoading] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [resume, setResume] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const cost = 2; // Fixed cost for 1 session
  
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('interviewToken');
    if(token) {
        axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/my-credits`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            if(res.data.success) {
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
    if (resumeError) {
      alert("Please fix resume errors before starting.");
      return;
    }

    const userStr = localStorage.getItem('interviewUser');
    const user = userStr ? JSON.parse(userStr) : null;

    await startInterviewSession();
  };

  const startInterviewSession = async () => {
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
        data.append('mode', formData.mode);
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
        if (formData.mode === 'Panel') {
          navigate(`/panel-interview-active/${res.data.session._id}`);
        } else {
          navigate(`/interview-active/${res.data.session._id}`);
        }
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col items-center justify-center px-4 pt-24 pb-12 sm:px-6 md:pt-32 font-sans overflow-x-hidden">
      {/* Decorative background elements matching Code-A-Nova */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none rounded-b-[3rem]"></div>
      <div className="absolute top-20 right-10 w-72 h-72 sm:w-96 sm:h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none hidden sm:block"></div>
      <div className="absolute top-40 left-10 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none hidden sm:block"></div>

      <div className="relative z-10 w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] shadow-xl shadow-indigo-100/50 border border-slate-200 p-5 sm:p-8 md:p-10 mt-4 sm:mt-0">
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Configure Interview</h2>
          <p className="text-slate-500 mt-1.5 sm:mt-2 text-xs sm:text-sm">Set up the parameters for your AI mock interview session.</p>
        </div>

        {/* Rules & Instructions Alert */}
        <div className="mb-6 sm:mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
          <h3 className="font-bold text-amber-800 mb-2.5 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
            <AlertCircle size={18} className="text-amber-600 shrink-0" /> Important Rules & Guidelines
          </h3>
          <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-amber-700">
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

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              required
              value={formData.jobTitle}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-2.5 sm:p-3 text-sm sm:text-base text-slate-700 transition-all outline-none"
              placeholder="e.g. Frontend Developer"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">Job Description</label>
            <textarea
              name="jobDescription"
              required
              rows={4}
              value={formData.jobDescription}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-2.5 sm:p-3 text-sm sm:text-base text-slate-700 transition-all outline-none resize-none"
              placeholder="Paste the key responsibilities or requirements here..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-700">Experience Required</label>
              <input
                type="text"
                name="experienceYears"
                required
                value={formData.experienceYears}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-2.5 sm:p-3 text-sm sm:text-base text-slate-700 transition-all outline-none"
                placeholder="e.g. 2 years"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-700">Duration (Minutes)</label>
              <input
                type="number"
                name="durationMinutes"
                required
                min="5"
                max="60"
                value={formData.durationMinutes}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-2.5 sm:p-3 text-sm sm:text-base text-slate-700 transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">Interview Mode</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({...formData, mode: 'Standard'})}
                className={`p-3 border rounded-xl text-left transition-all ${formData.mode === 'Standard' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
              >
                <h4 className="font-bold text-slate-800">Standard</h4>
                <p className="text-xs text-slate-500 mt-1">Single AI interviewer</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, mode: 'Panel'})}
                className={`p-3 border rounded-xl text-left transition-all ${formData.mode === 'Panel' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
              >
                <h4 className="font-bold text-slate-800">FAANG Panel</h4>
                <p className="text-xs text-slate-500 mt-1">Dual AI interviewers (HR + Tech)</p>
              </button>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">Resume (Optional)</label>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`relative flex justify-center px-4 pt-4 pb-5 sm:px-6 sm:pt-5 sm:pb-6 border-2 border-dashed rounded-xl transition-all ${
                resume ? 'border-indigo-400 bg-indigo-50' : 
                resumeError ? 'border-red-400 bg-red-50' : 
                'border-slate-300 hover:border-indigo-300 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-center w-full">
                {resume ? (
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 text-indigo-500 bg-indigo-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex items-center gap-2 text-indigo-700 font-bold max-w-full">
                      <span className="truncate max-w-[150px] sm:max-w-xs text-sm sm:text-base">{resume.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setResume(null)}
                        className="text-indigo-400 hover:text-indigo-600 focus:outline-none shrink-0"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-indigo-500 mt-1">Ready to be parsed by AI</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-slate-400 mb-2 sm:mb-3" />
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm text-slate-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a PDF file</span>
                        <input id="file-upload" name="file-upload" type="file" accept=".pdf,application/pdf" className="sr-only" onChange={handleFileChange} />
                      </label>
                      <p className="text-slate-500">or drag and drop</p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2">PDF up to 4MB</p>
                  </>
                )}
              </div>
            </div>
            {resumeError && (
              <p className="text-red-500 text-xs sm:text-sm font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle size={14} /> {resumeError}
              </p>
            )}
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 leading-relaxed">
              Uploading a resume helps the AI tailor the interview specifically to your background and prior projects.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-sm sm:text-base text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-indigo-600 text-white font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 shadow-indigo-600/30 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex items-center justify-center text-sm sm:text-base"
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
