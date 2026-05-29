import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { fadeUp, staggerContainer } from '../animations/variants';
import Button from '../Components/Button';
import TiltSpotlightCard from '../Components/TiltSpotlightCard';

const projects = [
  {
    title: 'The Golden Spoon',
    category: 'Restaurant & Ordering',
    tech: ['Menu Sync', 'Reservations'],
    bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100/30',
    borderColor: 'border-amber-100/60 hover:border-brand-amber/30',
    titleColor: 'text-zinc-900',
    categoryColor: 'text-brand-amber',
    tagColor: 'text-amber-700 bg-amber-50 border border-amber-100/30',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    results: '+45% Online Orders'
  },
  {
    title: 'Luxe Aesthetics Clinic',
    category: 'Healthcare & Wellness',
    tech: ['Patient Portal', 'SEO'],
    bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100/30',
    borderColor: 'border-emerald-100/60 hover:border-brand-emerald/30',
    titleColor: 'text-zinc-900',
    categoryColor: 'text-brand-emerald',
    tagColor: 'text-brand-emerald bg-emerald-50 border border-emerald-100/30',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
    results: 'Fully Booked Calendar'
  },
  {
    title: 'Iron Core Fitness',
    category: 'Gym & Subscriptions',
    tech: ['Member Portal', 'Payments'],
    bgColor: 'bg-gradient-to-br from-zinc-50 to-zinc-100/50',
    borderColor: 'border-zinc-200/60 hover:border-zinc-300',
    titleColor: 'text-zinc-900',
    categoryColor: 'text-zinc-500',
    tagColor: 'text-zinc-600 bg-zinc-100 border border-zinc-200/30',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    results: '3x Member Signups'
  }
];

const PortfolioPreview = () => {
  return (
    <section className="py-12 md:py-24 bg-[#F9FBF9]/80 backdrop-blur-[2px]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="max-w-2xl"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-zinc-950 tracking-tight">Featured Business Websites</h2>
            <p className="text-zinc-500 text-lg font-medium leading-relaxed">Explore some of the stunning digital experiences we've crafted for local businesses.</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Button variant="secondary" className="!px-5 !py-3 text-sm !bg-zinc-50 !text-zinc-800 !border-zinc-200 hover:!bg-zinc-100 transition-colors">
              View All Projects <ArrowRight size={16} />
            </Button>
          </motion.div>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {projects.map((project, idx) => (
            <motion.div 
              key={idx}
              variants={fadeUp}
              className="h-[26rem] md:h-[34rem]"
            >
              <TiltSpotlightCard className={`h-full border ${project.borderColor} bg-white flex flex-col justify-between group overflow-hidden shadow-sm shadow-zinc-200/30 hover:shadow-xl hover:shadow-zinc-300/30`}>
                {/* Content Top */}
                <div className="p-6 md:p-8 z-10">
                  <div className="flex flex-col items-start gap-2 mb-4">
                    <div className={`${project.categoryColor} text-xs font-bold tracking-widest uppercase font-mono`}>{project.category}</div>
                    <div className="inline-flex items-center gap-1.5 bg-zinc-50 px-3 py-1 rounded-full text-xs font-bold border border-zinc-150 text-zinc-700 font-mono shadow-sm">
                      🔥 {project.results}
                    </div>
                  </div>
                  <h3 className={`text-2xl md:text-3xl font-black ${project.titleColor} mb-4 leading-tight`}>{project.title}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech.map((t, i) => (
                      <span key={i} className={`text-[10px] md:text-[11px] font-bold ${project.tagColor} px-2.5 py-1 rounded-lg font-mono`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Image Bottom */}
                <div className="px-6 md:px-8 pb-6 md:pb-8 w-full translate-y-0 group-hover:-translate-y-4 transition-transform duration-700 ease-out">
                  <div className="rounded-[1.5rem] overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.05)] border border-zinc-100 relative">
                    <div className="absolute inset-0 bg-zinc-950/5 group-hover:bg-transparent transition-colors duration-500 z-10" />
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-44 md:h-60 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </TiltSpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PortfolioPreview;
