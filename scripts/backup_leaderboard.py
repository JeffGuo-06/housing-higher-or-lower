#!/usr/bin/env python3
"""
Backup leaderboard data to local JSON file
Run this before any risky database operations
"""

import os
import json
from datetime import datetime
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
BACKUP_DIR.mkdir(exist_ok=True)


def backup_leaderboard():
    """
    Backup all leaderboard data to a timestamped JSON file
    """
    print("=" * 60)
    print("LEADERBOARD BACKUP SCRIPT")
    print("=" * 60)

    try:
        # Fetch all leaderboard data
        print("\nFetching leaderboard data from Supabase...")
        response = supabase.table('leaderboard').select('*').execute()

        if not response.data:
            print("⚠️  No leaderboard data found!")
            return

        leaderboard_data = response.data
        record_count = len(leaderboard_data)

        print(f"✓ Retrieved {record_count:,} leaderboard records")

        # Create timestamped filename
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"leaderboard_backup_{timestamp}.json"
        backup_path = BACKUP_DIR / backup_filename

        # Create backup metadata
        backup = {
            "backup_date": datetime.utcnow().isoformat(),
            "backup_reason": "Pre-migration safety backup",
            "record_count": record_count,
            "data": leaderboard_data,
            "statistics": {
                "total_scores": record_count,
                "highest_score": max((r['score'] for r in leaderboard_data), default=0),
                "unique_players": len(set(r['player_name'] for r in leaderboard_data)),
            }
        }

        # Save to file
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(backup, f, indent=2, default=str)

        print(f"\n✓ Backup saved to: {backup_path}")
        print(f"\nBackup Statistics:")
        print(f"  Total Records: {record_count:,}")
        print(f"  Highest Score: {backup['statistics']['highest_score']:,}")
        print(f"  Unique Players: {backup['statistics']['unique_players']:,}")
        print(f"  File Size: {backup_path.stat().st_size / 1024:.2f} KB")

        # Also create a "latest" backup for easy reference
        latest_path = BACKUP_DIR / "leaderboard_backup_latest.json"
        with open(latest_path, 'w', encoding='utf-8') as f:
            json.dump(backup, f, indent=2, default=str)

        print(f"\n✓ Also saved as: {latest_path}")

        print("\n" + "=" * 60)
        print("BACKUP COMPLETE!")
        print("=" * 60)
        print("\nTo restore this backup, run:")
        print(f"  python restore_leaderboard.py {backup_filename}")

        return backup_path

    except Exception as e:
        print(f"\n✗ Error creating backup: {str(e)}")
        raise


def list_backups():
    """List all available backups"""
    backups = sorted(BACKUP_DIR.glob("leaderboard_backup_*.json"), reverse=True)

    if not backups:
        print("\nNo backups found in", BACKUP_DIR)
        return

    print("\nAvailable Backups:")
    print("-" * 60)
    for backup_file in backups:
        if backup_file.name == "leaderboard_backup_latest.json":
            continue

        try:
            with open(backup_file, 'r') as f:
                backup_data = json.load(f)

            print(f"\n📁 {backup_file.name}")
            print(f"   Date: {backup_data.get('backup_date', 'Unknown')}")
            print(f"   Records: {backup_data.get('record_count', 0):,}")
            print(f"   Size: {backup_file.stat().st_size / 1024:.2f} KB")
        except Exception as e:
            print(f"\n📁 {backup_file.name} (Error reading: {e})")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        list_backups()
    else:
        backup_leaderboard()
