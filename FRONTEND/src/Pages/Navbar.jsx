// src/components/Navbar.jsx

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User, Loader2 } from 'lucide-react';
import logo from '../assets/LOGO.png';
// import { toast } from 'react-toastify';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    const userData = localStorage.getItem('studentData');
    if (token && userData) {
      setIsAuthenticated(true);
      setUserName(JSON.parse(userData).name || 'Student');
    } else {
      setIsAuthenticated(false);
      setUserName('');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    setIsAuthenticated(false);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/service', label: 'Our Services' },
    { to: '/registration', label: 'Internship Registration' },
    {to:'/project-submission', label:'Project Submission'},
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl bg-opacity-80 border-b border-slate-700/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              <img src={logo} alt="CodeNova Logo" className="h-10 w-10 object-contain drop-shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-linear-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Code-A-Nova
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-8">
            <ul className="flex items-center space-x-4">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`text-base font-medium px-4 py-2 rounded-lg transition-all duration-300 relative ${
                      location.pathname === link.to ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {link.label}
                    {location.pathname === link.to && (
                      <span className="absolute inset-x-2 bottom-0 h-0.5 bg-cyan-400"></span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4 ml-6">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/student-dashboard"
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 flex items-center"
                  >
                    <User className="inline mr-2" size={18} />
                    {userName}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-red-500/50 flex items-center"
                  >
                    <LogOut size={18} className="mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/student-login"
                  className="relative inline-flex items-center px-6 py-2.5 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  <LogIn size={18} className="mr-2 relative z-10" />
                  <span className="relative z-10">Login</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button onClick={toggleMenu} className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-slate-900/98 backdrop-blur-xl border-t border-slate-700/50">
          <div className="px-4 py-6 space-y-3">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)} className="block px-5 py-3 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl">
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/student-dashboard" onClick={() => setIsOpen(false)} className="block w-full text-center py-3 bg-cyan-600 text-white rounded-xl">Dashboard</Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full py-3 bg-red-600 text-white rounded-xl flex justify-center items-center">
                  <LogOut className="mr-2" size={20} />
                  Logout
                </button>
              </>
            ) : (
              <Link to="/student-login" onClick={() => setIsOpen(false)} className="block w-full text-center py-4 bg-linear-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;