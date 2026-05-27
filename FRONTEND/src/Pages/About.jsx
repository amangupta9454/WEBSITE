import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../animations/variants';
import WhyChooseUs from '../sections/WhyChooseUs';
import { Target, Lightbulb, Shield, Zap, CheckCircle2 } from 'lucide-react';

const stats = [
  { number: "50+", label: "Projects Delivered" },
  { number: "100%", label: "Client Satisfaction" },
  { number: "24/7", label: "Premium Support" },
  { number: "5X", label: "Average ROI" },
];

const values = [
  { icon: <Target className="text-blue-600" size={28} />, title: "Result-Driven", desc: "We build scalable digital assets that generate real revenue.", bg: "bg-blue-50", border: "border-blue-100", hoverShadow: "hover:shadow-blue-500/10" },
  { icon: <Lightbulb className="text-purple-600" size={28} />, title: "Innovative Design", desc: "Stunning aesthetics blended with flawless user experience.", bg: "bg-purple-50", border: "border-purple-100", hoverShadow: "hover:shadow-purple-500/10" },
  { icon: <Shield className="text-emerald-600" size={28} />, title: "Uncompromising Quality", desc: "Pixel-perfect UIs and robust, highly secure backend systems.", bg: "bg-emerald-50", border: "border-emerald-100", hoverShadow: "hover:shadow-emerald-500/10" },
  { icon: <Zap className="text-orange-600" size={28} />, title: "Lightning Fast", desc: "Speed is revenue. We optimize every line of code for instant loads.", bg: "bg-orange-50", border: "border-orange-100", hoverShadow: "hover:shadow-orange-500/10" }
];

const About = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="pt-32 pb-20 md:pt-40 md:pb-24 bg-[#FAFAFA] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-r from-blue-100/50 to-purple-100/50 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold text-sm tracking-wide uppercase">
            About Code-A-Nova
          </motion.div>
          <motion.h1 
            initial="hidden" animate="visible" variants={fadeUp}
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 text-gray-900 tracking-tight leading-tight"
          >
            Engineering the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Future</span>
          </motion.h1>
          <motion.p 
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-2xl mx-auto text-lg md:text-xl mb-12 font-medium leading-relaxed"
          >
            We are a premium software development agency committed to transforming innovative ideas into scalable, high-performance digital solutions for modern businesses.
          </motion.p>

          {/* Stats Bar */}
          <motion.div 
            initial="hidden" animate="visible" variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20"
          >
            {stats.map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-1">{stat.number}</h3>
                <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Our Story / Mission */}
      <section className="py-16 md:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Image/Graphic */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="w-full lg:w-1/2"
            >
              <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-100 p-8 md:p-12 aspect-square md:aspect-[4/3] flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-10 mix-blend-luminosity" />
                <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 md:p-8 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl mb-6 flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h4 className="text-xl font-black text-gray-900 mb-2">Our Mission</h4>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed">
                    To empower local businesses with enterprise-grade digital tools, bridging the gap between small business and massive digital scale.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Content */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="w-full lg:w-1/2"
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                Not Just Developers. <br/> <span className="text-blue-600">Digital Growth Partners.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-500 font-medium text-lg leading-relaxed mb-8">
                Most agencies just build a website, hand you the keys, and disappear. We believe your digital presence is a living ecosystem that requires strategic planning, stunning execution, and ongoing optimization.
              </motion.p>
              
              <div className="space-y-4">
                {['Strategic Planning & Discovery', 'High-Converting UI/UX Design', 'Lightning-Fast Modern Tech Stack', 'Ongoing Maintenance & Support'].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-500 shrink-0" size={24} />
                    <span className="text-gray-900 font-bold">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 md:py-24 bg-[#FAFAFA] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-500 font-medium text-lg">The principles that drive every single project we take on.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((val, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`group bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-2xl ${val.hoverShadow} hover:-translate-y-2 transition-all duration-500 relative overflow-hidden`}
              >
                {/* Glowing corner on hover */}
                <div className={`absolute -top-12 -right-12 w-32 h-32 ${val.bg} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className={`relative z-10 w-12 h-12 md:w-14 md:h-14 ${val.bg} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 border ${val.border} shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {val.icon}
                </div>
                <h3 className="relative z-10 text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{val.title}</h3>
                <p className="relative z-10 text-gray-500 font-medium text-[12px] md:text-sm leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WhyChooseUs />
    </MainLayout>
  );
};

export default About;
