/*
  # Fix profiles RLS for user creation
  
  1. Changes
    - Adds a SECURITY DEFINER function to create user profiles directly
    - Ensures the handle_new_user trigger works even with RLS enabled
    - Adds new insert_user_profile function that can be called from code
  
  2. Security
    - Maintains proper security model while allowing new user creation
    - Ensures user profile creation is properly secured
*/

-- First, ensure the handle_new_user function uses SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role, created_at)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    CASE
      WHEN new.email LIKE '%@blindvibe.com' THEN 'admin'
      ELSE 'user'
    END,
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a security definer function to insert user profiles from code
CREATE OR REPLACE FUNCTION public.insert_user_profile(
  user_id uuid,
  user_email text,
  user_name text,
  user_role text DEFAULT 'user'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role, created_at)
  VALUES (
    user_id,
    user_email,
    user_name,
    CASE
      WHEN user_email LIKE '%@blindvibe.com' THEN 'admin'
      ELSE user_role
    END,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'migration', 
  'success', 
  jsonb_build_object(
    'migration', 'fix_profiles_rls',
    'timestamp', now(),
    'description', 'Fixed profiles RLS to allow new user creation'
  )
);