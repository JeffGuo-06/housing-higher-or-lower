# Pack 2 Deployment Guide

This guide will walk you through deploying Pack 2 (Extended Pack) to your Housing Higher or Lower game.

## Overview

Pack 2 is a larger, more challenging collection of Canadian properties that will have its own separate leaderboard. This keeps the competition fair and allows users to choose their difficulty level.

## Prerequisites

- Supabase account and project set up
- Environment variables configured (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Python 3.x installed (for upload scripts)
- Required Python packages: `python-dotenv`, `supabase`

Install Python dependencies:
```bash
pip install python-dotenv supabase
```

## Step-by-Step Deployment

### Step 1: Run the Database Migration

**⚠️ IMPORTANT: Use the SAFE migration for production!**

1. Open your Supabase Dashboard
2. Navigate to the SQL Editor
3. Open the migration file: `migrations/002_add_pack_system_SAFE.sql` (**NOT** the original)
4. Copy the entire contents and paste into the SQL Editor
5. Click "Run" to execute the migration

**Why SAFE version?**
- The original migration breaks score submissions immediately
- SAFE version is backward compatible - old code continues working
- See `migrations/MIGRATION_SAFETY_COMPARISON.md` for details

**What this does:**
- Creates the `packs` table to store pack metadata
- Adds `pack_id` column to the `leaderboard` table
- Updates the `get_random_property()` function to support pack filtering
- Updates the `get_top_scores()` function to filter by pack
- Creates Pack 1 (Classic) and Pack 2 (Extended) entries
- Sets up all necessary indexes and RLS policies

**Verify it worked:**
```sql
-- Check that packs were created
SELECT * FROM packs;

-- Should show:
-- Pack 1 - Classic Pack (easy)
-- Pack 2 - Extended Pack (medium)
```

### Step 2: Update Existing Data (Pack 1)

If you have existing properties in your database, they need to be assigned to Pack 1:

```sql
-- Update existing properties to Pack 1
UPDATE properties
SET pack_id = 1
WHERE pack_id IS NULL;

-- Update Pack 1 property count
UPDATE packs
SET property_count = (SELECT COUNT(*) FROM properties WHERE pack_id = 1)
WHERE id = 1;

-- Verify
SELECT id, name, property_count FROM packs;
```

### Step 3: Upload Pack 2 Images to Supabase Storage

**Option A: Using the Python Script (Recommended)**

1. Ensure your local images are in `scripts/images_ca_selenium/`
2. Run the upload script:
```bash
cd scripts
python upload_pack2_images.py
```

This script will:
- Upload all images to Supabase Storage under `property-images/pack2/`
- Create a new JSON file with Supabase image URLs: `properties_ca_selenium_with_supabase_urls.json`
- Show progress and summary of uploads

**Option B: Using the Dev Page UI**

If you prefer a UI approach, you can upload images through the Supabase dashboard manually.

### Step 4: Import Pack 2 Properties to Database

**Option A: Using the Python Script (Recommended)**

1. Make sure Step 3 is complete (images uploaded)
2. Run the import script:
```bash
cd scripts
python import_pack2_to_supabase.py
```

This script will:
- Read properties from `properties_ca_selenium_with_supabase_urls.json`
- Add `pack_id = 2` to each property
- Import in batches to Supabase
- Handle duplicates gracefully
- Update the Pack 2 property count

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║             PACK 2 PROPERTY IMPORT TOOL                    ║
║  This will import properties with pack_id = 2              ║
╚════════════════════════════════════════════════════════════╝

✓ Found JSON with Supabase image URLs
Loaded 1,234 properties from JSON
  ✓ Batch 1: Imported 100 properties
  ✓ Batch 2: Imported 100 properties
  ...

PACK 2 IMPORT SUMMARY
✓ Successfully imported: 1,234
⚠ Skipped (duplicates/invalid): 0
✗ Failed: 0

Pack 2 Statistics:
  Total Properties: 1,234
  Avg Price: $2,845
  Price Range: $850 - $15,000
```

**Option B: Using the Dev Page UI**

1. Start your development server: `npm run dev`
2. Navigate to `/dev` in your browser
3. Click "Add to Database"
4. Select `properties_ca_selenium_with_supabase_urls.json` (or `properties_ca_selenium.json`)
5. Make sure "Pack 2 - Extended (Medium)" is selected in the dropdown
6. Click through each property, clicking "Add to Pack 2" for each one

### Step 5: Verify the Deployment

Run these SQL queries in Supabase to verify everything worked:

```sql
-- Check Pack 2 property count
SELECT id, name, property_count FROM packs WHERE id = 2;

-- View sample Pack 2 properties
SELECT address, city, price, pack_id
FROM properties
WHERE pack_id = 2
LIMIT 5;

-- Test random property fetch for Pack 2
SELECT * FROM get_random_property('CA', 2);

-- Check that leaderboard is ready for Pack 2
SELECT * FROM get_top_scores(10, 2);
-- Should return empty array (no scores yet)
```

### Step 6: Test the API Endpoints

**Test Property Fetch:**
```bash
# Get random Pack 2 property
curl "https://your-domain.vercel.app/api/properties?country=CA&pack_id=2"

# Get random Pack 1 property (backward compatible)
curl "https://your-domain.vercel.app/api/properties?country=CA&pack_id=1"

# Get random property from any pack (omit pack_id)
curl "https://your-domain.vercel.app/api/properties?country=CA"
```

**Test Leaderboard:**
```bash
# Get Pack 2 leaderboard
curl "https://your-domain.vercel.app/api/leaderboard?pack_id=2"

# Get Pack 1 leaderboard
curl "https://your-domain.vercel.app/api/leaderboard?pack_id=1"

# Get all packs combined
curl "https://your-domain.vercel.app/api/leaderboard"
```

### Step 7: Deploy to Production (Vercel)

1. Commit your changes:
```bash
git add .
git commit -m "Add Pack 2 system with separate leaderboards"
git push
```

2. Vercel will auto-deploy your changes

3. Run the migration in your production Supabase instance (same as Step 1)

4. Upload Pack 2 data to production using the scripts (same as Steps 3-4)

## Frontend Updates (Future Work)

The backend is now ready for Pack 2! To fully support packs in the game UI, you'll want to:

1. **Add Pack Selection Screen:**
   - Create a new component for users to choose which pack to play
   - Show pack details (name, difficulty, property count)
   - Store selected pack in game state

2. **Update Game Logic:**
   - Pass `pack_id` to the properties API when fetching random properties
   - Display current pack name in the UI
   - Pass `pack_id` when submitting scores to leaderboard

3. **Update Leaderboard Component:**
   - Add pack filter dropdown
   - Show pack name in leaderboard display
   - Allow viewing leaderboards for different packs

4. **Add Pack Management:**
   - Show pack statistics (total properties, avg price, etc.)
   - Allow users to switch between packs
   - Track personal best scores per pack

## Troubleshooting

### Images Not Displaying

**Problem:** Properties show but images are broken

**Solution:**
1. Verify images uploaded to Supabase Storage: `property-images/pack2/`
2. Check that `image_url` field contains Supabase URLs (not local paths)
3. Ensure storage bucket is public:
   - Go to Storage in Supabase Dashboard
   - Click on `property-images` bucket
   - Make sure "Public bucket" is enabled

### Duplicate Key Errors

**Problem:** Import script shows duplicate MLS number errors

**Solution:**
This is normal if properties already exist in the database. The script will:
- Skip duplicates automatically
- Show count in the summary
- Continue importing new properties

To force reimport:
```sql
-- Delete Pack 2 properties (careful!)
DELETE FROM properties WHERE pack_id = 2;

-- Then re-run the import script
```

### Wrong Pack Count

**Problem:** Pack shows 0 properties or wrong count

**Solution:**
```sql
-- Manually update pack counts
UPDATE packs
SET property_count = (SELECT COUNT(*) FROM properties WHERE pack_id = 1)
WHERE id = 1;

UPDATE packs
SET property_count = (SELECT COUNT(*) FROM properties WHERE pack_id = 2)
WHERE id = 2;
```

### API Returns No Properties

**Problem:** API call returns "No properties found"

**Solution:**
1. Verify properties exist:
```sql
SELECT COUNT(*) FROM properties WHERE pack_id = 2 AND country = 'CA';
```

2. Check the `get_random_property` function exists:
```sql
SELECT * FROM pg_proc WHERE proname = 'get_random_property';
```

3. Test the function directly:
```sql
SELECT * FROM get_random_property('CA', 2);
```

## Summary

After completing these steps, you will have:

✅ A pack system with separate leaderboards
✅ Pack 1 (Classic) - Your original properties
✅ Pack 2 (Extended) - Your new larger dataset
✅ API endpoints that support pack filtering
✅ Dev tools to add more packs in the future
✅ Proper database indexing for performance

Users can now enjoy a more challenging Pack 2 with a fresh leaderboard, while Pack 1 preserves the existing high scores!

## Next Steps

1. **Add Pack 3+**: Use the same process to add themed packs (luxury homes, specific cities, etc.)
2. **Pack Statistics**: Create a dashboard showing pack difficulty metrics
3. **Achievements**: Award badges for completing different packs
4. **Daily Challenges**: Rotate featured packs daily
5. **Multiplayer**: Compare pack scores with friends

Happy deploying! 🏠🎮
