import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedGradientTextProps {
  text: string;
  className?: string;
  from?: string;
  to?: string;
}

const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  text,
  className = 'text-3xl font-bold',
  from = 'from-blue-400',
  to = 'to-purple-500'
}) => {
  // Animation variants for staggered letter appearance
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren: 0.05, 
        delayChildren: 0.05 * i 
      }
    })
  };

  const child = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      filter: "blur(4px)",
      scale: 0.9 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { 
        type: "spring", 
        damping: 12,
        stiffness: 100
      }
    }
  };

  return (
    <motion.h1 
      className={`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent inline-block ${className}`}
      initial="hidden"
      animate="visible"
      variants={container}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={`${index}-${char}`}
          style={{ display: 'inline-block' }}
          variants={child}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.h1>
  );
};

export default AnimatedGradientText;