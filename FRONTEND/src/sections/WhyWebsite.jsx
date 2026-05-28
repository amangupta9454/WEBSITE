import React from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { fadeUp, staggerContainer } from '../animations/variants';

const reasons = [
  {
    icon: <Search className="text-brand-emerald" size={32} />,
    title: 'Customers Search Online First',
    desc: '97% of consumers go online to find local services. If you aren’t there, they go to your competitor.'
  },
  {
    icon: <ShieldCheck className="text-brand-mint" size={32} />,
    title: 'Instant Credibility & Trust',
    desc: 'A premium, professional website signals that your business is legitimate, reliable, and high-quality.'
  },
  {
    icon: <TrendingUp className="text-brand-emerald" size={32} />,
    title: 'Sales While You Sleep',
    desc: 'Your website acts as a 24/7 sales representative, taking bookings, answering FAQs, and driving revenue.'
  },
  {
    icon: <Users className="text-brand-mint" size={32} />,
    title: 'Outshine Competitors',
    desc: 'Most local businesses have outdated or no websites. A modern digital presence gives you an unfair advantage.'
  }
];

const WhyWebsite = () => {
  return (
    <section className="py-12 md:py-24 bg-white/80 backdrop-blur-[2px] relative overflow-hidden">
      {/* Background decoration glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-emerald/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-amber/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black text-zinc-950 mb-6 leading-tight tracking-tight">
              Why Does Your Business Need a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-brand-mint">Website?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-zinc-500 font-medium mb-10 leading-relaxed">
              Relying only on word-of-mouth or social media is holding your business back. A dedicated website is the ultimate asset for building trust, capturing leads, and scaling your revenue predictably.
            </motion.p>

            <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6 mt-8">
              {reasons.map((r, i) => (
                <motion.div key={i} variants={fadeUp} className="flex md:flex-col gap-4 md:gap-0 items-start bg-zinc-50 p-5 md:p-6 rounded-2xl md:bg-transparent md:p-0 border border-zinc-100 md:border-none hover:border-brand-emerald/20 transition-all duration-300">
                  <div className="mb-0 md:mb-4 bg-white shrink-0 p-3 md:p-4 rounded-xl border border-zinc-100 shadow-sm">
                    {r.icon}
                  </div>
                  <div>
                    <h4 className="text-base md:text-xl font-bold text-zinc-900 mb-1 md:mb-2 leading-tight tracking-tight">{r.title}</h4>
                    <p className="text-[13px] md:text-base text-zinc-500 font-medium leading-relaxed">{r.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-gradient-to-tr from-brand-emerald/20 to-brand-mint/5 p-[1px] rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-zinc-200/40 mt-8 lg:mt-0">
              <div className="bg-white rounded-[1.9rem] md:rounded-[2.4rem] overflow-hidden p-6 md:p-10 relative border border-zinc-150">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-emerald/5 via-transparent to-transparent pointer-events-none" />
                
                <h3 className="text-2xl md:text-3xl font-black text-zinc-900 mb-6 md:mb-8 relative z-10 text-center tracking-tight">See The Difference</h3>
                
                <div className="space-y-4 md:space-y-6 relative z-10">
                  <div className="flex items-center gap-3 md:gap-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-100 border border-rose-200 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-rose-600 font-bold text-lg md:text-xl">✗</span>
                    </div>
                    <div>
                      <p className="font-bold text-rose-900 text-sm md:text-base">Without a Website</p>
                      <p className="text-[12px] md:text-sm text-rose-700 font-medium mt-0.5 md:mt-1 leading-tight md:leading-normal">Invisible on Google search engines, hard to book, lower client trust.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm md:transform md:scale-105 border-l-4 border-l-brand-emerald">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-emerald rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-brand-emerald/20 text-zinc-950">
                      <span className="font-black text-lg md:text-xl">✓</span>
                    </div>
                    <div>
                      <p className="font-black text-zinc-900 text-sm md:text-base">With a Premium Website</p>
                      <p className="text-[12px] md:text-sm text-zinc-700 font-bold mt-0.5 md:mt-1 leading-tight md:leading-normal">Rank on Google first page, automated online bookings, premium brand image.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyWebsite;
