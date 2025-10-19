"""
Layer service for business logic operations.
"""

from typing import List, Optional, Dict, Any
import json
from flask import current_app

from models import Layer
from database import Database, DatabaseContext, DatabaseManager


class LayerService:
    """
    Service class for layer operations with hierarchical support.
    
    Methods:
        __init__:
            Initialize LayerService
        create_layer:
            Create a new layer
        get_layer:
            Get a layer by ID
        list_layers_for_map_area:
            List all layers for a map area (own + inherited)
        list_own_layers:
            List only layers created on this map area
        get_inherited_layers:
            Get layers inherited from parent map areas
        update_layer:
            Update a layer
        delete_layer:
            Delete a layer
        reorder_layers:
            Reorder layers by updating z_index
    """

    def __init__(self) -> None:
        """
        Initialize the LayerService.
        
        Returns:
            None
        """
        
        self.db: Database = current_app.config['db']
        self.db_path: str = current_app.config['DATABASE_PATH']

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
                map_area_id, parent_layer_id, name, layer_type,
                visible, z_index, is_editable, config
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        config_json = json.dumps(layer.config)

        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            layer.id = db_manager.create(
                query,
                (
                    layer.map_area_id,
                    layer.parent_layer_id,
                    layer.name,
                    layer.layer_type,
                    layer.visible,
                    layer.z_index,
                    layer.is_editable,
                    config_json
                )
            )
        
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
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            row = db_manager.read(
                query,
                (layer_id,)
            )
        
        if row:
            return self._row_to_layer(row)
        
        return None

        return None

    def list_layers_for_map_area(
        self,
        map_area_id: int
    ) -> List[Layer]:
        """
        List all layers for a map area (own + inherited).
        
        Args:
            map_area_id (int): Map area ID
        
        Returns:
            List[Layer]: List of layers ordered by z_index
        """
        
        own_layers = self.list_own_layers(map_area_id)
        inherited_layers = self.get_inherited_layers(map_area_id)
        
        # Combine and sort by z_index
        all_layers = own_layers + inherited_layers
        all_layers.sort(key=lambda layer: layer.z_index)
        
        return all_layers

    def list_own_layers(
        self,
        map_area_id: int
    ) -> List[Layer]:
        """
        List only layers created on this map area.
        
        Args:
            map_area_id (int): Map area ID
        
        Returns:
            List[Layer]: List of layers
        """
        
        query = """
            SELECT * FROM layers
            WHERE map_area_id = ? AND parent_layer_id IS NULL
            ORDER BY z_index, created_at
        """
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            rows = db_manager.read(
                query,
                (map_area_id,),
                get_all=True
            )
        
        return [self._row_to_layer(row) for row in rows]

    def get_inherited_layers(
        self,
        map_area_id: int
    ) -> List[Layer]:
        """
        Get layers inherited from parent map areas.
        
        Args:
            map_area_id (int): Map area ID
        
        Returns:
            List[Layer]: List of inherited layers
        """
        
        # Get the parent map area
        parent_query = """
            SELECT parent_id FROM map_areas WHERE id = ?
        """
        # parent_row = self.db.fetchone(parent_query, (map_area_id,))
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            parent_row = db_manager.read(
                parent_query,
                (map_area_id,)
            )
        
        if not parent_row or not parent_row['parent_id']:
            return []
        
        parent_id = parent_row['parent_id']
        
        # Get layers from parent recursively
        parent_layers = self.list_layers_for_map_area(parent_id)
        
        # Create inherited copies for this map area if they don't exist
        inherited_layers = []
        for parent_layer in parent_layers:
            # Check if inherited version already exists
            existing_query = """
                SELECT * FROM layers
                WHERE map_area_id = ? AND parent_layer_id = ?
            """
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                existing_row = db_manager.read(
                    existing_query,
                    (map_area_id, parent_layer.id)
                )
            
            if existing_row:
                inherited_layers.append(self._row_to_layer(existing_row))
            else:
                # Create inherited layer
                inherited_layer = Layer(
                    map_area_id=map_area_id,
                    parent_layer_id=parent_layer.id,
                    name=parent_layer.name,
                    layer_type=parent_layer.layer_type,
                    visible=parent_layer.visible,
                    z_index=parent_layer.z_index,
                    is_editable=False,
                    config=parent_layer.config
                )
                created = self.create_layer(inherited_layer)
                inherited_layers.append(created)
        
        return inherited_layers

    def list_layers(
        self,
        project_id: int
    ) -> List[Layer]:
        """
        List layers for a project (deprecated - use list_layers_for_map_area).
        
        Args:
            project_id (int): Project ID
        
        Returns:
            List[Layer]: List of layers
        """
        
        # This is kept for backwards compatibility
        # Get master map area for this project
        query = """
            SELECT id FROM map_areas
            WHERE project_id = ? AND area_type = 'master'
            LIMIT 1
        """
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            row = db_manager.read(
                query,
                (project_id,)
            )
        
        if row:
            return self.list_layers_for_map_area(row['id'])
        
        return []

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
        
        Raises:
            ValueError: If trying to update a non-editable layer
        """
        
        # Check if layer is editable
        layer = self.get_layer(layer_id)
        if not layer:
            return None
        
        if not layer.is_editable:
            raise ValueError(
                "Cannot update inherited layer. "
                "Inherited layers are read-only."
            )
        
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
        
        Raises:
            ValueError: If trying to delete a non-editable layer
        """
        
        # Check if layer exists and is editable
        layer = self.get_layer(layer_id)
        if not layer:
            return False
        
        if not layer.is_editable:
            raise ValueError(
                "Cannot delete inherited layer. "
                "Inherited layers are read-only."
            )
        
        query = "DELETE FROM layers WHERE id = ?"
        self.db.execute(query, (layer_id,))
        return True

    def reorder_layers(
        self,
        layer_updates: List[Dict[str, Any]]
    ) -> List[Layer]:
        """
        Reorder layers by updating z_index.
        
        Args:
            layer_updates (List[Dict[str, Any]]): List of {id, z_index}
        
        Returns:
            List[Layer]: Updated layers
        """
        
        updated_layers = []
        for update in layer_updates:
            layer_id = update['id']
            z_index = update['z_index']
            
            query = """
                UPDATE layers
                SET z_index = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """
            self.db.execute(query, (z_index, layer_id))
            
            updated_layer = self.get_layer(layer_id)
            if updated_layer:
                updated_layers.append(updated_layer)
        
        return updated_layers

    def _row_to_layer(
        self,
        row: Any
    ) -> Layer:
        """
        Convert database row to Layer object.
        
        Args:
            row: Database row
        
        Returns:
            Layer: Layer object
        """
        
        from datetime import datetime as dt
        
        return Layer(
            id=row['id'],
            map_area_id=row['map_area_id'],
            parent_layer_id=row['parent_layer_id'],
            name=row['name'],
            layer_type=row['layer_type'],
            visible=bool(row['visible']),
            z_index=row['z_index'],
            is_editable=bool(row['is_editable']),
            config=json.loads(row['config']) if row['config'] else {},
            created_at=dt.fromisoformat(row['created_at']),
            updated_at=dt.fromisoformat(row['updated_at'])
        )
