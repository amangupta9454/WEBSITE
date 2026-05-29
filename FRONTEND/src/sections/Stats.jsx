import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../animations/variants';
import BorderGlow from '../Components/BorderGlow';

const stats = [
  { 
    label: 'Businesses Grown', 
    value: '50+', 
    gradient: 'from-emerald-600 to-teal-500', 
    colors: ['#10B981', '#34D399', '#059669'], 
    glowColor: '162 80% 40%' 
  },
  { 
    label: 'Websites Delivered', 
    value: '100+', 
    gradient: 'from-amber-600 to-yellow-500', 
    colors: ['#F59E0B', '#FBBF24', '#D97706'], 
    glowColor: '45 90% 50%' 
  },
  { 
    label: 'Industries Served', 
    value: '12+', 
    gradient: 'from-cyan-600 to-emerald-500', 
    colors: ['#06B6D4', '#22D3EE', '#34D399'], 
    glowColor: '190 85% 45%' 
  },
  { 
    label: 'Client Satisfaction', 
    value: '99%', 
    gradient: 'from-emerald-600 to-mint-500', 
    colors: ['#10B981', '#6EE7B7', '#059669'], 
    glowColor: '158 80% 40%' 
  },
];

const Stats = () => {
  return (
    <section className="py-20 border-y border-zinc-100 relative bg-white/80 backdrop-blur-[2px] overflow-hidden">
      {/* Light mesh glow behind stats */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[150px] bg-brand-emerald/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={fadeUp} className="w-full h-full flex flex-col">
              <BorderGlow
                borderRadius={28}
                backgroundColor="#ffffff"
                glowColor={stat.glowColor}
                colors={stat.colors}
                glowRadius={24}
                glowIntensity={0.8}
                coneSpread={20}
                className="w-full h-full flex flex-col items-stretch"
              >
                <div className="flex flex-col items-center justify-center text-center p-8 cursor-default h-full w-full bg-transparent select-none">
                  <h3 className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient} mb-3 font-sans tracking-tight`}>
                    {stat.value}
                  </h3>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs font-mono">{stat.label}</p>
                </div>
              </BorderGlow>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Stats;
