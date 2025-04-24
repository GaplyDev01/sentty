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

// Function to create crawl jobs from the crypto_crawl_sites table
async function createCrawlJobsFromTable() {
  try {
    // Get all active crawl sites
    const { data: sites, error: sitesError } = await supabase
      .from('crypto_crawl_sites')
      .select('*');
      
    if (sitesError) {
      console.error('Error fetching crawl sites:', sitesError);
      throw sitesError;
    }
    
    if (!sites || sites.length === 0) {
      console.log('No crawl sites found');
      return {
        message: 'No crawl sites found',
        jobs_created: 0
      };
    }
    
    console.log(`Found ${sites.length} crawl sites`);
    
    // Create a job for each site
    const jobs = [];
    
    for (const site of sites) {
      const { data: job, error: jobError } = await supabase
        .from('crawl_jobs')
        .insert({
          site_id: site.id,
          url: site.url,
          type: site.type,
          status: 'pending'
        })
        .select()
        .single();
        
      if (jobError) {
        console.error(`Error creating job for site ${site.id}:`, jobError);
        continue;
      }
      
      jobs.push(job);
      console.log(`Created job ${job.id} for site ${site.name}`);
    }
    
    // Create log entry
    await createAggregationLog('create_crawl_jobs', 'success', {
      jobs_created: jobs.length,
      sites_count: sites.length,
      timestamp: new Date().toISOString()
    });
    
    return {
      message: `Created ${jobs.length} crawl jobs from ${sites.length} sites`,
      jobs_created: jobs.length,
      jobs: jobs
    };
  } catch (error) {
    console.error('Error creating crawl jobs:', error);
    
    // Create error log entry
    await createAggregationLog('create_crawl_jobs', 'error', {
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
    console.log("Starting creation of crawl jobs from table");
    const result = await createCrawlJobsFromTable();
    console.log("Crawl jobs creation completed");
    
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
    console.error("Crawl jobs creation failed with error:", error);
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