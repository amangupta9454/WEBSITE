// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { Loader2, Send, User, GraduationCap, Briefcase, Link2, MessageSquare, CheckCircle2, Calendar } from 'lucide-react';

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
//     hearAbout: ''
//   });

//   const [submitting, setSubmitting] = useState(false);
//   const [isVisible, setIsVisible] = useState(false);

//   const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'].sort();

//   const domains = ['Frontend Development', 'Backend Development', 'MERN Stack Development', 'C Programming', 'Python Development', 'Artificial Intelligence', 'Figma or UI/UX', 'Data Science', 'Machine Learning','Full Stack Development','App Development', 'Marketing'];
//   const durations = ['1 Month', '2 Months', '3 Months'];
//   const hearOptions = ['LinkedIn', 'College', 'Friends/Students', 'Instagram', 'Website'];



//   useEffect(() => {
//     setTimeout(() => setIsVisible(true), 100);
//   }, []);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setSubmitting(true);

//     try {
//       const response = await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}/api/register`,
//         formData
//       );

//       toast.success(`Application submitted successfully! 🎉 Your Student ID: ${response.data.studentId}`);

//       // Reset form
//       setFormData({
//         name: '', email: '', mobile: '', whatsapp: '', course: '', branch: '',
//         year: '', college: '', state: '', passingYear: '', domain: '', duration: '',
//         portfolio: '', github: '', linkedin: '', whyHire: '', hearAbout: ''
//       });

//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-black py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
//       <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-black to-slate-950 opacity-40"></div>

//       <div className={`max-w-6xl mx-auto relative z-10 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
//         <div className="text-center mb-8 sm:mb-12 lg:mb-16 pt-14">
//           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
//             Internship Application
//           </h1>
//           <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
//             Begin your professional journey. Complete the form below to apply for your ideal internship opportunity.
//           </p>
//         </div>

//         <div className="bg-slate-950 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-gray-800 hover:border-gray-700 transition-all duration-500">
//           <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 lg:space-y-12">
//             {/* Personal Information */}
//             <div className="transform transition-all duration-500 hover:scale-[1.01]">
//               <div className="flex items-center gap-3 mb-6 sm:mb-8">
//                 <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
//                   <User className="text-white" size={24} />
//                 </div>
//                 <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
//                   Personal Information
//                 </h2>
//               </div>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Full Name *</label>
//                   <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="Enter your full name" />
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Email Address *</label>
//                   <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="your@email.com" />
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Mobile Number *</label>
//                   <input name="mobile" value={formData.mobile} onChange={handleChange} required maxLength="10" pattern="\d{10}" className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="10-digit mobile number" />
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">WhatsApp Number *</label>
//                   <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} required maxLength="10" pattern="\d{10}" className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="10-digit WhatsApp number" />
//                 </div>
//               </div>
//             </div>

//             <div className="h-px bg-linear-to-r from-transparent via-gray-700 to-transparent"></div>

//             {/* Academic Details */}
//             <div className="transform transition-all duration-500 hover:scale-[1.01]">
//               <div className="flex items-center gap-3 mb-6 sm:mb-8">
//                 <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
//                   <GraduationCap className="text-white" size={24} />
//                 </div>
//                 <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
//                   Academic Details
//                 </h2>
//               </div>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Course *</label>
//                   <input name="course" value={formData.course} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="e.g., B.Tech, BCA, MCA" />
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Branch *</label>
//                   <input name="branch" value={formData.branch} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="e.g., CSE, IT, ECE" />
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Current Year *</label>
//                   <input name="year" value={formData.year} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="e.g., 3rd Year" />
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">College Name *</label>
//                   <input name="college" value={formData.college} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="Full college name" />
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">State *</label>
//                   <select name="state" value={formData.state} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 appearance-none cursor-pointer">
//                     <option value="" className="bg-gray-800">Select your state</option>
//                     {states.map(s => <option key={s} value={s} className="bg-gray-800">{s}</option>)}
//                   </select>
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Year of Passing *</label>
//                   <input name="passingYear" value={formData.passingYear} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="e.g., 2026, 2027" />
//                 </div>
//               </div>
//             </div>

//             <div className="h-px bg-linear-to-r from-transparent via-gray-700 to-transparent"></div>

//             {/* Internship Preferences */}
//             <div className="transform transition-all duration-500 hover:scale-[1.01]">
//               <div className="flex items-center gap-3 mb-6 sm:mb-8">
//                 <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
//                   <Briefcase className="text-white" size={24} />
//                 </div>
//                 <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
//                   Internship Preferences
//                 </h2>
//               </div>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Preferred Domain *</label>
//                   <select name="domain" value={formData.domain} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 appearance-none cursor-pointer">
//                     <option value="" className="bg-gray-800">Choose your domain</option>
//                     {domains.map(d => <option key={d} value={d} className="bg-gray-800">{d}</option>)}
//                   </select>
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Preferred Duration *</label>
//                   <select name="duration" value={formData.duration} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 appearance-none cursor-pointer">
//                     <option value="" className="bg-gray-800">Select duration</option>
//                     {durations.map(d => <option key={d} value={d} className="bg-gray-800">{d}</option>)}
//                   </select>
//                 </div>

//               </div>
//             </div>

//             <div className="h-px bg-linear-to-r from-transparent via-gray-700 to-transparent"></div>

//             {/* Portfolio Links */}
//             <div className="transform transition-all duration-500 hover:scale-[1.01]">
//               <div className="flex items-center gap-3 mb-6 sm:mb-8">
//                 <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
//                   <Link2 className="text-white" size={24} />
//                 </div>
//                 <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
//                   Portfolio Links <span className="text-xs sm:text-sm text-gray-500">(Optional)</span>
//                 </h2>
//               </div>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
//                 <div className="group lg:col-span-2">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Portfolio URL</label>
//                   <input name="portfolio" value={formData.portfolio} onChange={handleChange} className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="https://yourportfolio.com" />
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">GitHub URL *</label>
//                   <input name="github" value={formData.github} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="https://github.com/username" />
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">LinkedIn URL *</label>
//                   <input name="linkedin" value={formData.linkedin} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300" placeholder="https://linkedin.com/in/username" />
//                 </div>
//               </div>
//             </div>

//             <div className="h-px bg-linear-to-r from-transparent via-gray-700 to-transparent"></div>

//             {/* Additional Information */}
//             <div className="transform transition-all duration-500 hover:scale-[1.01]">
//               <div className="flex items-center gap-3 mb-6 sm:mb-8">
//                 <div className="p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
//                   <MessageSquare className="text-white" size={24} />
//                 </div>
//                 <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
//                   Additional Information
//                 </h2>
//               </div>
//               <div className="space-y-4 sm:space-y-6">
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Why should we choose you? (Min 10 words) *</label>
//                   <textarea name="whyHire" value={formData.whyHire} onChange={handleChange} rows="5" required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 resize-none" placeholder="Tell us about your skills, experience, and what makes you unique..." />
//                 </div>
//                 <div className="group">
//                   <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">How did you hear about us? *</label>
//                   <select name="hearAbout" value={formData.hearAbout} onChange={handleChange} required className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 appearance-none cursor-pointer">
//                     <option value="" className="bg-gray-800">Select an option</option>
//                     {hearOptions.map(o => <option key={o} value={o} className="bg-gray-800">{o}</option>)}
//                   </select>
//                 </div>
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={submitting}
//               className="w-full py-4 sm:py-6 bg-white hover:bg-gray-100 text-black text-lg sm:text-xl font-bold rounded-lg transition-all duration-500 shadow-lg flex items-center justify-center gap-3 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
//             >
//               {submitting ? (
//                 <>
//                   <Loader2 className="animate-spin" size={28} />
//                   Submitting Application...
//                 </>
//               ) : (
//                 <>
//                   <Send className="group-hover:translate-x-1 transition-transform duration-300" size={28} />
//                   Submit Application
//                 </>
//               )}
//             </button>
//           </form>
//         </div>

//         <p className="text-center text-gray-500 mt-8 text-sm sm:text-base">
//           All fields marked with * are required
//         </p>
//       </div>

//       <ToastContainer
//         position="top-center"
//         theme="dark"
//         autoClose={5000}
//         className="mt-16 sm:mt-20"
//       />
//     </div>
//   );
// };

// export default Registration;
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Loader2, Send, User, GraduationCap, Briefcase,
  Link2, MessageSquare, IndianRupee, CheckCircle2,
  ChevronDown, Sparkles, Clock, Shield, Zap, ArrowRight
} from 'lucide-react';

const FEES = { '1 Month': 69, '2 Months': 69, '3 Months': 99 };

const InputField = ({ label, required, children, hint }) => (
  <div className="group flex flex-col gap-2">
    <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
      {label}
      {required && <span className="text-rose-400 text-lg">*</span>}
      {hint && <span className="text-gray-500 text-xs ml-1">({hint})</span>}
    </label>
    {children}
  </div>
);

const inputClass =
  'w-full px-5 py-3.5 bg-gray-900/60 border border-gray-700/60 rounded-xl text-white placeholder-gray-600 ' +
  'focus:outline-none focus:border-sky-400/80 focus:ring-2 focus:ring-sky-400/30 focus:bg-gray-900/80 ' +
  'hover:border-gray-600/80 hover:shadow-md hover:shadow-sky-500/10 transition-all duration-300 text-sm sm:text-base ' +
  'cursor-text caret-sky-400';

const selectClass = inputClass + ' appearance-none cursor-pointer hover:cursor-pointer';

const SectionHeader = ({ icon: Icon, title, subtitle, accent }) => (
  <div className="flex items-start gap-4 mb-7 sm:mb-9 group">
    <div className={`p-3 sm:p-4 rounded-xl border shadow-lg flex-shrink-0 transition-all duration-300 group-hover:shadow-xl ${accent} group-hover:scale-110`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="flex-1">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight group-hover:text-sky-300 transition-colors duration-300">{title}</h2>
      {subtitle && <p className="text-gray-500 text-xs sm:text-sm mt-1">{subtitle}</p>}
    </div>
  </div>
);

const Divider = () => (
  <div className="flex items-center gap-4 py-3">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />
  </div>
);

const FeeCard = ({ label, fee, desc, isSelected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative rounded-xl border p-5 sm:p-6 transition-all duration-300 select-none transform
      ${isSelected
        ? 'bg-gradient-to-br from-amber-500/15 to-amber-600/10 border-amber-500/60 shadow-lg shadow-amber-500/20 scale-105 hover:scale-110'
        : 'bg-gray-800/40 border-gray-700/60 hover:border-gray-600/80 hover:bg-gray-800/70 hover:shadow-md hover:shadow-sky-500/5 hover:scale-102'
      }
      group cursor-pointer active:scale-95`}
  >
    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-sky-400/10 to-transparent transition-opacity duration-300 pointer-events-none" />

    {isSelected && (
      <div className="absolute top-3 right-3 animate-bounce">
        <CheckCircle2 size={18} className="text-amber-400 drop-shadow-lg" />
      </div>
    )}

    <div className="relative z-10">
      <div className="flex items-center gap-2.5 mb-2">
        <Clock size={14} className={`transition-all duration-300 ${isSelected ? 'text-amber-400 scale-125' : 'text-gray-500'}`} />
        <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${isSelected ? 'text-amber-300' : 'text-gray-400 group-hover:text-gray-300'}`}>
          {label}
        </span>
      </div>
      <div className={`text-3xl sm:text-4xl font-black transition-all duration-300 ${isSelected ? 'text-white scale-110' : 'text-gray-300 group-hover:text-gray-200'}`}>
        ₹{fee}
      </div>
      <div className={`text-xs mt-1.5 font-medium transition-colors duration-300 ${isSelected ? 'text-amber-200' : 'text-gray-600 group-hover:text-gray-500'}`}>{desc}</div>
    </div>
  </button>
);

const Registration = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', whatsapp: '',
    course: '', branch: '', year: '', college: '', state: '', passingYear: '',
    domain: '', duration: '',
    portfolio: '', github: '', linkedin: '',
    whyHire: '', hearAbout: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredField, setHoveredField] = useState(null);

  const states = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi',
    'Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand',
    'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya',
    'Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
    'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'
  ].sort();

  const domains = [
    'Frontend Development','Backend Development','MERN Stack Development',
    'C Programming','Python Development','Artificial Intelligence',
    'Figma or UI/UX','Data Science','Machine Learning','Full Stack Development',
    'App Development','Marketing'
  ];
  const durations = ['1 Month', '2 Months', '3 Months'];
  const hearOptions = ['LinkedIn','College','Friends/Students','Instagram','Website'];

  const currentFee = formData.duration ? FEES[formData.duration] : null;
  const wordCount = formData.whyHire.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => { setTimeout(() => setIsVisible(true), 80); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/register`,
        formData
      );
      toast.success(`Application submitted! Your Student ID: ${response.data.studentId}`, {
        icon: '🎉'
      });
      setFormData({
        name:'',email:'',mobile:'',whatsapp:'',course:'',branch:'',
        year:'',college:'',state:'',passingYear:'',domain:'',duration:'',
        portfolio:'',github:'',linkedin:'',whyHire:'',hearAbout:''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden cursor-default">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-sky-900/15 blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-blue-900/12 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full bg-teal-900/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Animated grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.5) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
            animation: 'drift 20s linear infinite'
          }}
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-sky-400/20 blur-xl"
            style={{
              width: Math.random() * 100 + 50 + 'px',
              height: Math.random() * 100 + 50 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${15 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: Math.random() * 5 + 's',
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(48px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(0px); }
          75% { transform: translateY(-20px) translateX(-10px); }
        }
        input:focus::placeholder {
          color: rgba(148, 163, 184, 0.3);
        }
        select {
          background-image: none;
        }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>

      <div
        className={`max-w-5xl mx-auto relative z-10 transition-all duration-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14 pt-10 group">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs sm:text-sm font-bold mb-5 tracking-widest
            transition-all duration-300 hover:bg-sky-500/15 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer hover:scale-105 active:scale-95">
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
            NOW ACCEPTING APPLICATIONS
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight leading-tight group-hover:text-sky-200 transition-colors duration-500">
            Internship{' '}
            <span className="bg-gradient-to-r from-sky-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              Application
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
            Begin your professional journey. Complete the form below to apply for your ideal internship opportunity.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/40 backdrop-blur-2xl rounded-3xl sm:rounded-4xl border border-gray-800/60 shadow-2xl overflow-hidden transition-all duration-500 hover:border-gray-700/80 hover:shadow-2xl hover:shadow-sky-500/10 group">
          {/* Top accent line with animation */}
          <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-teal-400 to-cyan-500 animate-pulse" />

          <form onSubmit={handleSubmit} className="p-8 sm:p-10 lg:p-16 space-y-12 sm:space-y-14">

            {/* Personal Information */}
            <section className="transform transition-all duration-300 hover:scale-[1.01]">
              <SectionHeader
                icon={User}
                title="Personal Information"
                subtitle="We need your basic contact details"
                accent="bg-gradient-to-br from-sky-500/15 to-sky-600/10 border-sky-500/30 hover:border-sky-500/60 hover:shadow-lg hover:shadow-sky-500/15"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <InputField label="Full Name" required>
                  <input name="name" value={formData.name} onChange={handleChange} required
                    className={inputClass} placeholder="Enter your full name"
                    onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} />
                </InputField>
                <InputField label="Email Address" required>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required
                    className={inputClass} placeholder="your@email.com"
                    onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} />
                </InputField>
                <InputField label="Mobile Number" required>
                  <input name="mobile" value={formData.mobile} onChange={handleChange} required
                    maxLength="10" pattern="\d{10}" className={inputClass} placeholder="10-digit mobile number"
                    onFocus={() => setFocusedField('mobile')} onBlur={() => setFocusedField(null)} />
                </InputField>
                <InputField label="WhatsApp Number" required>
                  <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} required
                    maxLength="10" pattern="\d{10}" className={inputClass} placeholder="10-digit WhatsApp number"
                    onFocus={() => setFocusedField('whatsapp')} onBlur={() => setFocusedField(null)} />
                </InputField>
              </div>
            </section>

            <Divider />

            {/* Academic Details */}
            <section className="transform transition-all duration-300 hover:scale-[1.01]">
              <SectionHeader
                icon={GraduationCap}
                title="Academic Details"
                subtitle="Tell us about your educational background"
                accent="bg-gradient-to-br from-teal-500/15 to-teal-600/10 border-teal-500/30 hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-500/15"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <InputField label="Course" required>
                  <input name="course" value={formData.course} onChange={handleChange} required
                    className={inputClass} placeholder="e.g., B.Tech, BCA, MCA"
                    onFocus={() => setFocusedField('course')} onBlur={() => setFocusedField(null)} />
                </InputField>
                <InputField label="Branch" required>
                  <input name="branch" value={formData.branch} onChange={handleChange} required
                    className={inputClass} placeholder="e.g., CSE, IT, ECE"
                    onFocus={() => setFocusedField('branch')} onBlur={() => setFocusedField(null)} />
                </InputField>
                <InputField label="Current Year" required>
                  <input name="year" value={formData.year} onChange={handleChange} required
                    className={inputClass} placeholder="e.g., 3rd Year"
                    onFocus={() => setFocusedField('year')} onBlur={() => setFocusedField(null)} />
                </InputField>
                <InputField label="College Name" required>
                  <input name="college" value={formData.college} onChange={handleChange} required
                    className={inputClass} placeholder="Full college name"
                    onFocus={() => setFocusedField('college')} onBlur={() => setFocusedField(null)} />
                </InputField>
                <InputField label="State" required>
                  <div className="relative group/select">
                    <select name="state" value={formData.state} onChange={handleChange} required className={`${selectClass} group-hover/select:cursor-pointer`}>
                      <option value="" className="bg-gray-900">Select your state</option>
                      {states.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover/select:text-gray-400 transition-colors duration-300" />
                  </div>
                </InputField>
                <InputField label="Year of Passing" required>
                  <input name="passingYear" value={formData.passingYear} onChange={handleChange} required
                    className={inputClass} placeholder="e.g., 2026, 2027"
                    onFocus={() => setFocusedField('passingYear')} onBlur={() => setFocusedField(null)} />
                </InputField>
              </div>
            </section>

            <Divider />

            {/* Internship Preferences */}
            <section className="transform transition-all duration-300 hover:scale-[1.01]">
              <SectionHeader
                icon={Briefcase}
                title="Internship Preferences"
                subtitle="Choose your preferred domain and duration"
                accent="bg-gradient-to-br from-amber-500/15 to-amber-600/10 border-amber-500/30 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/15"
              />

              {/* Fees Info Cards */}
              {/* <div className="mb-8 sm:mb-10">
                <div className="flex items-center gap-2.5 mb-4 group">
                  <Zap size={16} className="text-amber-400 animate-pulse group-hover:animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-widest text-amber-400 group-hover:text-amber-300 transition-colors duration-300">Registration Fees</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: '1 Month', fee: 69, desc: 'Short-term track' },
                    { label: '2 Months', fee: 69, desc: 'Standard track' },
                    { label: '3 Months', fee: 99, desc: 'Extended track' },
                  ].map(({ label, fee, desc }) => (
                    <FeeCard
                      key={label}
                      label={label}
                      fee={fee}
                      desc={desc}
                      isSelected={formData.duration === label}
                      onClick={() => setFormData({ ...formData, duration: label })}
                    />
                  ))}
                </div>

                {currentFee && (
                  <div className="mt-6 rounded-xl bg-gradient-to-r from-green-500/12 via-green-600/8 to-green-500/12 border border-green-500/30 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transform transition-all duration-300 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/15 hover:scale-102 cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Shield size={19} className="text-green-400 flex-shrink-0 group-hover:scale-125 transition-transform duration-300" />
                      <div>
                        <p className="text-white font-bold text-sm sm:text-base">
                          Fees for <span className="text-green-300">{formData.duration}</span>: <span className="text-green-300 font-black">₹{currentFee}</span>
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5 group-hover:text-gray-400 transition-colors duration-300">Payable at the time of project submission</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300 flex-shrink-0">
                      <CheckCircle2 size={13} className="text-green-500" />
                      Secure
                    </div>
                  </div>
                )}
              </div> */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <InputField label="Preferred Domain" required>
                  <div className="relative group/select">
                    <select name="domain" value={formData.domain} onChange={handleChange} required className={`${selectClass} group-hover/select:cursor-pointer`}>
                      <option value="" className="bg-gray-900">Choose your domain</option>
                      {domains.map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover/select:text-gray-400 transition-colors duration-300" />
                  </div>
                </InputField>
                <InputField label="Preferred Duration" required>
                  <div className="relative group/select">
                    <select name="duration" value={formData.duration} onChange={handleChange} required className={`${selectClass} group-hover/select:cursor-pointer`}>
                      <option value="" className="bg-gray-900">Select duration</option>
                      {durations.map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover/select:text-gray-400 transition-colors duration-300" />
                  </div>
                </InputField>
              </div>
            </section>

            <Divider />

            {/* Portfolio Links */}
            <section className="transform transition-all duration-300 hover:scale-[1.01]">
              <SectionHeader
                icon={Link2}
                title="Portfolio Links"
                subtitle="Share your work — GitHub and LinkedIn are required"
                accent="bg-gradient-to-br from-blue-500/15 to-blue-600/10 border-blue-500/30 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/15"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="sm:col-span-2">
                  <InputField label="Portfolio URL" hint="optional">
                    <input name="portfolio" value={formData.portfolio} onChange={handleChange}
                      className={inputClass} placeholder="https://yourportfolio.com"
                      onFocus={() => setFocusedField('portfolio')} onBlur={() => setFocusedField(null)} />
                  </InputField>
                </div>
                <InputField label="GitHub URL" required>
                  <input name="github" value={formData.github} onChange={handleChange} required
                    className={inputClass} placeholder="https://github.com/username"
                    onFocus={() => setFocusedField('github')} onBlur={() => setFocusedField(null)} />
                </InputField>
                <InputField label="LinkedIn URL" required>
                  <input name="linkedin" value={formData.linkedin} onChange={handleChange} required
                    className={inputClass} placeholder="https://linkedin.com/in/username"
                    onFocus={() => setFocusedField('linkedin')} onBlur={() => setFocusedField(null)} />
                </InputField>
              </div>
            </section>

            <Divider />

            {/* Additional Information */}
            <section className="transform transition-all duration-300 hover:scale-[1.01]">
              <SectionHeader
                icon={MessageSquare}
                title="Additional Information"
                subtitle="Help us understand you better"
                accent="bg-gradient-to-br from-rose-500/15 to-rose-600/10 border-rose-500/30 hover:border-rose-500/60 hover:shadow-lg hover:shadow-rose-500/15"
              />
              <div className="space-y-6">
                <InputField label="Why should we choose you?" required hint="min 10 words">
                  <textarea
                    name="whyHire" value={formData.whyHire} onChange={handleChange}
                    rows="5" required
                    className={`${inputClass} resize-none leading-relaxed cursor-text caret-sky-400`}
                    placeholder="Tell us about your skills, experience, and what makes you a great candidate..."
                    onFocus={() => setFocusedField('whyHire')} onBlur={() => setFocusedField(null)}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs font-medium transition-colors duration-300 ${wordCount >= 10 ? 'text-green-500' : 'text-gray-600'}`}>
                      {wordCount} words
                    </p>
                    {wordCount >= 10 && <CheckCircle2 size={14} className="text-green-500 animate-bounce" />}
                  </div>
                </InputField>
                <InputField label="How did you hear about us?" required>
                  <div className="relative group/select">
                    <select name="hearAbout" value={formData.hearAbout} onChange={handleChange} required className={`${selectClass} group-hover/select:cursor-pointer`}>
                      <option value="" className="bg-gray-900">Select an option</option>
                      {hearOptions.map(o => <option key={o} value={o} className="bg-gray-900">{o}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover/select:text-gray-400 transition-colors duration-300" />
                  </div>
                </InputField>
              </div>
            </section>

            {/* Summary strip before submit */}
            {/* {currentFee && (
              <div className="rounded-xl bg-gradient-to-r from-sky-500/10 via-sky-500/8 to-teal-500/10 border border-sky-500/25 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transform transition-all duration-300 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/20 hover:scale-102 group cursor-pointer">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 group-hover:border-sky-500/60 transition-all duration-300 group-hover:scale-110">
                    <IndianRupee size={18} className="text-sky-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm sm:text-base">
                      Total Fees: <span className="text-sky-300">₹{currentFee}</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5 group-hover:text-gray-400 transition-colors duration-300">Payable upon project submission for {formData.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-sky-300 flex-shrink-0">
                  Ready to submit
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            )} */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 sm:py-6 rounded-xl font-black text-base sm:text-lg tracking-wide
                bg-gradient-to-r from-sky-500 via-sky-400 to-teal-500 hover:from-sky-400 hover:via-sky-300 hover:to-teal-400
                text-white shadow-xl shadow-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/50
                transition-all duration-300 flex items-center justify-center gap-3
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:from-sky-500
                active:scale-95 hover:scale-105 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <Send size={22} className="group-hover:translate-x-1 group-active:-translate-x-1 transition-transform duration-200 relative z-10" />
                  <span className="relative z-10">Submit Application</span>
                </>
              )}
            </button>

            <p className="text-center text-gray-600 text-xs sm:text-sm -mt-3 hover:text-gray-500 transition-colors duration-300 cursor-help">
              Fields marked with <span className="text-rose-400 font-bold">*</span> are required
            </p>
          </form>
        </div>
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
