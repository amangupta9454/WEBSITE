import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2, Save, ArrowLeft, User, Briefcase, Code, GraduationCap, Wrench, Trophy, Award, Plus, Trash2, ArrowUp, ArrowDown, ChevronLeft, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';
import { useDebounce } from 'react-use';

export default function MyProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    personalInfo: {},
    experience: [],
    education: [],
    skills: [],
    achievements: [],
    certifications: []
  });
  
  const [activeTab, setActiveTab] = useState('personalInfo');

  // OTP State
  const [originalPhone, setOriginalPhone] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/student/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = res.data?.user;
      if (userData) {
        let profileData = {
          personalInfo: userData.resumeData?.personalInfo || {},
          experience: userData.resumeData?.experience || [],
          projects: userData.resumeData?.projects || [],
          education: userData.resumeData?.education || [],
          skills: userData.resumeData?.skills || [],
          achievements: userData.resumeData?.achievements || [],
          certifications: userData.resumeData?.certifications || []
        };

        // Pre-fill missing data from internship application
        const latestInternship = userData.internships && userData.internships.length > 0 
          ? userData.internships[userData.internships.length - 1] 
          : {};

        profileData.personalInfo = {
          ...profileData.personalInfo,
          name: profileData.personalInfo.name || latestInternship.name || userData.name || "",
          email: profileData.personalInfo.email || latestInternship.email || userData.email || "",
          phone: profileData.personalInfo.phone || latestInternship.whatsapp || latestInternship.mobile || userData.phone || userData.mobile || "",
          github: profileData.personalInfo.github || latestInternship.github || userData.github || "",
          linkedin: profileData.personalInfo.linkedin || latestInternship.linkedin || userData.linkedin || "",
        };

        if (profileData.education.length === 0 && (latestInternship.college || latestInternship.course)) {
           profileData.education = [{
              id: Date.now().toString(),
              school: latestInternship.college || "",
              degree: latestInternship.course || "",
              field: latestInternship.branch || "",
              location: "",
              startDate: "",
              endDate: latestInternship.year || "",
              gpa: ""
           }];
        }
        
        // Auto-migrate legacy skills
        if (profileData.skills && !Array.isArray(profileData.skills)) {
          const oldSkills = profileData.skills;
          const newSkillsArray = [];
          if (oldSkills.languages && oldSkills.languages.length > 0) {
            newSkillsArray.push({ id: Date.now().toString() + '1', category: 'Languages', items: oldSkills.languages.join(', ') });
          }
          if (oldSkills.frameworks && oldSkills.frameworks.length > 0) {
            newSkillsArray.push({ id: Date.now().toString() + '2', category: 'Frameworks/Libraries', items: oldSkills.frameworks.join(', ') });
          }
          if (oldSkills.tools && oldSkills.tools.length > 0) {
            newSkillsArray.push({ id: Date.now().toString() + '3', category: 'Developer Tools', items: oldSkills.tools.join(', ') });
          }
          if (newSkillsArray.length === 0) {
            newSkillsArray.push({ id: Date.now().toString() + '4', category: 'Languages', items: '' });
          }
          profileData.skills = newSkillsArray;
        } else if (profileData.skills.length === 0) {
          profileData.skills = [{ id: Date.now().toString(), category: 'Languages', items: '' }];
        }
        if (profileData.personalInfo?.phone) {
          setOriginalPhone(profileData.personalInfo.phone);
          setIsPhoneVerified(true);
        } else {
          setIsPhoneVerified(false);
        }
        
        setData(profileData);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // 30s Auto Save
  useDebounce(
    () => {
      if (!loading) {
        saveProfile(true);
      }
    },
    30000,
    [data]
  );

  const saveProfile = async (isAuto = false) => {
    if (!isPhoneVerified) {
      if (!isAuto) toast.error("Please verify your new phone number before saving");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
      
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/student/profile`, {
        resumeData: data
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!isAuto) toast.success('Master Profile Saved Successfully!');
    } catch (err) {
      console.error(err);
      if (!isAuto) toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Data Manipulation Helpers
  const updatePersonalInfo = (field, value) => {
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    updatePersonalInfo('phone', val);
    if (val !== originalPhone) {
      setIsPhoneVerified(false);
    } else {
      setIsPhoneVerified(true);
    }
  };

  const handleSendOtp = async () => {
    const phone = data.personalInfo?.phone;
    if (!phone || phone.length !== 10) {
      toast.error("Please enter a valid 10-digit WhatsApp number");
      return;
    }
    setOtpSending(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/otp/send`, { phone });
      setOtpStep(true);
      toast.success("OTP sent to WhatsApp!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const phone = data.personalInfo?.phone;
    if (!otpValue || otpValue.length !== 3) {
      toast.error("Please enter a valid 3-digit OTP");
      return;
    }
    setOtpVerifying(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/otp/verify`, { phone, otp: otpValue });
      setIsPhoneVerified(true);
      setOriginalPhone(phone); // Update original phone so it stays verified
      setOtpStep(false);
      toast.success("Phone number verified successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpVerifying(false);
    }
  };

  const updateNested = (section, index, field, value) => {
    setData(prev => {
      const newArray = [...(prev[section] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [section]: newArray };
    });
  };

  const addItem = (section, defaultItem) => {
    setData(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), { ...defaultItem, id: Date.now().toString() }]
    }));
  };

  const removeItem = (section, index) => {
    setData(prev => {
      const newArray = [...(prev[section] || [])];
      newArray.splice(index, 1);
      return { ...prev, [section]: newArray };
    });
  };

  const moveItem = (section, index, direction) => {
    setData(prev => {
      const newArray = [...(prev[section] || [])];
      if (direction === 'up' && index > 0) {
        [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      } else if (direction === 'down' && index < newArray.length - 1) {
        [newArray[index + 1], newArray[index]] = [newArray[index], newArray[index + 1]];
      }
      return { ...prev, [section]: newArray };
    });
  };

  // updateSkills removed, using updateNested instead

  const TABS = [
    { id: 'personalInfo', label: 'Personal Info', icon: <User className="w-5 h-5" /> },
    { id: 'experience', label: 'Experience', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'projects', label: 'Projects', icon: <Code className="w-5 h-5" /> },
    { id: 'education', label: 'Education', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'skills', label: 'Skills', icon: <Wrench className="w-5 h-5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-5 h-5" /> },
    { id: 'certifications', label: 'Certifications', icon: <Award className="w-5 h-5" /> },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'personalInfo':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-3">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-slate-600 mb-1">First Name</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={data.personalInfo.firstName || ''} onChange={(e) => updatePersonalInfo('firstName', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1">Last Name</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={data.personalInfo.lastName || ''} onChange={(e) => updatePersonalInfo('lastName', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1">Job Title</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={data.personalInfo.jobTitle || ''} onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1">Email</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={data.personalInfo.email || ''} onChange={(e) => updatePersonalInfo('email', e.target.value)} /></div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                {isPhoneVerified ? (
                  <div className="flex items-center gap-3">
                    <input className="w-full px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl focus:outline-none transition-all" value={data.personalInfo.phone || ''} onChange={handlePhoneChange} />
                    <span className="flex items-center text-green-600 font-bold whitespace-nowrap bg-green-100 px-3 py-2.5 rounded-lg border border-green-200">
                      <CheckCircle size={20} className="mr-1" /> Verified
                    </span>
                  </div>
                ) : otpStep ? (
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      maxLength="3" 
                      value={otpValue} 
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-center tracking-widest font-bold" 
                      placeholder="3-digit OTP" 
                      autoFocus
                    />
                    <button 
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpVerifying || otpValue.length !== 3}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {otpVerifying ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setOtpStep(false); setOtpValue(""); }}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium underline whitespace-nowrap"
                    >
                      Change number
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" 
                      value={data.personalInfo.phone || ''} 
                      onChange={handlePhoneChange} 
                      maxLength="10"
                      placeholder="10-digit number"
                    />
                    <button 
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending || data.personalInfo?.phone?.length !== 10}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {otpSending ? "Sending..." : "Verify"}
                    </button>
                  </div>
                )}
              </div>

              <div><label className="block text-sm font-medium text-slate-600 mb-1">Location</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={data.personalInfo.location || ''} onChange={(e) => updatePersonalInfo('location', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1">LinkedIn URL</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={data.personalInfo.linkedin || ''} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1">GitHub URL</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={data.personalInfo.github || ''} onChange={(e) => updatePersonalInfo('github', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-600 mb-1">Portfolio / Website</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={data.personalInfo.portfolio || ''} onChange={(e) => updatePersonalInfo('portfolio', e.target.value)} /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Summary (Bio)</label>
              <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none h-32" value={data.personalInfo.summary || ''} onChange={(e) => updatePersonalInfo('summary', e.target.value)} />
            </div>
          </div>
        );
      case 'experience':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-2xl font-bold text-slate-800">Work Experience</h2>
              <button onClick={() => addItem('experience', { company: '', position: '', startDate: '', endDate: '', description: '' })} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"><Plus className="w-4 h-4"/> Add New</button>
            </div>
            {data.experience?.length === 0 && <p className="text-slate-400 italic">No experience added yet.</p>}
            {data.experience?.map((exp, idx) => (
              <div key={exp.id || idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveItem('experience', idx, 'up')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"><ArrowUp size={16} /></button>
                  <button onClick={() => moveItem('experience', idx, 'down')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"><ArrowDown size={16} /></button>
                  <button onClick={() => removeItem('experience', idx)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-md text-red-500"><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:pr-32 pr-0">
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={exp.company || ''} onChange={(e) => updateNested('experience', idx, 'company', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Position</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={exp.position || ''} onChange={(e) => updateNested('experience', idx, 'position', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Start Date</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={exp.startDate || ''} onChange={(e) => updateNested('experience', idx, 'startDate', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">End Date</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={exp.endDate || ''} onChange={(e) => updateNested('experience', idx, 'endDate', e.target.value)} /></div>
                </div>
                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description (Bullet points)</label><textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 h-24" value={exp.description || ''} onChange={(e) => updateNested('experience', idx, 'description', e.target.value)} /></div>
              </div>
            ))}
          </div>
        );
      case 'projects':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-2xl font-bold text-slate-800">Projects</h2>
              <button onClick={() => addItem('projects', { title: '', liveLink: '', githubLink: '', startDate: '', endDate: '', technologies: '', description: '' })} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"><Plus className="w-4 h-4"/> Add New</button>
            </div>
            {data.projects?.length === 0 && <p className="text-slate-400 italic">No projects added yet.</p>}
            {data.projects?.map((proj, idx) => (
              <div key={proj.id || idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveItem('projects', idx, 'up')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"><ArrowUp size={16} /></button>
                  <button onClick={() => moveItem('projects', idx, 'down')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"><ArrowDown size={16} /></button>
                  <button onClick={() => removeItem('projects', idx)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-md text-red-500"><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:pr-32 pr-0">
                  <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Project Title</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={proj.title || ''} onChange={(e) => updateNested('projects', idx, 'title', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Start Date</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={proj.startDate || ''} onChange={(e) => updateNested('projects', idx, 'startDate', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">End Date</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={proj.endDate || ''} onChange={(e) => updateNested('projects', idx, 'endDate', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Live Link</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={proj.liveLink || proj.link || ''} onChange={(e) => updateNested('projects', idx, 'liveLink', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">GitHub Link</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={proj.githubLink || ''} onChange={(e) => updateNested('projects', idx, 'githubLink', e.target.value)} /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Technologies Used</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={proj.technologies || ''} onChange={(e) => updateNested('projects', idx, 'technologies', e.target.value)} /></div>
                </div>
                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description (Bullet points)</label><textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 h-24" value={proj.description || ''} onChange={(e) => updateNested('projects', idx, 'description', e.target.value)} /></div>
              </div>
            ))}
          </div>
        );
      case 'education':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-2xl font-bold text-slate-800">Education</h2>
              <button onClick={() => addItem('education', { institution: '', degree: '', fieldOfStudy: '', location: '', startDate: '', endDate: '', score: '' })} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"><Plus className="w-4 h-4"/> Add New</button>
            </div>
            {data.education?.length === 0 && <p className="text-slate-400 italic">No education added yet.</p>}
            {data.education?.map((edu, idx) => (
              <div key={edu.id || idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveItem('education', idx, 'up')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"><ArrowUp size={16} /></button>
                  <button onClick={() => moveItem('education', idx, 'down')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"><ArrowDown size={16} /></button>
                  <button onClick={() => removeItem('education', idx)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-md text-red-500"><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:pr-32 pr-0">
                  <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Institution</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={edu.institution || ''} onChange={(e) => updateNested('education', idx, 'institution', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Degree</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={edu.degree || ''} onChange={(e) => updateNested('education', idx, 'degree', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Field of Study</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={edu.fieldOfStudy || ''} onChange={(e) => updateNested('education', idx, 'fieldOfStudy', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={edu.location || ''} onChange={(e) => updateNested('education', idx, 'location', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Score (GPA/%)</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={edu.score || ''} onChange={(e) => updateNested('education', idx, 'score', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Start Date</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={edu.startDate || ''} onChange={(e) => updateNested('education', idx, 'startDate', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">End Date</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={edu.endDate || ''} onChange={(e) => updateNested('education', idx, 'endDate', e.target.value)} /></div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'skills':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-2xl font-bold text-slate-800">Skills</h2>
              <button onClick={() => addItem('skills', { category: '', items: '' })} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"><Plus className="w-4 h-4"/> Add New</button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Add custom categories and enter skills separated by commas.</p>
            {data.skills?.length === 0 && <p className="text-slate-400 italic">No skills added yet.</p>}
            {data.skills?.map((skill, idx) => (
              <div key={skill.id || idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveItem('skills', idx, 'up')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"><ArrowUp className="w-4 h-4"/></button>
                  <button onClick={() => moveItem('skills', idx, 'down')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"><ArrowDown className="w-4 h-4"/></button>
                  <button onClick={() => removeItem('skills', idx)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-24">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Heading</label>
                    <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="e.g. Backend" value={skill.category || ''} onChange={(e) => updateNested('skills', idx, 'category', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Skills</label>
                    <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="e.g. Node.js, Express" value={skill.items || ''} onChange={(e) => updateNested('skills', idx, 'items', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'achievements':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-2xl font-bold text-slate-800">Achievements</h2>
              <button onClick={() => addItem('achievements', { title: '', date: '', description: '' })} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"><Plus className="w-4 h-4"/> Add New</button>
            </div>
            {data.achievements?.length === 0 && <p className="text-slate-400 italic">No achievements added yet.</p>}
            {data.achievements?.map((ach, idx) => (
              <div key={ach.id || idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveItem('achievements', idx, 'up')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"><ArrowUp size={16} /></button>
                  <button onClick={() => moveItem('achievements', idx, 'down')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"><ArrowDown size={16} /></button>
                  <button onClick={() => removeItem('achievements', idx)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-md text-red-500"><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:pr-32 pr-0">
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Title</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={ach.title || ''} onChange={(e) => updateNested('achievements', idx, 'title', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={ach.date || ''} onChange={(e) => updateNested('achievements', idx, 'date', e.target.value)} /></div>
                </div>
                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label><textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 h-20" value={ach.description || ''} onChange={(e) => updateNested('achievements', idx, 'description', e.target.value)} /></div>
              </div>
            ))}
          </div>
        );
      case 'certifications':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-2xl font-bold text-slate-800">Certifications</h2>
              <button onClick={() => addItem('certifications', { name: '', issuer: '', date: '', link: '' })} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"><Plus className="w-4 h-4"/> Add New</button>
            </div>
            {data.certifications?.length === 0 && <p className="text-slate-400 italic">No certifications added yet.</p>}
            {data.certifications?.map((cert, idx) => (
              <div key={cert.id || idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveItem('certifications', idx, 'up')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"><ArrowUp size={16} /></button>
                  <button onClick={() => moveItem('certifications', idx, 'down')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"><ArrowDown size={16} /></button>
                  <button onClick={() => removeItem('certifications', idx)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-md text-red-500"><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:pr-32 pr-0">
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Certification Name</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={cert.name || ''} onChange={(e) => updateNested('certifications', idx, 'name', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Issuer</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={cert.issuer || ''} onChange={(e) => updateNested('certifications', idx, 'issuer', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={cert.date || ''} onChange={(e) => updateNested('certifications', idx, 'date', e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Link</label><input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400" value={cert.link || ''} onChange={(e) => updateNested('certifications', idx, 'link', e.target.value)} /></div>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans pt-20 sm:pt-24 pb-16 relative overflow-x-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none rounded-b-[3rem]"></div>
      <div className="absolute top-20 right-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      
      {/* 
        Changes:
        1. max-w-7xl for full width but readable constraint
        2. Added smooth background aesthetics
      */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col relative z-10">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              Master Profile
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:ml-14 font-medium">
              Your central hub. Data added here automatically fills new resumes. Resumes sync back here seamlessly.
            </p>
          </div>
          <button
            onClick={() => saveProfile()}
            disabled={saving}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {saving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Save className="w-4 h-4 sm:w-5 sm:h-5" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Workspace Container */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 flex-grow mb-12">
          
          {/* Left Sidebar (Tabs) */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 sm:p-3 lg:sticky lg:top-24 z-20">
              <div className="flex flex-row lg:flex-col gap-1 sm:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold transition-all whitespace-nowrap lg:whitespace-normal text-left text-sm sm:text-base ${
                      activeTab === tab.id 
                        ? 'bg-blue-50 text-blue-700 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-10 min-h-[600px] z-10">
            {renderContent()}
          </div>

        </div>
      </div>
    </div>
  );
}
