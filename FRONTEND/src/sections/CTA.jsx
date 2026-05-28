import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../animations/variants';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-8 md:py-16 relative overflow-hidden bg-white/80 backdrop-blur-[2px]">
      <div className="max-w-5xl mx-auto px-4 md:px-12 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeUp}
          className="relative bg-gradient-to-br from-white to-[#F4F9F6] border border-zinc-150 shadow-2xl shadow-zinc-200/50 rounded-[1.5rem] md:rounded-[2.5rem] p-8 md:p-14 text-center overflow-hidden"
        >
          {/* Abstract glowing shapes inside the card for premium feel */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-emerald/5 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-mint/5 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 text-zinc-950 leading-tight tracking-tight">
              Your Business Deserves a <br className="hidden md:block"/> Premium Website
            </h2>
            <p className="text-zinc-500 font-medium text-base md:text-xl mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop losing sales to competitors. Let's build a stunning digital presence that turns visitors into paying customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
              <button 
                onClick={() => navigate('/contact')} 
                className="w-full sm:w-auto px-8 py-4 bg-zinc-950 text-white hover:bg-brand-emerald hover:text-zinc-950 font-black rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-xl shadow-zinc-950/10 cursor-pointer"
              >
                Start Your Project Today
              </button>
              <button 
                onClick={() => navigate('/services')} 
                className="w-full sm:w-auto px-8 py-4 bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 hover:border-zinc-300 font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                View Services <ArrowRight size={18} />
              </button>
            </div>
            
            <div className="mt-8 md:mt-12 flex items-center justify-center gap-6 text-zinc-500 text-xs font-bold uppercase tracking-widest font-mono">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" /> Fast Delivery</span>
              <span className="hidden md:flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" /> Premium Design</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" /> SEO Optimized</span>
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
    <section className="py-8 md:py-16 border-t border-zinc-100 bg-[#F9FBF9]/80 backdrop-blur-[2px]">
      <div className="max-w-5xl mx-auto px-4 md:px-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white border border-zinc-100 shadow-xl shadow-zinc-200/30 rounded-2xl md:rounded-[2rem] p-6 md:p-10 hover:border-brand-emerald/20 transition-all duration-500 group">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <div className="p-4 md:p-5 bg-emerald-50 rounded-xl md:rounded-2xl text-brand-emerald border border-emerald-100/50 shrink-0 group-hover:bg-brand-emerald group-hover:text-zinc-950 transition-colors duration-300">
              <GraduationCap size={32} className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-zinc-900 mb-1 md:mb-2 tracking-tight">Want to Learn With Our Team?</h3>
              <p className="text-xs md:text-sm font-medium text-zinc-500 leading-relaxed">Join our comprehensive internship program and work on real-world projects. Build your career with hands-on experience.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/registration')} 
            className="w-full md:w-auto px-6 py-3.5 bg-zinc-950 text-white font-black rounded-full hover:bg-brand-emerald hover:text-zinc-950 transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            Apply for Internship <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
