import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Save, AlertCircle, Check, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { aggregationService } from '../../services/aggregationService';

const FireCrawlSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    enabled: false,
    api_key: '',
    last_run: null as string | null,
    rate_limited: false
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [runningAggregation, setRunningAggregation] = useState(false);
  const [aggregationResult, setAggregationResult] = useState<any>(null);

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('system_settings')
        .select('firecrawl_enabled, firecrawl_api_key, firecrawl_last_run, firecrawl_rate_limited')
        .eq('id', 'aggregation_status')
        .single();

      if (error) {
        throw error;
      }

      setSettings({
        enabled: data.firecrawl_enabled || false,
        api_key: data.firecrawl_api_key || '',
        last_run: data.firecrawl_last_run,
        rate_limited: data.firecrawl_rate_limited || false
      });
    } catch (err) {
      console.error('Error fetching FireCrawl settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load FireCrawl settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      await aggregationService.updateFireCrawlSettings({
        enabled: settings.enabled,
        api_key: settings.api_key
      });

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh settings
      await fetchSettings();
    } catch (err) {
      console.error('Error saving FireCrawl settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const runFireCrawlAggregation = async () => {
    try {
      setRunningAggregation(true);
      setError(null);
      setAggregationResult(null);

      const result = await aggregationService.triggerFireCrawlAggregation();
      setAggregationResult(result);
      
      // Refresh settings after running
      await fetchSettings();
    } catch (err) {
      console.error('Error running FireCrawl aggregation:', err);
      setError(err instanceof Error ? err.message : 'Failed to run FireCrawl aggregation');
    } finally {
      setRunningAggregation(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-white">FireCrawl API Configuration</h2>
        <button
          onClick={fetchSettings}
          className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
          title="Refresh settings"
        >
          <RefreshCw className={`h-4 w-4 text-gray-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-green-900/20 border border-green-800/30 rounded-lg p-4 text-green-300 flex items-center"
        >
          <Check className="h-5 w-5 mr-2" />
          FireCrawl settings saved successfully
        </motion.div>
      )}

      <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-700/50">
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Enable FireCrawl API</span>
              <button 
                onClick={toggleEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${settings.enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`} 
                />
              </button>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">FireCrawl API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.api_key}
                  onChange={e => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="Enter your FireCrawl API key"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white pr-10"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300"
                  type="button"
                >
                  {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Default key is provided, but for production use, get your own key from{' '}
                <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  firecrawl.dev
                </a>
              </p>
            </div>

            {/* Last Run and Rate Limited Status */}
            {settings.last_run && (
              <div className="p-3 bg-gray-800/80 rounded-lg">
                <div className="flex items-center text-sm text-gray-400 mb-2">
                  Last Run: <span className="ml-2 text-gray-300">{new Date(settings.last_run).toLocaleString()}</span>
                </div>
                
                {settings.rate_limited && (
                  <div className="flex items-center text-yellow-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    API currently rate limited. Try again in 1 hour.
                  </div>
                )}
              </div>
            )}
            
            {/* Notes about the API */}
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-300">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">About FireCrawl</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li>Crawls multiple crypto news sources including Tree of Alpha and TradingView</li>
                    <li>Extracts structured news data from web pages</li>
                    <li>Automatically runs every 15 minutes to keep your feed updated</li>
                    <li>Focuses on Bitcoin, Ethereum, Solana, TON, and XRP news</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-between items-center pt-4">
              <button
                onClick={saveSettings}
                disabled={saving}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  saving
                    ? 'bg-blue-700/50 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
              
              <button
                onClick={runFireCrawlAggregation}
                disabled={runningAggregation || !settings.enabled || settings.rate_limited}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  runningAggregation || !settings.enabled || settings.rate_limited
                    ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } transition-colors`}
              >
                {runningAggregation ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run FireCrawl Aggregation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Aggregation Results */}
        {aggregationResult && (
          <div className="p-6 bg-gray-900/30 border-t border-gray-700/50">
            <h3 className="text-lg font-medium text-white mb-3">Aggregation Results</h3>
            
            <div className="bg-gray-800/70 p-4 rounded-lg">
              <p className="text-gray-300 mb-2">{aggregationResult.message}</p>
              
              {aggregationResult.count > 0 ? (
                <p className="text-green-400">Successfully added {aggregationResult.count} new articles from FireCrawl</p>
              ) : (
                <p className="text-yellow-400">No new articles were added from FireCrawl</p>
              )}
              
              {aggregationResult.status === 'skipped' && (
                <div className="mt-2 bg-yellow-900/30 p-3 rounded-lg text-yellow-300">
                  <p className="font-medium">Aggregation Skipped</p>
                  <p className="text-sm mt-1">{aggregationResult.reason || 'FireCrawl API is disabled in system settings'}</p>
                </div>
              )}
              
              {aggregationResult.error && (
                <div className="mt-2 bg-red-900/30 p-3 rounded-lg text-red-300">
                  <p className="font-medium">Error:</p>
                  <p className="text-sm">{aggregationResult.error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FireCrawlSettings;