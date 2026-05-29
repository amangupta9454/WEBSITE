import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Industries', path: '/industries' },
    { name: 'Projects', path: '/projects' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Internship', path: '/internship' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        scrolled 
          ? 'bg-white/70 border-b border-zinc-100 py-4 shadow-sm backdrop-blur-xl' 
          : 'bg-white/40 md:bg-transparent border-b border-zinc-100 md:border-transparent py-4 md:py-6 backdrop-blur-md md:backdrop-blur-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link to="/" className="group transition-transform duration-300 hover:scale-105 z-50 relative">
          <span className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 group-hover:text-brand-emerald transition-colors">
            Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-brand-mint">-A-</span>Nova
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-semibold transition-colors hover:text-brand-emerald relative ${
                location.pathname === link.path ? 'text-brand-emerald' : 'text-zinc-600'
              }`}
            >
              {link.name}
              {location.pathname === link.path && (
                <motion.span 
                  layoutId="navIndicator" 
                  className="absolute left-0 right-0 bottom-[-6px] h-[2px] bg-brand-emerald rounded-full"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden relative z-50 p-2 -mr-2 text-zinc-900 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <div className="w-6 flex flex-col items-end gap-1.5">
            <span className={`h-0.5 bg-zinc-900 transition-all duration-300 ease-out ${mobileMenuOpen ? 'w-6 rotate-45 translate-y-2' : 'w-6'}`} />
            <span className={`h-0.5 bg-zinc-900 transition-all duration-300 ease-out ${mobileMenuOpen ? 'opacity-0' : 'w-5'}`} />
            <span className={`h-0.5 bg-zinc-900 transition-all duration-300 ease-out ${mobileMenuOpen ? 'w-6 -rotate-45 -translate-y-2' : 'w-4'}`} />
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
              className="fixed inset-0 bg-zinc-950/20 backdrop-blur-sm z-[9998] md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-[9999] md:hidden flex flex-col shadow-2xl rounded-l-2xl border-l border-zinc-100 overflow-hidden"
            >
              {/* Fixed Top Header */}
              <div className="flex justify-between items-center px-6 pt-8 pb-6 shrink-0">
                <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase font-mono">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors bg-zinc-50 rounded-full p-2 -mr-2">
                  <X size={20} />
                </button>
              </div>
              
              {/* Scrollable Middle Links */}
              <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col gap-2 relative">
                {/* Decorative left line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-zinc-100 via-zinc-200 to-transparent" />
                
                {navLinks.map((link, i) => (
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
                        className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-emerald rounded-r-full" 
                      />
                    )}
                    <Link
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block py-3 px-6 text-xl font-semibold tracking-tight transition-all duration-300 ${
                        location.pathname === link.path 
                          ? 'text-zinc-950 translate-x-2 font-bold' 
                          : 'text-zinc-400 hover:text-zinc-950 hover:translate-x-1'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
              
              {/* Fixed Bottom Footer */}
              <div className="shrink-0 px-6 pt-6 pb-8 bg-zinc-50 border-t border-zinc-100 mt-auto">
                <div className="space-y-6">
                  <div>
                    <span className="block text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3 font-mono">Get in Touch</span>
                    <a href="mailto:codeanova26@gmail.com" className="block text-sm font-bold text-zinc-800 hover:text-brand-emerald transition-colors font-mono">codeanova26@gmail.com</a>
                  </div>
                  <Link 
                    to="/contact" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center justify-between w-full p-4 bg-zinc-950 text-white rounded-2xl font-black group transition-all hover:bg-brand-emerald hover:text-zinc-950 hover:shadow-lg hover:shadow-brand-emerald/20"
                  >
                    <span>Start a Project</span>
                    <span className="bg-white/20 p-1.5 rounded-full group-hover:translate-x-1 transition-transform">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                  </Link>
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
