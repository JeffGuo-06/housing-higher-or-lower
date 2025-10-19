# Selfie Feature & Percentile Ranking - Implementation Summary

## ✅ Features Implemented

### 1. **Percentile Ranking Display**

Shows players how their score compares to all other submissions in the leaderboard.

**What it shows:**
- 🎉 **100%**: "You're the first player! Set the bar high!"
- 🔥 **90%+**: "Your run beats X% of all other leaderboard entries!" (green, top-tier)
- 💪 **70-89%**: "Your run beats X% of all other leaderboard entries!" (neutral, good)
- 📊 **50-69%**: "Your run beats X% of all other leaderboard entries!" (standard)
- **Below 50%**: "Your run beats X% of all other leaderboard entries. Keep practicing!"

**How it works:**
- Fetches all scores for the current pack from leaderboard
- Counts how many scores are lower than player's score
- Calculates percentage: `(lower scores / total scores) * 100`
- Displays with emoji and color-coded styling

---

### 2. **Optional Selfie Capture**

After submitting their name, players can optionally take a selfie to celebrate their score!

**User Flow:**
1. Player enters name and clicks "Submit Score"
2. Modal opens with camera preview
3. Player can:
   - **Capture** a selfie
   - **Skip** to submit without selfie
4. After capture:
   - **Use This Photo** to upload
   - **Retake** to try again
5. Selfie uploads to Supabase Storage
6. Score submits with selfie URL

**Features:**
- Uses device's front-facing camera
- Live video preview (mirrored for selfie effect)
- Capture, retake, and skip options
- Uploads to Supabase Storage bucket
- Public URL saved with leaderboard entry
- Fully optional - can skip at any time

---

## 📁 Files Created/Modified

### New Files:
1. **`SelfieCapture.jsx`** - Modal component for camera capture
2. **`SelfieCapture.css`** - Styling for selfie modal
3. **`migrations/003_add_selfie_support.sql`** - Database migration for selfie column

### Modified Files:
4. **`GameOver.jsx`**:
   - Added percentile calculation
   - Added selfie modal integration
   - Updated score submission flow

5. **`GameOver.css`**:
   - Added percentile display styles
   - Color-coded tiers (first-score, top-tier, good, average, below-average)

---

## 🗄️ Database Changes

### Migration: `003_add_selfie_support.sql`

```sql
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS selfie_url TEXT;
```

**New column:**
- `selfie_url` (TEXT, nullable) - Stores public URL of player's selfie

**Storage bucket required:**
- Name: `leaderboard-selfies`
- Public: Yes
- File size limit: 5MB
- Allowed types: image/jpeg, image/png, image/webp

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```sql
-- In Supabase SQL Editor, run:
migrations/003_add_selfie_support.sql
```

### 2. Create Storage Bucket

In Supabase Dashboard:
1. Go to **Storage**
2. Click **Create Bucket**
3. Name: `leaderboard-selfies`
4. **Public bucket**: ✅ Enabled
5. Click **Create**

### 3. Configure Bucket Policies (Optional)

For extra security, you can limit file sizes:

```sql
-- In Supabase SQL Editor (optional):
-- Set file size limit to 5MB
```

### 4. Test the Feature

1. Play the game and get a score
2. Enter your name and click "Submit Score"
3. Camera modal should appear
4. Allow camera permissions
5. Take a selfie or skip
6. Score submits successfully

---

## 🎨 UI/UX Details

### Percentile Display
- Shows below the score
- Has a divider line above it
- Color-coded by performance tier
- Emoji indicators for engagement
- Large, bold percentage numbers

### Selfie Modal
- Clean, centered modal design
- 4:3 aspect ratio camera preview
- Mirrored video (selfie mode)
- Loading state while camera initializes
- Error handling for camera permissions
- Smooth transitions and animations

---

## 🔒 Privacy & Security

### Camera Access
- Requires user permission
- Only activates when modal is open
- Automatically stops when modal closes
- Front-facing camera by default

### Storage
- Images stored in public Supabase bucket
- Filenames: `{playerName}_{score}_{timestamp}.jpg`
- JPEG format with 90% quality
- ~100-300KB per image typical size

### Optional Feature
- Players can always skip
- No selfie required to submit score
- Skip button available at all stages

---

## 📊 Future Enhancements (Optional)

### Potential Additions:
1. **Leaderboard Selfies**: Show selfies in the leaderboard table
2. **Gallery View**: Browse all submitted selfies
3. **Filters/Frames**: Add fun overlays to selfies
4. **Social Sharing**: Share selfie + score to social media
5. **Avatar Selection**: Alternative to camera for privacy-conscious users

### Technical Improvements:
1. Image compression before upload
2. Face detection for better framing
3. Automatic retry on upload failure
4. Selfie preview in leaderboard entries

---

## 🐛 Troubleshooting

### Camera Not Working
**Issue**: "Unable to access camera" error

**Solutions**:
1. Check browser permissions (chrome://settings/content/camera)
2. Ensure HTTPS (camera only works on secure connections)
3. Try different browser (Chrome, Safari, Firefox)
4. Check device camera is not in use by another app

### Upload Failing
**Issue**: "Failed to upload selfie" error

**Solutions**:
1. Verify `leaderboard-selfies` bucket exists in Supabase
2. Check bucket is set to public
3. Verify service role key in environment variables
4. Check network connection

### Percentile Not Showing
**Issue**: No percentage displayed

**Solutions**:
1. Check console for errors
2. Verify leaderboard has entries for current pack
3. Check Supabase connection
4. Ensure `pack_id` matches between game and leaderboard

---

## ✅ Testing Checklist

- [ ] Percentile shows "first player" for pack with no scores
- [ ] Percentile calculates correctly with multiple scores
- [ ] Camera modal opens after name submission
- [ ] Camera starts and shows preview
- [ ] Skip button works without capturing
- [ ] Capture button takes photo
- [ ] Retake button works
- [ ] Upload succeeds and closes modal
- [ ] Score submits to leaderboard with selfie URL
- [ ] Score submits without selfie if skipped
- [ ] Camera stops when modal closes
- [ ] Mobile-responsive design works

---

## 🎯 Summary

Both features are now fully implemented and ready to use:

1. **Percentile Ranking**: Automatically calculates and displays how well players performed compared to others
2. **Selfie Capture**: Optional fun feature to let players celebrate their high scores with a photo

These features add personality and competitive engagement to the leaderboard experience! 🎮📸
