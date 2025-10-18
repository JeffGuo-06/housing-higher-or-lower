#!/usr/bin/env python3
"""
Upload property images to Supabase Storage
Reads from scraped JSON and uploads images to a Supabase bucket
"""

import os
import json
import requests
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Configuration
BUCKET_NAME = "property-images"
DATA_DIR = Path(__file__).parent / "data"


class ImageUploader:
    def __init__(self):
        self.supabase = supabase
        self.session = requests.Session()
        self.uploaded_count = 0
        self.failed_count = 0
        self.skipped_count = 0

    def ensure_bucket_exists(self):
        """Create the storage bucket if it doesn't exist"""
        try:
            # Try to get bucket - if it exists, this won't error
            try:
                self.supabase.storage.get_bucket(BUCKET_NAME)
                print(f"✓ Bucket '{BUCKET_NAME}' already exists")
            except:
                # Bucket doesn't exist, create it
                print(f"Creating bucket '{BUCKET_NAME}'...")
                self.supabase.storage.create_bucket(
                    BUCKET_NAME,
                    options={"public": True}  # Make images publicly accessible
                )
                print(f"✓ Bucket '{BUCKET_NAME}' created")

        except Exception as e:
            print(f"Error with bucket: {str(e)}")
            print("Note: You may need to create the bucket manually in Supabase dashboard")
            # Don't raise - continue anyway, user might have created it manually

    def download_and_upload_image(self, image_url: str, property_id: str) -> Optional[str]:
        """
        Download image from URL and upload to Supabase Storage
        Returns the public URL if successful
        """
        if not image_url:
            return None

        try:
            # Download image
            response = self.session.get(image_url, timeout=10)
            response.raise_for_status()

            # Generate filename
            filename = f"{property_id}.jpg"
            file_path = f"properties/{filename}"

            # Upload to Supabase Storage
            self.supabase.storage.from_(BUCKET_NAME).upload(
                file_path,
                response.content,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )

            # Get public URL
            public_url = self.supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)

            self.uploaded_count += 1
            return public_url

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # Image not found, skip
                self.skipped_count += 1
                return None
            else:
                self.failed_count += 1
                print(f"  ✗ HTTP error downloading {image_url}: {e}")
                return None
        except Exception as e:
            self.failed_count += 1
            print(f"  ✗ Error uploading {property_id}: {str(e)[:100]}")
            return None

    def process_properties(self, json_file: Path):
        """
        Process properties from JSON and upload images
        Updates the JSON file with Supabase image URLs
        """
        print(f"\n{'='*60}")
        print(f"Processing images from {json_file.name}")
        print(f"{'='*60}\n")

        if not json_file.exists():
            print(f"File not found: {json_file}")
            return

        # Load properties
        with open(json_file, 'r', encoding='utf-8') as f:
            properties = json.load(f)

        print(f"Found {len(properties)} properties")

        # Process each property
        for i, prop in enumerate(properties, 1):
            image_url = prop.get('image_url')
            mls_number = prop.get('mls_number', f'prop_{i}')

            if not image_url:
                self.skipped_count += 1
                continue

            # Upload image
            public_url = self.download_and_upload_image(image_url, mls_number)

            if public_url:
                # Update property with Supabase URL
                prop['supabase_image_url'] = public_url

            if i % 10 == 0:
                print(f"  Progress: {i}/{len(properties)} ({self.uploaded_count} uploaded)")

        # Save updated JSON
        output_file = json_file.parent / f"{json_file.stem}_with_supabase_urls.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(properties, f, indent=2)

        print(f"\n✓ Saved updated properties to {output_file}")

    def print_summary(self):
        """Print upload summary"""
        print(f"\n{'='*60}")
        print(f"UPLOAD SUMMARY")
        print(f"{'='*60}")
        print(f"✓ Successfully uploaded: {self.uploaded_count}")
        print(f"⚠ Skipped (no URL or 404): {self.skipped_count}")
        print(f"✗ Failed: {self.failed_count}")
        print(f"{'='*60}\n")


def main():
    uploader = ImageUploader()

    # Ensure bucket exists
    uploader.ensure_bucket_exists()

    # Process Canadian properties
    ca_json = DATA_DIR / "properties_ca_selenium.json"
    if ca_json.exists():
        uploader.process_properties(ca_json)
    else:
        # Try test file
        test_json = DATA_DIR / "test_properties_realtor_improved.json"
        if test_json.exists():
            uploader.process_properties(test_json)
        else:
            print(f"No property JSON found in {DATA_DIR}")
            return

    uploader.print_summary()

    print("\nNext steps:")
    print("1. Run import_to_supabase.py to import properties to database")
    print("2. Update import script to use 'supabase_image_url' field")


if __name__ == "__main__":
    main()
