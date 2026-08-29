import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { fadeUp, staggerContainer } from '../animations/variants';
import Button from '../Components/Button';

const projects = [
  {
    title: 'The Golden Spoon',
    category: 'Restaurant & Ordering',
    tech: ['Menu Sync', 'Reservations'],
    bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
    borderColor: 'border-orange-200',
    titleColor: 'text-orange-900',
    categoryColor: 'text-orange-700',
    tagColor: 'text-orange-800 bg-orange-200/60',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    results: '+45% Online Orders'
  },
  {
    title: 'Luxe Aesthetics Clinic',
    category: 'Healthcare & Wellness',
    tech: ['Patient Portal', 'SEO'],
    bgColor: 'bg-gradient-to-br from-teal-50 to-teal-100',
    borderColor: 'border-teal-200',
    titleColor: 'text-teal-900',
    categoryColor: 'text-teal-700',
    tagColor: 'text-teal-800 bg-teal-200/60',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
    results: 'Fully Booked Calendar'
  },
  {
    title: 'Iron Core Fitness',
    category: 'Gym & Subscriptions',
    tech: ['Member Portal', 'Payments'],
    bgColor: 'bg-gradient-to-br from-slate-800 to-slate-900',
    borderColor: 'border-slate-700',
    titleColor: 'text-white',
    categoryColor: 'text-slate-400',
    tagColor: 'text-slate-300 bg-slate-700/50',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    results: '3x Member Signups'
  }
];

const PortfolioPreview = () => {
  return (
    <section className="py-12 md:py-24 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-16 gap-4 md:gap-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="max-w-2xl"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900">Featured Business Websites</h2>
            <p className="text-gray-500 text-lg font-medium">Explore some of the stunning digital experiences we've crafted for local businesses.</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Button variant="secondary" className="!px-4 !py-2 text-sm">
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
              className={`group rounded-[2rem] overflow-hidden ${project.bgColor} border ${project.borderColor} shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative flex flex-col h-[24rem] md:h-[32rem]`}
            >
              {/* Content Top */}
              <div className="p-5 md:p-8 relative z-10 flex-1">
                <div className="flex flex-col items-start gap-2 mb-3 md:mb-4">
                  <div className={`${project.categoryColor} text-xs font-black uppercase tracking-wider`}>{project.category}</div>
                  <div className="inline-flex items-center gap-1 bg-white/30 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border border-white/20">
                    🚀 {project.results}
                  </div>
                </div>
                <div className="min-h-[3rem] md:min-h-[4.5rem] flex flex-col justify-center mb-3 md:mb-4">
                  <h3 className={`text-xl md:text-3xl font-black ${project.titleColor} leading-tight`}>{project.title}</h3>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                  {project.tech.map((t, i) => (
                    <span key={i} className={`text-[10px] md:text-[11px] font-bold ${project.tagColor} px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Image Bottom (Floating Device Style) */}
              <div className="px-3 md:px-8 absolute bottom-4 md:bottom-8 left-0 w-full translate-y-0 group-hover:-translate-y-4 transition-transform duration-700 ease-out">
                <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20 relative">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-40 md:h-56 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PortfolioPreview;
