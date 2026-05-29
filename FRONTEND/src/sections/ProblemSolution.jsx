import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, CheckCircle2 } from 'lucide-react';
import { fadeUp, staggerContainer } from '../animations/variants';

const painPoints = [
  "No online presence or outdated website",
  "Losing customers to modern competitors",
  "Low brand trust and poor first impression",
  "Relying entirely on manual operations",
];

const solutions = [
  "Premium, lightning-fast modern websites",
  "Built-in online ordering and booking systems",
  "Instant brand authority and higher trust",
  "Automated dashboards to manage everything",
];

const ProblemSolution = () => {
  return (
    <section className="py-12 md:py-24 bg-[#F9FBF9]/80 backdrop-blur-[2px] relative overflow-hidden">
      {/* Subtle light ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-brand-emerald/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black text-zinc-950 mb-6 leading-tight tracking-tight">
              Stop Losing Customers <br className="hidden sm:block" /> to Your Competitors
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed">
            In today's digital world, your business is judged by how it looks online. 
            We fix outdated digital footprints and automate operations.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
          {/* Pain Points Card */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-rose-50/70 border border-rose-100 rounded-3xl p-6 md:p-8 shadow-sm hover:border-rose-300 hover:bg-rose-50/90 transition-all duration-300 relative group overflow-hidden"
          >
            {/* Soft hover glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            
            <h3 className="text-xl md:text-2xl font-black text-rose-700 mb-6 font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> The Problem
            </h3>
            <ul className="space-y-4">
              {painPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <XCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                  <span className="text-sm md:text-base text-zinc-700 font-semibold leading-normal">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Solutions Card */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-emerald-50/70 border border-emerald-100 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/40 hover:border-brand-emerald/30 hover:bg-emerald-50/90 transition-all duration-300 relative overflow-hidden group"
          >
            {/* Glowing solution highlight */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-emerald/10 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-500" />
            
            <h3 className="text-xl md:text-2xl font-black text-brand-emerald mb-6 font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" /> The Solution
            </h3>
            <ul className="space-y-4 relative z-10">
              {solutions.map((solution, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="text-brand-emerald shrink-0 mt-0.5" size={20} />
                  <span className="text-sm md:text-base text-zinc-900 font-bold leading-normal">{solution}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
