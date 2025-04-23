/*
  # Set up admin role for @blindvibe.com emails
  
  1. Create a trigger function to automatically set role to admin for blindvibe.com email domains
  2. Apply trigger to profiles table for both inserts and updates
  3. Update existing accounts with blindvibe.com emails to have admin role
*/

-- Create trigger function to set admin role for blindvibe.com emails
CREATE OR REPLACE FUNCTION set_admin_for_blindvibe_emails()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email LIKE '%@blindvibe.com' THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles table to run before insert or update
DROP TRIGGER IF EXISTS ensure_admin_for_blindvibe_emails ON profiles;
CREATE TRIGGER ensure_admin_for_blindvibe_emails
BEFORE INSERT OR UPDATE OF email ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_admin_for_blindvibe_emails();

-- Update existing accounts with blindvibe.com emails to have admin role
UPDATE profiles 
SET role = 'admin'
WHERE email LIKE '%@blindvibe.com' AND role != 'admin';