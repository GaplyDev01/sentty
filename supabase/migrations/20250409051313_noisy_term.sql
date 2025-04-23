/*
  # Fix system_settings Row Level Security policies

  1. Updates
    - Drop existing policies for system_settings table
    - Create new policies allowing admins proper access to system_settings
  
  2. Security
    - Ensures admins can properly insert, update, delete and select system_settings
    - Ensures authenticated users can only view system_settings
*/

-- Drop existing policies for the system_settings table
DROP POLICY IF EXISTS "Admins can delete system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can select system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;

-- Create new policies with correct conditions for the system_settings table
CREATE POLICY "Admins can delete system settings" 
ON public.system_settings 
FOR DELETE 
TO authenticated 
USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text
);

CREATE POLICY "Admins can insert system settings" 
ON public.system_settings 
FOR INSERT 
TO authenticated 
WITH CHECK (
  (auth.jwt() ->> 'role'::text) = 'admin'::text
);

CREATE POLICY "Admins can select system settings" 
ON public.system_settings 
FOR SELECT 
TO authenticated 
USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text
);

CREATE POLICY "Admins can update system settings" 
ON public.system_settings 
FOR UPDATE 
TO authenticated 
USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text
) 
WITH CHECK (
  (auth.jwt() ->> 'role'::text) = 'admin'::text
);

-- Anyone authenticated can view system settings
CREATE POLICY "Anyone can view system settings" 
ON public.system_settings 
FOR SELECT 
TO authenticated 
USING (true);