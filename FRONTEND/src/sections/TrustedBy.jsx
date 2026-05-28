import React from 'react';
import { motion } from 'framer-motion';

const companies = [
  { name: 'TechFlow', logo: 'T' },
  { name: 'DataSync', logo: 'D' },
  { name: 'CloudScale', logo: 'C' },
  { name: 'NexGen', logo: 'N' },
  { name: 'InnovateAI', logo: 'I' },
  // Duplicate for smooth infinite scroll
  { name: 'TechFlow', logo: 'T' },
  { name: 'DataSync', logo: 'D' },
  { name: 'CloudScale', logo: 'C' },
  { name: 'NexGen', logo: 'N' },
  { name: 'InnovateAI', logo: 'I' },
  // Triplicate just in case of very wide screens
  { name: 'TechFlow', logo: 'T' },
  { name: 'DataSync', logo: 'D' },
  { name: 'CloudScale', logo: 'C' },
  { name: 'NexGen', logo: 'N' },
  { name: 'InnovateAI', logo: 'I' },
];

const TrustedBy = () => {
  return (
    <section className="py-12 border-b border-white/5 bg-brand-navy relative overflow-hidden flex flex-col justify-center">
      {/* Edge Gradients for smooth fade */}
      <div className="absolute top-0 left-0 w-24 md:w-48 h-full bg-gradient-to-r from-brand-navy to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 md:w-48 h-full bg-gradient-to-l from-brand-navy to-transparent z-20 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 text-center relative z-10 mb-10 w-full">
        <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-widest">Trusted by growing local businesses and innovative startups</p>
      </div>

      <div className="flex w-[200%] md:w-max overflow-hidden">
        <motion.div 
          className="flex flex-nowrap gap-16 md:gap-32 items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        >
          {companies.map((company, index) => (
            <div key={index} className="flex items-center gap-3 text-xl md:text-2xl font-bold text-gray-600 transition-all duration-300 hover:text-white cursor-default group flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black group-hover:border-brand-electric/50 group-hover:bg-brand-electric/10 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] group-hover:text-brand-electric transition-all duration-300">
                {company.logo}
              </div>
              {company.name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedBy;
