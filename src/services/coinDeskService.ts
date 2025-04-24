import { supabase } from '../lib/supabase';
import type { Article } from '../types/newsapi';

/**
 * Service for fetching and managing CoinDesk news
 */
export const coinDeskService = {
  /**
   * Get articles from the CoinDesk RSS feed
   * This uses direct DOM parsing of the RSS feed XML
   * @param limit - Maximum number of articles to return
   * @returns Promise with the parsed articles
   */
  async getArticlesFromRss(limit: number = 10): Promise<Article[]> {
    try {
      // Attempt to fetch the RSS feed directly
      const response = await fetch('https://www.coindesk.com/arc/outboundfeeds/rss/');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CoinDesk RSS feed: ${response.status}`);
      }
      
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'application/xml');
      
      // Extract all <item> elements
      const items = xml.querySelectorAll('item');
      const articles: Article[] = [];
      
      // Convert each item to an Article object
      for (let i = 0; i < Math.min(items.length, limit); i++) {
        const item = items[i];
        
        // Extract fields
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const content = item.querySelector('description')?.textContent || '';
        const pubDateStr = item.querySelector('pubDate')?.textContent || '';
        const creator = item.querySelector('dc\\:creator')?.textContent || 'CoinDesk';
        
        // Extract categories
        const categoryNodes = item.querySelectorAll('category');
        const categories = Array.from(categoryNodes).map(node => node.textContent || '');
        
        // Extract image URL if available
        let imageUrl = null;
        const enclosure = item.querySelector('enclosure');
        if (enclosure?.getAttribute('type')?.startsWith('image/')) {
          imageUrl = enclosure.getAttribute('url') || null;
        }
        
        // Extract image from content if no enclosure
        if (!imageUrl && content) {
          const imgRegex = /<img[^>]+src="([^">]+)"/i;
          const match = content.match(imgRegex);
          if (match && match[1]) {
            imageUrl = match[1];
          }
        }
        
        // Parse publication date
        let publishedAt = new Date().toISOString();
        try {
          if (pubDateStr) {
            publishedAt = new Date(pubDateStr).toISOString();
          }
        } catch (e) {
          console.warn('Could not parse date:', pubDateStr);
        }
        
        // Create article object
        const article: Article = {
          id: crypto.randomUUID(),
          title,
          content,
          source: 'CoinDesk',
          url: link,
          image_url: imageUrl,
          published_at: publishedAt,
          created_at: new Date().toISOString(),
          relevance_score: 60, // Default score
          category: 'crypto',
          tags: categories,
          language: 'en',
          source_id: 'coindesk-rss',
          source_guid: link // Use link as the unique identifier
        };
        
        articles.push(article);
      }
      
      return articles;
    } catch (error) {
      console.error('Error fetching CoinDesk RSS:', error);
      return [];
    }
  },
  
  /**
   * Fetch CoinDesk news from the Supabase edge function
   * @param options Options for the request
   * @returns Promise with news articles
   */
  async fetchCoinDeskNews(options: { limit?: number } = {}): Promise<{
    articles: Article[];
    source: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-coindesk-news', {
        body: {
          limit: options.limit || 10,
          forceUpdate: true
        }
      });
      
      if (error) {
        console.error('Error fetching CoinDesk news from Edge Function:', error);
        throw error;
      }
      
      // Process the data based on format
      if (data?.data?.Data && Array.isArray(data.data.Data)) {
        // Convert from CoinDesk API format to our format
        const articles: Article[] = data.data.Data.map((item: any) => ({
          id: crypto.randomUUID(),
          title: item.TITLE || '',
          content: item.BODY || item.SUBTITLE || '',
          source: item.SOURCE_DATA?.NAME || 'CoinDesk',
          url: item.URL || '',
          image_url: item.IMAGE_URL || null,
          published_at: item.PUBLISHED_ON ? new Date(item.PUBLISHED_ON * 1000).toISOString() : new Date().toISOString(),
          created_at: new Date().toISOString(),
          relevance_score: 60,
          category: 'crypto',
          tags: item.CATEGORY_DATA?.map((cat: any) => cat.NAME) || [],
          language: 'en',
          source_id: 'coindesk-api',
          source_guid: item.GUID || item.URL
        }));
        
        return {
          articles,
          source: 'coindesk-api'
        };
      }
      
      // If we have regular articles in data.articles
      if (data?.articles && Array.isArray(data.articles)) {
        return {
          articles: data.articles,
          source: data.source || 'coindesk-edge-function'
        };
      }
      
      // Fallback to local RSS if we couldn't parse the API response
      console.warn('Using RSS fallback - unexpected data format from Edge Function:', data);
      const articles = await this.getArticlesFromRss(options.limit);
      
      return {
        articles,
        source: 'coindesk-rss'
      };
    } catch (error) {
      console.error('Error in fetchCoinDeskNews:', error);
      
      // Try fallback to local RSS
      try {
        const articles = await this.getArticlesFromRss(options.limit);
        return {
          articles,
          source: 'coindesk-rss-fallback'
        };
      } catch (fallbackError) {
        console.error('Error in RSS fallback:', fallbackError);
        return {
          articles: [],
          source: 'error'
        };
      }
    }
  },
  
  /**
   * Get the latest CoinDesk news articles
   * @param limit Maximum number of articles to return
   * @returns Promise with news articles
   */
  async getLatestNews(limit: number = 5): Promise<Article[]> {
    try {
      const result = await this.fetchCoinDeskNews({ limit });
      return result.articles;
    } catch (error) {
      console.error('Error getting latest CoinDesk news:', error);
      return [];
    }
  }
};