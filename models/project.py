"""
Project model representing a map project.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import json


class Project:
    """
    Represents a map project with hierarchical structure.
    
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
        Initialize a new Project.
        
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
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert project to dictionary representation.
        
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
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @classmethod
    def from_dict(
        cls,
        data: Dict[str, Any]
    ) -> 'Project':
        """
        Create a Project from dictionary data.
        
        Args:
            data (Dict[str, Any]): Dictionary containing project data
        
        Returns:
            Project: New Project instance
        """
        
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'])
        
        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'])
        
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
