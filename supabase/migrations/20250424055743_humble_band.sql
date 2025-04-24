/*
  # Create crypto_crawl_sites table

  1. New Tables
    - `crypto_crawl_sites`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `url` (text)
      - `type` (text)
      - `article_limit` (integer) - Number of articles to fetch
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on the table
    - Add policies for admins to manage sources
    - Add policies for authenticated users to view sources
    
  3. Initial Data
    - Insert popular cryptocurrency RSS feeds
*/

-- Create crypto_crawl_sites table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crypto_crawl_sites') THEN
    CREATE TABLE crypto_crawl_sites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL,
      url text NOT NULL,
      type text NOT NULL,
      article_limit integer DEFAULT 50,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable row level security
    ALTER TABLE crypto_crawl_sites ENABLE ROW LEVEL SECURITY;
    
    -- Add RLS policies
    CREATE POLICY "Admins can manage crypto_crawl_sites"
      ON crypto_crawl_sites
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
    
    CREATE POLICY "Anyone can view crypto_crawl_sites"
      ON crypto_crawl_sites
      FOR SELECT
      TO authenticated
      USING (true);
    
    -- Insert initial cryptocurrency news sources
    INSERT INTO crypto_crawl_sites (name, url, type, article_limit) VALUES
      ('CoinDesk', 'https://www.coindesk.com/arc/outboundfeeds/rss/', 'rss', 50),
      ('Cointelegraph', 'https://cointelegraph.com/rss', 'rss', 50),
      ('Bitcoin Magazine', 'https://bitcoinmagazine.com/.rss/full/', 'rss', 50),
      ('Decrypt', 'https://decrypt.co/feed', 'rss', 50),
      ('CryptoSlate', 'https://cryptoslate.com/feed/', 'rss', 50);
  END IF;
END $$;

-- Insert a log entry to track this migration
INSERT INTO aggregation_logs (event_type, status, details)
VALUES (
  'migration', 
  'success', 
  jsonb_build_object(
    'migration', 'add_crypto_crawl_sites',
    'timestamp', now(),
    'description', 'Added crypto_crawl_sites table with initial sources'
  )
);