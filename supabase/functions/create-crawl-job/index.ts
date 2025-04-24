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

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// Main function to create a crawl job
async function createCrawlJob(req: Request) {
  // Parse request body for job details
  let jobData: Record<string, any> = {};
  try {
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await req.json();
      jobData = body || {};
    }
  } catch (error) {
    console.log('No JSON body or error parsing it:', error);
    throw new Error('Invalid job data: JSON parsing failed');
  }
  
  // Validate job data
  if (!jobData.url) {
    throw new Error('URL is required');
  }
  
  if (!isValidUrl(jobData.url)) {
    throw new Error('Invalid URL format');
  }
  
  if (!['rss', 'html', 'api'].includes(jobData.type || 'rss')) {
    throw new Error('Invalid job type. Must be one of: rss, html, api');
  }
  
  // Create a starting log entry
  await createAggregationLog('create_job', 'running', {
    started_at: new Date().toISOString(),
    job_data: jobData
  });
  
  try {
    console.log('Creating new crawl job');
    
    // Check if this is for an existing site or a one-time crawl
    let siteId = jobData.site_id;
    let siteName = jobData.site_name || 'One-time crawl';
    
    // If site_id is provided, fetch site details
    if (siteId) {
      const { data: site, error: siteError } = await supabase
        .from('crypto_crawl_sites')
        .select('*')
        .eq('id', siteId)
        .single();
        
      if (siteError) {
        throw new Error(`Site not found: ${siteError.message}`);
      }
      
      siteName = site.name;
    } 
    // If this is a new site that needs to be added to the database
    else if (jobData.add_to_db === true) {
      // Create the site first
      const { data: newSite, error: newSiteError } = await supabase
        .from('crypto_crawl_sites')
        .insert({
          name: jobData.site_name,
          url: jobData.url,
          type: jobData.type || 'rss',
          article_limit: jobData.limit || 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (newSiteError) {
        throw new Error(`Error creating new site: ${newSiteError.message}`);
      }
      
      siteId = newSite.id;
      siteName = newSite.name;
      
      console.log(`Created new site in database: ${siteName} (${siteId})`);
    }
    
    // Create the job object
    const job = {
      id: uuidv4(),
      site_id: siteId,
      site_name: siteName,
      url: jobData.url,
      type: jobData.type || 'rss',
      limit: jobData.limit || 50,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Log the job creation
    await createAggregationLog('crawl_job_created', 'pending', {
      job_id: job.id,
      site: job.site_name,
      url: job.url,
      type: job.type,
      created_at: job.created_at
    });
    
    // Return the job details
    return {
      message: 'Crawl job created successfully',
      job: {
        id: job.id,
        site: job.site_name,
        url: job.url,
        type: job.type
      }
    };
  } catch (error) {
    console.error('Error creating crawl job:', error);
    
    // Create error log entry
    await createAggregationLog('create_job', 'error', {
      error: error instanceof Error ? error.message : "An unknown error occurred",
      job_data: jobData,
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
    console.log("Starting crawl job creation");
    const result = await createCrawlJob(req);
    console.log("Crawl job created successfully");
    
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
    console.error("Crawl job creation failed with error:", error);
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