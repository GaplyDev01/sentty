import React from 'react';
import { motion } from 'framer-motion';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:bg-gray-800/80 hover:shadow-lg group relative z-10"
    >
      <div className="p-3 bg-gray-700/30 rounded-lg inline-block mb-4 group-hover:bg-blue-900/30 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </motion.div>
  );
};

export default Feature;