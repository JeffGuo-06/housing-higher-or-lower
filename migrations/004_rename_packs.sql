-- ============================================
-- Migration 004: Rename Packs to PACK_01 and PACK_02
-- Updates pack names to use standardized naming
-- ============================================

-- Update Pack 1 name
UPDATE packs
SET name = 'PACK_01'
WHERE id = 1;

-- Update Pack 2 name
UPDATE packs
SET name = 'PACK_02'
WHERE id = 2;

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Pack names updated successfully';
  RAISE NOTICE 'Pack 1: PACK_01';
  RAISE NOTICE 'Pack 2: PACK_02';
  RAISE NOTICE '================================================';
END $$;

-- View updated packs
SELECT id, name, description, difficulty FROM packs ORDER BY id;
