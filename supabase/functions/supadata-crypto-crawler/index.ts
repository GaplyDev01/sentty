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

// Delay function with exponential backoff
function delay(ms: number, retryCount = 0) {
  const backoffFactor = Math.pow(2, retryCount);
  const adjustedDelay = Math.min(ms * backoffFactor, 10000);
  return new Promise(resolve => setTimeout(resolve, adjustedDelay));
}

// Main crawler function that orchestrates the crawling process
async function runCryptoCrawler(req: Request) {
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
  
  // Create a starting log entry
  await createAggregationLog('supadata_crawler', 'running', {
    started_at: new Date().toISOString(),
    message: 'Starting SupaData crypto crawler',
    options
  });
  
  try {
    // Fetch all configured crypto crawl sites
    const { data: sites, error: sitesError } = await supabase
      .from('crypto_crawl_sites')
      .select('*');
      
    if (sitesError) {
      throw new Error(`Error fetching crawl sites: ${sitesError.message}`);
    }
    
    if (!sites || sites.length === 0) {
      await createAggregationLog('supadata_crawler', 'success', {
        message: 'No crawl sites configured',
        count: 0,
        timestamp: new Date().toISOString()
      });
      
      return {
        message: 'No crawl sites configured',
        count: 0
      };
    }
    
    // For each site, create a crawl job
    const jobs = sites.map(site => ({
      id: uuidv4(),
      site_id: site.id,
      site_name: site.name,
      url: site.url,
      type: site.type,
      limit: site.article_limit || 50,
      status: 'pending',
      created_at: new Date().toISOString()
    }));
    
    // Log the created jobs
    await createAggregationLog('supadata_crawler', 'success', {
      message: `Created ${jobs.length} crawl jobs`,
      jobs: jobs.map(job => ({ id: job.id, site: job.site_name })),
      timestamp: new Date().toISOString()
    });
    
    // Return the job details
    return {
      message: `Created ${jobs.length} crawl jobs for processing`,
      jobs: jobs.map(job => ({
        id: job.id,
        site: job.site_name,
        type: job.type
      }))
    };
  } catch (error) {
    console.error('Error in runCryptoCrawler:', error);
    
    // Create error log entry
    await createAggregationLog('supadata_crawler', 'error', {
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
    console.log("Starting SupaData crypto crawler");
    const result = await runCryptoCrawler(req);
    console.log("SupaData crawler completed successfully");
    
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
    console.error("SupaData crawler failed with error:", error);
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