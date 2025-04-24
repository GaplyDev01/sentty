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

async function updateCryptoSettings(req: Request) {
  try {
    // Define our API keys - using the ones provided by user
    const settings = {
      // CryptoPanic settings
      cryptopanic_enabled: true,
      cryptopanic_api_key: 'CRYPTO_PANIC_API-6468dfe197ff8865c8c7e3db0040587b4c28f7af',
      cryptopanic_rate_limited: false,
      
      // FireCrawl settings
      firecrawl_enabled: true,
      firecrawl_api_key: 'fc-828bccc4148b4ec0ab4df0eeb4190bf3',
      firecrawl_rate_limited: false,
      
      // CoinDesk settings
      coindesk_enabled: true,
      coindesk_api_key: 'd528326f0bb6201b28c547de4d6a67d5036a02ef35768996a83c700d84b9bcfb',
      coindesk_rate_limited: false,
      
      // Update timestamp
      updated_at: new Date().toISOString()
    };

    // Update system_settings table
    const { data, error } = await supabase
      .from('system_settings')
      .update(settings)
      .eq('id', 'aggregation_status')
      .select();

    if (error) {
      throw error;
    }

    // Create log entry for successful update
    await createAggregationLog('crypto_settings_update', 'success', {
      message: 'Enabled all crypto news integrations with API keys',
      timestamp: new Date().toISOString()
    });

    return {
      message: 'Successfully enabled all crypto news integrations',
      cryptoPanic: {
        enabled: true,
        api_key_set: true
      },
      fireCrawl: {
        enabled: true,
        api_key_set: true
      },
      coinDesk: {
        enabled: true,
        api_key_set: true
      }
    };
  } catch (error) {
    console.error('Error updating crypto settings:', error);
    
    // Create error log entry
    await createAggregationLog('crypto_settings_update', 'error', {
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
    console.log("Starting crypto settings update");
    const result = await updateCryptoSettings(req);
    console.log("Crypto settings updated successfully");
    
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
    console.error("Crypto settings update failed with error:", error);
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