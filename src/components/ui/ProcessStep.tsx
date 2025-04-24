import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ProcessStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  isActive?: boolean;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ 
  icon, 
  title, 
  description, 
  index,
  isActive = false
}) => {
  // Mouse interaction state
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Motion values for tracking mouse position and applying transformations
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Add springs for smoother animation
  const springConfig = { damping: 25, stiffness: 400 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), springConfig);
  const scale = useSpring(isHovered ? 1.05 : 1, springConfig);
  const y = useSpring(isHovered ? -8 : 0, springConfig);
  
  // Create transforms for icon animations - moved outside of JSX to avoid conditional hook calls
  const iconRotate = useTransform(mouseX, [-1, 1], [-5, 5]);
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
  
  // Alternate the positioning for desktop view (left/right pattern)
  const isEven = index % 2 === 0;
  
  return (
    <motion.div
      className={`relative z-10`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* Connected dot for desktop layout */}
      <div className="hidden lg:block absolute left-1/2 top-6 transform -translate-x-1/2 z-10">
        <div className={`w-8 h-8 rounded-full border-4 ${
          isActive 
            ? 'bg-blue-600 border-blue-300' 
            : 'bg-gray-800 border-gray-700'
        } flex items-center justify-center`}>
          {isActive && (
            <motion.div 
              className="w-3 h-3 bg-blue-300 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </div>
      
      {/* Content card with 3D hover effect */}
      <motion.div
        ref={cardRef}
        style={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
          scale,
          y,
          transformPerspective: 1000, // Add perspective for 3D effect
          transformStyle: "preserve-3d"
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800/80 border ${
          isActive ? 'border-blue-500/50' : 'border-gray-700/50'
        } rounded-lg p-6 transition-all duration-300 
        ${isActive ? 'shadow-lg shadow-blue-500/10' : ''}
        lg:w-[calc(100%-24px)] mx-auto cursor-pointer`}
        whileHover={{ boxShadow: "0px 10px 30px -5px rgba(0, 0, 0, 0.3)" }}
      >
        <div className="flex items-start">
          <motion.div 
            className={`p-3 ${
              isActive ? 'bg-blue-900/40' : 'bg-gray-900/40'
            } rounded-lg inline-block mr-4 flex-shrink-0`}
            style={{ 
              // Using pre-computed transforms instead of conditional hooks
              rotate: isHovered ? iconRotate : 0,
              x: isHovered ? iconX : 0,
              y: isHovered ? iconY : 0
            }}
          >
            {icon}
          </motion.div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">
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
          </div>
        </div>
        
        {/* Subtle glow effect that appears on hover */}
        {isHovered && (
          <motion.div 
            className="absolute inset-0 -z-10 rounded-lg opacity-30 blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: isActive 
                ? 'linear-gradient(to bottom right, #3b82f6, #2563eb)' 
                : 'linear-gradient(to bottom right, #4b5563, #1f2937)'
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default ProcessStep;