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
    <section className="py-12 md:py-24 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              Stop Losing Customers <br className="hidden sm:block" /> to Your Competitors
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
            In today's digital world, your business is judged by how it looks online. 
            We fix outdated digital footprints.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Pain Points Card */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-red-500/10 border border-red-200/50 rounded-3xl p-6 md:p-8 shadow-sm"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-red-600 mb-4 md:mb-6">
              The Problem
            </h3>
            <ul className="space-y-3 md:space-y-5">
              {painPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <XCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                  <span className="text-sm md:text-base text-gray-700 font-medium">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Solutions Card */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-sky-500/10 border border-sky-200/50 rounded-3xl p-6 md:p-8 shadow-xl shadow-sky-900/5 relative overflow-hidden"
          >
            {/* Subtle glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-50" />
            
            <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4 md:mb-6 relative z-10">
              The Solution
            </h3>
            <ul className="space-y-3 md:space-y-5 relative z-10">
              {solutions.map((solution, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="text-blue-600 shrink-0 mt-0.5" size={20} />
                  <span className="text-sm md:text-base text-gray-800 font-medium">{solution}</span>
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
