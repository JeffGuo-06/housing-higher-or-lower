-- Migration 002: Add Pack System
-- This migration adds support for multiple property packs with separate leaderboards

-- Step 1: Create packs table
CREATE TABLE IF NOT EXISTS packs (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20), -- 'easy', 'medium', 'hard'
  property_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 2: Add pack_id to leaderboard table
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS pack_id INTEGER REFERENCES packs(id) DEFAULT 1;

-- Step 3: Create index on leaderboard pack_id for faster queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_pack_id ON leaderboard(pack_id);

-- Step 4: Create composite index for pack-specific leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_pack_score ON leaderboard(pack_id, score DESC, created_at ASC);

-- Step 5: Update the get_top_scores function to support pack filtering
CREATE OR REPLACE FUNCTION get_top_scores(limit_count INTEGER DEFAULT 10, filter_pack_id INTEGER DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  player_name VARCHAR(50),
  score INTEGER,
  correct_guesses INTEGER,
  total_guesses INTEGER,
  pack_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.player_name,
    l.score,
    l.correct_guesses,
    l.total_guesses,
    l.pack_id,
    l.created_at
  FROM leaderboard l
  WHERE (filter_pack_id IS NULL OR l.pack_id = filter_pack_id)
  ORDER BY l.score DESC, l.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 6: Insert initial packs
-- Pack 1: Original small pack (will be retroactively assigned to existing properties)
INSERT INTO packs (id, name, description, difficulty, property_count, is_active)
VALUES (
  1,
  'Classic Pack',
  'The original property pack - smaller and easier to master',
  'easy',
  0, -- Will be updated when properties are assigned
  true
)
ON CONFLICT (id) DO NOTHING;

-- Pack 2: New extended pack with all properties
INSERT INTO packs (id, name, description, difficulty, property_count, is_active)
VALUES (
  2,
  'Extended Pack',
  'A larger, more challenging collection of properties from across Canada',
  'medium',
  0, -- Will be updated when properties are uploaded
  true
)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Create a function to get pack statistics
CREATE OR REPLACE FUNCTION get_pack_stats(filter_pack_id INTEGER)
RETURNS TABLE (
  pack_id INTEGER,
  pack_name VARCHAR(100),
  total_players INTEGER,
  avg_score NUMERIC,
  highest_score INTEGER,
  total_games INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    COUNT(DISTINCT l.player_name)::INTEGER as total_players,
    ROUND(AVG(l.score), 2) as avg_score,
    MAX(l.score) as highest_score,
    COUNT(l.id)::INTEGER as total_games
  FROM packs p
  LEFT JOIN leaderboard l ON p.id = l.pack_id
  WHERE p.id = filter_pack_id
  GROUP BY p.id, p.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 8: Update RLS policies to work with pack_id
-- The existing policies should continue to work, but we'll recreate them to be explicit

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON leaderboard;
DROP POLICY IF EXISTS "Allow public insert access" ON leaderboard;

-- Recreate policies
CREATE POLICY "Allow public read access" ON leaderboard
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access" ON leaderboard
  FOR INSERT
  WITH CHECK (pack_id IS NOT NULL AND pack_id IN (SELECT id FROM packs WHERE is_active = true));

-- Step 9: Enable RLS on packs table
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to packs
CREATE POLICY "Allow public read access" ON packs
  FOR SELECT
  USING (true);

-- Step 10: Create a view for active packs (easier querying from frontend)
CREATE OR REPLACE VIEW active_packs AS
SELECT
  id,
  name,
  description,
  difficulty,
  property_count,
  created_at
FROM packs
WHERE is_active = true
ORDER BY id;

-- Grant access to the view
GRANT SELECT ON active_packs TO anon, authenticated;

-- Step 11: Update get_random_property function to support pack filtering
-- This function is used by the API to fetch random properties
CREATE OR REPLACE FUNCTION get_random_property(
  property_country VARCHAR(2),
  filter_pack_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  mls_number VARCHAR(50),
  property_id VARCHAR(50),
  address TEXT,
  city VARCHAR(255),
  state VARCHAR(50),
  province VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(2),
  latitude NUMERIC,
  longitude NUMERIC,
  price INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  sqft INTEGER,
  lot_size VARCHAR(50),
  year_built INTEGER,
  property_type VARCHAR(100),
  listing_url TEXT,
  image_url TEXT,
  image_url_med TEXT,
  image_url_low TEXT,
  pack_id INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.mls_number,
    p.property_id,
    p.address,
    p.city,
    p.state,
    p.province,
    p.postal_code,
    p.country,
    p.latitude,
    p.longitude,
    p.price,
    p.bedrooms,
    p.bathrooms,
    p.sqft,
    p.lot_size,
    p.year_built,
    p.property_type,
    p.listing_url,
    p.image_url,
    p.image_url_med,
    p.image_url_low,
    p.pack_id
  FROM properties p
  WHERE p.country = property_country
    AND (filter_pack_id IS NULL OR p.pack_id = filter_pack_id)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Note: After running this migration, you'll need to:
-- 1. Update existing leaderboard entries to pack_id = 1 (if needed, already defaulted)
-- 2. Upload Pack 2 properties to the properties table with pack_id = 2
-- 3. Update the property_count in the packs table for both packs
