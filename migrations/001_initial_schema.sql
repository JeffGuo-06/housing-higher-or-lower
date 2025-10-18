-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  correct_guesses INTEGER DEFAULT 0,
  total_guesses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Constraints
  CONSTRAINT score_positive CHECK (score >= 0),
  CONSTRAINT correct_guesses_positive CHECK (correct_guesses >= 0),
  CONSTRAINT total_guesses_positive CHECK (total_guesses >= 0),
  CONSTRAINT correct_not_greater_than_total CHECK (correct_guesses <= total_guesses)
);

-- Create index on score for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read leaderboard (for public viewing)
CREATE POLICY "Allow public read access" ON leaderboard
  FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert scores (for submitting new scores)
CREATE POLICY "Allow public insert access" ON leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Optional: Create a function to get top N scores
CREATE OR REPLACE FUNCTION get_top_scores(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  player_name VARCHAR(50),
  score INTEGER,
  correct_guesses INTEGER,
  total_guesses INTEGER,
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
    l.created_at
  FROM leaderboard l
  ORDER BY l.score DESC, l.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
