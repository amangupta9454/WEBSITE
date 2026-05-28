import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../animations/variants';

const stats = [
  { label: 'Businesses Grown', value: '50+' },
  { label: 'Websites Delivered', value: '100+' },
  { label: 'Industries Served', value: '12+' },
  { label: 'Client Satisfaction', value: '99%' },
];

const Stats = () => {
  return (
    <section className="py-20 border-y border-gray-200 relative bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              variants={fadeUp}
              className="flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
            >
              <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
                {stat.value}
              </h3>
              <p className="text-gray-600 font-bold uppercase tracking-wider text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Stats;
