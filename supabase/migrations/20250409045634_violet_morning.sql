/*
  # Add unique constraint to user_preferences table
  
  1. Changes
    - Add unique constraint to the `user_id` column in the `user_preferences` table
    - This prevents multiple preference entries for a single user
    
  2. Purpose
    - Ensures data integrity by allowing only one preferences record per user
    - Prevents errors in the application when retrieving user preferences
*/

-- Add unique constraint to user_id in user_preferences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_preferences_user_id_key'
  ) THEN
    ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
  END IF;
END $$;