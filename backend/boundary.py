"""
Module: backend.boundary

Classes for managing boundaries.

Uses GeoJSON format for geographic data.
    GeoJSON is a format for encoding a variety of geographic data structures.
    https://geojson.org/

Classes:
    BoundaryModel:
        A data structure that represents a geographic boundary for a map area.
"""

from typing import (
    Optional,
    Dict,
    Any,
    List
)
from datetime import (
    datetime,
    timezone
)


class BoundaryModel:
    """
    Represents a geographic boundary for a map area.

    Attributes:
        id (Optional[int]): Unique identifier
        map_area_id (int): Associated map area ID
        coordinates (List[List[float]]): List of [lat, lon] coordinate pairs
        created_at (datetime): Creation timestamp
        updated_at (datetime): Last update timestamp

    Methods:
        __init__:
            Initialize Boundary
        to_dict:
            Convert boundary to dictionary representation
        from_dict:
            Create boundary from dictionary
        to_geojson:
            Convert boundary to GeoJSON format
    """

    def __init__(
        self,
        map_area_id: int,
        coordinates: List[List[float]],
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ) -> None:
        """
        Initialize a new Boundary.

        Args:
            map_area_id (int): Associated map area ID
            coordinates (List[List[float]]): Boundary coordinates
            id (Optional[int]): Boundary ID
            created_at (Optional[datetime]): Creation timestamp
            updated_at (Optional[datetime]): Update timestamp

        Returns:
            None
        """

        self.id = id
        self.map_area_id = map_area_id
        self.coordinates = coordinates
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def to_dict(
        self
    ) -> Dict[str, Any]:
        """
        Convert boundary to dictionary representation.

        args:
            None

        Returns:
            Dict[str, Any]: Dictionary representation of the boundary
        """

        return {
            'id': self.id,
            'map_area_id': self.map_area_id,
            'coordinates': self.coordinates,
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
    ) -> 'BoundaryModel':
        """
        Create a Boundary from dictionary data.
            This is an alternative constructor, rather than __init__().
            Rather than passing details in one at a time,
            we can pass a dictionary.

        Args:
            data (Dict[str, Any]): Dictionary containing boundary data

        Returns:
            Boundary: New Boundary instance
        """

        # Get the datetime fields if they exist
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'])

        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'])

        # Create and return the Boundary instance
        return cls(
            id=data.get('id'),
            map_area_id=data['map_area_id'],
            coordinates=data['coordinates'],
            created_at=created_at,
            updated_at=updated_at
        )

    def to_geojson(
        self
    ) -> Dict[str, Any]:
        """
        Convert a polygon (the boundary) to GeoJSON format.
            1. Convert coordinates for each vertex in the boundary
            2. Ensure the polygon is closed
                by repeating the first coordinate at the end if necessary
            3. Structure the data according to GeoJSON specifications

        Args:
            None

        Returns:
            Dict[str, Any]: GeoJSON representation of the boundary
        """

        # Convert [lat, lon] to [lon, lat]
        geojson_coords = [
            [coord[1], coord[0]]
            for coord
            in self.coordinates
        ]

        # Close the polygon if not already closed
        if geojson_coords[0] != geojson_coords[-1]:
            geojson_coords.append(geojson_coords[0])

        # The GeoJSON format for a Polygon (boundary)
        return {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [geojson_coords]
            },
            'properties': {
                'id': self.id,
                'map_area_id': self.map_area_id
            }
        }
