import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import UserPreferencesForm from '../components/preferences/UserPreferencesForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const UserPreferencesPage: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Please Sign In</h2>
        <p className="text-gray-400">You need to be logged in to view and edit your preferences.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-blue-900/30 rounded-lg">
            <Settings className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">News Preferences</h1>
        </div>
        
        <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg">
          <div className="p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-medium text-white">Customize Your News Experience</h2>
            <p className="text-gray-400 mt-1">
              Adjust your preferences to get news that's relevant to you. These settings will be used to rank and prioritize articles in your feed.
            </p>
          </div>
          
          <div className="p-6">
            <UserPreferencesForm userId={user.id} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserPreferencesPage;