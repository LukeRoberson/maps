"""
Module: backend.map_area

Classes for managing maps.

Classes:
    MapModel:
        A data structure that represents a map
    MapService:
        Service class for map area operations

Third party dependencies:
    Flask: Web framework used for application context.

Local dependencies:
    DatabaseContext:
        Context manager for database connections.
    DatabaseManager:
        Manager for executing database operations.
"""


# Standard library imports
from typing import (
    Optional,
    Dict,
    Any,
    List,
    Union,
    overload
)
from datetime import (
    datetime,
    timezone
)
import logging

# Third-party imports
from flask import current_app

# Local imports
from database import (
    DatabaseContext,
    DatabaseManager
)


logger = logging.getLogger(__name__)


class MapModel:
    """
    Represents a map area within a project hierarchy.
    This reflects the 'map_areas' table in the database.

    Attributes:
        id (Optional[int]): Unique identifier
        project_id (int): Parent project ID
        parent_id (Optional[int]): Parent map area ID (None for master map)
        name (str): Area name
        area_type (str): Type of area (master, suburb, individual)
        boundary_id (Optional[int]): Associated boundary ID
        default_center_lat (Optional[float]): Default map center latitude
        default_center_lon (Optional[float]): Default map center longitude
        default_zoom (Optional[int]): Default map zoom level
        created_at (datetime): Creation timestamp
        updated_at (datetime): Last update timestamp

    Methods:
        __init__:
            Initialize MapArea
        to_dict:
            Convert map area to dictionary representation
        from_dict:
            Create map area from dictionary
    """

    # Types of map areas
    AREA_TYPES = [
        'master',
        'suburb',
        'individual'
    ]

    def __init__(
        self,
        project_id: int,
        name: str,
        area_type: str,
        parent_id: Optional[int] = None,
        boundary_id: Optional[int] = None,
        default_center_lat: Optional[float] = None,
        default_center_lon: Optional[float] = None,
        default_zoom: Optional[int] = None,
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ) -> None:
        """
        Initialize a new map.

        Args:
            project_id (int): Parent project ID
            name (str): Area name
            area_type (str): Type of area
            parent_id (Optional[int]): Parent area ID
            boundary_id (Optional[int]): Boundary ID
            default_center_lat (Optional[float]): Default center latitude
            default_center_lon (Optional[float]): Default center longitude
            default_zoom (Optional[int]): Default zoom level
            id (Optional[int]): Map area ID
            created_at (Optional[datetime]): Creation timestamp
            updated_at (Optional[datetime]): Update timestamp

        Returns:
            None

        Raises:
            ValueError: If area_type is not valid
        """

        # Validate area_type
        if area_type not in self.AREA_TYPES:
            raise ValueError(
                f"Invalid area_type: {area_type}. "
                f"Must be one of {self.AREA_TYPES}"
            )

        self.id = id
        self.project_id = project_id
        self.parent_id = parent_id
        self.name = name
        self.area_type = area_type
        self.boundary_id = boundary_id
        self.default_center_lat = default_center_lat
        self.default_center_lon = default_center_lon
        self.default_zoom = default_zoom

        # Timestamps are in UTC
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def to_dict(
        self
    ) -> Dict[str, Any]:
        """
        Convert map to dictionary representation.

        Args:
            None

        Returns:
            Dict[str, Any]: Dictionary representation of the map area
        """

        return {
            'id': self.id,
            'project_id': self.project_id,
            'parent_id': self.parent_id,
            'name': self.name,
            'area_type': self.area_type,
            'boundary_id': self.boundary_id,
            'default_center_lat': self.default_center_lat,
            'default_center_lon': self.default_center_lon,
            'default_zoom': self.default_zoom,
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
    ) -> 'MapModel':
        """
        Create a Map from dictionary data.
            This is an alternative constructor, rather than __init__().
            Rather than passing details in one at a time,
            we can pass a dictionary.

        Args:
            data (Dict[str, Any]): Dictionary containing map area data

        Returns:
            MapArea: New MapArea instance
        """

        # Get the datetime fields if they exist
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'])

        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'])

        # Create and return the MapArea instance
        return cls(
            id=data.get('id'),
            project_id=data['project_id'],
            parent_id=data.get('parent_id'),
            name=data['name'],
            area_type=data['area_type'],
            boundary_id=data.get('boundary_id'),
            default_center_lat=data.get('default_center_lat'),
            default_center_lon=data.get('default_center_lon'),
            default_zoom=data.get('default_zoom'),
            created_at=created_at,
            updated_at=updated_at
        )


class MapService:
    """
    Service class for map area operations.

    Methods:
        __init__:
            Initialize MapService
        _row_to_model:
            Convert database row to MapModel
        create:
            Create a new map area
        read:
            Get one or more maps
        read_hierarchy:
            Get hierarchical structure of map areas
        update:
            Update a map area
        delete:
            Delete a map area
    """

    def __init__(self) -> None:
        """
        Initialize the MapService.

        Returns:
            None
        """

        # Get the config from the Flask application context
        self.db_path: str = current_app.config['DATABASE_PATH']

    def _row_to_model(
        self,
        row: Dict[str, Any]
    ) -> MapModel:
        """
        Convert a database row to a MapModel.

        Args:
            row (Dict[str, Any]): Database row

        Returns:
            MapModel: Map model instance
        """

        return MapModel(
            id=row['id'],
            project_id=row['project_id'],
            parent_id=row['parent_id'],
            name=row['name'],
            area_type=row['area_type'],
            boundary_id=row['boundary_id'],
            default_center_lat=row['default_center_lat'],
            default_center_lon=row['default_center_lon'],
            default_zoom=row['default_zoom'],
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        )

    def create(
        self,
        map_area: MapModel
    ) -> MapModel:
        """
        Create a new map.

        Args:
            map_area (MapArea): Map area to create

        Returns:
            MapArea: Created map area with assigned ID
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                map_area.id = db_manager.create(
                    table="map_areas",
                    params={
                        "project_id": map_area.project_id,
                        "parent_id": map_area.parent_id,
                        "name": map_area.name,
                        "area_type": map_area.area_type,
                        "boundary_id": map_area.boundary_id,
                        "default_center_lat": map_area.default_center_lat,
                        "default_center_lon": map_area.default_center_lon,
                        "default_zoom": map_area.default_zoom
                    }
                )

        except Exception as e:
            logger.error(f"Error creating map area: {e}")
            raise

        return map_area

    @overload
    def read(
        self,
        *,
        map_id: int,
    ) -> Optional[MapModel]: ...

    @overload
    def read(
        self,
        *,
        project_id: int,
        parent_id: Optional[int] = None
    ) -> List[MapModel]: ...

    def read(
        self,
        map_id: Optional[int] = None,
        project_id: Optional[int] = None,
        parent_id: Optional[int] = None
    ) -> Union[List[MapModel], Optional[MapModel]]:
        """
        Fetch maps from the database
        Include a map_id to get a single map

        Args:
            map_id (int): Map area ID, when getting a single map
            project_id (int): Project ID, when listing maps
            parent_id (Optional[int]): Parent area ID filter

        Returns:
            Optional[MapArea]: Map area if found, None otherwise
        """

        # Read a single map area by ID
        if map_id:
            try:
                with DatabaseContext(self.db_path) as db_ctx:
                    db_manager = DatabaseManager(db_ctx)
                    row = db_manager.read(
                        table="map_areas",
                        fields=['*'],
                        params={
                            'id': map_id
                        }
                    )

                if row:
                    row = row[0] if isinstance(row, list) else row
                    return self._row_to_model(dict(row))

                return None

            except Exception as e:
                logger.error(f"Error reading map area: {e}")
                raise

        # List all map areas for a project
        elif parent_id is None:
            try:
                with DatabaseContext(self.db_path) as db_ctx:
                    db_manager = DatabaseManager(db_ctx)
                    rows = db_manager.read(
                        table="map_areas",
                        fields=['*'],
                        params={
                            'project_id': project_id
                        },
                        order_by=['created_at'],
                        get_all=True
                    )

            except Exception as e:
                logger.error(f"Error reading map areas: {e}")
                raise

        # All maps, filtered by parent_id
        else:
            try:
                with DatabaseContext(self.db_path) as db_ctx:
                    db_manager = DatabaseManager(db_ctx)
                    rows = db_manager.read(
                        table="map_areas",
                        fields=['*'],
                        params={
                            'project_id': project_id,
                            'parent_id': parent_id
                        },
                        order_by=['created_at'],
                        get_all=True
                    )

            except Exception as e:
                logger.error(f"Error reading map areas: {e}")
                raise

        map_areas = []
        if rows:
            for row in rows:
                map_areas.append(
                    self._row_to_model(dict(row))
                )
        else:
            return []

        return map_areas

    def read_hierarchy(
        self,
        project_id: int
    ) -> Dict[str, Any]:
        """
        Get hierarchical structure of maps.

        Args:
            project_id (int): Project ID

        Returns:
            Dict[str, Any]: Hierarchical structure
        """

        # Get all map areas for the project
        all_areas = self.read(
            project_id=project_id
        )

        # Build the hierarchy structure
        hierarchy = {
            'master': None,
            'suburbs': [],
            'individuals': []
        }

        # Populate the hierarchy
        for area in all_areas:
            if area.area_type == 'master':
                hierarchy['master'] = area.to_dict()
            elif area.area_type == 'suburb':
                hierarchy['suburbs'].append(area.to_dict())
            elif area.area_type == 'individual':
                hierarchy['individuals'].append(area.to_dict())

        return hierarchy

    def update(
        self,
        map_area_id: int,
        updates: Dict[str, Any]
    ) -> Optional[MapModel]:
        """
        Update a map.

        Args:
            map_area_id (int): Map area ID
            updates (Dict[str, Any]): Fields to update

        Returns:
            Optional[MapArea]: Updated map area if found, None otherwise
        """

        # Fields that can be updated
        allowed_fields = [
            'name',
            'parent_id',
            'boundary_id',
            'default_center_lat',
            'default_center_lon',
            'default_zoom'
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
                    table="map_areas",
                    fields=all_fields,
                    parameters={
                        'id': map_area_id
                    },
                )

        except Exception as e:
            logger.error(f"Error updating map area: {e}")
            raise

        return self.read(
            map_id=map_area_id
        )

    def delete(
        self,
        map_area_id: int
    ) -> bool:
        """
        Delete a map area.

        Args:
            map_area_id (int): Map area ID

        Returns:
            bool: True if deleted, False if not found
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                cursor = db_manager.delete(
                    table="map_areas",
                    parameters={
                        'id': map_area_id
                    },
                )

        except Exception as e:
            logger.error(f"Error deleting map area: {e}")
            raise

        # True if a row was deleted
        return cursor.rowcount > 0
