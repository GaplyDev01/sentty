/*
  # Remove update_frequency field from user_preferences

  1. Changes
    - Remove the update_frequency column from user_preferences table
    
  2. Reason
    - Simplified user preferences to focus only on content preferences
    - System-wide scheduling is now handled globally instead of per-user
*/

-- First, check if the column exists and remove it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'update_frequency'
  ) THEN
    ALTER TABLE user_preferences DROP COLUMN update_frequency;
  END IF;
END $$;

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'remove_update_frequency',
    'timestamp', now(),
    'description', 'Removed update_frequency column from user_preferences table'
  )
);