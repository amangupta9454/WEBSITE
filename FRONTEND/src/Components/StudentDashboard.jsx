import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, User, BookOpen, Link2, CheckCircle, Save, LogOut, Camera, Bell, Lock, ShieldAlert } from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('internships');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

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

                    {/* Dynamic Deadline Alerts */}
                    {internship.activeAlert && (
                      <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3.5 transition-all duration-300 relative overflow-hidden ${
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
                      <div className="mb-6 space-y-3">
                        {internship.alerts.filter(a => !a.isRead).map(alert => (
                          <div key={alert._id} className="bg-red-950/40 border-l-4 border-red-500 p-4 rounded-r-lg flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <Bell className="text-red-400" size={20} />
                              <div>
                                <p className="text-red-200 font-medium">{alert.message}</p>
                                <p className="text-xs text-red-400 mt-1">{new Date(alert.date).toLocaleDateString()} {new Date(alert.date).toLocaleTimeString()}</p>
                              </div>
                            </div>
                            <button onClick={() => handleMarkAlert(internship._id, alert._id)} className="text-xs px-3 py-1 bg-red-900/50 hover:bg-red-800 text-white rounded transition-colors">
                              Dismiss
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-black/50 p-4 rounded-xl border border-gray-800">
                        <p className="text-gray-500 text-sm">Target Timeline</p>
                        <p className="text-white font-semibold text-lg">{internship.duration}</p>
                      </div>
                      <div className="bg-black/50 p-4 rounded-xl border border-gray-800">
                        <p className="text-gray-500 text-sm">Official Start Date</p>
                        <p className="text-white font-semibold text-lg">
                           {internship.startDate ? new Date(internship.startDate).toLocaleDateString('en-IN') : 'Pending Admin'}
                        </p>
                      </div>
                      <div className="bg-black/50 p-4 rounded-xl border border-gray-800">
                        <p className="text-gray-500 text-sm">Projects Submitted</p>
                        <p className="text-white font-semibold text-lg">{submittedMonths} / {totalTargetMonths}</p>
                      </div>
                      <div className="bg-black/50 p-4 rounded-xl border border-gray-800">
                        <p className="text-gray-500 text-sm">Total Assignments Tracked</p>
                        <p className="text-white font-semibold text-lg">
                          {internship.submissions.reduce((acc, curr) => acc + curr.assignmentsCount, 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-white mb-4">Project Tracking Timeline</h4>
                      <div className="space-y-4">
                        {Array.from({ length: totalTargetMonths }).map((_, i) => {
                          const monthNum = i + 1;
                          const sb = internship.submissions.find(s => s.month === monthNum);
                          return (
                            <div key={monthNum} className={`flex items-center gap-4 p-4 rounded-xl border ${sb ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-gray-800/30 border-gray-800'}`}>
                              {sb ? <CheckCircle className="text-emerald-500" /> : <div className="w-6 h-6 rounded-full border-2 border-gray-600" />}
                              <div>
                                <p className={`font-semibold ${sb ? 'text-emerald-400' : 'text-gray-400'}`}>Month {monthNum} Internal Submission</p>
                                {sb && <p className="text-xs text-gray-500">Submitted on: {new Date(sb.submittedAt).toLocaleDateString()}</p>}
                                {!sb && monthNum === submittedMonths + 1 && (
                                  <button onClick={() => navigate('/project-submission')} className="mt-2 text-sm text-indigo-400 hover:underline">
                                    Click here to submit
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {paymentLinkOpen && (
                      <div className="mt-6 p-6 bg-orange-950/20 border border-orange-900/50 rounded-xl text-center">
                        <p className="text-orange-400 font-semibold mb-3">All target projects are submitted. Final verification payment is unlocked.</p>
                        <button onClick={() => navigate('/project-submission')} className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-orange-900/50">
                          Complete Payment & Final Validation
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" theme="dark" autoClose={3000} />
    </div>
  );
};

export default StudentDashboard;
