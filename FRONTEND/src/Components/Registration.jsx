import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SEO from './SEO';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Trophy, FileCheck, Target, HeartHandshake, Loader2, Send, Upload, CheckCircle2, ChevronRight, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatedSubmitButton } from './animations/AnimatedSubmitButton';

import { countryStatesData, countriesList } from '../data/countryStates';

const domains = [
  'Frontend Development', 'Backend Development', 'Full Stack Development',
  'C Programming', 'Python Development', 'Artificial Intelligence',
  'Figma or UI/UX', 'Data Science', 'Machine Learning',
  'App Development', 'Marketing', 'Video Editor', 'Graphic Designer'
];

const durations = ['1 Month', '2 Months', '3 Months'];

const Registration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isDomainLocked, setIsDomainLocked] = useState(false);
  const [referralCode, setReferralCode] = useState(null);
  
  const [successData, setSuccessData] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', whatsapp: '',
    course: '', branch: '', college: '', country: 'India', state: '', passingYear: '',
    domain: '', duration: '',
    github: '', linkedin: '', portfolio: ''
  });
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  const [waitlistData, setWaitlistData] = useState({ name: '', email: '' });
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  useEffect(() => {
    // Check URL parameters for pre-selected domain and referral tracker
    const urlDomain = searchParams.get('domain');
    const urlRef = searchParams.get('ref');
    
    if (urlRef) {
      setReferralCode(urlRef);
      localStorage.setItem('referralCode', urlRef);
    }

    if (urlDomain) {
      // Find a case-insensitive match for the domain in the allowed list
      const matchedDomain = domains.find(d => d.toLowerCase() === urlDomain.toLowerCase());
      if (matchedDomain) {
        setFormData(prev => ({ ...prev, domain: matchedDomain }));
        setIsDomainLocked(true);
      }
    }

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

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    setFormData(prev => ({
      ...prev,
      country: selectedCountry,
      state: '' // Reset state when country changes
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF format is allowed for resume');
        e.target.value = '';
        return;
      }
      setResume(file);
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

        if (res.data.requiresOtp) {
          setSuccessData({
            studentId: res.data.studentId,
            email: res.data.email,
            requiresOtp: true,
            user: res.data.user
          });
          setSubmitting(false);
          return;
        } else if (res.data.token && res.data.user) {
          setSuccessData({
            studentId: res.data.studentId,
            token: res.data.token,
            user: res.data.user
          });
          setSubmitting(false);
          return;
        } else {
          toast.success(`Application submitted! Your Student ID: ${res.data.studentId}`, { autoClose: 10000 });
        }

        setFormData({
          name: '', email: '', whatsapp: '', course: '', branch: '',
          college: '', country: 'India', state: '', passingYear: '', domain: '', duration: '',
          github: '', linkedin: '', portfolio: ''
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

            if (verifyRes.data.requiresOtp) {
              setSuccessData({
                studentId: verifyRes.data.studentId,
                email: verifyRes.data.email,
                requiresOtp: true,
                user: verifyRes.data.user
              });
              setSubmitting(false);
              return;
            } else if (verifyRes.data.token && verifyRes.data.user) {
              setSuccessData({
                studentId: verifyRes.data.studentId,
                token: verifyRes.data.token,
                user: verifyRes.data.user
              });
              setSubmitting(false);
              return;
            } else {
              toast.success(`Application submitted! Your Student ID: ${verifyRes.data.studentId}`, { autoClose: 10000 });
            }

            setFormData({
              name: '', email: '', whatsapp: '', course: '', branch: '',
              college: '', country: 'India', state: '', passingYear: '', domain: '', duration: '',
              github: '', linkedin: '', portfolio: ''
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
          ondismiss: function () {
            setSubmitting(false);
            toast.error("Payment cancelled");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
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
      <SEO 
        title="Register | Code-A-Nova"
        description="Register with Code-A-Nova for internships, programs and technology opportunities."
        canonicalUrl="https://code-a-nova.online/registration"
      />
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
                  <input required name="waitlistName" value={waitlistData.name} onChange={(e) => setWaitlistData({ ...waitlistData, name: e.target.value })} className={inputClasses} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input required type="email" name="waitlistEmail" value={waitlistData.email} onChange={(e) => setWaitlistData({ ...waitlistData, email: e.target.value })} className={inputClasses} placeholder="john@example.com" />
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
                    <label className="block text-sm font-bold text-gray-700 mb-2">Country *</label>
                    <select required name="country" value={formData.country} onChange={handleCountryChange} className={inputClasses}>
                      {countriesList.map(c => <option key={c} value={c} className="bg-white">{c}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">State / Province *</label>
                    {countryStatesData[formData.country] && countryStatesData[formData.country].length > 0 ? (
                      <select required name="state" value={formData.state} onChange={handleChange} className={inputClasses}>
                        <option value="" className="bg-white">Select state / province</option>
                        {countryStatesData[formData.country].map(s => <option key={s} value={s} className="bg-white">{s}</option>)}
                      </select>
                    ) : (
                      <input required name="state" value={formData.state} onChange={handleChange} className={inputClasses} placeholder="Enter your state or province name" />
                    )}
                  </div>
                </div>
              </div>

              {/* Program Selection */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2 mt-8">Program Selection</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Internship Domain <span className="text-rose-500">*</span></span>
                      {isDomainLocked && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1">🔒 Locked by Link</span>}
                    </label>
                    <select required name="domain" value={formData.domain} onChange={handleChange} disabled={isDomainLocked} className={`${inputClasses} ${isDomainLocked ? 'bg-slate-100 cursor-not-allowed opacity-90' : ''}`}>
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
                  {formData.domain === 'Video Editing' || formData.domain === 'Video Editor' || formData.domain === 'Graphic Designer' || formData.domain === 'Graphic Design' ? (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Portfolio / Insta / Project URL *</label>
                      <input required name="portfolio" value={formData.portfolio} onChange={handleChange} className={inputClasses} placeholder="https://..." />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">GitHub URL *</label>
                      <input required name="github" value={formData.github} onChange={handleChange} className={inputClasses} placeholder="https://github.com/username" />
                    </div>
                  )}
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
                        accept=".pdf,application/pdf"
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
                            <p className="text-gray-400 text-sm">PDF only (Max 5MB)</p>
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

      {/* Success Popup */}
      <AnimatePresence>
        {successData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Registration Complete!</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Your application has been submitted successfully. Your Student ID is <span className="font-bold text-gray-900">{successData.studentId}</span>.
              </p>

              <button
                type="button"
                disabled={otpSending}
                onClick={async () => {
                  if (successData.requiresOtp) {
                    try {
                      setOtpSending(true);
                      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/register/send-otp`, { email: successData.email });
                      setShowOtpModal(true);
                      toast.success("OTP sent to your email!");
                    } catch (err) {
                      toast.error("Failed to send OTP. Please try again.");
                    } finally {
                      setOtpSending(false);
                    }
                  } else {
                    localStorage.setItem('studentToken', successData.token);
                    localStorage.setItem('interviewToken', successData.token);
                    localStorage.setItem('interviewUser', JSON.stringify(successData.user));
                    localStorage.setItem('interviewUserRole', successData.user.role || 'intern');
                    navigate('/dashboard');
                  }
                }}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-blue-700 hover:shadow-lg shadow-blue-600/30 group disabled:opacity-70"
              >
                {otpSending ? "Sending OTP..." : "Go to Dashboard"}
                {!otpSending && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-2">Verify Email</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Enter the 4-digit OTP sent to {successData?.email}
              </p>

              <input
                type="text"
                maxLength="4"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center text-3xl font-bold tracking-[0.5em] bg-slate-50 border border-slate-300 rounded-xl px-4 py-4 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0000"
              />

              <button
                type="button"
                disabled={otpVerifying || otpValue.length !== 4}
                onClick={async () => {
                  try {
                    setOtpVerifying(true);
                    const verifyRes = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/register/verify-otp`, {
                      email: successData.email,
                      otp: otpValue
                    });

                    const { token, user } = verifyRes.data;
                    localStorage.setItem('studentToken', token);
                    localStorage.setItem('interviewToken', token);
                    localStorage.setItem('interviewUser', JSON.stringify(user));
                    localStorage.setItem('interviewUserRole', user.role || 'intern');
                    navigate('/dashboard');
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Invalid OTP");
                  } finally {
                    setOtpVerifying(false);
                  }
                }}
                className="w-full bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-blue-700"
              >
                {otpVerifying ? "Verifying..." : "Verify & Login"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Registration;
