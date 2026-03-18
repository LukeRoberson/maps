"""
Database migration utilities for schema evolution.

This module provides functions to handle database schema migrations,
ensuring that new columns and features are properly added to existing databases.
"""

import sqlite3
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def column_exists(
    cursor: sqlite3.Cursor,
    table: str,
    column: str
) -> bool:
    """
    Check if a column exists in a table.

    Args:
        cursor (sqlite3.Cursor): Database cursor
        table (str): Table name
        column (str): Column name

    Returns:
        bool: True if column exists, False otherwise
    """
    try:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]  # Column name is at index 1
        return column in column_names
    except Exception as e:
        logger.error(f"Error checking column existence: {e}")
        return False


def migrate_add_parent_layer_id(
    cursor: sqlite3.Cursor,
    conn: sqlite3.Connection
) -> None:
    """
    Migration: Add parent_layer_id column to layers table if it doesn't exist.

    This migration adds support for inherited layers by allowing layers
    to reference their parent layer.

    Args:
        cursor (sqlite3.Cursor): Database cursor
        conn (sqlite3.Connection): Database connection

    Returns:
        None
    """
    if not column_exists(cursor, 'layers', 'parent_layer_id'):
        try:
            logger.info("Adding parent_layer_id column to layers table...")
            cursor.execute("""
                ALTER TABLE layers
                ADD COLUMN parent_layer_id INTEGER
            """)
            # Create index for parent_layer_id if it doesn't exist
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_layers_parent ON layers(parent_layer_id)
            """)
            conn.commit()
            logger.info("Successfully added parent_layer_id column to layers table")
        except Exception as e:
            logger.error(f"Error adding parent_layer_id column: {e}")
            conn.rollback()
            raise
    else:
        logger.info("parent_layer_id column already exists in layers table")


def run_migrations(db_path: str) -> None:
    """
    Run all pending database migrations.

    Args:
        db_path (str): Path to the SQLite database file

    Returns:
        None
    """
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Run migrations in order
        migrate_add_parent_layer_id(cursor, conn)
        
        conn.close()
        logger.info("All migrations completed successfully")
    except Exception as e:
        logger.error(f"Error running migrations: {e}")
        raise
