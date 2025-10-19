-- ============================================
-- LEADERBOARD BACKUP SCRIPT
-- Run this in Supabase SQL Editor BEFORE migration
-- Save the output to restore if needed
-- ============================================

-- Option A: Export as INSERT statements
-- Copy the results and save to a .sql file

SELECT
  'INSERT INTO leaderboard (id, player_name, score, correct_guesses, total_guesses, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || replace(player_name, '''', '''''') || ''', ' ||
  score || ', ' ||
  correct_guesses || ', ' ||
  total_guesses || ', ' ||
  '''' || created_at || '''::timestamptz);' as backup_sql
FROM leaderboard
ORDER BY created_at;

-- Option B: Export as CSV (simpler, use Supabase Dashboard)
-- Database → Table Editor → leaderboard → Export as CSV
