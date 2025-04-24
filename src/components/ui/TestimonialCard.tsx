import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  title: string;
  avatar: string;
  index: number;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  author,
  title,
  avatar,
  index,
  isHighlighted = false,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Motion values for tracking mouse position - ALWAYS create these
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring configuration for smoother animations
  const springConfig = { damping: 20, stiffness: 300 };
  
  // ALWAYS create all transforms, regardless of hover state
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);
  const scale = useSpring(isHovered ? 1.03 : 1, springConfig);
  const y = useSpring(isHovered ? -8 : 0, springConfig);
  
  // ALWAYS create author transforms, regardless of hover state
  const authorX = useTransform(mouseX, [-1, 1], [-3, 3]);
  const authorY = useTransform(mouseY, [-1, 1], [-2, 2]);
  
  // Handle mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to card center (normalized from -1 to 1)
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) / (rect.width / 2));
    mouseY.set((e.clientY - centerY) / (rect.height / 2));
  };
  
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
      transition={{ duration: 0.5, delay: 0.1 * index }}
      style={{
        // Apply transforms conditionally, but ALWAYS create the transforms above
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        scale,
        y,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
        boxShadow: isHovered ? "0 20px 40px rgba(0,0,0,0.2)" : "0 0 0 rgba(0,0,0,0)"
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`
        rounded-xl overflow-hidden backdrop-blur-sm shadow-lg relative cursor-pointer
        ${isHighlighted 
          ? 'bg-blue-900/30 border border-blue-500/50' 
          : 'bg-gray-800/50 border border-gray-700/50'}
      `}
    >
      {/* Quotation mark */}
      <div className="absolute top-6 right-6 text-5xl leading-none text-blue-500/20 font-serif">&#8220;</div>
      
      <div className="p-6 relative">
        {/* Stars */}
        <div className="flex mb-4">
          {Array(5).fill(0).map((_, i) => (
            <Star 
              key={i} 
              className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" 
            />
          ))}
        </div>
        
        {/* Quote text */}
        <p className="text-gray-300 mb-6 relative z-10">&ldquo;{quote}&rdquo;</p>
        
        {/* Author info - Apply transforms conditionally */}
        <motion.div 
          className="flex items-center"
          style={{
            x: isHovered ? authorX : 0,
            y: isHovered ? authorY : 0
          }}
        >
          <motion.img 
            src={avatar} 
            alt={author} 
            className="h-12 w-12 rounded-full mr-4 object-cover border-2 border-blue-500/30"
            whileHover={{ scale: 1.1, borderColor: "rgba(59, 130, 246, 0.6)" }}
          />
          <div>
            <h4 className="font-medium text-white">{author}</h4>
            <p className="text-sm text-gray-400">{title}</p>
          </div>
        </motion.div>
      </div>
      
      {/* Background gradient overlay - Always render with conditional opacity */}
      <motion.div 
        className="absolute inset-0 -z-10 opacity-0"
        animate={{ 
          opacity: isHovered ? (isHighlighted ? 0.3 : 0.15) : 0 
        }}
        transition={{ duration: 0.3 }}
        style={{
          background: isHighlighted
            ? 'linear-gradient(120deg, #3b82f6 0%, #4f46e5 100%)'
            : 'linear-gradient(120deg, #4b5563 0%, #1f2937 100%)'
        }}
      />
    </motion.div>
  );
};

export default TestimonialCard;