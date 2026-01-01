import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import emailjs from '@emailjs/browser';
import { Loader2, FileText, Send } from 'lucide-react';

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

      toast.success('🎉 Internship application submitted successfully!');

      // Send confirmation email
      await sendConfirmationEmail();

      // Reset form
      setFormData({
        name: '', email: '', mobile: '', whatsapp: '', course: '', branch: '',
        year: '', college: '', state: '', passingYear: '', domain: '', duration: '',
        portfolio: '', github: '', linkedin: '', whyHire: '', hearAbout: '', resumeUrl: ''
      });
      setResumeFile(null);

      // Force dashboard refresh when user visits it next
      toast.info('Check your dashboard for updated application!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-12">Internship Application Form</h1>

        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Personal Information */}
            <div>
              <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white mb-2">Full Name *</label>
                  <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20" placeholder="Enter your name" />
                </div>
                <div>
                  <label className="block text-white mb-2">Email Address *</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-white mb-2">Mobile Number *</label>
                  <input name="mobile" value={formData.mobile} onChange={handleChange} required maxLength="10" pattern="\d{10}" className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white" placeholder="10-digit number" />
                </div>
                <div>
                  <label className="block text-white mb-2">WhatsApp Number *</label>
                  <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} required maxLength="10" pattern="\d{10}" className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white" placeholder="10-digit number" />
                </div>
              </div>
            </div>

            {/* Academic Details */}
            <div>
              <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Academic Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white mb-2">Course *</label>
                  <input name="course" value={formData.course} onChange={handleChange} required className="input-field" placeholder="e.g., B.Tech" />
                </div>
                <div>
                  <label className="block text-white mb-2">Branch *</label>
                  <input name="branch" value={formData.branch} onChange={handleChange} required className="input-field" placeholder="e.g., CSE" />
                </div>
                <div>
                  <label className="block text-white mb-2">Current Year *</label>
                  <input name="year" value={formData.year} onChange={handleChange} required className="input-field" placeholder="e.g., 3rd Year" />
                </div>
                <div>
                  <label className="block text-white mb-2">College Name *</label>
                  <input name="college" value={formData.college} onChange={handleChange} required className="input-field" placeholder="Full college name" />
                </div>
                <div>
                  <label className="block text-white mb-2">State *</label>
                  <select name="state" value={formData.state} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white">
                    <option value="">Select state</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Year of Passing *</label>
                  <input name="passingYear" value={formData.passingYear} onChange={handleChange} required className="input-field" placeholder="e.g., 2027" />
                </div>
              </div>
            </div>

            {/* Internship Preferences */}
            <div>
              <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Internship Preferences</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white mb-2">Preferred Domain *</label>
                  <select name="domain" value={formData.domain} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white">
                    <option value="">Choose domain</option>
                    {domains.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Preferred Duration *</label>
                  <select name="duration" value={formData.duration} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white">
                    <option value="">Select duration</option>
                    {durations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Optional Links */}
            <div>
              <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Links (Optional)</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-white mb-2">Portfolio URL</label>
                  <input name="portfolio" value={formData.portfolio} onChange={handleChange} className="input-field" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-white mb-2">GitHub URL</label>
                  <input name="github" value={formData.github} onChange={handleChange} className="input-field" placeholder="https://github.com/..." />
                </div>
                <div>
                  <label className="block text-white mb-2">LinkedIn URL</label>
                  <input name="linkedin" value={formData.linkedin} onChange={handleChange} className="input-field" placeholder="https://linkedin.com/in/..." />
                </div>
              </div>
            </div>

            {/* Why Hire & Hear About */}
            <div>
              <label className="block text-white mb-2">Why we choose you? (Min 10 words) *</label>
              <textarea name="whyHire" value={formData.whyHire} onChange={handleChange} rows="4" required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white" placeholder="Tell us about your skills..." />
            </div>

            <div>
              <label className="block text-white mb-2">How did you hear about us? *</label>
              <select name="hearAbout" value={formData.hearAbout} onChange={handleChange} required className="w-full px-5 py-3 bg-white/10 border border-white/30 rounded-xl text-white">
                <option value="">Select option</option>
                {hearOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-white mb-4 text-xl">Upload Resume (PDF only, max 500 KB) *</label>
              <div className="border-2 border-dashed border-cyan-500/50 rounded-2xl p-10 text-center">
                <FileText className="mx-auto text-cyan-400 mb-4" size={60} />
                <label className="cursor-pointer">
                  <span className="px-8 py-4 bg-linear-to-r from-cyan-500 to-blue-500 text-white text-lg font-semibold rounded-full hover:from-cyan-400 hover:to-blue-400 transition">
                    {uploading ? 'Uploading...' : 'Choose PDF File'}
                  </span>
                  <input type="file" accept="application/pdf" onChange={handleResumeUpload} className="hidden" disabled={uploading} />
                </label>
                {resumeFile && <p className="mt-6 text-green-400 text-lg">✅ {resumeFile.name} uploaded successfully!</p>}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full py-5 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-xl font-bold rounded-2xl transition-all duration-300 shadow-2xl flex items-center justify-center"
            >
              {submitting ? <Loader2 className="animate-spin mr-3" size={28} /> : <Send className="mr-3" size={28} />}
              {submitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer position="top-center" theme="dark" autoClose={5000} />
    </div>
  );
};

export default Registration;