import React from 'react';
import { motion } from 'framer-motion';
import { Globe, BookmarkCheck, PanelTop } from 'lucide-react';
import CoinDeskNewsFeed from '../ui/CoinDeskNewsFeed';
import ImpactNewsFeed from '../ui/ImpactNewsFeed';

interface ImpactNewsPanelProps {
  className?: string;
}

const ImpactNewsPanel: React.FC<ImpactNewsPanelProps> = ({ className = '' }) => {
  return (
    <motion.div 
      className={`bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Globe className="h-5 w-5 mr-2 text-blue-400" />
            Impact News Dashboard
          </h3>
          <div className="flex items-center space-x-2">
            <div className="text-xs px-2 py-1 bg-blue-900/40 text-blue-300 rounded-full flex items-center">
              <BookmarkCheck className="h-3 w-3 mr-1" />
              Top Sources
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="flex items-center text-white text-base font-medium mb-3">
                <PanelTop className="h-4 w-4 mr-2 text-blue-400" />
                CoinDesk Crypto Impact News
              </h4>
              <CoinDeskNewsFeed limit={3} showTitle={false} compact={true} />
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white text-base font-medium mb-3">Environmental Impact</h4>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Positive climate news</span>
                <span className="text-green-400">+12%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '62%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="flex items-center text-white text-base font-medium mb-3">
                <Globe className="h-4 w-4 mr-2 text-green-400" />
                Latest Impact News
              </h4>
              <ImpactNewsFeed limit={3} showTitle={false} compact={true} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImpactNewsPanel;