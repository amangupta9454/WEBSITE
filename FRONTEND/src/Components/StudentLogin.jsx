import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2, LogIn, Mail, Lock, Badge } from "lucide-react";

const StudentLogin = () => {
  const [formData, setFormData] = useState({ email: "", studentId: "" });
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        formData,
      );

      localStorage.setItem("studentToken", response.data.token);
      localStorage.setItem("studentData", JSON.stringify(response.data.user));
      localStorage.setItem("studentId", response.data.user.studentId);

      toast.success("Login Successful!");

      setTimeout(() => {
        if (response.data.user.isFirstLogin) {
          navigate("/setup-password");
        } else {
          navigate("/student-dashboard");
        }
      }, 1500);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Login failed. Check credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password`,
        { email: forgotEmail },
      );
      toast.success("OTP sent to your email!");
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-password`,
        {
          email: forgotEmail,
          otp: forgotOtp,
          newPassword,
        },
      );
      toast.success("Password reset successfully! You can now log in.");
      setIsForgotPassword(false);
      setForgotStep(1);
      setForgotEmail("");
      setForgotOtp("");
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans flex items-center justify-center py-12 px-4 sm:px-6">
      {/* Dynamic Background Elements matching Project.jsx */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-100/50 to-transparent"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute top-48 -left-24 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isForgotPassword ? "Reset Password" : "Student Login"}
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              {isForgotPassword
                ? "We will send an OTP to your email"
                : "Access your internship dashboard"}
            </p>
          </div>

          {!isForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="block text-slate-700 mb-2 text-sm font-semibold">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                    size={20}
                  />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-slate-700 mb-2 text-sm font-semibold">
                  Student ID
                </label>
                <div className="relative">
                  <Badge
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                    size={20}
                  />
                  <input
                    name="studentId"
                    type="text"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    placeholder="e.g., CN/INT/2026/001"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-slate-500">
                    Check your application confirmation email
                  </p>
                  {/* <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Forgot Student ID?
                  </button> */}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-70 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />{" "}
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn size={24} /> Log In
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {forgotStep === 1 ? (
                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div className="group">
                    <label className="block text-slate-700 mb-2 text-sm font-semibold">
                      Registered Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                        size={20}
                      />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-70 flex items-center justify-center gap-2 text-lg"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />{" "}
                        Sending...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="group">
                    <label className="block text-slate-700 mb-2 text-sm font-semibold">
                      Enter 6-digit OTP
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                        size={20}
                      />
                      <input
                        type="text"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        placeholder="123456"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-slate-700 mb-2 text-sm font-semibold">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                        size={20}
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-70 flex items-center justify-center gap-2 text-lg"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />{" "}
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>
              )}
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotStep(1);
                  }}
                  className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  &larr; Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default StudentLogin;
