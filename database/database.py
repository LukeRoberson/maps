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
from typing import Optional, List, Union
import logging


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
        self,
        query: str,
        params: tuple = ()
    ) -> Optional[int]:
        """
        Create a new record in the database.

        Args:
            query (str): The insert query to execute.
            params (tuple): Parameters for the insert query.

        Returns:
            Optional[int]: The ID of the created record.
        """

        # Execute the query
        logging.debug(f"Executing create query: {query} with params: {params}")
        result = self.db.cursor.execute(
            query,
            params,
        )

        # Return the last inserted ID
        return result.lastrowid

    def read(
        self,
        query: str,
        params: tuple = (),
        get_all: bool = False
    ) -> Union[sqlite3.Row, List[sqlite3.Row], None]:
        """
        Read one or more records from the database.

        Args:
            query (str): The query to execute.
            params (tuple): Parameters for the query.
            get_all (bool): If True, fetch all records; otherwise, fetch one.

        Returns:
            Union[sqlite3.Row, List[sqlite3.Row], None]:
                The fetched record or None.
        """

        # Execute the query
        logging.debug(f"Executing read query: {query} with params: {params}")
        result = self.db.cursor.execute(
            query,
            params,
        )

        # Fetch all results or one
        if get_all:
            return result.fetchall()

        else:
            return result.fetchone()

    def update(
        self,
        query: str,
        params: tuple = ()
    ) -> None:
        """
        Update an existing record in the database.

        Args:
            query (str): The update query to execute.
            params (tuple): Parameters for the update query.

        Returns:
            None
        """

        logging.debug(f"Executing update query: {query} with params: {params}")
        self.db.cursor.execute(
            query,
            params,
        )

    def delete(
        self,
        query: str,
        params: tuple = ()
    ) -> sqlite3.Cursor:
        """
        Delete a record from the database.

        Args:
            query (str): The delete query to execute.
            params (tuple): Parameters for the delete query.

        Returns:
            None
        """

        logging.info(f"Executing delete query: {query} with params: {params}")
        result = self.db.cursor.execute(
            query,
            params,
        )

        return result
