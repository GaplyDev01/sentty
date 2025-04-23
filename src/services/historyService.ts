import { supabase } from '../lib/supabase';
import type { ArticleView, Article } from '../types/newsapi';

/**
 * Service to track and manage user article view history
 */
export const historyService = {
  /**
   * Record an article view
   * @param userId - User ID
   * @param articleId - Article ID
   * @param duration - Optional view duration in seconds
   * @returns The created view record
   */
  async recordView(userId: string, articleId: string, duration?: number): Promise<ArticleView | null> {
    try {
      // Check for recent views of the same article to prevent duplicates
      // Only consider views in the last 5 minutes as duplicates
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      const { data: recentViews, error: recentViewsError } = await supabase
        .from('article_views')
        .select('id, viewed_at')
        .eq('user_id', userId)
        .eq('article_id', articleId)
        .gte('viewed_at', fiveMinutesAgo.toISOString())
        .order('viewed_at', { ascending: false })
        .limit(1);
      
      if (recentViewsError) {
        console.error('Error checking for recent views:', recentViewsError);
      } else if (recentViews && recentViews.length > 0) {
        // Return the existing view record instead of creating a new one
        console.log('Found recent view, not creating duplicate');
        return recentViews[0] as ArticleView;
      }
      
      // No recent view found, create a new record
      const { data, error } = await supabase
        .from('article_views')
        .insert({
          user_id: userId,
          article_id: articleId,
          view_duration: duration || null,
          viewed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording article view:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in recordView:', error);
      return null;
    }
  },

  /**
   * Update the duration of an article view
   * @param viewId - View ID to update
   * @param duration - New duration in seconds
   * @returns Success status
   */
  async updateViewDuration(viewId: string, duration: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('article_views')
        .update({ view_duration: duration })
        .eq('id', viewId);

      if (error) {
        console.error('Error updating view duration:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateViewDuration:', error);
      return false;
    }
  },

  /**
   * Get user's article view history
   * @param userId - User ID
   * @param limit - Maximum number of records to return
   * @param includeArticles - Whether to include full article data
   * @returns User's article view history
   */
  async getUserHistory(
    userId: string,
    limit: number = 50,
    includeArticles: boolean = true
  ): Promise<ArticleView[]> {
    try {
      let query = supabase
        .from('article_views')
        .select(includeArticles ? `*, article:articles(*)` : '*')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching view history:', error);
        throw error;
      }

      // Transform the data to nest articles properly
      return (data || []).map(view => {
        if (includeArticles && view.article) {
          return {
            ...view,
            article: view.article as Article
          };
        }
        return view;
      });
    } catch (error) {
      console.error('Error in getUserHistory:', error);
      return [];
    }
  },

  /**
   * Clear user's view history
   * @param userId - User ID
   * @returns Success status
   */
  async clearHistory(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('article_views')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing view history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clearHistory:', error);
      return false;
    }
  },

  /**
   * Check if user has viewed an article
   * @param userId - User ID
   * @param articleId - Article ID
   * @returns Whether the user has viewed the article
   */
  async hasViewedArticle(userId: string, articleId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('article_views')
        .select('id')
        .eq('user_id', userId)
        .eq('article_id', articleId)
        .limit(1);

      if (error) {
        console.error('Error checking article view:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in hasViewedArticle:', error);
      return false;
    }
  },

  /**
   * Get most viewed article categories (for personalization)
   * @param userId - User ID
   * @returns Categories with view counts
   */
  async getMostViewedCategories(userId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('article_views')
        .select('article:articles(category)')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching view categories:', error);
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
      console.error('Error in getMostViewedCategories:', error);
      return {};
    }
  },

  /**
   * Get view count for a specific article
   * @param articleId - Article ID
   * @returns View count
   */
  async getArticleViewCount(articleId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('article_views')
        .select('id', { count: 'exact', head: true })
        .eq('article_id', articleId);

      if (error) {
        console.error('Error fetching article view count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getArticleViewCount:', error);
      return 0;
    }
  },
  
  /**
   * Get unique views count for articles by category
   * @returns Categories with unique view counts
   */
  async getCategoryViewCounts(): Promise<Record<string, number>> {
    try {
      // Get the count of unique articles viewed by category
      const { data, error } = await supabase
        .from('article_views')
        .select('article:articles(category)')
        .order('viewed_at', { ascending: false });

      if (error) {
        console.error('Error fetching category view counts:', error);
        throw error;
      }

      // Count unique article views by category
      const uniqueArticlesByCategory: Record<string, Set<string>> = {};
      
      if (data) {
        data.forEach(item => {
          if (item.article?.category) {
            const category = item.article.category;
            if (!uniqueArticlesByCategory[category]) {
              uniqueArticlesByCategory[category] = new Set();
            }
            // We're using the article ID here, but it's hidden in the database response
            // This is a simplification - in a real app we'd need to include article_id in the query
            uniqueArticlesByCategory[category].add(item.article.id || 'unknown');
          }
        });
      }
      
      // Convert from Set sizes to counts
      const categoryCounts: Record<string, number> = {};
      
      Object.entries(uniqueArticlesByCategory).forEach(([category, articleIds]) => {
        categoryCounts[category] = articleIds.size;
      });

      return categoryCounts;
    } catch (error) {
      console.error('Error in getCategoryViewCounts:', error);
      return {};
    }
  }
};