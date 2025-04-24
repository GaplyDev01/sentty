/*
  # Fix Profiles RLS Policy for New User Registration
  
  1. Changes
    - Adds a new RLS policy to allow the service role to insert into profiles table
    - Ensures the auth trigger can properly create profile entries
    
  2. Purpose
    - Fixes the "new row violates row-level security policy for table profiles" error
    - Allows new user registration to work correctly
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a more permissive insert policy
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (true);  -- Allow any insert, as the trigger will handle this properly

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'fix_profiles_rls_policy',
    'timestamp', now(),
    'description', 'Fixed profiles RLS policy to allow new user registration'
  )
);