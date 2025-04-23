/*
  # Initial schema for SophIQ news aggregator

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `username` (text)
      - `avatar_url` (text)
      - `role` (text)
      - `created_at` (timestamp)
      - `last_login` (timestamp)
    
    - `articles`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `source` (text)
      - `url` (text)
      - `image_url` (text)
      - `published_at` (timestamp)
      - `created_at` (timestamp)
      - `relevance_score` (integer)
      - `category` (text)
      - `tags` (text array)
    
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `keywords` (text array)
      - `categories` (text array)
      - `sources` (text array)
      - `excluded_keywords` (text array)
      - `update_frequency` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for profile access
    - Add policies for articles
    - Add policies for user preferences
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text NOT NULL,
  avatar_url text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  source text NOT NULL,
  url text NOT NULL,
  image_url text,
  published_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  relevance_score int,
  category text NOT NULL,
  tags text[]
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  keywords text[],
  categories text[],
  sources text[],
  excluded_keywords text[],
  update_frequency text NOT NULL DEFAULT '15min',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Articles RLS policies
CREATE POLICY "Anyone can view articles"
  ON articles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert, update, delete articles"
  ON articles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- User preferences RLS policies
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user preferences"
  ON user_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create function to create a profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role, created_at)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'user',
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update last_login in profiles
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = now()
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update last_login on auth sign in
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (old.last_sign_in_at IS DISTINCT FROM new.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_login();