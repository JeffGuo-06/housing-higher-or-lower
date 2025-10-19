-- ============================================
-- Migration 006: Setup Storage Policies for Selfies
-- Creates storage bucket and RLS policies for selfie uploads
-- ============================================

-- Step 1: Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('leaderboard-selfies', 'leaderboard-selfies', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow public uploads to leaderboard-selfies" ON storage.objects;
CREATE POLICY "Allow public uploads to leaderboard-selfies"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'leaderboard-selfies');

-- Step 4: Create policy to allow public reads from leaderboard-selfies bucket
DROP POLICY IF EXISTS "Allow public reads from leaderboard-selfies" ON storage.objects;
CREATE POLICY "Allow public reads from leaderboard-selfies"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'leaderboard-selfies');

-- Step 5: Create policy to allow public updates (for potential future use)
DROP POLICY IF EXISTS "Allow public updates to leaderboard-selfies" ON storage.objects;
CREATE POLICY "Allow public updates to leaderboard-selfies"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'leaderboard-selfies')
WITH CHECK (bucket_id = 'leaderboard-selfies');

-- Step 6: Create policy to allow public deletes (for potential future use)
DROP POLICY IF EXISTS "Allow public deletes from leaderboard-selfies" ON storage.objects;
CREATE POLICY "Allow public deletes from leaderboard-selfies"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'leaderboard-selfies');

-- Verify bucket configuration
SELECT * FROM storage.buckets WHERE id = 'leaderboard-selfies';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Storage bucket and RLS policies created successfully';
  RAISE NOTICE 'Bucket: leaderboard-selfies';
  RAISE NOTICE 'Policies: Public read/write access enabled';
  RAISE NOTICE '================================================';
END $$;
