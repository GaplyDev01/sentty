/*
  # Create system settings table

  1. New Tables
    - `system_settings`
      - `id` (text, primary key) - For different settings types
      - `last_run` (timestamptz) - When the process was last run
      - `status` (text) - Current status (success, error, etc.)
      - `articles_count` (integer) - Number of articles processed
      - `error_message` (text) - Error message if any
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  2. Security
    - Enable RLS on `system_settings` table
    - Add policy for admins to manage system settings
*/

CREATE TABLE IF NOT EXISTS system_settings (
  id text PRIMARY KEY,
  last_run timestamptz,
  status text,
  articles_count integer,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for system_settings table
CREATE POLICY "Admins can manage system settings"
  ON system_settings
  USING ((auth.jwt() ->> 'role')::text = 'admin');

CREATE POLICY "Anyone can view system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);