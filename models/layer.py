"""
Layer model representing a map layer.
"""

from typing import Optional, Dict, Any
from datetime import datetime


class Layer:
    """
    Represents a map layer that can be shown or hidden.
    
    Attributes:
        id (Optional[int]): Unique identifier
        project_id (int): Associated project ID
        name (str): Layer name
        layer_type (str): Type of layer (osm, annotation, custom)
        visible (bool): Whether layer is visible by default
        z_index (int): Layer stacking order
        config (Dict[str, Any]): Layer-specific configuration
        created_at (datetime): Creation timestamp
        updated_at (datetime): Last update timestamp
    
    Methods:
        __init__:
            Initialize Layer
        to_dict:
            Convert layer to dictionary representation
        from_dict:
            Create layer from dictionary
    """

    LAYER_TYPES = ['osm', 'annotation', 'custom']

    def __init__(
        self,
        project_id: int,
        name: str,
        layer_type: str,
        visible: bool = True,
        z_index: int = 0,
        config: Optional[Dict[str, Any]] = None,
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ) -> None:
        """
        Initialize a new Layer.
        
        Args:
            project_id (int): Associated project ID
            name (str): Layer name
            layer_type (str): Type of layer
            visible (bool): Whether layer is visible
            z_index (int): Layer stacking order
            config (Optional[Dict[str, Any]]): Layer configuration
            id (Optional[int]): Layer ID
            created_at (Optional[datetime]): Creation timestamp
            updated_at (Optional[datetime]): Update timestamp
        
        Returns:
            None
        
        Raises:
            ValueError: If layer_type is not valid
        """
        
        if layer_type not in self.LAYER_TYPES:
            raise ValueError(
                f"Invalid layer_type: {layer_type}. "
                f"Must be one of {self.LAYER_TYPES}"
            )
        
        self.id = id
        self.project_id = project_id
        self.name = name
        self.layer_type = layer_type
        self.visible = visible
        self.z_index = z_index
        self.config = config or {}
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert layer to dictionary representation.
        
        Returns:
            Dict[str, Any]: Dictionary representation of the layer
        """
        
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'layer_type': self.layer_type,
            'visible': self.visible,
            'z_index': self.z_index,
            'config': self.config,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @classmethod
    def from_dict(
        cls,
        data: Dict[str, Any]
    ) -> 'Layer':
        """
        Create a Layer from dictionary data.
        
        Args:
            data (Dict[str, Any]): Dictionary containing layer data
        
        Returns:
            Layer: New Layer instance
        """
        
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'])
        
        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'])
        
        return cls(
            id=data.get('id'),
            project_id=data['project_id'],
            name=data['name'],
            layer_type=data['layer_type'],
            visible=data.get('visible', True),
            z_index=data.get('z_index', 0),
            config=data.get('config', {}),
            created_at=created_at,
            updated_at=updated_at
        )
