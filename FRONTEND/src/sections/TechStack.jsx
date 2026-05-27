import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../animations/variants';

const techStack = [
  'React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 
  'PostgreSQL', 'Tailwind CSS', 'Framer Motion', 'Python',
  'AWS', 'Docker', 'Firebase', 'OpenAI API'
];

const TechStack = () => {
  return (
    <section className="py-24 relative overflow-hidden border-t border-gray-200 bg-[#FAFAFA]">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-100 blur-[120px] rounded-[100%] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="mb-12"
        >
          <h2 className="text-3xl font-black mb-4 text-gray-900">Powered By Modern Technologies</h2>
          <p className="text-gray-500 font-medium">We utilize the most advanced tools to deliver exceptional results.</p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto"
        >
          {techStack.map((tech, index) => (
            <motion.div 
              key={index}
              variants={fadeUp}
              whileHover={{ scale: 1.05, y: -5 }}
              className="px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-700 font-bold hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default shadow-sm hover:shadow-md"
            >
              {tech}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TechStack;
