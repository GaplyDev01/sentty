// Follow Supabase Edge Function conventions for imports
import { createClient } from "npm:@supabase/supabase-js@2.39.8";
import { v4 as uuidv4 } from "npm:uuid@11.0.0";

// Initialize Supabase client
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
    await supabase
      .from('aggregation_logs')
      .insert({
        event_type: eventType,
        status: status,
        details: details
      });
  } catch (error) {
    console.error('Error creating log entry:', error);
  }
}

// Function to determine the category of an article with enhanced precision
function determineCategory(article: any): string {
  // Simple logic to determine category based on title and content
  const text = `${article.title} ${article.content || ''}`.toLowerCase();
  
  // Define category keywords for more accurate categorization
  const categoryKeywords = {
    'web3': [
      'web3', 'blockchain', 'bitcoin', 'ethereum', 'cryptocurrency', 'crypto', 
      'nft', 'defi', 'smart contract', 'token', 'decentralized', 'ico', 'dao',
      'web 3.0', 'crypto wallet', 'digital ledger', 'mining', 'staking', 'altcoin'
    ],
    'stocks': [
      'stock', 'market', 'investment', 'trading', 'nasdaq', 'dow jones', 'sp500', 'sp 500',
      'bull', 'bear', 'dividend', 'earnings', 'portfolio', 'investor', 'etf', 'ipo'
    ]
  };
  
  // Count keyword matches for each category
  const categoryCounts: Record<string, number> = {
    'web3': 0,
    'stocks': 0,
    'crypto': 0 // Default category
  };
  
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        // Higher weight for exact word match
        if (new RegExp(`\\b${keyword}\\b`, 'i').test(text)) {
          categoryCounts[category] += 2;
        } else {
          // Lower weight for partial match
          categoryCounts[category] += 1;
        }
      }
    });
  });
  
  // Default to crypto for crypto crawl results unless another category has more matches
  if (categoryCounts.stocks > categoryCounts.web3) {
    return 'stocks';
  } else if (categoryCounts.web3 > 0) {
    return 'web3';
  }
  
  return 'crypto';
}

// Extract tags from an article
function extractTags(article: any): string[] {
  const text = `${article.title} ${article.content || ''}`;
  
  // List of common keywords to use as tags
  const keywordsList = [
    'blockchain', 'web3', 'bitcoin', 'ethereum', 'nft', 'defi', 'cryptocurrency',
    'token', 'altcoin', 'mining', 'staking', 'wallet', 'exchange', 'trading',
    'metaverse', 'dao', 'decentralized', 'smart contract', 'ledger', 'crypto'
  ];
  
  const tags = new Set<string>();
  
  // Look for keywords
  keywordsList.forEach(keyword => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      tags.add(keyword.toLowerCase());
    }
  });
  
  return Array.from(tags);
}

// Main function to parse and store crawl results
async function parseCrawlResults(req: Request) {
  // Parse request body for crawl results
  let data: Record<string, any> = {};
  try {
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await req.json();
      data = body || {};
    }
  } catch (error) {
    console.log('No JSON body or error parsing it:', error);
    throw new Error('Invalid data: JSON parsing failed');
  }
  
  // Check if we have valid crawl data
  if (!data.job_id || !data.articles || !Array.isArray(data.articles)) {
    throw new Error('Invalid crawl result data');
  }
  
  // Create a starting log entry
  await createAggregationLog('parse_crawl_results', 'running', {
    started_at: new Date().toISOString(),
    job_id: data.job_id,
    article_count: data.articles.length
  });
  
  try {
    const articlesToInsert = data.articles.map((article: any) => {
      // Determine category
      const category = determineCategory(article);
      
      // Extract tags
      const tags = extractTags(article);
      
      return {
        id: uuidv4(), // Generate UUID for article
        title: article.title,
        content: article.content || "",
        source: article.source || data.site || "Unknown Source",
        url: article.url,
        image_url: article.image_url || null,
        published_at: article.published_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        relevance_score: null,
        category: category,
        tags: tags.length > 0 ? tags : null,
        language: article.language || 'en',
        source_id: article.source_id || data.site_id,
        source_guid: article.source_guid || article.url
      };
    });
    
    if (articlesToInsert.length === 0) {
      console.log('No valid articles to insert');
      
      await createAggregationLog('parse_crawl_results', 'success', {
        message: 'No valid articles to insert',
        job_id: data.job_id,
        count: 0,
        timestamp: new Date().toISOString()
      });
      
      return {
        message: 'No valid articles to insert',
        count: 0
      };
    }
    
    console.log(`Inserting ${articlesToInsert.length} articles from crawl job ${data.job_id}`);
    
    // Check for existing articles to avoid duplicates
    const existingUrls = new Set<string>();
    for (const article of articlesToInsert) {
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('url', article.url)
        .limit(1);
        
      if (existing && existing.length > 0) {
        existingUrls.add(article.url);
      }
    }
    
    // Filter out duplicates
    const newArticles = articlesToInsert.filter(article => !existingUrls.has(article.url));
    
    console.log(`After filtering duplicates, inserting ${newArticles.length} articles`);
    
    if (newArticles.length === 0) {
      await createAggregationLog('parse_crawl_results', 'success', {
        message: 'No new articles to insert - all are duplicates',
        job_id: data.job_id,
        count: 0,
        timestamp: new Date().toISOString()
      });
      
      return {
        message: 'No new articles to insert - all are duplicates',
        count: 0
      };
    }
    
    // Insert articles in batches to avoid payload limits
    const BATCH_SIZE = 20;
    let insertedCount = 0;
    let insertErrors = [];
    
    for (let i = 0; i < newArticles.length; i += BATCH_SIZE) {
      const batch = newArticles.slice(i, i + BATCH_SIZE);
      try {
        const { data: insertedData, error: insertError } = await supabase
          .from('articles')
          .insert(batch)
          .select();
          
        if (insertError) {
          console.error('Error inserting articles batch:', insertError);
          insertErrors.push({
            batch: Math.floor(i / BATCH_SIZE) + 1,
            error: insertError.message
          });
        } else {
          insertedCount += insertedData?.length || 0;
        }
      } catch (error) {
        console.error('Error inserting articles batch:', error);
        insertErrors.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    // Log completion
    await createAggregationLog('parse_crawl_results', 
      insertErrors.length > 0 ? 'partial_success' : 'success', 
      {
        job_id: data.job_id,
        total_articles: data.articles.length,
        new_articles: newArticles.length,
        inserted_articles: insertedCount,
        errors: insertErrors.length > 0 ? insertErrors : null,
        timestamp: new Date().toISOString()
      }
    );
    
    // Return results
    return {
      message: insertErrors.length > 0 
        ? `Partially processed crawl results: ${insertedCount}/${newArticles.length} articles inserted` 
        : 'Successfully processed crawl results',
      job_id: data.job_id,
      total_articles: data.articles.length,
      new_articles: newArticles.length,
      inserted_count: insertedCount,
      errors: insertErrors.length > 0 ? insertErrors : null
    };
  } catch (error) {
    console.error('Error parsing crawl results:', error);
    
    // Log error
    await createAggregationLog('parse_crawl_results', 'error', {
      job_id: data.job_id,
      error: error instanceof Error ? error.message : "Unknown error",
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
    console.log("Starting crawl results parsing");
    const result = await parseCrawlResults(req);
    console.log("Crawl results parsed successfully");
    
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
    console.error("Crawl results parsing failed with error:", error);
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