import React from 'react';
import { motion } from 'framer-motion';

interface ImpactDashboardProps {
  showCareer?: boolean;
  showInvestments?: boolean;
  showPersonal?: boolean;
  showIndustry?: boolean;
  className?: string;
}

const ImpactDashboard: React.FC<ImpactDashboardProps> = ({
  showCareer = true,
  showInvestments = true,
  showPersonal = true,
  showIndustry = true,
  className = ''
}) => {
  return (
    <motion.div 
      className={`bg-gray-900/70 border border-blue-500/30 rounded-xl p-6 shadow-xl ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-2xl font-bold text-white mb-6">Your Personal Impact Score</h3>
      
      <p className="text-gray-400 mb-6">
        Sentro's proprietary Impact Score quantifies how news affects sustainable development goals and communities that matter to you.
      </p>
      
      <div className="space-y-6">
        {showCareer && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Environmental Impact</span>
              <span className="text-white font-medium">78%</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                whileInView={{ width: '78%' }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
        )}
        
        {showInvestments && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Social Change Impact</span>
              <span className="text-white font-medium">92%</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-green-600" 
                initial={{ width: 0 }}
                whileInView={{ width: '92%' }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.4 }}
              />
            </div>
          </div>
        )}
        
        {showPersonal && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Community Impact</span>
              <span className="text-white font-medium">45%</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-yellow-500" 
                initial={{ width: 0 }}
                whileInView={{ width: '45%' }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.6 }}
              />
            </div>
          </div>
        )}
        
        {showIndustry && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Global Impact</span>
              <span className="text-white font-medium">85%</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-purple-600" 
                initial={{ width: 0 }}
                whileInView={{ width: '85%' }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </div>
          </div>
        )}
      </div>
      
      <motion.button 
        className="mt-8 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Get Your Personal Impact Score
      </motion.button>
    </motion.div>
  );
};

export default ImpactDashboard;