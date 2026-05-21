import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, User, BookOpen, Link2, CheckCircle, Save, LogOut, Camera, Bell, Lock, ShieldAlert, Award, Sparkles, X, Calendar, Clock, CheckSquare, Bookmark, FileCheck, ArrowRight } from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('internships');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCertificatePopup, setShowCertificatePopup] = useState(false);
  const [eligibleInternship, setEligibleInternship] = useState(null);
  const navigate = useNavigate();

  const getEndDate = (startDate, duration) => {
    if (!startDate) return 'Pending Start Date';
    const start = new Date(startDate);
    const months = parseInt(duration) || 1;
    start.setMonth(start.getMonth() + months);
    return start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    github: '',
    linkedin: '',
    portfolio: ''
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('studentToken');
        if (!token) {
          navigate('/student-login');
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/student/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setData(response.data);
        setProfileForm({
          github: response.data.user.github || '',
          linkedin: response.data.user.linkedin || '',
          portfolio: response.data.user.portfolio || '',
          profileImage: response.data.user.profileImage || ''
        });

        // Check for certificate eligibility to trigger popup automatically
        if (response.data.internships && response.data.internships.length > 0) {
          const eligible = response.data.internships.find(internship => {
            const totalTargetMonths = parseInt(internship.duration.split(' ')[0]) || 1;
            const submittedMonths = internship.submissions?.length || 0;
            return internship.hasPaid && submittedMonths >= totalTargetMonths;
          });
          if (eligible) {
            const hasSeen = sessionStorage.getItem('hasSeenCertificatePopup');
            if (!hasSeen) {
              setEligibleInternship(eligible);
              setShowCertificatePopup(true);
            }
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('studentToken');
          localStorage.removeItem('studentData');
          navigate('/student-login');
        } else {
          toast.error('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('studentToken');
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/student/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    navigate('/student-login');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    uploadData.append('folder', 'profiles');

    toast.info('Uploading image...', { autoClose: 2000 });
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: uploadData
      });
      const data = await res.json();
      if (data.secure_url) {
        setProfileForm(prev => ({ ...prev, profileImage: data.secure_url }));
        toast.success('Image uploaded! Click Save Profile to apply changes.');
      }
    } catch (err) {
      toast.error('Upload failed!');
    }
  };

  const handleMarkAlert = async (internshipId, alertId) => {
    try {
      const token = localStorage.getItem('studentToken');
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/student/mark-alert`, 
        { internshipId, alertId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Optimitically update UI
      setData(prev => {
        const newData = { ...prev };
        const iIndex = newData.internships.findIndex(i => i._id === internshipId);
        if (iIndex !== -1) {
          const aIndex = newData.internships[iIndex].alerts.findIndex(a => a._id === alertId);
          if (aIndex !== -1) {
             newData.internships[iIndex].alerts[aIndex].isRead = true;
          }
        }
        return newData;
      });
    } catch (err) {
      toast.error('Failed to dismiss alert');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  if (data?.isBlocked) {
    const blockedInternship = data.internships?.find(i => i.isBlocked);
    const reason = blockedInternship?.blockReason || 'Your dashboard access is temporarily locked due to a delayed project submission.';
    
    return (
      <div className="min-h-screen bg-black pt-20 px-4 sm:px-6 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-slate-900/30 opacity-80"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-xl w-full bg-slate-900/80 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-500/5 animate-pulse">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Dashboard Access <span className="text-red-500">Locked</span>
          </h2>
          
          <div className="bg-black/40 border-l-4 border-red-500 p-5 rounded-r-2xl text-left">
            <p className="text-red-200/90 text-sm font-medium leading-relaxed">
              {reason}
            </p>
          </div>
          
          <p className="text-slate-400 text-xs sm:text-sm">
            To restore full access to your student dashboard, please submit your pending project.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button
              onClick={() => navigate('/project-submission')}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/25 hover:shadow-red-500/30 flex items-center justify-center gap-2"
            >
              Submit Pending Project
            </button>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition-all border border-slate-700/50 flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
          
          <div className="border-t border-slate-800 pt-6 text-xs text-slate-500">
            Need help? Contact support at <a href="mailto:support@codenova.in" className="text-indigo-400 hover:underline">support@codenova.in</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-slate-900 to-black opacity-40"></div>
      
      <div className="max-w-6xl mx-auto relative z-10 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-800 overflow-hidden border-2 border-indigo-500 flex items-center justify-center">
                {profileForm.profileImage ? (
                  <img src={profileForm.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-500 transition-colors shadow-lg">
                <Camera size={16} className="text-white" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome, {data?.user?.name}</h1>
              <p className="text-gray-400 mt-2">Manage your internships and profile</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="mt-6 md:mt-0 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/20 rounded-lg flex items-center gap-2 transition-all font-medium"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('internships')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'internships' ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <BookOpen size={20} /> Internships
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'profile' ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <User size={20} /> Profile Details
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-xl max-w-3xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Link2 className="text-indigo-400" /> Professional Links
            </h2>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">GitHub URL</label>
                <input 
                  type="url" required value={profileForm.github} 
                  onChange={(e) => setProfileForm({...profileForm, github: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 font-medium">LinkedIn URL</label>
                <input 
                  type="url" required value={profileForm.linkedin} 
                  onChange={(e) => setProfileForm({...profileForm, linkedin: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Portfolio URL (Optional)</label>
                <input 
                  type="url" value={profileForm.portfolio} 
                  onChange={(e) => setProfileForm({...profileForm, portfolio: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white" 
                />
              </div>
              <button 
                type="submit" disabled={saving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Save Profile
              </button>
            </form>
          </div>
        )}

        {activeTab === 'internships' && (
          <div className="space-y-8">
            {data?.internships?.length === 0 ? (
              <p className="text-gray-400">No applications found.</p>
            ) : (
              data.internships.map((internship, index) => {
                const totalTargetMonths = parseInt(internship.duration.split(' ')[0]) || 1;
                const submittedMonths = internship.submissions.length;
                const paymentLinkOpen = (!internship.hasPaid && submittedMonths >= totalTargetMonths);
                
                return (
                  <div key={index} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-white">{internship.domain}</h3>
                        <p className="text-indigo-400 font-medium">Student ID: {internship.studentId}</p>
                      </div>
                      <div className="flex gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${internship.offerLetterStatus === 'Sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                          Offer Letter: {internship.offerLetterStatus}
                        </span>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${internship.hasPaid ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                          Payment: {internship.hasPaid ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Certificate Eligibility Banner */}
                    {isEligible && (
                      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/30 text-emerald-200 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 flex-shrink-0">
                            <Award className="w-8 h-8 animate-bounce" />
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <h4 className="text-xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                              🎉 Certification Eligibility Achieved! <Sparkles className="w-5 h-5 text-amber-400" />
                            </h4>
                            <p className="text-emerald-300/80 text-sm mt-1.5 leading-relaxed font-medium">
                              Congratulations! You have successfully completed all required project submissions ({submittedMonths}/{totalTargetMonths}) and your internship payment is fully verified. You are eligible for your official internship completion certificate.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setEligibleInternship(internship);
                              setShowCertificatePopup(true);
                            }}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 hover:shadow-emerald-500/30 flex items-center gap-2 text-sm whitespace-nowrap"
                          >
                            View Certificate Status <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Column (Col-7): Timeline & Checklist */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* Dynamic Deadline Alerts */}
                        {internship.activeAlert && (
                          <div className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all duration-300 relative overflow-hidden ${
                            internship.activeAlert.type === 'red'
                              ? 'bg-rose-950/20 border-rose-500/30 text-rose-200 shadow-md shadow-rose-900/5'
                              : internship.activeAlert.type === 'yellow'
                              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200 shadow-md shadow-amber-900/5'
                              : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200 shadow-md shadow-emerald-900/5'
                          }`}>
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${
                              internship.activeAlert.type === 'red' ? 'bg-rose-500' : internship.activeAlert.type === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}></div>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                              internship.activeAlert.type === 'red'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                : internship.activeAlert.type === 'yellow'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                              <ShieldAlert className={`w-5 h-5 ${internship.activeAlert.type === 'red' ? 'animate-pulse' : ''}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${
                                  internship.activeAlert.type === 'red'
                                    ? 'text-rose-400'
                                    : internship.activeAlert.type === 'yellow'
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}>
                                  {internship.activeAlert.type === 'red' ? 'Critical Action Required' : internship.activeAlert.type === 'yellow' ? 'Action Required' : 'Upcoming Deadline'}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                                <span className="text-[10px] text-slate-400 font-medium">Timeline Warning</span>
                              </div>
                              <p className="text-slate-300 text-sm font-medium mt-1 leading-relaxed">
                                {internship.activeAlert.message}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Alerts Dashboard */}
                        {internship.alerts && internship.alerts.filter(a => !a.isRead).length > 0 && (
                          <div className="space-y-3">
                            {internship.alerts.filter(a => !a.isRead).map(alert => (
                              <div key={alert._id} className="bg-red-950/40 border-l-4 border-red-500 p-4 rounded-r-lg flex justify-between items-center shadow-lg">
                                <div className="flex items-center gap-3">
                                  <Bell className="text-red-400" size={20} />
                                  <div>
                                    <p className="text-red-200 font-medium text-sm">{alert.message}</p>
                                    <p className="text-[11px] text-red-400 mt-1">{new Date(alert.date).toLocaleDateString()} {new Date(alert.date).toLocaleTimeString()}</p>
                                  </div>
                                </div>
                                <button onClick={() => handleMarkAlert(internship._id, alert._id)} className="text-xs px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-white rounded-lg transition-colors font-medium border border-red-700/30">
                                  Dismiss
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Project Checklist */}
                        <div>
                          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <CheckSquare className="text-indigo-400 w-5 h-5" /> Project Tracking Timeline
                          </h4>
                          <div className="space-y-4">
                            {Array.from({ length: totalTargetMonths }).map((_, i) => {
                              const monthNum = i + 1;
                              const sb = internship.submissions.find(s => s.month === monthNum);
                              return (
                                <div key={monthNum} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${sb ? 'bg-emerald-950/10 border-emerald-900/50 hover:border-emerald-500/30' : 'bg-gray-800/10 border-gray-800/80 hover:border-gray-700/50'}`}>
                                  {sb ? (
                                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5 flex-shrink-0">
                                      <CheckCircle className="w-4 h-4" />
                                    </div>
                                  ) : (
                                    <div className="w-7 h-7 rounded-full border border-slate-700 bg-slate-900/50 flex items-center justify-center text-slate-500 flex-shrink-0 font-bold text-xs">
                                      {monthNum}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-sm ${sb ? 'text-emerald-400' : 'text-slate-300'}`}>Month {monthNum} Internal Submission</p>
                                    {sb && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[11px] text-slate-500">Submitted on: {new Date(sb.submittedAt).toLocaleDateString()}</p>
                                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                        <p className="text-[11px] text-indigo-400 font-medium">{sb.assignmentsCount || 0} Assignments Tracked</p>
                                      </div>
                                    )}
                                    {!sb && monthNum === submittedMonths + 1 && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                                        <button onClick={() => navigate('/project-submission')} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline flex items-center gap-1">
                                          Ready for submission <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {paymentLinkOpen && (
                          <div className="p-6 bg-gradient-to-br from-orange-950/30 to-amber-950/20 border border-orange-500/20 rounded-2xl shadow-xl relative overflow-hidden">
                            <p className="text-orange-300 font-bold mb-3 text-base">🎉 All target projects are submitted! Final verification payment is unlocked.</p>
                            <p className="text-xs text-orange-400/80 mb-4 leading-relaxed">Please complete the required verification payment to unlock your certification status instantly.</p>
                            <button onClick={() => navigate('/project-submission')} className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-orange-600/20 hover:shadow-orange-500/30 flex items-center justify-center gap-2 mx-auto sm:mx-0">
                              Complete Payment & Final Validation
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right Column (Col-5): 8 Variables Grid */}
                      <div className="lg:col-span-5 bg-black/40 border border-gray-800/80 rounded-2xl p-6 shadow-xl space-y-6">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-gray-800/60">
                          <Sparkles className="text-indigo-400 w-5 h-5" /> Internship Status Overview
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* 1. Start Date */}
                          <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-xl hover:border-slate-700/50 hover:bg-slate-900/80 transition-all group duration-300">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Start Date</p>
                                <p className="text-slate-200 text-sm font-semibold mt-0.5 truncate">
                                  {internship.startDate ? new Date(internship.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending Start'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 2. End Date */}
                          <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-xl hover:border-slate-700/50 hover:bg-slate-900/80 transition-all group duration-300">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                <Clock className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">End Date</p>
                                <p className="text-slate-200 text-sm font-semibold mt-0.5 truncate">
                                  {getEndDate(internship.startDate, internship.duration)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 3. Duration */}
                          <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-xl hover:border-slate-700/50 hover:bg-slate-900/80 transition-all group duration-300">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                <Clock className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Duration</p>
                                <p className="text-slate-200 text-sm font-semibold mt-0.5 truncate">{internship.duration}</p>
                              </div>
                            </div>
                          </div>

                          {/* 4. Assignments Tracked */}
                          <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-xl hover:border-slate-700/50 hover:bg-slate-900/80 transition-all group duration-300">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Assignments</p>
                                <p className="text-slate-200 text-sm font-semibold mt-0.5 truncate">
                                  {internship.submissions.reduce((acc, curr) => acc + (curr.assignmentsCount || 0), 0)} Total
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 5. Projects Submitted */}
                          <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-xl hover:border-slate-700/50 hover:bg-slate-900/80 transition-all group duration-300">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                <FileCheck className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Projects</p>
                                <p className="text-slate-200 text-sm font-semibold mt-0.5 truncate">{submittedMonths} / {totalTargetMonths} Done</p>
                              </div>
                            </div>
                          </div>

                          {/* 6. Eligible for Certificate */}
                          <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-xl hover:border-slate-700/50 hover:bg-slate-900/80 transition-all group duration-300">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 ${isEligible ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                                <Award className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Certification</p>
                                <p className={`text-sm font-bold mt-0.5 truncate ${isEligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isEligible ? 'Eligible' : 'Ineligible'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 7. Offer Letter Status */}
                          <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-xl hover:border-slate-700/50 hover:bg-slate-900/80 transition-all group duration-300">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 ${internship.offerLetterStatus === 'Sent' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                                <Bookmark className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Offer Letter</p>
                                <p className={`text-sm font-semibold mt-0.5 truncate ${internship.offerLetterStatus === 'Sent' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {internship.offerLetterStatus}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 8. Internship Details */}
                          <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-xl hover:border-slate-700/50 hover:bg-slate-900/80 transition-all group duration-300 sm:col-span-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Internship Details</p>
                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                  <span className="text-slate-200 text-xs font-semibold truncate max-w-[120px]">{internship.domain}</span>
                                  <span className="text-indigo-400 text-xs font-bold font-mono">{internship.studentId}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Certificate Eligibility Success Modal */}
      {showCertificatePopup && eligibleInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => {
            sessionStorage.setItem('hasSeenCertificatePopup', 'true');
            setShowCertificatePopup(false);
          }}></div>
          
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative z-10 text-center space-y-6 animate-scale-up overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
            
            <button 
              onClick={() => {
                sessionStorage.setItem('hasSeenCertificatePopup', 'true');
                setShowCertificatePopup(false);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10 flex-shrink-0">
              <Award className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                Certification <span className="text-emerald-400">Eligible!</span>
              </h3>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Official Internship Completion</p>
            </div>
            
            <div className="bg-emerald-950/20 border border-emerald-500/15 p-5 rounded-2xl text-left space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
                <span className="text-[11px] font-bold text-emerald-500 uppercase">Internship Domain</span>
                <span className="text-white text-xs font-bold">{eligibleInternship.domain}</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
                <span className="text-[11px] font-bold text-emerald-500 uppercase">Student ID</span>
                <span className="text-indigo-400 text-xs font-mono font-bold">{eligibleInternship.studentId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
                <span className="text-[11px] font-bold text-emerald-500 uppercase">Start Date</span>
                <span className="text-white text-xs font-semibold">
                  {eligibleInternship.startDate ? new Date(eligibleInternship.startDate).toLocaleDateString('en-IN') : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-emerald-500 uppercase">End Date</span>
                <span className="text-white text-xs font-semibold">
                  {getEndDate(eligibleInternship.startDate, eligibleInternship.duration)}
                </span>
              </div>
            </div>
            
            <p className="text-slate-400 text-xs leading-relaxed">
              Your achievements are locked in and payment is verified. Your completion certificate has been generated and queued for dispatch!
            </p>
            
            <button
              onClick={() => {
                sessionStorage.setItem('hasSeenCertificatePopup', 'true');
                setShowCertificatePopup(false);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              Excellent, Thank you!
            </button>
          </div>
        </div>
      )}
      <ToastContainer position="bottom-right" theme="dark" autoClose={3000} />
    </div>
  );
};

export default StudentDashboard;
