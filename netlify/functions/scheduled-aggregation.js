const { schedule } = require('@netlify/functions');
const fetch = require('node-fetch');

// The Supabase URL and service key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Function to call a Supabase Edge Function
async function triggerSupabaseFunction(functionName) {
  try {
    console.log(`Triggering ${functionName} function...`);

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          scheduled: true,
          netlify: true
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to trigger ${functionName}: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log(`${functionName} result:`, result);
    return result;
  } catch (error) {
    console.error(`Error triggering ${functionName}:`, error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Main handler function
const handler = async (event) => {
  console.log('Scheduled aggregation function started');

  try {
    // Trigger all aggregation functions
    const generalNewsResult = await triggerSupabaseFunction('aggregate-news');
    const cryptoNewsResult = await triggerSupabaseFunction('fetch-crypto-news');
    const cryptoPanicNewsResult = await triggerSupabaseFunction('fetch-cryptopanic-news');
    const fireCrawlNewsResult = await triggerSupabaseFunction('fetch-firecrawl-news');

    // Aggregate results
    const totalArticles =
      (generalNewsResult?.count || 0) +
      (cryptoNewsResult?.count || 0) +
      (cryptoPanicNewsResult?.count || 0) +
      (fireCrawlNewsResult?.count || 0);

    const errors = [
      generalNewsResult?.error,
      cryptoNewsResult?.error,
      cryptoPanicNewsResult?.error,
      fireCrawlNewsResult?.error
    ].filter(Boolean);

    const message = `Scheduled aggregation completed. Total articles: ${totalArticles}. Errors: ${errors.length}`;

    console.log(message);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message,
        totalArticles,
        errors,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error in scheduled aggregation handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Scheduled aggregation failed',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Schedule the handler function to run every 15 minutes
exports.handler = schedule('*/15 * * * *', handler);