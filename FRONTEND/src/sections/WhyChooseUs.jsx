import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, Code2, Layout, Zap, Headphones } from 'lucide-react';
import { staggerContainer, fadeUp } from '../animations/variants';

const features = [
  { icon: <Clock size={24} />, title: 'Lightning Fast', desc: 'Agile development cycles ensuring you launch ahead of the competition.', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { icon: <Shield size={24} />, title: 'Bank-Grade Security', desc: 'Robust systems built to handle scale and protect your valuable data.', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { icon: <Code2 size={24} />, title: 'Modern Tech Stack', desc: 'We only use cutting-edge, future-proof frameworks.', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  { icon: <Layout size={24} />, title: 'Flawless UI/UX', desc: 'Pixel-perfect, conversion-optimized designs across all devices.', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
  { icon: <Zap size={24} />, title: 'AI Integration', desc: 'Automate your workflows with smart features and AI models.', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  { icon: <Headphones size={24} />, title: 'VIP Support', desc: 'Dedicated ongoing maintenance and rapid issue resolution.', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' }
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 md:py-32 relative bg-[#FAFAFA] overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-50/50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="lg:col-span-4 lg:sticky lg:top-32"
          >
            <div className="inline-block mb-4 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 font-bold text-xs tracking-wider uppercase shadow-sm">
              The Code-A-Nova Edge
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-gray-900 leading-tight">
              Why Choose <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Code-A-Nova?</span>
            </h2>
            <p className="text-gray-500 text-lg mb-8 font-medium leading-relaxed">
              We don't just write code; we build digital businesses. Our professional workflow ensures flawless quality, ultimate scalability, and ironclad security from day one.
            </p>
            
            {/* Small metric callout */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                #1
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Top Rated Agency</h4>
                <p className="text-sm font-medium text-gray-500">Trusted by 50+ local businesses</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="lg:col-span-8 grid sm:grid-cols-2 gap-4 md:gap-6"
          >
            {features.map((feat, idx) => (
              <motion.div 
                key={idx}
                variants={fadeUp}
                className="group p-5 md:p-8 bg-white border border-gray-100 rounded-2xl md:rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 border ${feat.bg} ${feat.color} ${feat.border} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}>
                  {feat.icon}
                </div>
                <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{feat.title}</h4>
                <p className="text-[12px] md:text-sm text-gray-500 font-medium leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
