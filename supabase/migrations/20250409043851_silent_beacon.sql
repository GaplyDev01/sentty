/*
  # Add INSERT policy for profiles table

  1. Changes
     - Add new INSERT policy for profiles table that allows users to create their own profile
     
  2. Security
     - Maintain existing security model while allowing users to create their own profile during signup
     - Users can only create a profile with their own user ID
*/

-- Add INSERT policy for profiles
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);