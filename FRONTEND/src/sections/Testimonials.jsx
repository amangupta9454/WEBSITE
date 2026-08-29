import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../animations/variants';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    metric: "+120%",
    metricLabel: "Increase in Online Orders",
    name: "Rajesh Kumar",
    role: "Owner, Spice Route Restaurant",
    content: "Code-A-Nova didn't just build a website; they built a revenue engine. Our digital orders doubled within the first month. It's the best investment we've ever made.",
    bgColor: "bg-blue-50/50 hover:bg-blue-50 border-blue-100",
    metricColor: "text-blue-600",
    badgeColor: "bg-blue-100 text-blue-700"
  },
  {
    metric: "10x",
    metricLabel: "More Appointment Bookings",
    name: "Vikram Singh",
    role: "Manager, City Care Clinic",
    content: "We were relying on manual phone calls. Now, patients book directly through our new premium website 24/7. It completely transformed how our clinic operates.",
    bgColor: "bg-purple-50/50 hover:bg-purple-50 border-purple-100",
    metricColor: "text-purple-600",
    badgeColor: "bg-purple-100 text-purple-700"
  },
  {
    metric: "Page 1",
    metricLabel: "Ranking on Google Search",
    name: "Anita Desai",
    role: "Founder, Style & Grace",
    content: "They created a flawless e-commerce store that actually ranks on Google. The team is incredibly professional and the design is world-class.",
    bgColor: "bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100",
    metricColor: "text-emerald-600",
    badgeColor: "bg-emerald-100 text-emerald-700"
  }
];

const Testimonials = () => {
  return (
    <section className="py-12 md:py-24 bg-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px] pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[100px] pointer-events-none opacity-50" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black mb-6 text-gray-900 tracking-tight">Client <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">Success Stories</span></h2>
          <p className="text-gray-500 font-medium text-lg">See how we help local businesses grow their online presence.</p>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid lg:grid-cols-3 gap-6 md:gap-8 relative z-10"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              variants={fadeUp}
              className={`relative border shadow-sm rounded-2xl md:rounded-3xl p-5 md:p-10 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between group overflow-hidden ${testimonial.bgColor}`}
            >
              <div className="relative z-10 mb-4 md:mb-8">
                {/* Massive Results Metric */}
                <div className="mb-4 md:mb-6 border-b border-gray-200/50 pb-4 md:pb-6">
                  <div className={`text-4xl md:text-6xl font-black ${testimonial.metricColor} tracking-tighter mb-1 md:mb-2`}>
                    {testimonial.metric}
                  </div>
                  <div className="text-gray-600 font-bold uppercase tracking-wider text-[10px] md:text-sm">
                    {testimonial.metricLabel}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 md:w-5 md:h-5 fill-current drop-shadow-sm" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className={`text-[9px] md:text-xs font-black uppercase px-2 py-1 rounded-full ${testimonial.badgeColor}`}>
                    ✓ Verified Client
                  </div>
                </div>
                
                <p className="text-gray-800 font-medium text-[13px] md:text-lg leading-relaxed italic">"{testimonial.content}"</p>
              </div>
              
              <div className="relative z-10 flex items-center gap-3 md:gap-4 mt-auto pt-4 md:pt-6">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gray-900 flex items-center justify-center text-white font-black text-sm md:text-xl shadow-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-sm md:text-lg leading-tight">{testimonial.name}</h3>
                  <p className="text-gray-500 font-medium text-[11px] md:text-sm">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
