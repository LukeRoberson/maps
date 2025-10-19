"""
Database connection and initialization.

Classes:
    Database: SQLite database manager for the maps application.
"""

import sqlite3
import os
from typing import Optional, List
from contextlib import contextmanager


class Database:
    """
    SQLite database manager for the maps application.

    Attributes:
        db_path (str): Path to the SQLite database file

    Methods:
        __init__:
            Initialize Database
        _initialize_schema:
            Create database tables and indexes if they don't exist
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
        Initialize the Database manager instance.
        Checks that the DB directory exists, creating it if necessary.

        Args:
            db_path (str): Path to the SQLite database file

        Returns:
            None
        """

        # Set database path
        self.db_path = db_path

        # Ensure database directory exists
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            # Create directory if needed
            os.makedirs(db_dir)

        # Create database schema if it doesn't exist
        self._initialize_schema()

    def _initialize_schema(
        self,
        schema_file: str = "database/schema.sql"
    ) -> None:
        """
        Create database tables and indexed if they don't exist.
        Reads the schema from an sql script file.

        Args:
            schema_file (str): Path to the SQL schema file

        Returns:
            None
        """

        # Read schema SQL from file
        with open(schema_file, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        # Execute schema SQL
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
