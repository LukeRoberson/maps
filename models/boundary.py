"""
Boundary model representing a geographic boundary.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import json


class Boundary:
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
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert boundary to dictionary representation.
        
        Returns:
            Dict[str, Any]: Dictionary representation of the boundary
        """
        
        return {
            'id': self.id,
            'map_area_id': self.map_area_id,
            'coordinates': self.coordinates,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def to_geojson(self) -> Dict[str, Any]:
        """
        Convert boundary to GeoJSON format.
        
        Returns:
            Dict[str, Any]: GeoJSON representation of the boundary
        """
        
        # Convert [lat, lon] to [lon, lat] for GeoJSON
        geojson_coords = [[coord[1], coord[0]] for coord in self.coordinates]
        
        # Close the polygon if not already closed
        if geojson_coords[0] != geojson_coords[-1]:
            geojson_coords.append(geojson_coords[0])
        
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

    @classmethod
    def from_dict(
        cls,
        data: Dict[str, Any]
    ) -> 'Boundary':
        """
        Create a Boundary from dictionary data.
        
        Args:
            data (Dict[str, Any]): Dictionary containing boundary data
        
        Returns:
            Boundary: New Boundary instance
        """
        
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'])
        
        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'])
        
        return cls(
            id=data.get('id'),
            map_area_id=data['map_area_id'],
            coordinates=data['coordinates'],
            created_at=created_at,
            updated_at=updated_at
        )
