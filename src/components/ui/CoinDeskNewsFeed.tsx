import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight, BarChart2, ExternalLink, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { coinDeskService } from '../../services/coinDeskService';
import type { Article } from '../../types/newsapi';

interface CoinDeskNewsFeedProps {
  limit?: number;
  className?: string;
  showTitle?: boolean;
  showRefresh?: boolean;
  compact?: boolean;
}

const CoinDeskNewsFeed: React.FC<CoinDeskNewsFeedProps> = ({ 
  limit = 5, 
  className = '',
  showTitle = true,
  showRefresh = true,
  compact = false
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, [limit]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await coinDeskService.fetchCoinDeskNews({ limit });
      setArticles(result.articles);
      
    } catch (err) {
      console.error('Error fetching CoinDesk news:', err);
      setError(err instanceof Error ? err.message : 'Failed to load CoinDesk news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchArticles();
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch (err) {
      console.warn('Error formatting date:', err);
      return dateStr;
    }
  };

  if (loading && !refreshing) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} rounded-lg bg-gray-900/50 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-400">Loading CoinDesk news...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} rounded-lg bg-red-900/20 border border-red-800/30 ${className}`}>
        <div className="text-red-400 mb-2 font-medium">Failed to load CoinDesk news</div>
        <p className="text-sm text-red-300">{error}</p>
        <button 
          onClick={handleRefresh} 
          className="mt-2 text-blue-400 hover:text-blue-300 flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Try again
        </button>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} rounded-lg bg-gray-900/50 ${className}`}>
        <p className="text-gray-400 text-center py-4">No CoinDesk news available</p>
        {showRefresh && (
          <button 
            onClick={handleRefresh} 
            className="mt-2 text-blue-400 hover:text-blue-300 flex items-center justify-center w-full"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${compact ? 'p-2' : 'p-4'} rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-blue-400" />
            CoinDesk Impact News
          </h3>
          {showRefresh && (
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {articles.map((article, index) => (
          <motion.div
            key={`${article.id}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={`${compact ? 'p-2' : 'p-3'} bg-gray-800/70 hover:bg-gray-700/70 rounded-lg border border-gray-700/40 transition-colors group`}
          >
            <a 
              href={article.url} 
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="flex items-start gap-3">
                {article.image_url && !compact && (
                  <img 
                    src={article.image_url} 
                    alt={article.title} 
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    onError={(e) => {
                      // Hide image on error
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(article.published_at)}
                    </span>
                  </div>
                  
                  <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors`}>
                    {article.title}
                  </h4>
                  
                  {!compact && article.content && (
                    <p className="text-gray-400 text-sm line-clamp-1">
                      {article.content.replace(/<\/?[^>]+(>|$)/g, '')}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {article.source}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-3 text-center">
        <a 
          href="https://www.coindesk.com" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center transition-colors"
        >
          More on CoinDesk
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </a>
      </div>
    </div>
  );
};

export default CoinDeskNewsFeed;