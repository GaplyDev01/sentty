import { supabase } from '../lib/supabase';

/**
 * Service for admin-specific operations
 */
export const adminService = {
  /**
   * Update the crypto integration settings
   * @returns Promise with result
   */
  async enableCryptoIntegrations(): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      // Call the update-crypto-settings Edge Function
      const { data, error } = await supabase.functions.invoke('update-crypto-settings');
      
      if (error) {
        console.error('Error enabling crypto integrations:', error);
        return {
          success: false,
          message: 'Failed to enable crypto integrations',
          error: error.message
        };
      }
      
      return {
        success: true,
        message: data?.message || 'Successfully enabled all crypto integrations'
      };
    } catch (error) {
      console.error('Error in enableCryptoIntegrations:', error);
      return {
        success: false,
        message: 'An error occurred while enabling crypto integrations',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },
  
  /**
   * Manually run the FireCrawl news aggregation
   * @returns Promise with result
   */
  async runFireCrawlAggregation() {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-firecrawl-news', {
        body: { forceUpdate: true }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error running FireCrawl aggregation:', error);
      throw error;
    }
  },
  
  /**
   * Manually run the CryptoPanic news aggregation
   * @returns Promise with result
   */
  async runCryptoPanicAggregation() {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-cryptopanic-news', {
        body: { forceUpdate: true }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error running CryptoPanic aggregation:', error);
      throw error;
    }
  },
  
  /**
   * Manually run the CoinDesk news aggregation
   * @returns Promise with result
   */
  async runCoinDeskAggregation() {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-coindesk-news', {
        body: { forceUpdate: true }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error running CoinDesk aggregation:', error);
      throw error;
    }
  }
};