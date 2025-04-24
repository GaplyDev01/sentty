import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Motion values for tracking mouse position and applying transformations
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Define all transforms at the top level - never conditionally
  const springConfig = { damping: 25, stiffness: 300 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), springConfig);
  const scale = useSpring(isHovered ? 1.03 : 1, springConfig);
  const y = useSpring(isHovered ? -8 : 0, springConfig);
  
  // Define icon movement transforms at the top level
  const iconX = useTransform(mouseX, [-1, 1], [-5, 5]);
  const iconY = useTransform(mouseY, [-1, 1], [-5, 5]);
  
  // Handle mouse move events
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate normalized mouse position relative to card center
    mouseX.set((e.clientX - centerX) / (rect.width / 2));
    mouseY.set((e.clientY - centerY) / (rect.height / 2));
  };
  
  // Handle mouse enter/leave events
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset mouse position to center
    mouseX.set(0);
    mouseY.set(0);
  };
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        scale,
        y,
        transformPerspective: 1200,
        transformStyle: "preserve-3d"
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-gray-900/50 border border-gray-800/70 hover:border-blue-500/30 rounded-lg p-6 transition-all duration-300 cursor-pointer"
    >
      <motion.div 
        className="p-3 bg-gray-800/50 rounded-lg inline-block mb-4"
        style={{ 
          // Use the pre-defined transforms conditionally but don't call hooks here
          x: isHovered ? iconX : 0,
          y: isHovered ? iconY : 0
        }}
      >
        {icon}
      </motion.div>
      
      <h3 className="text-lg font-bold text-white mb-3 group">
        {title}
        {isHovered && (
          <motion.span 
            className="inline-block ml-2 text-blue-400"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            →
          </motion.span>
        )}
      </h3>
      
      <p className="text-gray-300 text-sm">{description}</p>
      
      {/* Subtle glow effect that appears on hover */}
      {isHovered && (
        <motion.div 
          className="absolute inset-0 -z-10 rounded-lg opacity-30 blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(to bottom right, #3b82f6, #2563eb)'
          }}
        />
      )}
    </motion.div>
  );
};

export default FeatureCard;