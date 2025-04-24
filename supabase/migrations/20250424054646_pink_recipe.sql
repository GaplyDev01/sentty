/*
  # Add Source GUID Tracking for Articles
  
  1. Changes
    - Add source_id field to store which news source the article came from
    - Add source_guid field to track original article ID from the source
    - Add index on source + source_guid for more efficient duplicate detection
    
  2. Purpose
    - Better tracking of article origins
    - More reliable duplicate detection across different aggregation runs
    - Improved support for multiple news sources
*/

-- Add source tracking columns to articles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE articles ADD COLUMN source_id text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'source_guid'
  ) THEN
    ALTER TABLE articles ADD COLUMN source_guid text;
  END IF;
END $$;

-- Create index for efficient duplicate detection
CREATE INDEX IF NOT EXISTS idx_articles_source_guid 
ON articles (source, source_guid) 
WHERE source_guid IS NOT NULL;

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_article_source_tracking',
    'timestamp', now(),
    'description', 'Added source_id and source_guid fields to articles table for better tracking'
  )
);