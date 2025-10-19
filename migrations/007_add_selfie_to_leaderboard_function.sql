-- Migration 007: Add selfie_url to get_top_scores function
-- This migration updates the get_top_scores function to include selfie_url in the response

-- Drop the existing function first (required when changing return type)
DROP FUNCTION IF EXISTS get_top_scores(INTEGER, INTEGER);

-- Create the updated function with selfie_url in the response
CREATE OR REPLACE FUNCTION get_top_scores(limit_count INTEGER DEFAULT 10, filter_pack_id INTEGER DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  player_name VARCHAR(50),
  score INTEGER,
  correct_guesses INTEGER,
  total_guesses INTEGER,
  pack_id INTEGER,
  selfie_url TEXT,
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
    l.selfie_url,
    l.created_at
  FROM leaderboard l
  WHERE (filter_pack_id IS NULL OR l.pack_id = filter_pack_id)
  ORDER BY l.score DESC, l.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
