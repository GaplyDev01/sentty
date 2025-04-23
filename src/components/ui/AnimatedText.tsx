import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  delay?: number;
  duration?: number;
  animate?: boolean;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = '',
  as: Component = 'span',
  delay = 0,
  duration = 0.5,
  animate = true,
  gradient = false,
  gradientFrom = 'from-blue-400',
  gradientTo = 'to-purple-500'
}) => {
  const gradientClass = gradient 
    ? `text-transparent bg-clip-text bg-gradient-to-r ${gradientFrom} ${gradientTo}` 
    : '';
  
  const combinedClassName = `${className} ${gradientClass}`.trim();

  if (!animate) {
    return <Component className={combinedClassName}>{text}</Component>;
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay * i }
    })
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100
      }
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      style={{ overflow: 'hidden', display: 'inline-block' }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={combinedClassName}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          variants={child}
          style={{ position: 'relative', display: 'inline-block', zIndex: 10 }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default AnimatedText;