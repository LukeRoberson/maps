"""
Map area service for business logic operations.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from flask import current_app

from models import MapArea
from database import Database, DatabaseContext, DatabaseManager


class MapAreaService:
    """
    Service class for map area operations.
    
    Methods:
        __init__:
            Initialize MapAreaService
        create_map_area:
            Create a new map area
        get_map_area:
            Get a map area by ID
        list_map_areas:
            List map areas for a project
        get_hierarchy:
            Get hierarchical structure of map areas
        update_map_area:
            Update a map area
        delete_map_area:
            Delete a map area
    """

    def __init__(self) -> None:
        """
        Initialize the MapAreaService.
        
        Returns:
            None
        """
        
        self.db: Database = current_app.config['db']
        self.db_path: str = current_app.config['DATABASE_PATH']

    def create_map_area(
        self,
        map_area: MapArea
    ) -> MapArea:
        """
        Create a new map area.
        
        Args:
            map_area (MapArea): Map area to create
        
        Returns:
            MapArea: Created map area with assigned ID
        """
        
        query = """
            INSERT INTO map_areas (
                project_id, parent_id, name,
                area_type, boundary_id,
                default_center_lat, default_center_lon, default_zoom
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            map_area.id = db_manager.create(
                query,
                (
                    map_area.project_id,
                    map_area.parent_id,
                    map_area.name,
                    map_area.area_type,
                    map_area.boundary_id,
                    map_area.default_center_lat,
                    map_area.default_center_lon,
                    map_area.default_zoom
                )
            )
        
        return map_area

    def get_map_area(
        self,
        map_area_id: int
    ) -> Optional[MapArea]:
        """
        Get a map area by ID.
        
        Args:
            map_area_id (int): Map area ID
        
        Returns:
            Optional[MapArea]: Map area if found, None otherwise
        """
        
        query = "SELECT * FROM map_areas WHERE id = ?"
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            row = db_manager.read(
                query,
                (map_area_id,)
            )
        
        if row:
            return MapArea(
                id=row['id'],
                project_id=row['project_id'],
                parent_id=row['parent_id'],
                name=row['name'],
                area_type=row['area_type'],
                boundary_id=row['boundary_id'],
                default_center_lat=row['default_center_lat'],
                default_center_lon=row['default_center_lon'],
                default_zoom=row['default_zoom'],
                created_at=datetime.fromisoformat(row['created_at']),
                updated_at=datetime.fromisoformat(row['updated_at'])
            )
        
        return None

    def list_map_areas(
        self,
        project_id: int,
        parent_id: Optional[int] = None
    ) -> List[MapArea]:
        """
        List map areas for a project.
        
        Args:
            project_id (int): Project ID
            parent_id (Optional[int]): Parent area ID filter
        
        Returns:
            List[MapArea]: List of map areas
        """
        
        if parent_id is None:
            query = """
                SELECT * FROM map_areas
                WHERE project_id = ?
                ORDER BY created_at
            """
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                rows = db_manager.read(
                    query,
                    (project_id,),
                    get_all=True
                )
        else:
            query = """
                SELECT * FROM map_areas
                WHERE project_id = ? AND parent_id = ?
                ORDER BY created_at
            """
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                rows = db_manager.read(
                    query,
                    (project_id, parent_id),
                    get_all=True
                )
        
        map_areas = []
        for row in rows:
            map_areas.append(
                MapArea(
                    id=row['id'],
                    project_id=row['project_id'],
                    parent_id=row['parent_id'],
                    name=row['name'],
                    area_type=row['area_type'],
                    boundary_id=row['boundary_id'],
                    default_center_lat=row['default_center_lat'],
                    default_center_lon=row['default_center_lon'],
                    default_zoom=row['default_zoom'],
                    created_at=datetime.fromisoformat(row['created_at']),
                    updated_at=datetime.fromisoformat(row['updated_at'])
                )
            )
        
        return map_areas

    def get_hierarchy(
        self,
        project_id: int
    ) -> Dict[str, Any]:
        """
        Get hierarchical structure of map areas.
        
        Args:
            project_id (int): Project ID
        
        Returns:
            Dict[str, Any]: Hierarchical structure
        """
        
        all_areas = self.list_map_areas(project_id)
        
        hierarchy = {'master': None, 'suburbs': [], 'individuals': []}
        
        for area in all_areas:
            if area.area_type == 'master':
                hierarchy['master'] = area.to_dict()
            elif area.area_type == 'suburb':
                hierarchy['suburbs'].append(area.to_dict())
            elif area.area_type == 'individual':
                hierarchy['individuals'].append(area.to_dict())
        
        return hierarchy

    def update_map_area(
        self,
        map_area_id: int,
        updates: Dict[str, Any]
    ) -> Optional[MapArea]:
        """
        Update a map area.
        
        Args:
            map_area_id (int): Map area ID
            updates (Dict[str, Any]): Fields to update
        
        Returns:
            Optional[MapArea]: Updated map area if found, None otherwise
        """
        
        allowed_fields = [
            'name',
            'parent_id',
            'boundary_id',
            'default_center_lat',
            'default_center_lon',
            'default_zoom'
        ]
        
        set_clauses = []
        values = []
        
        for field in allowed_fields:
            if field in updates:
                set_clauses.append(f"{field} = ?")
                values.append(updates[field])
        
        if not set_clauses:
            return self.get_map_area(map_area_id)
        
        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        values.append(map_area_id)
        
        query = f"""
            UPDATE map_areas
            SET {', '.join(set_clauses)}
            WHERE id = ?
        """
        
        self.db.execute(query, tuple(values))
        return self.get_map_area(map_area_id)

    def delete_map_area(
        self,
        map_area_id: int
    ) -> bool:
        """
        Delete a map area.
        
        Args:
            map_area_id (int): Map area ID
        
        Returns:
            bool: True if deleted, False if not found
        """
        
        query = "DELETE FROM map_areas WHERE id = ?"
        cursor = self.db.execute(query, (map_area_id,))
        
        return cursor.rowcount > 0
