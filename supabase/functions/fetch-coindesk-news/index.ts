import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get CoinDesk API key from environment
const COINDESK_API_KEY = Deno.env.get('COINDESK_API_KEY') || '';
const COINDESK_API_URL = 'https://api.coindesk.com/v1/news';

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

// Generate a UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Function to check if we should use cache or fetch new data
async function shouldUseCachedData(): Promise<boolean> {
  try {
    // Get the system settings to check when CoinDesk API was last called
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('coindesk_last_run, coindesk_rate_limited')
      .eq('id', 'aggregation_status')
      .single();
      
    if (error) {
      console.error('Error fetching system settings:', error);
      return false;
    }
    
    // If rate limited, check if we should still use cache
    if (settings?.coindesk_rate_limited) {
      // If rate limited, use cache for at least 1 hour
      const lastRun = settings?.coindesk_last_run ? new Date(settings.coindesk_last_run) : null;
      if (lastRun) {
        const now = new Date();
        const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
        
        // If less than 1 hour since last run, use cache
        if (hoursSinceLastRun < 1) {
          console.log(`Rate limited and only ${hoursSinceLastRun.toFixed(2)} hours since last run. Using cache.`);
          return true;
        } else {
          // It's been more than 1 hour, try again
          console.log(`Rate limited but ${hoursSinceLastRun.toFixed(2)} hours since last run. Trying again.`);
          return false;
        }
      }
    }
    
    // If not rate limited, check if we've called the API recently
    if (settings?.coindesk_last_run) {
      const lastRun = new Date(settings.coindesk_last_run);
      const now = new Date();
      const minutesSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60);
      
      // If less than 15 minutes since last run, use cache
      if (minutesSinceLastRun < 15) {
        console.log(`Only ${minutesSinceLastRun.toFixed(2)} minutes since last run. Using cache.`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in shouldUseCachedData:', error);
    return false;
  }
}

// Function to get cached data
async function getCachedData(key: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('coindesk_cache')
      .select('data')
      .eq('key', key)
      .single();
      
    if (error) {
      console.error('Error fetching cached data:', error);
      return null;
    }
    
    return data?.data;
  } catch (error) {
    console.error('Error in getCachedData:', error);
    return null;
  }
}

// Function to cache data
async function cacheData(key: string, data: any): Promise<void> {
  try {
    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Upsert the data into the cache
    const { error } = await supabase
      .from('coindesk_cache')
      .upsert({
        key,
        data,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'key'
      });
      
    if (error) {
      console.error('Error caching data:', error);
    }
  } catch (error) {
    console.error('Error in cacheData:', error);
  }
}

// Function to fetch news from CoinDesk API
async function fetchCoindeskNews(options: any = {}) {
  try {
    // Check if we should use cached data
    const useCache = await shouldUseCachedData();
    const cacheKey = 'coindesk_latest_news';
    
    if (useCache) {
      console.log('Using cached CoinDesk news data');
      const cachedData = await getCachedData(cacheKey);
      
      if (cachedData) {
        return {
          source: 'cache',
          data: cachedData
        };
      }
      
      console.log('No valid cache found, fetching fresh data');
    }
    
    // Validate API key
    if (!COINDESK_API_KEY) {
      throw new Error('CoinDesk API key is not configured');
    }
    
    // Update last run time
    await supabase
      .from('system_settings')
      .update({ 
        coindesk_last_run: new Date().toISOString(),
        coindesk_rate_limited: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'aggregation_status');
    
    // Fetch data from CoinDesk API
    console.log('Fetching news from CoinDesk API');
    const response = await fetch(`${COINDESK_API_URL}/feed?limit=20`, {
      headers: {
        'x-api-key': COINDESK_API_KEY
      }
    });
    
    // Check for rate limiting
    if (response.status === 429) {
      console.warn('CoinDesk API rate limit exceeded');
      
      // Mark as rate limited in system settings
      await supabase
        .from('system_settings')
        .update({ 
          coindesk_rate_limited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'aggregation_status');
        
      // Create log entry for rate limiting
      await createAggregationLog('coindesk_fetch', 'error', {
        error: 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      });
      
      // Try to use cached data as fallback
      const cachedData = await getCachedData(cacheKey);
      if (cachedData) {
        return {
          source: 'cache',
          data: cachedData,
          rate_limited: true
        };
      }
      
      throw new Error('CoinDesk API rate limit exceeded and no cache available');
    }
    
    // Check for other errors
    if (!response.ok) {
      throw new Error(`CoinDesk API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the data
    await cacheData(cacheKey, data);
    
    // Process articles if requested
    if (options.processArticles) {
      await processCoindeskArticles(data);
    }
    
    return {
      source: 'api',
      data
    };
  } catch (error) {
    console.error('Error fetching CoinDesk news:', error);
    
    // Create error log
    await createAggregationLog('coindesk_fetch', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Function to process and store CoinDesk articles
async function processCoindeskArticles(data: any) {
  try {
    if (!data || !data.news || !Array.isArray(data.news)) {
      throw new Error('Invalid CoinDesk API response format');
    }
    
    const articles = data.news;
    console.log(`Processing ${articles.length} CoinDesk articles`);
    
    // Transform articles for database
    const transformedArticles = articles.map(article => {
      // Skip any invalid articles
      if (!article.title || !article.url) {
        return null;
      }
      
      return {
        id: generateUUID(),
        title: article.title.trim(),
        content: article.body || article.description || '',
        source: 'CoinDesk',
        url: article.url,
        image_url: article.cover?.url || null,
        published_at: article.published_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        relevance_score: 50, // Default score
        category: 'crypto', // Default category for CoinDesk
        tags: article.tags?.map((tag: any) => tag.name.toLowerCase()) || [],
        language: 'en', // Assume English for CoinDesk
        source_id: 'coindesk',
        source_guid: article.id || article.url // Use CoinDesk's ID or URL as a unique identifier
      };
    }).filter(article => article !== null);
    
    console.log(`Transformed ${transformedArticles.length} valid CoinDesk articles`);
    
    if (transformedArticles.length === 0) {
      throw new Error('No valid CoinDesk articles to process');
    }
    
    // Check for duplicates in the database
    const sourceGuids = transformedArticles.map(article => article.source_guid);
    
    const { data: existingArticles, error: existingError } = await supabase
      .from('articles')
      .select('source_guid')
      .eq('source_id', 'coindesk')
      .in('source_guid', sourceGuids);
      
    if (existingError) {
      console.error('Error checking for existing CoinDesk articles:', existingError);
      throw existingError;
    }
    
    // Create a Set of existing source_guids for efficient lookup
    const existingGuids = new Set<string>();
    if (existingArticles) {
      existingArticles.forEach(article => {
        if (article.source_guid) {
          existingGuids.add(article.source_guid);
        }
      });
    }
    
    // Filter out already existing articles
    const newArticles = transformedArticles.filter(
      article => !existingGuids.has(article.source_guid)
    );
    
    console.log(`Found ${newArticles.length} new CoinDesk articles to add`);
    
    if (newArticles.length === 0) {
      console.log('No new CoinDesk articles to add');
      return {
        message: 'No new CoinDesk articles to add',
        count: 0
      };
    }
    
    // Insert articles into database
    const { data: insertedArticles, error: insertError } = await supabase
      .from('articles')
      .insert(newArticles)
      .select();
      
    if (insertError) {
      console.error('Error inserting CoinDesk articles:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${insertedArticles?.length || 0} CoinDesk articles`);
    
    // Create log entry for successful insertion
    await createAggregationLog('coindesk_fetch', 'success', {
      count: insertedArticles?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    return {
      message: 'Successfully processed CoinDesk articles',
      count: insertedArticles?.length || 0
    };
  } catch (error) {
    console.error('Error processing CoinDesk articles:', error);
    
    // Create error log
    await createAggregationLog('coindesk_process', 'error', {
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
    // Parse request body for options
    let options = {};
    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const body = await req.json();
        options = body || {};
      }
    } catch (error) {
      console.log('No JSON body or error parsing it:', error);
    }
    
    console.log("Starting CoinDesk news fetch");
    const result = await fetchCoindeskNews(options);
    console.log("CoinDesk news fetch completed");
    
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
    console.error("CoinDesk news fetch failed with error:", error);
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