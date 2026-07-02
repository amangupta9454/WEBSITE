import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, Send, User, Briefcase, MessageSquare, Calendar } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    studentId: location.state?.studentId || '',
    name: '',
    email: '',
    domain: '',
    duration: '',
    assignments: [
      { projectName: location.state?.taskName || '', github: '', hosted: '' },
      { projectName: '', github: '', hosted: '' },
      { projectName: '', github: '', hosted: '' }
    ]
  });

  // Track which fields were auto-filled → to make them read-only
  const [autoFilledFields, setAutoFilledFields] = useState({ name: false, email: false, domain: false, duration: false });

  const [currentMonth, setCurrentMonth] = useState(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const domains = [
    'Frontend Development', 'Backend Development', 'MERN Stack Development',
    'C Programming', 'Python Development', 'Artificial Intelligence',
    'Figma or UI/UX', 'Data Science', 'Machine Learning', 'Full Stack Development'
  ];
  const durations = ['1 Month', '2 Months', '3 Months'];

  // Fetch month + student details when studentId changes
  useEffect(() => {
    const fetchStudentData = async () => {
      const sid = formData.studentId?.trim();
      if (!sid) {
        setCurrentMonth(null);
        // Reset auto-filled status when studentId is cleared
        setAutoFilledFields({ name: false, email: false, domain: false, duration: false });
        return;
      }

      setLoadingMonth(true);

      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/project/current-month/${encodeURIComponent(sid)}`;
        const res = await axios.get(url);

        console.log("Backend response:", res.data);

        if (res.data.canSubmit) {
          setCurrentMonth(res.data.currentMonth);

          // Autofill and mark fields as auto-filled (only if not already filled manually)
          const newAutoFilled = { name: false, email: false, domain: false, duration: false };

          setFormData((prev) => {
            const updates = { ...prev };

            if (res.data.name && !prev.name) {
              updates.name = res.data.name;
              newAutoFilled.name = true;
            }
            if (res.data.email && !prev.email) {
              updates.email = res.data.email;
              newAutoFilled.email = true;
            }
            if (res.data.domain && !prev.domain) {
              updates.domain = res.data.domain;
              newAutoFilled.domain = true;
            }
            if (res.data.duration && !prev.duration) {
              updates.duration = res.data.duration;
              newAutoFilled.duration = true;
            }

            return updates;
          });

          setAutoFilledFields(newAutoFilled);

          if (newAutoFilled.name || newAutoFilled.email || newAutoFilled.domain || newAutoFilled.duration) {
            toast.info("Student details auto-filled from your registration!", {
              autoClose: 5000,
              position: "top-right",
              theme: "light"
            });
          }
        } else {
          setCurrentMonth(4);
          toast.info("All assignments already submitted!", {
            autoClose: 6000
          });
        }
      } catch (err) {
        console.error("Fetch failed:", err);
        toast.error(
          err.response?.data?.message || "Could not fetch your details. Please check Student ID."
        );
        setCurrentMonth(null);
      } finally {
        setLoadingMonth(false);
      }
    };

    // Debounce: wait 600ms after typing/pasting stops
    const timer = setTimeout(fetchStudentData, 600);
    return () => clearTimeout(timer);
  }, [formData.studentId]);

  const getMonthDisplay = () => {
    if (loadingMonth) return 'Checking student details...';
    if (currentMonth === 4) return 'All assignments already submitted';
    if (currentMonth) return `Assignment for Month ${currentMonth}`;
    return 'Enter Intern ID/Student ID to load your details & month';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
      domain: '',
      duration: '',
      assignments: [
        { projectName: '', github: '', hosted: '' },
        { projectName: '', github: '', hosted: '' },
        { projectName: '', github: '', hosted: '' }
      ]
    });
    setCurrentMonth(null);
    setAutoFilledFields({ name: false, email: false, domain: false, duration: false });
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
          (a) => a.projectName?.trim() || a.github?.trim() || a.hosted?.trim()
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
              const verifyRes = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/project/verify`,
                { response, ...payload }
              );

              // Final completion message (replaces normal success toast)
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
              setTimeout(() => navigate('/dashboard', { state: { showConfetti: true } }), 1000);
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
        // Check if it was the final submission based on duration
        const totalDuration = parseInt(formData.duration.split(" ")[0]);
        if (currentMonth === totalDuration) {
          toast.success(
            "🎉 Congratulations! You have completed all assignments for your internship!",
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
          setTimeout(() => navigate('/dashboard', { state: { showConfetti: true } }), 1000);
        } else {
          // Direct success for normal month
          toast.success(res.data.message || 'Assignment submitted successfully!');
          toast.success("Redirecting to dashboard...", { autoClose: 2000 });
          setTimeout(() => navigate('/dashboard'), 1000);
        }
        
        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <ToastContainer position="top-center" autoClose={3000} />
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-100/50 to-transparent"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute top-48 -left-24 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-5xl mx-auto relative z-10 mt-10">
        
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold tracking-wide mb-4 shadow-sm border border-blue-200">
            Monthly Submissions
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Submit Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Project</span>
          </h1>
          <p className="text-slate-500 text-lg sm:text-xl max-w-2xl mx-auto">
            Paste your Intern ID / Student ID to instantly load your profile. Fill out the details below to submit your monthly assignments.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-6 sm:p-10 lg:p-14 border border-white relative">
          
          {/* Status Badge */}
          <div className="mb-10 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50 flex flex-col items-center justify-center text-center shadow-inner">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-full shadow-sm">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                {getMonthDisplay()}
              </h2>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              {currentMonth === 4
                ? "You've successfully completed all required submissions!"
                : "Your personal details will lock automatically after entering your ID"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Student Details Section */}
            <div className="bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                  <User className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Student Details</h2>
                  <p className="text-sm text-slate-500">Enter ID to auto-fill</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                <div className="col-span-1 lg:col-span-2">
                  <label htmlFor="studentId" className="block text-slate-700 mb-2 font-medium">
                    Intern ID / Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    placeholder="e.g., CN/INT/2026/001"
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-lg"
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-slate-700 mb-2 font-semibold text-sm uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    readOnly={autoFilledFields.name}
                    placeholder="Your full name"
                    className={`w-full px-5 py-3.5 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-sm ${
                      autoFilledFields.name
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-slate-700 mb-2 font-semibold text-sm uppercase tracking-wide">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    readOnly={autoFilledFields.email}
                    placeholder="your.email@example.com"
                    className={`w-full px-5 py-3.5 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-sm ${
                      autoFilledFields.email
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                </div>


              </div>
            </div>

            {/* Internship Details Section */}
            <div className="bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                  <Briefcase className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Internship Details</h2>
                  <p className="text-sm text-slate-500">Select your program context</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                <div>
                  <label htmlFor="domain" className="block text-slate-700 mb-2 font-semibold text-sm uppercase tracking-wide">
                    Domain <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="domain"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                    disabled={autoFilledFields.domain}
                    className={`w-full px-5 py-3.5 border rounded-xl text-slate-900 focus:outline-none transition-all shadow-sm appearance-none ${
                      autoFilledFields.domain
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-white border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer'
                    }`}
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="" disabled>Select Domain</option>
                    {domains.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="duration" className="block text-slate-700 mb-2 font-semibold text-sm uppercase tracking-wide">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    disabled={autoFilledFields.duration}
                    className={`w-full px-5 py-3.5 border rounded-xl text-slate-900 focus:outline-none transition-all shadow-sm appearance-none ${
                      autoFilledFields.duration
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-white border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer'
                    }`}
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="" disabled>Select Duration</option>
                    {durations.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Assignments Section */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30">
                  <MessageSquare className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>
                  <p className="text-sm text-slate-500">Provide links to your completed tasks</p>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-8">
                <p className="text-amber-800 text-sm font-medium">
                  <strong>Assignment 1 & 2:</strong> Project Name & GitHub Link are mandatory.<br />
                  <strong>Assignment 3:</strong> Completely optional.
                </p>
              </div>

              <div className="space-y-6">
                {formData.assignments.map((ass, index) => (
                  <div
                    key={index}
                    className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 hover:shadow-md ${
                      index === 2 
                        ? 'bg-slate-50 border-slate-200 border-dashed' 
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm text-white ${index === 2 ? 'bg-slate-400' : 'bg-emerald-500'}`}>
                          {index + 1}
                        </span>
                        Assignment {index + 1}
                      </h3>
                      {index < 2 && (
                        <span className="text-xs font-bold uppercase tracking-wider bg-red-100 text-red-600 px-3 py-1 rounded-full">
                          Required
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label htmlFor={`projectName-${index}`} className="block text-slate-700 mb-2 font-semibold text-sm">
                          Project Name {index < 2 && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          id={`projectName-${index}`}
                          value={ass.projectName}
                          onChange={(e) => handleAssignmentChange(index, 'projectName', e.target.value)}
                          placeholder="e.g., E-commerce Dashboard"
                          required={index < 2}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label htmlFor={`github-${index}`} className="block text-slate-700 mb-2 font-semibold text-sm">
                          GitHub Link {index < 2 && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          id={`github-${index}`}
                          value={ass.github}
                          onChange={(e) => handleAssignmentChange(index, 'github', e.target.value)}
                          placeholder="https://github.com/..."
                          required={index < 2}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label htmlFor={`hosted-${index}`} className="block text-slate-700 mb-2 font-semibold text-sm">
                          Hosted Link (Optional)
                        </label>
                        <input
                          id={`hosted-${index}`}
                          value={ass.hosted}
                          onChange={(e) => handleAssignmentChange(index, 'hosted', e.target.value)}
                          placeholder="https://vercel.app/..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting || !currentMonth || currentMonth > 3 || loadingMonth}
                className="group relative w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:translate-x-[250%] transition-transform duration-700 ease-in-out" />
                
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Submit Assignment for Month {currentMonth || '?'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer position="top-right" theme="colored" autoClose={5000} limit={3} />
    </div>
  );
};

export default Project;