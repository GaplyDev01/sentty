import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  title: string;
  avatar: string;
  index: number;
  isHighlighted?: boolean;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  author,
  title,
  avatar,
  index,
  isHighlighted = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      className={`
        rounded-xl overflow-hidden backdrop-blur-sm shadow-lg relative
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
        
        {/* Author info */}
        <div className="flex items-center">
          <img 
            src={avatar} 
            alt={author} 
            className="h-12 w-12 rounded-full mr-4 object-cover border-2 border-blue-500/30"
          />
          <div>
            <h4 className="font-medium text-white">{author}</h4>
            <p className="text-sm text-gray-400">{title}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;