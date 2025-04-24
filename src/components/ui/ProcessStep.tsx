import React from 'react';
import { motion } from 'framer-motion';

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
      
      {/* Content card */}
      <div
        className={`bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800/80 border ${
          isActive ? 'border-blue-500/50' : 'border-gray-700/50'
        } rounded-lg p-6 transition-all duration-300 
        ${isActive ? 'shadow-lg shadow-blue-500/10' : ''}
        lg:w-[calc(100%-24px)] mx-auto`}
      >
        <div className="flex items-start">
          <div className={`p-3 ${
            isActive ? 'bg-blue-900/40' : 'bg-gray-900/40'
          } rounded-lg inline-block mr-4 flex-shrink-0`}>
            {icon}
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 text-sm">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProcessStep;