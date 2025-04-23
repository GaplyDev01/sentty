/*
  # Create aggregation logs table
  
  1. New Tables
    - `aggregation_logs` - Stores logs of aggregation runs
      - `id` (uuid, primary key)
      - `event_type` (text)
      - `status` (text)
      - `details` (jsonb)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on the new table
    - Add policy for admins to manage logs
    - Add policy for authenticated users to view logs
*/

-- Create aggregation logs table
CREATE TABLE IF NOT EXISTS aggregation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  status text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE aggregation_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Admins can manage aggregation logs"
  ON aggregation_logs
  USING ((auth.jwt() ->> 'role')::text = 'admin');

CREATE POLICY "Anyone can view aggregation logs"
  ON aggregation_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to log aggregation events
CREATE OR REPLACE FUNCTION log_aggregation_event(
  event_type text,
  status text,
  details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO aggregation_logs (event_type, status, details)
  VALUES (event_type, status, details)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;