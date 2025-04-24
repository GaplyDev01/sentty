import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { RefreshCw, Check, XCircle, Clock, Filter, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { aggregationService } from '../../services/aggregationService';
import type { AggregationLog } from '../../types/newsapi';

const AggregationLogs: React.FC = () => {
  const [logs, setLogs] = useState<AggregationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'scheduled'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const options: { status?: 'success' | 'error' | 'running' | 'partial_success' | 'skipped'; type?: string } = {};
      
      if (filter === 'success') {
        options.status = 'success';
      } else if (filter === 'error') {
        options.status = 'error';
      } else if (filter === 'scheduled') {
        options.type = 'scheduled_aggregation';
      }
      
      const data = await aggregationService.getAggregationLogs(options);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching aggregation logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatLogDetails = (log: AggregationLog) => {
    if (!log.details) return 'No details available';
  
    const details = log.details;
    
    switch (log.event_type) {
      case 'aggregation':
        if (log.status === 'success') {
          return `${details.count || details.articles_count || 0} articles added`;
        } else {
          return details.error || 'Error during aggregation';
        }
        
      case 'crypto_aggregation':
        if (log.status === 'success') {
          return `${details.count || 0} crypto articles added`;
        } else {
          return details.error || 'Error during crypto aggregation';
        }
        
      case 'scheduled_aggregation':
        if (log.status === 'success') {
          const generalCount = details.generalNewsCount || 0;
          const cryptoCount = details.cryptoNewsCount || 0;
          return `Scheduled: ${generalCount + cryptoCount} articles added (${generalCount} general, ${cryptoCount} crypto)`;
        } else if (log.status === 'skipped') {
          return `Scheduled run skipped: ${details.reason}`;
        } else {
          return details.error || 'Error during scheduled aggregation';
        }
        
      case 'schedule_update':
        return `Schedule updated: ${details.frequency || 'unknown frequency'}, ${details.enabled ? 'enabled' : 'disabled'}`;
        
      case 'migration':
        return `Migration: ${details.migration || 'unknown migration'}`;
        
      case 'system_migration':
        return details.message || 'System migration';
        
      default:
        // Try to convert details to a readable string
        if (typeof details === 'object') {
          return Object.entries(details)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        }
        return String(details);
    }
  };

  return (
    <div className="bg-gray-900/50 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white">Aggregation Logs</h3>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'all' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'success' 
                  ? 'bg-green-900/40 text-green-300' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'error' 
                  ? 'bg-red-900/40 text-red-300' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Errors
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'scheduled' 
                  ? 'bg-blue-900/40 text-blue-300' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Scheduled
            </button>
          </div>
          
          <button 
            onClick={handleRefresh} 
            className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            disabled={refreshing || loading}
            title="Refresh logs"
          >
            <RefreshCw className={`h-4 w-4 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-md p-4 mb-4 text-red-300">
          <h3 className="font-medium mb-1">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {loading && !refreshing ? (
        <div className="flex justify-center py-6">
          <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No logs found
        </div>
      ) : (
        <motion.div 
          className="overflow-x-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/30">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Event
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(log.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-white capitalize">
                      {log.event_type === 'scheduled_aggregation' ? (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-blue-400" />
                          scheduled
                        </span>
                      ) : log.event_type.replace(/_/g, ' ')}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                    {format(parseISO(log.created_at), 'MMM dd, HH:mm:ss')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {log.status === 'success' ? (
                      <span>{formatLogDetails(log)}</span>
                    ) : (
                      <span className="text-red-400">{formatLogDetails(log)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default AggregationLogs;