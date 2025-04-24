/*
  # Remove Duplicate Articles
  
  1. Changes
    - Identifies and removes duplicate articles in the articles table
    - Keeps the most recent version of each duplicate
    
  2. Purpose
    - Clean up the database by removing redundant content
    - Improve user experience by preventing duplicate articles in the feed
*/

-- Log start of cleanup migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'running', 
  jsonb_build_object(
    'migration', 'remove_duplicate_articles',
    'timestamp', now(),
    'description', 'Starting duplicate articles cleanup'
  )
);

-- Create a temporary table to track duplicates
CREATE TEMP TABLE duplicate_articles AS
WITH duplicates AS (
  SELECT 
    id,
    title,
    url,
    source,
    created_at,
    published_at,
    ROW_NUMBER() OVER (
      PARTITION BY title, source
      ORDER BY published_at DESC, created_at DESC
    ) as row_num
  FROM articles
  WHERE title IS NOT NULL AND title != ''
)
SELECT id
FROM duplicates
WHERE row_num > 1;

-- Count duplicates before deletion
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count FROM duplicate_articles;
  
  -- Log the count of duplicates found
  INSERT INTO aggregation_logs (event_type, status, details)
  VALUES (
    'system_migration', 
    'progress', 
    jsonb_build_object(
      'action', 'count_duplicates',
      'duplicate_count', duplicate_count,
      'timestamp', now()
    )
  );
END $$;

-- Delete duplicates
DELETE FROM articles
WHERE id IN (SELECT id FROM duplicate_articles);

-- Count articles after cleanup
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count FROM articles;
  
  -- Log completion with counts
  INSERT INTO aggregation_logs (event_type, status, details)
  VALUES (
    'system_migration', 
    'success', 
    jsonb_build_object(
      'migration', 'remove_duplicate_articles',
      'remaining_articles', remaining_count,
      'timestamp', now(),
      'description', 'Completed duplicate articles cleanup'
    )
  );
END $$;

-- Drop the temporary table
DROP TABLE duplicate_articles;

-- Optional: Add an index on title and source to help prevent future duplicates
CREATE INDEX IF NOT EXISTS idx_articles_title_source ON articles (title, source);