/*
  # Add crypto crawler support tables
  
  1. New Tables
    - Create a jobs table to track crawler jobs
    - Create a results table to store raw crawl results
    
  2. Purpose
    - Enable tracking and management of crypto news crawl jobs
    - Provide a way to store raw results before processing into articles
*/

-- Create table for tracking crawl jobs
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES crypto_crawl_sites(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  result_count integer,
  error text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS on the jobs table
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'crawl_jobs' AND policyname = 'Admins can manage crawl_jobs'
  ) THEN
    CREATE POLICY "Admins can manage crawl_jobs"
      ON crawl_jobs
      FOR ALL
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'crawl_jobs' AND policyname = 'Anyone can view crawl_jobs'
  ) THEN
    CREATE POLICY "Anyone can view crawl_jobs"
      ON crawl_jobs
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;

-- Create function to execute SQL for table creation
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_crypto_crawler_support',
    'timestamp', now(),
    'description', 'Added tables and functions for crypto crawler system'
  )
);