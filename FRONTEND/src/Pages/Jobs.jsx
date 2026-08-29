import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import JobCard from '../Components/JobCard';
import BuyTokensModal from './InterviewPortal/components/BuyTokensModal';
import { Search, MapPin, Filter, Briefcase, Bookmark, Sparkles, Coins, Lock, Zap, CheckCircle2, Crown, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobObjects, setSavedJobObjects] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters and Plans
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState(false);
  const [activePlanTab, setActivePlanTab] = useState('All'); // 'All' | 'Basic' | 'Premium'

  // Membership & Token State
  const [userStatus, setUserStatus] = useState({ 
    isPremium: false, 
    isFreeMode: false, 
    freeModeExpires: null, 
    premiumPrice: 199, 
    tokens: 0, 
    expiresAt: null,
    adminBonusActive: false,
    adminBonusExpires: null
  });
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  useEffect(() => {
    fetchUserStatus();
    // Record visitor audit activity for Admin tracking
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    const email = localStorage.getItem('studentEmail') || localStorage.getItem('userEmail') || '';
    axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/audit-log`, {
      action: 'Visited Job Portal',
      email: email || undefined
    }, token ? { headers: { Authorization: `Bearer ${token}` } } : {}).catch(() => {});
  }, []);

  const fetchUserStatus = async () => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/user-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUserStatus({
          isPremium: res.data.isPremium,
          isFreeMode: res.data.isFreeMode || false,
          freeModeExpires: res.data.freeModeExpires || null,
          premiumPrice: res.data.premiumPrice || 199,
          tokens: res.data.tokens,
          expiresAt: res.data.expiresAt,
          adminBonusActive: res.data.adminBonusActive || false,
          adminBonusExpires: res.data.adminBonusExpires || null
        });
      }
    } catch (err) {
      console.error('Error fetching user status:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
      const queryParams = new URLSearchParams({
        page,
        limit: 12,
        ...(role && { role }),
        ...(location && { location }),
        ...(remote && { remote: 'true' }),
        ...(activePlanTab !== 'All' && { planType: activePlanTab })
      });

      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs?${queryParams}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        setJobs(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSavedJobs(res.data.data.map(sj => sj.job._id));
        setSavedJobObjects(res.data.data.map(sj => sj.job));
      }
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error);
    }
  };

  const fetchAppliedJobs = async () => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/applied`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAppliedJobs(res.data.data.map(aj => aj.job._id));
      }
    } catch (error) {
      console.error('Failed to fetch applied jobs:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
    if (token) {
      const activeRef = localStorage.getItem('referralCode') || localStorage.getItem('referredByCode') || sessionStorage.getItem('referralCode');
      axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/student/track-activity`,
        { featureName: "Job Portal Viewed", referralCode: activeRef },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {});
    }
  }, [page, role, location, remote, activePlanTab]);

  useEffect(() => {
    fetchSavedJobs();
    fetchAppliedJobs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handlePurchasePremium = async () => {
    if (userStatus.isFreeMode) {
      toast.success("🎉 Good news! Free Promo Mode is active right now. All Premium jobs are completely FREE for all students!");
      return;
    }
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) {
      toast.error('Please log in first to upgrade to Premium!');
      return;
    }
    const requiredTokens = userStatus.premiumPrice || 199;
    if (userStatus.tokens < requiredTokens) {
      toast.error(`You have ${userStatus.tokens} tokens. You need ${requiredTokens} tokens to upgrade! Opening recharge store...`);
      setIsBuyModalOpen(true);
      return;
    }
    if (!window.confirm(`Upgrade to Job Portal Premium for 3 months using ${requiredTokens} Tokens?`)) return;

    try {
      const toastId = toast.loading('Upgrading to Premium...');
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/purchase-premium`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.dismiss(toastId);
      if (res.data.success) {
        toast.success(res.data.message || '🎉 Upgraded to Premium Plan!');
        setUserStatus({
          isPremium: res.data.isPremium,
          isFreeMode: res.data.isFreeMode || false,
          premiumPrice: res.data.premiumPrice || requiredTokens,
          tokens: res.data.tokens,
          expiresAt: res.data.expiresAt
        });
        fetchJobs(); // Re-fetch to display unlocked apply links!
      }
    } catch (err) {
      if (err.response?.data?.code === 'INSUFFICIENT_TOKENS') {
        toast.error(err.response.data.message);
        setIsBuyModalOpen(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to upgrade to Premium');
      }
    }
  };

  const handleBuyPackage = async (pkg) => {
    setIsBuyModalOpen(false);
    const token = localStorage.getItem('interviewToken') || localStorage.getItem('studentToken');
    if (!token) {
      toast.error('Please login to purchase tokens');
      return;
    }

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
        description: `Purchase ${pkg.title || 'Tokens'}`,
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
              toast.success("✅ Payment Successful! Tokens credited.");
              setUserStatus(prev => ({ ...prev, tokens: verifyRes.data.credits || (prev.tokens + pkg.price) }));
              fetchUserStatus();
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error(error);
            toast.error("Error verifying payment");
          }
        },
        theme: { color: "#4F46E5" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error("Payment initiation failed");
    }
  };

  const toggleSaveJob = async (jobId) => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) {
      toast.error('Please login to save jobs');
      return;
    }

    try {
      const isSaved = savedJobs.includes(jobId);
      if (isSaved) {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/save/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedJobs(prev => prev.filter(id => id !== jobId));
        setSavedJobObjects(prev => prev.filter(j => j && j._id !== jobId));
        toast.success('Job removed from saved list');
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/save/${jobId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedJobs(prev => [...prev, jobId]);
        const jobToAdd = jobs.find(j => j._id === jobId);
        if (jobToAdd) {
          setSavedJobObjects(prev => [...prev, jobToAdd]);
        }
        toast.success('Job saved successfully');
      }
    } catch (error) {
      console.error('Failed to toggle save job:', error);
      toast.error('Operation failed');
    }
  };

  const toggleApplyJob = async (jobId) => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('interviewToken');
    if (!token) {
      toast.error('Please login first to record application status');
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/api/jobs/apply/${jobId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.isApplied) {
        setAppliedJobs(prev => [...prev, jobId]);
        toast.success('✅ Marked as Applied in your profile!');
      } else {
        setAppliedJobs(prev => prev.filter(id => id !== jobId));
        toast.success('Removed from applied list');
      }
    } catch (error) {
      console.error('Failed to toggle apply job:', error);
      toast.error('Operation failed');
    }
  };

  const filteredSavedJobs = React.useMemo(() => {
    return savedJobObjects.filter(job => {
      if (!job) return false;
      const matchRole = job.title?.toLowerCase().includes(role.toLowerCase()) || job.company?.toLowerCase().includes(role.toLowerCase());
      const matchLocation = job.location?.toLowerCase().includes(location.toLowerCase());
      const matchRemote = remote ? job.isRemote : true;
      return matchRole && matchLocation && matchRemote;
    });
  }, [savedJobObjects, role, location, remote]);

  return (
    <MainLayout>
      <div className="bg-[#FAFAFA] min-h-screen pt-16 pb-24">
        
        {/* Premium Hero Section */}
        <div className="bg-white border-b border-slate-200 py-12 md:py-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[100px] -mr-96 -mt-96 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[100px] -ml-64 -mb-64 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
              <div className="max-w-2xl flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest mb-6">
                  <Briefcase className="w-4 h-4" /> Code-A-Nova Job Portal
                </div>
                <h1 className="font-black mb-4 leading-none md:leading-tight text-slate-900">
                  <span className="block md:inline text-3xl sm:text-4xl md:text-5xl">Discover Daily</span>
                  <span className="hidden md:inline"> </span>
                  <span className="block md:inline text-4xl sm:text-5xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 -mt-1 md:mt-0">
                    Tech Careers
                  </span>
                </h1>
                <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed">
                  Access curated tech openings uploaded daily. Basic free plan provides 2 daily roles, while our VIP Premium tier grants exclusive un-copyable email & apply access to 10 daily premium opportunities!
                </p>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                  <div className="flex-1 flex items-center bg-white rounded-2xl px-4 h-[48px] border-2 border-slate-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Search by job title, skill, or company..." 
                      className="w-full h-full bg-transparent outline-none text-slate-800 placeholder-slate-400 font-bold text-sm"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-7 h-12 rounded-2xl transition-all shadow-sm flex items-center justify-center shrink-0 text-sm">
                    Search Jobs &rarr;
                  </button>
                </form>
              </div>

              {/* Job Portal Membership & Token Dashboard (Light Theme) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 w-full lg:w-[390px] shrink-0 shadow-xl shadow-slate-200/50 flex flex-col">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-extrabold text-slate-500 text-xs md:text-sm uppercase tracking-wider">Your Balance</h2>
                    <div className="bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-xl font-black text-base md:text-lg border border-indigo-100 flex items-center gap-1 shadow-xs">
                      <span>{userStatus.tokens}</span>{' '}
                      <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-indigo-600">Tokens</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-xs md:text-sm items-center">
                      <span className="text-slate-600 font-medium">Basic Free Jobs:</span>
                      <span className="text-slate-800 font-extrabold">2 Daily (Unlocked)</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm items-center">
                      <span className="text-slate-600 font-medium">Premium VIP Roles:</span>
                      {userStatus.isFreeMode || userStatus.isPremium ? (
                        <span className="text-slate-800 font-extrabold">10 Daily (Unlocked)</span>
                      ) : (
                        <span className="text-amber-800 font-extrabold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-xs">Locked (10 Daily)</span>
                      )}
                    </div>
                    <div className="flex justify-between text-xs md:text-sm items-center">
                      <span className="text-slate-600 font-medium">Email & Apply Links:</span>
                      {userStatus.isFreeMode ? (
                        <span className="text-emerald-700 font-black bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg text-xs">FREE PROMO</span>
                      ) : userStatus.isPremium ? (
                        <span className="text-indigo-700 font-black bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">VIP ACCESS</span>
                      ) : (
                        <span className="text-slate-600 font-extrabold">Token Subscription</span>
                      )}
                    </div>
                    <div className="w-full h-px bg-slate-100 my-3" />
                    <div className="flex justify-between text-xs md:text-sm items-center">
                      <span className="text-slate-600 font-medium">Current Status:</span>
                      <span className="text-slate-900 font-black">
                        {userStatus.isFreeMode ? '🎉 1st Month Free' : userStatus.isPremium ? '👑 Premium Active' : '🟢 Basic Member'}
                      </span>
                    </div>
                  </div>

                  {userStatus.adminBonusActive && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-slate-700 text-xs font-medium mb-6 space-y-1.5">
                      <div className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                        <span>Admin Bonus Active!</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        You've been granted VIP access by an admin! Valid until <b className="text-slate-900">{new Date(userStatus.adminBonusExpires).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</b>.
                      </p>
                    </div>
                  )}

                  {!userStatus.adminBonusActive && userStatus.isFreeMode && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-slate-700 text-xs font-medium mb-6 space-y-1.5">
                      <div className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                        <span>VIP Roles Currently Free!</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        {userStatus.freeModeExpires ? (
                          <>Promo valid until <b className="text-slate-900">{new Date(userStatus.freeModeExpires).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</b> before auto-switching to Token pricing.</>
                        ) : (
                          <>1st Month Free Promo is currently active for all students!</>
                        )}
                      </p>
                    </div>
                  )}
                  {!userStatus.isFreeMode && userStatus.isPremium && userStatus.expiresAt && (
                    <div className="text-xs text-slate-500 font-semibold mb-5 text-right">
                      Plan valid until: <span className="text-slate-800 font-black">{new Date(userStatus.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-6">
                  {!userStatus.isPremium && !userStatus.isFreeMode && (
                    <button
                      onClick={handlePurchasePremium}
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 fill-current text-slate-900" />
                      Upgrade Premium ({userStatus.premiumPrice || 199} Tokens / 3 Mo)
                    </button>
                  )}
                  <button
                    onClick={() => setIsBuyModalOpen(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
                  >
                    Purchase More Tokens
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Category Tabs & Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-6">
            <div className="flex bg-slate-200/70 p-1.5 rounded-2xl w-full sm:w-auto border border-slate-300/50 shadow-inner">
              <button
                onClick={() => { setActivePlanTab('All'); setShowSaved(false); setPage(1); }}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                  activePlanTab === 'All' && !showSaved ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌟 All Opportunities
              </button>
              <button
                onClick={() => { setActivePlanTab('Basic'); setShowSaved(false); setPage(1); }}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                  activePlanTab === 'Basic' && !showSaved ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🟢 Basic (Free Roles)
              </button>
              <button
                onClick={() => { setActivePlanTab('Premium'); setShowSaved(false); setPage(1); }}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                  activePlanTab === 'Premium' && !showSaved ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👑 Premium VIP
              </button>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button 
                onClick={() => setShowSaved(!showSaved)} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm border transition-all ${
                  showSaved ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${showSaved ? 'fill-current' : ''}`} />
                Saved Jobs ({savedJobs.length})
              </button>
              
              <button 
                onClick={() => setRemote(!remote)} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm border transition-all ${
                  remote ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${remote ? 'bg-white border-white' : 'border-slate-400'}`}>
                  {remote && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                Remote Only
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl h-72 animate-pulse p-6 border border-slate-100">
                   <div className="w-2/3 h-6 bg-slate-200 rounded mb-2"></div>
                   <div className="w-1/3 h-4 bg-slate-200 rounded mb-6"></div>
                   <div className="flex gap-2 mb-6">
                     <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                     <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                   </div>
                   <div className="w-full h-16 bg-slate-100 rounded mb-6"></div>
                   <div className="flex gap-4">
                     <div className="flex-1 h-10 bg-slate-200 rounded-xl"></div>
                     <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                   </div>
                </div>
              ))}
            </div>
          ) : showSaved ? (
            filteredSavedJobs.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {filteredSavedJobs.map((job) => (
                  <JobCard 
                    key={job._id} 
                    job={job} 
                    isSaved={true}
                    onSave={toggleSaveJob}
                    isApplied={appliedJobs.includes(job._id)}
                    onToggleApply={toggleApplyJob}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm mt-8 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bookmark className="w-8 h-8 text-indigo-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No saved jobs found</h3>
                <p className="text-slate-500 mb-8">
                  {savedJobs.length > 0 
                    ? "We couldn't find any saved jobs matching your current search filters." 
                    : "You haven't bookmarked any jobs yet. Browse the opportunities and bookmark roles!"}
                </p>
                <button 
                  onClick={() => setShowSaved(false)}
                  className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors inline-block"
                >
                  Browse Jobs
                </button>
              </div>
            )
          ) : jobs.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {jobs.map((job) => (
                  <JobCard 
                    key={job._id} 
                    job={job} 
                    isSaved={savedJobs.includes(job._id)}
                    onSave={toggleSaveJob}
                    isApplied={appliedJobs.includes(job._id)}
                    onToggleApply={toggleApplyJob}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold disabled:opacity-50 hover:bg-slate-50 text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-slate-600 font-extrabold px-4 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold disabled:opacity-50 hover:bg-slate-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm mt-8 max-w-lg mx-auto">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Filter className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No opportunities found</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                No job postings match your current filters or tab selection. Check back soon for daily uploads!
              </p>
              <button 
                onClick={() => { setRole(''); setLocation(''); setRemote(false); setActivePlanTab('All'); setPage(1); fetchJobs(); }}
                className="bg-indigo-50 text-indigo-700 font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <BuyTokensModal 
        isOpen={isBuyModalOpen} 
        onClose={() => setIsBuyModalOpen(false)} 
        onSelectPackage={handleBuyPackage} 
      />
    </MainLayout>
  );
};

export default Jobs;
