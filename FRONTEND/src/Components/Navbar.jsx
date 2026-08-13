import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAllUserData } from '../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const [featuresConfig, setFeaturesConfig] = useState({ jobPortal: true, interview: true, resume: true, assessment: true });
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/leaderboard`);
        setShowLeaderboard(res.data.showLeaderboard);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSetting();
  }, []);


  useEffect(() => {
    const fetchFeatureSettings = async () => {
      try {
        const [jobRes, intRes, resRes, assmtRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings/job-portal`).catch(() => ({data: {jobPortalEnabled: true}})),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/interview-settings`).catch(() => ({data: {enabled: true}})),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/resume-settings`).catch(() => ({data: {enabled: true}})),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/assessment-settings`).catch(() => ({data: {enabled: true}}))
        ]);
        setFeaturesConfig({
          jobPortal: jobRes.data?.jobPortalEnabled ?? true,
          interview: intRes.data?.enabled ?? true,
          resume: resRes.data?.enabled ?? true,
          assessment: assmtRes.data?.enabled ?? true,
        });
      } catch (err) {
        console.error('Failed to fetch feature settings', err);
      }
    };
    fetchFeatureSettings();
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Industries', path: '/industries' },
    { name: 'Our Features', path: '#' },
    { name: 'Internship', path: '/internship' }
  ];

  const studentToken = localStorage.getItem('studentToken');
  const interviewToken = localStorage.getItem('interviewToken');
  const isLoggedIn = !!(studentToken || interviewToken);
  const dashboardLink = studentToken ? '/dashboard' : '/dashboard';

  const handleLogout = () => {
    clearAllUserData();
    window.location.href = '/';
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        scrolled || location.pathname === '/leaderboard'
          ? 'bg-white border-b border-gray-200 py-4 shadow-sm' 
          : 'bg-white min-[920px]:bg-transparent border-b border-gray-200 min-[920px]:border-transparent py-4 min-[920px]:py-6 shadow-sm min-[920px]:shadow-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link to="/" className="group transition-transform duration-300 hover:scale-105 z-50 relative">
          <span className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
            Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-brand-purple">-A-</span>Nova
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden min-[920px]:flex items-center gap-8">
          {navLinks.map((link) => {
            if (link.name === 'Our Features') {
              const hasFeatures = featuresConfig.jobPortal || featuresConfig.interview || featuresConfig.resume || featuresConfig.assessment;
              if (!hasFeatures) return null;
              return (
                <div key={link.name} className="relative group" onMouseEnter={() => setFeaturesDropdownOpen(true)} onMouseLeave={() => setFeaturesDropdownOpen(false)}>
                  <button className={`flex items-center gap-1 text-sm font-semibold transition-colors hover:text-brand-purple ${featuresDropdownOpen ? 'text-brand-purple' : 'text-gray-600'}`}>
                    Our Features <ChevronDown size={14} className={`transition-transform ${featuresDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {featuresDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2"
                      >
                        {featuresConfig.interview && <Link to={isLoggedIn ? "/interview-setup" : "/student-login"} className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">Mock Interview</Link>}
                        {featuresConfig.resume && <Link to={isLoggedIn ? "/my-resumes" : "/student-login"} className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">Resume Builder</Link>}
                        {featuresConfig.jobPortal && <Link to="/jobs" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">Job Portal</Link>}
                        {featuresConfig.assessment && <Link to={isLoggedIn ? "/dashboard/assessment" : "/student-login"} className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">Assessments</Link>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            if (link.name === 'Internship' && showLeaderboard) {
              return (
                <div key={link.name} className="relative group" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
                  <button className={`flex items-center gap-1 text-sm font-semibold transition-colors hover:text-brand-purple ${(location.pathname === '/internship' || location.pathname === '/leaderboard') ? 'text-brand-purple' : 'text-gray-600'}`}>
                    Internship <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2"
                      >
                        <Link to="/internship" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">Application</Link>
                        <Link to="/leaderboard" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">Leaderboard</Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-semibold transition-colors hover:text-brand-purple ${
                  location.pathname === link.path ? 'text-brand-purple' : 'text-gray-600'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          
          {isLoggedIn ? (
            <div className="relative group ml-4" onMouseEnter={() => setUserDropdownOpen(true)} onMouseLeave={() => setUserDropdownOpen(false)}>
              <button className={`flex items-center gap-1 text-sm font-extrabold transition-colors hover:text-brand-purple ${(location.pathname === dashboardLink) ? 'text-brand-purple' : 'text-gray-900'}`}>
                My Account <ChevronDown size={14} className={`transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2"
                  >
                    <Link to={dashboardLink} className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">Dashboard</Link>
                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600">Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/student-login"
              className={`text-sm font-extrabold transition-colors hover:text-brand-purple ml-4 ${
                location.pathname === '/student-login' ? 'text-brand-purple' : 'text-gray-900'
              }`}
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="min-[920px]:hidden relative z-50 p-2 -mr-2 text-gray-900 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <div className="w-6 flex flex-col items-end gap-1.5">
            <span className={`h-0.5 bg-gray-900 transition-all duration-300 ease-out ${mobileMenuOpen ? 'w-6 rotate-45 translate-y-2' : 'w-6'}`} />
            <span className={`h-0.5 bg-gray-900 transition-all duration-300 ease-out ${mobileMenuOpen ? 'opacity-0' : 'w-5'}`} />
            <span className={`h-0.5 bg-gray-900 transition-all duration-300 ease-out ${mobileMenuOpen ? 'w-6 -rotate-45 -translate-y-2' : 'w-4'}`} />
          </div>
        </button>
      </div>

      {/* Premium Elegant Right-Side Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm z-[9998] min-[920px]:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-[9999] min-[920px]:hidden flex flex-col shadow-2xl rounded-l-2xl border-l border-gray-100 overflow-hidden"
            >
              {/* Fixed Top Header */}
              <div className="flex justify-between items-center px-6 pt-8 pb-6 shrink-0">
                <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 rounded-full p-2 -mr-2">
                  <X size={20} />
                </button>
              </div>
              
              {/* Scrollable Middle Links */}
              <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col gap-2 relative">
                {/* Decorative left line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-gray-100 via-gray-200 to-transparent" />
                
                {navLinks.map((link, i) => {
                  if (link.name === 'Our Features') {
                    const hasFeatures = featuresConfig.jobPortal || featuresConfig.interview || featuresConfig.resume || featuresConfig.assessment;
                    if (!hasFeatures) return null;
                    return (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.05 + 0.1, type: 'spring', stiffness: 300, damping: 24 }}
                        className="relative pb-2"
                      >
                        <button onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)} className={`w-full flex items-center justify-between py-2 px-6 text-xl font-semibold tracking-tight transition-all duration-300 ${mobileFeaturesOpen ? 'text-gray-900 translate-x-2' : 'text-gray-400 hover:text-gray-900 hover:translate-x-1'}`}>
                          Our Features <ChevronDown size={20} className={`transition-transform ${mobileFeaturesOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {mobileFeaturesOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden flex flex-col pl-8 pr-6"
                            >
                              {featuresConfig.interview && <Link to={isLoggedIn ? "/interview-setup" : "/student-login"} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-lg font-medium text-gray-500 hover:text-gray-900 transition-colors">Mock Interview</Link>}
                              {featuresConfig.resume && <Link to={isLoggedIn ? "/my-resumes" : "/student-login"} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-lg font-medium text-gray-500 hover:text-gray-900 transition-colors">Resume Builder</Link>}
                              {featuresConfig.jobPortal && <Link to="/jobs" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-lg font-medium text-gray-500 hover:text-gray-900 transition-colors">Job Portal</Link>}
                              {featuresConfig.assessment && <Link to={isLoggedIn ? "/dashboard/assessment" : "/student-login"} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-lg font-medium text-gray-500 hover:text-gray-900 transition-colors">Assessments</Link>}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  if (link.name === 'Internship' && showLeaderboard) {
                    return (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.05 + 0.1, type: 'spring', stiffness: 300, damping: 24 }}
                        className="relative pb-4"
                      >
                        <span className="block px-6 text-xs font-bold tracking-widest text-gray-400 uppercase mt-4 mb-2">Internship</span>
                        <Link to="/internship" onClick={() => setMobileMenuOpen(false)} className={`block py-2 px-6 text-xl font-semibold tracking-tight transition-all duration-300 ${location.pathname === '/internship' ? 'text-gray-900 translate-x-2' : 'text-gray-400 hover:text-gray-900 hover:translate-x-1'}`}>Application</Link>
                        <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className={`block py-2 px-6 text-xl font-semibold tracking-tight transition-all duration-300 ${location.pathname === '/leaderboard' ? 'text-gray-900 translate-x-2' : 'text-gray-400 hover:text-gray-900 hover:translate-x-1'}`}>Leaderboard</Link>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05 + 0.1, type: 'spring', stiffness: 300, damping: 24 }}
                      className="relative"
                    >
                      {location.pathname === link.path && (
                        <motion.div 
                          layoutId="activeIndicator"
                          className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r-full" 
                        />
                      )}
                      <Link
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block py-3 px-6 text-xl font-semibold tracking-tight transition-all duration-300 ${
                          location.pathname === link.path 
                            ? 'text-gray-900 translate-x-2' 
                            : 'text-gray-400 hover:text-gray-900 hover:translate-x-1'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Fixed Bottom Footer */}
              <div className="shrink-0 px-5 pt-4 pb-6 bg-gray-50/50 border-t border-gray-100 mt-auto">
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Get in Touch</span>
                    <a href="mailto:codeanova26@gmail.com" className="block text-xs font-medium text-gray-900 hover:text-blue-600 transition-colors">codeanova26@gmail.com</a>
                  </div>
                  
                  <div className="space-y-2.5">
                    {isLoggedIn ? (
                      <>
                        <Link 
                          to={dashboardLink} 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold transition-all hover:shadow-md"
                        >
                          <span>Dashboard</span>
                        </Link>
                        <button 
                          onClick={handleLogout} 
                          className="flex items-center justify-center w-full py-3 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold transition-all hover:shadow-md"
                        >
                          <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      <Link 
                        to="/student-login" 
                        onClick={() => setMobileMenuOpen(false)} 
                        className="flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-brand-purple text-white rounded-xl text-sm font-bold transition-all hover:shadow-md"
                      >
                        <span>Login to Practice</span>
                      </Link>
                    )}
                    <Link 
                      to="/contact" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center justify-between w-full py-3 px-4 bg-gray-900 text-white rounded-xl text-sm font-bold group transition-all hover:shadow-md hover:shadow-gray-900/20"
                    >
                      <span>Start a Project</span>
                      <span className="bg-white/20 p-1 rounded-full group-hover:translate-x-1 transition-transform">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
