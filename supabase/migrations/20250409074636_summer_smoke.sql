/*
  # Add language column to articles table
  
  1. Changes
    - Add a 'language' column to the articles table to support multilingual content
    - Default to English ('en') for existing articles
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add language column to articles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'language'
  ) THEN
    ALTER TABLE articles ADD COLUMN language text DEFAULT 'en';
  END IF;
END $$;

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_language_column',
    'timestamp', now(),
    'description', 'Added language column to articles table'
  )
);