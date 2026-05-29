import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, Code2, Layout, Zap, Headphones } from 'lucide-react';
import { staggerContainer, fadeUp } from '../animations/variants';
import GlitchTitle from "../Components/GlitchTitle";
import TiltSpotlightCard from '../Components/TiltSpotlightCard';

const features = [
  { icon: <Clock size={24} />, title: 'Lightning Fast', desc: 'Agile development cycles ensuring you launch ahead of the competition.', color: 'text-brand-emerald', bg: 'bg-brand-emerald/10', border: 'border-brand-emerald/20' },
  { icon: <Shield size={24} />, title: 'Bank-Grade Security', desc: 'Robust systems built to handle scale and protect your valuable data.', color: 'text-brand-mint', bg: 'bg-brand-mint/10', border: 'border-brand-mint/20' },
  { icon: <Code2 size={24} />, title: 'Modern Tech Stack', desc: 'We only use cutting-edge, future-proof frameworks.', color: 'text-brand-gold', bg: 'bg-brand-gold/10', border: 'border-brand-gold/20' },
  { icon: <Layout size={24} />, title: 'Flawless UI/UX', desc: 'Pixel-perfect, conversion-optimized designs across all devices.', color: 'text-brand-emerald', bg: 'bg-brand-emerald/10', border: 'border-brand-emerald/20' },
  { icon: <Zap size={24} />, title: 'AI Integration', desc: 'Automate your workflows with smart features and AI models.', color: 'text-brand-gold', bg: 'bg-brand-gold/10', border: 'border-brand-gold/20' },
  { icon: <Headphones size={24} />, title: 'VIP Support', desc: 'Dedicated ongoing maintenance and rapid issue resolution.', color: 'text-brand-mint', bg: 'bg-brand-mint/10', border: 'border-brand-mint/20' }
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 md:py-32 relative bg-[#F9FBF9]/80 backdrop-blur-[2px] overflow-hidden border-t border-zinc-100">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-brand-emerald/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-brand-amber/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="lg:col-span-4 lg:sticky lg:top-32"
          >
            <div className="inline-block mb-4 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 font-bold text-xs tracking-widest uppercase font-mono shadow-sm">
              The Code-A-Nova Edge
            </div>
            <GlitchTitle
              text="Why Choose Code-A-Nova?"
              highlight="Code-A-Nova?"
              className="text-3xl md:text-5xl font-black mb-6 text-zinc-950 leading-tight tracking-tight font-sans"
              tag="h2"
            />
            <p className="text-zinc-500 text-lg mb-8 font-medium leading-relaxed">
              We don't just write code; we build digital businesses. Our professional workflow ensures flawless quality, ultimate scalability, and ironclad security from day one.
            </p>
            
            {/* Small metric callout */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/40 flex items-center gap-4 backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-emerald to-brand-mint flex items-center justify-center text-zinc-950 font-black text-2xl shadow-lg shadow-brand-emerald/10 shrink-0">
                #1
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 tracking-tight">Top Rated Agency</h4>
                <p className="text-sm font-medium text-zinc-500">Trusted by 50+ local businesses</p>
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
              <motion.div key={idx} variants={fadeUp}>
                <TiltSpotlightCard className="p-6 md:p-8 hover:shadow-xl hover:shadow-zinc-300/30 h-full flex flex-col justify-start">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 border ${feat.bg} ${feat.color} ${feat.border} shadow-sm shrink-0`}>
                    {feat.icon}
                  </div>
                  <h4 className="text-lg md:text-xl font-bold text-zinc-900 mb-2 md:mb-3 tracking-tight">{feat.title}</h4>
                  <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">{feat.desc}</p>
                </TiltSpotlightCard>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
