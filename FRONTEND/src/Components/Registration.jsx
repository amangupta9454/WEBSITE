// src/components/Registration.jsx

import React, { useState, useRef } from 'react';
import {
  Mail, User, Phone, BookOpen, Building2, MapPin, Calendar,
  Link2, Github, Linkedin, FileText, Send
} from 'lucide-react';
import axios from 'axios';
import emailjs from '@emailjs/browser';

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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ].sort();

  const domains = [
    'Frontend', 'Backend', 'MERN Stack', 'C Programming', 'Python Programming',
    'AI & ML', 'Figma and UI/UX', 'Data Analytics'
  ];

  const durations = ['1 Month', '2 Months', '3 Months'];

  const hearOptions = ['LinkedIn', 'College', 'Friends/Students', 'Instagram', 'Website'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    console.log(`Field updated: ${name} = ${value}`);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file?.name, file?.type, file?.size ? `${(file.size / 1024).toFixed(2)} KB` : 'unknown');

    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only.');
      console.log('Invalid file type:', file.type);
      return;
    }

    if (file.size > 500 * 1024) {
      alert('File size must be less than 500 KB.');
      console.log('File too large:', file.size);
      return;
    }

    setResumeFile(file);
    setUploading(true);
    console.log('Uploading to Cloudinary...');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    uploadFormData.append('folder', 'internship-resumes');
    uploadFormData.append('resource_type', 'raw');
    uploadFormData.append('quality', 'auto');
    uploadFormData.append('fetch_format', 'auto');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
        { method: 'POST', body: uploadFormData }
      );

      const data = await response.json();
      console.log('Cloudinary response:', data);

      if (data.secure_url) {
        setFormData(prev => ({ ...prev, resumeUrl: data.secure_url }));
        console.log('Resume uploaded! URL:', data.secure_url);
        alert('Resume uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload resume. Try again.');
      setResumeFile(null);
      setFormData(prev => ({ ...prev, resumeUrl: '' }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    let tempErrors = {};

    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim()) tempErrors.email = 'Email is required';
    if (!/^\d{10}$/.test(formData.mobile)) tempErrors.mobile = 'Valid 10-digit mobile required';
    if (!/^\d{10}$/.test(formData.whatsapp)) tempErrors.whatsapp = 'Valid 10-digit WhatsApp required';
    if (!formData.course.trim()) tempErrors.course = 'Course is required';
    if (!formData.branch.trim()) tempErrors.branch = 'Branch is required';
    if (!formData.year.trim()) tempErrors.year = 'Current year is required';
    if (!formData.college.trim()) tempErrors.college = 'College name is required';
    if (!formData.state) tempErrors.state = 'State is required';
    if (!formData.passingYear.trim()) tempErrors.passingYear = 'Passing year is required';
    if (!formData.domain) tempErrors.domain = 'Domain is required';
    if (!formData.duration) tempErrors.duration = 'Duration is required';
    if (!formData.whyHire.trim() || formData.whyHire.trim().split(/\s+/).length < 10)
      tempErrors.whyHire = 'Minimum 10 words required';
    if (!formData.hearAbout) tempErrors.hearAbout = 'This field is required';
    if (!formData.resumeUrl) tempErrors.resumeUrl = 'Please upload your resume';

    setErrors(tempErrors);
    console.log('Validation:', Object.keys(tempErrors).length === 0 ? 'Passed' : 'Failed', tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started:', formData);

    if (!validate()) return;

    setLoading(true);

    try {
      // Save to backend
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/register`,
        formData
      );
      console.log('Backend saved:', response.data);

      // Send confirmation email via EmailJS
      try {
        console.log('Sending email via EmailJS...');
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
        console.log('EmailJS: Confirmation email sent!');
      } catch (emailError) {
        console.error('EmailJS failed:', emailError);
        // Don't block success if email fails
        alert('Application submitted successfully!\n(Note: Confirmation email may be delayed.)');
      }

      alert('Application submitted successfully! Check your email for confirmation.');

      // Reset form
      setFormData({
        name: '', email: '', mobile: '', whatsapp: '', course: '', branch: '',
        year: '', college: '', state: '', passingYear: '', domain: '', duration: '',
        portfolio: '', github: '', linkedin: '', whyHire: '', hearAbout: '', resumeUrl: ''
      });
      setResumeFile(null);
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = '';
      console.log('Form reset complete');

    } catch (error) {
      console.error('Submission error:', error.response?.data || error.message);
      alert('Error: ' + (error.response?.data?.message || 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Internship Application Form</h1>
          <p className="text-lg text-gray-600">Join our hands-on internship program and kickstart your career!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* === Personal Information === */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-indigo-700 flex items-center gap-3">
                <User className="w-7 h-7" /> Personal Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input name="name" value={formData.name} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your full name" />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input name="email" type="email" value={formData.email} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="you@example.com" />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input name="mobile" value={formData.mobile} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg"
                      placeholder="10-digit number" maxLength="10" />
                  </div>
                  {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input name="whatsapp" value={formData.whatsapp} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg"
                      placeholder="10-digit number" maxLength="10" />
                  </div>
                  {errors.whatsapp && <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>}
                </div>
              </div>
            </div>

            {/* === Academic Details === */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-indigo-700 flex items-center gap-3">
                <BookOpen className="w-7 h-7" /> Academic Details
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Course *</label><input name="course" value={formData.course} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., B.Tech" />{errors.course && <p className="text-red-500 text-sm mt-1">{errors.course}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Branch *</label><input name="branch" value={formData.branch} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., CSE" />{errors.branch && <p className="text-red-500 text-sm mt-1">{errors.branch}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Current Year *</label><input name="year" value={formData.year} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., 3rd Year" />{errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">College Name *</label><div className="relative"><Building2 className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" /><input name="college" value={formData.college} onChange={handleChange} className="w-full pl-12 pr-4 py-3 border rounded-lg" placeholder="Full college name" /></div>{errors.college && <p className="text-red-500 text-sm mt-1">{errors.college}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">State *</label><div className="relative"><MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" /><select name="state" value={formData.state} onChange={handleChange} className="w-full pl-12 pr-4 py-3 border rounded-lg"><option value="">Select state</option>{states.map(s => <option key={s} value={s}>{s}</option>)}</select></div>{errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Year of Passing *</label><div className="relative"><Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" /><input name="passingYear" value={formData.passingYear} onChange={handleChange} className="w-full pl-12 pr-4 py-3 border rounded-lg" placeholder="e.g., 2026" /></div>{errors.passingYear && <p className="text-red-500 text-sm mt-1">{errors.passingYear}</p>}</div>
              </div>
            </div>

            {/* === Internship Preferences === */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-indigo-700 flex items-center gap-3">
                <Send className="w-7 h-7" /> Internship Preferences
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Preferred Domain *</label><select name="domain" value={formData.domain} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg"><option value="">Choose domain</option>{domains.map(d => <option key={d} value={d}>{d}</option>)}</select>{errors.domain && <p className="text-red-500 text-sm mt-1">{errors.domain}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Preferred Duration *</label><select name="duration" value={formData.duration} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg"><option value="">Select duration</option>{durations.map(d => <option key={d} value={d}>{d}</option>)}</select>{errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}</div>
              </div>
            </div>

            {/* === Links & Resume === */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-indigo-700 flex items-center gap-3">
                <Link2 className="w-7 h-7" /> Links & Resume
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Portfolio (Optional)</label><div className="relative"><Link2 className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" /><input name="portfolio" value={formData.portfolio} onChange={handleChange} className="w-full pl-12 pr-4 py-3 border rounded-lg" placeholder="https://..." /></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">GitHub (Optional)</label><div className="relative"><Github className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" /><input name="github" value={formData.github} onChange={handleChange} className="w-full pl-12 pr-4 py-3 border rounded-lg" placeholder="https://github.com/..." /></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn (Optional)</label><div className="relative"><Linkedin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" /><input name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full pl-12 pr-4 py-3 border rounded-lg" placeholder="https://linkedin.com/in/..." /></div></div>

                {/* Resume Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Resume (PDF only, max 500 KB) *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label className="cursor-pointer">
                        <span className={`bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg inline-block ${uploading ? 'opacity-70' : ''}`}>
                          {uploading ? 'Uploading...' : 'Choose PDF File'}
                        </span>
                        <input type="file" accept="application/pdf" onChange={handleResumeUpload} className="hidden" ref={fileInputRef} disabled={uploading} />
                      </label>
                    </div>
                    {resumeFile && uploading && <p className="mt-4 text-sm text-indigo-600">Uploading...</p>}
                    {resumeFile && !uploading && formData.resumeUrl && (
                      <p className="mt-4 text-sm text-green-600 font-semibold">
                        ✅ {resumeFile.name} ({(resumeFile.size / 1024).toFixed(2)} KB) uploaded successfully!
                      </p>
                    )}
                    {errors.resumeUrl && <p className="text-red-500 text-sm mt-2">{errors.resumeUrl}</p>}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Securely uploaded and optimized.</p>
                </div>
              </div>
            </div>

            {/* === Additional Info === */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Why should we hire you? (Min 10 words) *</label>
                <textarea name="whyHire" value={formData.whyHire} onChange={handleChange} rows="4"
                  className="w-full px-4 py-3 border rounded-lg" placeholder="Share your skills and passion..." />
                {errors.whyHire && <p className="text-red-500 text-sm mt-1">{errors.whyHire}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How did you hear about us? *</label>
                <select name="hearAbout" value={formData.hearAbout} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
                  <option value="">Select option</option>
                  {hearOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors.hearAbout && <p className="text-red-500 text-sm mt-1">{errors.hearAbout}</p>}
              </div>
            </div>

            {/* === Submit === */}
            <div className="text-center pt-8">
              <button type="submit" disabled={loading || uploading}
                className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg transition hover:scale-105 disabled:opacity-70">
                {loading ? 'Submitting...' : 'Submit Application'}
                <Send className="w-6 h-6" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;