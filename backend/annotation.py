"""
Module: backend.annotation

Classes for managing annotations.

Classes:
    AnnotationModel:
        A data structure that represents an annotation on a custom layer.
"""

from typing import (
    Optional,
    Dict,
    Any
)
from datetime import (
    datetime,
    timezone
)


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
