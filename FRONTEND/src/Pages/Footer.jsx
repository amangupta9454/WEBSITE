import { Link } from 'react-router-dom';
import {
  Linkedin,
  Github,
  Instagram,
  ArrowUp,
  Mail,
  Phone,
  MapPin,
  Code2,
} from 'lucide-react';
import logo from '../assets/LOGO.png';

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/service', label: 'Service' },
    { to: '/contact', label: 'Contact' },
    { to: '/registration', label: 'Registration' },
  ];

  const legalLinks = [
    { to: '/terms', label: 'Terms & Conditions' },
    // { to: '/privacy', label: 'Privacy Policy' },
  ];

  const socialLinks = [
    { href: 'https://www.linkedin.com/company/code-a-nova/', icon: <Linkedin size={24} />, label: 'LinkedIn' },
    { href: 'https://www.instagram.com/codenova31/', icon: <Instagram size={24} />, label: 'Instagram' },
    { href: 'mailto:codeanova26@gmail.com', icon: <Mail size={24} />, label: 'Email' },
    
  ];

  return (
    <>
      {/* Main Footer */}
      <footer className="relative bg-black text-gray-300 pt-24 pb-0 overflow-hidden">
        {/* Glowing Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute w-150 h-150 -top-25 -left-25 bg-linear-to-br from-cyan-500/20 to-blue-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute w-125 h-125 -bottom-25 -right-25 bg-linear-to-tr from-purple-500/20 to-cyan-400/20 blur-[100px] rounded-full animate-ping" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-[0.04]" />
        </div>

        {/* Main Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 px-6 relative z-10 mb-16">
          
          {/* Column 1: Brand & Info */}
          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:scale-[1.02] hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] duration-500">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <img src={logo} alt="CodeNova Logo" className="h-12 w-12 object-contain drop-shadow-md" />
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-blue-300 tracking-tight">
                Code-A-Nova
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
              Empowering students with real-world tech internships and expert mentorship.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>codeanova26@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>+91 7880533908</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>India</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-transform hover:scale-[1.02] duration-500">
            <h4 className="text-xl font-semibold text-cyan-300 mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.to} className="group">
                  <Link
                    to={link.to}
                    className="flex items-center gap-2 hover:text-cyan-400 transition-colors duration-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-transform hover:scale-[1.02] duration-500">
            <h4 className="text-xl font-semibold text-purple-400 mb-6">Legal</h4>
            <ul className="space-y-3 text-sm">
              {legalLinks.map((link) => (
                <li key={link.to} className="group">
                  <Link
                    to={link.to}
                    className="flex items-center gap-2 hover:text-purple-400 transition-colors duration-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-purple-400 transition-colors"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Follow Us */}
          <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-transform hover:scale-[1.02] duration-500">
            <h4 className="text-xl font-semibold text-pink-400 mb-6">Follow Us</h4>
            <div className="flex gap-5 text-2xl mb-8">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-3 rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50"
                  aria-label={social.label}
                >
                  <span className="text-gray-400 group-hover:text-cyan-400 transition-colors">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
            <button
              onClick={scrollToTop}
              className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-cyan-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 hover:from-cyan-500 hover:to-blue-600"
            >
              <ArrowUp className="group-hover:-translate-y-1 transition-transform" />
              Back to Top
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

        {/* Bottom Bar */}
        <div className="bg-black py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
            <p className="text-gray-500">
              © {new Date().getFullYear()} <span className="text-white font-bold">Code-A-Nova</span>. All rights reserved.
            </p>

            <button className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300">
              <span className="text-gray-400 group-hover:text-white transition-colors">Created by</span>
              <span className="font-bold bg-linear-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wide group-hover:brightness-125 transition-all">
                CODE-A-NOVA
              </span>
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-cyan-500 to-purple-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Code2 size={18} className="text-white" />
              </div>
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;