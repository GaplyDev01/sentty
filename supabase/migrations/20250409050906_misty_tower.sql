/*
  # Create system_settings table for article aggregation

  1. New Tables
    - Ensures `system_settings` table exists with appropriate columns for aggregation scheduling and status tracking
  
  2. Security
    - Enable RLS on `system_settings` table
    - Add policy for admins to manage system settings
    - Add policy for authenticated users to view system settings
*/

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
  id text PRIMARY KEY,
  last_run timestamptz,
  status text,
  articles_count integer,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  next_scheduled timestamptz,
  frequency text DEFAULT '15min',
  enabled boolean DEFAULT true
);

-- Make sure table has RLS enabled
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_settings' AND policyname = 'Admins can manage system settings'
  ) THEN
    CREATE POLICY "Admins can manage system settings" 
    ON system_settings
    FOR ALL
    TO public 
    USING ((jwt() ->> 'role'::text) = 'admin'::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_settings' AND policyname = 'Anyone can view system settings'
  ) THEN
    CREATE POLICY "Anyone can view system settings" 
    ON system_settings
    FOR SELECT
    TO authenticated 
    USING (true);
  END IF;
END $$;

-- Insert default records if they don't exist
INSERT INTO system_settings (id, status, enabled, frequency)
VALUES 
  ('aggregation_status', 'never_run', true, '15min'),
  ('aggregation_schedule', NULL, true, '15min')
ON CONFLICT (id) DO NOTHING;