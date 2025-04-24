// Follow Supabase Edge Function conventions for imports
import { createClient } from "npm:@supabase/supabase-js@2.39.8";
import { v4 as uuidv4 } from "npm:uuid@11.0.0";
// Import zod for schema validation
import { z } from "npm:zod@3.22.4";

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get FireCrawl API key from environment
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-828bccc4148b4ec0ab4df0eeb4190bf3';
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/extract';

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

// Define the schema for validation
const newsSchema = z.object({
  news_stories: z.array(z.object({
    title: z.string(),
    content: z.string(),
    published_date: z.string(),
    source: z.string().optional(),
    url: z.string().optional()
  }))
});

// Function to check if we should use cache or fetch new data
async function shouldUseCachedData(): Promise<boolean> {
  try {
    // Get the system settings to check when FireCrawl API was last called
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('firecrawl_last_run, firecrawl_rate_limited')
      .eq('id', 'aggregation_status')
      .single();
      
    if (error) {
      console.error('Error fetching system settings:', error);
      return false;
    }
    
    // If rate limited, check if we should still use cache
    if (settings?.firecrawl_rate_limited) {
      // If rate limited, use cache for at least 1 hour
      const lastRun = settings?.firecrawl_last_run ? new Date(settings.firecrawl_last_run) : null;
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
    if (settings?.firecrawl_last_run) {
      const lastRun = new Date(settings.firecrawl_last_run);
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
      .from('firecrawl_cache')
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
      .from('firecrawl_cache')
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

// Function to fetch news from FireCrawl API
async function fetchFireCrawlNews(options: any = {}) {
  try {
    // Check if we should use cached data
    const useCache = await shouldUseCachedData();
    const cacheKey = 'firecrawl_latest_news';
    
    if (useCache && !options.forceUpdate) {
      console.log('Using cached FireCrawl news data');
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
      .select('firecrawl_enabled, firecrawl_api_key')
      .eq('id', 'aggregation_status')
      .single();
    
    if (settingsError) {
      throw new Error(`Error fetching FireCrawl settings: ${settingsError.message}`);
    }
    
    // Check if FireCrawl is enabled
    if (!settings?.firecrawl_enabled && !options.forceUpdate) {
      console.log('FireCrawl integration is disabled');
      
      await createAggregationLog('firecrawl_fetch', 'skipped', {
        reason: 'FireCrawl integration is disabled',
        timestamp: new Date().toISOString()
      });
      
      return {
        source: 'none',
        status: 'skipped',
        reason: 'FireCrawl integration is disabled'
      };
    }
    
    // Use API key from settings or environment
    const apiKey = settings?.firecrawl_api_key || FIRECRAWL_API_KEY;
    
    // Validate API key
    if (!apiKey) {
      throw new Error('FireCrawl API key is not configured');
    }
    
    // Update last run time
    await supabase
      .from('system_settings')
      .update({ 
        firecrawl_last_run: new Date().toISOString(),
        firecrawl_rate_limited: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'aggregation_status');

    // Define the URLs to crawl
    const urls = [
      "https://news.treeofalpha.com/*",  
      "https://tradingview.com/news-flow/*",  
      "https://tradingview.com/markets/cryptocurrencies/prices-defi",  
      "https://tradingview.com/markets/cryptocurrencies/prices-losers",  
      "https://tradingview.com/markets/cryptocurrencies/prices-gainers"
    ];
    
    // Define the request payload
    const payload = {
      apiKey,
      urls,
      prompt: "Extract the latest news stories for Bitcoin, Solana, Ethereum, TON, and XRP. Also, gather data on trending tokens including their market cap, volume, liquidity, and percentage change over 5 minutes, 1 hour, and 24 hours.",
      schema: newsSchema.shape
    };
    
    // Fetch data from FireCrawl API
    console.log(`Fetching news from FireCrawl API with ${urls.length} URLs`);
    const response = await fetch(FIRECRAWL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Check for rate limiting
    if (response.status === 429) {
      console.warn('FireCrawl API rate limit exceeded');
      
      // Mark as rate limited in system settings
      await supabase
        .from('system_settings')
        .update({ 
          firecrawl_rate_limited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'aggregation_status');
        
      // Create log entry for rate limiting
      await createAggregationLog('firecrawl_fetch', 'error', {
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
      
      throw new Error('FireCrawl API rate limit exceeded and no cache available');
    }
    
    // Check for other errors
    if (!response.ok) {
      throw new Error(`FireCrawl API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the data
    await cacheData(cacheKey, data);
    
    // Process articles if requested
    if (options.processArticles !== false) {
      await processFireCrawlArticles(data);
    }
    
    return {
      source: 'api',
      data
    };
  } catch (error) {
    console.error('Error fetching FireCrawl news:', error);
    
    // Create error log
    await createAggregationLog('firecrawl_fetch', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Function to process and store FireCrawl articles
async function processFireCrawlArticles(data: any) {
  try {
    // Parse the data to make sure it matches our schema
    const validatedData = newsSchema.parse(data);
    const articles = validatedData.news_stories;
    
    console.log(`Processing ${articles.length} FireCrawl articles`);
    
    if (!articles || articles.length === 0) {
      console.log('No FireCrawl articles to process');
      
      // Log success with no articles
      await createAggregationLog('firecrawl_fetch', 'success', {
        message: 'No FireCrawl articles to process',
        count: 0,
        timestamp: new Date().toISOString()
      });
      
      return {
        message: 'No FireCrawl articles to process',
        count: 0
      };
    }
    
    // Transform articles for database
    const transformedArticles = articles.map(article => {
      // Skip any invalid articles
      if (!article.title || !article.content) {
        return null;
      }
      
      // Try to parse the published date
      let publishedDate;
      try {
        publishedDate = new Date(article.published_date).toISOString();
      } catch (e) {
        publishedDate = new Date().toISOString();
      }
      
      // Determine source
      const source = article.source || 'FireCrawl';
      
      // Determine category based on content
      let category = 'crypto';
      if (article.content.toLowerCase().includes('bitcoin') || article.title.toLowerCase().includes('bitcoin')) {
        category = 'crypto';
      } else if (article.content.toLowerCase().includes('ethereum') || article.title.toLowerCase().includes('ethereum')) {
        category = 'web3';
      } else if (article.content.toLowerCase().includes('market') || article.title.toLowerCase().includes('market')) {
        category = 'stocks';
      }
      
      // Extract tags from content
      const tags = extractTags(article);
      
      return {
        id: uuidv4(),
        title: article.title.trim(),
        content: article.content,
        source: source,
        url: article.url || `https://firecrawl.dev/article/${uuidv4()}`,
        image_url: null, // FireCrawl doesn't provide images
        published_at: publishedDate,
        created_at: new Date().toISOString(),
        relevance_score: 60, // Default medium-high relevance
        category: category,
        tags: tags,
        language: 'en',
        source_id: 'firecrawl',
        source_guid: article.url || article.title // Use URL or title as a unique identifier
      };
    }).filter(article => article !== null);
    
    console.log(`Transformed ${transformedArticles.length} valid FireCrawl articles`);
    
    if (transformedArticles.length === 0) {
      throw new Error('No valid FireCrawl articles to process after transformation');
    }
    
    // Check for duplicates in the database
    const sourceGuids = transformedArticles.map(article => article.source_guid);
    
    const { data: existingArticles, error: existingError } = await supabase
      .from('articles')
      .select('source_guid')
      .eq('source_id', 'firecrawl')
      .in('source_guid', sourceGuids);
      
    if (existingError) {
      console.error('Error checking for existing FireCrawl articles:', existingError);
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
    
    console.log(`Found ${newArticles.length} new FireCrawl articles to add`);
    
    if (newArticles.length === 0) {
      console.log('No new FireCrawl articles to add');
      
      // Log success with no new articles
      await createAggregationLog('firecrawl_fetch', 'success', {
        message: 'No new FireCrawl articles to add',
        count: 0,
        timestamp: new Date().toISOString()
      });
      
      return {
        message: 'No new FireCrawl articles to add',
        count: 0
      };
    }
    
    // Insert articles into database
    const { data: insertedArticles, error: insertError } = await supabase
      .from('articles')
      .insert(newArticles)
      .select();
      
    if (insertError) {
      console.error('Error inserting FireCrawl articles:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${insertedArticles?.length || 0} FireCrawl articles`);
    
    // Create log entry for successful insertion
    await createAggregationLog('firecrawl_fetch', 'success', {
      count: insertedArticles?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    return {
      message: 'Successfully processed FireCrawl articles',
      count: insertedArticles?.length || 0
    };
  } catch (error) {
    console.error('Error processing FireCrawl articles:', error);
    
    // Create error log
    await createAggregationLog('firecrawl_process', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Function to extract tags from article content and title
function extractTags(article: any): string[] {
  const tags = new Set<string>();
  
  // List of common keywords to extract as tags
  const keywords = [
    'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 
    'xrp', 'ripple', 'ton', 'defi', 'nft', 'crypto',
    'blockchain', 'token', 'market', 'trading', 'price',
    'bullish', 'bearish', 'altcoin'
  ];
  
  // Extract keywords from title and content
  const text = `${article.title} ${article.content}`.toLowerCase();
  
  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.add(keyword);
    }
  });
  
  // Extract cryptocurrency symbols (assumed to be uppercase 2-5 letter words)
  const symbolRegex = /\b[A-Z]{2,5}\b/g;
  const symbols = article.title.match(symbolRegex) || [];
  
  symbols.forEach((symbol: string) => {
    if (!['USD', 'EUR', 'GBP', 'JPY', 'THE', 'AND', 'FOR'].includes(symbol)) {
      tags.add(symbol.toLowerCase());
    }
  });
  
  return Array.from(tags);
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
    
    console.log("Starting FireCrawl news fetch");
    const result = await fetchFireCrawlNews(options);
    console.log("FireCrawl news fetch completed");
    
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
    console.error("FireCrawl news fetch failed with error:", error);
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