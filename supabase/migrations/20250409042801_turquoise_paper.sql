/*
  # Fix Infinite Recursion in Profile Policies

  1. Changes
     - Drop existing problematic policies that cause infinite recursion
     - Create new policies that avoid recursion by using auth.jwt() instead of self-referential queries
     
  2. Security
     - Maintain the same security intentions while fixing the infinite recursion issue
     - Admin users can still view and update all profiles
     - Regular users can still view and update only their own profile
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create new policies without recursion using auth.jwt()
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE TO public
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT TO public
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);