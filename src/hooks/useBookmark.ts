import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookmarkService } from '../services/bookmarkService';
import type { Article } from '../types/newsapi';

/**
 * Hook to manage article bookmarks
 * @param articleId - Optional initial article ID
 * @returns Bookmark utilities
 */
export function useBookmark(articleId?: string) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if article is bookmarked on mount or when article changes
  useEffect(() => {
    if (!user || !articleId) return;

    const checkBookmarkStatus = async () => {
      setLoading(true);
      try {
        const status = await bookmarkService.isBookmarked(user.id, articleId);
        setIsBookmarked(status);
        setError(null);
      } catch (err) {
        console.error('Error checking bookmark status:', err);
        setError('Failed to check bookmark status');
      } finally {
        setLoading(false);
      }
    };

    checkBookmarkStatus();
  }, [user, articleId]);

  // Toggle bookmark
  const toggleBookmark = useCallback(async (article: Article, note?: string) => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        const success = await bookmarkService.removeBookmark(user.id, article.id);
        setIsBookmarked(false);
        return success;
      } else {
        // Add bookmark
        const bookmark = await bookmarkService.addBookmark(user.id, article.id, note);
        setIsBookmarked(true);
        return !!bookmark;
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setError('Failed to update bookmark');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, isBookmarked]);

  // Check if an article (possibly different from initial) is bookmarked
  const checkArticleBookmark = useCallback(async (articleToCheck: string) => {
    if (!user) return false;
    
    try {
      return await bookmarkService.isBookmarked(user.id, articleToCheck);
    } catch (err) {
      console.error('Error checking article bookmark:', err);
      return false;
    }
  }, [user]);

  return {
    isBookmarked,
    loading,
    error,
    toggleBookmark,
    checkArticleBookmark
  };
}