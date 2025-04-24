import { supabase } from '../lib/supabase';
import type { Article } from '../types/newsapi';
import axios from 'axios';

/**
 * Service for fetching and managing impact news
 */
export const impactNewsService = {
  /**
   * Fetch latest impact news from the Supabase Edge Functions
   * @param options Options for the request
   * @returns Promise with news articles
   */
  async fetchLatestImpactNews(options: {
    limit?: number;
    category?: string;
    forceUpdate?: boolean;
  } = {}): Promise<{
    articles: Article[];
    source: string;
  }> {
    try {
      console.log('Fetching latest impact news articles...');
      
      // First try to call the aggregate-news Edge Function
      try {
        const { data, error } = await supabase.functions.invoke('aggregate-news', {
          body: {
            limit: options.limit || 10,
            forceUpdate: options.forceUpdate || false,
            category: options.category || null,
            singleCategory: true // To avoid rate limiting
          }
        });
        
        if (error) {
          console.error('Error invoking aggregate-news function:', error);
          throw error;
        }
        
        console.log('Aggregate-news function response:', data);
        
        // If successful, fetch the latest articles from the database
        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(options.limit || 10);
        
        if (articlesError) {
          console.error('Error fetching articles after aggregation:', articlesError);
          throw articlesError;
        }
        
        if (articlesData && articlesData.length > 0) {
          console.log(`Retrieved ${articlesData.length} articles from Supabase`);
          return {
            articles: articlesData,
            source: 'supabase-edge-function'
          };
        }
      } catch (edgeFunctionError) {
        console.error('Edge Function approach failed:', edgeFunctionError);
        // Continue to fallback approaches
      }
      
      // If edge function fails, try direct database query
      try {
        const { data: directArticles, error: directError } = await supabase
          .from('articles')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(options.limit || 10);
        
        if (directError) {
          throw directError;
        }
        
        if (directArticles && directArticles.length > 0) {
          console.log(`Retrieved ${directArticles.length} articles directly from Supabase`);
          return {
            articles: directArticles,
            source: 'supabase-direct-query'
          };
        }
      } catch (directQueryError) {
        console.error('Direct database query failed:', directQueryError);
        // Continue to final fallback
      }
      
      // Final fallback: use local RSS file
      const response = await axios.get('/feeds/impact-news.json');
      if (response.data && response.data.items && response.data.items.length > 0) {
        console.log('Using local RSS file as fallback');
        
        const articles: Article[] = response.data.items.map((item: any) => ({
          id: crypto.randomUUID(),
          title: item.title,
          content: item.contentSnippet || item.content || '',
          source: item.creator || 'Impact News',
          url: item.link,
          image_url: item.enclosure?.url || null,
          published_at: new Date(item.pubDate).toISOString(),
          created_at: new Date().toISOString(),
          relevance_score: 60, // Default score
          category: item.categories?.[0] || 'general',
          tags: item.categories,
          language: 'en'
        }));
        
        return {
          articles,
          source: 'local-rss-fallback'
        };
      }
      
      throw new Error('All methods to fetch impact news failed');
    } catch (error) {
      console.error('Error in fetchLatestImpactNews:', error);
      throw error;
    }
  }
};