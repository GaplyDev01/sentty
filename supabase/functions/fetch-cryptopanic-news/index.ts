// Follow Supabase Edge Function conventions for imports
import { createClient } from "npm:@supabase/supabase-js@2.39.8";
import { v4 as uuidv4 } from "npm:uuid@11.0.0";

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get CryptoPanic API key from environment
const CRYPTOPANIC_API_KEY = Deno.env.get('CRYPTOPANIC_API_KEY') || '';
const CRYPTOPANIC_API_URL = 'https://cryptopanic.com/api/v1/posts/';

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

// Function to check if we should use cache or fetch new data
async function shouldUseCachedData(): Promise<boolean> {
  try {
    // Get the system settings to check when CryptoPanic API was last called
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('cryptopanic_last_run, cryptopanic_rate_limited')
      .eq('id', 'aggregation_status')
      .single();
      
    if (error) {
      console.error('Error fetching system settings:', error);
      return false;
    }
    
    // If rate limited, check if we should still use cache
    if (settings?.cryptopanic_rate_limited) {
      // If rate limited, use cache for at least 1 hour
      const lastRun = settings?.cryptopanic_last_run ? new Date(settings.cryptopanic_last_run) : null;
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
    if (settings?.cryptopanic_last_run) {
      const lastRun = new Date(settings.cryptopanic_last_run);
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
      .from('cryptopanic_cache')
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
      .from('cryptopanic_cache')
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

// Function to fetch news from CryptoPanic API
async function fetchCryptoPanicNews(options: any = {}) {
  try {
    // Check if we should use cached data
    const useCache = await shouldUseCachedData();
    const cacheKey = 'cryptopanic_latest_news';
    
    if (useCache && !options.forceUpdate) {
      console.log('Using cached CryptoPanic news data');
      const cachedData = await getCachedData(cacheKey);
      
      if (cachedData) {
        return {
          source: 'cache',
          data: cachedData
        };
      }
      
      console.log('No valid cache found, fetching fresh data');
    }
    
    // Get configuration from system settings
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('cryptopanic_enabled, cryptopanic_api_key')
      .eq('id', 'aggregation_status')
      .single();
    
    if (settingsError) {
      throw new Error(`Error fetching CryptoPanic settings: ${settingsError.message}`);
    }
    
    // Check if CryptoPanic is enabled
    if (!settings?.cryptopanic_enabled && !options.forceUpdate) {
      console.log('CryptoPanic integration is disabled');
      
      await createAggregationLog('cryptopanic_fetch', 'skipped', {
        reason: 'CryptoPanic integration is disabled',
        timestamp: new Date().toISOString()
      });
      
      return {
        source: 'none',
        status: 'skipped',
        reason: 'CryptoPanic integration is disabled'
      };
    }
    
    // Use API key from settings or environment
    const apiKey = settings?.cryptopanic_api_key || CRYPTOPANIC_API_KEY;
    
    // Validate API key
    if (!apiKey) {
      throw new Error('CryptoPanic API key is not configured');
    }
    
    // Update last run time
    await supabase
      .from('system_settings')
      .update({ 
        cryptopanic_last_run: new Date().toISOString(),
        cryptopanic_rate_limited: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'aggregation_status');
    
    // Build API URL with parameters
    let apiUrl = CRYPTOPANIC_API_URL;
    const params = new URLSearchParams();
    
    // Add auth token
    params.append('auth_token', apiKey);
    
    // Add filtering options
    params.append('public', 'true'); // Use public posts
    
    // Add filter type (rising, hot, etc.)
    if (options.filter && ['rising', 'hot', 'bullish', 'bearish', 'important'].includes(options.filter)) {
      params.append('filter', options.filter);
    } else {
      params.append('filter', 'rising'); // Default to rising
    }
    
    // Add currencies filter if provided
    if (options.currencies && options.currencies.length > 0) {
      params.append('currencies', options.currencies.join(','));
    }
    
    // Add regions filter (default to English)
    params.append('regions', options.regions || 'en');
    
    // Add kind filter (news or media)
    params.append('kind', options.kind || 'news');
    
    // Fetch data from CryptoPanic API
    console.log(`Fetching news from CryptoPanic API: ${apiUrl}?${params.toString()}`);
    const response = await fetch(`${apiUrl}?${params.toString()}`);
    
    // Check for rate limiting
    if (response.status === 429) {
      console.warn('CryptoPanic API rate limit exceeded');
      
      // Mark as rate limited in system settings
      await supabase
        .from('system_settings')
        .update({ 
          cryptopanic_rate_limited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'aggregation_status');
        
      // Create log entry for rate limiting
      await createAggregationLog('cryptopanic_fetch', 'error', {
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
      
      throw new Error('CryptoPanic API rate limit exceeded and no cache available');
    }
    
    // Check for other errors
    if (!response.ok) {
      throw new Error(`CryptoPanic API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the data
    await cacheData(cacheKey, data);
    
    // Process articles if requested
    if (options.processArticles !== false) {
      await processCryptoPanicArticles(data);
    }
    
    return {
      source: 'api',
      data
    };
  } catch (error) {
    console.error('Error fetching CryptoPanic news:', error);
    
    // Create error log
    await createAggregationLog('cryptopanic_fetch', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Function to determine the category of an article
function determineCategory(article: any): string {
  // Simple logic to determine category based on currencies and title
  const currencies = article.currencies || [];
  const title = article.title || '';
  const titleLower = title.toLowerCase();
  
  // Check for specific categories based on title keywords
  if (titleLower.includes('nft') || titleLower.includes('non-fungible') || titleLower.includes('collectible')) {
    return 'web3';
  }
  
  if (titleLower.includes('defi') || titleLower.includes('decentralized finance')) {
    return 'web3';
  }
  
  if (titleLower.includes('regulation') || titleLower.includes('sec') || titleLower.includes('law')) {
    return 'crypto';
  }
  
  if (titleLower.includes('mining') || titleLower.includes('miner') || titleLower.includes('hash rate')) {
    return 'crypto';
  }
  
  if (titleLower.includes('trading') || titleLower.includes('price') || titleLower.includes('market')) {
    return 'stocks';
  }
  
  // Default to crypto
  return 'crypto';
}

// Function to extract tags from currencies and title
function extractTags(article: any): string[] {
  const tags = new Set<string>();
  
  // Add currencies as tags
  if (article.currencies && Array.isArray(article.currencies)) {
    article.currencies.forEach((currency: any) => {
      if (currency && currency.code) {
        tags.add(currency.code.toLowerCase());
      }
    });
  }
  
  // Extract keywords from title
  const title = article.title || '';
  const keywords = [
    'bitcoin', 'ethereum', 'crypto', 'blockchain', 'token', 'wallet', 'exchange',
    'mining', 'defi', 'nft', 'altcoin', 'staking', 'regulation', 'trading'
  ];
  
  keywords.forEach(keyword => {
    if (title.toLowerCase().includes(keyword)) {
      tags.add(keyword);
    }
  });
  
  return Array.from(tags);
}

// Function to process and store CryptoPanic articles
async function processCryptoPanicArticles(data: any) {
  try {
    if (!data || !data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid CryptoPanic API response format');
    }
    
    const articles = data.results;
    console.log(`Processing ${articles.length} CryptoPanic articles`);
    
    // Transform articles for database
    const transformedArticles = articles.map(article => {
      // Skip any invalid articles
      if (!article.title || !article.url) {
        return null;
      }
      
      const category = determineCategory(article);
      const tags = extractTags(article);
      
      return {
        id: uuidv4(),
        title: article.title.trim(),
        content: article.description || article.title,
        source: article.source.domain || 'CryptoPanic',
        url: article.url,
        image_url: article.metadata?.image || null,
        published_at: article.published_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        relevance_score: article.votes?.negative ? 30 : (article.votes?.positive ? 70 : 50),
        category: category,
        tags: tags,
        language: article.language || 'en',
        source_id: 'cryptopanic',
        source_guid: article.id || article.url // Use CryptoPanic's ID as a unique identifier
      };
    }).filter(article => article !== null);
    
    console.log(`Transformed ${transformedArticles.length} valid CryptoPanic articles`);
    
    if (transformedArticles.length === 0) {
      throw new Error('No valid CryptoPanic articles to process');
    }
    
    // Check for duplicates in the database
    const sourceGuids = transformedArticles.map(article => article.source_guid);
    
    const { data: existingArticles, error: existingError } = await supabase
      .from('articles')
      .select('source_guid')
      .eq('source_id', 'cryptopanic')
      .in('source_guid', sourceGuids);
      
    if (existingError) {
      console.error('Error checking for existing CryptoPanic articles:', existingError);
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
    
    console.log(`Found ${newArticles.length} new CryptoPanic articles to add`);
    
    if (newArticles.length === 0) {
      console.log('No new CryptoPanic articles to add');
      
      // Log success with no new articles
      await createAggregationLog('cryptopanic_fetch', 'success', {
        message: 'No new CryptoPanic articles to add',
        count: 0,
        timestamp: new Date().toISOString()
      });
      
      return {
        message: 'No new CryptoPanic articles to add',
        count: 0
      };
    }
    
    // Insert articles into database
    const { data: insertedArticles, error: insertError } = await supabase
      .from('articles')
      .insert(newArticles)
      .select();
      
    if (insertError) {
      console.error('Error inserting CryptoPanic articles:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${insertedArticles?.length || 0} CryptoPanic articles`);
    
    // Create log entry for successful insertion
    await createAggregationLog('cryptopanic_fetch', 'success', {
      count: insertedArticles?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    return {
      message: 'Successfully processed CryptoPanic articles',
      count: insertedArticles?.length || 0
    };
  } catch (error) {
    console.error('Error processing CryptoPanic articles:', error);
    
    // Create error log
    await createAggregationLog('cryptopanic_process', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Handler for the Edge Function
Deno.serve(async (req) => {
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
    
    console.log("Starting CryptoPanic news fetch");
    const result = await fetchCryptoPanicNews(options);
    console.log("CryptoPanic news fetch completed");
    
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
    console.error("CryptoPanic news fetch failed with error:", error);
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