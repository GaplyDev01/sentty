import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Helper function to create a log entry
async function createAggregationLog(eventType: string, status: string, details: any) {
  try {
    const { error } = await supabase
      .from('aggregation_logs')
      .insert({
        event_type: eventType,
        status: status,
        details: details
      });
      
    if (error) {
      console.error('Error creating log entry:', error);
    }
  } catch (error) {
    console.error('Error in createAggregationLog:', error);
  }
}

// Function to calculate the next scheduled run time
function calculateNextRun(frequency: string): string {
  const now = new Date();
  
  switch (frequency) {
    case '15min':
      now.setMinutes(now.getMinutes() + 15);
      break;
    case '30min':
      now.setMinutes(now.getMinutes() + 30);
      break;
    case '1hour':
      now.setHours(now.getHours() + 1);
      break;
    case '3hours':
      now.setHours(now.getHours() + 3);
      break;
    case '6hours':
      now.setHours(now.getHours() + 6);
      break;
    case '12hours':
      now.setHours(now.getHours() + 12);
      break;
    case '24hours':
      now.setHours(now.getHours() + 24);
      break;
    default:
      now.setMinutes(now.getMinutes() + 15); // Default to 15 minutes
  }
  
  return now.toISOString();
}

// Main function to check and trigger scheduled aggregation
async function checkAndTriggerAggregation() {
  try {
    // Get the current aggregation status
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'aggregation_status')
      .single();
      
    if (settingsError) {
      console.error('Error fetching aggregation status:', settingsError);
      throw settingsError;
    }
    
    // If scheduling is disabled, just update the next scheduled time and exit
    if (!settings.enabled) {
      console.log('Scheduled aggregation is disabled');
      
      // Update the next scheduled time anyway to keep the schedule consistent
      await supabase
        .from('system_settings')
        .update({ 
          next_scheduled: calculateNextRun(settings.frequency || '15min'),
          updated_at: new Date().toISOString()
        })
        .eq('id', 'aggregation_status');
        
      return {
        message: 'Scheduled aggregation is disabled',
        next_scheduled: calculateNextRun(settings.frequency || '15min')
      };
    }
    
    // Check if it's time to run the aggregation
    const now = new Date();
    const nextScheduled = settings.next_scheduled ? new Date(settings.next_scheduled) : null;
    
    if (!nextScheduled || now >= nextScheduled) {
      console.log('Time to run scheduled aggregation');
      
      // Create a log entry for the scheduled run
      await createAggregationLog('scheduled_aggregation', 'running', {
        message: 'Starting scheduled aggregation',
        timestamp: now.toISOString()
      });
      
      // Track results for each part of the aggregation
      let generalNewsCount = 0;
      let cryptoNewsCount = 0;
      let cryptoPanicNewsCount = 0;
      let fireCrawlNewsCount = 0;
      let errors = [];
      
      // 1. Call the aggregate-news function for general news
      try {
        console.log('Running general news aggregation');
        const { data: generalResult, error: generalError } = await supabase.functions.invoke('aggregate-news', {
          body: { 
            singleCategory: true, // Use single category mode to avoid rate limiting
            scheduled: true
          }
        });
        
        if (generalError) {
          console.error('Error calling aggregate-news function:', generalError);
          errors.push({
            source: 'general',
            error: generalError.message || 'Unknown error'
          });
        } else {
          generalNewsCount = generalResult.count || 0;
          console.log(`Added ${generalNewsCount} general news articles`);
        }
      } catch (error) {
        console.error('Exception in general news aggregation:', error);
        errors.push({
          source: 'general',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 2. Call the fetch-crypto-news function for crypto news
      try {
        console.log('Running crypto news aggregation');
        const { data: cryptoResult, error: cryptoError } = await supabase.functions.invoke('fetch-crypto-news', {
          body: { scheduled: true }
        });
        
        if (cryptoError) {
          console.error('Error calling fetch-crypto-news function:', cryptoError);
          errors.push({
            source: 'crypto',
            error: cryptoError.message || 'Unknown error'
          });
        } else {
          cryptoNewsCount = cryptoResult.count || 0;
          console.log(`Added ${cryptoNewsCount} crypto news articles`);
        }
      } catch (error) {
        console.error('Exception in crypto news aggregation:', error);
        errors.push({
          source: 'crypto',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 3. Call the fetch-cryptopanic-news function for CryptoPanic news
      try {
        console.log('Running CryptoPanic news aggregation');
        const { data: cryptoPanicResult, error: cryptoPanicError } = await supabase.functions.invoke('fetch-cryptopanic-news', {
          body: { scheduled: true }
        });
        
        if (cryptoPanicError) {
          console.error('Error calling fetch-cryptopanic-news function:', cryptoPanicError);
          errors.push({
            source: 'cryptopanic',
            error: cryptoPanicError.message || 'Unknown error'
          });
        } else {
          cryptoPanicNewsCount = cryptoPanicResult.count || 0;
          console.log(`Added ${cryptoPanicNewsCount} CryptoPanic news articles`);
        }
      } catch (error) {
        console.error('Exception in CryptoPanic news aggregation:', error);
        errors.push({
          source: 'cryptopanic',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 4. Call the fetch-firecrawl-news function for FireCrawl news
      try {
        console.log('Running FireCrawl news aggregation');
        const { data: fireCrawlResult, error: fireCrawlError } = await supabase.functions.invoke('fetch-firecrawl-news', {
          body: { scheduled: true }
        });
        
        if (fireCrawlError) {
          console.error('Error calling fetch-firecrawl-news function:', fireCrawlError);
          errors.push({
            source: 'firecrawl',
            error: fireCrawlError.message || 'Unknown error'
          });
        } else {
          fireCrawlNewsCount = fireCrawlResult.count || 0;
          console.log(`Added ${fireCrawlNewsCount} FireCrawl news articles`);
        }
      } catch (error) {
        console.error('Exception in FireCrawl news aggregation:', error);
        errors.push({
          source: 'firecrawl',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Create success log entry
      await createAggregationLog('scheduled_aggregation', errors.length > 0 ? 'partial_success' : 'success', {
        generalNewsCount,
        cryptoNewsCount,
        cryptoPanicNewsCount,
        fireCrawlNewsCount,
        totalCount: generalNewsCount + cryptoNewsCount + cryptoPanicNewsCount + fireCrawlNewsCount,
        errors: errors.length > 0 ? errors : null,
        timestamp: new Date().toISOString()
      });
      
      // Update the next scheduled time
      await supabase
        .from('system_settings')
        .update({ 
          next_scheduled: calculateNextRun(settings.frequency || '15min'),
          updated_at: new Date().toISOString()
        })
        .eq('id', 'aggregation_status');
        
      return {
        message: 'Scheduled aggregation completed successfully',
        generalNewsCount,
        cryptoNewsCount,
        cryptoPanicNewsCount,
        fireCrawlNewsCount,
        totalCount: generalNewsCount + cryptoNewsCount + cryptoPanicNewsCount + fireCrawlNewsCount,
        errors: errors.length > 0 ? errors : null,
        next_scheduled: calculateNextRun(settings.frequency || '15min')
      };
    } else {
      console.log('Not time for scheduled aggregation yet');
      return {
        status: 'skipped',
        reason: 'Not time for scheduled aggregation yet',
        message: 'Not time for scheduled aggregation yet',
        current_time: now.toISOString(),
        next_scheduled: nextScheduled.toISOString()
      };
    }
  } catch (error) {
    console.error('Error in checkAndTriggerAggregation:', error);
    
    // Create error log entry
    await createAggregationLog('scheduled_aggregation', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Handler for the Edge Function
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log("Starting scheduled aggregation check");
    const result = await checkAndTriggerAggregation();
    console.log("Scheduled aggregation check completed");
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  } catch (error) {
    console.error("Scheduled aggregation check failed with error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unknown error occurred",
        timestamp: new Date().toISOString()  
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});