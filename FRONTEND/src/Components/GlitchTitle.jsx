import React from 'react';
import { motion } from 'framer-motion';

const GlitchTitle = ({ text, highlight = "", className = "", tag: Tag = "h2" }) => {
  const letters = Array.from(text);
  
  // Find start and end indices of the highlight phrase in the text
  let highlightStart = -1;
  let highlightEnd = -1;
  if (highlight) {
    highlightStart = text.toLowerCase().indexOf(highlight.toLowerCase());
    if (highlightStart !== -1) {
      highlightEnd = highlightStart + highlight.length - 1;
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.035,
      }
    }
  };

  const letterVariants = {
    hidden: { 
      opacity: 0, 
      filter: "blur(12px)",
      y: 10,
      scale: 0.9
    },
    visible: { 
      opacity: [0, 0.5, 0.8, 1],
      filter: [
        "blur(12px)", 
        "blur(4px)", 
        "blur(6px)", 
        "blur(0px)"
      ],
      x: [-4, 4, -2, 2, 0],
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.55, 
        ease: "easeOut",
      }
    }
  };

  return (
    <Tag className={`${className} font-black tracking-tight`}>
      <motion.span
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="inline-block"
      >
        {letters.map((char, index) => {
          if (char === " ") {
            return <span key={index} className="inline-block">&nbsp;</span>;
          }
          const isHighlighted = index >= highlightStart && index <= highlightEnd;
          return (
            <motion.span
              key={index}
              variants={letterVariants}
              className={`inline-block origin-center ${isHighlighted ? "text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-brand-mint" : ""}`}
              style={{ display: "inline-block" }}
            >
              {char}
            </motion.span>
          );
        })}
      </motion.span>
    </Tag>
  );
};

export default GlitchTitle;
