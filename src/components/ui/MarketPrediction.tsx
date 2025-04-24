import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, LineChart } from 'lucide-react';

const MarketPrediction: React.FC = () => {
  return (
    <motion.div
      className="inline-flex items-center bg-gray-900/70 border border-gray-700/50 rounded-2xl p-4 text-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="p-2.5 bg-green-900/30 rounded-xl mr-4">
        <LineChart className="h-5 w-5 text-green-400" />
      </div>
      
      <div className="text-gray-300">
        <span className="mr-2">Market Prediction:</span>
        <span className="text-white">BTC price likely to</span>
        <span className="text-green-400 font-medium mx-1">increase 2.3%</span>
        <span>in next 24h</span>
      </div>
    </motion.div>
  );
};

export default MarketPrediction;