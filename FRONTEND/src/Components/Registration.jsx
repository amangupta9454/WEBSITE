import { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import emailjs from '@emailjs/browser';
import { Loader2, Send, User, GraduationCap, Briefcase, Link2, MessageSquare, CheckCircle2, Calendar } from 'lucide-react';

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
    batch: '', // New field
  });

  const [submitting, setSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'].sort();

  const domains = ['Frontend Development', 'Backend Development', 'MERN Stack Development', 'C Programming', 'Python Development', 'Artificial Intelligence', 'Figma or UI/UX', 'Data Science', 'Machine Learning','Full Stack Development'];
  const durations = ['1 Month', '2 Months', '3 Months'];
  const hearOptions = ['LinkedIn', 'College', 'Friends/Students', 'Instagram', 'Website'];

  // Compute next 3 batch dates
 // Compute batches — only for the current month (until its last batch date passes)
const getNextBatches = () => {
  const today = new Date();           // current date & time
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();  // 0 = Jan, 1 = Feb, ...

  // Your fixed batch dates every month
  const batchDays = [5, 15, 25];

  const batches = [];

  for (let day of batchDays) {
    // Create date for this month's batch
    const batchDate = new Date(currentYear, currentMonth, day, 23, 59, 59); // end of day

    // Only add if batch date is today or in future
    if (batchDate >= today) {
      batches.push(
        batchDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      );
    }
  }

  // Agar current month mein koi bhi batch bachi nahi hai (sab pass ho chuke)
  // to automatically next month ki list ban jayegi
  if (batches.length === 0) {
    // Next month
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    for (let day of batchDays) {
      const batchDate = new Date(nextYear, nextMonth, day, 23, 59, 59);
      // Since we're in next month already, all will be future
      batches.push(
        batchDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      );
    }
  }

  return batches;
};

  const batchOptions = getNextBatches();

  // Animate in on mount
  useState(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
          batch: formData.batch, // Added
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      console.log('Confirmation email sent via EmailJS');
    } catch (error) {
      console.error('EmailJS failed:', error);
      toast.warn('Application submitted, but confirmation email could not be sent.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.batch) {
      toast.error('Please select a batch');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/register`,
        formData
      );

      toast.success(`Application submitted successfully! Your Student ID: ${response.data.studentId}`);

      await sendConfirmationEmail();

      // Reset form
      setFormData({
        name: '', email: '', mobile: '', whatsapp: '', course: '', branch: '',
        year: '', college: '', state: '', passingYear: '', domain: '', duration: '',
        portfolio: '', github: '', linkedin: '', whyHire: '', hearAbout: '', batch: ''
      });

    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
                <div className="group lg:col-span-2">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">Select Batch Start Date *</label>
                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    required
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-800">Choose upcoming batch</option>
                    {batchOptions.map(b => <option key={b} value={b} className="bg-gray-800">{b}</option>)}
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

            <button
              type="submit"
              disabled={submitting}
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
