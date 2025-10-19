#!/usr/bin/env python3
"""
Realtor.ca Selenium Scraper
Uses Selenium to render JavaScript and scrape actual loaded property data
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import random
import json
import requests
from pathlib import Path
from typing import List, Dict, Optional
import csv

# Configuration
OUTPUT_DIR = Path(__file__).parent / "data"
IMAGES_DIR = Path(__file__).parent / "images_ca_selenium"
TARGET_PROPERTIES = 5000
RATE_LIMIT_DELAY = (3, 5)
MAX_RETRIES = 3

# Ontario cities - prioritized for university students
SEARCH_CITIES = [
    # PRIORITY: Major university cities (scraped first)
    "Toronto, ON",        # U of T, TMU, York
    "Waterloo, ON",       # UW, Laurier
    "London, ON",         # Western
    "Hamilton, ON",       # McMaster
    "Ottawa, ON",         # uOttawa, Carleton

    # Secondary: GTA suburbs with universities
    "Oshawa, ON",         # Ontario Tech
    "Guelph, ON",         # Guelph
    "Kingston, ON",       # Queen's

    # Rest of GTA (lower priority)
    "Mississauga, ON",
    "Brampton, ON",
    "Markham, ON",
    "Scarborough, ON",
    "North York, ON",
    "Vaughan, ON",
    "Richmond Hill, ON",
    "Oakville, ON",
    "Burlington, ON",
    "Pickering, ON",
    "Ajax, ON",
    "Whitby, ON",
    "Windsor, ON",
    "Niagara Falls, ON",
]


class RealtorSeleniumScraper:
    def __init__(self, headless: bool = True):
        """
        Initialize Selenium scraper

        Args:
            headless: Run browser in headless mode (no visible window)
        """
        self.headless = headless
        self.driver = None
        self.properties = []
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)

        # Session for downloading images
        self.session = requests.Session()

    def _setup_driver(self):
        """Setup Chrome driver with options"""
        chrome_options = Options()

        if self.headless:
            chrome_options.add_argument('--headless=new')

        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        # Disable geolocation to prevent location-based filtering
        chrome_options.add_argument('--disable-geolocation')
        prefs = {
            "profile.default_content_setting_values.geolocation": 2,  # Block geolocation
            "profile.managed_default_content_settings.geolocation": 2
        }
        chrome_options.add_experimental_option("prefs", prefs)

        # Automatically download and setup ChromeDriver
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)

        print("Chrome driver initialized")

    def search_city(self, city: str, max_properties: int = 500, max_pages: int = 10) -> List[Dict]:
        """
        Search for properties in a city by loading the map view and paginating through results

        Args:
            city: City name to search (e.g., "Toronto, ON")
            max_properties: Maximum number of properties to collect for this city
            max_pages: Maximum number of pages to scrape (default: 10)
        """
        properties = []
        max_refresh_attempts = 5

        try:
            for attempt in range(max_refresh_attempts):
                try:
                    print(f"  Loading page (attempt {attempt + 1}/{max_refresh_attempts})...")

                    # Load the map page in LIST VIEW (not map view)
                    # The key is adding #view=list to the URL
                    self.driver.get("https://www.realtor.ca/map#view=list")

                    print("  Waiting for list view to load...")
                    time.sleep(3)

                    # Find and click the search input box on the map view
                    print(f"  Clicking search box and typing '{city}'...")

                    # Try different possible selectors for the search input
                    search_input = None
                    possible_selectors = [
                        (By.ID, "txtMapSearchInput"),
                        (By.ID, "textMapSearchInput"),
                        (By.CSS_SELECTOR, "input[placeholder*='City']"),
                        (By.CSS_SELECTOR, "input[placeholder*='Neighbourhood']"),
                        (By.CSS_SELECTOR, "input.mapSearchInput"),
                        (By.XPATH, "//input[@type='search']"),
                    ]

                    for selector_type, selector_value in possible_selectors:
                        try:
                            search_input = WebDriverWait(self.driver, 5).until(
                                EC.presence_of_element_located((selector_type, selector_value))
                            )
                            print(f"  ✓ Found search input with {selector_type}: {selector_value}")
                            break
                        except:
                            continue

                    if not search_input:
                        raise Exception("Could not find search input on map view")

                    # Click and type in the search box
                    search_input.click()
                    time.sleep(0.5)
                    search_input.clear()
                    search_input.send_keys(city)
                    time.sleep(1)

                    # Press Enter or click search button
                    from selenium.webdriver.common.keys import Keys
                    search_input.send_keys(Keys.RETURN)

                    print("  Waiting for search results to update...")
                    time.sleep(5)  # Wait for the search to apply and list to rebuild

                    # Try to find properties - if they're not there yet, just continue anyway
                    try:
                        WebDriverWait(self.driver, 15).until(
                            EC.presence_of_element_located((By.CLASS_NAME, "listingCard"))
                        )
                        print("  ✓ Properties loaded successfully")
                    except:
                        print("  ⚠ Timeout waiting for cards, but continuing anyway...")
                        # Sometimes the cards are already there, just check
                        cards = self.driver.find_elements(By.CLASS_NAME, "listingCard")
                        if len(cards) > 0:
                            print(f"  ✓ Found {len(cards)} properties already loaded")
                        else:
                            # Really stuck, try scrolling to trigger lazy load
                            print("  Scrolling to trigger property load...")
                            self.driver.execute_script("window.scrollTo(0, 500);")
                            time.sleep(3)
                    break  # Success, exit retry loop

                except Exception as e:
                    if attempt < max_refresh_attempts - 1:
                        print(f"  ✗ Timeout or error: {str(e)[:50]}")
                        print(f"  Refreshing page (attempt {attempt + 2}/{max_refresh_attempts})...")
                        time.sleep(2)
                    else:
                        print(f"  ✗ Failed to load after {max_refresh_attempts} attempts, skipping {city}")
                        return []

            # NEW: Pagination loop - scrape multiple pages
            page_num = 1
            while page_num <= max_pages and len(properties) < max_properties:
                print(f"\n  --- Page {page_num} ---")

                # Scroll to load more properties (lazy-loaded by Realtor.ca)
                print("  Scrolling to load more properties...")
                for i in range(5):
                    try:
                        # Scroll to bottom
                        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                        time.sleep(1.5)  # Short wait for lazy-load
                    except Exception as e:
                        print(f"    Warning: Scroll failed, continuing with what we have...")
                        break

                # Extract property cards (use correct class name from actual DOM)
                property_cards = self.driver.find_elements(By.CLASS_NAME, "listingCard")
                print(f"  Found {len(property_cards)} property cards on page {page_num}")

                # Extract properties from this page
                page_properties = 0
                for i, card in enumerate(property_cards, 1):
                    if len(properties) >= max_properties:
                        break

                    try:
                        property_data = self._extract_property_from_card(card)
                        if property_data:
                            properties.append(property_data)
                            page_properties += 1
                            if i == 1 and page_num == 1:  # Debug first property of first page
                                print(f"    ✓ First property: {property_data.get('address', 'No addr')[:40]} - ${property_data.get('price', 0):,}")
                        else:
                            if i <= 3 and page_num == 1:  # Debug first 3 failures on first page
                                print(f"    ✗ Card {i}: Failed extraction (likely missing price or address)")
                    except Exception as e:
                        print(f"    ✗ Card {i}: Error - {str(e)[:60]}")
                        continue

                print(f"  Extracted {page_properties} properties from page {page_num} (total: {len(properties)})")

                # Check if we've hit our target
                if len(properties) >= max_properties:
                    print(f"  ✓ Reached target of {max_properties} properties")
                    break

                # Try to find and click the "Next" button
                try:
                    # Scroll to pagination area first
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(1.5)

                    # Wait for the next button to be present
                    next_button = WebDriverWait(self.driver, 5).until(
                        EC.presence_of_element_located((By.CLASS_NAME, "lnkNextResultsPage"))
                    )

                    # Check if it's disabled or hidden
                    is_disabled = next_button.get_attribute("disabled")
                    is_hidden = next_button.get_attribute("style")
                    aria_disabled = next_button.get_attribute("aria-disabled")

                    if is_disabled or aria_disabled == "true" or (is_hidden and "display: none" in is_hidden):
                        print(f"  ✓ Reached last page (Next button disabled)")
                        break

                    # Scroll the button into view
                    self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", next_button)
                    time.sleep(0.5)

                    # Click the next button using JavaScript (more reliable than regular click)
                    print(f"  Clicking 'Next' to load page {page_num + 1}...")
                    self.driver.execute_script("arguments[0].click();", next_button)

                    # Wait for new page to load
                    time.sleep(3)

                    # Wait for property cards to reload
                    try:
                        WebDriverWait(self.driver, 10).until(
                            EC.presence_of_element_located((By.CLASS_NAME, "listingCard"))
                        )
                    except:
                        print("  ⚠ Timeout waiting for next page to load")

                    page_num += 1

                except Exception as e:
                    print(f"  ✗ Could not find/click Next button: {str(e)[:60]}")
                    print(f"  Assuming this is the last page")
                    break

        except Exception as e:
            print(f"  Error searching {city}: {str(e)}")

        return properties

    def _extract_property_from_card(self, card) -> Optional[Dict]:
        """
        Extract property data from a single property card element
        Based on actual DOM structure from realtor.ca (React-based with data-binding)
        """
        try:
            property_data = {}

            # Extract MLS/listing ID from URL
            try:
                link_elem = card.find_element(By.CLASS_NAME, "listingDetailsLink")
                url = link_elem.get_attribute("href")
                property_data['url'] = url

                # Extract ID from URL like "/real-estate/29005225/9-vandaam-lane..."
                if url and '/real-estate/' in url:
                    parts = url.split('/real-estate/')
                    if len(parts) > 1:
                        property_data['mls_number'] = parts[1].split('/')[0]
                else:
                    property_data['mls_number'] = None
            except:
                property_data['mls_number'] = None
                property_data['url'] = None

            # Extract address
            try:
                address_elem = card.find_element(By.CLASS_NAME, "listingCardAddress")
                property_data['address'] = address_elem.text.strip()
            except Exception as e:
                property_data['address'] = None

            # Extract price
            try:
                price_elem = card.find_element(By.CLASS_NAME, "listingCardPrice")
                price_text = price_elem.text.strip().replace('$', '').replace(',', '').replace('FREE', '0')
                # Remove any text like "SOLD"
                price_text = ''.join(c for c in price_text if c.isdigit())
                property_data['price'] = int(price_text) if price_text else None
            except Exception as e:
                property_data['price'] = None

            # Extract bedrooms/bathrooms/sqft from icon containers
            # Structure: div.listingCardIconCon contains:
            #   - div.listingCardIconNum (the number)
            #   - div.listingCardIconText (label like "Bathrooms", "Bedrooms", "Square Feet")
            try:
                property_data['bedrooms'] = None
                property_data['bathrooms'] = None
                property_data['sqft'] = None

                # Find all icon containers (there's one for each stat: beds, baths, sqft, etc.)
                icon_containers = card.find_elements(By.CLASS_NAME, "listingCardIconCon")

                for container in icon_containers:
                    try:
                        # Get the label (Bedrooms, Bathrooms, Square Feet, etc.)
                        label_elem = container.find_element(By.CLASS_NAME, "listingCardIconText")
                        label = label_elem.text.strip().lower()

                        # Get the number value
                        num_elem = container.find_element(By.CLASS_NAME, "listingCardIconNum")
                        num_text = num_elem.text.strip()

                        if 'bedroom' in label and num_text:
                            # Keep as string to preserve "3+1" format
                            property_data['bedrooms'] = num_text
                        elif 'bathroom' in label and num_text:
                            # Keep as string to preserve "2+1" format
                            property_data['bathrooms'] = num_text
                        elif 'square' in label or 'sqft' in label or 'sq ft' in label:
                            # For sqft, extract the number (remove commas, $, etc)
                            import re
                            clean_num = num_text.replace('$', '').replace(',', '')
                            sqft_match = re.search(r'(\d+)', clean_num)
                            if sqft_match:
                                property_data['sqft'] = int(sqft_match.group(1))
                    except:
                        continue

            except:
                property_data['bedrooms'] = None
                property_data['bathrooms'] = None
                property_data['sqft'] = None

            # Extract property type (if available in icon strip)
            property_data['property_type'] = None

            # Extract image URL
            try:
                img_elem = card.find_element(By.CLASS_NAME, "listingCardImage")
                img_url = img_elem.get_attribute("src")
                # Convert to high-res if needed (keep the same image number)
                if img_url:
                    img_url = img_url.replace('/medres/', '/highres/')
                property_data['image_url'] = img_url
            except:
                property_data['image_url'] = None

            property_data['country'] = 'CA'

            # Filter out incomplete data
            if not property_data['price'] or not property_data['address']:
                return None

            return property_data

        except Exception as e:
            print(f"    Error in _extract_property_from_card: {str(e)}")
            return None

    def download_image(self, image_url: str, property_id: str) -> Optional[str]:
        """Download property image"""
        if not image_url:
            return None

        try:
            filename = f"{property_id}.jpg"
            filepath = IMAGES_DIR / filename

            if filepath.exists():
                return str(filepath.relative_to(Path(__file__).parent.parent))

            response = self.session.get(image_url, timeout=10)
            response.raise_for_status()

            with open(filepath, 'wb') as f:
                f.write(response.content)

            return str(filepath.relative_to(Path(__file__).parent.parent))

        except Exception as e:
            print(f"  Error downloading image: {str(e)}")
            return None

    def scrape(self, target_count: int = TARGET_PROPERTIES, download_images: bool = False):
        """Main scraping function"""
        print(f"\n{'='*60}")
        print(f"Starting Realtor.ca Selenium Scraper (GTA & Ontario)")
        print(f"Target: {target_count} properties")
        print(f"Download images: {download_images}")
        print(f"{'='*60}\n")

        # Setup driver
        self._setup_driver()

        try:
            properties_collected = 0

            for city in SEARCH_CITIES:
                if properties_collected >= target_count:
                    break

                print(f"\nSearching {city}...")

                # Search city
                city_properties = self.search_city(city, max_properties=500)

                for prop in city_properties:
                    if properties_collected >= target_count:
                        break

                    # Parse city from address
                    if prop['address']:
                        parts = prop['address'].split(',')
                        if len(parts) >= 2:
                            prop['city'] = parts[-2].strip()
                            prop['province'] = parts[-1].strip().split()[0]
                        else:
                            prop['city'] = city.split(',')[0]
                            prop['province'] = 'ON'

                    # Download image if requested
                    if download_images and prop['image_url']:
                        mls = prop.get('mls_number', str(properties_collected))
                        local_path = self.download_image(prop['image_url'], mls)
                        prop['local_image_path'] = local_path

                    self.properties.append(prop)
                    properties_collected += 1

                    # Auto-save progress every 100 properties (in case of crash/ban)
                    if properties_collected % 100 == 0:
                        print(f"  Progress: {properties_collected}/{target_count}")
                        self.save_to_json("properties_ca_selenium_progress.json")
                        print(f"  ✓ Auto-saved progress")
                    elif properties_collected % 50 == 0:
                        print(f"  Progress: {properties_collected}/{target_count}")

                # Rate limiting
                if properties_collected < target_count:
                    delay = random.uniform(*RATE_LIMIT_DELAY)
                    print(f"  Waiting {delay:.1f}s before next city...")
                    time.sleep(delay)

            print(f"\n{'='*60}")
            print(f"Scraping complete! Collected {len(self.properties)} properties")
            print(f"{'='*60}\n")

        finally:
            # Always close the browser
            if self.driver:
                self.driver.quit()
                print("Browser closed")

    def save_to_csv(self, filename: str = "properties_ca_selenium.csv"):
        """Save to CSV"""
        if not self.properties:
            print("No properties to save!")
            return

        filepath = OUTPUT_DIR / filename
        fieldnames = list(self.properties[0].keys())

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.properties)

        print(f"Saved {len(self.properties)} properties to {filepath}")

    def save_to_json(self, filename: str = "properties_ca_selenium.json"):
        """Save to JSON"""
        if not self.properties:
            print("No properties to save!")
            return

        filepath = OUTPUT_DIR / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.properties, f, indent=2)

        print(f"Saved {len(self.properties)} properties to {filepath}")


def main():
    # Set headless=False to see the browser (useful for debugging)
    scraper = RealtorSeleniumScraper(headless=False)
    scraper.scrape(target_count=TARGET_PROPERTIES, download_images=True)
    scraper.save_to_csv()
    scraper.save_to_json()
    print("\nDone! Check the 'data' and 'images_ca_selenium' folders for results.")


if __name__ == "__main__":
    main()
