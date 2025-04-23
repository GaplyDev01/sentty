/*
  # Add AI Category Support to Existing Articles
  
  1. Changes
    - Updates existing articles with AI-related content to have more specific categories
  
  2. Purpose
    - Improves categorization and searchability of AI content
*/

-- Update articles with AI-related content to proper categories
UPDATE articles
SET category = 'artificial_intelligence'
WHERE (
  (title ILIKE '%artificial intelligence%' OR content ILIKE '%artificial intelligence%')
  OR (title ILIKE '%ai %' OR content ILIKE '%ai %')
  OR (title ILIKE '%ai-powered%' OR content ILIKE '%ai-powered%')
) 
AND category = 'general'
AND language = 'en';

-- Update ML specific articles
UPDATE articles
SET category = 'machine_learning'
WHERE (
  (title ILIKE '%machine learning%' OR content ILIKE '%machine learning%')
  OR (title ILIKE '%neural network%' OR content ILIKE '%neural network%')
  OR (title ILIKE '%deep learning%' OR content ILIKE '%deep learning%')
) 
AND category = 'general' 
AND language = 'en';

-- Update Large Language Model articles
UPDATE articles
SET category = 'llm'
WHERE (
  (title ILIKE '%llm%' OR content ILIKE '%llm%')
  OR (title ILIKE '%large language model%' OR content ILIKE '%large language model%')
  OR (title ILIKE '%chatgpt%' OR content ILIKE '%chatgpt%')
  OR (title ILIKE '%gpt-4%' OR content ILIKE '%gpt-4%')
) 
AND category = 'general'
AND language = 'en';

-- Update Generative AI articles
UPDATE articles
SET category = 'generative_ai'
WHERE (
  (title ILIKE '%generative ai%' OR content ILIKE '%generative ai%')
  OR (title ILIKE '%text-to-image%' OR content ILIKE '%text-to-image%')
  OR (title ILIKE '%stable diffusion%' OR content ILIKE '%stable diffusion%')
  OR (title ILIKE '%midjourney%' OR content ILIKE '%midjourney%')
  OR (title ILIKE '%dall-e%' OR content ILIKE '%dall-e%')
) 
AND category = 'general'
AND language = 'en';

-- Update AI Ethics articles
UPDATE articles
SET category = 'ai_ethics'
WHERE (
  (title ILIKE '%ai ethics%' OR content ILIKE '%ai ethics%')
  OR (title ILIKE '%ethical ai%' OR content ILIKE '%ethical ai%')
  OR (title ILIKE '%ai regulation%' OR content ILIKE '%ai regulation%')
  OR (title ILIKE '%responsible ai%' OR content ILIKE '%responsible ai%')
) 
AND category = 'general'
AND language = 'en';

-- Update AI Research articles
UPDATE articles
SET category = 'ai_research'
WHERE (
  (title ILIKE '%ai research%' OR content ILIKE '%ai research%')
  OR (title ILIKE '%ai paper%' OR content ILIKE '%ai paper%')
  OR (title ILIKE '%ai breakthrough%' OR content ILIKE '%ai breakthrough%')
) 
AND category = 'general'
AND language = 'en';

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_ai_categories',
    'timestamp', now(),
    'description', 'Updated existing articles with AI-related content to have more specific AI categories'
  )
);