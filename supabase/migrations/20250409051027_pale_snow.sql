/*
  # Fix system_settings RLS policies

  1. Changes
    - Drop and recreate RLS policies for system_settings table to ensure proper admin access
    - Explicitly adds UPDATE and INSERT policies for admins
    - Ensures the policy checks are using the correct syntax for role verification
  
  2. Security
    - Maintains existing security model where admins can manage system settings
    - Authenticated users can still view system settings
*/

-- First, delete existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;

-- Recreate the policies with explicit permissions
-- Allow admins to SELECT from system_settings
CREATE POLICY "Admins can select system settings" 
ON public.system_settings
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Allow admins to INSERT into system_settings
CREATE POLICY "Admins can insert system settings" 
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Allow admins to UPDATE system_settings
CREATE POLICY "Admins can update system settings" 
ON public.system_settings
FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Allow admins to DELETE from system_settings
CREATE POLICY "Admins can delete system settings" 
ON public.system_settings
FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Anyone authenticated can view system settings
CREATE POLICY "Anyone can view system settings" 
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);