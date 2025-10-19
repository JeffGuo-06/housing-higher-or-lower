-- ============================================
-- Update Pack Names to PACK_01 and PACK_02
-- Run this in Supabase SQL Editor
-- ============================================

-- Update Pack 1 name
UPDATE packs
SET
  name = 'PACK_01',
  description = 'The original property pack - smaller and easier to master'
WHERE id = 1;

-- Update Pack 2 name
UPDATE packs
SET
  name = 'PACK_02',
  description = 'A larger, more challenging collection of properties from across Canada'
WHERE id = 2;

-- Verify the changes
SELECT id, name, description, difficulty, property_count
FROM packs
ORDER BY id;
