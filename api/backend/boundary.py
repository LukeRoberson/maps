"""
Module: backend.boundary

Classes for managing boundaries.

Uses GeoJSON format for geographic data.
    GeoJSON is a format for encoding a variety of geographic data structures.
    https://geojson.org/

Classes:
    BoundaryModel:
        A data structure that represents a geographic boundary for a map area.
    BoundaryService:
        A service class that provides operations for managing boundaries.

Third-party libraries:
    Flask:
        current_app - to access application configuration

Local modules:
    database:
        DatabaseContext - context manager for database connections
        DatabaseManager - class for database operations
"""


# Standard library imports
from typing import (
    Optional,
    Dict,
    Any,
    List,
    Tuple
)
from datetime import (
    datetime,
    timezone
)
import json
import logging

# Third-party imports
from flask import current_app

# Local imports
from database import (
    DatabaseContext,
    DatabaseManager
)


logger = logging.getLogger(__name__)


class BoundaryModel:
    """
    Represents a geographic boundary for a map.

    Attributes:
        id (Optional[int]): Unique identifier
        map_id (int): Associated map area ID
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
        map_id: int,
        coordinates: List[List[float]],
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ) -> None:
        """
        Initialize a new Boundary.

        Args:
            map_id (int): Associated map area ID
            coordinates (List[List[float]]): Boundary coordinates
            id (Optional[int]): Boundary ID
            created_at (Optional[datetime]): Creation timestamp
            updated_at (Optional[datetime]): Update timestamp

        Returns:
            None
        """

        # Validate coordinates exist, and have at least 3 points
        if not coordinates or len(coordinates) < 3:
            raise ValueError(
                "Boundary must have at least 3 coordinate pairs"
            )

        # Validate each coordinate is a [lat, lon] pair
        for coord in coordinates:
            if len(coord) != 2:
                raise ValueError(
                    "Each coordinate must be [lat, lon]"
                )

        self.id = id
        self.map_id = map_id
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
            'map_area_id': self.map_id,
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
            map_id=data['map_area_id'],
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
                'map_area_id': self.map_id
            }
        }


class BoundaryService:
    """
    Service class for boundary operations.

    Methods:
        __init__:
            Initialize BoundaryService
        _serialize_config:
            Serialize config dictionary to JSON string
        _deserialize_config:
            Deserialize config JSON string to dictionary
        _row_to_model:
            Convert database row to BoundaryModel
        _point_in_polygon:
            Check if a point is inside a polygon
        _get_boundary:
            Get a boundary by ID
        is_within_boundary:
            Check if coordinates are within a parent boundary
        create:
            Create a new boundary
        read:
            Get boundary for a map area
        update:
            Update a boundary
        delete:
            Delete a boundary
    """

    def __init__(self) -> None:
        """
        Initialize the BoundaryService.

        Returns:
            None
        """

        # Get the config from the Flask application context
        self.db_path: str = current_app.config['DATABASE_PATH']

    @staticmethod
    def _serialize_config(
        config: Dict[str, Any]
    ) -> str:
        """
        Serialize the config dictionary to a JSON string.

        Args:
            config (Dict[str, Any]): Configuration dictionary

        Returns:
            str: JSON string representation of the config
        """

        return json.dumps(config)

    @staticmethod
    def _deserialize_config(
        config_str: str
    ) -> Dict[str, Any]:
        """
        Deserialize the config JSON string to a dictionary.

        Args:
            config_str (str): JSON string representation of the config

        Returns:
            Dict[str, Any]: Configuration dictionary
        """

        return json.loads(config_str)

    def _row_to_model(
        self,
        row: Dict[str, Any]
    ) -> BoundaryModel:
        """
        Convert a database row to a BoundaryModel.

        Args:
            row (Dict[str, Any]): Database row

        Returns:
            BoundaryModel: Boundary model instance
        """

        return BoundaryModel(
            id=row['id'],
            map_id=row['map_area_id'],
            coordinates=json.loads(row['coordinates']),
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        )

    def _point_in_polygon(
        self,
        point: Tuple[float, float],
        polygon: List[List[float]]
    ) -> bool:
        """
        Check if a point is inside a polygon using ray casting algorithm.

        This uses a 'ray', an imaginary horizontal line extending to the right
        from the point in question. The algorithm counts how many times the ray
        intersects with the edges of the polygon. If the count is odd,
        the point is inside the polygon; if even, the point is outside.

        Algorithm:
        1. Loop through each edge of the polygon
        2. For each edge, check if a horizontal ray from the point
            intersects the edge
        3. If the ray crosses the edge, toggle the inside boolean
        4. After checking all edges, if inside is True, the point is
            inside the polygon

        Args:
            point (Tuple[float, float]): Point coordinates [lat, lon]
            polygon (List[List[float]]): Polygon coordinates

        Returns:
            bool: True if point is inside polygon
        """

        # X and Y coordinates of the point to test
        x, y = point

        # The number of vertices in the polygon
        n = len(polygon)

        # Initialize 'inside' flag as False
        inside = False

        # The 'j' variable is the index of the previous vertex
        j = n - 1

        # Loop through each vertex of the polygon
        for i in range(n):
            # Get the coordinates of the current and previous vertex
            # This defines an edge (the line segment between two vertices)
            xi, yi = polygon[i]
            xj, yj = polygon[j]

            # Test if the ray, a horizontal line at 'y', crosses the edge
            intersect = (
                # Test if the y-coordinate is between
                # the current and previous vertex y-coordinates.
                # The 'and' means we proceed to the next test only if true.
                ((yi > y) != (yj > y)) and

                # Calulate the x-coordinate of the intersection point
                # of the edge with the horizontal line at y.
                # This is compared to the x-coordinate of the point.
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
            )

            # If the ray crossed the edge, 'intersect' will be non-zero
            if intersect:
                # Flip the 'inside' flag
                inside = not inside

            # Move to the next edge
            j = i

        # After checking all edges, 'inside' will be True if
        # the point is inside the polygon, False otherwise.
        return inside

    def _get_boundary(
        self,
        boundary_id: int
    ) -> Optional[BoundaryModel]:
        """
        Get a boundary by ID.

        Args:
            boundary_id (int): Boundary ID

        Returns:
            Optional[Boundary]: Boundary if found, None otherwise
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                row = db_manager.read(
                    table="boundaries",
                    fields=['*'],
                    params={
                        'id': boundary_id
                    }
                )

        except Exception as e:
            current_app.logger.error(
                f"Error retrieving boundary {boundary_id}: {e}"
            )
            raise

        if row:
            row_dict = {}
            this_row = row[0] if isinstance(row, list) else row
            for key in this_row.keys():
                row_dict[key] = this_row[key]
            return self._row_to_model(row_dict)

        return None

    def is_within_boundary(
        self,
        coordinates: List[List[float]],
        parent_boundary: List[List[float]]
    ) -> bool:
        """
        Check if all coordinates are within a parent boundary.

        Args:
            coordinates (List[List[float]]): Coordinates to check
            parent_boundary (List[List[float]]): Parent boundary coordinates

        Returns:
            bool: True if all coordinates are within parent boundary
        """

        # Loop through coordinates, using the ray casting algorithm
        for coord in coordinates:
            point = (coord[0], coord[1])
            if not self._point_in_polygon(point, parent_boundary):
                return False

        return True

    def create(
        self,
        boundary: BoundaryModel
    ) -> BoundaryModel:
        """
        Create a new boundary.

        Args:
            boundary (Boundary): Boundary to create

        Returns:
            Boundary: Created boundary with assigned ID
        """

        # Convert coordinates to JSON
        coords_json = json.dumps(boundary.coordinates)

        # Create the boundary in the database
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                boundary.id = db_manager.create(
                    table="boundaries",
                    params={
                        "map_area_id": boundary.map_id,
                        "coordinates": coords_json
                    }
                )

        except Exception as e:
            logger.error(
                f"Error creating boundary: {e}"
            )
            raise

        return boundary

    def read(
        self,
        map_id: int
    ) -> Optional[BoundaryModel]:
        """
        Get boundary for a map area.

        Args:
            map_area_id (int): Map area ID

        Returns:
            Optional[Boundary]: Boundary if found, None otherwise
        """

        # Query the database for the boundary
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                row = db_manager.read(
                    table="boundaries",
                    fields=['*'],
                    params={
                        'map_area_id': map_id
                    }
                )

        except Exception as e:
            logger.error(
                f"Error retrieving boundary for map area {map_id}: {e}"
            )
            raise

        # Convert to a BoundaryModel
        if row:
            row_dict = {}
            this_row = row[0] if isinstance(row, list) else row
            for key in this_row.keys():
                row_dict[key] = this_row[key]
            return self._row_to_model(row_dict)

        raise

    def update(
        self,
        boundary_id: int,
        coordinates: List[List[float]]
    ) -> Optional[BoundaryModel]:
        """
        Update a boundary's coordinates.

        Args:
            boundary_id (int): Boundary ID
            coordinates (List[List[float]]): New coordinates

        Returns:
            Optional[Boundary]: Updated boundary if found, None otherwise
        """

        # Update the boundary in the database
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                db_manager.update(
                    table="boundaries",
                    fields={
                        "coordinates": json.dumps(coordinates),
                        "updated_at": "CURRENT_TIMESTAMP"
                    },
                    parameters={
                        'id': boundary_id
                    },
                )

        except Exception as e:
            logger.error(
                f"Error updating boundary {boundary_id}: {e}"
            )
            raise

        # Get the updated boundary and return it
        return self._get_boundary(
            boundary_id=boundary_id
        )

    def delete(
        self,
        boundary_id: int
    ) -> bool:
        """
        Delete a boundary.

        Args:
            boundary_id (int): Boundary ID

        Returns:
            bool: True if deleted, False if not found
        """

        # Delete the boundary from the database
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                cursor = db_manager.delete(
                    table="boundaries",
                    parameters={
                        'id': boundary_id
                    },
                )

        except Exception as e:
            logger.error(
                f"Error deleting boundary {boundary_id}: {e}"
            )
            raise

        # True if a row was deleted
        return cursor.rowcount > 0
