"""
Database connection and initialization.
"""

import sqlite3
import os
from typing import Optional, Any, List, Dict
from contextlib import contextmanager


class Database:
    """
    SQLite database manager for the maps application.
    
    Attributes:
        db_path (str): Path to the SQLite database file
    
    Methods:
        __init__:
            Initialize Database
        initialize_schema:
            Create database tables
        get_connection:
            Get a database connection
        execute:
            Execute a SQL query
        fetchone:
            Fetch one row from query results
        fetchall:
            Fetch all rows from query results
    """

    def __init__(
        self,
        db_path: str
    ) -> None:
        """
        Initialize the Database manager.
        
        Args:
            db_path (str): Path to the SQLite database file
        
        Returns:
            None
        """
        
        self.db_path = db_path
        self._ensure_directory()

    def _ensure_directory(self) -> None:
        """
        Ensure the database directory exists.
        
        Returns:
            None
        """
        
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)

    def initialize_schema(self) -> None:
        """
        Create database tables if they don't exist.
        
        Returns:
            None
        """
        
        schema_sql = """
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            center_lat REAL NOT NULL,
            center_lon REAL NOT NULL,
            zoom_level INTEGER DEFAULT 13,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS map_areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            parent_id INTEGER,
            name TEXT NOT NULL,
            area_type TEXT NOT NULL,
            boundary_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES map_areas(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS boundaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            map_area_id INTEGER NOT NULL,
            coordinates TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (map_area_id) REFERENCES map_areas(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS layers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            layer_type TEXT NOT NULL,
            visible BOOLEAN DEFAULT 1,
            z_index INTEGER DEFAULT 0,
            config TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS annotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            layer_id INTEGER NOT NULL,
            annotation_type TEXT NOT NULL,
            coordinates TEXT NOT NULL,
            style TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (layer_id) REFERENCES layers(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_map_areas_project ON map_areas(project_id);
        CREATE INDEX IF NOT EXISTS idx_map_areas_parent ON map_areas(parent_id);
        CREATE INDEX IF NOT EXISTS idx_boundaries_map_area ON boundaries(map_area_id);
        CREATE INDEX IF NOT EXISTS idx_layers_project ON layers(project_id);
        CREATE INDEX IF NOT EXISTS idx_annotations_layer ON annotations(layer_id);
        """
        
        with self.get_connection() as conn:
            conn.executescript(schema_sql)
            conn.commit()

    @contextmanager
    def get_connection(self):
        """
        Get a database connection context manager.
        
        Yields:
            sqlite3.Connection: Database connection
        """
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        
        try:
            yield conn
        finally:
            conn.close()

    def execute(
        self,
        query: str,
        params: tuple = ()
    ) -> sqlite3.Cursor:
        """
        Execute a SQL query.
        
        Args:
            query (str): SQL query to execute
            params (tuple): Query parameters
        
        Returns:
            sqlite3.Cursor: Query cursor
        """
        
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            conn.commit()
            return cursor

    def fetchone(
        self,
        query: str,
        params: tuple = ()
    ) -> Optional[sqlite3.Row]:
        """
        Fetch one row from query results.
        
        Args:
            query (str): SQL query to execute
            params (tuple): Query parameters
        
        Returns:
            Optional[sqlite3.Row]: Query result row or None
        """
        
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            return cursor.fetchone()

    def fetchall(
        self,
        query: str,
        params: tuple = ()
    ) -> List[sqlite3.Row]:
        """
        Fetch all rows from query results.
        
        Args:
            query (str): SQL query to execute
            params (tuple): Query parameters
        
        Returns:
            List[sqlite3.Row]: List of query result rows
        """
        
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            return cursor.fetchall()


# Global database instance
_db: Optional[Database] = None


def get_db(
    db_path: Optional[str] = None
) -> Database:
    """
    Get or create the global database instance.
    
    Args:
        db_path (Optional[str]): Database path (uses default if None)
    
    Returns:
        Database: Global database instance
    """
    
    global _db
    
    if _db is None:
        if db_path is None:
            from config import get_config
            config = get_config()
            db_path = config.DATABASE_PATH
        
        _db = Database(db_path)
        _db.initialize_schema()
    
    return _db
