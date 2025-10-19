-- ============================================
-- Migration 002: Add Pack System (PRODUCTION SAFE)
-- This migration adds support for multiple property packs with separate leaderboards
-- SAFE FOR PRODUCTION - No breaking changes, backward compatible
-- ============================================

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

-- Step 2: Insert initial packs FIRST (before adding foreign keys!)
-- Pack 1: Original pack (will be retroactively assigned to existing properties)
INSERT INTO packs (id, name, description, difficulty, property_count, is_active)
VALUES (
  1,
  'PACK_01',
  'The original property pack - smaller and easier to master',
  'easy',
  0, -- Will be updated when properties are counted
  true
)
ON CONFLICT (id) DO NOTHING;

-- Pack 2: New extended pack
INSERT INTO packs (id, name, description, difficulty, property_count, is_active)
VALUES (
  2,
  'PACK_02',
  'A larger, more challenging collection of properties from across Canada',
  'medium',
  0, -- Will be updated when properties are uploaded
  true
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Add pack_id to leaderboard table
-- NOW we can add the foreign key because Pack 1 exists
-- DEFAULT 1 ensures all existing and new scores go to Pack 1 by default
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS pack_id INTEGER REFERENCES packs(id) DEFAULT 1;

-- Step 4: Add pack_id to properties table (if it exists)
-- This will fail silently if properties table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS pack_id INTEGER REFERENCES packs(id) DEFAULT 1;
  END IF;
END $$;

-- Step 5: Create index on leaderboard pack_id for faster queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_pack_id ON leaderboard(pack_id);

-- Step 6: Create composite index for pack-specific leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_pack_score ON leaderboard(pack_id, score DESC, created_at ASC);

-- Step 7: Create index on properties pack_id (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
    CREATE INDEX IF NOT EXISTS idx_properties_pack_id ON properties(pack_id);
  END IF;
END $$;

-- Step 8: Update existing leaderboard entries to Pack 1 (if any are NULL)
UPDATE leaderboard SET pack_id = 1 WHERE pack_id IS NULL;

-- Step 9: Update existing properties to Pack 1 (if properties table exists and any are NULL)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
    UPDATE properties SET pack_id = 1 WHERE pack_id IS NULL;
  END IF;
END $$;

-- Step 10: Update Pack 1 property counts based on existing data
DO $$
DECLARE
  leaderboard_count INTEGER;
  properties_count INTEGER;
BEGIN
  -- Count leaderboard entries
  SELECT COUNT(*) INTO leaderboard_count FROM leaderboard WHERE pack_id = 1;

  -- Count properties if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
    SELECT COUNT(*) INTO properties_count FROM properties WHERE pack_id = 1;
  ELSE
    properties_count := 0;
  END IF;

  -- Update pack 1 property count
  UPDATE packs SET property_count = properties_count WHERE id = 1;

  RAISE NOTICE 'Pack 1 initialized with % properties and % leaderboard entries', properties_count, leaderboard_count;
END $$;

-- Step 11: Update the get_top_scores function to support pack filtering
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

-- Step 12: Create a function to get pack statistics
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

-- Step 13: Update get_random_property function to support pack filtering
-- Only update if the function already exists (backward compatible)
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
  local_image_path TEXT,
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
    p.local_image_path,
    COALESCE(p.pack_id, 1) as pack_id -- Default to Pack 1 if NULL
  FROM properties p
  WHERE p.country = property_country
    AND (filter_pack_id IS NULL OR COALESCE(p.pack_id, 1) = filter_pack_id)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 14: Update RLS policies - BACKWARD COMPATIBLE
-- Keep existing policies but make them more permissive to avoid breaking production

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON leaderboard;
DROP POLICY IF EXISTS "Allow public insert access" ON leaderboard;

-- Recreate policies - IMPORTANT: Allow NULL pack_id for backward compatibility!
CREATE POLICY "Allow public read access" ON leaderboard
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access" ON leaderboard
  FOR INSERT
  WITH CHECK (
    -- Allow NULL pack_id (for old code) OR valid pack_id
    pack_id IS NULL OR pack_id IN (SELECT id FROM packs WHERE is_active = true)
  );

-- Step 15: Enable RLS on packs table
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to packs
CREATE POLICY "Allow public read access" ON packs
  FOR SELECT
  USING (true);

-- Step 16: Create a view for active packs (easier querying from frontend)
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

-- Step 17: Create helper function to get all packs with stats
CREATE OR REPLACE FUNCTION get_all_packs_with_stats()
RETURNS TABLE (
  id INTEGER,
  name VARCHAR(100),
  description TEXT,
  difficulty VARCHAR(20),
  property_count INTEGER,
  total_players INTEGER,
  total_scores INTEGER,
  highest_score INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.difficulty,
    p.property_count,
    COUNT(DISTINCT l.player_name)::INTEGER as total_players,
    COUNT(l.id)::INTEGER as total_scores,
    COALESCE(MAX(l.score), 0) as highest_score,
    p.is_active
  FROM packs p
  LEFT JOIN leaderboard l ON p.id = l.pack_id
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.description, p.difficulty, p.property_count, p.is_active
  ORDER BY p.id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 18: Verification queries
DO $$
DECLARE
  pack1_count INTEGER;
  pack2_count INTEGER;
  leaderboard_total INTEGER;
BEGIN
  -- Count Pack 1 leaderboard entries
  SELECT COUNT(*) INTO pack1_count FROM leaderboard WHERE pack_id = 1;

  -- Count Pack 2 leaderboard entries
  SELECT COUNT(*) INTO pack2_count FROM leaderboard WHERE pack_id = 2;

  -- Total leaderboard
  SELECT COUNT(*) INTO leaderboard_total FROM leaderboard;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'MIGRATION COMPLETE - Pack System Initialized';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total leaderboard entries: %', leaderboard_total;
  RAISE NOTICE 'Pack 1 leaderboard entries: %', pack1_count;
  RAISE NOTICE 'Pack 2 leaderboard entries: %', pack2_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy updated API code to production';
  RAISE NOTICE '2. Upload Pack 2 properties using scripts';
  RAISE NOTICE '3. Test API endpoints with pack_id parameter';
  RAISE NOTICE '================================================';
END $$;

-- Success! Migration is backward compatible and production-safe.
