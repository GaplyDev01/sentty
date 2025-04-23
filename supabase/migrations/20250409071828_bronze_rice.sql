/*
  # Add language preferences to user_preferences table
  
  1. Changes
    - Add a languages array field to user_preferences table
    - This allows users to select which article languages they prefer
    
  2. Purpose
    - Enable filtering of articles by language
    - Improve personalization by considering language preferences
*/

-- Add languages column if it doesn't exist
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT ARRAY['en']::text[];

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_language_preferences',
    'timestamp', now(),
    'description', 'Added languages field to user_preferences table'
  )
);