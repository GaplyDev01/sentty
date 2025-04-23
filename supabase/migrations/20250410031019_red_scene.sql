/*
  # Adjust settings for NewsAPI rate limits
  
  1. Changes
    - Add a note to system_settings about rate limiting
    - Add extra fields to support rate limiting handling
    
  2. Purpose
    - Improve how the system handles NewsAPI rate limits
    - Provide better user feedback and recovery from rate limit errors
*/

-- Update system_settings table with fields for rate limit handling
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_settings' AND column_name = 'rate_limit_cooldown'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN rate_limit_cooldown timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_settings' AND column_name = 'rate_limited'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN rate_limited boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_settings' AND column_name = 'single_category_mode'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN single_category_mode boolean DEFAULT true;
  END IF;
END $$;

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'adjust_for_rate_limits',
    'timestamp', now(),
    'description', 'Added rate limiting fields to system_settings table'
  )
);