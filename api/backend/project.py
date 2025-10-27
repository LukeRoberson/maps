"""
Module: backend.project

Classes for managing projects.

Classes:
    ProjectModel:
        A data structure that represents a map project.
    ProjectService:
        Class for managing projects in the database.

Third-party modules:
    Flask:
        current_app: Access the Flask application context.

Local modules:
    database:
        DatabaseContext: Context manager for database connections.
        DatabaseManager: Manager for database operations.
"""


# Standard library imports
import logging
from datetime import (
    datetime,
    timezone
)
from typing import (
    Optional,
    List,
    Dict,
    Any,
    Union,
    overload
)

# Third-party imports
from flask import current_app

# Local imports
from database import (
    DatabaseContext,
    DatabaseManager
)


logger = logging.getLogger(__name__)


class ProjectModel:
    """
    A data structure that represents a map project.
    This reflects the 'projects' table in the database.

    Attributes:
        id (Optional[int]): Unique identifier
        name (str): Project name
        description (str): Project description
        center_lat (float): Center latitude of the map
        center_lon (float): Center longitude of the map
        zoom_level (int): Initial zoom level
        created_at (datetime): Creation timestamp
        updated_at (datetime): Last update timestamp

    Methods:
        __init__:
            Initialize Project
        to_dict:
            Convert project to dictionary representation
        from_dict:
            Create project from dictionary
    """

    def __init__(
        self,
        name: str,
        description: str,
        center_lat: float,
        center_lon: float,
        zoom_level: int = 13,
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ) -> None:
        """
        Initialize a Project.

        Args:
            name (str): Project name
            description (str): Project description
            center_lat (float): Center latitude
            center_lon (float): Center longitude
            zoom_level (int): Initial zoom level
            id (Optional[int]): Project ID
            created_at (Optional[datetime]): Creation timestamp
            updated_at (Optional[datetime]): Update timestamp

        Returns:
            None
        """

        self.id = id
        self.name = name
        self.description = description
        self.center_lat = center_lat
        self.center_lon = center_lon
        self.zoom_level = zoom_level

        # Timestamps are in UTC
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def to_dict(
        self
    ) -> Dict[str, Any]:
        """
        Convert project to dictionary representation.

        Args:
            None

        Returns:
            Dict[str, Any]: Dictionary representation of the project
        """

        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'center_lat': self.center_lat,
            'center_lon': self.center_lon,
            'zoom_level': self.zoom_level,
            'created_at': (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            'updated_at': (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }

    @classmethod
    def from_dict(
        cls,
        data: Dict[str, Any]
    ) -> 'ProjectModel':
        """
        Create a Project from dictionary data.
            This is an alternative constructor, rather than __init__().
            Rather than passing details in one at a time,
            we can pass a dictionary.

        Args:
            data (Dict[str, Any]): Dictionary containing project data

        Returns:
            Project: New Project instance
        """

        # Get the datetime fields if they exist
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'])

        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'])

        # Create and return the Project instance
        return cls(
            id=data.get('id'),
            name=data['name'],
            description=data['description'],
            center_lat=data['center_lat'],
            center_lon=data['center_lon'],
            zoom_level=data.get('zoom_level', 13),
            created_at=created_at,
            updated_at=updated_at
        )


class ProjectService:
    """
    Class for managing projects in the database.

    Methods:
        __init__:
            Initialize the class instance
        _row_to_model:
            Convert a database row to a ProjectModel
        create:
            Create a new project
        read:
            read one or more project entries
        update:
            Update a project
        delete:
            Delete a project
    """

    def __init__(self) -> None:
        """
        Initialize the class instance.

        Returns:
            None
        """

        # Get the config from the Flask application context
        self.db_path: str = current_app.config['DATABASE_PATH']

    def _row_to_model(
        self,
        row: Dict[str, Any]
    ) -> ProjectModel:
        """
        Convert a database row to a ProjectModel.

        Args:
            row (Dict[str, Any]): Database row

        Returns:
            ProjectModel: Project model instance
        """

        return ProjectModel(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            center_lat=row['center_lat'],
            center_lon=row['center_lon'],
            zoom_level=row['zoom_level'],
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        )

    def create(
        self,
        project: ProjectModel
    ) -> ProjectModel:
        """
        Create a new project.

        Args:
            project (Project): Project to create

        Returns:
            Project: Created project with assigned ID
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                project_id = db_manager.create(
                    table="projects",
                    params={
                        "name": project.name,
                        "description": project.description,
                        "center_lat": project.center_lat,
                        "center_lon": project.center_lon,
                        "zoom_level": project.zoom_level
                    }
                )

            # Update the project instance with the new ID
            project.id = project_id
            return project

        except Exception as e:
            logger.error(f"Error creating project: {str(e)}")
            raise

    @overload
    def read(
        self,
        project_id: int
    ) -> Optional[ProjectModel]: ...

    @overload
    def read(
        self,
        project_id: None = None
    ) -> List[ProjectModel]: ...

    def read(
        self,
        project_id: Optional[int] = None
    ) -> Union[List[ProjectModel], Optional[ProjectModel]]:
        """
        Fetch projects from the database.

        Args:
            project_id (Optional[int]):
                If provided, fetch single project.
                If None, fetch all projects.

        Returns:
            Union[List[ProjectModel], Optional[ProjectModel]]:
                Single project if project_id provided,
                list of projects otherwise
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)

                # Build query parameters
                params = {'id': project_id} if project_id else {}
                get_all = project_id is None

                rows = db_manager.read(
                    table="projects",
                    fields=['*'],
                    params=params,
                    order_by=['updated_at'] if get_all else None,
                    order_desc=True if get_all else False,
                    get_all=get_all
                )

        except Exception as e:
            logger.error(f"Error reading projects: {str(e)}")
            raise

        # Handle single project case
        if project_id:
            row_dict = {}
            if rows:
                row = rows[0] if isinstance(rows, list) else rows
                for key in row.keys():
                    row_dict[key] = row[key]
                return self._row_to_model(row_dict)
            return None

        # Handle multiple projects case
        projects = []
        if rows:
            for row in rows:
                # Convert Row to dict with proper types
                row_dict = {
                    str(key): row[key]
                    for key in row.keys()
                }
                projects.append(self._row_to_model(row_dict))

        return projects

    def update(
        self,
        project_id: int,
        updates: Dict[str, Any]
    ) -> Optional[ProjectModel]:
        """
        Update a project.

        Args:
            project_id (int): Project ID
            updates (Dict[str, Any]): Fields to update

        Returns:
            Optional[ProjectModel]: Updated project if found, None otherwise
        """

        # Fields that may appear in updates
        allowed_fields = [
            'name',
            'description',
            'center_lat',
            'center_lon',
            'zoom_level'
        ]

        # Build a dictionary of fields/values to update
        all_fields = {}
        for field in allowed_fields:
            if field in updates:
                all_fields[field] = updates[field]

        # Always update the updated_at timestamp
        all_fields["updated_at"] = "CURRENT_TIMESTAMP"

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                db_manager.update(
                    table="projects",
                    fields=all_fields,
                    parameters={
                        'id': project_id
                    },
                )
        except Exception as e:
            logger.error(f"Error updating project: {str(e)}")
            raise

        # Read the updated project from the DB
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                row = db_manager.read(
                    table="projects",
                    fields=['*'],
                    params={
                        'id': project_id
                    }
                )

        except Exception as e:
            logger.error(f"Error reading updated project: {str(e)}")
            raise

        if row:
            # Handle the case where row might be a list
            if isinstance(row, list):
                if len(row) > 0:
                    return self._row_to_model(dict(row[0]))
                return None

            # Handle the case where row is a single row
            return self._row_to_model(dict(row))

        return None

    def delete(
        self,
        project_id: int
    ) -> bool:
        """
        Delete a project.

        Args:
            project_id (int): Project ID

        Returns:
            bool: True if deleted, False if not found
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                cursor = db_manager.delete(
                    table="projects",
                    parameters={
                        'id': project_id
                    },
                )

        except Exception as e:
            logger.error(f"Error deleting project: {str(e)}")
            raise

        # True if a row was deleted
        return cursor.rowcount > 0
