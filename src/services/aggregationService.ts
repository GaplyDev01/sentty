import { supabase } from '../lib/supabase';
import { SystemSettings, AggregationLog } from '../types/newsapi';

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
    status?: 'success' | 'error' | 'running' | 'partial_success'; 
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
  }
};