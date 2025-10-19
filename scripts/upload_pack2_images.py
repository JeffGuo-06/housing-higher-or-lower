#!/usr/bin/env python3
"""
Upload Pack 2 property images from local directory to Supabase Storage
Reads images from scripts/images_ca_selenium/ and uploads them
"""

import os
import json
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
IMAGES_DIR = Path(__file__).parent / "images_ca_selenium"


class Pack2ImageUploader:
    def __init__(self):
        self.supabase = supabase
        self.uploaded_count = 0
        self.failed_count = 0
        self.skipped_count = 0

    def ensure_bucket_exists(self):
        """Create the storage bucket if it doesn't exist"""
        try:
            try:
                self.supabase.storage.get_bucket(BUCKET_NAME)
                print(f"✓ Bucket '{BUCKET_NAME}' already exists")
            except:
                print(f"Creating bucket '{BUCKET_NAME}'...")
                self.supabase.storage.create_bucket(
                    BUCKET_NAME,
                    options={"public": True}
                )
                print(f"✓ Bucket '{BUCKET_NAME}' created")
        except Exception as e:
            print(f"Error with bucket: {str(e)}")
            print("Note: You may need to create the bucket manually in Supabase dashboard")

    def upload_local_image(self, image_path: Path, mls_number: str) -> Optional[str]:
        """
        Upload a local image file to Supabase Storage
        Returns the public URL if successful
        """
        if not image_path.exists():
            return None

        try:
            # Read the local image file
            with open(image_path, 'rb') as f:
                image_data = f.read()

            # Generate storage path
            filename = f"{mls_number}.jpg"
            file_path = f"pack2/{filename}"  # Store Pack 2 images in separate folder

            # Upload to Supabase Storage
            self.supabase.storage.from_(BUCKET_NAME).upload(
                file_path,
                image_data,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )

            # Get public URL
            public_url = self.supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)

            self.uploaded_count += 1
            return public_url

        except Exception as e:
            self.failed_count += 1
            print(f"  ✗ Error uploading {mls_number}: {str(e)[:100]}")
            return None

    def process_properties(self, json_file: Path):
        """
        Process properties from JSON and upload local images
        Updates the JSON file with Supabase image URLs
        """
        print(f"\n{'='*60}")
        print(f"Processing Pack 2 images from {json_file.name}")
        print(f"{'='*60}\n")

        if not json_file.exists():
            print(f"File not found: {json_file}")
            return

        if not IMAGES_DIR.exists():
            print(f"Images directory not found: {IMAGES_DIR}")
            return

        # Load properties
        with open(json_file, 'r', encoding='utf-8') as f:
            properties = json.load(f)

        print(f"Found {len(properties)} properties")
        print(f"Images directory: {IMAGES_DIR}")

        # Get list of available image files
        available_images = {img.stem: img for img in IMAGES_DIR.glob("*.jpg")}
        print(f"Found {len(available_images)} image files in directory\n")

        # Process each property
        for i, prop in enumerate(properties, 1):
            mls_number = prop.get('mls_number', '')

            if not mls_number:
                self.skipped_count += 1
                continue

            # Find the local image file
            local_image_path = prop.get('local_image_path')

            if local_image_path:
                # Use the path specified in the JSON
                image_file = Path(local_image_path)
            else:
                # Try to find by MLS number
                if mls_number in available_images:
                    image_file = available_images[mls_number]
                else:
                    self.skipped_count += 1
                    if i <= 5:  # Only print first few misses
                        print(f"  ⚠ No local image found for MLS {mls_number}")
                    continue

            # Upload image
            public_url = self.upload_local_image(image_file, mls_number)

            if public_url:
                # Update property with Supabase URL
                prop['supabase_image_url'] = public_url

            if i % 50 == 0:
                print(f"  Progress: {i}/{len(properties)} ({self.uploaded_count} uploaded, {self.failed_count} failed, {self.skipped_count} skipped)")

        # Save updated JSON
        output_file = DATA_DIR / "properties_ca_selenium_with_supabase_urls.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(properties, f, indent=2)

        print(f"\n✓ Saved updated properties to {output_file}")

    def print_summary(self):
        """Print upload summary"""
        print(f"\n{'='*60}")
        print(f"PACK 2 IMAGE UPLOAD SUMMARY")
        print(f"{'='*60}")
        print(f"✓ Successfully uploaded: {self.uploaded_count}")
        print(f"⚠ Skipped (no local file): {self.skipped_count}")
        print(f"✗ Failed: {self.failed_count}")
        print(f"{'='*60}\n")


def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║          PACK 2 IMAGE UPLOAD TOOL                          ║
║  Upload local images to Supabase Storage                   ║
╚════════════════════════════════════════════════════════════╝
    """)

    # Check if images directory exists
    if not IMAGES_DIR.exists():
        print(f"✗ Images directory not found: {IMAGES_DIR}")
        print("\nPlease ensure the images_ca_selenium directory exists with images.")
        return

    # Count images
    image_count = len(list(IMAGES_DIR.glob("*.jpg")))
    print(f"\n✓ Found {image_count:,} images in {IMAGES_DIR.name}/")

    uploader = Pack2ImageUploader()

    # Ensure bucket exists
    uploader.ensure_bucket_exists()

    # Process Canadian properties
    ca_json = DATA_DIR / "properties_ca_selenium.json"
    if ca_json.exists():
        print(f"✓ Found property data: {ca_json.name}")

        # Confirm before proceeding
        print(f"\nThis will upload {image_count:,} images to Supabase Storage.")
        print(f"Storage path: {BUCKET_NAME}/pack2/")
        response = input("\nProceed with upload? (y/n): ")

        if response.lower() != 'y':
            print("Upload cancelled.")
            return

        uploader.process_properties(ca_json)
    else:
        print(f"✗ Property JSON not found: {ca_json}")
        return

    uploader.print_summary()

    print("\nNext steps:")
    print("1. Verify images uploaded correctly in Supabase dashboard")
    print("2. Run import_pack2_to_supabase.py to import properties with pack_id=2")
    print("3. Use the updated JSON file with Supabase URLs for import")


if __name__ == "__main__":
    main()
