// Follow Supabase Edge Function conventions for imports
import { createClient } from "npm:@supabase/supabase-js@2.39.8";
import { DOMParser } from "npm:@xmldom/xmldom@0.8.8";
import { v4 as uuidv4 } from "npm:uuid@11.0.0";

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Enhanced delay function with exponential backoff based on retry count
function delay(ms: number, retryCount = 0) {
  // Exponential backoff - increase delay based on retry count
  const backoffFactor = Math.pow(2, retryCount);
  const adjustedDelay = Math.min(ms * backoffFactor, 10000); // Cap at 10 seconds
  return new Promise(resolve => setTimeout(resolve, adjustedDelay));
}

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

// Function to process RSS feed and extract articles
async function processRssFeed(source: any, maxRetries = 2) {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      console.log(`Fetching RSS from ${source.name}: ${source.url}`);
      
      const response = await fetch(source.url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      // Support for different RSS formats
      const items = xmlDoc.getElementsByTagName('item'); // RSS
      const entries = xmlDoc.getElementsByTagName('entry'); // Atom
      
      const articles = [];
      
      // Process RSS items
      for (let i = 0; i < items.length && i < source.limit; i++) {
        const item = items[i];
        
        // Extract data - handle different tag formats
        const title = getElementText(item, 'title');
        let link = getElementText(item, 'link');
        
        // Some RSS feeds have link in different formats
        if (!link) {
          const linkElement = item.getElementsByTagName('link')[0];
          if (linkElement && linkElement.hasAttribute('href')) {
            link = linkElement.getAttribute('href');
          }
        }
        
        // Skip if we don't have title or link
        if (!title || !title.trim() || !link || !link.trim()) {
          continue;
        }
        
        let description = getElementText(item, 'description') || getElementText(item, 'summary');
        const content = getElementText(item, 'content:encoded') || getElementText(item, 'content') || description;
        
        // Get guid for duplicate checking
        const guid = getElementText(item, 'guid') || link;
        
        // Get publication date
        let pubDate = getElementText(item, 'pubDate') || getElementText(item, 'published');
        if (!pubDate) {
          // Try alternate date fields
          pubDate = getElementText(item, 'dc:date') || getElementText(item, 'date');
        }
        
        // Convert date to ISO format
        const publishedDate = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
        
        // Get image URL if available
        let imageUrl = null;
        const enclosure = item.getElementsByTagName('enclosure')[0];
        if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
          imageUrl = enclosure.getAttribute('url');
        }
        
        // Look for media:content
        if (!imageUrl) {
          const mediaContent = item.getElementsByTagName('media:content')[0];
          if (mediaContent && mediaContent.getAttribute('medium') === 'image') {
            imageUrl = mediaContent.getAttribute('url');
          }
        }
        
        // Extract image from content as last resort
        if (!imageUrl && content) {
          const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
          }
        }
        
        // Determine category
        let category = 'crypto'; // Default category
        const categories = item.getElementsByTagName('category');
        if (categories.length > 0) {
          const categoryTexts = [];
          for (let j = 0; j < categories.length; j++) {
            categoryTexts.push(categories[j].textContent);
          }
          // Join multiple categories or use the first one if we're joining
          const categoryText = categoryTexts.join(', ');
          if (categoryText.toLowerCase().includes('bitcoin')) {
            category = 'web3';
          } else if (categoryText.toLowerCase().includes('ethereum')) {
            category = 'web3';
          } else if (categoryText.toLowerCase().includes('blockchain')) {
            category = 'web3';
          }
        }
        
        // Extract tags from categories
        const tags = [];
        for (let j = 0; j < categories.length; j++) {
          const tag = categories[j].textContent?.trim();
          if (tag && tag.length > 2) {
            tags.push(tag.toLowerCase());
          }
        }
        
        // Create the article object
        articles.push({
          title: title.trim(),
          content: content || description || "",
          source: source.name,
          url: link.trim(),
          image_url: imageUrl,
          published_at: publishedDate,
          created_at: new Date().toISOString(),
          relevance_score: null, // Will be calculated later
          category: category,
          tags: tags.length > 0 ? tags : null,
          language: 'en', // Assuming English for crypto news
          source_id: source.id,
          source_guid: guid
        });
      }
      
      // Process Atom entries if no RSS items were found
      if (articles.length === 0 && entries.length > 0) {
        for (let i = 0; i < entries.length && i < source.limit; i++) {
          const entry = entries[i];
          
          // Extract data
          const title = getElementText(entry, 'title');
          
          // Get link from atom:link
          let link = null;
          const links = entry.getElementsByTagName('link');
          for (let j = 0; j < links.length; j++) {
            if (links[j].getAttribute('rel') === 'alternate' || j === 0) {
              link = links[j].getAttribute('href');
              break;
            }
          }
          
          // Skip if essential data is missing
          if (!title || !title.trim() || !link || !link.trim()) {
            continue;
          }
          
          const summary = getElementText(entry, 'summary');
          const content = getElementText(entry, 'content') || summary;
          
          // Get ID as guid
          const guid = getElementText(entry, 'id') || link;
          
          // Get publication date
          let publishedDate = getElementText(entry, 'published') || getElementText(entry, 'updated');
          if (publishedDate) {
            publishedDate = new Date(publishedDate).toISOString();
          } else {
            publishedDate = new Date().toISOString();
          }
          
          // Default category
          const category = 'crypto';
          
          // Add the article
          articles.push({
            title: title.trim(),
            content: content || summary || "",
            source: source.name,
            url: link.trim(),
            image_url: null, // Atom doesn't usually have image enclosures
            published_at: publishedDate,
            created_at: new Date().toISOString(),
            relevance_score: null, // Will be calculated later
            category: category,
            tags: null, // Would need custom parsing for Atom categories
            language: 'en', // Assuming English for crypto news
            source_id: source.id,
            source_guid: guid
          });
        }
      }
      
      console.log(`Extracted ${articles.length} articles from ${source.name}`);
      return articles;
    } catch (error) {
      console.error(`Error processing RSS feed from ${source.name} (attempt ${retries + 1}/${maxRetries + 1}):`, error);
      
      if (retries < maxRetries) {
        retries++;
        await delay(2000, retries); // Wait longer between retries
        continue;
      }
      throw error;
    }
  }
}

// Helper function to get text content from an XML element
function getElementText(parent: Element, tagName: string): string | null {
  const elements = parent.getElementsByTagName(tagName);
  if (elements.length > 0 && elements[0].textContent) {
    return elements[0].textContent.trim();
  }
  return null;
}

// Main function to aggregate crypto news
async function fetchCryptoNews(req: Request) {
  // Parse request body for any options
  let options: Record<string, any> = {};
  try {
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await req.json();
      options = body || {};
    }
  } catch (error) {
    console.log('No JSON body or error parsing it:', error);
  }
  
  const forceUpdate = options.forceUpdate === true;
  
  // Create a starting log entry
  await createAggregationLog('crypto_aggregation', 'running', {
    started_at: new Date().toISOString(),
    message: 'Starting crypto news aggregation process',
    options
  });
  
  try {
    console.log("Starting crypto news aggregation");
    
    // Fetch crypto sources from the database
    const { data: cryptoSources, error: sourcesError } = await supabase
      .from('crypto_crawl_sites')
      .select('*')
      .order('name');
      
    if (sourcesError) {
      throw new Error(`Error fetching crypto sources: ${sourcesError.message}`);
    }
    
    if (!cryptoSources || cryptoSources.length === 0) {
      console.log("No crypto sources configured");
      
      await createAggregationLog('crypto_aggregation', 'success', {
        message: 'No crypto sources configured',
        count: 0,
        timestamp: new Date().toISOString()
      });
      
      return { 
        message: 'No crypto sources configured',
        count: 0
      };
    }
    
    console.log(`Found ${cryptoSources.length} crypto sources to process`);
    
    // Array to store all fetched articles
    let allArticles: any[] = [];
    let errors: any[] = [];
    
    // Process each source
    for (const source of cryptoSources) {
      try {
        console.log(`Processing ${source.name} (${source.type})`);
        
        let articles = [];
        
        // Handle different source types
        if (source.type === 'rss') {
          articles = await processRssFeed(source);
        } else if (source.type === 'api') {
          // This would need implementation specific to each API
          console.log(`API source type not yet implemented for ${source.name}`);
          continue;
        } else if (source.type === 'html') {
          // HTML scraping would need a more complex implementation
          console.log(`HTML source type not yet implemented for ${source.name}`);
          continue;
        }
        
        if (articles && articles.length > 0) {
          allArticles = [...allArticles, ...articles];
        }
      } catch (error) {
        console.error(`Error processing source ${source.name}:`, error);
        errors.push({
          source: source.name,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
      
      // Add delay between processing sources to avoid overloading
      await delay(2000);
    }
    
    console.log(`Total articles fetched from all sources: ${allArticles.length}`);
    
    if (allArticles.length === 0) {
      console.log("No articles were fetched from any source");
      
      await createAggregationLog('crypto_aggregation', 'success', {
        message: 'No articles were fetched from any source',
        errors: errors.length > 0 ? errors : null,
        count: 0,
        timestamp: new Date().toISOString()
      });
      
      return { 
        message: 'No articles were fetched from any source',
        errors: errors.length > 0 ? errors : null,
        count: 0
      };
    }
    
    // Check for duplicates in the fetched articles first (by source_guid)
    const guidMap = new Map<string, boolean>();
    const uniqueArticles = allArticles.filter(article => {
      const key = `${article.source}-${article.source_guid}`;
      if (guidMap.has(key)) {
        return false;
      }
      guidMap.set(key, true);
      return true;
    });
    
    console.log(`Unique articles after deduplication: ${uniqueArticles.length}`);
    
    let newArticles;
    
    // If forceUpdate is true, skip the duplicate check and add all articles
    if (forceUpdate) {
      console.log("Force update enabled - skipping duplicate checks");
      newArticles = uniqueArticles;
    } else {
      // Check for existing articles in the database to avoid duplicates
      console.log("Checking for existing articles in database");
      
      // Create a list of source-guid combinations to check
      const sourceGuidPairs = uniqueArticles.map(article => ({
        source: article.source,
        source_guid: article.source_guid
      }));
      
      // Check for each source-guid pair if it exists
      const existingArticles = new Map<string, boolean>();
      
      for (const pair of sourceGuidPairs) {
        if (!pair.source || !pair.source_guid) continue;
        
        const { data, error } = await supabase
          .from('articles')
          .select('id')
          .eq('source', pair.source)
          .eq('source_guid', pair.source_guid)
          .limit(1);
          
        if (error) {
          console.error('Error checking for existing article:', error);
          continue;
        }
        
        if (data && data.length > 0) {
          const key = `${pair.source}-${pair.source_guid}`;
          existingArticles.set(key, true);
        }
      }
      
      // Filter out articles that already exist
      newArticles = uniqueArticles.filter(article => {
        const key = `${article.source}-${article.source_guid}`;
        return !existingArticles.has(key);
      });
      
      console.log(`New articles to add after filtering duplicates: ${newArticles.length}`);
    }
    
    if (newArticles.length === 0) {
      console.log("No new articles to add - all fetched articles already exist in database");
      
      await createAggregationLog('crypto_aggregation', 'success', {
        message: 'No new articles to add - all articles already exist in database',
        errors: errors.length > 0 ? errors : null,
        count: 0,
        timestamp: new Date().toISOString()
      });
      
      return { 
        message: 'No new articles to add - all fetched articles already exist in database',
        errors: errors.length > 0 ? errors : null,
        count: 0
      };
    }
    
    // Ensure each article has a proper ID
    newArticles = newArticles.map(article => ({
      ...article,
      id: article.id || uuidv4()
    }));
    
    // Insert articles into Supabase in batches
    const BATCH_SIZE = 20; // Smaller batch size for better error handling
    let insertedCount = 0;
    let insertErrors = [];
    
    for (let i = 0; i < newArticles.length; i += BATCH_SIZE) {
      const batch = newArticles.slice(i, i + BATCH_SIZE);
      try {
        console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(newArticles.length / BATCH_SIZE)}`);
        const { data, error } = await supabase
          .from('articles')
          .insert(batch)
          .select();
          
        if (error) {
          console.error(`Error inserting batch:`, error);
          insertErrors.push({
            batch: Math.floor(i / BATCH_SIZE) + 1,
            error: error.message
          });
        } else {
          insertedCount += data?.length || 0;
          console.log(`Successfully inserted ${data?.length || 0} articles in this batch`);
        }
        
        // Small delay between batches
        await delay(500);
      } catch (error) {
        console.error(`Exception in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        insertErrors.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    console.log(`Completed inserting ${insertedCount} out of ${newArticles.length} articles`);
    
    // Create log entry with stats
    const sourceStats: Record<string, number> = {};
    
    newArticles.forEach(article => {
      sourceStats[article.source] = (sourceStats[article.source] || 0) + 1;
    });
    
    await createAggregationLog('crypto_aggregation', 
      insertErrors.length > 0 ? 'partial_success' : 'success', 
      {
        count: insertedCount,
        sources: sourceStats,
        errors: insertErrors.length > 0 ? insertErrors : null,
        timestamp: new Date().toISOString()
      }
    );
    
    return { 
      message: insertErrors.length > 0 
        ? `Crypto news aggregation completed with some errors: ${insertedCount} articles inserted, ${insertErrors.length} errors` 
        : 'Crypto news aggregation completed successfully',
      count: insertedCount,
      sources: sourceStats,
      errors: insertErrors.length > 0 ? insertErrors : null
    };
  } catch (error) {
    console.error('Error in fetchCryptoNews:', error);
    
    // Create error log entry
    await createAggregationLog('crypto_aggregation', 'error', {
      error: error instanceof Error ? error.message : "An unknown error occurred",
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
    console.log("Starting crypto news aggregation process");
    const result = await fetchCryptoNews(req);
    console.log("Crypto news aggregation completed successfully");
    
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
    console.error("Crypto news aggregation failed with error:", error);
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