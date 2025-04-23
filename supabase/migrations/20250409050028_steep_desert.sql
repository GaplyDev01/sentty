/*
  # Create aggregation schedule table
  
  1. Changes
    - Add new fields to system_settings table to handle aggregation scheduling
    
  2. Purpose
    - Allows admin to configure when news aggregation should run
    - Tracks scheduling information like frequency and next run time
*/

-- Add necessary fields to system_settings table if they don't exist
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS next_scheduled timestamptz,
ADD COLUMN IF NOT EXISTS frequency text DEFAULT '15min',
ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;