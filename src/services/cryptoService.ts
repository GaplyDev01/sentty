import { supabase } from '../lib/supabase';
import type { Article } from '../types/newsapi';

/**
 * Service for fetching and managing crypto news from various sources
 */
export const cryptoService = {
  /**
   * Fetch CryptoPanic news from the Supabase edge function
   * @param options Options for the request
   * @returns Promise with news articles
   */
  async fetchCryptoPanicNews(options: {
    limit?: number;
    forceUpdate?: boolean;
    filter?: string;
  } = {}): Promise<{
    articles: Article[];
    source: string;
    message?: string;
  }> {
    try {
      console.log('Fetching CryptoPanic news articles...');
      
      // Call the Supabase Edge Function endpoint
      const { data, error } = await supabase.functions.invoke('fetch-cryptopanic-news', {
        body: {
          limit: options.limit || 10,
          forceUpdate: options.forceUpdate || false,
          filter: options.filter || 'hot',
          processArticles: true
        }
      });
      
      if (error) {
        console.error('Error fetching CryptoPanic news:', error);
        throw error;
      }
      
      // If the response includes processed articles, return them
      if (data && Array.isArray(data.articles)) {
        return {
          articles: data.articles,
          source: 'cryptopanic-api'
        };
      }
      
      // If the response includes a message but no articles
      if (data && data.message) {
        return {
          articles: [],
          source: data.source || 'cryptopanic-api',
          message: data.message
        };
      }
      
      // If we reached this point, the response format is unexpected
      console.warn('Unexpected CryptoPanic API response format:', data);
      return {
        articles: [],
        source: 'cryptopanic-api',
        message: 'Unexpected response format from CryptoPanic API'
      };
    } catch (error) {
      console.error('Error in fetchCryptoPanicNews:', error);
      throw error;
    }
  },
  
  /**
   * Fetch FireCrawl news from the Supabase edge function
   * @param options Options for the request
   * @returns Promise with news articles
   */
  async fetchFireCrawlNews(options: {
    limit?: number;
    forceUpdate?: boolean;
  } = {}): Promise<{
    articles: Article[];
    source: string;
    message?: string;
  }> {
    try {
      console.log('Fetching FireCrawl news articles...');
      
      // Call the Supabase Edge Function endpoint
      const { data, error } = await supabase.functions.invoke('fetch-firecrawl-news', {
        body: {
          limit: options.limit || 10,
          forceUpdate: options.forceUpdate || false,
          processArticles: true
        }
      });
      
      if (error) {
        console.error('Error fetching FireCrawl news:', error);
        throw error;
      }
      
      // Handle response
      if (data && Array.isArray(data.articles)) {
        return {
          articles: data.articles,
          source: 'firecrawl-api'
        };
      }
      
      if (data && data.message) {
        return {
          articles: [],
          source: data.source || 'firecrawl-api',
          message: data.message
        };
      }
      
      console.warn('Unexpected FireCrawl API response format:', data);
      return {
        articles: [],
        source: 'firecrawl-api',
        message: 'Unexpected response format from FireCrawl API'
      };
    } catch (error) {
      console.error('Error in fetchFireCrawlNews:', error);
      throw error;
    }
  },
  
  /**
   * Create a new crypto crawl job
   * @param url URL to crawl
   * @param options Optional parameters
   * @returns Promise with the job result
   */
  async createCrawlJob(url: string, options: {
    type?: 'rss' | 'html' | 'api';
    siteName?: string;
    limit?: number;
  } = {}): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('create-crawl-job', {
        body: {
          url,
          type: options.type || 'rss',
          site_name: options.siteName,
          limit: options.limit || 50
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating crawl job:', error);
      throw error;
    }
  },
  
  /**
   * Create crypto crawl jobs from the table of sources
   * @returns Promise with the result
   */
  async createCrawlJobsFromTable(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('create-crawl-jobs-from-table');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating crawl jobs from table:', error);
      throw error;
    }
  },
  
  /**
   * Run the crypto crawler process
   * @returns Promise with the result
   */
  async runCryptoCrawler(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('supadata-crypto-crawler');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error running crypto crawler:', error);
      throw error;
    }
  }
};