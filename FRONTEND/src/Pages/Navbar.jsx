import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import logo from '../assets/LOGO.png';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/service', label: 'Our Services' },
    { to: '/registration', label: 'Registration' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl bg-opacity-80 border-b border-slate-700/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo & Brand */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 sm:space-x-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              <img
                src={logo}
                alt="CodeNova Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain drop-shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight bg-linear-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-blue-300 transition-all duration-300">
              Code-A-Nova
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-10">
            <ul className="flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`relative text-sm lg:text-base font-medium transition-all duration-300 px-3 lg:px-4 py-2 rounded-lg group ${
                      location.pathname === link.to
                        ? 'text-cyan-400'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {location.pathname === link.to ? (
                      <span className="absolute inset-0 bg-cyan-500/20 rounded-lg border border-cyan-500/50"></span>
                    ) : (
                      <span className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-lg transition-all duration-300"></span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Login Button */}
            {/* <Link
              to="/login"
              className="relative inline-flex items-center px-5 lg:px-6 py-2.5 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-sm lg:text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 hover:scale-105 group overflow-hidden"
            >
              <span className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              <LogIn size={18} className="mr-2 relative z-10" />
              <span className="relative z-10">Login</span>
            </Link> */}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 active:scale-95"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-slate-900/98 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl">
          <div className="px-4 py-6 space-y-2 max-w-md mx-auto">
            {navLinks.map((link, index) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`block px-5 py-3.5 text-base font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  location.pathname === link.to
                    ? 'bg-linear-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center px-5 py-4 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-cyan-500/50 mt-4 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="inline-flex items-center justify-center">
                <LogIn size={20} className="mr-2" />
                Login
              </span>
            </Link> */}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
