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
        map_area_id (int): Associated map area ID
        parent_layer_id (Optional[int]): Parent layer ID (for inherited layers)
        name (str): Layer name
        layer_type (str): Type of layer (annotation, custom)
        visible (bool): Whether layer is visible by default
        z_index (int): Layer stacking order
        is_editable (bool): Whether this layer can be edited
            (False for inherited layers)
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

    LAYER_TYPES = ['annotation', 'custom']

    def __init__(
        self,
        map_area_id: int,
        name: str,
        layer_type: str,
        visible: bool = True,
        z_index: int = 0,
        is_editable: bool = True,
        parent_layer_id: Optional[int] = None,
        config: Optional[Dict[str, Any]] = None,
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ) -> None:
        """
        Initialize a new Layer.
        
        Args:
            map_area_id (int): Associated map area ID
            name (str): Layer name
            layer_type (str): Type of layer
            visible (bool): Whether layer is visible
            z_index (int): Layer stacking order
            is_editable (bool): Whether layer can be edited
            parent_layer_id (Optional[int]): Parent layer ID for inheritance
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
        self.map_area_id = map_area_id
        self.parent_layer_id = parent_layer_id
        self.name = name
        self.layer_type = layer_type
        self.visible = visible
        self.z_index = z_index
        self.is_editable = is_editable
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
            'map_area_id': self.map_area_id,
            'parent_layer_id': self.parent_layer_id,
            'name': self.name,
            'layer_type': self.layer_type,
            'visible': self.visible,
            'z_index': self.z_index,
            'is_editable': self.is_editable,
            'config': self.config,
            'created_at': (
                self.created_at.isoformat() if self.created_at else None
            ),
            'updated_at': (
                self.updated_at.isoformat() if self.updated_at else None
            )
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
            map_area_id=data['map_area_id'],
            parent_layer_id=data.get('parent_layer_id'),
            name=data['name'],
            layer_type=data['layer_type'],
            visible=data.get('visible', True),
            z_index=data.get('z_index', 0),
            is_editable=data.get('is_editable', True),
            config=data.get('config', {}),
            created_at=created_at,
            updated_at=updated_at
        )
