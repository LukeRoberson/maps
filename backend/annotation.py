"""
Module: backend.annotation

Classes for managing annotations.

Classes:
    AnnotationModel:
        A data structure that represents an annotation on a custom layer.
    AnnotationService:
        Service class for annotation operations.

Third-party modules:
    Flask:
        current_app: Access the Flask application context.

Local modules:
    database:
        DatabaseContext: Context manager for database connections.
        DatabaseManager: Manager for database operations.
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


class AnnotationModel:
    """
    A data structure that represents an annotation on a custom layer.
    This reflects the 'annotations' table in the database.

    Attributes:
        id (Optional[int]): Unique identifier
        layer_id (int): Associated layer ID
        annotation_type (str): Type of annotation (marker, line, polygon, text)
        coordinates (Any): Coordinate data for the annotation
        style (Dict[str, Any]): Styling information
        content (Optional[str]): Text content for text annotations
        created_at (datetime): Creation timestamp
        updated_at (datetime): Last update timestamp

    Methods:
        __init__:
            Initialize Annotation
        to_dict:
            Convert annotation to dictionary representation
        from_dict:
            Create annotation from dictionary
    """

    # Define allowed annotation types
    ANNOTATION_TYPES = [
        'marker',
        'line',
        'polygon',
        'text'
    ]

    def __init__(
        self,
        layer_id: int,
        annotation_type: str,
        coordinates: Any,
        style: Optional[Dict[str, Any]] = None,
        content: Optional[str] = None,
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ) -> None:
        """
        Initialize a new Annotation.

        Args:
            layer_id (int): Associated layer ID
            annotation_type (str): Type of annotation
            coordinates (Any): Coordinate data
            style (Optional[Dict[str, Any]]): Styling information
            content (Optional[str]): Text content
            id (Optional[int]): Annotation ID
            created_at (Optional[datetime]): Creation timestamp
            updated_at (Optional[datetime]): Update timestamp

        Returns:
            None

        Raises:
            ValueError: If annotation_type is not valid
        """

        # Validate annotation_type
        if annotation_type not in self.ANNOTATION_TYPES:
            raise ValueError(
                f"Invalid annotation_type: {annotation_type}. "
                f"Must be one of {self.ANNOTATION_TYPES}"
            )

        self.id = id
        self.layer_id = layer_id
        self.annotation_type = annotation_type
        self.coordinates = coordinates
        self.style = style or {}
        self.content = content

        # Timestamps are in UTC
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def to_dict(
        self
    ) -> Dict[str, Any]:
        """
        Convert annotation to dictionary representation.

        Args:
            None

        Returns:
            Dict[str, Any]: Dictionary representation of the annotation
        """

        return {
            'id': self.id,
            'layer_id': self.layer_id,
            'annotation_type': self.annotation_type,
            'coordinates': self.coordinates,
            'style': self.style,
            'content': self.content,
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
    ) -> 'AnnotationModel':
        """
        Create an Annotation from dictionary data.
            This is an alternative constructor, rather than __init__().
            Rather than passing details in one at a time,
            we can pass a dictionary.

        Args:
            data (Dict[str, Any]): Dictionary containing annotation data

        Returns:
            Annotation: New Annotation instance
        """

        # Get the datetime fields if they exist
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'])

        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'])

        # Create and return the Annotation instance
        return cls(
            id=data.get('id'),
            layer_id=data['layer_id'],
            annotation_type=data['annotation_type'],
            coordinates=data['coordinates'],
            style=data.get('style', {}),
            content=data.get('content'),
            created_at=created_at,
            updated_at=updated_at
        )


class AnnotationService:
    """
    Service class for annotation operations.

    Methods:
        __init__:
            Initialize AnnotationService
        _row_to_model:
            Convert database row to AnnotationModel
        create:
            Create a new annotation
        read:
            Get an annotation by ID or list annotations by layer ID
        update:
            Update an annotation
        delete:
            Delete an annotation
    """

    def __init__(self) -> None:
        """
        Initialize the AnnotationService.

        Returns:
            None
        """

        # Get the config from the Flask application context
        self.db_path: str = current_app.config['DATABASE_PATH']

    def _row_to_model(
        self,
        row: Dict[str, Any]
    ) -> AnnotationModel:
        """
        Convert a database row to a AnnotationModel.

        Args:
            row (Dict[str, Any]): Database row

        Returns:
            AnnotationModel: Project model instance
        """

        return AnnotationModel(
            id=row['id'],
            layer_id=row['layer_id'],
            annotation_type=row['annotation_type'],
            coordinates=json.loads(row['coordinates']),
            style=json.loads(row['style']) if row['style'] else {},
            content=row['content'],
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        )

    def create(
        self,
        annotation: AnnotationModel
    ) -> AnnotationModel:
        """
        Create a new annotation.

        Args:
            annotation (Annotation): Annotation to create

        Returns:
            Annotation: Created annotation with assigned ID

        Raises:
            ValueError: If layer does not exist or is not editable
        """

        # Validate that the layer exists
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                layer_row = db_manager.read(
                    table="layers",
                    fields=['id', 'is_editable'],
                    params={
                        'id': annotation.layer_id
                    }
                )

            if not layer_row:
                raise ValueError(
                    f"Layer with ID {annotation.layer_id} does not exist"
                )

            # Check if the layer is editable
            is_editable = layer_row[1]
            if not is_editable:
                logger.error(
                    f"Attempt to create annotation on read-only layer ID "
                    f"{annotation.layer_id}"
                )
                raise ValueError(
                    "Cannot create annotations on read-only layers"
                )

        except Exception as e:
            raise ValueError(
                f"Error validating layer: {str(e)}"
            )

        # Serialize coordinates and style to JSON
        coords_json = json.dumps(annotation.coordinates)
        style_json = json.dumps(annotation.style)

        # Insert the annotation into the database
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                annotation.id = db_manager.create(
                    table="annotations",
                    params={
                        "layer_id": annotation.layer_id,
                        "annotation_type": annotation.annotation_type,
                        "coordinates": coords_json,
                        "style": style_json,
                        "content": annotation.content
                    }
                )

        except Exception as e:
            raise ValueError(
                f"Error creating annotation: {str(e)}"
            )

        return annotation

    @overload
    def read(
        self,
        *,
        annotation_id: int
    ) -> Optional[AnnotationModel]: ...

    @overload
    def read(
        self,
        *,
        layer_id: int
    ) -> List[AnnotationModel]: ...

    def read(
        self,
        *,
        annotation_id: Optional[int] = None,
        layer_id: Optional[int] = None,
    ) -> Union[List[AnnotationModel], Optional[AnnotationModel]]:
        """
        Get an annotation by ID.

        Args:
            annotation_id (int): Annotation ID

        Returns:
            Optional[Annotation]: Annotation if found, None otherwise
        """

        # Retrieve a single annotation by ID
        if annotation_id:
            logger.info(f"Reading annotation ID: {annotation_id}")
            try:
                with DatabaseContext(self.db_path) as db_ctx:
                    db_manager = DatabaseManager(db_ctx)
                    row = db_manager.read(
                        table="annotations",
                        fields=['*'],
                        params={
                            'id': annotation_id
                        }
                    )

            except Exception as e:
                raise ValueError(
                    f"Error retrieving annotation: {str(e)}"
                )

            # Single Row
            if annotation_id:
                row_dict = {}
                if row:
                    row = row[0] if isinstance(row, list) else row
                    for key in row.keys():
                        row_dict[key] = row[key]
                    return self._row_to_model(row_dict)
                return None

        # Retrieve all annotations for a layer
        elif layer_id:
            logger.info(f"Listing annotations for layer ID: {layer_id}")
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                rows = db_manager.read(
                    table="annotations",
                    fields=['*'],
                    params={
                        'layer_id': layer_id
                    },
                    order_by=['created_at'],
                    get_all=True
                )

            annotations = []
            if rows:
                for row in rows:
                    style = json.loads(row['style']) if row['style'] else {}
                    annotations.append(
                        AnnotationModel(
                            id=row['id'],
                            layer_id=row['layer_id'],
                            annotation_type=row['annotation_type'],
                            coordinates=json.loads(row['coordinates']),
                            style=style,
                            content=row['content'],
                            created_at=datetime.fromisoformat(
                                row['created_at']
                            ),
                            updated_at=datetime.fromisoformat(
                                row['updated_at']
                            )
                        )
                    )

            return annotations

    def update(
        self,
        annotation_id: int,
        updates: Dict[str, Any]
    ) -> Optional[AnnotationModel]:
        """
        Update an annotation.

        Args:
            annotation_id (int): Annotation ID
            updates (Dict[str, Any]): Fields to update

        Returns:
            Optional[Annotation]: Updated annotation if found, None
        """

        # Fields that can be updated
        allowed_fields = [
            'coordinates',
            'style',
            'content'
        ]

        # Build a dictionary of fields/values to update
        all_fields = {}
        for field in allowed_fields:
            if field in updates:
                # Serialize to JSON if necessary
                if field in ['coordinates', 'style']:
                    all_fields[field] = json.dumps(updates[field])
                else:
                    all_fields[field] = updates[field]

        # Always update the updated_at timestamp
        all_fields["updated_at"] = "CURRENT_TIMESTAMP"

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                db_manager.update(
                    table="annotations",
                    fields=all_fields,
                    parameters={
                        'id': annotation_id
                    }
                )

        except Exception as e:
            raise ValueError(
                f"Error updating annotation: {str(e)}"
            )

        return self.read(annotation_id=annotation_id)

    def delete(
        self,
        annotation_id: int
    ) -> bool:
        """
        Delete an annotation.

        Args:
            annotation_id (int): Annotation ID

        Returns:
            bool: True if deleted, False if not found
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                cursor = db_manager.delete(
                    table="annotations",
                    parameters={
                        'id': annotation_id
                    },
                )

        except Exception as e:
            raise ValueError(
                f"Error deleting annotation: {str(e)}"
            )

        # True if a row was deleted
        return cursor.rowcount > 0
