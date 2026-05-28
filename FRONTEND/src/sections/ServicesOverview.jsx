import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, ShoppingCart, CalendarCheck, LayoutDashboard, Cpu, Database, ArrowRight } from 'lucide-react';
import { staggerContainer, fadeUp } from '../animations/variants';
import { Link } from 'react-router-dom';
import GlitchTitle from "../Components/GlitchTitle";
import FlipCard from "../Components/FlipCard";
import TiltSpotlightCard from "../Components/TiltSpotlightCard";

const services = [
  {
    id: 'business-websites',
    icon: <Monitor className="text-brand-emerald w-6 h-6 md:w-8 md:h-8" />,
    title: 'Business Websites',
    description: 'Premium, fast, and modern websites for restaurants, clinics, gyms, and local shops that instantly build trust.',
    features: ['Custom SaaS Design', 'Local SEO & Maps Setup', 'Speed Optimized (>95 Score)', 'WhatsApp Chat Integration']
  },
  {
    id: 'ecommerce-stores',
    icon: <ShoppingCart className="text-brand-mint w-6 h-6 md:w-8 md:h-8" />,
    title: 'E-commerce Stores',
    description: 'Powerful online stores with seamless checkout, inventory management, and beautiful product displays.',
    features: ['Payment Gateway Setup', 'Smart Product Management', 'Automated Invoices', 'Discount Code Framework']
  },
  {
    id: 'booking-systems',
    icon: <CalendarCheck className="text-brand-emerald w-6 h-6 md:w-8 md:h-8" />,
    title: 'Booking Systems',
    description: 'Automated scheduling and appointment systems perfect for salons, schools, colleges, and consultants.',
    features: ['Dynamic Client Calendars', 'SMS / Email Alerts', 'Trainer or Stylist Slots', 'Advanced Reminders Flow']
  },
  {
    id: 'admin-dashboards',
    icon: <LayoutDashboard className="text-brand-mint w-6 h-6 md:w-8 md:h-8" />,
    title: 'Admin Dashboards',
    description: 'Custom internal tools to track your sales, manage customers, and monitor growth from one place.',
    features: ['Realtime Analytics Grid', 'CRM & User Tracking', 'CSV / Excel Data Export', 'Interactive Sales Charts']
  },
  {
    id: 'ai-automation',
    icon: <Cpu className="text-brand-emerald w-6 h-6 md:w-8 md:h-8" />,
    title: 'AI Automation',
    description: 'Save hundreds of hours by automating customer replies, invoicing, and repetitive manual tasks.',
    features: ['Automated Email Campaigns', 'AI Support Chatbots', 'Zapier & Webhooks API', 'Intelligent Lead Profiler']
  },
  {
    id: 'erp-systems',
    icon: <Database className="text-brand-mint w-6 h-6 md:w-8 md:h-8" />,
    title: 'ERP Systems',
    description: 'Comprehensive business management systems tailored exactly to your organizational workflow.',
    features: ['Inventory & Stock Hubs', 'Employee Performance Hub', 'Tailored Database Queries', 'Centralized Billing']
  }
];

// Centralized TiltSpotlightCard imported from src/Components/TiltSpotlightCard.jsx

const ServicesOverview = () => {
  return (
    <section className="py-12 md:py-24 relative overflow-hidden bg-white/80 backdrop-blur-[2px]">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-brand-emerald/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <GlitchTitle
            text="Digital Solutions For Growth"
            highlight="Solutions"
            className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-zinc-950 font-sans"
            tag="h2"
          />
          <p className="text-zinc-500 max-w-2xl mx-auto text-lg font-medium">Everything your business needs to establish a premium online presence, automate tasks, and get more customers.</p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={fadeUp} className="h-full">
              <FlipCard
                heightClass="h-[340px]"
                front={
                  <div className="h-full p-6 md:p-8 flex flex-col justify-between relative">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-zinc-900 tracking-tight mt-1 pr-3 leading-snug">{service.title}</h3>
                        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 transition-all duration-300">
                          {service.icon}
                        </div>
                      </div>
                      <p className="text-sm md:text-base text-zinc-500 mb-8 leading-relaxed font-medium">{service.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase font-mono tracking-widest mt-auto border-t border-zinc-100 pt-4">
                      <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" /> Hover to expand
                    </div>
                  </div>
                }
                back={
                  <div className="h-full p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm uppercase tracking-widest font-mono font-bold text-brand-emerald mb-4 border-b border-zinc-200/60 pb-2">Included Features</h4>
                      <ul className="space-y-3 mb-6">
                        {service.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-2.5 text-sm font-medium text-zinc-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link 
                      to={`/service/${service.id}`} 
                      className="flex items-center gap-2 text-xs font-bold text-brand-emerald hover:text-brand-mint transition-colors w-fit uppercase font-mono tracking-widest border-b border-transparent hover:border-brand-mint pb-0.5"
                    >
                      Explore Service <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                }
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesOverview;
export { TiltSpotlightCard };
