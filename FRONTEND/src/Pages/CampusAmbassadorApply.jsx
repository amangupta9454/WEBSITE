import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Award,
  Users,
  Star,
  Gift,
  Send,
  BookOpen,
  Building2,
  Mail,
  Phone,
  User,
  MessageSquare,
  CheckCircle,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import SEO from '../Components/SEO';
import { AnimatedSubmitButton } from "../Components/animations/AnimatedSubmitButton";

const CampusAmbassadorApply = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    college: "",
    yearBranch: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const userStr =
      localStorage.getItem("user") ||
      localStorage.getItem("interview_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setFormData((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          mobile:
            u.mobile !== "Google Auth" ? u.mobile || prev.mobile : prev.mobile,
          college: u.ambassadorCollege || prev.college,
        }));
      } catch (_) {}
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.mobile ||
      !formData.college ||
      !formData.yearBranch
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      setLoading(true);
      const apiUrl =
        import.meta.env.VITE_BACKEND_URL ||
        import.meta.env.VITE_API_URL ||
        "";
      const res = await axios.post(
        `${apiUrl}/api/student/ambassador-apply`,
        formData
      );
      if (res.data.success) {
        setSubmitted(true);
        toast.success("Application submitted successfully!");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to submit application. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-10 px-4">
      <SEO 
        title="Campus Ambassador Program | Code-A-Nova"
        description="Join the Code-A-Nova Campus Ambassador Program and build experience in technology, community and professional development."
        canonicalUrl="https://code-a-nova.online/campus-ambassador"
      />
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Poster Banner */}
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <img
            src="/ambassador-poster.jpg"
            alt="Code-A-Nova Ambassador Program"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Perks Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Award className="w-5 h-5" />, label: "Official Certificate", color: "purple" },
            { icon: <Users className="w-5 h-5" />, label: "Leadership Experience", color: "indigo" },
            { icon: <Star className="w-5 h-5" />, label: "Resume Enhancement", color: "amber" },
            { icon: <Gift className="w-5 h-5" />, label: "Campus Recognition", color: "emerald" },
          ].map(({ icon, label, color }) => (
            <div
              key={label}
              className={`bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center text-center gap-2 shadow-sm`}
            >
              <span className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
                {icon}
              </span>
              <p className="text-xs font-bold text-gray-700">{label}</p>
            </div>
          ))}
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 sm:p-10">
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-bold uppercase px-3 py-1 rounded-full mb-3">
              <GraduationCap className="w-4 h-4" /> Apply Now
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              Become a Campus Ambassador
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Fill the form below. Admin will review your application and notify you via email once approved.
            </p>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500" />
              <h2 className="text-xl font-bold text-gray-800">
                Application Submitted!
              </h2>
              <p className="text-gray-500 text-sm max-w-sm">
                Thank you! Our team will review your application shortly and you
                will receive a confirmation email once approved.
              </p>
              <Link
                to="/student-login"
                className="mt-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all"
              >
                Go to Student Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                    <User className="w-3.5 h-3.5 text-purple-500" /> Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-500" /> Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-500" /> WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    placeholder="10-digit WhatsApp Number"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  />
                </div>

                {/* College */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" /> College / Institute *
                  </label>
                  <input
                    type="text"
                    name="college"
                    required
                    placeholder="e.g. Hi-Tech Institute of Technology"
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  />
                </div>

                {/* Year & Branch */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Year of Study & Branch *
                  </label>
                  <input
                    type="text"
                    name="yearBranch"
                    required
                    placeholder="e.g. 3rd Year - B.Tech Computer Science"
                    value={formData.yearBranch}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  />
                </div>

                {/* Reason */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-500" /> Why do you want to be a Campus Ambassador?{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </label>
                  <textarea
                    name="reason"
                    rows={3}
                    placeholder="Tell us about your leadership experience, college clubs, or why you want to represent Code-A-Nova..."
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none"
                  />
                </div>
              </div>

              <AnimatedSubmitButton
                type="submit"
                isLoading={loading}
                disabled={loading}
                className="w-full h-12 mt-4"
              >
                <div className="flex h-full w-full items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-200 transition-all">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Application
                    </>
                  )}
                </div>
              </AnimatedSubmitButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusAmbassadorApply;
