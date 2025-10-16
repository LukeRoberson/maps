"""
Migration script to add default view columns to map_areas table.
Run this once to update existing databases.
"""

import sqlite3
import os
from config import Config


def migrate_database() -> None:
    """
    Add default view columns to the map_areas table.
    
    Returns:
        None
    """
    
    database_path = Config.DATABASE_PATH
    
    if not os.path.exists(database_path):
        print(f"Database not found at {database_path}")
        print("No migration needed - will be created with new schema")
        return
    
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(map_areas)")
        columns = [row[1] for row in cursor.fetchall()]
        
        columns_to_add = []
        if 'default_center_lat' not in columns:
            columns_to_add.append(
                'ALTER TABLE map_areas ADD COLUMN default_center_lat REAL'
            )
        if 'default_center_lon' not in columns:
            columns_to_add.append(
                'ALTER TABLE map_areas ADD COLUMN default_center_lon REAL'
            )
        if 'default_zoom' not in columns:
            columns_to_add.append(
                'ALTER TABLE map_areas ADD COLUMN default_zoom INTEGER'
            )
        
        if not columns_to_add:
            print("✓ All columns already exist - no migration needed")
            return
        
        # Add the new columns
        for sql in columns_to_add:
            cursor.execute(sql)
            print(f"✓ Executed: {sql}")
        
        conn.commit()
        print(f"\n✓ Successfully migrated database at {database_path}")
        print("  Added default view columns to map_areas table")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    
    finally:
        conn.close()


if __name__ == '__main__':
    print("Starting database migration...")
    print("=" * 60)
    migrate_database()
    print("=" * 60)
    print("Migration complete!")

