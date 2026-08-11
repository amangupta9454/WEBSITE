import React, { useState, useEffect } from "react";
import { Settings, Tag, Sparkles, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import BuyTokensModal from "./BuyTokensModal";
import { useNavigate } from "react-router-dom";

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function DashboardTopSection() {
  const [credits, setCredits] = useState(() => {
    const val = localStorage.getItem('interviewUserCredits');
    return val ? parseInt(val) : 0;
  });
  const [isUnlimited, setIsUnlimited] = useState(() => {
    return localStorage.getItem('interviewUserUnlimited') === 'true';
  });
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('interviewUserData');
    return saved ? JSON.parse(saved) : null;
  });
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [isBonusBannerDismissed, setIsBonusBannerDismissed] = useState(() => {
    return localStorage.getItem('dismissedAdminBonusBanner') === 'true';
  });
  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem('interviewToken');
    if (!token) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/interview-session/my-credits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCredits(res.data.credits);
        setIsUnlimited(res.data.isUnlimited);
        localStorage.setItem('interviewUserCredits', res.data.credits);
        localStorage.setItem('interviewUserUnlimited', res.data.isUnlimited);
        if (res.data.user) {
          setUserData(res.data.user);
          localStorage.setItem('interviewUserData', JSON.stringify(res.data.user));
        }
        if (res.data.role) {
          localStorage.setItem('interviewUserRole', res.data.role);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    // After 5s: fade out welcome card and expand profile card simultaneously
    const fadeTimer = setTimeout(() => setWelcomeVisible(false), 5000);
    const removeTimer = setTimeout(() => setShowWelcome(false), 6200); // 1.2s after 5000 to match transition
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  const handleBuyPackage = async (pkg) => {
    setIsBuyModalOpen(false);
    const token = localStorage.getItem('interviewToken');
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
              toast.success("Payment Successful! Credits updated.");
              setCredits(verifyRes.data.credits);
              setIsUnlimited(verifyRes.data.isUnlimited);
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

  const profileCompletion = React.useMemo(() => {
    if (!userData) return 0;
    let score = 0;

    // Basic Profile (35 points)
    if (userData.name) score += 5;
    if (userData.email) score += 5;
    if (userData.mobile) score += 5;
    if (userData.profileImage) score += 5;
    if (userData.github) score += 5;
    if (userData.linkedin) score += 5;
    if (userData.portfolio) score += 5;

    // Resume Data (65 points)
    const rd = userData.resumeData || {};
    if (rd.experience && rd.experience.length > 0) score += 15;
    if (rd.education && rd.education.length > 0) score += 15;
    if (rd.projects && rd.projects.length > 0) score += 15;
    if (rd.skills && rd.skills.length > 0) score += 10;
    if (rd.certifications && rd.certifications.length > 0) score += 5;
    if (rd.achievements && rd.achievements.length > 0) score += 5;

    return Math.min(score, 100);
  }, [userData]);

  return (
    <div className="max-w-6xl mx-auto mb-4 sm:mb-8">
      
      {/* Admin Bonus Banners */}
      {!isBonusBannerDismissed && ((userData?.freeResumesGranted > 0) || (userData?.jobPortalPremium && userData?.jobPortalPremiumExpires && new Date(userData.jobPortalPremiumExpires) > new Date())) && (
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 sm:p-4 shadow-sm relative animate-fade-in">
          <button 
            onClick={() => {
              setIsBonusBannerDismissed(true);
              localStorage.setItem('dismissedAdminBonusBanner', 'true');
            }} 
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-purple-400 hover:text-purple-700 transition-colors bg-white/50 hover:bg-white rounded-full p-1"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="pr-6">
            <h3 className="font-bold text-purple-800 text-sm sm:text-base flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" /> Admin Bonuses Active!
            </h3>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {userData?.freeResumesGranted > 0 && (
                <div className="flex items-center justify-between bg-white/70 p-2 sm:p-2.5 rounded-lg border border-purple-100/50 hover:bg-white/90 transition-colors">
                  <p className="text-purple-800 text-xs sm:text-sm font-medium">
                    You have <b className="text-purple-900">{userData.freeResumesGranted} free AI Resume builds</b> & <b className="text-purple-900">{userData.freeDownloadsPerResume} PDF downloads</b> per resume.
                  </p>
                  <button onClick={() => navigate('/my-resumes')} className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors shadow-sm ml-4">
                    Use Resumes
                  </button>
                </div>
              )}
              {userData?.jobPortalPremium && userData?.jobPortalPremiumExpires && new Date(userData.jobPortalPremiumExpires) > new Date() && (
                <div className="flex items-center justify-between bg-white/70 p-2 sm:p-2.5 rounded-lg border border-purple-100/50 hover:bg-white/90 transition-colors">
                  <p className="text-purple-800 text-xs sm:text-sm font-medium">
                    Job Portal VIP Access valid until <b className="text-purple-900">{new Date(userData.jobPortalPremiumExpires).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</b>.
                  </p>
                  <button onClick={() => navigate('/jobs')} className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors shadow-sm ml-4">
                    View Jobs
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Outer flex row — justify-end keeps profile card anchored right while it expands left */}
      <div className="flex justify-end relative items-stretch">

        {/* Welcome Banner — absolute positioned so it doesn't affect flex layout, fades + slides out smoothly */}
        {showWelcome && (
          <div
            style={{
              transition: 'opacity 1.2s ease-in-out, transform 1.2s ease-in-out',
              opacity: welcomeVisible ? 1 : 0,
              transform: welcomeVisible ? 'translateX(0)' : 'translateX(-20px)',
              pointerEvents: welcomeVisible ? 'auto' : 'none',
            }}
            className="absolute left-0 top-0 bottom-0 z-0 w-[calc(50%-4px)] sm:w-[calc(50%-12px)] hidden md:block"
          >
            <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-700 py-3 px-4 sm:py-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200/50 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:opacity-20 transition-opacity duration-700" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-400 opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity duration-700" />
              <div className="relative z-10 w-full text-center xl:text-left">
                <h2 className="text-lg sm:text-2xl font-black text-white mb-0 sm:mb-1.5 flex items-center justify-center xl:justify-start gap-2">
                  Welcome Back! <span className="animate-bounce inline-block text-base sm:text-xl">👋</span>
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm leading-relaxed font-medium hidden sm:block">
                  Access tools, track progress, and prepare for your dream career.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile & Wallet Card — anchored right by justify-end, grows towards the left */}
        <div
          style={{
            transition: 'width 1.2s ease-in-out',
          }}
          className={`bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-row divide-x divide-slate-100 overflow-hidden relative items-center justify-between shrink-0 z-10 ${welcomeVisible ? 'w-full md:w-[calc(50%-12px)]' : 'w-full'
            }`}
        >
          {/* Profile Section */}
          <div className={`flex flex-row items-center justify-between relative z-10 hover:bg-slate-50 transition-all duration-300 min-w-0 ${welcomeVisible ? 'w-[60%] p-2 sm:p-3 xl:p-4 gap-1 sm:gap-2' : 'w-[60%] lg:w-[70%] p-2 sm:p-5 gap-2 sm:gap-4'
            }`}>

            <div className={`flex flex-row items-center justify-start min-w-0 flex-1 transition-all duration-300 ${welcomeVisible ? 'gap-2 sm:gap-3' : 'gap-2 sm:gap-4'
              }`}>
              <div className={`rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0 transition-all duration-300 ${welcomeVisible ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-14 h-14 sm:w-16 sm:h-16 lg:w-24 lg:h-24'
                }`}>
                {userData?.profileImage ? (
                  <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className={`font-bold text-indigo-600 transition-all duration-300 ${welcomeVisible ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'
                    }`}>
                    {userData?.name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="min-w-0 w-full text-left flex flex-col justify-center">
                <h1 className={`font-black text-slate-800 leading-tight truncate w-full transition-all duration-300 ${welcomeVisible ? 'text-xs sm:text-sm lg:text-base' : 'text-sm sm:text-lg'
                  }`}>
                  {userData?.name || 'User'}
                </h1>
                {userData?.email && (
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 truncate mt-0.5 w-full">
                    {userData.email}
                  </p>
                )}
                {userData?.mobile && (
                  <p className="hidden sm:block text-xs font-medium text-slate-500 truncate mt-0.5">
                    +91 {userData.mobile}
                  </p>
                )}
                <button
                  onClick={() => navigate('/profile')}
                  className="mt-0.5 sm:mt-2 text-[9px] sm:text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1 transition-colors sm:bg-indigo-50 sm:hover:bg-indigo-100 sm:px-2 sm:py-1 rounded-md w-fit"
                >
                  <Settings size={10} className="sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              </div>
            </div>

            {/* Profile Completion Badge (lg only) — pops out when welcome hides */}
            <div
              className={`hidden lg:flex items-center shrink-0 transition-all duration-1000 ease-out delay-[400ms] ${welcomeVisible
                  ? 'max-w-0 opacity-0 -translate-x-12 scale-90 blur-sm pointer-events-none border-l-0 px-0 gap-0 overflow-hidden'
                  : 'max-w-md opacity-100 translate-x-0 scale-100 blur-0 pointer-events-auto border-l border-slate-100 pr-6 pl-6 gap-5'
                }`}
            >
              <div className="text-right">
                <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-1">Profile Setup</p>
                <p className="text-lg font-black text-indigo-600">{profileCompletion}% Complete</p>
              </div>
              <div className="relative w-[72px] h-[72px] flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-500 drop-shadow-sm transition-all duration-1000 ease-out"
                    strokeWidth="3.5"
                    strokeDasharray={`${profileCompletion}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[14px] font-black text-slate-700">{profileCompletion}%</span>
              </div>
            </div>

          </div>

          {/* Wallet Section */}
          <div className={`flex items-center justify-center relative z-10 bg-slate-50/30 hover:bg-slate-50/80 transition-all duration-300 shrink-0 ${welcomeVisible ? 'w-[40%] p-2 sm:p-3 xl:p-4' : 'w-[40%] lg:w-[30%] p-2 sm:p-5'
            }`}>
            <div className={`flex items-center justify-center w-full transition-all duration-300 ${welcomeVisible ? 'gap-1 sm:gap-2 px-1' : 'gap-2 sm:gap-3 lg:gap-4 px-1 sm:px-2 lg:px-3'
              }`}>
              <span className={`font-black italic bg-clip-text text-transparent tracking-tighter leading-none drop-shadow-md transition-all duration-300 ${welcomeVisible ? 'pr-1' : 'pr-2'
                } ${credits > 999
                  ? (welcomeVisible ? 'text-2xl sm:text-3xl' : 'text-3xl lg:text-5xl')
                  : (welcomeVisible ? 'text-3xl sm:text-4xl' : 'text-4xl lg:text-6xl')
                } ${isUnlimited
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                  : credits <= 10
                    ? 'bg-gradient-to-r from-orange-600 to-red-500'
                    : 'bg-gradient-to-r from-indigo-700 to-blue-600'
                }`}>
                {isUnlimited ? '∞' : credits}
              </span>
              <div className={`flex flex-col items-center justify-center transition-all duration-300 ${welcomeVisible ? 'gap-0.5 h-[32px] sm:h-[36px]' : 'gap-1 lg:gap-1.5 h-[38px] sm:h-[42px] lg:h-[60px]'
                }`}>
                <span className={`font-bold uppercase tracking-widest leading-none flex items-center transition-all duration-300 ${welcomeVisible ? 'text-[8px] sm:text-[9px] gap-0.5' : 'text-[9px] sm:text-[10px] lg:text-sm gap-0.5 lg:gap-1'
                  } ${!isUnlimited && credits <= 10 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                  {!isUnlimited && credits <= 10 ? 'Low Token' : 'Tokens'}
                  {(!isUnlimited && credits <= 10) && (
                    <span className={`rounded-full bg-red-500 animate-pulse transition-all duration-300 ${welcomeVisible ? 'w-1 h-1' : 'w-1.5 h-1.5 lg:w-2 lg:h-2'
                      }`} />
                  )}
                </span>
                {!isUnlimited && (
                  <button
                    onClick={() => setIsBuyModalOpen(true)}
                    className={`text-white font-bold shadow-sm uppercase tracking-wider leading-tight flex items-center justify-center transition-all duration-300 ${welcomeVisible
                        ? 'px-2 sm:px-3 py-0.5 rounded text-[8px] sm:text-[9px]'
                        : 'px-3 sm:px-4 lg:px-6 py-0.5 sm:py-1 lg:py-1.5 rounded lg:rounded-md text-[9px] sm:text-[10px] lg:text-[13px]'
                      } ${credits <= 10
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 shadow-red-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                      }`}
                  >
                    {credits <= 10 ? 'RECHARGE NOW' : 'ADD'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BuyTokensModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSelectPackage={handleBuyPackage}
      />
    </div>
  );
}
