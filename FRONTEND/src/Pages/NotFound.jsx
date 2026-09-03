import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../Components/SEO';
import { motion } from 'framer-motion';
import { fadeUp } from '../animations/variants';
import { Home, ArrowRight, Compass, HelpCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <MainLayout>
      <SEO 
        title="Page Not Found (404) | Code-A-Nova"
        description="The page you are looking for does not exist or has been moved."
        noIndex={true}
      />

      <div className="pt-36 pb-24 md:pt-44 md:pb-36 bg-[#FAFAFA] min-h-[85vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <div className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-4 tracking-tighter">
              404
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Page Not Found
            </h1>

            <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed mb-8 max-w-md mx-auto">
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white font-bold text-xs sm:text-sm rounded-full hover:bg-blue-600 transition-all shadow-md cursor-pointer"
              >
                <Home size={16} />
                <span>Return to Homepage</span>
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-gray-800 border border-gray-200 font-bold text-xs sm:text-sm rounded-full hover:bg-gray-50 transition-all shadow-2xs cursor-pointer"
              >
                <Compass size={16} />
                <span>Explore Services</span>
              </Link>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-200/60 text-xs text-gray-400 font-medium">
              Need assistance? Reach our team at <Link to="/contact" className="text-blue-600 font-bold hover:underline">Contact Support</Link>.
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
