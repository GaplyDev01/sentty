import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useArticleHistory } from '../hooks/useArticleHistory';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, Trash2, Eye, Calendar, FilterX, Layers } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import BookmarkButton from '../components/articles/BookmarkButton';
import ArticlePreviewModal from '../components/articles/ArticlePreviewModal';
import type { Article, ArticleView } from '../types/newsapi';
import { Link } from 'react-router-dom';

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { history, loading, error, fetchHistory, clearHistory } = useArticleHistory();
  const [groupedHistory, setGroupedHistory] = useState<Record<string, ArticleView[]>>({});
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Group history by date for better organization
  useEffect(() => {
    const grouped: Record<string, ArticleView[]> = {};
    
    history.forEach(item => {
      // Format as YYYY-MM-DD for grouping
      const dateKey = new Date(item.viewed_at).toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(item);
    });
    
    // Sort groups by date (newest first)
    const sortedGrouped: Record<string, ArticleView[]> = {};
    Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .forEach(key => {
        sortedGrouped[key] = grouped[key];
      });
    
    setGroupedHistory(sortedGrouped);
  }, [history]);
  
  // Effect to filter history by time period
  useEffect(() => {
    if (user) {
      const getFilteredHistory = async () => {
        let daysToFetch: number;
        
        switch (timeFilter) {
          case 'today':
            daysToFetch = 1;
            break;
          case 'week':
            daysToFetch = 7;
            break;
          case 'all':
          default:
            daysToFetch = 365; // Fetch a year's worth of history
            break;
        }
        
        await fetchHistory(100); // Limit to last 100 views
      };
      
      getFilteredHistory();
    }
  }, [user, timeFilter, fetchHistory]);
  
  const handleClearHistory = useCallback(async () => {
    if (!user || !window.confirm('Are you sure you want to clear your browsing history?')) {
      return;
    }
    
    await clearHistory();
  }, [user, clearHistory]);
  
  const openArticlePreview = (article: Article) => {
    setSelectedArticle(article);
    setIsPreviewOpen(true);
  };
  
  if (!user) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Sign in to see your history</h2>
        <p className="text-gray-400 mb-6">You need to be logged in to view your article history.</p>
      </div>
    );
  }
  
  const formatHistoryDate = (dateString: string) => {
    const date = new Date(dateString.split('T')[0]);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };
  
  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-6"
      >
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Clock className="h-7 w-7 mr-3 text-blue-400" />
          Browsing History
        </h1>
        
        <div className="flex flex-wrap gap-3">
          {Object.keys(groupedHistory).length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </button>
          )}
        </div>
      </motion.div>
      
      {/* Time filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setTimeFilter('all')}
          className={`px-3 py-1.5 rounded-lg flex items-center text-sm transition-colors ${
            timeFilter === 'all'
              ? 'bg-blue-600 text-white font-medium'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Layers className="h-3.5 w-3.5 mr-2" />
          All Time
        </button>
        
        <button
          onClick={() => setTimeFilter('today')}
          className={`px-3 py-1.5 rounded-lg flex items-center text-sm transition-colors ${
            timeFilter === 'today'
              ? 'bg-blue-600 text-white font-medium'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 mr-2" />
          Today
        </button>
        
        <button
          onClick={() => setTimeFilter('week')}
          className={`px-3 py-1.5 rounded-lg flex items-center text-sm transition-colors ${
            timeFilter === 'week'
              ? 'bg-blue-600 text-white font-medium'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 mr-2" />
          This Week
        </button>
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 text-red-300">
          {error}
          <button 
            onClick={() => fetchHistory()} 
            className="ml-4 underline hover:text-red-200"
          >
            Try Again
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : Object.keys(groupedHistory).length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center"
        >
          <div className="mb-4 inline-flex p-4 bg-gray-800/50 rounded-full">
            <FilterX className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No browsing history</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Articles you view will appear here. Start exploring content to build your history.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([dateKey, items]) => (
            <div key={dateKey} className="space-y-3">
              <h2 className="text-xl font-semibold text-white">
                {formatHistoryDate(dateKey)}
              </h2>
              
              <div className="space-y-2">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/70 border border-gray-700/50 rounded-lg p-4 hover:border-blue-500/30 transition-colors"
                  >
                    {item.article && (
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Article image */}
                        {item.article.image_url && (
                          <div 
                            className="w-full sm:w-40 h-28 flex-shrink-0 overflow-hidden rounded-lg cursor-pointer"
                            onClick={() => openArticlePreview(item.article as Article)}
                          >
                            <img 
                              src={item.article.image_url} 
                              alt={item.article.title} 
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        )}
                        
                        {/* Article details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 
                              className="text-lg font-medium text-white mb-1 hover:text-blue-400 transition-colors cursor-pointer"
                              onClick={() => openArticlePreview(item.article as Article)}
                            >
                              {item.article.title}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 mb-2">
                              <span className="px-2 py-0.5 rounded-full bg-gray-700/60">
                                {item.article.category}
                              </span>
                              <span>
                                {item.article.source}
                              </span>
                              <div className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                Viewed {formatDistanceToNow(new Date(item.viewed_at), { addSuffix: true })}
                              </div>
                              {item.view_duration && (
                                <div className="text-gray-500">
                                  {Math.floor(item.view_duration / 60) > 0 
                                    ? `${Math.floor(item.view_duration / 60)}m ${item.view_duration % 60}s` 
                                    : `${item.view_duration}s`} view time
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <Link
                              to={`/dashboard/article/${item.article.id}`}
                              className="p-1.5 rounded-md hover:bg-gray-700/70 transition-colors text-gray-400 hover:text-white"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <BookmarkButton article={item.article as Article} />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Preview Modal */}
      {selectedArticle && (
        <ArticlePreviewModal
          article={selectedArticle}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};

export default HistoryPage;