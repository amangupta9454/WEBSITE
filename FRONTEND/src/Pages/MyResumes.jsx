import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileText, Trash2, Copy, Edit2, Download, AlertCircle, Loader2, Sparkles, CheckCircle, Zap, Briefcase, Award, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import BuyTokensModal from './InterviewPortal/components/BuyTokensModal';

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const MyResumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [resumeEnabled, setResumeEnabled] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
      const [resumesRes, creditsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/resume`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/interview-session/my-credits`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resumesRes.data.success) setResumes(resumesRes.data.resumes);
      if (creditsRes.data.success) {
        setCredits(creditsRes.data.credits);

        // Track feature activity for Ambassador stats
        const activeRef = localStorage.getItem('referralCode') || localStorage.getItem('referredByCode') || sessionStorage.getItem('referralCode');
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/student/track-activity`,
          { featureName: "AI Resume Created", referralCode: activeRef },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
        
        if (creditsRes.data.resumeEnabled !== undefined) {
          setResumeEnabled(creditsRes.data.resumeEnabled);
        }
      }
    } catch (err) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const hasFree = resumes.length === 0;
    if (!hasFree && credits < 10) {
      toast.error("Oops! Not enough tokens. Creating a new resume costs 10 tokens. Please purchase more.");
      return;
    }

    if (!hasFree) {
      const confirm = window.confirm("Creating a new resume will deduct 10 Tokens. Continue?");
      if (!confirm) return;
    }

    try {
      const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/resume/create`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Resume created successfully!");
        setCredits(res.data.creditsRemaining !== undefined ? res.data.creditsRemaining : credits);
        navigate(`/resume-builder/${res.data.resume._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create resume');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/resume/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumes(resumes.filter(r => r._id !== id));
      toast.success("Resume deleted");
    } catch (err) {
      toast.error("Failed to delete resume");
    }
  };

  const handleDuplicate = async (id) => {
    if (credits < 10) {
      toast.error("Oops! Not enough tokens. Duplicating a resume costs 10 tokens. Please purchase more.");
      return;
    }
    if (!window.confirm("Duplicating a resume costs 10 Tokens. Continue?")) return;

    try {
      const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/resume/${id}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Resume duplicated!");
        setCredits(res.data.creditsRemaining);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to duplicate");
    }
  };

  const handleBuyPackage = async (pkg) => {
    setIsBuyModalOpen(false);
    const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
    if (!token) return;

    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      const toastId = toast.loading("Initializing payment...");
      
      const orderRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-payment/create-order`,
        { packageId: pkg.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!orderRes.data.success) {
        toast.dismiss(toastId);
        toast.error(orderRes.data.message || "Failed to create order");
        return;
      }

      toast.dismiss(toastId);
      const order = orderRes.data.order;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Code-A-Nova",
        description: `Purchase ${pkg.name}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packageId: pkg.id
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              toast.success("Payment Successful! Tokens updated.");
              setCredits(verifyRes.data.credits);
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error(error);
            toast.error("An error occurred during verification");
          }
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    }
  };

  if (loading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-blue-500 w-12 h-12" /></div>;

  if (!resumeEnabled) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-slate-50 text-center p-6">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-slate-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Feature Disabled</h1>
        <p className="text-slate-500 max-w-md mb-8">The AI Resume Builder is currently disabled. Please check back later or contact support if you need access.</p>
        <button onClick={() => navigate('/dashboard')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  const recentResume = resumes.length > 0 ? resumes[0] : null;

  return (
    <div className="bg-[#FAFAFA] pt-16 pb-24">
      {/* Premium Hero Section */}
      <div className="bg-white border-b border-slate-200 py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[100px] -mr-96 -mt-96 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[100px] -ml-64 -mb-64 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest mb-6">
                <Sparkles className="w-4 h-4" /> Code-A-Nova Premium
              </div>
              <h1 className="font-black mb-4 leading-none md:leading-tight text-slate-900">
                <span className="block md:inline text-2xl sm:text-4xl md:text-5xl">ATS-Friendly</span>
                <span className="hidden md:inline"> </span>
                <span className="block md:inline text-4xl sm:text-5xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 -mt-1 md:mt-0">
                  Resume Builder
                </span>
              </h1>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Build perfectly formatted resumes designed specifically for top tech companies. Our engine ensures 100% ATS compatibility so your application never gets auto-rejected.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-800">Bypass ATS Filters</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">Instant Formatting</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-blue-800">Industry Standard</span>
                </div>
              </div>

              <button 
                onClick={handleCreate}
                className="w-full md:w-fit bg-gradient-to-r from-brand-purple to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black py-4 px-8 rounded-xl transition-all shadow-xl shadow-brand-purple/30 flex items-center justify-center gap-2 hover:-translate-y-1 text-lg mb-6 md:mb-0"
              >
                <Plus className="w-6 h-6" /> Create New Resume
              </button>
            </div>

            {/* Token Infographic Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 w-full md:w-80 shrink-0 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="font-bold text-slate-500 text-xs md:text-sm uppercase tracking-wider">Your Balance</h3>
                <div className="bg-indigo-50 text-indigo-700 px-2 py-0.5 md:px-3 md:py-1 rounded-lg font-black text-base md:text-lg border border-indigo-100">
                  {credits} <span className="text-[9px] md:text-[10px] font-bold uppercase">Tokens</span>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                <div className="flex justify-between text-xs md:text-sm items-center">
                  <span className="text-slate-600 font-medium">1st Resume:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 md:px-2 rounded text-[10px] md:text-xs">FREE</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm items-center">
                  <span className="text-slate-600 font-medium">Export PDF (First 3):</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 md:px-2 rounded text-[10px] md:text-xs">FREE</span>
                </div>
                <div className="w-full h-px bg-slate-100 my-2"></div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-slate-600 font-medium">New Resume:</span>
                  <span className="text-slate-800 font-bold">10 Tokens</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-slate-600 font-medium">Premium Export:</span>
                  <span className="text-slate-800 font-bold">2 Tokens</span>
                </div>
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 md:py-3 rounded-xl transition-all text-xs md:text-sm shadow-md shadow-indigo-600/20 hover:-translate-y-0.5" onClick={() => setIsBuyModalOpen(true)}>
                Purchase More Tokens
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">

        {/* Recent Resume Highlight */}
        {recentResume && (
          <div className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" /> Recently Edited
            </h2>
            <div className="bg-white rounded-3xl border border-indigo-100 p-5 md:p-8 shadow-xl shadow-indigo-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -mr-20 -mt-20 z-0 transition-transform duration-700 group-hover:scale-150"></div>

              <div className="relative z-10 flex-1 w-full">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-black uppercase tracking-widest mb-3 md:mb-4">
                  {recentResume.status}
                </div>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 mb-1.5 md:mb-2">{recentResume.name}</h3>
                <p className="text-slate-500 mb-4 md:mb-6 flex items-center gap-2 text-xs md:text-sm font-medium">
                  <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" /> Updated {new Date(recentResume.updatedAt).toLocaleDateString()}
                </p>

                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <button
                    onClick={() => navigate(`/resume-builder/${recentResume._id}`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl text-sm md:text-base font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5"
                  >
                    <Edit2 className="w-4 h-4 md:w-5 md:h-5" /> Continue Editing
                  </button>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3.5 rounded-xl border border-slate-200">
                    <Download className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                    <span className="text-xs md:text-sm font-bold text-slate-700">{recentResume.downloadsUsed}</span>
                    <span className="text-[10px] md:text-xs font-medium text-slate-400">/ 3 Free Used</span>
                  </div>
                </div>
              </div>

              {/* Decorative Document Preview */}
              <div className="hidden md:block relative z-10 w-48 h-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-5 transform rotate-3 group-hover:rotate-6 transition-transform duration-500">
                <div className="w-full h-5 bg-indigo-50 rounded mb-5"></div>
                <div className="w-3/4 h-2 bg-slate-100 rounded mb-2.5"></div>
                <div className="w-full h-2 bg-slate-100 rounded mb-2.5"></div>
                <div className="w-5/6 h-2 bg-slate-100 rounded mb-6"></div>

                <div className="w-full h-3 bg-indigo-50/50 rounded mb-3"></div>
                <div className="w-full h-2 bg-slate-100 rounded mb-1.5"></div>
                <div className="w-full h-2 bg-slate-100 rounded mb-1.5"></div>
                <div className="w-4/5 h-2 bg-slate-100 rounded mb-1.5"></div>
              </div>
            </div>
          </div>
        )}

        {/* All Resumes Grid */}
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
            <FileText className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" /> All Resumes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

            {/* Create New Card */}
            <div
              onClick={handleCreate}
              className="bg-indigo-50/30 border-2 border-dashed border-indigo-200 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all group min-h-[200px] md:min-h-[280px]"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-indigo-900 mb-1 md:mb-2">Create New Resume</h3>
              <p className="text-xs md:text-sm text-indigo-600/80 px-2 md:px-4 font-medium">
                {resumes.length === 0 ? "Build your first ATS-friendly resume for free." : "Start a new tailored resume (10 Tokens)"}
              </p>
            </div>

            {/* Other Resumes */}
            {resumes.map(resume => (
              <div key={resume._id} className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all group flex flex-col">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                    {resume.status}
                  </div>
                </div>

                <h3 className="text-lg md:text-xl font-bold text-slate-800 line-clamp-1 mb-1">{resume.name}</h3>
                <p className="text-[10px] md:text-xs text-slate-400 font-medium mb-4 md:mb-6">
                  Updated {new Date(resume.updatedAt).toLocaleDateString()}
                </p>

                <div className="mt-auto">
                  <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center justify-between border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-slate-400" /> Downloads
                    </div>
                    <div className="text-sm font-black text-slate-800">
                      {resume.downloadsUsed} <span className="text-slate-400 font-semibold text-[10px] uppercase">/ 3 Free</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate(`/resume-builder/${resume._id}`)}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDuplicate(resume._id)}
                        className="flex-1 bg-slate-50 text-slate-600 hover:bg-slate-200 py-3 rounded-xl text-sm font-bold flex items-center justify-center transition-colors border border-slate-200"
                        title="Duplicate (10 Tokens)"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resume._id)}
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-3 rounded-xl text-sm font-bold flex items-center justify-center transition-colors border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {isBuyModalOpen && <BuyTokensModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} onSelectPackage={handleBuyPackage} />}
    </div>
  );
};

export default MyResumes;
