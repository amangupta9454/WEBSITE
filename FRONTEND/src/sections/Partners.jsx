import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../animations/variants';

const Partners = () => {
  return (
    <section className="py-12 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-8"
        >
          Our Trusted Partners
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32 transition-all duration-500"
        >
          {/* Edunet Foundation */}
          <a href="https://edunetfoundation.org/" target="_blank" rel="noopener noreferrer" className="group cursor-pointer">
            <img
              src="/edunet.svg"
              alt="Edunet Foundation"
              className="h-18 md:h-26 object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </a>

          {/* Aptimaster AI */}
          <a href="https://aptimasterai.online/" target="_blank" rel="noopener noreferrer" className="group cursor-pointer">
            <img
              src="/aptimaster.png"
              alt="Aptimaster AI"
              className="h-18 md:h-26 object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Partners;
