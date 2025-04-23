import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import AggregationStatus from './AggregationStatus';
import type { SystemSettings, Profile } from '../../types/newsapi';

interface AdminOverviewProps {
  usersCount: number;
  articlesCount: number;
  systemStatus: SystemSettings | null;
  onRefresh: () => void;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ 
  usersCount, 
  articlesCount, 
  systemStatus, 
  onRefresh 
}) => {
  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-white">{usersCount}</p>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Total Articles</h3>
          <p className="text-3xl font-bold text-white">{articlesCount}</p>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Last Aggregation</h3>
          <p className="text-xl font-bold text-white">
            {systemStatus?.last_run 
              ? format(new Date(systemStatus.last_run), 'MMM dd, yyyy HH:mm') 
              : 'Never'}
          </p>
          {systemStatus?.last_run && (
            <p className="text-sm text-gray-400">
              {formatDistanceToNow(new Date(systemStatus.last_run), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
      
      <div>
        <AggregationStatus 
          status={systemStatus} 
          onRefresh={onRefresh} 
        />
      </div>
    </motion.div>
  );
};

export default AdminOverview;