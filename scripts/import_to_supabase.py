#!/usr/bin/env python3
"""
Import scraped property data into Supabase
Supports both US and Canadian properties
"""

import os
import json
import csv
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

# Initialize Supabase client with service role key (for write access)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Data paths
DATA_DIR = Path(__file__).parent / "data"


class PropertyImporter:
    def __init__(self):
        self.supabase = supabase
        self.imported_count = 0
        self.failed_count = 0
        self.skipped_count = 0

    def normalize_property_data(self, prop: Dict, country: str) -> Optional[Dict]:
        """
        Normalize property data to match database schema
        Handles both US (Redfin) and CA (Realtor.ca) data formats
        """
        try:
            normalized = {
                'country': country,
            }

            # MLS/Property ID
            if 'mls_number' in prop:
                normalized['mls_number'] = str(prop['mls_number']) if prop['mls_number'] else None
            if 'property_id' in prop:
                normalized['property_id'] = str(prop['property_id']) if prop['property_id'] else None

            # Address - REQUIRED
            if 'address' in prop and prop['address']:
                normalized['address'] = str(prop['address']).strip()
            else:
                return None  # Skip properties without address

            # Location details
            if 'city' in prop and prop['city']:
                normalized['city'] = str(prop['city']).strip()

            if country == 'US':
                if 'state' in prop and prop['state']:
                    normalized['state'] = str(prop['state']).strip()
            elif country == 'CA':
                if 'province' in prop and prop['province']:
                    normalized['province'] = str(prop['province']).strip()

            if 'postal_code' in prop and prop['postal_code']:
                normalized['postal_code'] = str(prop['postal_code']).strip()

            # Coordinates
            if 'latitude' in prop and prop['latitude']:
                try:
                    normalized['latitude'] = float(prop['latitude'])
                except (ValueError, TypeError):
                    normalized['latitude'] = None

            if 'longitude' in prop and prop['longitude']:
                try:
                    normalized['longitude'] = float(prop['longitude'])
                except (ValueError, TypeError):
                    normalized['longitude'] = None

            # Price - REQUIRED
            if 'price' in prop and prop['price']:
                try:
                    # Handle both integer and string prices
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
                    normalized['bedrooms'] = int(prop['bedrooms'])
                except (ValueError, TypeError):
                    normalized['bedrooms'] = None

            if 'bathrooms' in prop and prop['bathrooms'] is not None:
                try:
                    normalized['bathrooms'] = int(prop['bathrooms'])
                except (ValueError, TypeError):
                    normalized['bathrooms'] = None

            if 'sqft' in prop and prop['sqft']:
                try:
                    # Handle numeric sqft
                    if isinstance(prop['sqft'], (int, float)):
                        normalized['sqft'] = int(prop['sqft'])
                    # Handle string sqft (e.g., "1500-2000 sqft")
                    else:
                        sqft_str = str(prop['sqft']).replace(',', '').replace('sqft', '').strip()
                        # Try to extract first number
                        import re
                        match = re.search(r'(\d+)', sqft_str)
                        if match:
                            normalized['sqft'] = int(match.group(1))
                except (ValueError, TypeError):
                    normalized['sqft'] = None

            if 'lot_size' in prop and prop['lot_size']:
                normalized['lot_size'] = str(prop['lot_size']).strip()

            if 'year_built' in prop and prop['year_built']:
                try:
                    normalized['year_built'] = int(prop['year_built'])
                except (ValueError, TypeError):
                    normalized['year_built'] = None

            if 'property_type' in prop and prop['property_type']:
                normalized['property_type'] = str(prop['property_type']).strip()

            # URLs
            if 'url' in prop and prop['url']:
                normalized['listing_url'] = str(prop['url']).strip()
            elif 'public_url' in prop and prop['public_url']:
                normalized['listing_url'] = str(prop['public_url']).strip()
            elif 'listing_url' in prop and prop['listing_url']:
                normalized['listing_url'] = str(prop['listing_url']).strip()

            if 'image_url' in prop and prop['image_url']:
                normalized['image_url'] = str(prop['image_url']).strip()

            if 'image_url_med' in prop and prop['image_url_med']:
                normalized['image_url_med'] = str(prop['image_url_med']).strip()

            if 'image_url_low' in prop and prop['image_url_low']:
                normalized['image_url_low'] = str(prop['image_url_low']).strip()

            if 'local_image_path' in prop and prop['local_image_path']:
                normalized['local_image_path'] = str(prop['local_image_path']).strip()

            return normalized

        except Exception as e:
            print(f"  Error normalizing property: {str(e)}")
            return None

    def import_batch(self, properties: List[Dict], country: str, batch_size: int = 100):
        """
        Import properties in batches to Supabase
        """
        print(f"\nImporting {len(properties)} {country} properties...")

        for i in range(0, len(properties), batch_size):
            batch = properties[i:i + batch_size]

            # Normalize batch
            normalized_batch = []
            for prop in batch:
                normalized = self.normalize_property_data(prop, country)
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
                                print(f"    ✗ Failed to import: {str(single_error)[:100]}")
                else:
                    self.failed_count += len(normalized_batch)
                    print(f"  ✗ Batch {i//batch_size + 1}: Error - {error_msg[:150]}")

    def import_from_json(self, filepath: Path, country: str):
        """Import properties from JSON file"""
        print(f"\n{'='*60}")
        print(f"Loading {country} properties from {filepath.name}")
        print(f"{'='*60}")

        if not filepath.exists():
            print(f"File not found: {filepath}")
            return

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                properties = json.load(f)

            print(f"Loaded {len(properties)} properties from JSON")
            self.import_batch(properties, country)

        except Exception as e:
            print(f"Error loading JSON file: {str(e)}")

    def import_from_csv(self, filepath: Path, country: str):
        """Import properties from CSV file"""
        print(f"\n{'='*60}")
        print(f"Loading {country} properties from {filepath.name}")
        print(f"{'='*60}")

        if not filepath.exists():
            print(f"File not found: {filepath}")
            return

        try:
            properties = []
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    properties.append(row)

            print(f"Loaded {len(properties)} properties from CSV")
            self.import_batch(properties, country)

        except Exception as e:
            print(f"Error loading CSV file: {str(e)}")

    def print_summary(self):
        """Print import summary"""
        print(f"\n{'='*60}")
        print(f"IMPORT SUMMARY")
        print(f"{'='*60}")
        print(f"✓ Successfully imported: {self.imported_count}")
        print(f"⚠ Skipped (duplicates/invalid): {self.skipped_count}")
        print(f"✗ Failed: {self.failed_count}")
        print(f"{'='*60}\n")


def main():
    importer = PropertyImporter()

    # Import Canadian properties
    ca_json = DATA_DIR / "properties_ca_selenium.json"
    if ca_json.exists():
        importer.import_from_json(ca_json, 'CA')
    else:
        print(f"Canadian data not found at {ca_json}")

    # Import US properties (if you have them)
    us_json = DATA_DIR / "properties_us.json"
    if us_json.exists():
        importer.import_from_json(us_json, 'US')
    else:
        print(f"US data not found at {us_json} (skipping)")

    # Alternative: Import from CSV
    # ca_csv = DATA_DIR / "properties_ca_selenium.csv"
    # if ca_csv.exists():
    #     importer.import_from_csv(ca_csv, 'CA')

    importer.print_summary()

    # Query and display some statistics
    try:
        print("\nQuerying database statistics...")
        result = supabase.table('property_stats').select('*').execute()

        if result.data:
            print("\nProperty Statistics:")
            for stat in result.data:
                print(f"\n{stat['country']}:")
                print(f"  Total: {stat['total_properties']:,}")
                print(f"  Avg Price: ${stat['avg_price']:,}")
                print(f"  Price Range: ${stat['min_price']:,} - ${stat['max_price']:,}")
                print(f"  Avg Beds: {stat['avg_bedrooms']}")
                print(f"  Avg Baths: {stat['avg_bathrooms']}")
    except Exception as e:
        print(f"Error querying stats: {str(e)}")


if __name__ == "__main__":
    main()
