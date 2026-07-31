import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Sparkles,
  Award,
  Users,
  Star,
  Gift,
  Send,
  CheckCircle,
  ArrowLeft,
  Loader2,
  BookOpen,
  Building2,
  Mail,
  Phone,
  User,
  MessageSquare
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const CampusAmbassadorApply = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    college: "",
    yearBranch: "",
    reason: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Auto-fill from logged-in student info if available
    const userStr = localStorage.getItem("user") || localStorage.getItem("interview_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setFormData((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          mobile: u.mobile !== "Google Auth" ? (u.mobile || prev.mobile) : prev.mobile,
          college: u.ambassadorCollege || prev.college
        }));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.mobile || !formData.college || !formData.yearBranch) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
      const res = await axios.post(`${apiUrl}/api/student/ambassador-apply`, formData);

      if (res.data.success) {
        setSubmitted(true);
        toast.success("Application submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting ambassador application:", error);
      toast.error(error.response?.data?.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white font-semibold text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-purple-400" />
          <span className="font-black text-white text-base tracking-wider uppercase">
            Code-A-Nova <span className="text-purple-400">Ambassador</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-12">
        {/* Banner Section */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-purple-500/20 group">
          <img
            src="/ambassador-poster.jpg"
            alt="Code-A-Nova Ambassador Program"
            className="w-full h-auto object-cover max-h-[500px] w-full transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-6 sm:p-10">
            <span className="bg-purple-600/90 text-white font-black text-xs uppercase px-3 py-1 rounded-full w-fit mb-2 backdrop-blur-md tracking-widest border border-purple-400/40">
              Join the Movement
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
              Be the Spark on Your Campus!
            </h1>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
              Represent. Inspire. Innovate. Become the official voice of Code-A-Nova at your college, build your leadership skills, and earn exclusive rewards & recognition!
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-purple-500/20 space-y-2 hover:border-purple-500/50 transition-all">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl w-fit">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Official Certificate</h3>
            <p className="text-xs text-slate-400">Receive a prestigious Campus Ambassador Certificate of Excellence from Code-A-Nova.</p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-indigo-500/20 space-y-2 hover:border-indigo-500/50 transition-all">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl w-fit">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Leadership Experience</h3>
            <p className="text-xs text-slate-400">Lead college workshops, build strong tech communities, and boost your resume.</p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-amber-500/20 space-y-2 hover:border-amber-500/50 transition-all">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl w-fit">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Exclusive Perks</h3>
            <p className="text-xs text-slate-400">Get early access to premium AI resume tools, mock interviews, and mentorship opportunities.</p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-emerald-500/20 space-y-2 hover:border-emerald-500/50 transition-all">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Rewards & Recognition</h3>
            <p className="text-xs text-slate-400">Earn stipends, cash rewards, swags, and leaderboard recognition for campus drives.</p>
          </div>
        </div>

        {/* Application Form Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-10 rounded-3xl border border-purple-800/40 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <span className="p-2 bg-purple-500/20 text-purple-300 rounded-xl inline-block mb-1 border border-purple-500/30">
              <Sparkles className="w-6 h-6" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Apply for Campus Ambassador
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Fill out the form below. Once approved by our team, your Ambassador Tab will automatically activate in your Student Dashboard!
            </p>
          </div>

          {submitted ? (
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-8 rounded-2xl text-center space-y-4 max-w-md mx-auto animate-in fade-in duration-500">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Application Submitted!</h3>
              <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed">
                Thank you for applying! Our team will review your application shortly. You will receive an official email confirmation as soon as your account is approved.
              </p>
              <div className="pt-2">
                <Link
                  to="/student-login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg"
                >
                  Go to Student Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" /> Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-purple-900/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-2 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" /> Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-purple-900/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-400" /> Mobile / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    placeholder="10-digit WhatsApp Number"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-purple-900/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" /> College / Institute Name *
                  </label>
                  <input
                    type="text"
                    name="college"
                    required
                    placeholder="e.g. Hi-Tech Institute of Technology"
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-purple-900/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-purple-200 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Year of Study & Branch *
                  </label>
                  <input
                    type="text"
                    name="yearBranch"
                    required
                    placeholder="e.g. 3rd Year - B.Tech Computer Science"
                    value={formData.yearBranch}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-purple-900/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-purple-200 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Why do you want to join as a Campus Ambassador? (Optional)
                  </label>
                  <textarea
                    name="reason"
                    rows={3}
                    placeholder="Tell us about your leadership experience, college clubs, or why you want to represent Code-A-Nova..."
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-purple-900/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Application Now
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        © 2026 Code-A-Nova. All rights reserved. Campus Ambassador Program.
      </footer>
    </div>
  );
};

export default CampusAmbassadorApply;
