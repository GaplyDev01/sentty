/*
  # Simplify system_settings table

  1. Changes
    - Updates the system_settings table structure to focus on manual aggregation
    - Removes unnecessary scheduling columns

  2. Security
    - Maintains existing RLS policies
*/

-- Update system_settings table to remove scheduling fields if they exist
DO $$
BEGIN
  -- Check if last_scheduled column exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_settings' AND column_name = 'last_scheduled'
  ) THEN
    ALTER TABLE system_settings DROP COLUMN last_scheduled;
  END IF;
END
$$;

-- Insert default records if they don't exist (only for aggregation_status)
INSERT INTO system_settings (id, status, enabled, frequency)
VALUES ('aggregation_status', 'never_run', true, '15min')
ON CONFLICT (id) DO NOTHING;

-- Remove aggregation_schedule record if it exists
DELETE FROM system_settings WHERE id = 'aggregation_schedule';