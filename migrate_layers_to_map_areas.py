"""
Database migration to update layers table for map_area-specific layers.

This migration:
1. Adds new columns: map_area_id, parent_layer_id, is_editable
2. Migrates existing layers to be associated with master map areas
3. Removes old project_id column
4. Updates indexes
"""

import sys
from database import Database
from config import Config


def migrate() -> None:
    """
    Execute the migration.
    
    Returns:
        None
    """
    
    config = Config()
    db = Database(config.DATABASE_PATH)
    
    print("Starting layers table migration...")
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        
        # Check if migration is needed
        cursor.execute("PRAGMA table_info(layers)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'map_area_id' in columns:
            print("Migration already applied. Skipping.")
            return
        
        print("Creating backup of layers table...")
        cursor.execute("""
            CREATE TABLE layers_backup AS
            SELECT * FROM layers
        """)
        
        print("Adding new columns...")
        cursor.execute("""
            ALTER TABLE layers
            ADD COLUMN map_area_id INTEGER
        """)
        
        cursor.execute("""
            ALTER TABLE layers
            ADD COLUMN parent_layer_id INTEGER
        """)
        
        cursor.execute("""
            ALTER TABLE layers
            ADD COLUMN is_editable BOOLEAN DEFAULT 1
        """)
        
        print("Migrating existing layers to master map areas...")
        # Associate each layer with the master map area of its project
        cursor.execute("""
            UPDATE layers
            SET map_area_id = (
                SELECT id
                FROM map_areas
                WHERE map_areas.project_id = layers.project_id
                  AND map_areas.area_type = 'master'
                LIMIT 1
            )
            WHERE EXISTS (
                SELECT 1
                FROM map_areas
                WHERE map_areas.project_id = layers.project_id
                  AND map_areas.area_type = 'master'
            )
        """)
        
        # Delete layers that don't have a master map area
        cursor.execute("""
            DELETE FROM layers
            WHERE map_area_id IS NULL
        """)
        
        print("Creating new layers table with updated schema...")
        cursor.execute("""
            CREATE TABLE layers_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                map_area_id INTEGER NOT NULL,
                parent_layer_id INTEGER,
                name TEXT NOT NULL,
                layer_type TEXT NOT NULL,
                visible BOOLEAN DEFAULT 1,
                z_index INTEGER DEFAULT 0,
                is_editable BOOLEAN DEFAULT 1,
                config TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (map_area_id)
                    REFERENCES map_areas(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_layer_id)
                    REFERENCES layers(id) ON DELETE CASCADE
            )
        """)
        
        print("Copying data to new table...")
        cursor.execute("""
            INSERT INTO layers_new (
                id, map_area_id, parent_layer_id, name, layer_type,
                visible, z_index, is_editable, config,
                created_at, updated_at
            )
            SELECT
                id, map_area_id, parent_layer_id, name, layer_type,
                visible, z_index, is_editable, config,
                created_at, updated_at
            FROM layers
        """)
        
        print("Dropping old table...")
        cursor.execute("DROP TABLE layers")
        
        print("Renaming new table...")
        cursor.execute("ALTER TABLE layers_new RENAME TO layers")
        
        print("Creating indexes...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_layers_map_area
            ON layers(map_area_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_layers_parent
            ON layers(parent_layer_id)
        """)
        
        # Drop old project index if it exists
        try:
            cursor.execute("DROP INDEX IF EXISTS idx_layers_project")
        except Exception:
            pass
        
        conn.commit()
        print("Migration completed successfully!")
        print("Backup table 'layers_backup' created for safety.")


def rollback() -> None:
    """
    Rollback the migration.
    
    Returns:
        None
    """
    
    config = Config()
    db = Database(config.DATABASE_PATH)
    
    print("Rolling back migration...")
    
    with db.get_connection() as conn:
        cursor = conn.cursor()
        
        # Check if backup exists
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='layers_backup'
        """)
        
        if not cursor.fetchone():
            print("No backup found. Cannot rollback.")
            return
        
        print("Restoring from backup...")
        cursor.execute("DROP TABLE IF EXISTS layers")
        cursor.execute("""
            ALTER TABLE layers_backup RENAME TO layers
        """)
        
        conn.commit()
        print("Rollback completed successfully!")


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'rollback':
        rollback()
    else:
        migrate()
