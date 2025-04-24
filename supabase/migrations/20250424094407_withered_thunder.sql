/*
  # Add FireCrawl API support
  
  1. Changes
    - Add fields to system_settings table for FireCrawl API configuration
    - Create firecrawl_cache table for caching API responses
    
  2. Purpose
    - Enable FireCrawl integration for crypto news aggregation
    - Store API responses to respect rate limits and improve performance
*/

-- Add FireCrawl fields to system_settings table
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS firecrawl_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS firecrawl_api_key text,
ADD COLUMN IF NOT EXISTS firecrawl_last_run timestamptz,
ADD COLUMN IF NOT EXISTS firecrawl_rate_limited boolean DEFAULT false;

-- Create firecrawl_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS firecrawl_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on firecrawl_cache table
ALTER TABLE firecrawl_cache ENABLE ROW LEVEL SECURITY;

-- Add policy for firecrawl_cache table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'firecrawl_cache' AND policyname = 'Admins can manage firecrawl_cache'
  ) THEN
    CREATE POLICY "Admins can manage firecrawl_cache"
      ON firecrawl_cache
      FOR ALL
      TO public
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END$$;

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_firecrawl_support',
    'timestamp', now(),
    'description', 'Added FireCrawl API support and cache table'
  )
);