import { supabase } from '../lib/supabase';
import type { SystemSettings, AggregationLog } from '../types/newsapi';

/**
 * Service to manage and trigger the news aggregation process
 */
export const aggregationService = {
  /**
   * Manually trigger news aggregation
   * @param options Options for the aggregation process
   * @returns Promise with the aggregation result
   */
  async triggerAggregation(options: {
    forceUpdate?: boolean;
    languages?: string[];
    singleCategory?: boolean;
  } = {}) {
    try {
      // Use the deployed function endpoint
      const { data, error } = await supabase.functions.invoke('aggregate-news', {
        body: options
      });
      
      if (error) {
        console.error('Error from Supabase function:', error);
        throw new Error(error.message || "Error calling the aggregation function");
      }
      
      return data;
    } catch (error) {
      console.error('Error triggering aggregation:', error);
      
      // If this is a Supabase function error with a response, try to extract more details
      if (typeof error === 'object' && error !== null && 'response' in error) {
        try {
          const response = (error as any).response;
          if (typeof response === 'string') {
            const parsed = JSON.parse(response);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          }
        } catch (parseError) {
          // Fall back to the original error if parsing fails
        }
      }
      
      throw error;
    }
  },
  
  /**
   * Manually trigger crypto news aggregation
   * @param options Options for the aggregation process
   * @returns Promise with the aggregation result
   */
  async triggerCryptoAggregation(options: {
    forceUpdate?: boolean;
  } = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-crypto-news', {
        body: options
      });
      
      if (error) {
        console.error('Error from fetch-crypto-news function:', error);
        throw new Error(error.message || "Error calling the crypto news function");
      }
      
      return data;
    } catch (error) {
      console.error('Error triggering crypto aggregation:', error);
      throw error;
    }
  },
  
  /**
   * Manually trigger CoinDesk news aggregation 
   * @param options Options for the aggregation process
   * @returns Promise with the aggregation result
   */
  async triggerCoindeskAggregation(options: {
    forceUpdate?: boolean;
  } = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-coindesk-news', {
        body: options
      });
      
      if (error) {
        console.error('Error from fetch-coindesk-news function:', error);
        throw new Error(error.message || "Error calling the CoinDesk news function");
      }
      
      return data;
    } catch (error) {
      console.error('Error triggering CoinDesk aggregation:', error);
      throw error;
    }
  },

  /**
   * Manually trigger CryptoPanic news aggregation 
   * @param options Options for the aggregation process
   * @returns Promise with the aggregation result
   */
  async triggerCryptoPanicAggregation(options: {
    forceUpdate?: boolean;
    filter?: string;
    currencies?: string[];
  } = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-cryptopanic-news', {
        body: options
      });
      
      if (error) {
        console.error('Error from fetch-cryptopanic-news function:', error);
        throw new Error(error.message || "Error calling the CryptoPanic news function");
      }
      
      return data;
    } catch (error) {
      console.error('Error triggering CryptoPanic aggregation:', error);
      throw error;
    }
  },

  /**
   * Manually trigger FireCrawl news aggregation 
   * @param options Options for the aggregation process
   * @returns Promise with the aggregation result
   */
  async triggerFireCrawlAggregation(options: {
    forceUpdate?: boolean;
  } = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-firecrawl-news', {
        body: options
      });
      
      if (error) {
        console.error('Error from fetch-firecrawl-news function:', error);
        throw new Error(error.message || "Error calling the FireCrawl news function");
      }
      
      return data;
    } catch (error) {
      console.error('Error triggering FireCrawl aggregation:', error);
      throw error;
    }
  },
  
  /**
   * Manually run the scheduled aggregation function
   * This is useful for testing the scheduled function without waiting for the cron job
   * @returns Promise with the scheduled aggregation result
   */
  async triggerScheduledAggregation() {
    try {
      const { data, error } = await supabase.functions.invoke('scheduled-aggregation', {
        body: { manual: true }
      });
      
      if (error) {
        console.error('Error from scheduled-aggregation function:', error);
        throw new Error(error.message || "Error calling the scheduled aggregation function");
      }
      
      return data;
    } catch (error) {
      console.error('Error triggering scheduled aggregation:', error);
      throw error;
    }
  },
  
  /**
   * Create a new crypto crawl job
   * @param options Job creation options
   * @returns Promise with the job creation result
   */
  async createCrawlJob(options: {
    url: string;
    type?: 'rss' | 'html' | 'api';
    site_name?: string;
    site_id?: string;
    add_to_db?: boolean;
    limit?: number;
  }) {
    try {
      const { data, error } = await supabase.functions.invoke('create-crawl-job', {
        body: options
      });
      
      if (error) {
        console.error('Error from create-crawl-job function:', error);
        throw new Error(error.message || "Error calling the create crawl job function");
      }
      
      return data;
    } catch (error) {
      console.error('Error creating crawl job:', error);
      throw error;
    }
  },
  
  /**
   * Create crawl jobs from all configured sites
   * @param options Job creation options
   * @returns Promise with the job creation result
   */
  async createCrawlJobsFromTable(options: {
    siteId?: string;
    maxJobs?: number;
  } = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('create-crawl-jobs-from-table', {
        body: options
      });
      
      if (error) {
        console.error('Error from create-crawl-jobs-from-table function:', error);
        throw new Error(error.message || "Error calling the create crawl jobs function");
      }
      
      return data;
    } catch (error) {
      console.error('Error creating crawl jobs:', error);
      throw error;
    }
  },
  
  /**
   * Run the crypto crawler to create and process jobs
   * @returns Promise with the crawler result
   */
  async runCryptoCrawler() {
    try {
      const { data, error } = await supabase.functions.invoke('supadata-crypto-crawler', {
        body: {}
      });
      
      if (error) {
        console.error('Error from supadata-crypto-crawler function:', error);
        throw new Error(error.message || "Error calling the crypto crawler function");
      }
      
      return data;
    } catch (error) {
      console.error('Error running crypto crawler:', error);
      throw error;
    }
  },
  
  /**
   * Get the latest aggregation status
   * @returns Promise with the aggregation status
   */
  async getAggregationStatus(): Promise<SystemSettings | null> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 'aggregation_status')
        .maybeSingle();
        
      if (error) {
        console.error('Error getting aggregation status:', error);
        // No data found, return default values
        return {
          id: 'aggregation_status',
          last_run: null,
          status: 'never_run',
          articles_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // If no data found, return default values
      if (!data) {
        return {
          id: 'aggregation_status',
          last_run: null,
          status: 'never_run',
          articles_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error getting aggregation status:', error);
      return null;
    }
  },
  
  /**
   * Get aggregation logs with filtering options
   * @param options Filter options for logs query
   * @returns Promise with the aggregation logs
   */
  async getAggregationLogs(options: { 
    limit?: number; 
    status?: 'success' | 'error' | 'running' | 'partial_success' | 'skipped'; 
    type?: string;
    offset?: number;
  } = {}): Promise<AggregationLog[]> {
    try {
      const { 
        limit = 100, 
        status, 
        type,
        offset = 0
      } = options;
      
      let query = supabase
        .from('aggregation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (type) {
        query = query.eq('event_type', type);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching aggregation logs:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAggregationLogs:', error);
      return [];
    }
  },

  /**
   * Create a new aggregation log entry
   * @param log The log entry to create
   * @returns Promise with the created log
   */
  async createAggregationLog(log: Omit<AggregationLog, 'id' | 'created_at'>): Promise<AggregationLog | null> {
    try {
      const { data, error } = await supabase
        .from('aggregation_logs')
        .insert({
          event_type: log.event_type,
          status: log.status,
          details: log.details
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating aggregation log:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createAggregationLog:', error);
      return null;
    }
  },

  /**
   * Get the aggregation schedule
   * @returns Promise with the schedule configuration
   */
  async getSchedule() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 'aggregation_status')
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // No schedule found, return default values
          return {
            id: 'aggregation_status',
            enabled: true,
            frequency: '15min',
            next_scheduled: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting aggregation schedule:', error);
      return null;
    }
  },

  /**
   * Update the aggregation schedule settings
   * @param schedule The schedule configuration
   * @returns Promise with the result
   */
  async updateSchedule(schedule: {
    enabled: boolean,
    frequency: string,
    next_scheduled: string | null
  }) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          id: 'aggregation_status',
          ...schedule,
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      // Create a log entry for this schedule update
      await this.createAggregationLog({
        event_type: 'schedule_update',
        status: 'success',
        details: {
          frequency: schedule.frequency,
          enabled: schedule.enabled,
          next_scheduled: schedule.next_scheduled
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error updating aggregation schedule:', error);
      throw error;
    }
  },
  
  /**
   * Update CoinDesk API settings
   * @param settings CoinDesk API settings
   * @returns Promise with the result
   */
  async updateCoindeskSettings(settings: {
    enabled: boolean;
    api_key?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          coindesk_enabled: settings.enabled,
          coindesk_api_key: settings.api_key,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'aggregation_status')
        .select();
        
      if (error) {
        throw error;
      }
      
      // Create a log entry for this settings update
      await this.createAggregationLog({
        event_type: 'coindesk_settings_update',
        status: 'success',
        details: {
          enabled: settings.enabled
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error updating CoinDesk settings:', error);
      throw error;
    }
  },

  /**
   * Update CryptoPanic API settings
   * @param settings CryptoPanic API settings
   * @returns Promise with the result
   */
  async updateCryptoPanicSettings(settings: {
    enabled: boolean;
    api_key?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          cryptopanic_enabled: settings.enabled,
          cryptopanic_api_key: settings.api_key,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'aggregation_status')
        .select();
        
      if (error) {
        throw error;
      }
      
      // Create a log entry for this settings update
      await this.createAggregationLog({
        event_type: 'cryptopanic_settings_update',
        status: 'success',
        details: {
          enabled: settings.enabled
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error updating CryptoPanic settings:', error);
      throw error;
    }
  },

  /**
   * Update FireCrawl API settings
   * @param settings FireCrawl API settings
   * @returns Promise with the result
   */
  async updateFireCrawlSettings(settings: {
    enabled: boolean;
    api_key?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          firecrawl_enabled: settings.enabled,
          firecrawl_api_key: settings.api_key,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'aggregation_status')
        .select();
        
      if (error) {
        throw error;
      }
      
      // Create a log entry for this settings update
      await this.createAggregationLog({
        event_type: 'firecrawl_settings_update',
        status: 'success',
        details: {
          enabled: settings.enabled
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error updating FireCrawl settings:', error);
      throw error;
    }
  }
};