"""
Annotation service for business logic operations.
"""

from typing import List, Optional, Dict, Any
import json
from datetime import datetime

from models import Annotation
from database import get_db


class AnnotationService:
    """
    Service class for annotation operations.
    
    Methods:
        __init__:
            Initialize AnnotationService
        create_annotation:
            Create a new annotation
        get_annotation:
            Get an annotation by ID
        list_annotations:
            List annotations for a layer
        update_annotation:
            Update an annotation
        delete_annotation:
            Delete an annotation
    """

    def __init__(self) -> None:
        """
        Initialize the AnnotationService.
        
        Returns:
            None
        """
        
        self.db = get_db()

    def create_annotation(
        self,
        annotation: Annotation
    ) -> Annotation:
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
        layer_query = "SELECT id, is_editable FROM layers WHERE id = ?"
        layer_row = self.db.fetchone(
            layer_query,
            (annotation.layer_id,)
        )
        
        if not layer_row:
            raise ValueError(
                f"Layer with ID {annotation.layer_id} does not exist"
            )
        
        if not layer_row['is_editable']:
            raise ValueError(
                "Cannot create annotations on read-only layers"
            )
        
        query = """
            INSERT INTO annotations (
                layer_id, annotation_type, coordinates,
                style, content
            )
            VALUES (?, ?, ?, ?, ?)
        """
        
        coords_json = json.dumps(annotation.coordinates)
        style_json = json.dumps(annotation.style)
        
        cursor = self.db.execute(
            query,
            (
                annotation.layer_id,
                annotation.annotation_type,
                coords_json,
                style_json,
                annotation.content
            )
        )
        
        annotation.id = cursor.lastrowid
        return annotation

    def get_annotation(
        self,
        annotation_id: int
    ) -> Optional[Annotation]:
        """
        Get an annotation by ID.
        
        Args:
            annotation_id (int): Annotation ID
        
        Returns:
            Optional[Annotation]: Annotation if found, None otherwise
        """
        
        query = "SELECT * FROM annotations WHERE id = ?"
        row = self.db.fetchone(query, (annotation_id,))
        
        if row:
            return Annotation(
                id=row['id'],
                layer_id=row['layer_id'],
                annotation_type=row['annotation_type'],
                coordinates=json.loads(row['coordinates']),
                style=json.loads(row['style']) if row['style'] else {},
                content=row['content'],
                created_at=datetime.fromisoformat(row['created_at']),
                updated_at=datetime.fromisoformat(row['updated_at'])
            )
        
        return None

    def list_annotations(
        self,
        layer_id: int
    ) -> List[Annotation]:
        """
        List annotations for a layer.
        
        Args:
            layer_id (int): Layer ID
        
        Returns:
            List[Annotation]: List of annotations
        """
        
        query = """
            SELECT * FROM annotations
            WHERE layer_id = ?
            ORDER BY created_at
        """
        rows = self.db.fetchall(query, (layer_id,))
        
        annotations = []
        for row in rows:
            annotations.append(
                Annotation(
                    id=row['id'],
                    layer_id=row['layer_id'],
                    annotation_type=row['annotation_type'],
                    coordinates=json.loads(row['coordinates']),
                    style=json.loads(row['style']) if row['style'] else {},
                    content=row['content'],
                    created_at=datetime.fromisoformat(row['created_at']),
                    updated_at=datetime.fromisoformat(row['updated_at'])
                )
            )
        
        return annotations

    def update_annotation(
        self,
        annotation_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Annotation]:
        """
        Update an annotation.
        
        Args:
            annotation_id (int): Annotation ID
            updates (Dict[str, Any]): Fields to update
        
        Returns:
            Optional[Annotation]: Updated annotation if found, None
        """
        
        allowed_fields = ['coordinates', 'style', 'content']
        
        set_clauses = []
        values = []
        
        for field in allowed_fields:
            if field in updates:
                if field in ['coordinates', 'style']:
                    set_clauses.append(f"{field} = ?")
                    values.append(json.dumps(updates[field]))
                else:
                    set_clauses.append(f"{field} = ?")
                    values.append(updates[field])
        
        if not set_clauses:
            return self.get_annotation(annotation_id)
        
        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        values.append(annotation_id)
        
        query = f"""
            UPDATE annotations
            SET {', '.join(set_clauses)}
            WHERE id = ?
        """
        
        self.db.execute(query, tuple(values))
        return self.get_annotation(annotation_id)

    def delete_annotation(
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
        
        query = "DELETE FROM annotations WHERE id = ?"
        cursor = self.db.execute(query, (annotation_id,))
        
        return cursor.rowcount > 0
