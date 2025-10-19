-- ============================================
-- Migration 003: Add Selfie Support to Leaderboard
-- Allows users to optionally submit a selfie with their score
-- ============================================

-- Step 1: Add selfie_url column to leaderboard
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS selfie_url TEXT;

-- Step 2: Create index for faster queries when filtering by selfies
CREATE INDEX IF NOT EXISTS idx_leaderboard_selfie ON leaderboard(selfie_url) WHERE selfie_url IS NOT NULL;

-- Step 3: Create a storage bucket for selfies (run this in Supabase Dashboard if bucket doesn't exist)
-- Bucket name: "leaderboard-selfies"
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Step 4: Update RLS policy to allow selfie URLs (optional - selfie can be NULL)
-- No changes needed - existing INSERT policy already allows this

-- Success!
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Selfie support added to leaderboard';
  RAISE NOTICE 'Next: Create "leaderboard-selfies" bucket in Supabase Storage';
  RAISE NOTICE '================================================';
END $$;
