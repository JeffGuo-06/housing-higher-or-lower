# 🚀 Production Deployment Quick Start - Pack 2

## TL;DR - Safe Production Deployment

```bash
# 1. Backups are already done ✅

# 2. Run SAFE migration in Supabase SQL Editor
migrations/002_add_pack_system_SAFE.sql

# 3. Upload Pack 2 images (optional - can do later)
cd scripts
python upload_pack2_images.py

# 4. Import Pack 2 properties via Dev Page
# Visit: https://your-domain.com/dev
# Click "Add to Database"
# Select Pack 2 from dropdown
# Add all properties

# 5. Deploy code to Vercel
git add .
git commit -m "Add Pack 2 system with separate leaderboards"
git push

# Done! ✅
```

---

## What's Safe About This Deployment?

✅ **Zero Downtime** - Old code keeps working during migration
✅ **No Breaking Changes** - Backward compatible INSERT policy
✅ **Automatic Fallback** - NULL pack_id defaults to Pack 1
✅ **Gradual Rollout** - Can deploy API changes separately
✅ **Existing Scores Preserved** - All go to Pack 1 leaderboard

---

## Critical Files

### Use These (SAFE):
- ✅ `migrations/002_add_pack_system_SAFE.sql` - Production-safe migration
- ✅ `scripts/upload_pack2_images.py` - Upload images to Supabase
- ✅ `scripts/import_pack2_to_supabase.py` - Import properties with pack_id=2

### Don't Use in Production:
- ❌ `migrations/002_add_pack_system.sql` - BREAKS score submissions!

### Reference:
- 📖 `migrations/MIGRATION_SAFETY_COMPARISON.md` - Why SAFE version matters
- 📖 `PACK_2_DEPLOYMENT.md` - Complete step-by-step guide

---

## Pre-Deployment Checklist

- [x] Backups already created (you confirmed this)
- [ ] Run `002_add_pack_system_SAFE.sql` in Supabase
- [ ] Verify migration output shows Pack 1 entries
- [ ] Test old API still works: `/api/leaderboard`
- [ ] Upload Pack 2 images (optional)
- [ ] Import Pack 2 properties
- [ ] Deploy code to Vercel
- [ ] Test new API: `/api/leaderboard?pack_id=2`

---

## Verification After Migration

Run these in Supabase SQL Editor:

```sql
-- Should show 2 packs
SELECT * FROM packs;

-- Should show your existing leaderboard entries in Pack 1
SELECT pack_id, COUNT(*) FROM leaderboard GROUP BY pack_id;

-- Test the API functions work
SELECT * FROM get_top_scores(10, 1); -- Pack 1 scores
SELECT * FROM get_top_scores(10, NULL); -- All scores
```

---

## If Something Goes Wrong

1. **Score submissions fail:**
   - Check: Did you run `002_add_pack_system_SAFE.sql`? (NOT the original)
   - Fix: Rollback using script in `MIGRATION_SAFETY_COMPARISON.md`

2. **Properties not showing:**
   - Check: `SELECT COUNT(*) FROM properties WHERE pack_id = 2;`
   - Fix: Re-run import script

3. **Images missing:**
   - Check: Supabase Storage → property-images → pack2/
   - Fix: Re-run `upload_pack2_images.py`

---

## What Users Will See

### Before Deployment:
- Same game, Pack 1 only
- Existing leaderboard works

### After Migration (Before New Properties):
- Same game, Pack 1 only
- Existing leaderboard works
- **No user-facing changes yet**

### After Pack 2 Upload (Future):
- Users can choose Pack 1 or Pack 2
- Separate leaderboards for each pack
- Pack 1 scores preserved

---

## Timeline Estimate

1. **Run migration**: 30 seconds
2. **Verify migration**: 2 minutes
3. **Upload Pack 2 images**: 10-30 minutes (depends on image count)
4. **Import Pack 2 properties**: 5-10 minutes
5. **Deploy to Vercel**: 3-5 minutes (automatic)

**Total: ~20-50 minutes**

---

## Support

- 📁 Full guide: `PACK_2_DEPLOYMENT.md`
- 🔍 Safety comparison: `MIGRATION_SAFETY_COMPARISON.md`
- 🐛 Troubleshooting: See "Troubleshooting" section in `PACK_2_DEPLOYMENT.md`

---

**Ready to deploy? Start with Step 2 above (backups already done!)** 🚀
