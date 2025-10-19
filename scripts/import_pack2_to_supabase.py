#!/usr/bin/env python3
"""
Import Pack 2 properties to Supabase with pack_id = 2
This script prepares and uploads the new extended property pack
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Data paths
DATA_DIR = Path(__file__).parent / "data"
IMAGES_DIR = Path(__file__).parent / "images_ca_selenium"

PACK_ID = 2  # This is Pack 2


class Pack2Importer:
    def __init__(self):
        self.supabase = supabase
        self.imported_count = 0
        self.failed_count = 0
        self.skipped_count = 0

    def normalize_property_data(self, prop: Dict) -> Optional[Dict]:
        """
        Normalize property data for Pack 2 (Canadian properties)
        Adds pack_id = 2 to all properties
        """
        try:
            normalized = {
                'country': 'CA',
                'pack_id': PACK_ID,  # Always Pack 2
            }

            # MLS Number - REQUIRED for uniqueness
            if 'mls_number' in prop and prop['mls_number']:
                normalized['mls_number'] = str(prop['mls_number'])
            else:
                print(f"  Skipping property without MLS number")
                return None

            # Address - REQUIRED
            if 'address' in prop and prop['address']:
                normalized['address'] = str(prop['address']).strip()
            else:
                return None

            # Location details
            if 'city' in prop and prop['city']:
                normalized['city'] = str(prop['city']).strip()

            if 'province' in prop and prop['province']:
                normalized['province'] = str(prop['province']).strip()

            # Price - REQUIRED
            if 'price' in prop and prop['price']:
                try:
                    # Handle both integer and string prices
                    if isinstance(prop['price'], (int, float)):
                        normalized['price'] = int(prop['price'])
                    else:
                        price_str = str(prop['price']).replace('$', '').replace(',', '').strip()
                        normalized['price'] = int(float(price_str))

                    if normalized['price'] <= 0:
                        return None  # Skip invalid prices
                except (ValueError, TypeError):
                    return None
            else:
                return None

            # Property details
            if 'bedrooms' in prop and prop['bedrooms'] is not None:
                try:
                    # Handle "1 + 1" format common in Canadian listings
                    bedrooms_str = str(prop['bedrooms']).strip()
                    if '+' in bedrooms_str:
                        # Sum up the numbers (e.g., "1 + 1" = 2)
                        parts = bedrooms_str.split('+')
                        normalized['bedrooms'] = sum(int(p.strip()) for p in parts)
                    else:
                        normalized['bedrooms'] = int(float(bedrooms_str))
                except (ValueError, TypeError):
                    normalized['bedrooms'] = None

            if 'bathrooms' in prop and prop['bathrooms'] is not None:
                try:
                    normalized['bathrooms'] = int(float(prop['bathrooms']))
                except (ValueError, TypeError):
                    normalized['bathrooms'] = None

            if 'sqft' in prop and prop['sqft']:
                try:
                    normalized['sqft'] = int(prop['sqft'])
                except (ValueError, TypeError):
                    normalized['sqft'] = None

            if 'property_type' in prop and prop['property_type']:
                normalized['property_type'] = str(prop['property_type']).strip()

            # URLs
            if 'url' in prop and prop['url']:
                normalized['listing_url'] = str(prop['url']).strip()

            # Image URLs - prefer Supabase URL if available
            if 'supabase_image_url' in prop and prop['supabase_image_url']:
                normalized['image_url'] = str(prop['supabase_image_url']).strip()
            elif 'image_url' in prop and prop['image_url']:
                normalized['image_url'] = str(prop['image_url']).strip()

            # Store original image URL as backup
            if 'image_url' in prop and prop['image_url']:
                normalized['image_url_med'] = str(prop['image_url']).strip()

            # Local image path reference
            if 'local_image_path' in prop and prop['local_image_path']:
                normalized['local_image_path'] = str(prop['local_image_path']).strip()

            return normalized

        except Exception as e:
            print(f"  Error normalizing property: {str(e)}")
            return None

    def import_batch(self, properties: List[Dict], batch_size: int = 100):
        """
        Import properties in batches to Supabase with pack_id = 2
        """
        print(f"\nImporting {len(properties)} Pack 2 properties...")

        for i in range(0, len(properties), batch_size):
            batch = properties[i:i + batch_size]

            # Normalize batch
            normalized_batch = []
            for prop in batch:
                normalized = self.normalize_property_data(prop)
                if normalized:
                    normalized_batch.append(normalized)
                else:
                    self.skipped_count += 1

            if not normalized_batch:
                continue

            try:
                # Insert batch into Supabase
                result = self.supabase.table('properties').insert(normalized_batch).execute()

                imported = len(normalized_batch)
                self.imported_count += imported

                print(f"  ✓ Batch {i//batch_size + 1}: Imported {imported} properties")

            except Exception as e:
                error_msg = str(e)

                # Check for duplicate MLS number errors
                if 'duplicate key' in error_msg.lower():
                    print(f"  ⚠ Batch {i//batch_size + 1}: Duplicate MLS numbers detected, trying one-by-one...")

                    # Try importing one by one to skip duplicates
                    for prop in normalized_batch:
                        try:
                            self.supabase.table('properties').insert(prop).execute()
                            self.imported_count += 1
                        except Exception as single_error:
                            if 'duplicate key' in str(single_error).lower():
                                self.skipped_count += 1
                            else:
                                self.failed_count += 1
                                print(f"    ✗ Failed to import MLS {prop.get('mls_number', 'unknown')}: {str(single_error)[:100]}")
                else:
                    self.failed_count += len(normalized_batch)
                    print(f"  ✗ Batch {i//batch_size + 1}: Error - {error_msg[:150]}")

    def update_pack_count(self):
        """Update the property_count for Pack 2 in the packs table"""
        try:
            print("\nUpdating Pack 2 property count...")

            # Get count of Pack 2 properties
            result = self.supabase.table('properties').select('id', count='exact').eq('pack_id', PACK_ID).execute()
            count = result.count if hasattr(result, 'count') else len(result.data)

            # Update packs table
            self.supabase.table('packs').update({'property_count': count}).eq('id', PACK_ID).execute()

            print(f"✓ Updated Pack 2 property_count to {count}")
        except Exception as e:
            print(f"⚠ Could not update pack count: {str(e)}")

    def import_from_json(self, filepath: Path):
        """Import Pack 2 properties from JSON file"""
        print(f"\n{'='*60}")
        print(f"PACK 2 IMPORT - Loading properties from {filepath.name}")
        print(f"{'='*60}")

        if not filepath.exists():
            print(f"File not found: {filepath}")
            return

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                properties = json.load(f)

            print(f"Loaded {len(properties)} properties from JSON")
            self.import_batch(properties)

        except Exception as e:
            print(f"Error loading JSON file: {str(e)}")

    def print_summary(self):
        """Print import summary"""
        print(f"\n{'='*60}")
        print(f"PACK 2 IMPORT SUMMARY")
        print(f"{'='*60}")
        print(f"✓ Successfully imported: {self.imported_count}")
        print(f"⚠ Skipped (duplicates/invalid): {self.skipped_count}")
        print(f"✗ Failed: {self.failed_count}")
        print(f"{'='*60}\n")


def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║             PACK 2 PROPERTY IMPORT TOOL                    ║
║  This will import properties with pack_id = 2              ║
╚════════════════════════════════════════════════════════════╝
    """)

    # Check if images directory exists
    if not IMAGES_DIR.exists():
        print(f"⚠ Warning: Images directory not found at {IMAGES_DIR}")
        print("  Make sure images are uploaded to Supabase Storage before importing")
        response = input("\nContinue anyway? (y/n): ")
        if response.lower() != 'y':
            print("Import cancelled.")
            return

    importer = Pack2Importer()

    # Look for the JSON file with Supabase URLs (preferred)
    json_with_urls = DATA_DIR / "properties_ca_selenium_with_supabase_urls.json"
    json_regular = DATA_DIR / "properties_ca_selenium.json"

    if json_with_urls.exists():
        print(f"\n✓ Found JSON with Supabase image URLs")
        importer.import_from_json(json_with_urls)
    elif json_regular.exists():
        print(f"\n⚠ Using JSON without Supabase URLs - images may not display correctly")
        print(f"  Consider running upload_images_to_supabase.py first")
        response = input("\nContinue with original JSON? (y/n): ")
        if response.lower() == 'y':
            importer.import_from_json(json_regular)
        else:
            print("Import cancelled.")
            return
    else:
        print(f"\n✗ No property data found in {DATA_DIR}")
        print(f"  Expected files:")
        print(f"    - {json_with_urls}")
        print(f"    - {json_regular}")
        return

    importer.print_summary()
    importer.update_pack_count()

    # Query and display Pack 2 statistics
    try:
        print("\nQuerying Pack 2 statistics...")
        result = supabase.table('properties').select('price').eq('pack_id', PACK_ID).execute()

        if result.data:
            prices = [p['price'] for p in result.data if p.get('price')]
            if prices:
                print(f"\nPack 2 Statistics:")
                print(f"  Total Properties: {len(result.data):,}")
                print(f"  Avg Price: ${sum(prices) / len(prices):,.0f}")
                print(f"  Price Range: ${min(prices):,} - ${max(prices):,}")
    except Exception as e:
        print(f"Error querying stats: {str(e)}")

    print("\n✓ Pack 2 import complete!")
    print("\nNext steps:")
    print("1. Verify properties in Supabase dashboard")
    print("2. Test the API endpoint: /api/properties?country=CA&pack_id=2")
    print("3. Update frontend to support pack selection")


if __name__ == "__main__":
    main()
