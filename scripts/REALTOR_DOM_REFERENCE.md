# Realtor.ca DOM Structure Reference

Quick reference for the Realtor.ca listing card DOM structure and CSS selectors.

## Complete DOM Hierarchy

```html
<div id="mapSidebarBodyCon" class="shownOnResults stopOverScroll">
  <div class="cardCon grid">

    <!-- MAIN CONTAINER: Each property card -->
    <div class="smallListingCardShadow"
         data-value="29002681,43.8996561,-79.3669344,true">

      <!-- LINK: Wraps entire card -->
      <a href="/real-estate/29002681/60_james-joyce-drive-markham-victoria-manor-jennings-gate"
         class="blockLink listingDetailsLink"
         target="_blank">

        <!-- IMAGE CONTAINER -->
        <div class="smallListingCardBodyWrap">
          <img class="smallListingCardImg"
               src="https://cdn.realtor.ca/listings/.../Lowres/4/n12468454_1.jpg"
               alt="Listing Photo"
               loading="lazy" />
        </div>

        <!-- TEXT CONTENT -->
        <div class="smallListingCardBody">
          <div class="smallListingCardPrice">$1,688,000</div>
          <div class="smallListingCardAddress">
            60 JAMES JOYCE DRIVE, Markham (Victoria Manor-Jennings Gate), Ontario
          </div>
        </div>

        <!-- ICONS: Beds & Baths -->
        <div class="smallListingCardIconCon">
          <div class="propertyCardBedIcon">4</div>
          <div class="propertyCardBathIcon">4</div>
        </div>

      </a>
    </div>

  </div>
</div>
```

---

## CSS Selectors

| Element | Selector | Description |
|---------|----------|-------------|
| **Listing Container** | `.smallListingCardShadow` | Main container for each property |
| **Data Attribute** | `[data-value]` | Contains: `id,lat,lon,isActive` |
| **Listing Link** | `.listingDetailsLink` | Relative URL to property page |
| **Image** | `.smallListingCardImg` | Property photo (lazy loaded) |
| **Price** | `.smallListingCardPrice` | Price in CAD (e.g., "$1,688,000") |
| **Address** | `.smallListingCardAddress` | Full address string |
| **Bedrooms** | `.propertyCardBedIcon` | Number of bedrooms |
| **Bathrooms** | `.propertyCardBathIcon` | Number of bathrooms |

---

## Data Extraction Patterns

### 1. Listing ID, Latitude, Longitude

```python
data_value = card.get_attribute('data-value')
# Format: "29002681,43.8996561,-79.3669344,true"

parts = data_value.split(',')
listing_id = parts[0]        # "29002681"
latitude = float(parts[1])   # 43.8996561
longitude = float(parts[2])  # -79.3669344
is_active = parts[3]         # "true"
```

### 2. Address

```python
address_elem = card.find_element(By.CLASS_NAME, "smallListingCardAddress")
address = address_elem.text.strip()
# "60 JAMES JOYCE DRIVE, Markham (Victoria Manor-Jennings Gate), Ontario"

# Parse city/province
parts = address.split(',')
street = parts[0]           # "60 JAMES JOYCE DRIVE"
city = parts[1].strip()     # "Markham (Victoria Manor-Jennings Gate)"
province = parts[2].strip() # "Ontario"
```

### 3. Price

```python
price_elem = card.find_element(By.CLASS_NAME, "smallListingCardPrice")
price_text = price_elem.text.strip()  # "$1,688,000"

# Clean and convert
price = int(price_text.replace('$', '').replace(',', ''))
# 1688000
```

### 4. Bedrooms & Bathrooms

```python
bed_elem = card.find_element(By.CLASS_NAME, "propertyCardBedIcon")
bedrooms = int(bed_elem.text.strip())  # 4

bath_elem = card.find_element(By.CLASS_NAME, "propertyCardBathIcon")
bathrooms = int(bath_elem.text.strip())  # 4
```

### 5. Image URL

```python
img_elem = card.find_element(By.CLASS_NAME, "smallListingCardImg")
img_url = img_elem.get_attribute("src")
# "https://cdn.realtor.ca/listings/IS638963044389790000/reb82/Lowres/4/n12468454_1.jpg"

# Convert to high-resolution
img_url_high = img_url.replace('/Lowres/', '/Highres/').replace('_1.jpg', '_0.jpg')
# "https://cdn.realtor.ca/listings/IS638963044389790000/reb82/Highres/4/n12468454_0.jpg"
```

### 6. Listing URL

```python
link_elem = card.find_element(By.CLASS_NAME, "listingDetailsLink")
relative_url = link_elem.get_attribute("href")
# "/real-estate/29002681/60_james-joyce-drive-markham-victoria-manor-jennings-gate"

# Construct full URL
full_url = f"https://www.realtor.ca{relative_url}"
# "https://www.realtor.ca/real-estate/29002681/60_james-joyce-drive-markham-..."
```

---

## Selenium Code Example

```python
from selenium.webdriver.common.by import By

# Wait for listings to load
WebDriverWait(driver, 30).until(
    EC.presence_of_element_located((By.CLASS_NAME, "smallListingCardShadow"))
)

# Get all listing cards
cards = driver.find_elements(By.CLASS_NAME, "smallListingCardShadow")

for card in cards:
    # Extract data-value
    data_value = card.get_attribute('data-value')
    listing_id, lat, lon, _ = data_value.split(',')

    # Extract text elements
    address = card.find_element(By.CLASS_NAME, "smallListingCardAddress").text
    price_text = card.find_element(By.CLASS_NAME, "smallListingCardPrice").text

    # Extract icons
    beds = card.find_element(By.CLASS_NAME, "propertyCardBedIcon").text
    baths = card.find_element(By.CLASS_NAME, "propertyCardBathIcon").text

    # Extract URLs
    img_url = card.find_element(By.CLASS_NAME, "smallListingCardImg").get_attribute("src")
    listing_url = card.find_element(By.CLASS_NAME, "listingDetailsLink").get_attribute("href")

    # Create property dict
    property_data = {
        'id': listing_id,
        'latitude': float(lat),
        'longitude': float(lon),
        'address': address,
        'price': int(price_text.replace('$', '').replace(',', '')),
        'bedrooms': int(beds),
        'bathrooms': int(baths),
        'image_url': img_url.replace('/Lowres/', '/Highres/'),
        'listing_url': f"https://www.realtor.ca{listing_url}"
    }
```

---

## Common Gotchas

### 1. Lazy-Loaded Images

Images have `loading="lazy"` attribute. They may not load until scrolled into view.

**Solution:** Scroll before extracting images
```python
driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
time.sleep(2)
```

### 2. Class Name vs Class Selector

Don't use `.` in `By.CLASS_NAME`:

```python
# ✅ Correct
driver.find_element(By.CLASS_NAME, "smallListingCardShadow")

# ❌ Wrong
driver.find_element(By.CLASS_NAME, ".smallListingCardShadow")
```

### 3. Data-Value Format

The format is comma-separated, not underscore:

```
✅ Correct: "29002681,43.8996561,-79.3669344,true"
❌ Old format: "29001308_43.8918375_-79.3647973_true"
```

Make sure to split by `,` not `_`.

### 4. Image Resolution

Three resolutions available:
- `/Lowres/` - Low resolution (faster loading)
- `/Medres/` - Medium resolution
- `/Highres/` - High resolution (best quality)

Replace in URL path to change resolution.

### 5. Missing Elements

Not all listings have all fields. Always use try/except:

```python
try:
    beds = card.find_element(By.CLASS_NAME, "propertyCardBedIcon").text
except NoSuchElementException:
    beds = None
```

---

## Testing Changes

If Realtor.ca updates their DOM:

1. **Inspect the page** with Chrome DevTools
2. **Find a listing card** in the Elements panel
3. **Right-click** → Copy → Copy selector
4. **Compare** with this reference
5. **Update selectors** in `scrape_realtor_selenium.py`
6. **Test** with `test_realtor_improved.py`

---

## JSON Output Example

```json
{
  "mls_number": "29002681",
  "latitude": 43.8996561,
  "longitude": -79.3669344,
  "address": "60 JAMES JOYCE DRIVE, Markham (Victoria Manor-Jennings Gate), Ontario",
  "city": "Markham (Victoria Manor-Jennings Gate)",
  "province": "Ontario",
  "country": "CA",
  "price": 1688000,
  "bedrooms": 4,
  "bathrooms": 4,
  "image_url": "https://cdn.realtor.ca/listings/IS638963044389790000/reb82/Highres/4/n12468454_0.jpg",
  "url": "https://www.realtor.ca/real-estate/29002681/60_james-joyce-drive-markham-victoria-manor-jennings-gate"
}
```

---

## Quick Reference Card

| What | Where | How |
|------|-------|-----|
| **ID** | `data-value` split by `,` | `parts[0]` |
| **Lat/Lon** | `data-value` split by `,` | `float(parts[1])`, `float(parts[2])` |
| **Address** | `.smallListingCardAddress` | `.text.strip()` |
| **Price** | `.smallListingCardPrice` | `.text` → clean → `int()` |
| **Beds** | `.propertyCardBedIcon` | `.text` → `int()` |
| **Baths** | `.propertyCardBathIcon` | `.text` → `int()` |
| **Image** | `.smallListingCardImg` | `.get_attribute("src")` |
| **URL** | `.listingDetailsLink` | `.get_attribute("href")` |

---

Last updated: October 2024
