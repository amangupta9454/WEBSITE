import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../animations/variants';

const Partners = () => {
  return (
    <section className="py-12 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
        <motion.p 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-8"
        >
          Our Trusted Partners
        </motion.p>
        
        <motion.div 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 opacity-70 grayscale hover:grayscale-0 transition-all duration-500"
        >
          {/* Edunet Foundation */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              E
            </div>
            <span className="text-2xl font-black text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors duration-300">
              Edunet Foundation
            </span>
          </div>

          {/* Aptimaster AI */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              A
            </div>
            <span className="text-2xl font-black text-gray-800 tracking-tight group-hover:text-indigo-600 transition-colors duration-300">
              Aptimaster AI
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Partners;
