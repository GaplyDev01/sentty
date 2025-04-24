import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";
import { DOMParser } from "npm:linkedom@0.16.8";

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Generate a UUID
function generateUUID() {
  return crypto.randomUUID();
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

// Function to extract article data from HTML
function extractArticleData(html: string, baseUrl: string): any[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const articles = [];
    
    // Different selectors for different sites
    if (baseUrl.includes('coindesk.com')) {
      // CoinDesk specific selectors
      const articleElements = doc.querySelectorAll('article');
      
      for (const article of articleElements) {
        const titleElement = article.querySelector('h4, h3, h2');
        const linkElement = article.querySelector('a');
        const imageElement = article.querySelector('img');
        const descriptionElement = article.querySelector('p');
        
        if (titleElement && linkElement) {
          const title = titleElement.textContent.trim();
          let url = linkElement.getAttribute('href');
          
          // Make sure URL is absolute
          if (url && !url.startsWith('http')) {
            url = new URL(url, baseUrl).toString();
          }
          
          const imageUrl = imageElement ? imageElement.getAttribute('src') : null;
          const description = descriptionElement ? descriptionElement.textContent.trim() : '';
          
          articles.push({
            title,
            url,
            image_url: imageUrl,
            description,
            source: 'CoinDesk'
          });
        }
      }
    } else if (baseUrl.includes('cointelegraph.com')) {
      // Cointelegraph specific selectors
      const articleElements = doc.querySelectorAll('.post-card');
      
      for (const article of articleElements) {
        const titleElement = article.querySelector('.post-card__title');
        const linkElement = article.querySelector('a');
        const imageElement = article.querySelector('img');
        const descriptionElement = article.querySelector('.post-card__description');
        
        if (titleElement && linkElement) {
          const title = titleElement.textContent.trim();
          let url = linkElement.getAttribute('href');
          
          // Make sure URL is absolute
          if (url && !url.startsWith('http')) {
            url = new URL(url, baseUrl).toString();
          }
          
          const imageUrl = imageElement ? imageElement.getAttribute('src') : null;
          const description = descriptionElement ? descriptionElement.textContent.trim() : '';
          
          articles.push({
            title,
            url,
            image_url: imageUrl,
            description,
            source: 'Cointelegraph'
          });
        }
      }
    } else {
      // Generic article extraction for other sites
      // Look for common article patterns
      const articleElements = doc.querySelectorAll('article, .article, .post, .news-item');
      
      for (const article of articleElements) {
        const titleElement = article.querySelector('h1, h2, h3, h4, .title, .headline');
        const linkElement = article.querySelector('a');
        const imageElement = article.querySelector('img');
        const descriptionElement = article.querySelector('p, .description, .summary');
        
        if (titleElement && linkElement) {
          const title = titleElement.textContent.trim();
          let url = linkElement.getAttribute('href');
          
          // Make sure URL is absolute
          if (url && !url.startsWith('http')) {
            url = new URL(url, baseUrl).toString();
          }
          
          const imageUrl = imageElement ? imageElement.getAttribute('src') : null;
          const description = descriptionElement ? descriptionElement.textContent.trim() : '';
          
          // Extract source from URL
          const urlObj = new URL(baseUrl);
          const source = urlObj.hostname.replace('www.', '');
          
          articles.push({
            title,
            url,
            image_url: imageUrl,
            description,
            source
          });
        }
      }
    }
    
    return articles;
  } catch (error) {
    console.error('Error extracting article data:', error);
    return [];
  }
}

// Function to run a crawl job
async function runCrawlJob(jobId: string) {
  try {
    // Get the job details
    const { data: job, error: jobError } = await supabase
      .from('crawl_jobs')
      .select('*, site:crypto_crawl_sites(*)')
      .eq('id', jobId)
      .single();
      
    if (jobError) {
      console.error('Error fetching crawl job:', jobError);
      throw jobError;
    }
    
    if (!job) {
      throw new Error(`Crawl job with ID ${jobId} not found`);
    }
    
    // Update job status to running
    await supabase
      .from('crawl_jobs')
      .update({ status: 'running' })
      .eq('id', jobId);
      
    console.log(`Running crawl job for ${job.url}`);
    
    // Fetch the page
    const response = await fetch(job.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${job.url}: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract article data
    const articles = extractArticleData(html, job.url);
    console.log(`Extracted ${articles.length} articles from ${job.url}`);
    
    // Transform articles for database
    const transformedArticles = articles.map(article => {
      return {
        id: generateUUID(),
        title: article.title,
        content: article.description || '',
        source: article.source,
        url: article.url,
        image_url: article.image_url,
        published_at: new Date().toISOString(), // Use current time as we don't have the actual publish date
        created_at: new Date().toISOString(),
        relevance_score: 50, // Default score
        category: 'crypto', // Default category for crypto crawl
        tags: ['crypto', 'blockchain', 'web3'], // Default tags
        language: 'en', // Assume English
        source_id: job.site?.name?.toLowerCase() || 'crypto_crawl',
        source_guid: article.url // Use URL as a unique identifier
      };
    });
    
    // Check for duplicates in the database
    const urls = transformedArticles.map(article => article.url);
    
    const { data: existingArticles, error: existingError } = await supabase
      .from('articles')
      .select('url')
      .in('url', urls);
      
    if (existingError) {
      console.error('Error checking for existing articles:', existingError);
      throw existingError;
    }
    
    // Create a Set of existing URLs for efficient lookup
    const existingUrlsSet = new Set<string>();
    if (existingArticles) {
      existingArticles.forEach(article => {
        if (article.url) {
          existingUrlsSet.add(article.url);
        }
      });
    }
    
    // Filter out already existing articles
    const newArticles = transformedArticles.filter(
      article => !existingUrlsSet.has(article.url)
    );
    
    console.log(`Found ${newArticles.length} new articles to add`);
    
    // Insert new articles
    let insertedCount = 0;
    let error = null;
    
    if (newArticles.length > 0) {
      const { data, error: insertError } = await supabase
        .from('articles')
        .insert(newArticles)
        .select();
        
      if (insertError) {
        console.error('Error inserting articles:', insertError);
        error = insertError.message;
      } else {
        insertedCount = data?.length || 0;
        console.log(`Successfully inserted ${insertedCount} articles`);
      }
    }
    
    // Update job status
    await supabase
      .from('crawl_jobs')
      .update({ 
        status: error ? 'error' : 'completed',
        result_count: insertedCount,
        error: error,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    // Create log entry
    await createAggregationLog('crypto_crawl', error ? 'error' : 'success', {
      job_id: jobId,
      url: job.url,
      articles_found: articles.length,
      articles_added: insertedCount,
      error: error,
      timestamp: new Date().toISOString()
    });
    
    return {
      job_id: jobId,
      status: error ? 'error' : 'completed',
      articles_found: articles.length,
      articles_added: insertedCount,
      error: error
    };
  } catch (error) {
    console.error('Error running crawl job:', error);
    
    // Update job status to error
    await supabase
      .from('crawl_jobs')
      .update({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    // Create error log entry
    await createAggregationLog('crypto_crawl', 'error', {
      job_id: jobId,
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
    // Parse request body for job ID
    let jobId = '';
    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const body = await req.json();
        jobId = body.jobId || '';
      }
    } catch (error) {
      console.log('No JSON body or error parsing it:', error);
    }
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          },
          status: 400
        }
      );
    }
    
    console.log(`Starting crawl job ${jobId}`);
    const result = await runCrawlJob(jobId);
    console.log(`Crawl job ${jobId} completed`);
    
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
    console.error("Crawl job failed with error:", error);
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