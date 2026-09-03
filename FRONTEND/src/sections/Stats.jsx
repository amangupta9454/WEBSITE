import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../animations/variants';
import { Code2, Cpu, GraduationCap, ShieldCheck } from 'lucide-react';

const capabilities = [
  {
    icon: <Code2 className="text-blue-600" size={28} />,
    title: "Web & Software Engineering",
    desc: "Modern full-stack platforms built with React, Next.js, and scalable cloud architectures.",
    tag: "Core Focus"
  },
  {
    icon: <Cpu className="text-purple-600" size={28} />,
    title: "AI-Powered Tools",
    desc: "Intelligent automation workflows, custom LLM integrations, and modern digital tools.",
    tag: "Intelligence"
  },
  {
    icon: <GraduationCap className="text-emerald-600" size={28} />,
    title: "Student & Internship Programs",
    desc: "Practical project incubation, structured skill tracks, and verifiable credentials.",
    tag: "Talent"
  },
  {
    icon: <ShieldCheck className="text-amber-600" size={28} />,
    title: "MSME Registered Enterprise",
    desc: "Formally registered Indian micro enterprise operating with transparent standards.",
    tag: "Verified"
  },
];

const Stats = () => {
  return (
    <section className="py-16 md:py-20 border-y border-gray-200 relative bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {capabilities.map((item, index) => (
            <motion.div 
              key={index}
              variants={fadeUp}
              className="flex flex-col p-7 rounded-3xl bg-gray-50/80 border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 hover:bg-white hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-white border border-gray-100 shadow-2xs group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200/70">
                  {item.tag}
                </span>
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Stats;
