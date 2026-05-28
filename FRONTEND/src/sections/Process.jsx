import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, PenTool, Code2, CheckCircle, Rocket, HeadphonesIcon } from 'lucide-react';
import { fadeUp, staggerContainer } from '../animations/variants';

const steps = [
  { icon: <MessageSquare size={24} />, title: "Discovery Phase", desc: "We deeply understand your business goals, target audience, and specific needs before writing a single line of code." },
  { icon: <PenTool size={24} />, title: "UI/UX Design", desc: "We craft a premium, high-converting design tailored to your brand identity, ensuring maximum user engagement." },
  { icon: <Code2 size={24} />, title: "Development", desc: "Our expert engineers build your platform using lightning-fast, modern, and highly secure web technologies." },
  { icon: <CheckCircle size={24} />, title: "Rigorous QA", desc: "We perform intensive testing to ensure flawless performance, speed, and responsiveness across all devices." },
  { icon: <Rocket size={24} />, title: "Deployment", desc: "We handle the complex deployment process, setting up your servers, custom domains, and SSL certificates." },
  { icon: <HeadphonesIcon size={24} />, title: "Ongoing Support", desc: "We don't just launch and leave. We provide continuous maintenance, updates, and priority support." },
];

const Process = () => {
  return (
    <section className="py-16 md:py-24 bg-white/80 backdrop-blur-[2px] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full max-w-2xl h-96 bg-gradient-to-bl from-emerald-50/20 to-transparent rounded-bl-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="inline-block mb-4 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-brand-emerald font-bold text-sm tracking-widest uppercase font-mono shadow-sm">
            How It Works
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl lg:text-6xl font-black text-zinc-950 mb-6 tracking-tight font-sans">
            Our Proven <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-brand-mint">Process</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed">
            From the first hello to the final launch, we handle everything. You focus on running your business while we build your digital empire.
          </motion.p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-brand-emerald via-brand-mint to-brand-emerald md:-translate-x-1/2 rounded-full opacity-20" />

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6 md:space-y-0" 
          >
            {steps.map((step, i) => (
              <motion.div 
                key={i} 
                variants={fadeUp} 
                className={`relative flex flex-col md:flex-row items-center md:pb-6 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
              >
                
                {/* Glowing Timeline Dot */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-6 md:top-1/2 md:-translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white border-4 border-brand-emerald rounded-full flex items-center justify-center text-sm md:text-base font-black text-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.2)] z-10 transition-transform hover:scale-110">
                  {i + 1}
                </div>

                {/* Content Box */}
                <div className={`w-full md:w-1/2 pl-14 md:pl-0 ${i % 2 !== 0 ? 'md:pl-10 lg:pl-14' : 'md:pr-10 lg:pr-14'}`}>
                  <div className="relative group bg-white border border-zinc-100 p-5 md:p-6 rounded-[1.5rem] shadow-[0_4px_30px_rgba(0,0,0,0.015)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    {/* Tiny visual connecting line to the dot (desktop only) */}
                    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-10 lg:w-14 h-[2px] bg-zinc-100 -z-10 ${i % 2 !== 0 ? '-left-10 lg:-left-14' : '-right-10 lg:-right-14'}`} />
                    
                    <div className="flex items-center gap-3 md:gap-4 mb-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded-xl flex items-center justify-center text-brand-emerald shrink-0 group-hover:rotate-6 transition-transform shadow-sm">
                        {step.icon}
                      </div>
                      <h3 className="font-bold text-zinc-900 text-lg md:text-xl leading-tight tracking-tight">{step.title}</h3>
                    </div>
                    <p className="text-[13px] md:text-sm text-zinc-500 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </div>

                {/* Empty Half Space for Desktop Grid */}
                <div className="hidden md:block w-1/2" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Process;
