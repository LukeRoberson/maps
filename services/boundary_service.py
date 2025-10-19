"""
Boundary service for business logic operations.
"""

from typing import List, Optional, Tuple
import json
from datetime import datetime
from flask import current_app

from models import Boundary
from database import Database, DatabaseContext, DatabaseManager


class BoundaryService:
    """
    Service class for boundary operations.
    
    Methods:
        __init__:
            Initialize BoundaryService
        create_boundary:
            Create a new boundary
        get_boundary:
            Get a boundary by ID
        get_by_map_area:
            Get boundary for a map area
        update_boundary:
            Update a boundary
        delete_boundary:
            Delete a boundary
        is_within_boundary:
            Check if coordinates are within a boundary
    """

    def __init__(self) -> None:
        """
        Initialize the BoundaryService.
        
        Returns:
            None
        """
        
        self.db: Database = current_app.config['db']
        self.db_path: str = current_app.config['DATABASE_PATH']

    def _point_in_polygon(
        self,
        point: Tuple[float, float],
        polygon: List[List[float]]
    ) -> bool:
        """
        Check if a point is inside a polygon using ray casting algorithm.
        
        Args:
            point (Tuple[float, float]): Point coordinates [lat, lon]
            polygon (List[List[float]]): Polygon coordinates
        
        Returns:
            bool: True if point is inside polygon
        """
        
        x, y = point
        n = len(polygon)
        inside = False
        
        j = n - 1
        for i in range(n):
            xi, yi = polygon[i]
            xj, yj = polygon[j]
            
            intersect = ((yi > y) != (yj > y)) and \
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
            if intersect:
                inside = not inside
            
            j = i
        
        return inside

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
        
        for coord in coordinates:
            point = (coord[0], coord[1])
            if not self._point_in_polygon(point, parent_boundary):
                return False
        
        return True

    def create_boundary(
        self,
        boundary: Boundary
    ) -> Boundary:
        """
        Create a new boundary.
        
        Args:
            boundary (Boundary): Boundary to create
        
        Returns:
            Boundary: Created boundary with assigned ID
        """
        
        query = """
            INSERT INTO boundaries (map_area_id, coordinates)
            VALUES (?, ?)
        """
        
        coords_json = json.dumps(boundary.coordinates)
        cursor = self.db.execute(
            query,
            (boundary.map_area_id, coords_json)
        )
        
        boundary.id = cursor.lastrowid
        return boundary

    def get_boundary(
        self,
        boundary_id: int
    ) -> Optional[Boundary]:
        """
        Get a boundary by ID.
        
        Args:
            boundary_id (int): Boundary ID
        
        Returns:
            Optional[Boundary]: Boundary if found, None otherwise
        """
        
        query = "SELECT * FROM boundaries WHERE id = ?"
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            row = db_manager.read(
                query,
                (boundary_id,)
            )
        
        if row:
            return Boundary(
                id=row['id'],
                map_area_id=row['map_area_id'],
                coordinates=json.loads(row['coordinates']),
                created_at=datetime.fromisoformat(row['created_at']),
                updated_at=datetime.fromisoformat(row['updated_at'])
            )
        
        return None

    def get_by_map_area(
        self,
        map_area_id: int
    ) -> Optional[Boundary]:
        """
        Get boundary for a map area.
        
        Args:
            map_area_id (int): Map area ID
        
        Returns:
            Optional[Boundary]: Boundary if found, None otherwise
        """
        
        query = "SELECT * FROM boundaries WHERE map_area_id = ?"
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            row = db_manager.read(
                query,
                (map_area_id,)
            )
        
        if row:
            return Boundary(
                id=row['id'],
                map_area_id=row['map_area_id'],
                coordinates=json.loads(row['coordinates']),
                created_at=datetime.fromisoformat(row['created_at']),
                updated_at=datetime.fromisoformat(row['updated_at'])
            )
        
        return None

    def update_boundary(
        self,
        boundary_id: int,
        coordinates: List[List[float]]
    ) -> Optional[Boundary]:
        """
        Update a boundary's coordinates.
        
        Args:
            boundary_id (int): Boundary ID
            coordinates (List[List[float]]): New coordinates
        
        Returns:
            Optional[Boundary]: Updated boundary if found, None otherwise
        """
        
        query = """
            UPDATE boundaries
            SET coordinates = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """
        
        coords_json = json.dumps(coordinates)
        self.db.execute(query, (coords_json, boundary_id))
        
        return self.get_boundary(boundary_id)

    def delete_boundary(
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
        
        query = "DELETE FROM boundaries WHERE id = ?"
        cursor = self.db.execute(query, (boundary_id,))
        
        return cursor.rowcount > 0
