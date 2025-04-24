import React from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-gray-900/50 hover:bg-gray-900/70 border border-gray-800/70 hover:border-blue-500/30 rounded-lg p-6 transition-all duration-300"
    >
      <div className="p-3 bg-gray-800/50 rounded-lg inline-block mb-4">
        {icon}
      </div>
      
      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
      
      <p className="text-gray-300 text-sm">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;