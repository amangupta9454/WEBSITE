import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Trophy, FileCheck, Target, HeartHandshake, Loader2, Send, Upload, CheckCircle2, ChevronRight, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedSubmitButton } from './animations/AnimatedSubmitButton';

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
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const [waitlistData, setWaitlistData] = useState({ name: '', email: '' });
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/registration`);
        setRegistrationEnabled(res.data.registrationEnabled);
      } catch (err) {
        console.error('Failed to fetch registration status');
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/payment`);
        setPaymentEnabled(res.data.paymentEnabled);
      } catch (err) {
        console.error('Failed to fetch payment status');
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
      if (!paymentEnabled) {
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        data.append('resume', resume);
        const refCode = localStorage.getItem('referralCode');
        if (refCode) data.append('referralCode', refCode);

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
        setSubmitting(false);
        return;
      }

      // 1. Create Order
      const orderRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/register/create-order`,
        {
          email: formData.email,
          mobile: formData.whatsapp,
          domain: formData.domain,
          duration: formData.duration
        }
      );
      
      const { order, key } = orderRes.data;

      // 2. Initialize Razorpay
      const options = {
        key: key,
        amount: order.amount,
        currency: "INR",
        name: "CODE-A-NOVA",
        description: `Internship Registration - ${formData.duration}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            toast.info("Verifying payment... Please wait.");
            
            const submitData = new FormData();
            Object.keys(formData).forEach(k => submitData.append(k, formData[k]));
            submitData.append('resume', resume);
            submitData.append('razorpay_payment_id', response.razorpay_payment_id);
            submitData.append('razorpay_order_id', response.razorpay_order_id);
            submitData.append('razorpay_signature', response.razorpay_signature);
            const refCode = localStorage.getItem('referralCode');
            if (refCode) submitData.append('referralCode', refCode);

            const verifyRes = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/register/verify-payment`,
              submitData
            );
            
            toast.success(`Application submitted! Your Student ID: ${verifyRes.data.studentId}`, {
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
            setSubmitting(false);
          } catch (verifyErr) {
            toast.error(verifyErr.response?.data?.message || 'Payment verification failed. Please contact support.');
            setSubmitting(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.whatsapp
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: function() {
            setSubmitting(false);
            toast.error("Payment cancelled");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        setSubmitting(false);
        toast.error(response.error.description || 'Payment failed');
      });
      rzp.open();
      
    } catch (err) {
      setSubmitting(false);
      toast.error(err.response?.data?.message || 'Failed to initiate application. Please try again.');
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

  const inputClasses = "w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600 transition-colors appearance-none";

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 px-6 relative">
      <ToastContainer position="top-right" theme="light" />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">Internship Application</h1>
          <p className="text-gray-500 font-medium text-lg">Join our team to work on real-world projects and kickstart your career.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 md:p-12"
        >
          {checkingStatus ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
          ) : !registrationEnabled ? (
            <div className="text-center py-8">
              <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Send className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration is currently closed</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">Currently there are no openings, please fill this small form and we'll notify you via email when new openings arrive.</p>
              
              <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto space-y-4 text-left">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input required name="waitlistName" value={waitlistData.name} onChange={(e) => setWaitlistData({...waitlistData, name: e.target.value})} className={inputClasses} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input required type="email" name="waitlistEmail" value={waitlistData.email} onChange={(e) => setWaitlistData({...waitlistData, email: e.target.value})} className={inputClasses} placeholder="john@example.com" />
                </div>
                <button 
                  type="submit" 
                  disabled={waitlistSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/30 hover:-translate-y-0.5 disabled:opacity-50 mt-6"
                >
                  {waitlistSubmitting ? <><Loader2 className="animate-spin" size={18} /> Joining Waitlist...</> : <>Notify Me</>}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Personal Details */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Personal Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className={inputClasses} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} placeholder="john@example.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp Number *</label>
                  <input required name="whatsapp" pattern="[0-9]{10}" maxLength="10" value={formData.whatsapp} onChange={handleChange} className={inputClasses} placeholder="10-digit number" />
                </div>
              </div>
            </div>

            {/* Academic Details */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2 mt-8">Academic Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Course *</label>
                  <input required name="course" value={formData.course} onChange={handleChange} className={inputClasses} placeholder="B.Tech, BCA, etc." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Branch *</label>
                  <input required name="branch" value={formData.branch} onChange={handleChange} className={inputClasses} placeholder="CSE, IT, ECE" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">College Name *</label>
                  <input required name="college" value={formData.college} onChange={handleChange} className={inputClasses} placeholder="Full college name" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Passing Year *</label>
                  <input required name="passingYear" value={formData.passingYear} onChange={handleChange} className={inputClasses} placeholder="e.g., 2026" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">State *</label>
                  <select required name="state" value={formData.state} onChange={handleChange} className={inputClasses}>
                    <option value="" className="bg-white">Select state</option>
                    {states.map(s => <option key={s} value={s} className="bg-white">{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Program Selection */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2 mt-8">Program Selection</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Domain *</label>
                  <select required name="domain" value={formData.domain} onChange={handleChange} className={inputClasses}>
                    <option value="" className="bg-white">Select domain</option>
                    {domains.map(d => <option key={d} value={d} className="bg-white">{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Duration *</label>
                  <select required name="duration" value={formData.duration} onChange={handleChange} className={inputClasses}>
                    <option value="" className="bg-white">Select duration</option>
                    {durations.map(d => <option key={d} value={d} className="bg-white">{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Links & Resume */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2 mt-8">Links & Resume</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">GitHub URL *</label>
                  <input required name="github" value={formData.github} onChange={handleChange} className={inputClasses} placeholder="https://github.com/username" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">LinkedIn URL *</label>
                  <input required name="linkedin" value={formData.linkedin} onChange={handleChange} className={inputClasses} placeholder="https://linkedin.com/in/username" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Upload Resume (PDF) *</label>
                  <div className="relative group cursor-pointer">
                    <input 
                      id="resume-upload"
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      required 
                    />
                    <div className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors ${resume ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 group-hover:border-blue-400 group-hover:bg-blue-50/30'}`}>
                      <Upload className={`mx-auto mb-3 ${resume ? 'text-blue-500' : 'text-gray-400'}`} size={32} />
                      {resume ? (
                        <p className="text-blue-700 font-bold truncate px-4">{resume.name}</p>
                      ) : (
                        <div>
                          <p className="text-gray-600 font-bold mb-1">Click to upload or drag and drop</p>
                          <p className="text-gray-400 text-sm">PDF, DOC, DOCX (Max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {paymentEnabled && formData.duration && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8 flex items-center justify-between">
                <div>
                  <h4 className="text-blue-900 font-bold text-lg">Registration Fee</h4>
                  <p className="text-blue-700 text-sm">One-time payment for {formData.duration} internship</p>
                </div>
                <div className="text-3xl font-black text-blue-900">
                  ₹{formData.duration.includes('3') ? '399' : '199'}
                </div>
              </div>
            )}

            <AnimatedSubmitButton 
              type="submit" 
              isLoading={submitting}
              disabled={submitting}
              className="w-full h-14 mt-8"
            >
              <div className="flex h-full w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50">
                {submitting ? (
                  <><Loader2 className="animate-spin" size={20} /> Submitting Application...</>
                ) : (
                  <><Send size={20} /> {paymentEnabled ? `Pay ₹${formData.duration.includes('3') ? '399' : (formData.duration ? '199' : '')} & ` : ''}Submit Application</>
                )}
              </div>
            </AnimatedSubmitButton>
            
          </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Registration;
