import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookmarkService } from '../services/bookmarkService';
import ArticleList from '../components/articles/ArticleList';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { BookmarkCheck, Filter, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAvailableCategories } from '../services/articleService';
import type { Article } from '../types/newsapi';

const BookmarksPage: React.FC = () => {
  const { user } = useAuth();
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  const availableCategories = getAvailableCategories();

  // Fetch bookmarks
  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const bookmarks = await bookmarkService.getUserBookmarks(user.id);
      
      // Extract articles from bookmarks
      const articles = bookmarks
        .filter(bookmark => bookmark.article) // Filter out any bookmarks without articles
        .map(bookmark => bookmark.article as Article);
      
      setBookmarkedArticles(articles);
      
      // Calculate category counts for filtering
      const counts: Record<string, number> = {};
      articles.forEach(article => {
        counts[article.category] = (counts[article.category] || 0) + 1;
      });
      setCategoryCounts(counts);
      
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError('Failed to load your bookmarks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load bookmarks on component mount
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleClearAllBookmarks = async () => {
    if (!user || !window.confirm('Are you sure you want to remove all your bookmarks?')) {
      return;
    }

    setLoading(true);
    
    try {
      // Remove each bookmark one by one
      for (const article of bookmarkedArticles) {
        await bookmarkService.removeBookmark(user.id, article.id);
      }
      
      // Clear local state
      setBookmarkedArticles([]);
      setCategoryCounts({});
      
    } catch (err) {
      console.error('Error clearing bookmarks:', err);
      setError('Failed to clear bookmarks');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter articles by category
  const getFilteredArticles = () => {
    if (!categoryFilter) return bookmarkedArticles;
    return bookmarkedArticles.filter(article => article.category === categoryFilter);
  };

  if (!user) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Sign in to see your bookmarks</h2>
        <p className="text-gray-400 mb-6">You need to be logged in to view and manage your bookmarks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-6"
      >
        <h1 className="text-3xl font-bold text-white flex items-center">
          <BookmarkCheck className="h-7 w-7 mr-3 text-blue-400" />
          Your Bookmarks
        </h1>
        
        {bookmarkedArticles.length > 0 && (
          <button
            onClick={handleClearAllBookmarks}
            className="flex items-center px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </button>
        )}
      </motion.div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 text-red-300">
          {error}
          <button 
            onClick={fetchBookmarks} 
            className="ml-4 underline hover:text-red-200"
          >
            Try Again
          </button>
        </div>
      )}
      
      {Object.keys(categoryCounts).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-3 py-1.5 rounded-lg flex items-center text-sm transition-colors ${
              categoryFilter === null
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Filter className="h-3.5 w-3.5 mr-2" />
            All Categories
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-700/70 rounded-md">
              {bookmarkedArticles.length}
            </span>
          </button>
          
          {Object.entries(categoryCounts)
            .sort(([_, countA], [__, countB]) => countB - countA)
            .map(([category, count]) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  categoryFilter === category
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {availableCategories.find(c => c.id === category)?.name || category}
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-700/70 rounded-md">
                  {count}
                </span>
              </button>
            ))
          }
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : bookmarkedArticles.length === 0 ? (
        <div className="py-16 text-center">
          <h2 className="text-xl font-medium text-white mb-2">No bookmarks yet</h2>
          <p className="text-gray-400">
            When you bookmark articles, they'll appear here for easy access.
          </p>
        </div>
      ) : (
        <ArticleList
          articles={getFilteredArticles()}
          loading={false}
          title={categoryFilter 
            ? `${availableCategories.find(c => c.id === categoryFilter)?.name || categoryFilter} Bookmarks` 
            : ''}
          onArticleRemoved={fetchBookmarks}
        />
      )}
    </div>
  );
};

export default BookmarksPage;