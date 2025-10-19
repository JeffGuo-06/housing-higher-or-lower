# Migration Safety Comparison

## ⚠️ CRITICAL DIFFERENCES: Original vs SAFE Migration

### **Use: `002_add_pack_system_SAFE.sql` for production!**

---

## Key Issues Fixed in SAFE Version

### 🔴 **Issue #1: Breaking INSERT Policy (CRITICAL)**

**Original Migration (Line 115-117):**
```sql
CREATE POLICY "Allow public insert access" ON leaderboard
  FOR INSERT
  WITH CHECK (pack_id IS NOT NULL AND pack_id IN (SELECT id FROM packs WHERE is_active = true));
```

**Problem:**
- Requires `pack_id` to be NOT NULL
- Your current production code doesn't send `pack_id` when submitting scores
- **Result: ALL score submissions will fail immediately after migration!** 🚨

**SAFE Version:**
```sql
CREATE POLICY "Allow public insert access" ON leaderboard
  FOR INSERT
  WITH CHECK (
    -- Allow NULL pack_id (for old code) OR valid pack_id
    pack_id IS NULL OR pack_id IN (SELECT id FROM packs WHERE is_active = true)
  );
```

**Why it's safe:**
- Allows NULL pack_id (existing code works)
- DEFAULT 1 on the column means NULL becomes 1 automatically
- New code can explicitly set pack_id, old code continues working

---

### 🟡 **Issue #2: Missing NULL Handling in Functions**

**Original Migration:**
```sql
-- get_random_property function doesn't handle NULL pack_id properly
WHERE p.country = property_country
  AND (filter_pack_id IS NULL OR p.pack_id = filter_pack_id)
```

**Problem:** If properties have NULL pack_id, they won't be returned

**SAFE Version:**
```sql
WHERE p.country = property_country
  AND (filter_pack_id IS NULL OR COALESCE(p.pack_id, 1) = filter_pack_id)
```

**Added:** `COALESCE(p.pack_id, 1)` treats NULL as Pack 1

---

### 🟡 **Issue #3: Properties Table Might Not Exist**

**Original Migration:**
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pack_id ...
```

**Problem:** Errors if properties table doesn't exist yet

**SAFE Version:**
```sql
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS pack_id INTEGER REFERENCES packs(id) DEFAULT 1;
  END IF;
END $$;
```

**Why it's safe:** Checks if table exists first

---

### ✅ **Issue #4: Automatic Data Migration**

**SAFE Version adds:**
```sql
-- Update existing leaderboard entries to Pack 1 (if any are NULL)
UPDATE leaderboard SET pack_id = 1 WHERE pack_id IS NULL;

-- Update existing properties to Pack 1 (if any are NULL)
UPDATE properties SET pack_id = 1 WHERE pack_id IS NULL;
```

**Benefit:** Ensures all existing data is assigned to Pack 1 automatically

---

### ✅ **Issue #5: Better Error Reporting**

**SAFE Version adds:**
```sql
RAISE NOTICE '================================================';
RAISE NOTICE 'MIGRATION COMPLETE - Pack System Initialized';
RAISE NOTICE 'Total leaderboard entries: %', leaderboard_total;
RAISE NOTICE 'Pack 1 leaderboard entries: %', pack1_count;
RAISE NOTICE 'Pack 2 leaderboard entries: %', pack2_count;
```

**Benefit:** Shows migration results immediately

---

## Side-by-Side Comparison

| Feature | Original | SAFE Version | Impact |
|---------|----------|--------------|--------|
| **INSERT Policy** | Requires pack_id | Allows NULL or pack_id | 🔴 CRITICAL - Prevents breakage |
| **NULL Handling** | No COALESCE | Uses COALESCE | 🟡 Prevents missing data |
| **Table Existence Check** | No check | Checks before ALTER | 🟡 Prevents errors |
| **Auto Data Migration** | Manual | Automatic | ✅ Convenience |
| **Verification Output** | None | Detailed notices | ✅ Visibility |
| **Backward Compatibility** | ❌ Breaks old code | ✅ Fully compatible | 🔴 CRITICAL |

---

## Migration Timeline (What Happens When)

### Using Original Migration ❌
```
1. Run migration
2. Deploy new API code
   ⚠️ GAP: Old API still running, users CAN'T submit scores!
   ⚠️ Users see errors when trying to submit
3. Old code fails: "RLS policy violation"
```

### Using SAFE Migration ✅
```
1. Run migration
   ✅ Old API still works perfectly
   ✅ Users can still submit scores
   ✅ All scores go to Pack 1 by default
2. Deploy new API code (at your leisure)
   ✅ New code can use pack_id parameter
   ✅ Old code continues working
3. No downtime, no errors!
```

---

## Testing the Migration

### Run These Queries After Migration

```sql
-- 1. Verify packs were created
SELECT * FROM packs;
-- Expected: 2 packs (Classic and Extended)

-- 2. Verify all leaderboard entries have pack_id
SELECT
  COUNT(*) as total,
  COUNT(pack_id) as with_pack_id,
  COUNT(*) - COUNT(pack_id) as null_pack_ids
FROM leaderboard;
-- Expected: null_pack_ids = 0

-- 3. Test old-style leaderboard fetch (no pack_id)
SELECT * FROM get_top_scores(10, NULL);
-- Expected: Returns all scores from all packs

-- 4. Test pack-specific fetch
SELECT * FROM get_top_scores(10, 1);
-- Expected: Returns only Pack 1 scores

-- 5. Verify RLS policy allows NULL pack_id
-- (This simulates old code submitting a score)
INSERT INTO leaderboard (player_name, score, correct_guesses, total_guesses)
VALUES ('Test User', 100, 5, 10);
-- Expected: SUCCESS (pack_id defaults to 1)

-- 6. Clean up test
DELETE FROM leaderboard WHERE player_name = 'Test User';
```

---

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

```sql
-- 1. Remove pack_id column from leaderboard
ALTER TABLE leaderboard DROP COLUMN IF EXISTS pack_id;

-- 2. Remove pack_id from properties (if exists)
ALTER TABLE properties DROP COLUMN IF EXISTS pack_id;

-- 3. Drop new functions
DROP FUNCTION IF EXISTS get_pack_stats(INTEGER);
DROP FUNCTION IF EXISTS get_all_packs_with_stats();

-- 4. Restore original get_top_scores function
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

-- 5. Drop packs table
DROP TABLE IF EXISTS packs CASCADE;

-- 6. Restore old RLS policies
DROP POLICY IF EXISTS "Allow public read access" ON leaderboard;
DROP POLICY IF EXISTS "Allow public insert access" ON leaderboard;

CREATE POLICY "Allow public read access" ON leaderboard
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access" ON leaderboard
  FOR INSERT
  WITH CHECK (true);
```

---

## Recommendation

✅ **Use `002_add_pack_system_SAFE.sql`**

This version:
- ✅ Won't break production
- ✅ Won't cause downtime
- ✅ Allows gradual rollout
- ✅ Backward compatible
- ✅ Auto-migrates existing data
- ✅ Provides verification output

The original migration would cause **immediate production breakage** when users try to submit scores!

---

## After Migration Checklist

- [ ] Run migration in Supabase SQL Editor
- [ ] Check migration output notices
- [ ] Run verification queries above
- [ ] Test score submission (should still work with old code)
- [ ] Deploy new API code when ready
- [ ] Upload Pack 2 properties
- [ ] Test pack-specific endpoints

---

**Migration Status: READY FOR PRODUCTION** ✅
