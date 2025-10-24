"""
Module: backend.map_area

Classes for managing maps.

Classes:
    MapModel:
        A data structure that represents a map
"""

from typing import (
    Optional,
    Dict,
    Any
)
from datetime import (
    datetime,
    timezone
)


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
