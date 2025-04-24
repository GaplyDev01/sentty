// Follow Supabase Edge Function conventions for imports
import { createClient } from "npm:@supabase/supabase-js@2.39.8";
import { v4 as uuidv4 } from "npm:uuid@11.0.0";

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get CoinDesk API key from environment or settings - use the provided key
const COINDESK_API_KEY = Deno.env.get('COINDESK_API_KEY') || Deno.env.get('VITE_COINDESK_API_KEY') || 'd528326f0bb6201b28c547de4d6a67d5036a02ef35768996a83c700d84b9bcfb';
const COINDESK_API_URL = 'https://data-api.coindesk.com/news/v1/article/list';

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
    
    if (useCache && !options.forceUpdate) {
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
    
    // Get configuration from system settings
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('coindesk_enabled, coindesk_api_key')
      .eq('id', 'aggregation_status')
      .single();
    
    if (settingsError) {
      throw new Error(`Error fetching CoinDesk settings: ${settingsError.message}`);
    }
    
    // Check if CoinDesk is enabled
    if (!settings?.coindesk_enabled && !options.forceUpdate) {
      console.log('CoinDesk integration is disabled');
      
      await createAggregationLog('coindesk_fetch', 'skipped', {
        reason: 'CoinDesk integration is disabled',
        timestamp: new Date().toISOString()
      });
      
      return {
        source: 'none',
        status: 'skipped',
        reason: 'CoinDesk integration is disabled'
      };
    }
    
    // Use API key from settings or environment
    const apiKey = settings?.coindesk_api_key || COINDESK_API_KEY;
    
    // Validate API key
    if (!apiKey) {
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
    
    // Build the URL with query parameters
    const url = new URL(COINDESK_API_URL);
    url.searchParams.append('lang', 'EN'); // English only
    url.searchParams.append('limit', '10'); // 10 articles per request
    
    console.log(`Fetching news from CoinDesk API: ${url.toString()}`);
    
    // Fetch data from CoinDesk API with proper authorization header
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Api-Key ${apiKey}`
      }
    });
    
    console.log(`CoinDesk API response status: ${response.status}`);
    
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
      const errorText = await response.text();
      console.error(`CoinDesk API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`CoinDesk API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`CoinDesk API response received with ${data.Data?.length || 0} articles`);
    
    // Cache the data
    await cacheData(cacheKey, data);
    
    // Process articles if requested
    if (options.processArticles !== false) {
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
    if (!data || !data.Data || !Array.isArray(data.Data)) {
      throw new Error('Invalid CoinDesk API response format');
    }
    
    const articles = data.Data;
    console.log(`Processing ${articles.length} CoinDesk articles`);
    
    // Skip if no articles
    if (!articles.length) {
      console.log('No CoinDesk articles to process');
      return {
        message: 'No CoinDesk articles to process',
        count: 0
      };
    }
    
    // Transform articles for database
    const transformedArticles = articles.map((article: any) => {
      // Skip any invalid articles
      if (!article.TITLE || !article.URL) {
        return null;
      }
      
      // Process categories - use category data
      const category = extractCategories(article);
      
      // Extract tags from categories and keywords
      const tags = extractTags(article);
      
      return {
        id: uuidv4(),
        title: article.TITLE.trim(),
        content: article.BODY || article.SUBTITLE || '',
        source: article.SOURCE_DATA?.NAME || 'CoinDesk',
        url: article.URL,
        image_url: article.IMAGE_URL || null,
        published_at: new Date(article.PUBLISHED_ON * 1000).toISOString(), // Convert Unix timestamp to ISO
        created_at: new Date().toISOString(),
        relevance_score: calculateRelevanceScore(article), // Simple scoring based on sentiment
        category: category,
        tags: tags,
        language: article.LANG || 'en',
        source_id: 'coindesk',
        source_guid: article.GUID || article.URL // Use GUID or URL as a unique identifier
      };
    }).filter(article => article !== null);
    
    console.log(`Transformed ${transformedArticles.length} valid CoinDesk articles`);
    
    if (transformedArticles.length === 0) {
      console.log('No valid CoinDesk articles to process after transformation');
      return {
        message: 'No valid CoinDesk articles to process',
        count: 0
      };
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
      
      // Log success with no new articles
      await createAggregationLog('coindesk_fetch', 'success', {
        message: 'No new CoinDesk articles to add',
        count: 0,
        timestamp: new Date().toISOString()
      });
      
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

// Extract categories from CoinDesk article
function extractCategories(article: any): string {
  // If we have category data, use the first one or a default
  if (article.CATEGORY_DATA && article.CATEGORY_DATA.length > 0) {
    const categoryMap: Record<string, string> = {
      'BTC': 'crypto',
      'ETH': 'crypto',
      'EXCHANGE': 'crypto',
      'MARKET': 'stocks',
      'BUSINESS': 'business',
      'REGULATION': 'crypto',
      'TRADING': 'stocks',
      'TECHNOLOGY': 'technology'
    };
    
    // Get the first category name
    const categoryName = article.CATEGORY_DATA[0].CATEGORY;
    
    // Return mapped category or default to 'crypto'
    return categoryMap[categoryName] || 'crypto';
  }
  
  // Default category
  return 'crypto';
}

// Extract tags from CoinDesk article
function extractTags(article: any): string[] {
  const tags = new Set<string>();
  
  // Add categories as tags
  if (article.CATEGORY_DATA && Array.isArray(article.CATEGORY_DATA)) {
    article.CATEGORY_DATA.forEach((category: any) => {
      if (category.NAME) {
        tags.add(category.NAME.toLowerCase());
      }
    });
  }
  
  // Add keywords as tags
  if (article.KEYWORDS) {
    article.KEYWORDS.split('|').forEach((keyword: string) => {
      const cleaned = keyword.trim().toLowerCase();
      if (cleaned) {
        tags.add(cleaned);
      }
    });
  }
  
  // Add some custom tags based on the title for better categorization
  const titleLower = article.TITLE.toLowerCase();
  const customTags = ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'defi', 'nft', 'web3', 'metaverse'];
  
  customTags.forEach(tag => {
    if (titleLower.includes(tag)) {
      tags.add(tag);
    }
  });
  
  return Array.from(tags);
}

// Calculate a relevance score based on article
function calculateRelevanceScore(article: any): number {
  let score = 50; // Default score
  
  // Adjust based on sentiment if available
  if (article.SENTIMENT) {
    if (article.SENTIMENT === 'POSITIVE') {
      score += 15;
    } else if (article.SENTIMENT === 'NEGATIVE') {
      score -= 10;
    }
  }
  
  // Adjust based on score if available
  if (typeof article.SCORE === 'number') {
    score += article.SCORE * 10;
  }
  
  // Upvotes increase score
  if (article.UPVOTES > 0) {
    score += Math.min(article.UPVOTES * 2, 20);
  }
  
  // Downvotes decrease score
  if (article.DOWNVOTES > 0) {
    score -= Math.min(article.DOWNVOTES * 2, 20);
  }
  
  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, score));
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