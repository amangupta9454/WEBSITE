import React, { useState, useEffect } from "react";
import { Settings, Tag } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import BuyTokensModal from "./BuyTokensModal";
import ProfileSettingsModal from "../../../Components/ProfileSettingsModal";

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
  const [credits, setCredits] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
        if (res.data.user) {
          setUserData(res.data.user);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
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

  return (
    <div className="max-w-6xl mx-auto mb-4 sm:mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6">
        
        {/* Welcome Banner (Card 1) */}
        <div className="lg:col-span-1 bg-gradient-to-r from-blue-600 to-indigo-700 py-2 px-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200/50 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:opacity-20 transition-opacity duration-700"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-400 opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity duration-700"></div>
          <div className="relative z-10 w-full text-center xl:text-left">
            <h2 className="text-lg sm:text-2xl font-black text-white mb-0 sm:mb-1.5 flex items-center justify-center xl:justify-start gap-2">
              Welcome Back! <span className="animate-bounce inline-block text-base sm:text-xl">👋</span>
            </h2>
            <p className="text-blue-100 max-w-sm mx-auto xl:mx-0 text-xs sm:text-sm leading-relaxed font-medium hidden sm:block">
              Ready to learn and grow today? Access tools, track progress, and prepare for your dream career.
            </p>
          </div>
        </div>
        
        {/* Profile & Wallet Sleek Card (Card 2) */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-row divide-x divide-slate-100 overflow-hidden relative items-center justify-between">
          
          {/* Profile Section */}
          <div className="w-[60%] sm:w-auto sm:flex-1 p-2 sm:p-5 flex flex-row items-center justify-start gap-2 sm:gap-4 relative z-10 hover:bg-slate-50 transition-colors duration-300 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
              {userData?.profileImage ? (
                <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl sm:text-lg font-bold text-indigo-600">
                  {userData?.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
            <div className="min-w-0 w-full text-left flex flex-col justify-center">
              <h1 className="text-sm sm:text-lg font-black text-slate-800 leading-tight truncate w-full">
                {userData?.name || "User"}
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
                onClick={() => setIsProfileModalOpen(true)}
                className="mt-0.5 sm:mt-2 text-[9px] sm:text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1 transition-colors sm:bg-indigo-50 sm:hover:bg-indigo-100 sm:px-2 sm:py-1 rounded-md w-fit"
              >
                <Settings size={10} className="sm:w-3 sm:h-3" /> 
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
            </div>
          </div>
          
          {/* Wallet Section */}
          <div className="w-[40%] sm:w-auto sm:flex-1 p-2 sm:p-5 flex items-center justify-center sm:justify-end relative z-10 bg-slate-50/30 hover:bg-slate-50/80 transition-all duration-300 shrink-0">
            
            {/* Desktop Wallet View */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center border border-indigo-100 shadow-sm text-indigo-600 shrink-0">
                <Tag size={18} />
              </div>
              <div className="flex flex-col min-w-0 items-start">
                <span className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${!isUnlimited && credits <= 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>Wallet</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black bg-clip-text text-transparent tracking-tight leading-none ${isUnlimited ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : credits <= 0 ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-indigo-700 to-blue-600'}`}>
                    {isUnlimited ? '∞' : credits}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${!isUnlimited && credits <= 0 ? 'text-red-500' : 'text-slate-500'}`}>Tokens</span>
                </div>
                <div className="mt-1">
                  {isUnlimited ? (
                    <p className="text-[9px] font-bold text-teal-700 bg-teal-100/80 border border-teal-200/50 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-sm leading-none whitespace-nowrap">
                      <span>💎</span> Premium Active
                    </p>
                  ) : credits <= 0 ? (
                    <p className="text-[9px] font-bold text-red-700 bg-red-100/80 border border-red-200/50 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-sm leading-none whitespace-nowrap animate-pulse">
                      <span>⚠️</span> Recharge Now
                    </p>
                  ) : (
                    <p className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200/50 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-sm leading-none whitespace-nowrap">
                      <span className="animate-pulse">✨</span> Upgrade
                    </p>
                  )}
                </div>
              </div>
              {!isUnlimited && (
                <button 
                  onClick={() => setIsBuyModalOpen(true)}
                  className={`text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md text-xs flex items-center justify-center shrink-0 ml-3 hover:-translate-y-0.5 ${credits <= 0 ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`}
                >
                  Add Tokens
                </button>
              )}
            </div>

            {/* Mobile Wallet View */}
            <div className="flex sm:hidden items-center justify-center gap-3 w-full px-2">
              <span className={`${credits > 999 ? 'text-3xl' : 'text-4xl'} font-black italic bg-clip-text text-transparent tracking-tighter leading-none drop-shadow-md pr-2 sm:pr-0 ${isUnlimited ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : credits <= 10 ? 'bg-gradient-to-r from-orange-600 to-red-500' : 'bg-gradient-to-r from-indigo-700 to-blue-600'}`}>
                {isUnlimited ? '∞' : credits}
              </span>
              
              <div className="flex flex-col items-center justify-center gap-1 h-[38px]">
                <span className={`text-[9px] font-bold uppercase tracking-widest leading-none flex items-center gap-0.5 ${!isUnlimited && credits <= 10 ? 'text-red-500' : 'text-slate-500'}`}>
                  {!isUnlimited && credits <= 10 ? 'Low Token' : 'Tokens'} {(!isUnlimited && credits <= 10) && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                </span>
                {!isUnlimited && (
                  <button 
                    onClick={() => setIsBuyModalOpen(true)}
                    className={`text-white font-bold px-3 py-0.5 rounded shadow-sm text-[9px] uppercase tracking-wider leading-tight flex items-center justify-center transition-all ${credits <= 10 ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 shadow-red-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`}
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
      
      <ProfileSettingsModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={userData}
        onSaveSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
