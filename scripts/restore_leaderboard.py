#!/usr/bin/env python3
"""
Restore leaderboard data from a backup file
"""

import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Backup directory
BACKUP_DIR = Path(__file__).parent / "backups"


def restore_leaderboard(backup_filename):
    """
    Restore leaderboard data from a backup file

    WARNING: This will DELETE all current leaderboard data!
    """
    print("=" * 60)
    print("LEADERBOARD RESTORE SCRIPT")
    print("=" * 60)
    print("\n⚠️  WARNING: This will DELETE all current leaderboard data!")
    print("⚠️  Make sure you have a current backup before proceeding!\n")

    # Find backup file
    backup_path = BACKUP_DIR / backup_filename
    if not backup_path.exists():
        print(f"✗ Backup file not found: {backup_path}")
        return False

    try:
        # Load backup data
        print(f"Loading backup from: {backup_path}")
        with open(backup_path, 'r', encoding='utf-8') as f:
            backup = json.load(f)

        leaderboard_data = backup.get('data', [])
        record_count = len(leaderboard_data)

        print(f"\nBackup Information:")
        print(f"  Date: {backup.get('backup_date', 'Unknown')}")
        print(f"  Records: {record_count:,}")
        print(f"  Reason: {backup.get('backup_reason', 'N/A')}")

        # Confirm with user
        confirmation = input(f"\nRestore {record_count:,} records? This will DELETE current data! (yes/no): ")
        if confirmation.lower() != 'yes':
            print("\n✗ Restore cancelled")
            return False

        # Delete current leaderboard data
        print("\n🗑️  Deleting current leaderboard data...")
        response = supabase.table('leaderboard').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"✓ Current data deleted")

        # Restore data in batches
        batch_size = 100
        restored_count = 0

        print(f"\n📥 Restoring {record_count:,} records in batches of {batch_size}...")

        for i in range(0, record_count, batch_size):
            batch = leaderboard_data[i:i + batch_size]

            # Remove any fields that might cause issues
            clean_batch = []
            for record in batch:
                clean_record = {
                    'id': record['id'],
                    'player_name': record['player_name'],
                    'score': record['score'],
                    'correct_guesses': record.get('correct_guesses', 0),
                    'total_guesses': record.get('total_guesses', 0),
                    'created_at': record['created_at']
                }
                # Add pack_id if it exists in the backup
                if 'pack_id' in record:
                    clean_record['pack_id'] = record['pack_id']

                clean_batch.append(clean_record)

            # Insert batch
            supabase.table('leaderboard').insert(clean_batch).execute()
            restored_count += len(batch)

            print(f"  ✓ Restored {restored_count:,} / {record_count:,} records")

        print("\n" + "=" * 60)
        print("RESTORE COMPLETE!")
        print("=" * 60)
        print(f"\n✓ Successfully restored {restored_count:,} leaderboard records")

        return True

    except Exception as e:
        print(f"\n✗ Error restoring backup: {str(e)}")
        raise


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python restore_leaderboard.py <backup_filename>")
        print("\nExample:")
        print("  python restore_leaderboard.py leaderboard_backup_20250118_120000.json")
        print("  python restore_leaderboard.py leaderboard_backup_latest.json")
        print("\nAvailable backups:")

        # List available backups
        backups = sorted(BACKUP_DIR.glob("leaderboard_backup_*.json"), reverse=True)
        if backups:
            for backup_file in backups[:5]:  # Show last 5
                print(f"  - {backup_file.name}")
        else:
            print("  (No backups found)")

        sys.exit(1)

    backup_filename = sys.argv[1]
    restore_leaderboard(backup_filename)
