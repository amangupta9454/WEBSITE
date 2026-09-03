import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../animations/variants';
import { ShoppingBag, CalendarCheck, LayoutDashboard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const solutions = [
  {
    icon: <ShoppingBag className="text-blue-600" size={28} />,
    category: "Commerce & Retail",
    title: "E-Commerce & Digital Catalogs",
    description: "Mobile-optimized product storefronts, streamlined checkout experiences, inventory synchronization, and secure payment integrations built for seamless customer transactions.",
    deliverables: ["Custom Cart & Checkout", "Payment Gateway Integration", "Product Catalog Management", "SEO Optimized Architecture"],
    bgColor: "bg-blue-50/50 hover:bg-blue-50/80 border-blue-100",
    badgeColor: "bg-blue-100 text-blue-700"
  },
  {
    icon: <CalendarCheck className="text-purple-600" size={28} />,
    category: "Service & Healthcare",
    title: "Appointment & Booking Systems",
    description: "Interactive scheduling workflows, automated slot allocation, client onboarding forms, and instant confirmation notifications to eliminate manual phone coordination.",
    deliverables: ["24/7 Online Booking", "Calendar Synchronization", "Automated Email Alerts", "Client Intake Forms"],
    bgColor: "bg-purple-50/50 hover:bg-purple-50/80 border-purple-100",
    badgeColor: "bg-purple-100 text-purple-700"
  },
  {
    icon: <LayoutDashboard className="text-emerald-600" size={28} />,
    category: "Enterprise & Education",
    title: "Bespoke Portals & Dashboards",
    description: "Role-based administrative dashboards, user activity monitors, document verification systems, and custom database pipelines tailored to specific operational rules.",
    deliverables: ["Role-Based Access Control", "Data Analytics & Reporting", "Task Distribution Engines", "Audit Logging & Security"],
    bgColor: "bg-emerald-50/50 hover:bg-emerald-50/80 border-emerald-100",
    badgeColor: "bg-emerald-100 text-emerald-700"
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px] pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[100px] pointer-events-none opacity-50" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-block mb-3 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider">
            Solutions Architecture
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 tracking-tight">
            Real-World <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Digital Solutions</span>
          </h2>
          <p className="text-gray-500 font-medium text-base sm:text-lg">
            Purpose-built web applications and digital infrastructure designed for reliable performance.
          </p>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid lg:grid-cols-3 gap-6 md:gap-8 relative z-10"
        >
          {solutions.map((item, index) => (
            <motion.div 
              key={index}
              variants={fadeUp}
              className={`relative border shadow-2xs rounded-3xl p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group overflow-hidden ${item.bgColor}`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-white rounded-2xl shadow-2xs border border-gray-100 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${item.badgeColor}`}>
                    {item.category}
                  </span>
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
                  {item.description}
                </p>
              </div>

              <div className="pt-5 border-t border-gray-200/60">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                  Key Capabilities
                </div>
                <ul className="space-y-1.5">
                  {item.deliverables.map((d, dIdx) => (
                    <li key={dIdx} className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold text-sm rounded-full hover:bg-blue-600 transition-colors shadow-sm"
          >
            <span>Explore All Capabilities</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
