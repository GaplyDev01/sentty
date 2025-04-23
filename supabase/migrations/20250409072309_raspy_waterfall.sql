/*
  # Add language preferences to user_preferences table
  
  1. Changes
    - Add languages column to user_preferences table
    - Set default value to ['en'] (English)
    
  2. Purpose
    - Allow users to specify which languages they prefer for news articles
    - Filter articles based on language preferences
*/

-- Add languages column to user_preferences table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'languages'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN languages text[] DEFAULT ARRAY['en'::text];
  END IF;
END $$;

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_language_preferences',
    'timestamp', now(),
    'description', 'Added languages column to user_preferences table'
  )
);