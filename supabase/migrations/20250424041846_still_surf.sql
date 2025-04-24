/*
  # Fix Missing Tables and Policies
  
  1. Changes
    - Creates missing tables: article_views, bookmarks
    - Adds proper RLS policies for all tables
    - Removes update_frequency from user_preferences table
    - Ensures all required indexes and constraints are in place
    
  2. Purpose
    - Fixes "relation does not exist" errors in application
    - Ensures security through proper row level security policies
    - Matches database schema with application requirements
*/

-- Create aggregation_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.aggregation_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    status text NOT NULL,
    details jsonb NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT aggregation_logs_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS aggregation_logs_event_type_idx ON public.aggregation_logs USING btree (event_type);
CREATE INDEX IF NOT EXISTS aggregation_logs_status_idx ON public.aggregation_logs USING btree (status);
CREATE INDEX IF NOT EXISTS aggregation_logs_created_at_idx ON public.aggregation_logs USING btree (created_at DESC);

-- Enable RLS on aggregation_logs table
ALTER TABLE public.aggregation_logs ENABLE ROW LEVEL SECURITY;

-- Policies for aggregation_logs table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage aggregation logs' AND tablename = 'aggregation_logs') THEN
    CREATE POLICY "Admins can manage aggregation logs"
    ON public.aggregation_logs
    USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view aggregation logs' AND tablename = 'aggregation_logs') THEN
    CREATE POLICY "Anyone can view aggregation logs"
    ON public.aggregation_logs
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Create article_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.article_views (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    article_id uuid NOT NULL,
    viewed_at timestamp with time zone NOT NULL DEFAULT now(),
    view_duration integer NULL,
    CONSTRAINT article_views_pkey PRIMARY KEY (id)
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'article_views_article_id_fkey'
  ) THEN
    ALTER TABLE public.article_views 
    ADD CONSTRAINT article_views_article_id_fkey 
    FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'article_views_user_id_fkey'
  ) THEN
    ALTER TABLE public.article_views 
    ADD CONSTRAINT article_views_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indices if they don't exist
CREATE INDEX IF NOT EXISTS article_views_user_id_idx ON public.article_views USING btree (user_id);
CREATE INDEX IF NOT EXISTS article_views_article_id_idx ON public.article_views USING btree (article_id);
CREATE INDEX IF NOT EXISTS article_views_viewed_at_idx ON public.article_views USING btree (viewed_at DESC);

-- Enable RLS on article_views table
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

-- Policies for article_views table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own article views' AND tablename = 'article_views') THEN
    CREATE POLICY "Users can view their own article views"
    ON public.article_views
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own article views' AND tablename = 'article_views') THEN
    CREATE POLICY "Users can insert their own article views"
    ON public.article_views
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all article views' AND tablename = 'article_views') THEN
    CREATE POLICY "Admins can view all article views"
    ON public.article_views
    FOR SELECT
    USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END $$;

-- Create bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    article_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    note text NULL,
    CONSTRAINT bookmarks_pkey PRIMARY KEY (id)
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookmarks_article_id_fkey'
  ) THEN
    ALTER TABLE public.bookmarks 
    ADD CONSTRAINT bookmarks_article_id_fkey 
    FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookmarks_user_id_fkey'
  ) THEN
    ALTER TABLE public.bookmarks 
    ADD CONSTRAINT bookmarks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indices if they don't exist
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks USING btree (user_id);
CREATE INDEX IF NOT EXISTS bookmarks_article_id_idx ON public.bookmarks USING btree (article_id);
CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx ON public.bookmarks USING btree (created_at DESC);

-- Enable RLS on bookmarks table
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies for bookmarks table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own bookmarks' AND tablename = 'bookmarks') THEN
    CREATE POLICY "Users can view their own bookmarks"
    ON public.bookmarks
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own bookmarks' AND tablename = 'bookmarks') THEN
    CREATE POLICY "Users can insert their own bookmarks"
    ON public.bookmarks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own bookmarks' AND tablename = 'bookmarks') THEN
    CREATE POLICY "Users can update their own bookmarks"
    ON public.bookmarks
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own bookmarks' AND tablename = 'bookmarks') THEN
    CREATE POLICY "Users can delete their own bookmarks"
    ON public.bookmarks
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all bookmarks' AND tablename = 'bookmarks') THEN
    CREATE POLICY "Admins can view all bookmarks"
    ON public.bookmarks
    FOR SELECT
    USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END $$;

-- Enable RLS on articles table if not already enabled
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Ensure articles table has proper RLS policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view articles' AND tablename = 'articles') THEN
    CREATE POLICY "Anyone can view articles"
    ON public.articles
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert, update, delete articles' AND tablename = 'articles') THEN
    CREATE POLICY "Admins can insert, update, delete articles"
    ON public.articles
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE (profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)
      )
    );
  END IF;
END $$;

-- Ensure coindesk_cache has proper RLS policies
ALTER TABLE IF EXISTS public.coindesk_cache ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'coindesk_cache') AND 
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage coindesk_cache' AND tablename = 'coindesk_cache') THEN
    CREATE POLICY "Admins can manage coindesk_cache"
    ON public.coindesk_cache
    USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END $$;

-- Ensure system_settings has proper RLS policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage system settings' AND tablename = 'system_settings') THEN
    CREATE POLICY "Admins can manage system settings"
    ON public.system_settings
    USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view system settings' AND tablename = 'system_settings') THEN
    CREATE POLICY "Anyone can view system settings"
    ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Ensure user_preferences has the correct schema and RLS policies
DO $$
BEGIN
  -- Check if update_frequency column exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' AND column_name = 'update_frequency'
  ) THEN
    ALTER TABLE user_preferences DROP COLUMN update_frequency;
  END IF;
END $$;

-- Ensure user_preferences has proper RLS policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all user preferences' AND tablename = 'user_preferences') THEN
    CREATE POLICY "Admins can view all user preferences"
    ON public.user_preferences
    FOR SELECT
    USING (EXISTS ( SELECT 1
      FROM public.profiles
      WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own preferences' AND tablename = 'user_preferences') THEN
    CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK ((auth.uid() = user_id));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own preferences' AND tablename = 'user_preferences') THEN
    CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING ((auth.uid() = user_id));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own preferences' AND tablename = 'user_preferences') THEN
    CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Insert a log entry for this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'system_migration', 
  'success', 
  jsonb_build_object(
    'migration', 'fix_missing_tables',
    'timestamp', now(),
    'description', 'Fixed article_views and bookmarks tables, updated RLS policies'
  )
);