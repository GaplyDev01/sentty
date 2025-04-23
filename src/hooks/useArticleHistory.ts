import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { historyService } from '../services/historyService';
import type { ArticleView } from '../types/newsapi';

/**
 * Hook to track and manage article view history
 */
export function useArticleHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ArticleView[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recentlyViewedArticles, setRecentlyViewedArticles] = useState<Set<string>>(new Set());

  // Fetch user's view history
  const fetchHistory = useCallback(async (limit?: number) => {
    if (!user) {
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const viewHistory = await historyService.getUserHistory(user.id, limit);
      setHistory(viewHistory);
      
      // Update the set of recently viewed articles
      const viewedArticleIds = new Set<string>();
      viewHistory.forEach(item => {
        if (item.article_id) {
          viewedArticleIds.add(item.article_id);
        }
      });
      setRecentlyViewedArticles(viewedArticleIds);
      
    } catch (err) {
      console.error('Error fetching view history:', err);
      setError('Failed to load view history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Record an article view with duplicate check
  const recordView = useCallback(async (articleId: string) => {
    if (!user) return null;
    
    // Skip recording if we've already recorded this article recently
    // This adds a client-side check in addition to the server-side check
    if (recentlyViewedArticles.has(articleId)) {
      console.log('Article already in recently viewed, skipping duplicate record');
      return null;
    }
    
    try {
      const result = await historyService.recordView(user.id, articleId);
      
      if (result) {
        // Add to locally tracked recently viewed articles
        setRecentlyViewedArticles(prev => new Set(prev).add(articleId));
      }
      
      return result;
    } catch (err) {
      console.error('Error recording view:', err);
      return null;
    }
  }, [user, recentlyViewedArticles]);

  // Clear user's view history
  const clearHistory = useCallback(async () => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await historyService.clearHistory(user.id);
      if (success) {
        setHistory([]);
        setRecentlyViewedArticles(new Set());
      }
      return success;
    } catch (err) {
      console.error('Error clearing history:', err);
      setError('Failed to clear history');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if user has viewed an article
  const hasViewed = useCallback(async (articleId: string) => {
    if (!user) return false;
    
    // First check local cache
    if (recentlyViewedArticles.has(articleId)) {
      return true;
    }
    
    try {
      return await historyService.hasViewedArticle(user.id, articleId);
    } catch (err) {
      console.error('Error checking if article was viewed:', err);
      return false;
    }
  }, [user, recentlyViewedArticles]);

  // Load history on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]);
      setRecentlyViewedArticles(new Set());
    }
  }, [user, fetchHistory]);

  return {
    history,
    loading,
    error,
    recordView,
    fetchHistory,
    clearHistory,
    hasViewed
  };
}