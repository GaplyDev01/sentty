/*
  # Add Research Init Trigger
  
  1. Changes
    - Add a trigger to user_preferences table that calls a webhook when preferences are updated
    - This webhook will initiate research for new users or when preferences change
  
  2. Purpose
    - Automatically start the research process when user preferences are created or updated
    - Integrate with external research service via webhook
*/

-- Create trigger on user_preferences table
CREATE OR REPLACE TRIGGER "Research Init"
  AFTER INSERT OR UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://astra.datastax.com/api/v1/webhook/58df2fdc-be7c-416a-925b-42ab86d596b0',
    'POST',
    '{
      "Content-type":"application/json",
      "x-api-key":"cYohhXIgqpJKOgkgbjxtZSho:8de77ed87c2f89e3f61e4529b1f0ee7bec77f0e0ab4bfbf1be2421051e9f403d",
      "Bearer":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmRtcGZpZ3doeXZnbHJ1a3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTE4NDMwMCwiZXhwIjoyMDYwNzYwMzAwfQ.ujp5S-VGmaFtTV7Ou8c_QjOVL6quta173AIQ4BwcuRs"
    }',
    '{"any":"data"}',
    '5000'
  );

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_research_init_trigger',
    'timestamp', now(),
    'description', 'Added Research Init trigger to user_preferences table'
  )
);