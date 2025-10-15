"""
Boundary service for business logic operations.
"""

from typing import List, Optional
import json
from datetime import datetime

from models import Boundary
from database import get_db


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
    """

    def __init__(self) -> None:
        """
        Initialize the BoundaryService.
        
        Returns:
            None
        """
        
        self.db = get_db()

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
        row = self.db.fetchone(query, (boundary_id,))
        
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
        row = self.db.fetchone(query, (map_area_id,))
        
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
