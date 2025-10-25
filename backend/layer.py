"""
Module: backend.layer

Classes for managing map layers.

Classes:
    LayerModel:
        A data structure that represents a map layer.
    LayerService:
        Service class for layer operations with hierarchical support.

Third-party modules:
    flask:
        current_app - Access the Flask application context

Local modules:
    database:
        DatabaseContext - Context manager for database connections
        DatabaseManager - Manager for database operations
"""


# Standard library imports
from typing import (
    Optional,
    Dict,
    Any,
    List,
    Union,
    overload
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


class LayerModel:
    """
    A data structure that represents a map layer.
    This reflects the layer table in the database

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

    # Define valid layer types
    LAYER_TYPES = [
        'annotation',
        'custom'
    ]

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

        # Validate layer_type
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

        # Timestamps are in UTC
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def to_dict(
        self
    ) -> Dict[str, Any]:
        """
        Convert layer to dictionary representation.

        Args:
            None

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
    ) -> 'LayerModel':
        """
        Create a Layer from dictionary data.
            This is an alternative constructor, rather than __init__().
            Rather than passing details in one at a time,
            we can pass a dictionary.

        Args:
            data (Dict[str, Any]): Dictionary containing layer data

        Returns:
            Layer: New Layer instance
        """

        # Get the datetime fields if they exist
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'])

        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'])

        # Create and return the Layer instance
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


class LayerService:
    """
    Service class for layer operations with hierarchical support.

    Methods:
        __init__:
            Initialize LayerService
        _row_to_model:
            Convert database row to Layer model
        _reorder_layers:
            Reorder layers by updating z_index
        _get_inherited_layers:
            Get layers inherited from parent map areas
        _list_own_layers:
            List only layers created on this map area
        create:
            Create a new layer
        read:
            Get a layer by ID or layers by map ID
        update:
            Update a layer
        delete:
            Delete a layer
    """

    def __init__(
        self
    ) -> None:
        """
        Initialize the LayerService.

        Returns:
            None
        """

        # Get the config from the Flask application context
        self.db_path: str = current_app.config['DATABASE_PATH']

    def _row_to_model(
        self,
        row: Any
    ) -> LayerModel:
        """
        Convert database row to Layer object.

        Args:
            row: Database row

        Returns:
            Layer: Layer object
        """

        from datetime import datetime as dt

        return LayerModel(
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

    def _reorder_layers(
        self,
        layer_updates: List[Dict[str, Any]]
    ) -> List[LayerModel]:
        """
        Reorder layers by updating z_index.
            Makes changes to the database.
            Returns a list of updated Layer objects.

        Args:
            layer_updates (List[Dict[str, Any]]): List of {id, z_index}

        Returns:
            List[Layer]: Updated layers
        """

        # List to hold updated layers
        updated_layers = []

        # Loop through the layers to update (id and z_index)
        for update in layer_updates:
            layer_id = update['id']
            z_index = update['z_index']

            # Update the layer in the database
            try:
                with DatabaseContext(self.db_path) as db_ctx:
                    db_manager = DatabaseManager(db_ctx)
                    db_manager.update(
                        table="layers",
                        fields={
                            "z_index": z_index,
                            "updated_at": "CURRENT_TIMESTAMP"
                        },
                        parameters={
                            'id': layer_id
                        },
                    )

            except Exception as e:
                logger.error(
                    f"Error reordering layer {layer_id}: {str(e)}"
                )
                continue

            # Fetch the updated layer, add to the list
            updated_layer = self.read(layer_id=layer_id)
            if updated_layer:
                updated_layers.append(updated_layer)

        return updated_layers

    def _get_inherited_layers(
        self,
        map_id: int
    ) -> List[LayerModel]:
        """
        Get layers inherited from parent map areas.

        1. Get the parent map ID (if there is one)
        2. Get a list of layers from the parent map
        3. For each parent layer, check if an inherited copy exists
           on the current map
        4. If exists, use it; if not, create a new inherited layer

        Args:
            map_id (int): Map ID

        Returns:
            List[Layer]: List of inherited layers
        """

        # Get the parent map ID
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                parent_row = db_manager.read(
                    table="map_areas",
                    fields=['parent_id'],
                    params={
                        'id': map_id
                    }
                )

            # Check if there is a parent
            if not parent_row or not parent_row[0]:
                return []

            # Get the parent ID from the row
            parent_id_value = getattr(parent_row, 'parent_id', None)

            # Confirm parent_id_value is valid
            if not parent_id_value:
                return []

            # Store the parent ID as in integer
            parent_id: int = int(parent_id_value)

        except Exception as e:
            logger.error(
                f"Error fetching parent map area for {map_id}: {str(e)}"
            )
            return []

        # Get layers from parent recursively
        parent_layers = self.read(map_id=parent_id)

        # Create inherited copies of layers for the parent map
        inherited_layers = []
        for parent_layer in parent_layers:
            # Check if inherited version already exists
            try:
                with DatabaseContext(self.db_path) as db_ctx:
                    db_manager = DatabaseManager(db_ctx)
                    existing_row = db_manager.read(
                        table="layers",
                        fields=['*'],
                        params={
                            'map_area_id': map_id,
                            'parent_layer_id': parent_layer.id
                        }
                    )

            except Exception as e:
                logger.error(
                    f"Error checking existing inherited layer for "
                    f"map_area_id {map_id} and parent_layer_id "
                    f"{parent_layer.id}: {str(e)}"
                )
                continue

            # If exists, use it
            if existing_row:
                inherited_layers.append(self._row_to_model(existing_row))

            # Create new inherited layer
            else:
                inherited_layer = LayerModel(
                    map_area_id=map_id,
                    parent_layer_id=parent_layer.id,
                    name=parent_layer.name,
                    layer_type=parent_layer.layer_type,
                    visible=parent_layer.visible,
                    z_index=parent_layer.z_index,
                    is_editable=False,
                    config=parent_layer.config
                )
                created = self.create(inherited_layer)
                inherited_layers.append(created)

        return inherited_layers

    def _list_own_layers(
        self,
        map_id: int
    ) -> List[LayerModel]:
        """
        List only layers created on this map.

        Args:
            map_id (int): The ID of the map

        Returns:
            List[Layer]: List of layers
        """

        # Read layers from the database
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                rows = db_manager.read(
                    table="layers",
                    fields=['*'],
                    params={
                        'map_area_id': map_id,
                        'parent_layer_id': 'NULL'
                    },
                    order_by=['z_index', 'created_at'],
                    get_all=True
                )

        except Exception as e:
            logger.error(
                f"Error listing own layers for map_area_id {map_id}: {str(e)}"
            )
            return []

        # Convert rows to Layer models
        if rows:
            return [self._row_to_model(row) for row in rows]

        return []

    def create(
        self,
        layer: LayerModel
    ) -> LayerModel:
        """
        Create a new layer.

        Args:
            layer (Layer): Layer to create

        Returns:
            Layer: Created layer with assigned ID
        """

        # Serialize config to JSON
        config_json = json.dumps(layer.config)

        # Insert into the database
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                layer.id = db_manager.create(
                    table="layers",
                    params={
                        "map_area_id": layer.map_area_id,
                        "parent_layer_id": layer.parent_layer_id,
                        "name": layer.name,
                        "layer_type": layer.layer_type,
                        "visible": layer.visible,
                        "z_index": layer.z_index,
                        "is_editable": layer.is_editable,
                        "config": config_json
                    }
                )

        except Exception as e:
            logger.error(
                f"Error creating layer for map_area_id "
                f"{layer.map_area_id}: {str(e)}"
            )
            raise

        # Updated layer with ID
        return layer

    @overload
    def read(
        self,
        *,
        layer_id: int
    ) -> Optional[LayerModel]:
        ...

    @overload
    def read(
        self,
        *,
        map_id: int
    ) -> List[LayerModel]:
        ...

    def read(
        self,
        *,
        layer_id: Optional[int] = None,
        map_id: Optional[int] = None,
    ) -> Union[List[LayerModel], Optional[LayerModel]]:
        """
        Get a layers
            Single layer by layer_id,
            or list of layers by map_id.

        Args:
            layer_id (int): Layer ID
            map_id (int): Map ID
            project_id (int): Project ID

        Returns:
            Union[List[Layer], Optional[Layer]]: Layer(s) found
        """

        # Read a single layer from the database
        if layer_id:
            try:
                with DatabaseContext(self.db_path) as db_ctx:
                    db_manager = DatabaseManager(db_ctx)
                    row = db_manager.read(
                        table="layers",
                        fields=['*'],
                        params={
                            'id': layer_id
                        }
                    )

            except Exception as e:
                logger.error(
                    f"Error fetching layer {layer_id}: {str(e)}"
                )
                return None

            # Convert to Layer model if found
            if row:
                return self._row_to_model(row)

            return None

        # Read layers by map_id
        elif map_id:
            own_layers = self._list_own_layers(map_id)
            inherited_layers = self._get_inherited_layers(map_id)

            # Combine and sort by z_index
            all_layers = own_layers + inherited_layers
            all_layers.sort(key=lambda layer: layer.z_index)

            return all_layers

    def update(
        self,
        layer_id: int,
        updates: Dict[str, Any]
    ) -> Optional[LayerModel]:
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
        layer = self.read(layer_id=layer_id)
        if not layer:
            return None

        if not layer.is_editable:
            raise ValueError(
                "Cannot update inherited layer. "
                "Inherited layers are read-only."
            )

        # Fields that may appear in updates
        allowed_fields = [
            'name',
            'visible',
            'z_index',
            'config'
        ]

        # Build a dictionary of fields/values to update
        all_fields = {}
        for field in allowed_fields:
            if field in updates:
                # Serialize config if needed
                if field == 'config':
                    all_fields[field] = json.dumps(updates[field])

                # Otherwise, use the value directly
                else:
                    all_fields[field] = updates[field]

        # Always update the updated_at timestamp
        all_fields["updated_at"] = "CURRENT_TIMESTAMP"

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                db_manager.update(
                    table="layers",
                    fields=all_fields,
                    parameters={
                        'id': layer_id
                    },
                )

        except Exception as e:
            logger.error(
                f"Error updating layer {layer_id}: {str(e)}"
            )
            raise

        # Get the updated layer to return
        return self.read(layer_id=layer_id)

    def delete(
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
        layer = self.read(layer_id=layer_id)
        if not layer:
            return False

        if not layer.is_editable:
            raise ValueError(
                "Cannot delete inherited layer. "
                "Inherited layers are read-only."
            )

        # Delete the layer from the database
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                db_manager.delete(
                    table="layers",
                    parameters={
                        'id': layer_id
                    },
                )

        except Exception as e:
            logger.error(
                f"Error deleting layer {layer_id}: {str(e)}"
            )
            raise

        return True
