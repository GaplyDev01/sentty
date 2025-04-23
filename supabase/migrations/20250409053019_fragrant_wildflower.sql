/*
  # Fix Admin Access to All Users

  This migration updates the Row Level Security policies for the profiles table
  to ensure admins can view and manage ALL user profiles properly.
  
  1. Permissions
    - Ensures admins can view all user profiles
    - Updates the policy to use auth.jwt() instead of jwt()
    - Makes the admin policies take priority over user policies
*/

-- Make sure profiles has RLS enabled
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profile policies to recreate them
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate policies with correct auth.jwt() function

-- Admin policies - note that these come FIRST so they take priority
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- User policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Add an explicit log entry to confirm migration ran
INSERT INTO aggregation_logs (id, event_type, status, details)
VALUES (
  gen_random_uuid(), 
  'system_migration', 
  'success', 
  jsonb_build_object(
    'message', 'Updated profile RLS policies to fix admin access',
    'timestamp', now()
  )
);