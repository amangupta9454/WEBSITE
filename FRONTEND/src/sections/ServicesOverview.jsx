import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, ShoppingCart, CalendarCheck, LayoutDashboard, Cpu, Database, ArrowRight } from 'lucide-react';
import { staggerContainer, fadeUp } from '../animations/variants';

const services = [
  {
    icon: <Monitor className="text-blue-500 w-6 h-6 md:w-8 md:h-8" />,
    title: 'Business Websites',
    description: 'Premium, fast, and modern websites for restaurants, clinics, gyms, and local shops that instantly build trust.'
  },
  {
    icon: <ShoppingCart className="text-purple-500 w-6 h-6 md:w-8 md:h-8" />,
    title: 'E-commerce Stores',
    description: 'Powerful online stores with seamless checkout, inventory management, and beautiful product displays.'
  },
  {
    icon: <CalendarCheck className="text-indigo-500 w-6 h-6 md:w-8 md:h-8" />,
    title: 'Booking Systems',
    description: 'Automated scheduling and appointment systems perfect for salons, schools, colleges, and consultants.'
  },
  {
    icon: <LayoutDashboard className="text-blue-500 w-6 h-6 md:w-8 md:h-8" />,
    title: 'Admin Dashboards',
    description: 'Custom internal tools to track your sales, manage customers, and monitor growth from one place.'
  },
  {
    icon: <Cpu className="text-purple-500 w-6 h-6 md:w-8 md:h-8" />,
    title: 'AI Automation',
    description: 'Save hundreds of hours by automating customer replies, invoicing, and repetitive manual tasks.'
  },
  {
    icon: <Database className="text-indigo-500 w-6 h-6 md:w-8 md:h-8" />,
    title: 'ERP Systems',
    description: 'Comprehensive business management systems tailored exactly to your organizational workflow.'
  }
];

const SpotlightCard = ({ children, className = "" }) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => { setIsFocused(true); setOpacity(1); }}
      onBlur={() => { setIsFocused(false); setOpacity(0); }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-500 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(99, 102, 241, 0.08), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const ServicesOverview = () => {
  return (
    <section className="py-12 md:py-24 relative overflow-hidden bg-[#FAFAFA]">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-[#FAFAFA] to-[#FAFAFA] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-gray-900">Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Solutions</span> For Growth</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium">Everything your business needs to establish a premium online presence, automate tasks, and get more customers.</p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={fadeUp}>
              <SpotlightCard className="h-full p-4 md:p-8 group hover:border-purple-200 transition-colors duration-500 flex flex-col">
                <div className="flex justify-between items-start mb-3 md:mb-6">
                  <h3 className="text-base md:text-xl font-bold text-gray-900 tracking-wide mt-1 pr-3 leading-tight">{service.title}</h3>
                  <div className="p-2.5 md:p-4 rounded-xl bg-gray-50 shrink-0 border border-gray-100 group-hover:border-purple-100 group-hover:bg-purple-50 transition-all duration-300">
                    {service.icon}
                  </div>
                </div>
                <p className="text-[13px] md:text-base text-gray-600 mb-5 md:mb-8 leading-relaxed font-medium flex-1">{service.description}</p>
                
                <button className="flex items-center gap-2 text-[13px] md:text-sm font-bold text-blue-600 group-hover:text-purple-600 transition-colors mt-auto">
                  Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesOverview;
