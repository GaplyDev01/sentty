/**
 * Standard CORS headers to use with fetch requests to Supabase functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Helper function to append CORS headers to fetch options
 * @param options Current fetch options
 * @returns Updated fetch options with CORS headers
 */
export function withCorsHeaders(options: RequestInit = {}): RequestInit {
  return {
    ...options,
    headers: {
      ...corsHeaders,
      ...options.headers
    }
  };
}

/**
 * Direct fetch wrapper that adds CORS headers
 * @param url URL to fetch
 * @param options Fetch options
 * @returns Promise with fetch response
 */
export async function fetchWithCors(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, withCorsHeaders(options));
}