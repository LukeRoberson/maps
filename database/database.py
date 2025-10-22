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
import logging
from typing import (
    Optional,
    List,
    Union,
    Dict,
    Any
)


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
        create:
            Create a new record in the database
        read:
            Read one or more records from the database
        update:
            Update an existing record in the database
        delete:
            Delete a record from the database
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
        table: str,
        params: dict = {}
    ) -> Optional[int]:
        """
        Create a new record in the database.

        Args:
            table (str): The table to insert into
            params (dict): A dictionary of column names and values to insert.

        Returns:
            Optional[int]: The ID of the created record.
        """

        # The list of values to insert
        parameters = []

        # Build the full query
        full_query = (
            f"INSERT INTO {table} ("
        )

        for key, value in params.items():
            full_query += f"{key}, "
            parameters.append(value)

        full_query = full_query.rstrip(", ") + ") VALUES ("

        full_query += ", ".join(["?"] * len(params)) + ")"

        # Execute the query
        logging.debug(
            f"Executing create query: {full_query} with params: {parameters}"
        )
        result = self.db.cursor.execute(
            full_query,
            parameters,
        )

        # Return the last inserted ID
        return result.lastrowid

    def read(
        self,
        table: str,
        fields: List[str],
        params: dict = {},
        order_by: Optional[list[str]] = None,
        order_desc: bool = False,
        limit: Optional[int] = None,
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

        parameters = []

        # Build query
        query = f"SELECT {', '.join(fields)} FROM {table} "

        if params:
            query += "WHERE "

        for key, value in params.items():
            if value == 'NULL':
                query += f"{key} IS NULL AND "
            else:
                query += f"{key} = ? AND "
                parameters.append(value)
        query = query.rstrip(" AND ")

        if order_by:
            query += " ORDER BY " + ", ".join(order_by)
            if order_desc:
                query += " DESC"

        if limit is not None:
            query += f" LIMIT {limit}"

        # Execute the query
        logging.debug(
            f"Executing read query: {query} with params: {parameters}"
        )
        result = self.db.cursor.execute(
            query,
            parameters,
        )

        # Fetch all results or one
        if get_all:
            return result.fetchall()

        else:
            return result.fetchone()

    def update(
        self,
        table: str,
        fields: dict,
        parameters: Dict[str, Any],
    ) -> None:
        """
        Update an existing record in the database.

        Args:
            table (str): The table to update.
            fields (List[str]): The fields to update.
            parameters (Dict[str, Any]):
                A dictionary of column names and values to identify the record.

        Returns:
            None
        """

        field_values = []
        param_values = []

        update_string = f"UPDATE {table} SET "
        for key, value in fields.items():
            if isinstance(value, str) and value.upper() == "CURRENT_TIMESTAMP":
                update_string += f"{key} = CURRENT_TIMESTAMP, "
            else:
                update_string += f"{key} = ?, "
                field_values.append(value)
        update_string = update_string.rstrip(", ")

        update_string += " WHERE "
        for key, value in parameters.items():
            update_string += f"{key} = ?"
            param_values.append(value)

        values = field_values + param_values

        # Use update_string and values for execution
        logging.debug(
            f"Executing update query: {update_string} with params: {values}"
        )
        self.db.cursor.execute(
            update_string,
            values,
        )

    def delete(
        self,
        table: str,
        parameters: dict,
    ) -> sqlite3.Cursor:
        """
        Delete a record from the database.

        Args:
            table (str): The table to delete from.
            query (str): The delete query to execute.
            parameters (dict):
                A dictionary of column names and values to identify the record.

        Returns:
            None
        """

        param_list = []

        delete_string = f"DELETE FROM {table} WHERE "

        for key, value in parameters.items():
            delete_string += f"{key} = ? AND "
            param_list.append(value)
        delete_string = delete_string.rstrip(" AND ")

        logging.debug(
            f"Delete query: {delete_string} with params: {param_list}"
        )
        result = self.db.cursor.execute(
            delete_string,
            param_list,
        )

        return result
