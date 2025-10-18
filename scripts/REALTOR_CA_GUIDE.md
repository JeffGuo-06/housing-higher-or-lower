# Complete Guide: Realtor.ca Scraper → Supabase Import

This guide covers the complete workflow for scraping Canadian property data from Realtor.ca and importing it into your Supabase database for the Higher or Lower Real Estate game.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Step 1: Run Database Migration](#step-1-run-database-migration)
4. [Step 2: Scrape Properties](#step-2-scrape-properties)
5. [Step 3: Import to Supabase](#step-3-import-to-supabase)
6. [Step 4: Verify Data](#step-4-verify-data)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What This Does

1. **Scrapes** property listings from Realtor.ca using Selenium
2. **Extracts** detailed property data (address, price, beds, baths, images, etc.)
3. **Stores** data locally in JSON/CSV format
4. **Imports** data into Supabase PostgreSQL database
5. **Provides** random property API endpoints for your game

### Updated DOM Selectors

The scraper has been updated to use the correct DOM structure from Realtor.ca:

```html
<div class="smallListingCardShadow" data-value="29002681,43.8996561,-79.3669344,true">
  <a class="listingDetailsLink" href="/real-estate/...">
    <img class="smallListingCardImg" src="..." />
    <div class="smallListingCardPrice">$1,688,000</div>
    <div class="smallListingCardAddress">60 JAMES JOYCE DRIVE, Markham...</div>
    <div class="propertyCardBedIcon">4</div>
    <div class="propertyCardBathIcon">4</div>
  </a>
</div>
```

### Key Improvements

- ✅ Extracts listing ID, latitude, longitude from `data-value` attribute
- ✅ Uses correct class names: `smallListingCardShadow`, `smallListingCardImg`, etc.
- ✅ Parses bedrooms/bathrooms from dedicated icon elements
- ✅ Handles lazy-loaded images
- ✅ Converts to high-resolution images

---

## Setup

### 1. Install Python Dependencies

```bash
cd scripts

# Install Selenium and web scraping tools
pip install -r requirements_selenium.txt

# Install Supabase client and other tools
pip install -r requirements.txt
```

### 2. Install ChromeDriver

The scraper uses `webdriver-manager` to automatically download ChromeDriver, but you need Chrome installed:

**Mac:**
```bash
brew install --cask google-chrome
```

**Ubuntu/Debian:**
```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Anon key for frontend (already in .env.example)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Where to find these:**
- Go to https://supabase.com/dashboard
- Select your project
- Settings → API
- Copy `URL` and `service_role` key (NOT the anon key for imports)

---

## Step 1: Run Database Migration

Before scraping, create the `properties` table in Supabase.

### Option A: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the entire contents of `migrations/002_properties_table.sql`
6. Paste and click **Run**

You should see:
```
Success. No rows returned
```

### Option B: Supabase CLI

```bash
supabase db push migrations/002_properties_table.sql
```

### What This Creates

- ✅ `properties` table with all necessary columns
- ✅ Indexes for fast queries by country, price, location
- ✅ Row Level Security (RLS) policies for public read access
- ✅ Functions: `get_random_property()` and `get_property_pair()`
- ✅ View: `property_stats` for quick statistics

---

## Step 2: Scrape Properties

### Test First (Recommended)

Always test with a small sample before running the full scraper:

```bash
cd scripts
python test_realtor_improved.py
```

This will:
- Scrape 10 properties
- Show browser window (headless=False) so you can debug
- Display data quality metrics
- Save to `data/test_properties_realtor_improved.json`

**Expected output:**
```
Testing Improved Realtor.ca Selenium Scraper
============================================================

Searching Toronto, ON...
  Loading page (attempt 1/5)...
  ✓ Properties loaded successfully
  Scrolling to load more properties...
  Found 48 property cards
    ✓ First property: 60 JAMES JOYCE DRIVE, Markham... - $1,688,000
  Extracted 10 properties

✓ Successfully scraped 10 properties!

Sample property (first result):
  MLS Number: 29002681
  Address: 60 JAMES JOYCE DRIVE, Markham (Victoria Manor-Jennings Gate), Ontario
  Price: $1,688,000
  Bedrooms: 4
  Bathrooms: 4
  Latitude: 43.8996561
  Longitude: -79.3669344
  ...

Data Quality Check
============================================================
  Properties with complete data: 10/10
  Missing coordinates: 0
  Missing bedrooms: 0
  Missing bathrooms: 0

✓ All properties have complete data!
```

### Run Full Scraper

Once testing looks good, run the full scraper:

```bash
python scrape_realtor_selenium.py
```

**Configuration** (edit scrape_realtor_selenium.py):
- Line 25: `TARGET_PROPERTIES = 5000` (how many to scrape)
- Line 26: `RATE_LIMIT_DELAY = (3, 5)` (seconds between cities)
- Line 29-43: `SEARCH_CITIES` (cities to scrape)

**Expected runtime:**
- 10 properties: ~30 seconds
- 100 properties: ~5 minutes
- 5,000 properties: ~30-45 minutes

**Output:**
- `data/properties_ca_selenium.json` - All property data
- `data/properties_ca_selenium.csv` - CSV format
- `images_ca_selenium/*.jpg` - Property images (if download_images=True)

---

## Step 3: Import to Supabase

Once scraping is complete, import the data:

```bash
python import_to_supabase.py
```

### What Happens

1. Loads `data/properties_ca_selenium.json`
2. Normalizes data to match database schema
3. Imports in batches of 100 properties
4. Handles duplicate MLS numbers gracefully
5. Shows import statistics

**Expected output:**
```
============================================================
Loading CA properties from properties_ca_selenium.json
============================================================
Loaded 5000 properties from JSON

Importing 5000 CA properties...
  ✓ Batch 1: Imported 100 properties
  ✓ Batch 2: Imported 100 properties
  ...
  ✓ Batch 50: Imported 100 properties

============================================================
IMPORT SUMMARY
============================================================
✓ Successfully imported: 4,987
⚠ Skipped (duplicates/invalid): 13
✗ Failed: 0
============================================================

Querying database statistics...

Property Statistics:

CA:
  Total: 4,987
  Avg Price: $1,245,678
  Price Range: $299,000 - $15,800,000
  Avg Beds: 3.2
  Avg Baths: 2.5
```

### Handling Duplicates

If you run the import twice, it will skip duplicates:

```
⚠ Batch 1: Duplicate MLS numbers detected, trying one-by-one...
```

The unique constraint on `mls_number` prevents duplicates.

---

## Step 4: Verify Data

### Check in Supabase Dashboard

1. Go to **Table Editor** → `properties`
2. You should see your imported properties
3. Filter by `country = 'CA'` to see Canadian properties

### Test the API Functions

In Supabase SQL Editor, run:

```sql
-- Get a random Canadian property
SELECT * FROM get_random_property('CA');

-- Get two random properties for comparison
SELECT * FROM get_property_pair('CA');

-- View statistics
SELECT * FROM property_stats;
```

### Test from Your App

Update your serverless function to use the database:

```javascript
// api/properties.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { country = 'US' } = req.query

  // Get random property
  const { data, error } = await supabase
    .rpc('get_random_property', { property_country: country })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data[0])
}
```

---

## Troubleshooting

### Selenium Issues

**Problem: "Chrome binary not found"**
```bash
# Mac
brew install --cask google-chrome

# Ubuntu
sudo apt-get install google-chrome-stable
```

**Problem: "Timeout waiting for properties"**
- Realtor.ca might be slow or blocking
- Try increasing timeout in scrape_realtor_selenium.py:100
- Try running with `headless=False` to see what's happening
- Check your internet connection

**Problem: "No properties found"**
- The DOM structure may have changed
- Run with `headless=False` and inspect the page
- Check browser console for JavaScript errors

### Scraping Issues

**Problem: "0 properties extracted"**
- Verify selectors are correct (inspect page with browser DevTools)
- Check that `data-value` attribute exists
- Try a different city in the SEARCH_CITIES list

**Problem: "Missing data fields"**
- Some properties don't have all fields (normal)
- The scraper filters out properties without price or address
- Bedrooms/bathrooms may be missing for some listings

### Import Issues

**Problem: "Missing SUPABASE_URL"**
- Create `.env` file in project root
- Copy from `.env.example` and fill in values
- Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)

**Problem: "duplicate key value violates unique constraint"**
- This is normal if you're re-importing
- The script will skip duplicates automatically
- You can delete old data first:
  ```sql
  DELETE FROM properties WHERE country = 'CA';
  ```

**Problem: "Failed to import batch"**
- Check error message for details
- Verify migration was run successfully
- Check that your service role key has write permissions

### Data Quality Issues

**Problem: "Properties missing coordinates"**
- Some listings don't include lat/lon in `data-value`
- This is normal for ~5% of properties
- These can still be used (just won't show on map)

**Problem: "Prices seem wrong"**
- Verify currency (CAD vs USD)
- Check for outliers (very high/low prices)
- Some "prices" are actually rents (scraper filters these out)

---

## Next Steps

### 1. Update Your Frontend

Modify `src/App.jsx` to fetch from Supabase:

```javascript
const fetchProperty = async (country) => {
  const { data, error } = await supabase
    .rpc('get_random_property', { property_country: country })

  if (error) throw error
  return data[0]
}
```

### 2. Add US Properties

Run the same process for US properties:
1. Scrape from Redfin (already have `scrape_us_redfin.py`)
2. Import with `import_to_supabase.py` (supports both US and CA)
3. Update frontend to support both countries

### 3. Deploy to Vercel

Make sure your environment variables are set in Vercel:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### 4. Set Up Image Hosting

Currently images are hosted on Realtor.ca's CDN. For production:
- Upload images to Supabase Storage or Cloudinary
- Update `image_url` in database
- Or use a caching proxy

---

## Summary

✅ **DOM selectors updated** to match Realtor.ca structure
✅ **Database schema** created with proper indexes and constraints
✅ **Scraper** extracts ID, coordinates, price, beds, baths, images
✅ **Import script** handles normalization and duplicate detection
✅ **API functions** for random property selection
✅ **Documentation** for complete workflow

You now have a complete pipeline from scraping to database to API!

---

## Resources

- [Selenium Documentation](https://selenium-python.readthedocs.io/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [Realtor.ca](https://www.realtor.ca/)
- [Project README](../PLAN.md)
