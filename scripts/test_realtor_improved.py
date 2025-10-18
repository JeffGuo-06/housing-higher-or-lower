#!/usr/bin/env python3
"""
Test script for the improved Realtor.ca Selenium scraper
Tests the updated DOM selectors and data extraction
"""

import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from scrape_realtor_selenium import RealtorSeleniumScraper


def main():
    print("\n" + "="*60)
    print("Testing Improved Realtor.ca Selenium Scraper")
    print("Testing DOM selectors from your analysis")
    print("="*60 + "\n")

    # Run with visible browser for debugging
    scraper = RealtorSeleniumScraper(headless=False)

    try:
        # Test with small sample
        scraper.scrape(target_count=10, download_images=True)

        # Display results
        if scraper.properties:
            print("\n" + "="*60)
            print(f"Successfully scraped {len(scraper.properties)} properties!")
            print("="*60 + "\n")

            print("Sample property (first result):")
            prop = scraper.properties[0]
            print(f"  MLS Number: {prop.get('mls_number', 'N/A')}")
            print(f"  Address: {prop.get('address', 'N/A')}")
            print(f"  Price: ${prop.get('price', 0):,}")
            print(f"  Bedrooms: {prop.get('bedrooms', 'N/A')}")
            print(f"  Bathrooms: {prop.get('bathrooms', 'N/A')}")
            print(f"  City: {prop.get('city', 'N/A')}")
            print(f"  Province: {prop.get('province', 'N/A')}")
            print(f"  Latitude: {prop.get('latitude', 'N/A')}")
            print(f"  Longitude: {prop.get('longitude', 'N/A')}")
            print(f"  Image URL: {prop.get('image_url', 'N/A')[:60]}...")
            print(f"  Listing URL: {prop.get('url', 'N/A')[:60]}...")

            # Save test results
            scraper.save_to_json("test_properties_realtor_improved.json")
            scraper.save_to_csv("test_properties_realtor_improved.csv")

            print("\n✓ Test complete! Check 'data' folder for results.")

            # Data quality check (REQUIRED fields only: address, price, city, image)
            print("\n" + "="*60)
            print("Data Quality Check")
            print("="*60)

            complete_props = 0
            missing_sqft = 0
            missing_beds = 0
            missing_baths = 0
            missing_images = 0

            for prop in scraper.properties:
                # Check REQUIRED fields
                has_required = all([
                    prop.get('mls_number'),
                    prop.get('address'),
                    prop.get('price'),
                    prop.get('city'),
                    prop.get('image_url')
                ])

                if has_required:
                    complete_props += 1

                # Check OPTIONAL fields (nice to have)
                if not prop.get('sqft'):
                    missing_sqft += 1

                if not prop.get('bedrooms'):
                    missing_beds += 1

                if not prop.get('bathrooms'):
                    missing_baths += 1

                if not prop.get('image_url'):
                    missing_images += 1

            print(f"\nREQUIRED FIELDS (address, price, city, image):")
            print(f"  ✓ Properties with all required fields: {complete_props}/{len(scraper.properties)}")
            print(f"  ✗ Missing images: {missing_images}")

            print(f"\nOPTIONAL FIELDS (nice to have):")
            print(f"  Missing sqft: {missing_sqft}")
            print(f"  Missing bedrooms: {missing_beds}")
            print(f"  Missing bathrooms: {missing_baths}")

            if complete_props == len(scraper.properties):
                print("\n✓✓✓ All properties have complete REQUIRED data!")
            else:
                print(f"\n⚠ {len(scraper.properties) - complete_props} properties missing required fields")

        else:
            print("\n✗ No properties scraped. Check the error messages above.")

    except Exception as e:
        print(f"\n✗ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
