// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import emailjs from '@emailjs/browser';
// import { Loader2, FileText, Send } from 'lucide-react';

// const Registration = () => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     mobile: '',
//     whatsapp: '',
//     course: '',
//     branch: '',
//     year: '',
//     college: '',
//     state: '',
//     passingYear: '',
//     domain: '',
//     duration: '',
//     portfolio: '',
//     github: '',
//     linkedin: '',
//     whyHire: '',
//     hearAbout: '',
//     resumeUrl: '',
//   });

//   const [resumeFile, setResumeFile] = useState(null);
//   const [uploading, setUploading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const navigate = useNavigate();

//   const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'].sort();

//   const domains = ['Frontend Development', 'Backend Development', 'MERN Stack Development', 'C Programming', 'Python Programming', 'AI & ML', 'Figma and UI/UX', 'Data Analytics'];
//   const durations = ['1 Month', '2 Months', '3 Months'];
//   const hearOptions = ['LinkedIn', 'College', 'Friends/Students', 'Instagram', 'Website'];

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       toast.error('Please login to apply for internship');
//       navigate('/login');
//     } else {
//       setIsAuthenticated(true);
//     }
//   }, [navigate]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleResumeUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     if (file.type !== 'application/pdf') {
//       toast.error('Only PDF files are allowed');
//       return;
//     }
//     if (file.size > 500 * 1024) {
//       toast.error('Resume must be under 500 KB');
//       return;
//     }

//     setResumeFile(file);
//     setUploading(true);

//     const uploadFormData = new FormData();
//     uploadFormData.append('file', file);
//     uploadFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
//     uploadFormData.append('folder', 'internship-resumes');
//     uploadFormData.append('resource_type', 'raw');

//     try {
//       const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, {
//         method: 'POST',
//         body: uploadFormData
//       });
//       const data = await res.json();
//       if (data.secure_url) {
//         setFormData(prev => ({ ...prev, resumeUrl: data.secure_url }));
//         toast.success('Resume uploaded successfully!');
//       } else {
//         toast.error('Upload failed');
//       }
//     } catch (error) {
//       toast.error('Resume upload failed');
//     } finally {
//       setUploading(false);
//     }
//   };

//   const sendConfirmationEmail = async () => {
//     try {
//       await emailjs.send(
//         import.meta.env.VITE_EMAILJS_SERVICE_ID,
//         import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
//         {
//           name: formData.name,
//           email: formData.email,
//           domain: formData.domain,
//           duration: formData.duration,
//           college: formData.college,
//         },
//         import.meta.env.VITE_EMAILJS_PUBLIC_KEY
//       );
//       console.log('Confirmation email sent via EmailJS');
//     } catch (error) {
//       console.error('EmailJS failed:', error);
//       toast.warn('Application submitted, but confirmation email failed.');
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.resumeUrl) {
//       toast.error('Please upload your resume');
//       return;
//     }

//     setSubmitting(true);
//     const token = localStorage.getItem('token');

//     try {
//       await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}/api/register`,
//         formData,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       toast.success('🎉 Internship application submitted successfully!');

//       // Send confirmation email
//       await sendConfirmationEmail();

//       // Reset form
//       setFormData({
//         name: '', email: '', mobile: '', whatsapp: '', course: '', branch: '',
//         year: '', college: '', state: '', passingYear: '', domain: '', duration: '',
//         portfolio: '', github: '', linkedin: '', whyHire: '', hearAbout: '', resumeUrl: ''
//       });
//       setResumeFile(null);

//       // Force dashboard refresh when user visits it next
//       toast.info('Check your dashboard for updated application!');
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Submission failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (!isAuthenticated) return null;

//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
//       <div className="max-w-5xl mx-auto">
//         <h1 className="text-4xl font-bold text-center text-white mb-12">Internship Application Form</h1>

//         <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/20">
//           <form onSubmit={handleSubmit} className="space-y-8">

//             {/* Personal Information */}
//             <div>
//               <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Personal Information</h2>
//               <div className="grid md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-white mb-2">Full Name *</label>
//                   <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20" placeholder="Enter your name" />
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">Email Address *</label>
//                   <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white" placeholder="your@email.com" />
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">Mobile Number *</label>
//                   <input name="mobile" value={formData.mobile} onChange={handleChange} required maxLength="10" pattern="\d{10}" className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white" placeholder="10-digit number" />
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">WhatsApp Number *</label>
//                   <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} required maxLength="10" pattern="\d{10}" className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white" placeholder="10-digit number" />
//                 </div>
//               </div>
//             </div>

//             {/* Academic Details */}
//             <div>
//               <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Academic Details</h2>
//               <div className="grid md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-white mb-2">Course *</label>
//                   <input name="course" value={formData.course} onChange={handleChange} required className="input-field" placeholder="e.g., B.Tech" />
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">Branch *</label>
//                   <input name="branch" value={formData.branch} onChange={handleChange} required className="input-field" placeholder="e.g., CSE" />
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">Current Year *</label>
//                   <input name="year" value={formData.year} onChange={handleChange} required className="input-field" placeholder="e.g., 3rd Year" />
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">College Name *</label>
//                   <input name="college" value={formData.college} onChange={handleChange} required className="input-field" placeholder="Full college name" />
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">State *</label>
//                   <select name="state" value={formData.state} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white">
//                     <option value="">Select state</option>
//                     {states.map(s => <option key={s} value={s}>{s}</option>)}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">Year of Passing *</label>
//                   <input name="passingYear" value={formData.passingYear} onChange={handleChange} required className="input-field" placeholder="e.g., 2027" />
//                 </div>
//               </div>
//             </div>

//             {/* Internship Preferences */}
//             <div>
//               <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Internship Preferences</h2>
//               <div className="grid md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-white mb-2">Preferred Domain *</label>
//                   <select name="domain" value={formData.domain} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white">
//                     <option value="">Choose domain</option>
//                     {domains.map(d => <option key={d} value={d}>{d}</option>)}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">Preferred Duration *</label>
//                   <select name="duration" value={formData.duration} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white">
//                     <option value="">Select duration</option>
//                     {durations.map(d => <option key={d} value={d}>{d}</option>)}
//                   </select>
//                 </div>
//               </div>
//             </div>

//             {/* Optional Links */}
//             <div>
//               <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Links (Optional)</h2>
//               <div className="grid md:grid-cols-3 gap-6">
//                 <div>
//                   <label className="block text-white mb-2">Portfolio URL</label>
//                   <input name="portfolio" value={formData.portfolio} onChange={handleChange} className="input-field" placeholder="https://..." />
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">GitHub URL</label>
//                   <input name="github" value={formData.github} onChange={handleChange} className="input-field" placeholder="https://github.com/..." />
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2">LinkedIn URL</label>
//                   <input name="linkedin" value={formData.linkedin} onChange={handleChange} className="input-field" placeholder="https://linkedin.com/in/..." />
//                 </div>
//               </div>
//             </div>

//             {/* Why Hire & Hear About */}
//             <div>
//               <label className="block text-white mb-2">Why we choose you? (Min 10 words) *</label>
//               <textarea name="whyHire" value={formData.whyHire} onChange={handleChange} rows="4" required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white" placeholder="Tell us about your skills..." />
//             </div>

//             <div>
//               <label className="block text-white mb-2">How did you hear about us? *</label>
//               <select name="hearAbout" value={formData.hearAbout} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white">
//                 <option value="">Select option</option>
//                 {hearOptions.map(o => <option key={o} value={o}>{o}</option>)}
//               </select>
//             </div>

//             {/* Resume Upload */}
//             <div>
//               <label className="block text-white mb-4 text-xl">Upload Resume (PDF only, max 500 KB) *</label>
//               <div className="border-2 border-dashed border-cyan-500/50 rounded-2xl p-10 text-center">
//                 <FileText className="mx-auto text-cyan-400 mb-4" size={60} />
//                 <label className="cursor-pointer">
//                   <span className="px-8 py-4 bg-linear-to-r from-cyan-500 to-blue-500 text-white text-lg font-semibold rounded-full hover:from-cyan-400 hover:to-blue-400 transition">
//                     {uploading ? 'Uploading...' : 'Choose PDF File'}
//                   </span>
//                   <input type="file" accept="application/pdf" onChange={handleResumeUpload} className="hidden" disabled={uploading} />
//                 </label>
//                 {resumeFile && <p className="mt-6 text-green-400 text-lg">✅ {resumeFile.name} uploaded successfully!</p>}
//               </div>
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={submitting || uploading}
//               className="w-full py-5 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-xl font-bold rounded-2xl transition-all duration-300 shadow-2xl flex items-center justify-center"
//             >
//               {submitting ? <Loader2 className="animate-spin mr-3" size={28} /> : <Send className="mr-3" size={28} />}
//               {submitting ? 'Submitting Application...' : 'Submit Application'}
//             </button>
//           </form>
//         </div>
//       </div>

//       <ToastContainer position="top-center" theme="dark" autoClose={5000} />
//     </div>
//   );
// };

// export default Registration;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import emailjs from '@emailjs/browser';
import { Loader2, FileText, Send, User, GraduationCap, Briefcase, Link2, MessageSquare, Upload, CheckCircle2 } from 'lucide-react';

const Registration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    whatsapp: '',
    course: '',
    branch: '',
    year: '',
    college: '',
    state: '',
    passingYear: '',
    domain: '',
    duration: '',
    portfolio: '',
    github: '',
    linkedin: '',
    whyHire: '',
    hearAbout: '',
    resumeUrl: '',
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'].sort();

  const domains = ['Frontend Development', 'Backend Development', 'MERN Stack Development', 'C Programming', 'Python Programming', 'AI & ML', 'Figma and UI/UX', 'Data Analytics'];
  const durations = ['1 Month', '2 Months', '3 Months'];
  const hearOptions = ['LinkedIn', 'College', 'Friends/Students', 'Instagram', 'Website'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to apply for internship');
      navigate('/login');
    } else {
      setIsAuthenticated(true);
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error('Resume must be under 500 KB');
      return;
    }

    setResumeFile(file);
    setUploading(true);

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    uploadFormData.append('folder', 'internship-resumes');
    uploadFormData.append('resource_type', 'raw');

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: uploadFormData
      });
      const data = await res.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, resumeUrl: data.secure_url }));
        toast.success('Resume uploaded successfully!');
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      toast.error('Resume upload failed');
    } finally {
      setUploading(false);
    }
  };

  const sendConfirmationEmail = async () => {
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          name: formData.name,
          email: formData.email,
          domain: formData.domain,
          duration: formData.duration,
          college: formData.college,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      console.log('Confirmation email sent via EmailJS');
    } catch (error) {
      console.error('EmailJS failed:', error);
      toast.warn('Application submitted, but confirmation email failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.resumeUrl) {
      toast.error('Please upload your resume');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/register`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Application submitted successfully!');

      await sendConfirmationEmail();

      setFormData({
        name: '', email: '', mobile: '', whatsapp: '', course: '', branch: '',
        year: '', college: '', state: '', passingYear: '', domain: '', duration: '',
        portfolio: '', github: '', linkedin: '', whyHire: '', hearAbout: '', resumeUrl: ''
      });
      setResumeFile(null);

      toast.info('Check your dashboard for updated application!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-black to-slate-950 opacity-40"></div>

      <div className={`max-w-6xl mx-auto relative z-10 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 pt-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
            Internship Application
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Begin your professional journey. Complete the form below to apply for your ideal internship opportunity.
          </p>
        </div>

        <div className="bg-slate-950 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-gray-800 hover:border-gray-700 transition-all duration-500">
          <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 lg:space-y-12">

            {/* Personal Information */}
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                  <User className="text-white" size={24} />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
                  Personal Information
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Full Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="your@email.com"
                  />
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Mobile Number *</label>
                  <input
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    maxLength="10"
                    pattern="\d{10}"
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">WhatsApp Number *</label>
                  <input
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    required
                    maxLength="10"
                    pattern="\d{10}"
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="10-digit WhatsApp number"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-linear-to-r from-transparent via-gray-700 to-transparent"></div>

            {/* Academic Details */}
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                  <GraduationCap className="text-white" size={24} />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
                  Academic Details
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Course *</label>
                  <input
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="e.g., B.Tech, BCA, MCA"
                  />
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Branch *</label>
                  <input
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="e.g., CSE, IT, ECE"
                  />
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Current Year *</label>
                  <input
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="e.g., 3rd Year"
                  />
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">College Name *</label>
                  <input
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="Full college name"
                  />
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-800">Select your state</option>
                    {states.map(s => <option key={s} value={s} className="bg-gray-800">{s}</option>)}
                  </select>
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Year of Passing *</label>
                  <input
                    name="passingYear"
                    value={formData.passingYear}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="e.g., 2026, 2027"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-linear-to-r from-transparent via-gray-700 to-transparent"></div>

            {/* Internship Preferences */}
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                  <Briefcase className="text-white" size={24} />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
                  Internship Preferences
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Preferred Domain *</label>
                  <select
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-800">Choose your domain</option>
                    {domains.map(d => <option key={d} value={d} className="bg-gray-800">{d}</option>)}
                  </select>
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Preferred Duration *</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-800">Select duration</option>
                    {durations.map(d => <option key={d} value={d} className="bg-gray-800">{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="h-px bg-linear-to-r from-transparent via-gray-700 to-transparent"></div>

            {/* Portfolio Links */}
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                  <Link2 className="text-white" size={24} />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
                  Portfolio Links <span className="text-xs sm:text-sm text-gray-500">(Optional)</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="group lg:col-span-2">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Portfolio URL</label>
                  <input
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">GitHub URL</label>
                  <input
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">LinkedIn URL</label>
                  <input
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-linear-to-r from-transparent via-gray-700 to-transparent"></div>

            {/* Additional Information */}
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                  <MessageSquare className="text-white" size={24} />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
                  Additional Information
                </h2>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Why should we choose you? (Min 10 words) *</label>
                  <textarea
                    name="whyHire"
                    value={formData.whyHire}
                    onChange={handleChange}
                    rows="5"
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 resize-none"
                    placeholder="Tell us about your skills, experience, and what makes you unique..."
                  />
                </div>
                <div className="group">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">How did you hear about us? *</label>
                  <select
                    name="hearAbout"
                    value={formData.hearAbout}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-800">Select an option</option>
                    {hearOptions.map(o => <option key={o} value={o} className="bg-gray-800">{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="h-px bg-linear-to-r from-transparent via-gray-700 to-transparent"></div>

            {/* Resume Upload */}
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                  <Upload className="text-white" size={24} />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
                  Resume Upload
                </h2>
              </div>
              <div className="border-2 border-dashed border-gray-600 hover:border-gray-400 rounded-xl p-8 sm:p-12 text-center transition-all duration-500 bg-gray-900/50 backdrop-blur-sm group hover:bg-gray-800/50">
                <FileText className="mx-auto text-gray-400 mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300" size={56} />
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">PDF only, maximum 500 KB</p>
                <label className="cursor-pointer inline-block">
                  <span className="px-6 sm:px-10 py-3 sm:py-4 bg-gray-800 hover:bg-gray-700 text-white text-base sm:text-lg font-semibold rounded-lg transition-all duration-300 shadow-lg border border-gray-700 hover:border-gray-500 inline-flex items-center gap-2 transform hover:scale-105">
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        Choose PDF File
                      </>
                    )}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {resumeFile && (
                  <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gray-800/50 border border-gray-700 rounded-lg backdrop-blur-sm animate-in fade-in duration-500">
                    <p className="text-gray-300 text-base sm:text-lg font-medium flex items-center justify-center gap-2">
                      <CheckCircle2 size={24} className="text-gray-400" />
                      {resumeFile.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full py-4 sm:py-6 bg-white hover:bg-gray-100 text-black text-lg sm:text-xl font-bold rounded-lg transition-all duration-500 shadow-lg flex items-center justify-center gap-3 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={28} />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="group-hover:translate-x-1 transition-transform duration-300" size={28} />
                  Submit Application
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 mt-8 text-sm sm:text-base">
          All fields marked with * are required
        </p>
      </div>

      <ToastContainer
        position="top-center"
        theme="dark"
        autoClose={5000}
        className="mt-16 sm:mt-20"
      />
    </div>
  );
};

export default Registration;