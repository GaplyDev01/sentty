/*
  # Ensure Aggregation Logs Table
  
  1. New Tables
    - Verifies `aggregation_logs` table exists and creates it if not
    - Adds row-level security and policies for the table
    
  2. Features
    - Automatic ID generation (UUID)
    - Timestamped log entries
    - JSON details field for flexible logging
    - Event type and status for filtering
    
  3. Security
    - Enables RLS for proper access control
    - Allows admins to manage all logs
    - Allows authenticated users to view logs
*/

-- Create aggregation_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS aggregation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Make sure row-level security is enabled
ALTER TABLE aggregation_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage aggregation logs" ON public.aggregation_logs;
DROP POLICY IF EXISTS "Anyone can view aggregation logs" ON public.aggregation_logs;

-- Create policies for the aggregation_logs table
CREATE POLICY "Admins can manage aggregation logs" 
ON public.aggregation_logs
FOR ALL
TO public 
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Anyone can view aggregation logs" 
ON public.aggregation_logs
FOR SELECT
TO authenticated 
USING (true);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS aggregation_logs_event_type_idx ON aggregation_logs (event_type);
CREATE INDEX IF NOT EXISTS aggregation_logs_status_idx ON aggregation_logs (status);
CREATE INDEX IF NOT EXISTS aggregation_logs_created_at_idx ON aggregation_logs (created_at DESC);

-- Add sample log entries for testing if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM aggregation_logs LIMIT 1) THEN
    INSERT INTO aggregation_logs (event_type, status, details) VALUES
      ('aggregation', 'success', '{"articles_added": 25}'::jsonb),
      ('aggregation', 'error', '{"error": "API rate limit exceeded"}'::jsonb),
      ('schedule_update', 'success', '{"frequency": "15min", "enabled": true}'::jsonb),
      ('system_migration', 'success', '{"message": "Updated database schema"}'::jsonb);
  END IF;
END $$;

-- Insert a log entry for this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_aggregation_logs',
    'timestamp', now(),
    'description', 'Ensured aggregation_logs table exists with proper RLS'
  )
);