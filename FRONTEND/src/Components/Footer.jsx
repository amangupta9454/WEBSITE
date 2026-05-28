import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Linkedin, Instagram, Mail, ArrowRight } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-zinc-100 relative overflow-hidden">
      {/* Subtle top divider */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-emerald/20 to-transparent" />
      
      {/* Soft ambient mint blur light */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-brand-emerald/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-20 pb-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Brand & Final Pitch (Takes up more space) */}
          <div className="lg:col-span-5 pr-0 lg:pr-12">
            <Link
              to="/"
              className="group mb-6 transition-transform duration-300 hover:scale-105 inline-block"
            >
              <span className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">
                Code
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-brand-mint">
                  -A-
                </span>
                Nova
              </span>
            </Link>
            <p className="text-zinc-500 font-medium text-base md:text-lg leading-relaxed mb-8">
              Stop losing customers to outdated design. We build high-converting
              premium websites and scalable software for modern businesses.
            </p>
            <button
              onClick={() => navigate("/contact")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-950 text-white font-black rounded-full hover:bg-brand-emerald hover:text-zinc-950 transition-colors shadow-lg hover:shadow-brand-emerald/20 mb-8 cursor-pointer"
            >
              Get Your Free Proposal <ArrowRight size={18} />
            </button>
            <div className="flex items-center gap-4">
              <a
                href="https://www.linkedin.com/company/code-a-nova/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-emerald-50 hover:text-brand-emerald transition-colors border border-zinc-100"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://www.instagram.com/codenova31/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-pink-50 hover:text-pink-600 transition-colors border border-zinc-100"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-zinc-900 font-black text-lg mb-6">
                Services
              </h4>
              <ul className="flex flex-col gap-4">
                <li>
                  <Link
                    to="/services"
                    className="text-zinc-500 hover:text-brand-emerald font-medium transition-colors text-sm"
                  >
                    Web Development
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-zinc-500 hover:text-brand-emerald font-medium transition-colors text-sm"
                  >
                    AI Solutions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-zinc-500 hover:text-brand-emerald font-medium transition-colors text-sm"
                  >
                    ERP Systems
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-zinc-500 hover:text-brand-emerald font-medium transition-colors text-sm"
                  >
                    SaaS Platforms
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-zinc-900 font-black text-lg mb-6">Company</h4>
              <ul className="flex flex-col gap-4">
                <li>
                  <Link
                    to="/about"
                    className="text-zinc-500 hover:text-brand-emerald font-medium transition-colors text-sm"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/projects"
                    className="text-zinc-500 hover:text-brand-emerald font-medium transition-colors text-sm"
                  >
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/internship"
                    className="text-zinc-500 hover:text-brand-emerald font-medium transition-colors text-sm"
                  >
                    Careers & Internships
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-zinc-500 hover:text-brand-emerald font-medium transition-colors text-sm"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1 flex flex-col h-full">
              <h4 className="text-zinc-900 font-black text-lg mb-6">
                Contact Us
              </h4>
              <ul className="flex flex-col gap-4 mb-4">
                <li className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-700 font-bold text-sm hover:border-brand-emerald/30 hover:bg-emerald-50/20 transition-all duration-300">
                  <Mail size={18} className="text-brand-emerald shrink-0" />
                  <a href="mailto:codeanova26@gmail.com" className="truncate font-mono">
                    codeanova26@gmail.com
                  </a>
                </li>
              </ul>
              
              <div className="mt-auto flex justify-end">
                <button
                  onClick={() => navigate('/student-login')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-emerald to-brand-mint text-zinc-950 font-black text-xs rounded-full hover:shadow-lg hover:shadow-brand-emerald/20 transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  Intern Login <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-zinc-100 text-zinc-400 font-medium text-xs md:text-sm gap-4 text-center md:text-left">
          <p>
            &copy; {new Date().getFullYear()} Code-A-Nova. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link
              to="/privacy-policy"
              className="hover:text-brand-emerald transition-colors"
            >
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-brand-emerald transition-colors">
              Terms of Service
            </Link>
            <Link
              to="/refund-policy"
              className="hover:text-brand-emerald transition-colors"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
