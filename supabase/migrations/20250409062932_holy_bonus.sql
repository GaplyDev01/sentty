/*
  # Add Bookmarks and Article History Systems
  
  1. New Tables
     - `bookmarks`
       - `id` (uuid, primary key)
       - `user_id` (uuid, foreign key to profiles)
       - `article_id` (uuid, foreign key to articles)
       - `created_at` (timestamp)
       - `note` (text) - Optional user note about the bookmark
     
     - `article_views`
       - `id` (uuid, primary key)
       - `user_id` (uuid, foreign key to profiles)
       - `article_id` (uuid, foreign key to articles)
       - `viewed_at` (timestamp)
       - `view_duration` (integer) - Optional tracking of view time in seconds
  
  2. Security
     - Enable RLS on both tables
     - Add policies to allow users to manage their own bookmarks and view history
     - Allow admins to view all bookmarks and history but only for analytics
  
  3. Indices
     - Add indices for efficient querying
*/

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  note text,
  UNIQUE(user_id, article_id)
);

-- Create article_views table
CREATE TABLE IF NOT EXISTS article_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  view_duration integer -- in seconds
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- Add indices for performance
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS bookmarks_article_id_idx ON bookmarks(article_id);
CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx ON bookmarks(created_at DESC);

CREATE INDEX IF NOT EXISTS article_views_user_id_idx ON article_views(user_id);
CREATE INDEX IF NOT EXISTS article_views_article_id_idx ON article_views(article_id);
CREATE INDEX IF NOT EXISTS article_views_viewed_at_idx ON article_views(viewed_at DESC);

-- User policies for bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- User policies for article_views
CREATE POLICY "Users can view their own article views"
  ON article_views
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own article views"
  ON article_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin policies for bookmarks
CREATE POLICY "Admins can view all bookmarks"
  ON bookmarks
  FOR SELECT
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Admin policies for article_views
CREATE POLICY "Admins can view all article views"
  ON article_views
  FOR SELECT
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Log migration completion
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_bookmarks_and_history',
    'timestamp', now(),
    'description', 'Added bookmarks and article views tracking system'
  )
);