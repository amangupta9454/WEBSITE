import { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircle, XCircle, Loader2, FileSearch, Shield, Award, Calendar, Clock } from 'lucide-react';

const Verify = () => {
  const [formData, setFormData] = useState({
    certificateNumber: '',
    studentId: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.certificateNumber || !formData.studentId) {
      toast.error('Please enter both Certificate Number and Student ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/verify`, formData);
      setResult(res.data);
      toast.success('Certificate verified successfully!');
    } catch (err) {
      setResult(null);
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12 animate-fade-in pt-16">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-blue-500 to-cyan-500 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 shadow-lg shadow-blue-500/20 ">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
              Certificate Verification
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto px-4">
              Verify the authenticity of internship certificates instantly
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* Form Section */}
            <div className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/10 hover:border-white/20 transition-all duration-300 animate-slide-up">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <FileSearch className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">Enter Details</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Certificate Number
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="certificateNumber"
                      value={formData.certificateNumber}
                      onChange={handleChange}
                      placeholder="e.g., CERT-2024-001"
                      required
                      className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 transition-all outline-none group-hover:border-white/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Student ID
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="e.g., STU-2024-001"
                      required
                      className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 transition-all outline-none group-hover:border-white/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-4 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Verify Certificate
                    </>
                  )}
                </button>
              </form>

              {/* Info Cards */}
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10">
                <h3 className="text-sm font-medium text-slate-400 mb-4">Why verify?</h3>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Instant Validation</p>
                      <p className="text-xs text-slate-400 mt-1">Get immediate confirmation of certificate authenticity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                    <Award className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Secure & Reliable</p>
                      <p className="text-xs text-slate-400 mt-1">Protected verification system with encrypted data</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Section */}
            <div className="lg:sticky lg:top-8">
              {result ? (
                <div className="bg-linear-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-green-500/20 animate-slide-up">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">Verified Successfully</h3>
                      <p className="text-sm text-green-400 mt-0.5">Certificate is authentic</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-5">
                    <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10">
                      <p className="text-xs sm:text-sm text-slate-400 mb-1">Student Name</p>
                      <p className="text-base sm:text-lg font-semibold text-white">{result.studentName}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs sm:text-sm text-slate-400 mb-1">Domain</p>
                        <p className="text-sm sm:text-base font-medium text-white">{result.domain}</p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs sm:text-sm text-slate-400 mb-1">Duration</p>
                        <p className="text-sm sm:text-base font-medium text-white">{result.duration}</p>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <p className="text-xs sm:text-sm text-slate-400">Timeline</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Start Date</p>
                          <p className="text-sm font-medium text-white">
                            {result.startDate ? new Date(result.startDate).toLocaleDateString('en-GB', {
                              timeZone: 'UTC',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">End Date</p>
                          <p className="text-sm font-medium text-white">
                            {result.endDate ? new Date(result.endDate).toLocaleDateString('en-GB', {
                              timeZone: 'UTC',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <p className="text-xs sm:text-sm text-slate-400">Certificate Details</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-xs sm:text-sm text-slate-400">Student ID</span>
                          <span className="text-xs sm:text-sm font-mono text-white bg-white/10 px-2 py-1 rounded">{result.studentId}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-xs sm:text-sm text-slate-400">Certificate No.</span>
                          <span className="text-xs sm:text-sm font-mono text-white bg-white/10 px-2 py-1 rounded">{result.certificateNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                      <p className="text-xs sm:text-sm text-green-400">
                        This certificate has been verified and is authentic. All details match our records.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-8 sm:p-12 lg:p-16 border border-white/10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-slate-800/50 rounded-2xl mb-6">
                    <FileSearch className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-400 mb-2">No Results Yet</h3>
                  <p className="text-sm sm:text-base text-slate-500">
                    Enter certificate details and click verify to see the results here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer
        theme="dark"
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="mt-16 sm:mt-0"
      />

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default Verify;
