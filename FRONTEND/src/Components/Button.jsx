import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, variant = 'primary', className = '', onClick, type = 'button' }) => {
  const baseClasses = "relative inline-flex items-center justify-center px-6 py-3 font-medium transition-all duration-300 rounded-lg overflow-hidden group";
  
  const variants = {
    primary: "text-white bg-brand-purple hover:bg-brand-deep-purple shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]",
    secondary: "text-white bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-sm",
    outline: "text-brand-electric border border-brand-electric hover:bg-brand-electric/10 shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
      )}
    </motion.button>
  );
};

export default Button;
