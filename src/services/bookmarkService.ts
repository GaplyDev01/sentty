import { supabase } from '../lib/supabase';
import type { Bookmark } from '../types/newsapi';

/**
 * Service to manage user bookmarks
 */
export const bookmarkService = {
  /**
   * Add a bookmark for an article
   * @param userId - User ID
   * @param articleId - Article ID
   * @param note - Optional note for the bookmark
   * @returns The created bookmark
   */
  async addBookmark(userId: string, articleId: string, note?: string): Promise<Bookmark | null> {
    try {
      // First check if the bookmark already exists
      const { data: existingBookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('article_id', articleId)
        .single();

      if (existingBookmark) {
        return existingBookmark as Bookmark;
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          article_id: articleId,
          note: note || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding bookmark:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in addBookmark:', error);
      return null;
    }
  },

  /**
   * Remove a bookmark
   * @param userId - User ID
   * @param articleId - Article ID
   * @returns Success status
   */
  async removeBookmark(userId: string, articleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .match({
          user_id: userId,
          article_id: articleId
        });

      if (error) {
        console.error('Error removing bookmark:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeBookmark:', error);
      return false;
    }
  },

  /**
   * Check if an article is bookmarked by a user
   * @param userId - User ID
   * @param articleId - Article ID
   * @returns Whether the article is bookmarked
   */
  async isBookmarked(userId: string, articleId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('article_id', articleId);

      if (error) {
        console.error('Error checking bookmark:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in isBookmarked:', error);
      return false;
    }
  },

  /**
   * Get all bookmarks for a user
   * @param userId - User ID
   * @param includeArticles - Whether to include full article data
   * @returns User's bookmarks
   */
  async getUserBookmarks(userId: string, includeArticles: boolean = true): Promise<Bookmark[]> {
    try {
      let query = supabase
        .from('bookmarks')
        .select(includeArticles ? `*, article:articles(*)` : '*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching bookmarks:', error);
        throw error;
      }

      // Transform the data to nest articles properly
      return (data || []).map(bookmark => {
        if (includeArticles && bookmark.article) {
          return {
            ...bookmark,
            article: bookmark.article
          };
        }
        return bookmark;
      });
    } catch (error) {
      console.error('Error in getUserBookmarks:', error);
      return [];
    }
  },

  /**
   * Update a bookmark's note
   * @param bookmarkId - Bookmark ID
   * @param note - New note content
   * @returns The updated bookmark
   */
  async updateBookmarkNote(bookmarkId: string, note: string): Promise<Bookmark | null> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .update({ note })
        .eq('id', bookmarkId)
        .select()
        .single();

      if (error) {
        console.error('Error updating bookmark note:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateBookmarkNote:', error);
      return null;
    }
  },

  /**
   * Get article count by category from bookmarks (for analytics)
   * @param userId - User ID
   * @returns Category counts
   */
  async getBookmarkStatsByCategory(userId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('article:articles(category)')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching bookmark stats:', error);
        throw error;
      }

      const categoryCounts: Record<string, number> = {};
      
      if (data) {
        data.forEach(item => {
          const category = item.article?.category;
          if (category) {
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          }
        });
      }

      return categoryCounts;
    } catch (error) {
      console.error('Error in getBookmarkStatsByCategory:', error);
      return {};
    }
  }
};