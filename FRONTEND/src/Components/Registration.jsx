import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, Send, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

const states = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand',
  'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya',
  'Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'
].sort();

const domains = [
  'Frontend Development','Backend Development','Full Stack Development',
  'C Programming','Python Development','Artificial Intelligence',
  'Figma or UI/UX','Data Science','Machine Learning',
  'App Development','Marketing'
];

const durations = ['1 Month', '2 Months', '3 Months'];

const Registration = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', whatsapp: '',
    course: '', branch: '', college: '', state: '', passingYear: '',
    domain: '', duration: '',
    github: '', linkedin: ''
  });
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [waitlistData, setWaitlistData] = useState({ name: '', email: '' });
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/registration`);
        setRegistrationEnabled(res.data.registrationEnabled);
      } catch (err) {
        console.error('Failed to fetch registration status');
      } finally {
        setCheckingStatus(false);
      }
    };
    fetchStatus();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) {
      toast.error('Please upload your resume');
      return;
    }
    setSubmitting(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('resume', resume);

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/register`,
        data
      );
      
      toast.success(`Application submitted! Your Student ID: ${res.data.studentId}`, {
        autoClose: 10000
      });
      
      setFormData({
        name:'',email:'',whatsapp:'',course:'',branch:'',
        college:'',state:'',passingYear:'',domain:'',duration:'',
        github:'',linkedin:''
      });
      setResume(null);
      const fileInput = document.getElementById('resume-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setWaitlistSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/register/waitlist`, waitlistData);
      toast.success(res.data.message, { autoClose: 8000 });
      setWaitlistData({ name: '', email: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-950 focus:outline-none focus:border-brand-emerald focus:bg-white transition-colors appearance-none font-sans font-medium placeholder:text-zinc-400";

  return (
    <div className="min-h-screen bg-[#F9FBF9] pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-brand-emerald/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-[500px] bg-brand-mint/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-zinc-950 tracking-tight">Internship Application</h1>
          <p className="text-zinc-500 font-medium text-lg max-w-xl mx-auto">Join our elite engineering team to work on production-level projects and accelerate your technical career.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-zinc-150 shadow-2xl rounded-3xl p-8 md:p-12 backdrop-blur-3xl"
        >
          {checkingStatus ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-brand-emerald" size={40} />
            </div>
          ) : !registrationEnabled ? (
            <div className="text-center py-8">
              <div className="mx-auto w-20 h-20 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mb-6 shadow-inner text-brand-amber animate-pulse">
                <Send className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-3">Registration is currently closed</h2>
              <p className="text-zinc-500 mb-8 max-w-md mx-auto">Currently there are no active openings, please join our priority notification queue to be alerted as soon as domain slots open.</p>
              
              <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto space-y-4 text-left">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
                  <input required name="waitlistName" value={waitlistData.name} onChange={(e) => setWaitlistData({...waitlistData, name: e.target.value})} className={inputClasses} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
                  <input required type="email" name="waitlistEmail" value={waitlistData.email} onChange={(e) => setWaitlistData({...waitlistData, email: e.target.value})} className={inputClasses} placeholder="john@example.com" />
                </div>
                <button 
                  type="submit" 
                  disabled={waitlistSubmitting}
                  className="w-full bg-zinc-950 hover:bg-brand-emerald text-white hover:text-zinc-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-zinc-950/15 hover:-translate-y-0.5 disabled:opacity-50 mt-6 cursor-pointer"
                >
                  {waitlistSubmitting ? <><Loader2 className="animate-spin animate-pulse" size={18} /> Joining Queue...</> : <>Notify Me</>}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Personal Details */}
              <div>
                <h3 className="text-xl font-bold text-zinc-950 mb-6 border-b border-zinc-150 pb-2">Personal Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name *</label>
                    <input required name="name" value={formData.name} onChange={handleChange} className={inputClasses} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Email Address *</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} placeholder="john@example.com" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-zinc-700 mb-2">WhatsApp Number *</label>
                    <input required name="whatsapp" pattern="[0-9]{10}" maxLength="10" value={formData.whatsapp} onChange={handleChange} className={inputClasses} placeholder="10-digit number" />
                  </div>
                </div>
              </div>
              
              {/* Academic Details */}
              <div>
                <h3 className="text-xl font-bold text-zinc-950 mb-6 border-b border-zinc-150 pb-2 mt-8">Academic Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Course *</label>
                    <input required name="course" value={formData.course} onChange={handleChange} className={inputClasses} placeholder="B.Tech, BCA, etc." />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Branch *</label>
                    <input required name="branch" value={formData.branch} onChange={handleChange} className={inputClasses} placeholder="CSE, IT, ECE" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-zinc-700 mb-2">College Name *</label>
                    <input required name="college" value={formData.college} onChange={handleChange} className={inputClasses} placeholder="Full college name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Passing Year *</label>
                    <input required name="passingYear" value={formData.passingYear} onChange={handleChange} className={inputClasses} placeholder="e.g., 2026" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">State *</label>
                    <select required name="state" value={formData.state} onChange={handleChange} className={`${inputClasses} cursor-pointer`}>
                      <option value="" className="text-zinc-400">Select state</option>
                      {states.map(s => <option key={s} value={s} className="text-zinc-900">{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Program Selection */}
              <div>
                <h3 className="text-xl font-bold text-zinc-950 mb-6 border-b border-zinc-150 pb-2 mt-8">Program Selection</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Preferred Domain *</label>
                    <select required name="domain" value={formData.domain} onChange={handleChange} className={`${inputClasses} cursor-pointer`}>
                      <option value="" className="text-zinc-400">Select domain</option>
                      {domains.map(d => <option key={d} value={d} className="text-zinc-900">{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Duration *</label>
                    <select required name="duration" value={formData.duration} onChange={handleChange} className={`${inputClasses} cursor-pointer`}>
                      <option value="" className="text-zinc-400">Select duration</option>
                      {durations.map(d => <option key={d} value={d} className="text-zinc-900">{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Links & Resume */}
              <div>
                <h3 className="text-xl font-bold text-zinc-950 mb-6 border-b border-zinc-150 pb-2 mt-8">Links & Resume</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">GitHub URL *</label>
                    <input required name="github" value={formData.github} onChange={handleChange} className={inputClasses} placeholder="https://github.com/username" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">LinkedIn URL *</label>
                    <input required name="linkedin" value={formData.linkedin} onChange={handleChange} className={inputClasses} placeholder="https://linkedin.com/in/username" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Upload Resume (PDF) *</label>
                    <div className="relative group cursor-pointer">
                      <input 
                        id="resume-upload"
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        onChange={handleFileChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        required 
                      />
                      <div className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors ${resume ? 'border-brand-emerald bg-emerald-50/50' : 'border-zinc-200 bg-zinc-50 group-hover:border-brand-emerald/40 group-hover:bg-emerald-50/20'}`}>
                        <Upload className={`mx-auto mb-3 ${resume ? 'text-brand-emerald' : 'text-zinc-450'}`} size={32} />
                        {resume ? (
                          <p className="text-brand-emerald font-bold truncate px-4">{resume.name}</p>
                        ) : (
                          <div>
                            <p className="text-zinc-700 font-bold mb-1">Click to upload or drag and drop</p>
                            <p className="text-zinc-400 text-sm font-medium">PDF, DOC, DOCX (Max 5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-zinc-950 hover:bg-brand-emerald text-white hover:text-zinc-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-zinc-950/10 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 mt-8 cursor-pointer"
              >
                {submitting ? <><Loader2 className="animate-spin animate-pulse" size={20} /> Submitting Application...</> : <><Send size={20} /> Submit Application</>}
              </button>
              
            </form>
          )}
        </motion.div>
      </div>
      <ToastContainer position="top-right" theme="light" />
    </div>
  );
};

export default Registration;
