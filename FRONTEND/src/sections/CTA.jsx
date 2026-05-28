import React from 'react';
import { motion } from 'framer-motion';
import Button from '../Components/Button';
import { fadeUp } from '../animations/variants';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-8 md:py-16 relative overflow-hidden bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-12 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeUp}
          className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-12 text-center shadow-2xl shadow-blue-900/20 overflow-hidden border border-blue-400/30"
        >
          {/* Abstract glowing shapes inside the card for premium feel */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 rounded-full blur-[80px] opacity-50" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-400 rounded-full blur-[100px] opacity-40" />
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-black mb-4 md:mb-6 text-white leading-tight tracking-tight">
              Your Business Deserves a <br className="hidden md:block"/> Premium Website
            </h2>
            <p className="text-blue-100 font-medium text-base md:text-xl mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop losing sales to competitors. Let's build a stunning digital presence that turns visitors into paying customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
              <button onClick={() => navigate('/contact')} className="w-full sm:w-auto px-8 py-4 bg-white text-blue-900 font-black rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Start Your Project Today
              </button>
              <button onClick={() => navigate('/services')} className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 backdrop-blur-md transition-colors duration-300 flex items-center justify-center gap-2">
                View Services <ArrowRight size={18} />
              </button>
            </div>
            
            <div className="mt-8 md:mt-12 flex items-center justify-center gap-6 text-blue-100/80 text-sm font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1">✓ Fast Delivery</span>
              <span className="hidden md:flex items-center gap-1">✓ Premium Design</span>
              <span className="flex items-center gap-1">✓ SEO Optimized</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export const InternshipCTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-8 md:py-12 border-t border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100/50 shadow-sm rounded-2xl md:rounded-[2rem] p-6 md:p-10 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <div className="p-4 md:p-5 bg-white rounded-xl md:rounded-2xl text-blue-600 shadow-sm border border-gray-50 shrink-0">
              <GraduationCap size={32} className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-gray-900 mb-1 md:mb-2">Want to Learn With Our Team?</h3>
              <p className="text-xs md:text-sm font-medium text-gray-600 leading-relaxed">Join our comprehensive internship program and work on real-world projects. Build your career with hands-on experience.</p>
            </div>
          </div>
          <button onClick={() => navigate('/registration')} className="w-full md:w-auto px-6 py-3 bg-gray-900 text-white font-bold rounded-xl md:rounded-full hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shrink-0">
            Apply for Internship <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
