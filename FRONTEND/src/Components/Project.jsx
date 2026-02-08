// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { Loader2, Send, User, Briefcase, Link2, MessageSquare, Calendar } from 'lucide-react';

// const Project = () => {
//   const [formData, setFormData] = useState({
//     studentId: '',
//     name: '',
//     email: '',
//     mobile: '',
//     domain: '',
//     duration: '',
//     assignments: [
//       { projectName: '', github: '', hosted: '' },
//       { projectName: '', github: '', hosted: '' },
//       { projectName: '', github: '', hosted: '' }
//     ]
//   });

//   const [currentMonth, setCurrentMonth] = useState(null); // 1, 2, or 3
//   const [loadingMonth, setLoadingMonth] = useState(false);
//   const [submitting, setSubmitting] = useState(false);

//   const domains = [
//     'Frontend Development', 'Backend Development', 'MERN Stack Development',
//     'C Programming', 'Python Development', 'Artificial Intelligence',
//     'Figma or UI/UX', 'Data Science', 'Machine Learning', 'Full Stack Development'
//   ];
//   const durations = ['1 Month', '2 Months', '3 Months'];

//   // Fetch current month when studentId is entered
//   useEffect(() => {
//   const fetchMonth = async () => {
//   if (!formData.studentId?.trim()) {
//     setCurrentMonth(null);
//     return;
//   }

//   setLoadingMonth(true);

//   try {
//     const url = `${import.meta.env.VITE_BACKEND_URL}/api/project/current-month/${encodeURIComponent(formData.studentId)}`;
//     console.log("Fetching month from:", url);

//     const res = await axios.get(url);

//     console.log("Backend responded:", res.status, res.data);

//     if (res.data.canSubmit) {
//       setCurrentMonth(res.data.currentMonth);
//     } else {
//       setCurrentMonth(4); // all done
//     }
//   } catch (err) {
//     console.error("Month fetch failed ── full error:", err);
//     console.log("→ Error message:", err.message);
//     console.log("→ Status:", err.response?.status ?? "no response");
//     console.log("→ Response data:", err.response?.data ?? "no data");
//     console.log("→ Request URL:", err.config?.url ?? "unknown");
    
//     setCurrentMonth(null);
//   } finally {
//     setLoadingMonth(false);
//   }
// };

//   const timer = setTimeout(fetchMonth, 600);
//   return () => clearTimeout(timer);
// }, [formData.studentId, formData.name, formData.email, formData.mobile, formData.domain, formData.duration]);

//   const getMonthDisplay = () => {
//     if (loadingMonth) return 'Checking...';
//     if (currentMonth === 4) return 'All assignments already submitted';
//     if (currentMonth) return `Assignment for Month ${currentMonth}`;
//     return 'Enter Student ID to see which month you are submitting for';
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleAssignmentChange = (index, field, value) => {
//     const newAssignments = [...formData.assignments];
//     newAssignments[index][field] = value;
//     setFormData({ ...formData, assignments: newAssignments });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!currentMonth || currentMonth > 3) {
//       toast.error('Cannot submit: Invalid month or all submissions completed');
//       return;
//     }

//     setSubmitting(true);

//     try {
//       const payload = {
//         ...formData,
//         assignments: formData.assignments.filter(a => a.projectName || a.github || a.hosted) // only send filled ones
//       };

//       const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/project/submit`, payload);

//       if (res.data.order) {
//         const options = {
//           key: res.data.key,
//           amount: res.data.order.amount,
//           currency: 'INR',
//           order_id: res.data.order.id,
//           handler: async function (response) {
//             try {
//               const verifyRes = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/project/verify`, {
//                 response,
//                 ...payload
//               });
//               toast.success(verifyRes.data.message);
              
//             } catch (err) {
//               toast.error('Payment verification failed');
//             }
//           },
//           prefill: {
//             name: formData.name,
//             email: formData.email,
//             contact: formData.mobile
//           },
//           theme: { color: '#3399cc' }
//         };

//         const rzp = new window.Razorpay(options);
//         rzp.open();
//       } else {
//         toast.success(res.data.message || 'Payment is verified and Project is Submitted');
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Submission failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-black py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
//       <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-black to-slate-950 opacity-40"></div>

//       <div className="max-w-6xl mx-auto relative z-10">
//         <div className="text-center mb-8 sm:mb-12 lg:mb-16 pt-14">
//           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
//             Project / Assignment Submission
//           </h1>
//           <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
//             Submit your monthly internship assignments. Fields are optional except personal & internship details.
//           </p>
//         </div>

//         <div className="bg-slate-950 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-gray-800 hover:border-gray-700 transition-all duration-500">
//           <div className="mb-8 p-4 bg-blue-900/30 rounded-xl border border-blue-700/40 text-center">
//             <div className="flex items-center justify-center gap-3 mb-2">
//               <Calendar className="text-blue-400" size={28} />
//               <h2 className="text-xl sm:text-2xl font-bold text-white">
//                 {getMonthDisplay()}
//               </h2>
//             </div>
//             <p className="text-blue-300 text-sm">
//               {currentMonth === 4 
//                 ? "You've already completed all required submissions!" 
//                 : "Enter your Student ID to see which month you're submitting for"}
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 lg:space-y-12">
//             {/* Student Details */}
//             <div>
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
//                   <User className="text-white" size={24} />
//                 </div>
//                 <h2 className="text-2xl font-semibold text-white">Student Details (Required)</h2>
//               </div>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <div>
//                   <label htmlFor="studentId" className="block text-gray-300 mb-2 font-medium">Student ID *</label>
//                   <input
//                     id="studentId"
//                     name="studentId"
//                     value={formData.studentId}
//                     onChange={handleChange}
//                     required
//                     placeholder="e.g., CN/INT/2026/001"
//                     className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="name" className="block text-gray-300 mb-2 font-medium">Full Name *</label>
//                   <input
//                     id="name"
//                     name="name"
//                     value={formData.name}
//                     onChange={handleChange}
//                     required
//                     placeholder="Your full name"
//                     className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="email" className="block text-gray-300 mb-2 font-medium">Email Address *</label>
//                   <input
//                     id="email"
//                     name="email"
//                     type="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     required
//                     placeholder="your.email@example.com"
//                     className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="mobile" className="block text-gray-300 mb-2 font-medium">Mobile Number *</label>
//                   <input
//                     id="mobile"
//                     name="mobile"
//                     value={formData.mobile}
//                     onChange={handleChange}
//                     required
//                     placeholder="10-digit number"
//                     className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Internship Details */}
//             <div>
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
//                   <Briefcase className="text-white" size={24} />
//                 </div>
//                 <h2 className="text-2xl font-semibold text-white">Internship Details (Required)</h2>
//               </div>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <div>
//                   <label htmlFor="domain" className="block text-gray-300 mb-2 font-medium">Domain *</label>
//                   <select
//                     id="domain"
//                     name="domain"
//                     value={formData.domain}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   >
//                     <option value="">Select Domain</option>
//                     {domains.map(d => <option key={d} value={d}>{d}</option>)}
//                   </select>
//                 </div>

//                 <div>
//                   <label htmlFor="duration" className="block text-gray-300 mb-2 font-medium">Duration *</label>
//                   <select
//                     id="duration"
//                     name="duration"
//                     value={formData.duration}
//                     onChange={handleChange}
//                     required
//                     className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   >
//                     <option value="">Select Duration</option>
//                     {durations.map(d => <option key={d} value={d}>{d}</option>)}
//                   </select>
//                 </div>
//               </div>
//             </div>

//             {/* Assignments */}
//             <div>
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
//                   <MessageSquare className="text-white" size={24} />
//                 </div>
//                 <h2 className="text-2xl font-semibold text-white">Assignments (Optional)</h2>
//               </div>
//               <p className="text-gray-400 mb-6">
//                 Fill in details for any of the 3 possible assignments — you can leave them blank if not applicable.
//               </p>

//               {formData.assignments.map((ass, index) => (
//                 <div key={index} className="mb-8 p-5 bg-gray-900/50 rounded-xl border border-gray-800">
//                   <h3 className="text-lg font-semibold text-blue-300 mb-4">
//                     Assignment {index + 1}
//                   </h3>
//                   <div className="space-y-4">
//                     <div>
//                       <label htmlFor={`projectName-${index}`} className="block text-gray-300 mb-2 font-medium">
//                         Project / Assignment Name
//                       </label>
//                       <input
//                         id={`projectName-${index}`}
//                         value={ass.projectName}
//                         onChange={(e) => handleAssignmentChange(index, 'projectName', e.target.value)}
//                         placeholder="e.g., E-commerce Product Page"
//                         className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
//                       />
//                     </div>

//                     <div>
//                       <label htmlFor={`github-${index}`} className="block text-gray-300 mb-2 font-medium">
//                         GitHub Link
//                       </label>
//                       <input
//                         id={`github-${index}`}
//                         value={ass.github}
//                         onChange={(e) => handleAssignmentChange(index, 'github', e.target.value)}
//                         placeholder="https://github.com/username/repo"
//                         className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
//                       />
//                     </div>

//                     <div>
//                       <label htmlFor={`hosted-${index}`} className="block text-gray-300 mb-2 font-medium">
//                         Hosted / Live Link or LinkedIn
//                       </label>
//                       <input
//                         id={`hosted-${index}`}
//                         value={ass.hosted}
//                         onChange={(e) => handleAssignmentChange(index, 'hosted', e.target.value)}
//                         placeholder="https://your-project.vercel.app or LinkedIn post"
//                         className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <button
//               type="submit"
//               disabled={submitting || !currentMonth || currentMonth > 3 || loadingMonth}
//               className="w-full py-4 sm:py-6 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg sm:text-xl font-bold rounded-lg transition-all duration-500 shadow-lg flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
//             >
//               {submitting ? (
//                 <>
//                   <Loader2 className="animate-spin" size={28} />
//                   Submitting...
//                 </>
//               ) : (
//                 <>
//                   <Send size={28} />
//                   Submit Assignment for Month {currentMonth || '?'}
//                 </>
//               )}
//             </button>
//           </form>
//         </div>
//       </div>

//       <ToastContainer position="top-center" theme="dark" autoClose={5000} />
//     </div>
//   );
// };

// export default Project;
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, Send, User, Briefcase, Link2, MessageSquare, Calendar } from 'lucide-react';

const Project = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    mobile: '',
    domain: '',
    duration: '',
    assignments: [
      { projectName: '', github: '', hosted: '' },
      { projectName: '', github: '', hosted: '' },
      { projectName: '', github: '', hosted: '' }
    ]
  });

  const [currentMonth, setCurrentMonth] = useState(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const domains = [
    'Frontend Development', 'Backend Development', 'MERN Stack Development',
    'C Programming', 'Python Development', 'Artificial Intelligence',
    'Figma or UI/UX', 'Data Science', 'Machine Learning', 'Full Stack Development'
  ];
  const durations = ['1 Month', '2 Months', '3 Months'];

  useEffect(() => {
    const fetchMonth = async () => {
      if (!formData.studentId?.trim()) {
        setCurrentMonth(null);
        return;
      }

      setLoadingMonth(true);

      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/project/current-month/${encodeURIComponent(formData.studentId)}`;
        const res = await axios.get(url);

        if (res.data.canSubmit) {
          setCurrentMonth(res.data.currentMonth);
        } else {
          setCurrentMonth(4); // all done
        }
      } catch (err) {
        console.error("Month fetch failed:", err);
        setCurrentMonth(null);
      } finally {
        setLoadingMonth(false);
      }
    };

    const timer = setTimeout(fetchMonth, 600);
    return () => clearTimeout(timer);
  }, [formData.studentId]);

  const getMonthDisplay = () => {
    if (loadingMonth) return 'Checking...';
    if (currentMonth === 4) return 'All assignments already submitted';
    if (currentMonth) return `Assignment for Month ${currentMonth}`;
    return 'Enter Student ID to see which month you are submitting for';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAssignmentChange = (index, field, value) => {
    const newAssignments = [...formData.assignments];
    newAssignments[index][field] = value;
    setFormData({ ...formData, assignments: newAssignments });
  };

  const validateAssignments = () => {
    const ass1 = formData.assignments[0];
    const ass2 = formData.assignments[1];

    if (!ass1.projectName?.trim() || !ass1.github?.trim()) {
      toast.error('Assignment 1: Project Name and GitHub Link are required!');
      return false;
    }

    if (!ass2.projectName?.trim() || !ass2.github?.trim()) {
      toast.error('Assignment 2: Project Name and GitHub Link are required!');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      name: '',
      email: '',
      mobile: '',
      domain: '',
      duration: '',
      assignments: [
        { projectName: '', github: '', hosted: '' },
        { projectName: '', github: '', hosted: '' },
        { projectName: '', github: '', hosted: '' }
      ]
    });
    setCurrentMonth(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentMonth || currentMonth > 3) {
      toast.error('Cannot submit: Invalid month or all submissions completed');
      return;
    }

    if (!validateAssignments()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        assignments: formData.assignments.filter(
          a => a.projectName?.trim() || a.github?.trim() || a.hosted?.trim()
        )
      };

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/project/submit`, payload);

      if (res.data.order) {
        // Payment flow (final month)
        const options = {
          key: res.data.key,
          amount: res.data.order.amount,
          currency: 'INR',
          order_id: res.data.order.id,
          handler: async function (response) {
            try {
              const verifyRes = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/project/verify`, {
                response,
                ...payload
              });

              // Success → show toast + alert-style toast + reset
              toast.success(verifyRes.data.message || 'Payment successful! Final assignment submitted.');
              toast.success(
                "🎉 All monthly tasks completed successfully!\nNo more submissions needed.",
                {
                  autoClose: 8000,
                  icon: '🏆',
                  style: {
                    background: '#10b981',
                    color: 'white',
                    fontWeight: 'bold'
                  }
                }
              );

              resetForm();
            } catch (err) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.mobile
          },
          theme: { color: '#3399cc' }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Direct success (non-final months)
        toast.success(res.data.message || 'Assignment submitted successfully!');
        toast.success("Form has been reset for next use.", {
          autoClose: 5000
        });

        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950 opacity-40"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 pt-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
            Project / Assignment Submission
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Submit your monthly internship assignments. Assignment 1 & 2 require Project Name + GitHub Link.
          </p>
        </div>

        <div className="bg-slate-950 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-gray-800 hover:border-gray-700 transition-all duration-500">
          <div className="mb-8 p-4 bg-blue-900/30 rounded-xl border border-blue-700/40 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Calendar className="text-blue-400" size={28} />
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {getMonthDisplay()}
              </h2>
            </div>
            <p className="text-blue-300 text-sm">
              {currentMonth === 4 
                ? "You've already completed all required submissions!" 
                : "Enter your Student ID to see which month you're submitting for"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 lg:space-y-12">
            {/* Student Details */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                  <User className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-semibold text-white">Student Details (Required)</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="studentId" className="block text-gray-300 mb-2 font-medium">Student ID *</label>
                  <input
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    placeholder="e.g., CN/INT/2026/001"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-gray-300 mb-2 font-medium">Full Name *</label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-300 mb-2 font-medium">Email Address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="mobile" className="block text-gray-300 mb-2 font-medium">Mobile Number *</label>
                  <input
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    placeholder="10-digit number"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Internship Details */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                  <Briefcase className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-semibold text-white">Internship Details (Required)</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="domain" className="block text-gray-300 mb-2 font-medium">Domain *</label>
                  <select
                    id="domain"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Domain</option>
                    {domains.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="duration" className="block text-gray-300 mb-2 font-medium">Duration *</label>
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Duration</option>
                    {durations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Assignments */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                  <MessageSquare className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-semibold text-white">Assignments</h2>
              </div>

              <p className="text-gray-400 mb-6">
                Assignment 1 & 2: <strong>Project Name + GitHub Link are required</strong>.<br />
                Assignment 3: Completely optional — you can leave it blank.
              </p>

              {formData.assignments.map((ass, index) => (
                <div 
                  key={index} 
                  className={`mb-8 p-5 rounded-xl border text-white ${
                    index === 2 
                      ? 'bg-gray-900/30 border-gray-700' 
                      : 'bg-gray-900/50 border-blue-800/50'
                  }`}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    Assignment {index + 1}
                    {index < 2 && (
                      <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-1 rounded-full">
                        Required
                      </span>
                    )}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label 
                        htmlFor={`projectName-${index}`} 
                        className="block text-gray-300 mb-2 font-medium"
                      >
                        Project / Assignment Name
                        {index < 2 && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <input
                        id={`projectName-${index}`}
                        value={ass.projectName}
                        onChange={(e) => handleAssignmentChange(index, 'projectName', e.target.value)}
                        placeholder="e.g., E-commerce Product Page"
                        required={index < 2}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label 
                        htmlFor={`github-${index}`} 
                        className="block text-gray-300 mb-2 font-medium"
                      >
                        GitHub Link
                        {index < 2 && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <input
                        id={`github-${index}`}
                        value={ass.github}
                        onChange={(e) => handleAssignmentChange(index, 'github', e.target.value)}
                        placeholder="https://github.com/username/repo"
                        required={index < 2}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label 
                        htmlFor={`hosted-${index}`} 
                        className="block text-gray-300 mb-2 font-medium"
                      >
                        Hosted / Live Link or LinkedIn (optional)
                      </label>
                      <input
                        id={`hosted-${index}`}
                        value={ass.hosted}
                        onChange={(e) => handleAssignmentChange(index, 'hosted', e.target.value)}
                        placeholder="https://your-project.vercel.app or LinkedIn post"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting || !currentMonth || currentMonth > 3 || loadingMonth}
              className="w-full py-4 sm:py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg sm:text-xl font-bold rounded-lg transition-all duration-500 shadow-lg flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={28} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={28} />
                  Submit Assignment for Month {currentMonth || '?'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer 
        position="top-center" 
        theme="dark" 
        autoClose={6000} 
        limit={3}
      />
    </div>
  );
};

export default Project;