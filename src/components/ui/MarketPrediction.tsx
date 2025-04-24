import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, LineChart } from 'lucide-react';

const MarketPrediction: React.FC = () => {
  return (
    <motion.div
      className="inline-flex items-center bg-gray-900/70 border border-blue-500/30 rounded-2xl p-4 text-sm backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
    >
      <div className="p-2.5 bg-green-900/30 rounded-xl mr-4">
        <LineChart className="h-5 w-5 text-green-400" />
      </div>
      
      <div className="text-gray-300">
        <span className="mr-2">Impact Prediction:</span>
        <span className="text-white">Renewable energy investment to</span>
        <span className="text-green-400 font-medium mx-1">increase 12%</span>
        <span>in next quarter</span>
      </div>
    </motion.div>
  );
};

export default MarketPrediction;