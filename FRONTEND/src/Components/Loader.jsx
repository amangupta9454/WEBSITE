import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Loader = ({ finishLoading }) => {
  const letters = Array.from("CODE-A-NOVA");

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const letterVariants = {
    initial: { 
      opacity: 0, 
      filter: "blur(10px)",
      scale: 0.8,
      y: 15
    },
    animate: { 
      opacity: 1, 
      filter: "blur(0px)",
      scale: 1,
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 10,
        duration: 0.5 
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      finishLoading();
    }, 2500); // 2.5s display time

    return () => clearTimeout(timer);
  }, [finishLoading]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col justify-center items-center bg-[#F9FBF9] overflow-hidden"
      exit={{ 
        opacity: 0, 
        y: -100, 
        filter: "blur(10px)",
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } 
      }}
    >
      {/* Soft ambient mint/emerald back glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-brand-emerald/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated word */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="flex gap-1.5 md:gap-3 text-3xl md:text-5xl font-black tracking-widest text-zinc-950 font-mono"
        >
          {letters.map((char, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className="inline-block hover:text-brand-emerald transition-colors"
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Emerald Growing Progress Line */}
        <div className="w-48 md:w-64 h-1 bg-zinc-200 rounded-full overflow-hidden relative shadow-inner">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.1, ease: [0.645, 0.045, 0.355, 1.0] }}
            className="absolute top-0 left-0 h-full bg-brand-emerald shadow-lg shadow-brand-emerald/50"
          />
        </div>

        {/* Small subtitle indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold font-mono"
        >
          Loading digital asset
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Loader;
