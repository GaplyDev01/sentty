import React from 'react';
import { motion } from 'framer-motion';
import AggregationStatus from './AggregationStatus';
import AggregationLogs from './AggregationLogs';
import type { SystemSettings } from '../../types/newsapi';

interface AggregationManagementProps {
  systemStatus: SystemSettings | null;
  onRefresh: () => void;
}

const AggregationManagement: React.FC<AggregationManagementProps> = ({ 
  systemStatus, 
  onRefresh 
}) => {
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <AggregationStatus 
          status={systemStatus}
          onRefresh={onRefresh}
        />
      </div>
      
      <AggregationLogs />
      
      <div className="bg-gray-900/50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-4">API Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              NewsAPI.org API Key
            </label>
            <div className="flex">
              <input
                type="text"
                value="efc7d919e7af413ba5a7f4a3ebdb3862"
                readOnly
                className="flex-1 bg-gray-800 border border-gray-700 rounded-l-lg px-3 py-2 text-gray-300"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg">
                Update
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Edge Function URL: https://yvprahxaturmpzcdzddb.supabase.co/functions/v1/aggregate-news
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AggregationManagement;