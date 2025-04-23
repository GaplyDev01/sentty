import React from 'react';
import { motion } from 'framer-motion';

interface ArticleManagementProps {
  articlesCount: number;
}

const ArticleManagement: React.FC<ArticleManagementProps> = ({ articlesCount }) => {
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-white">Articles Management</h2>
        <p className="text-gray-400">Total: {articlesCount}</p>
      </div>
      
      <div className="bg-gray-900/50 p-6 rounded-lg">
        <p className="text-gray-300 mb-4">
          Article management is available through Supabase directly.
        </p>
        <p className="text-sm text-gray-400">
          Supabase provides a powerful interface for managing database records, including
          filtering, sorting, and bulk operations that are perfect for content management.
        </p>
      </div>
    </motion.div>
  );
};

export default ArticleManagement;