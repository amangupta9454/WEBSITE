import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Linkedin, Instagram, Mail, PhoneCall, ArrowRight } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-white relative">
      {/* Premium Gradient Top Border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-20 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Brand & Final Pitch (Takes up more space) */}
          <div className="lg:col-span-5 pr-0 lg:pr-12">
            <Link
              to="/"
              className="group mb-6 transition-transform duration-300 hover:scale-105 inline-block"
            >
              <span className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                Code
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  -A-
                </span>
                Nova
              </span>
            </Link>
            <p className="text-gray-500 font-medium text-base md:text-lg leading-relaxed mb-8">
              Stop losing customers to outdated design. We build high-converting
              premium websites and scalable software for modern businesses.
            </p>
            <button
              onClick={() => navigate("/contact")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white font-black rounded-full hover:bg-blue-600 transition-colors shadow-xl shadow-gray-900/10 mb-8"
            >
              Get Your Free Proposal <ArrowRight size={18} />
            </button>
            <div className="flex items-center gap-4">
              <a
                href="https://www.linkedin.com/company/code-a-nova/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-100"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://www.instagram.com/codenova31/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-colors border border-gray-100"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Links Grid (Compact on mobile) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-gray-900 font-black text-lg mb-6">
                Services
              </h4>
              <ul className="flex flex-col gap-4">
                <li>
                  <Link
                    to="/services"
                    className="text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm"
                  >
                    Web Development
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm"
                  >
                    AI Solutions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm"
                  >
                    ERP Systems
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm"
                  >
                    SaaS Platforms
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 font-black text-lg mb-6">Company</h4>
              <ul className="flex flex-col gap-4">
                <li>
                  <Link
                    to="/about"
                    className="text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/projects"
                    className="text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm"
                  >
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/internship"
                    className="text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm"
                  >
                    Careers & Internships
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact forces full width on extra small screens, 1 column on sm */}
            <div className="col-span-2 sm:col-span-1 flex flex-col h-full">
              <h4 className="text-gray-900 font-black text-lg mb-6">
                Contact Us
              </h4>
              <ul className="flex flex-col gap-4 mb-4">
                <li className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 font-bold text-sm hover:border-blue-200 transition-colors">
                  <Mail size={18} className="text-blue-600 shrink-0" />
                  <a href="mailto:codeanova26@gmail.com" className="truncate">
                    codeanova26@gmail.com
                  </a>
                </li>
              </ul>
              
              <div className="mt-auto flex justify-end">
                <button
                  onClick={() => navigate('/student-login')}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs rounded-full hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105"
                >
                  Intern Login <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 text-gray-400 font-medium text-xs md:text-sm gap-4 text-center md:text-left">
          <p>
            &copy; {new Date().getFullYear()} Code-A-Nova. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link
              to="/privacy-policy"
              className="hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-blue-600 transition-colors">
              Terms of Service
            </Link>
            <Link
              to="/refund-policy"
              className="hover:text-blue-600 transition-colors"
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
