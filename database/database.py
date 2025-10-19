"""
Database connection and initialization.

Classes:
    DatabaseContext:
        Context manager for SQLite database connections.
    Database:
        SQLite database manager for the maps application.
"""

import sqlite3
import os
from typing import Optional, List
import logging
from contextlib import contextmanager


class DatabaseContext:
    """
    Database context manager for SQLite DB.

    Attributes:
        db_path (str):
            Path to the SQLite database file

    Methods:
        __init__:
            Initialize DatabaseContext
        __enter__:
            Start context manager
        __exit__:
            Exit context manager
    """

    def __init__(
        self,
        db_path: str
    ) -> None:
        """
        Initialize the DatabaseContext instance.

        Args:
            db_path (str): Path to the SQLite database file

        Returns:
            None
        """

        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        self.conn.execute("PRAGMA foreign_keys = ON")

    def __enter__(
        self
    ) -> 'DatabaseContext':
        """
        Start the context manager and return the instance.

        Args:
            None

        Returns:
            DatabaseContext: The instance of the DatabaseContext.
        """

        return self

    def __exit__(
        self,
        exc_type,
        exc_value,
        traceback
    ) -> None:
        """
        Exit the context manager, handling any exceptions.

        Args:
            exc_type (type): The type of the exception raised.
            exc_val (Exception): The exception instance.
            exc_tb (traceback.TracebackException): The traceback object.

        Returns:
            None
        """

        # Commit or rollback
        if exc_type:
            self.conn.rollback()
        else:
            self.conn.commit()

        # Close the connection
        self.conn.close()


class DatabaseManager:
    """
    Database manager for the mapps application.

    Attributes:
        db (DatabaseContext):
            An instance of DatabaseContext for database operations.

    Methods:
        __init__:
            Initialize DatabaseManager
        initialise:
            Create database tables and indexes if they don't exist
    """

    def __init__(
        self,
        db: 'DatabaseContext'
    ) -> None:
        """
        Initializes the DatabaseManager with a DatabaseContext instance.
            This uses a 'composition' approach

        Args:
            db (DatabaseContext): An instance of DatabaseContext for
                database operations.

        Returns:
            None
        """

        self.db = db

    def initialise(
        self,
        schema_file: str = "database/schema.sql"
    ) -> None:
        """
        Create database tables and indexes if they don't exist.
        Reads the schema from an sql script file.

        Args:
            schema_file (str): Path to the SQL schema file

        Returns:
            None
        """

        # Ensure database directory exists
        try:
            db_dir = os.path.dirname(self.db.db_path)
            if db_dir and not os.path.exists(db_dir):
                # Create directory if needed
                os.makedirs(db_dir)

        except Exception as e:
            logging.error(f"Error creating database directory: {e}")
            raise

        # Read schema SQL from file
        try:
            with open(schema_file, "r", encoding="utf-8") as f:
                schema_sql = f.read()

            self.db.cursor.executescript(schema_sql)
            self.db.conn.commit()

        except Exception as e:
            logging.error(f"Error initializing database schema: {e}")
            raise

        logging.info("Database initialized successfully.")

    def create(
        self
    ) -> None:
        """
        Create a new record in the database.
        """

        logging.warning("Database create method not implemented yet.")

    def read(
        self
    ) -> None:
        """
        Read records from the database.
        """

        logging.warning("Database read method not implemented yet.")

    def update(
        self
    ) -> None:
        """
        Update an existing record in the database.
        """

        logging.warning("Database update method not implemented yet.")

    def delete(
        self
    ) -> None:
        """
        Delete a record from the database.
        """

        logging.warning("Database delete method not implemented yet.")


class Database:
    """
    Legacy SQLite database manager for the maps application.

    Attributes:
        db_path (str): Path to the SQLite database file

    Methods:
        __init__:
            Initialize instance
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

        Args:
            db_path (str): Path to the SQLite database file

        Returns:
            None
        """

        # Set database path
        self.db_path = db_path

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
