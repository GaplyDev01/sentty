/*
  # Fix RLS Policies for Profile Access
  
  This migration completely overhauls the Row Level Security policies for the profiles table
  to ensure admins can properly see and manage all user profiles.
  
  1. Changes:
    - Drops all existing policies for profiles table
    - Creates new policies with proper role checks using auth.jwt()
    - Ensures admin policies have priority over user policies
    - Uses explicit policy names for better management
    - Adds debug functions to help verify policy operation
*/

-- Drop all existing profile policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Re-enable Row Level Security to make sure it's active
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create the admin SELECT policy first (priority matters)
CREATE POLICY "admin_select_all_profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

-- Create the admin UPDATE policy
CREATE POLICY "admin_update_all_profiles" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

-- Create the admin DELETE policy
CREATE POLICY "admin_delete_all_profiles" 
ON profiles 
FOR DELETE 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

-- Create user's own profile policies
CREATE POLICY "users_select_own_profile" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Create a function to check the current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() ->> 'role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (id, event_type, status, details)
VALUES (
  gen_random_uuid(), 
  'migration', 
  'success', 
  jsonb_build_object(
    'migration', 'fixed_admin_profiles_access',
    'timestamp', now(),
    'details', 'Fixed admin access to all profiles by updating RLS policies'
  )
);