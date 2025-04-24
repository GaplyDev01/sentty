-- Add CryptoPanic fields to system_settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS cryptopanic_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cryptopanic_api_key text,
ADD COLUMN IF NOT EXISTS cryptopanic_last_run timestamptz,
ADD COLUMN IF NOT EXISTS cryptopanic_rate_limited boolean DEFAULT false;

-- Create cryptopanic_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS cryptopanic_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on cryptopanic_cache table
ALTER TABLE cryptopanic_cache ENABLE ROW LEVEL SECURITY;

-- Add policy for cryptopanic_cache table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cryptopanic_cache' AND policyname = 'Admins can manage cryptopanic_cache'
  ) THEN
    CREATE POLICY "Admins can manage cryptopanic_cache"
      ON cryptopanic_cache
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
    'migration', 'add_cryptopanic_support',
    'timestamp', now(),
    'description', 'Added CryptoPanic API support and cache table'
  )
);