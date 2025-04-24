/*
  # Add CoinDesk API Support to System Settings
  
  1. Changes
    - Adds fields to system_settings table for CoinDesk API configuration
    
  2. Purpose
    - Enable additional crypto news aggregation from CoinDesk API
    - Track API usage and rate limiting for CoinDesk
*/

-- Add new fields to system_settings table for CoinDesk API
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS coindesk_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS coindesk_api_key text,
ADD COLUMN IF NOT EXISTS coindesk_last_run timestamptz,
ADD COLUMN IF NOT EXISTS coindesk_rate_limited boolean DEFAULT false;

-- Create coindesk_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS coindesk_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on coindesk_cache table
ALTER TABLE coindesk_cache ENABLE ROW LEVEL SECURITY;

-- Add policy for coindesk_cache table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coindesk_cache' AND policyname = 'Admins can manage coindesk_cache'
  ) THEN
    CREATE POLICY "Admins can manage coindesk_cache"
      ON coindesk_cache
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
    'migration', 'add_coindesk_support',
    'timestamp', now(),
    'description', 'Added CoinDesk API support and cache table'
  )
);