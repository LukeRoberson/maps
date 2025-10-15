"""
Layer service for business logic operations.
"""

from typing import List, Optional, Dict, Any
import json
from datetime import datetime

from models import Layer
from database import get_db


class LayerService:
    """
    Service class for layer operations.
    
    Methods:
        __init__:
            Initialize LayerService
        create_layer:
            Create a new layer
        get_layer:
            Get a layer by ID
        list_layers:
            List layers for a project
        update_layer:
            Update a layer
        delete_layer:
            Delete a layer
    """

    def __init__(self) -> None:
        """
        Initialize the LayerService.
        
        Returns:
            None
        """
        
        self.db = get_db()

    def create_layer(
        self,
        layer: Layer
    ) -> Layer:
        """
        Create a new layer.
        
        Args:
            layer (Layer): Layer to create
        
        Returns:
            Layer: Created layer with assigned ID
        """
        
        query = """
            INSERT INTO layers (
                project_id, name, layer_type,
                visible, z_index, config
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """
        
        config_json = json.dumps(layer.config)
        cursor = self.db.execute(
            query,
            (
                layer.project_id,
                layer.name,
                layer.layer_type,
                layer.visible,
                layer.z_index,
                config_json
            )
        )
        
        layer.id = cursor.lastrowid
        return layer

    def get_layer(
        self,
        layer_id: int
    ) -> Optional[Layer]:
        """
        Get a layer by ID.
        
        Args:
            layer_id (int): Layer ID
        
        Returns:
            Optional[Layer]: Layer if found, None otherwise
        """
        
        query = "SELECT * FROM layers WHERE id = ?"
        row = self.db.fetchone(query, (layer_id,))
        
        if row:
            return Layer(
                id=row['id'],
                project_id=row['project_id'],
                name=row['name'],
                layer_type=row['layer_type'],
                visible=bool(row['visible']),
                z_index=row['z_index'],
                config=json.loads(row['config']) if row['config'] else {},
                created_at=datetime.fromisoformat(row['created_at']),
                updated_at=datetime.fromisoformat(row['updated_at'])
            )
        
        return None

    def list_layers(
        self,
        project_id: int
    ) -> List[Layer]:
        """
        List layers for a project.
        
        Args:
            project_id (int): Project ID
        
        Returns:
            List[Layer]: List of layers
        """
        
        query = """
            SELECT * FROM layers
            WHERE project_id = ?
            ORDER BY z_index, created_at
        """
        rows = self.db.fetchall(query, (project_id,))
        
        layers = []
        for row in rows:
            layers.append(
                Layer(
                    id=row['id'],
                    project_id=row['project_id'],
                    name=row['name'],
                    layer_type=row['layer_type'],
                    visible=bool(row['visible']),
                    z_index=row['z_index'],
                    config=json.loads(
                        row['config']
                    ) if row['config'] else {},
                    created_at=datetime.fromisoformat(row['created_at']),
                    updated_at=datetime.fromisoformat(row['updated_at'])
                )
            )
        
        return layers

    def update_layer(
        self,
        layer_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Layer]:
        """
        Update a layer.
        
        Args:
            layer_id (int): Layer ID
            updates (Dict[str, Any]): Fields to update
        
        Returns:
            Optional[Layer]: Updated layer if found, None otherwise
        """
        
        allowed_fields = ['name', 'visible', 'z_index', 'config']
        
        set_clauses = []
        values = []
        
        for field in allowed_fields:
            if field in updates:
                if field == 'config':
                    set_clauses.append(f"{field} = ?")
                    values.append(json.dumps(updates[field]))
                else:
                    set_clauses.append(f"{field} = ?")
                    values.append(updates[field])
        
        if not set_clauses:
            return self.get_layer(layer_id)
        
        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        values.append(layer_id)
        
        query = f"""
            UPDATE layers
            SET {', '.join(set_clauses)}
            WHERE id = ?
        """
        
        self.db.execute(query, tuple(values))
        return self.get_layer(layer_id)

    def delete_layer(
        self,
        layer_id: int
    ) -> bool:
        """
        Delete a layer.
        
        Args:
            layer_id (int): Layer ID
        
        Returns:
            bool: True if deleted, False if not found
        """
        
        query = "DELETE FROM layers WHERE id = ?"
        cursor = self.db.execute(query, (layer_id,))
        
        return cursor.rowcount > 0
