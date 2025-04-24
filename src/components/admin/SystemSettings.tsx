import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CoinDeskSettings from './CoinDeskSettings';
import CryptoPanicSettings from './CryptoPanicSettings';
import FireCrawlSettings from './FireCrawlSettings';
import CryptoIntegrationsManager from './CryptoIntegrationsManager';

const SystemSettings: React.FC = () => {
  const [siteName, setSiteName] = useState('Sentro');
  const [defaultCategory, setDefaultCategory] = useState('all');
  const [saving, setSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSaveSettings = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      // Show success message
      alert('Settings saved successfully');
    }, 1000);
  };

  const handleClearArticles = () => {
    setShowConfirmation(true);
  };

  const confirmClearArticles = () => {
    // This would be implemented in a full application with proper API calls
    alert('This feature is not implemented in the demo');
    setShowConfirmation(false);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Quick Fix for Crypto Integrations */}
      <CryptoIntegrationsManager />
      
      {/* News API Configurations */}
      <div className="space-y-6">
        {/* CoinDesk Settings */}
        <CoinDeskSettings />
        
        {/* CryptoPanic Settings */}
        <CryptoPanicSettings />
        
        {/* FireCrawl Settings */}
        <FireCrawlSettings />
      </div>
      
      <div className="bg-gray-900/50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-4">System Settings</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Site Name
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Default User Preferences
            </label>
            <select
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="business">Business</option>
              <option value="technology">Technology</option>
              <option value="web3">Web3</option>
            </select>
          </div>
          
          <button 
            onClick={handleSaveSettings}
            disabled={saving}
            className={`px-4 py-2 ${
              saving 
                ? 'bg-blue-700/60 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-lg transition-colors`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-900/50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-4">Danger Zone</h3>
        
        <div className="space-y-4">
          <div className="p-4 border border-red-800/30 rounded-lg bg-red-900/20">
            <h4 className="text-red-300 font-medium mb-2">Clear All Articles</h4>
            <p className="text-gray-400 text-sm mb-3">
              This will permanently delete all articles from the database. This action cannot be undone.
            </p>
            
            {!showConfirmation ? (
              <button 
                onClick={handleClearArticles}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Articles
              </button>
            ) : (
              <div className="flex space-x-3">
                <button 
                  onClick={confirmClearArticles}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SystemSettings;