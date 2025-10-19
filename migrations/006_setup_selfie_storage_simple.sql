-- ============================================
-- Migration 006: Setup Storage Bucket for Selfies
-- Creates storage bucket (configure policies via Dashboard)
-- ============================================

-- Create the storage bucket as public
INSERT INTO storage.buckets (id, name, public)
VALUES ('leaderboard-selfies', 'leaderboard-selfies', true)
ON CONFLICT (id) DO NOTHING;

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'leaderboard-selfies';

-- Next steps:
-- 1. Go to Supabase Dashboard → Storage → Policies
-- 2. Create policy for INSERT: bucket_id = 'leaderboard-selfies'
-- 3. Create policy for SELECT: bucket_id = 'leaderboard-selfies'
