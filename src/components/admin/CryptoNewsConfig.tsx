import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Save, Plus, Trash, Edit, Check, X, AlertCircle, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { aggregationService } from '../../services/aggregationService';

interface CryptoSource {
  id: string;
  name: string;
  url: string;
  type: string;
  article_limit: number;
  created_at?: string;
  updated_at?: string;
}

const CryptoNewsConfig: React.FC = () => {
  const [sources, setSources] = useState<CryptoSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<CryptoSource | null>(null);
  const [newSource, setNewSource] = useState<Partial<CryptoSource>>({
    name: '',
    url: '',
    type: 'rss',
    article_limit: 50
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [runningAggregation, setRunningAggregation] = useState(false);
  const [aggregationResult, setAggregationResult] = useState<any>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('crypto_crawl_sites')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setSources(data || []);
    } catch (err) {
      console.error('Error fetching crypto sources:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sources');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSource = (source: CryptoSource) => {
    setEditingSource({ ...source });
  };

  const handleCancelEdit = () => {
    setEditingSource(null);
  };

  const handleSaveEdit = async () => {
    if (!editingSource) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('crypto_crawl_sites')
        .update({
          name: editingSource.name,
          url: editingSource.url,
          type: editingSource.type,
          article_limit: editingSource.article_limit,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSource.id);

      if (error) {
        throw error;
      }

      // Update the sources list
      await fetchSources();
      setEditingSource(null);
      
      // Show success message briefly
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating source:', err);
      setError(err instanceof Error ? err.message : 'Failed to update source');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this source?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('crypto_crawl_sites')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Refresh the sources list
      await fetchSources();
    } catch (err) {
      console.error('Error deleting source:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete source');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      if (!newSource.name?.trim() || !newSource.url?.trim() || !newSource.type?.trim()) {
        setError('Name, URL, and type are required');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('crypto_crawl_sites')
        .insert({
          name: newSource.name.trim(),
          url: newSource.url.trim(),
          type: newSource.type,
          article_limit: newSource.article_limit || 50
        });

      if (error) {
        throw error;
      }

      // Reset form and refresh list
      setNewSource({
        name: '',
        url: '',
        type: 'rss',
        article_limit: 50
      });
      setIsAddingNew(false);
      await fetchSources();
      
      // Show success message briefly
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error adding source:', err);
      setError(err instanceof Error ? err.message : 'Failed to add source');
    } finally {
      setLoading(false);
    }
  };

  const runCryptoAggregation = async () => {
    try {
      setRunningAggregation(true);
      setError(null);
      setAggregationResult(null);

      // Call the crypto news aggregation function
      const result = await aggregationService.triggerCryptoAggregation();
      setAggregationResult(result);

    } catch (err) {
      console.error('Error running crypto aggregation:', err);
      setError(err instanceof Error ? err.message : 'Failed to run crypto aggregation');
    } finally {
      setRunningAggregation(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-white">Crypto News Sources</h2>
        <div className="flex space-x-3">
          <button
            onClick={fetchSources}
            disabled={loading}
            className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            title="Refresh sources"
          >
            <RefreshCw className={`h-4 w-4 text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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
          Changes saved successfully
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
          <div className="p-4 bg-gray-900/30 border-b border-gray-700/50 flex justify-between items-center">
            <h3 className="font-medium text-white">Configured Sources</h3>
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              {isAddingNew ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Source
                </>
              )}
            </button>
          </div>

          {/* Add new source form */}
          {isAddingNew && (
            <div className="p-4 border-b border-gray-700/50 bg-gray-800/30">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Source</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={newSource.name || ''}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    placeholder="CoinDesk"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select
                    value={newSource.type || 'rss'}
                    onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                  >
                    <option value="rss">RSS Feed</option>
                    <option value="api">API</option>
                    <option value="html">HTML Scraper</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">URL</label>
                  <input
                    type="text"
                    value={newSource.url || ''}
                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    placeholder="https://example.com/rss"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Limit</label>
                  <input
                    type="number"
                    value={newSource.article_limit || 50}
                    onChange={(e) => setNewSource({ ...newSource, article_limit: parseInt(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleAddNew}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Source
                </button>
              </div>
            </div>
          )}

          {loading && sources.length === 0 ? (
            <div className="p-6 text-center">
              <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-400">Loading sources...</p>
            </div>
          ) : sources.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No sources configured yet. Add your first source to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">URL</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Limit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {sources.map((source) => (
                    <tr key={source.id}>
                      {editingSource?.id === source.id ? (
                        // Edit mode
                        <>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="text"
                              value={editingSource.name}
                              onChange={(e) => setEditingSource({ ...editingSource, name: e.target.value })}
                              className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={editingSource.type}
                              onChange={(e) => setEditingSource({ ...editingSource, type: e.target.value })}
                              className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white"
                            >
                              <option value="rss">RSS Feed</option>
                              <option value="api">API</option>
                              <option value="html">HTML Scraper</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingSource.url}
                              onChange={(e) => setEditingSource({ ...editingSource, url: e.target.value })}
                              className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={editingSource.article_limit}
                              onChange={(e) => setEditingSource({ ...editingSource, article_limit: parseInt(e.target.value) })}
                              className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white"
                              min="1"
                              max="100"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={handleSaveEdit}
                                className="p-1 rounded text-green-400 hover:bg-gray-700"
                                title="Save"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 rounded text-red-400 hover:bg-gray-700"
                                title="Cancel"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // View mode
                        <>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{source.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-700">
                              {source.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            <div className="max-w-xs truncate">{source.url}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                            {source.article_limit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditSource(source)}
                                className="p-1 rounded text-blue-400 hover:bg-gray-700"
                                title="Edit"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSource(source.id)}
                                className="p-1 rounded text-red-400 hover:bg-gray-700"
                                title="Delete"
                              >
                                <Trash className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-6">
            <h3 className="font-medium text-white mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-400" /> 
              Crypto News Aggregation
            </h3>
            
            <p className="text-gray-300 mb-4">
              Manually trigger the crypto news aggregation process to fetch the latest articles from all configured sources.
            </p>
            
            <button
              onClick={runCryptoAggregation}
              disabled={runningAggregation}
              className={`px-4 py-2 rounded-lg flex items-center ${
                runningAggregation
                  ? 'bg-blue-700/50 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {runningAggregation ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fetching crypto news...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Crypto Aggregation Now
                </>
              )}
            </button>

            {/* Aggregation results */}
            {aggregationResult && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 bg-gray-800/70 border border-gray-700/30 rounded-lg text-sm"
              >
                <h4 className="font-medium text-white mb-2">Aggregation Results</h4>
                
                <div className="space-y-2">
                  <p className="text-gray-300">{aggregationResult.message}</p>
                  
                  {aggregationResult.count > 0 ? (
                    <p className="text-green-400">Added {aggregationResult.count} new articles</p>
                  ) : (
                    <p className="text-yellow-400">No new articles were added</p>
                  )}
                  
                  {aggregationResult.sources && Object.keys(aggregationResult.sources).length > 0 && (
                    <div>
                      <p className="text-gray-400 mt-2 mb-1">Articles by source:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(aggregationResult.sources).map(([source, count]: [string, any]) => (
                          <div key={source} className="bg-gray-900/40 px-3 py-1 rounded-md text-xs flex justify-between">
                            <span>{source}</span>
                            <span className="text-blue-400">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {aggregationResult.errors && aggregationResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-red-400">Errors:</p>
                      <div className="bg-red-900/20 p-2 rounded-md text-red-300 mt-1 text-xs">
                        {aggregationResult.errors.map((err: any, i: number) => (
                          <div key={i} className="mb-1 last:mb-0">
                            {err.source}: {err.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-6">
            <h3 className="font-medium text-white mb-4">About Crypto News Aggregation</h3>
            
            <div className="space-y-3 text-sm text-gray-300">
              <p>
                The crypto news aggregator fetches articles from RSS feeds of popular cryptocurrency news sites.
              </p>
              
              <p>
                Features of the aggregation system:
              </p>
              
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                <li>Automatically runs with the scheduled aggregation every 15 minutes</li>
                <li>Fetches from multiple sources in a single run</li>
                <li>Deduplicates articles to avoid storing the same article twice</li>
                <li>Extracts metadata like images, tags, and publication dates</li>
                <li>Categorizes articles based on content</li>
              </ul>
              
              <div className="bg-blue-900/30 border border-blue-700/30 rounded-md p-3 flex items-start mt-2">
                <AlertCircle className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-300">Supported RSS Types</p>
                  <p className="mt-1 text-gray-300">
                    The system supports standard RSS feeds and Atom feeds. API integrations can be added for sources
                    that provide structured data APIs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoNewsConfig;