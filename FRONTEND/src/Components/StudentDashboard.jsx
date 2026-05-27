import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, User, BookOpen, Link2, CheckCircle, Save, LogOut, Camera, Bell, Lock, ShieldAlert, Award, Sparkles, Briefcase, X, Calendar, Clock, CheckSquare, Bookmark, FileCheck, ArrowRight } from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('internships');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const token = localStorage.getItem('studentToken');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/student/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks();
    }
  }, [activeTab]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 px-4 sm:px-6 relative overflow-hidden font-sans">
      {/* Light Theme Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto relative z-10 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                {profileForm.profileImage ? (
                  <img src={profileForm.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-slate-300" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                <Camera size={16} className="text-white" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome, {data?.user?.name}</h1>
              <p className="text-slate-500 mt-1 font-medium text-sm">Manage your internships and profile</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="mt-6 md:mt-0 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm rounded-xl flex items-center gap-2 transition-all font-semibold text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('internships')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm border ${activeTab === 'internships' ? 'bg-white text-blue-600 border-blue-100 shadow-blue-500/5' : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200 hover:text-slate-700'}`}
          >
            <BookOpen size={18} /> Internships
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm border ${activeTab === 'profile' ? 'bg-white text-blue-600 border-blue-100 shadow-blue-500/5' : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200 hover:text-slate-700'}`}
          >
            <User size={18} /> Profile Details
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm border ${activeTab === 'tasks' ? 'bg-white text-blue-600 border-blue-100 shadow-blue-500/5' : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200 hover:text-slate-700'}`}
          >
            <Briefcase size={18} /> Active Tasks
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
              <Link2 className="text-blue-500" /> Professional Links
            </h2>
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-slate-700 mb-2 font-semibold text-sm">GitHub URL</label>
                <input 
                  type="url" required value={profileForm.github} 
                  onChange={(e) => setProfileForm({...profileForm, github: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2 font-semibold text-sm">LinkedIn URL</label>
                <input 
                  type="url" required value={profileForm.linkedin} 
                  onChange={(e) => setProfileForm({...profileForm, linkedin: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2 font-semibold text-sm">Portfolio URL (Optional)</label>
                <input 
                  type="url" value={profileForm.portfolio} 
                  onChange={(e) => setProfileForm({...profileForm, portfolio: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                />
              </div>
              <button 
                type="submit" disabled={saving}
                className="mt-6 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-70 text-sm"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Profile
              </button>
            </form>
          </div>
        )}
        {activeTab === 'tasks' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
              <Briefcase className="text-blue-500" /> Active Assignments
            </h2>
            {loadingTasks ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
            ) : tasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No tasks assigned to you right now.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {tasks.map(task => (
                  <div key={task._id} className="p-6 border border-slate-200 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group bg-slate-50">
                    <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">{task.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {task.deadline ? `Due: ${new Date(task.deadline).toLocaleDateString()}` : 'No Deadline'}
                      </span>
                      <Link to="/project" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">Submit Work &rarr;</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'internships' && (
          <div className="space-y-8">
            {data?.internships?.length === 0 ? (
              <p className="text-slate-500">No applications found.</p>
            ) : (
              data.internships.map((internship, index) => {
                const totalTargetMonths = parseInt(internship.duration.split(' ')[0]) || 1;
                const submittedMonths = internship.submissions.length;
                const paymentLinkOpen = (!internship.hasPaid && submittedMonths >= totalTargetMonths);
                const isEligible = internship.hasPaid && submittedMonths >= totalTargetMonths;
                
                return (
                  <div key={index} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900">{internship.domain}</h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">Student ID: <span className="text-blue-600 font-bold">{internship.studentId}</span></p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${internship.offerLetterStatus === 'Sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          Offer Letter: {internship.offerLetterStatus}
                        </span>
                        <span className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${internship.hasPaid ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          Payment: {internship.hasPaid ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {isEligible && (
                      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-900 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 flex-shrink-0">
                            <Award className="w-8 h-8 animate-bounce" />
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <h4 className="text-lg font-extrabold text-emerald-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                              🎉 Certification Eligibility Achieved!
                            </h4>
                            <p className="text-emerald-700 text-sm mt-1 leading-relaxed font-medium">
                              Congratulations! You have completed all submissions ({submittedMonths}/{totalTargetMonths}) and payment is verified.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setEligibleInternship(internship);
                              setShowCertificatePopup(true);
                            }}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 text-sm whitespace-nowrap"
                          >
                            View Status <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-7 space-y-6">
                        {internship.activeAlert && (
                          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 relative overflow-hidden ${
                            internship.activeAlert.type === 'red'
                              ? 'bg-rose-50 border-rose-200'
                              : internship.activeAlert.type === 'yellow'
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-emerald-50 border-emerald-200'
                          }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm border ${
                              internship.activeAlert.type === 'red' ? 'border-rose-100 text-rose-500' : internship.activeAlert.type === 'yellow' ? 'border-amber-100 text-amber-500' : 'border-emerald-100 text-emerald-500'
                            }`}>
                              <ShieldAlert className={`w-5 h-5 ${internship.activeAlert.type === 'red' ? 'animate-pulse' : ''}`} />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <span className={`text-xs font-extrabold uppercase tracking-wider ${
                                internship.activeAlert.type === 'red' ? 'text-rose-700' : internship.activeAlert.type === 'yellow' ? 'text-amber-700' : 'text-emerald-700'
                              }`}>
                                {internship.activeAlert.type === 'red' ? 'Critical Action Required' : internship.activeAlert.type === 'yellow' ? 'Action Required' : 'Timeline Info'}
                              </span>
                              <p className={`text-sm font-semibold mt-1 leading-relaxed ${
                                internship.activeAlert.type === 'red' ? 'text-rose-900' : internship.activeAlert.type === 'yellow' ? 'text-amber-900' : 'text-emerald-900'
                              }`}>
                                {internship.activeAlert.message}
                              </p>
                            </div>
                          </div>
                        )}

                        {internship.alerts && internship.alerts.filter(a => !a.isRead).length > 0 && (
                          <div className="space-y-3">
                            {internship.alerts.filter(a => !a.isRead).map(alert => (
                              <div key={alert._id} className="bg-red-50 border border-red-100 p-4 rounded-2xl flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="bg-white p-2 rounded-lg border border-red-100"><Bell className="text-red-500 w-4 h-4" /></div>
                                  <div>
                                    <p className="text-red-900 font-semibold text-sm">{alert.message}</p>
                                    <p className="text-[11px] text-red-500 font-medium mt-0.5">{new Date(alert.date).toLocaleString()}</p>
                                  </div>
                                </div>
                                <button onClick={() => handleMarkAlert(internship._id, alert._id)} className="text-xs px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 font-bold rounded-lg border border-red-200 transition-colors shadow-sm">
                                  Dismiss
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div>
                          <h4 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                            <CheckSquare className="text-blue-500 w-5 h-5" /> Project Tracking Timeline
                          </h4>
                          <div className="space-y-3">
                            {Array.from({ length: totalTargetMonths }).map((_, i) => {
                              const monthNum = i + 1;
                              const sb = internship.submissions.find(s => s.month === monthNum);
                              return (
                                <div key={monthNum} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${sb ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                                  {sb ? (
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
                                      <CheckCircle className="w-4 h-4" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0 font-bold text-xs shadow-sm">
                                      {monthNum}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-sm ${sb ? 'text-emerald-800' : 'text-slate-600'}`}>Month {monthNum} Submission</p>
                                    {sb && (
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-emerald-600 font-medium">Submitted {new Date(sb.submittedAt).toLocaleDateString()}</p>
                                      </div>
                                    )}
                                    {!sb && monthNum === submittedMonths + 1 && (
                                      <div className="mt-1.5 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                        <button onClick={() => navigate('/project-submission')} className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-1">
                                          Ready for submission <ArrowRight className="w-3 h-3" />
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
                          <div className="p-6 bg-orange-50 border border-orange-200 rounded-2xl relative overflow-hidden">
                            <p className="text-orange-900 font-bold text-sm mb-2">🎉 Target projects submitted! Verification unlocked.</p>
                            <p className="text-xs text-orange-700 font-medium mb-4">Complete the verification to instantly unlock your certification status.</p>
                            <button onClick={() => navigate('/project-submission')} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-colors">
                              Complete Verification
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-inner space-y-5">
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                          <Sparkles className="text-blue-500 w-4 h-4" /> Overview
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform"><Calendar className="w-4 h-4" /></div>
                              <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Start Date</p>
                                <p className="text-slate-900 text-sm font-bold truncate">{internship.startDate ? new Date(internship.startDate).toLocaleDateString('en-IN') : 'Pending'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-pink-200 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform"><Clock className="w-4 h-4" /></div>
                              <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">End Date</p>
                                <p className="text-slate-900 text-sm font-bold truncate">{getEndDate(internship.startDate, internship.duration)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-amber-200 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform"><Clock className="w-4 h-4" /></div>
                              <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Duration</p>
                                <p className="text-slate-900 text-sm font-bold truncate">{internship.duration}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-teal-200 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform"><FileCheck className="w-4 h-4" /></div>
                              <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Projects</p>
                                <p className="text-slate-900 text-sm font-bold truncate">{submittedMonths} / {totalTargetMonths} Done</p>
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

      {showCertificatePopup && eligibleInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => {
            sessionStorage.setItem('hasSeenCertificatePopup', 'true');
            setShowCertificatePopup(false);
          }}></div>
          
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 text-center space-y-6">
            <button 
              onClick={() => {
                sessionStorage.setItem('hasSeenCertificatePopup', 'true');
                setShowCertificatePopup(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-inner">
              <Award className="w-8 h-8 text-emerald-600 animate-bounce" />
            </div>
            
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Certification <span className="text-emerald-600">Eligible!</span>
              </h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-2">Official Completion</p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-500">Domain</span>
                <span className="text-slate-900 text-sm font-bold">{eligibleInternship.domain}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-500">Student ID</span>
                <span className="text-blue-600 text-sm font-bold font-mono">{eligibleInternship.studentId}</span>
              </div>
            </div>
            
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              Your achievements are locked in and payment is verified. Your completion certificate has been generated and queued for dispatch!
            </p>
            
            <button
              onClick={() => {
                sessionStorage.setItem('hasSeenCertificatePopup', 'true');
                setShowCertificatePopup(false);
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Excellent, Thank you!
            </button>
          </div>
        </div>
      )}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default StudentDashboard;
