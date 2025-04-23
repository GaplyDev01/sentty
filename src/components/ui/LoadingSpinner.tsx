import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: string;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'w-12 h-12', 
  color = 'border-blue-500' 
}) => {
  return (
    <div className="flex justify-center items-center">
      <motion.div 
        className={`${size} border-4 border-t-transparent rounded-full ${color}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export default LoadingSpinner;