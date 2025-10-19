-- ============================================
-- BACKUP SYSTEM MIGRATION
-- Creates automatic backup tables and functions
-- Run this BEFORE migration 002
-- ============================================

-- Create leaderboard backup table
CREATE TABLE IF NOT EXISTS leaderboard_backups (
  backup_id SERIAL PRIMARY KEY,
  backup_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  backup_reason TEXT,

  -- Original leaderboard data
  id UUID NOT NULL,
  player_name VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  correct_guesses INTEGER DEFAULT 0,
  total_guesses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_backups_date ON leaderboard_backups(backup_date DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_backups_original_id ON leaderboard_backups(id);

-- Function to create a full backup
CREATE OR REPLACE FUNCTION backup_leaderboard(reason TEXT DEFAULT 'Manual backup')
RETURNS INTEGER AS $$
DECLARE
  backup_count INTEGER;
BEGIN
  -- Insert all current leaderboard data into backup table
  INSERT INTO leaderboard_backups (
    backup_reason,
    id,
    player_name,
    score,
    correct_guesses,
    total_guesses,
    created_at
  )
  SELECT
    reason,
    id,
    player_name,
    score,
    correct_guesses,
    total_guesses,
    created_at
  FROM leaderboard;

  GET DIAGNOSTICS backup_count = ROW_COUNT;

  RETURN backup_count;
END;
$$ LANGUAGE plpgsql;

-- Function to restore from a specific backup
CREATE OR REPLACE FUNCTION restore_leaderboard_from_backup(backup_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
DECLARE
  restore_count INTEGER;
BEGIN
  -- Clear current leaderboard
  DELETE FROM leaderboard;

  -- Restore from backup
  INSERT INTO leaderboard (id, player_name, score, correct_guesses, total_guesses, created_at)
  SELECT DISTINCT ON (id)
    id,
    player_name,
    score,
    correct_guesses,
    total_guesses,
    created_at
  FROM leaderboard_backups
  WHERE backup_date <= backup_timestamp
  ORDER BY id, backup_date DESC;

  GET DIAGNOSTICS restore_count = ROW_COUNT;

  RETURN restore_count;
END;
$$ LANGUAGE plpgsql;

-- Create a backup right now
SELECT backup_leaderboard('Pre-migration backup - Pack system') as records_backed_up;

-- View all backups
CREATE OR REPLACE VIEW backup_summary AS
SELECT
  backup_date,
  backup_reason,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_score,
  MAX(created_at) as newest_score,
  MAX(score) as highest_score
FROM leaderboard_backups
GROUP BY backup_date, backup_reason
ORDER BY backup_date DESC;

-- Grant access
GRANT SELECT ON backup_summary TO anon, authenticated;

-- Enable RLS on backup table (read-only for public)
ALTER TABLE leaderboard_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON leaderboard_backups
  FOR SELECT
  USING (true);

-- Only service role can write to backups
CREATE POLICY "Restrict insert to service role" ON leaderboard_backups
  FOR INSERT
  WITH CHECK (false); -- Only backend can insert via function

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Backup system created successfully!';
  RAISE NOTICE 'Created backup of % records', (SELECT COUNT(*) FROM leaderboard_backups WHERE backup_reason = 'Pre-migration backup - Pack system');
END $$;
