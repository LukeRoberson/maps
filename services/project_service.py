"""
Project service for business logic operations.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime

from flask import current_app
from models import Project
from database import DatabaseContext, DatabaseManager


class ProjectService:
    """
    Service class for project operations.
    
    Methods:
        __init__:
            Initialize ProjectService
        create_project:
            Create a new project
        get_project:
            Get a project by ID
        list_projects:
            List all projects
        update_project:
            Update a project
        delete_project:
            Delete a project
    """

    def __init__(self) -> None:
        """
        Initialize the ProjectService.
        
        Returns:
            None
        """
        
        self.db_path: str = current_app.config['DATABASE_PATH']

    def create_project(
        self,
        project: Project
    ) -> Project:
        """
        Create a new project.
        
        Args:
            project (Project): Project to create
        
        Returns:
            Project: Created project with assigned ID
        """
        
        query = """
            INSERT INTO projects (
                name, description, center_lat,
                center_lon, zoom_level
            )
            VALUES (?, ?, ?, ?, ?)
        """
        
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            db_manager.create(
                query,
                (
                    project.name,
                    project.description,
                    project.center_lat,
                    project.center_lon,
                    project.zoom_level
                )
            )
        
        return project

    def get_project(
        self,
        project_id: int
    ) -> Optional[Project]:
        """
        Get a project by ID.
        
        Args:
            project_id (int): Project ID
        
        Returns:
            Optional[Project]: Project if found, None otherwise
        """
        
        query = "SELECT * FROM projects WHERE id = ?"
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            row = db_manager.read(
                query,
                (project_id,)
            )
        
        if row:
            return Project(
                id=row['id'],
                name=row['name'],
                description=row['description'],
                center_lat=row['center_lat'],
                center_lon=row['center_lon'],
                zoom_level=row['zoom_level'],
                created_at=datetime.fromisoformat(row['created_at']),
                updated_at=datetime.fromisoformat(row['updated_at'])
            )
        
        return None

    def list_projects(self) -> List[Project]:
        """
        List all projects.
        
        Returns:
            List[Project]: List of all projects
        """
        
        query = """
            SELECT * FROM projects
            ORDER BY updated_at DESC
        """
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            rows = db_manager.read(
                query,
                get_all=True
            )
        
        projects = []
        for row in rows:
            projects.append(
                Project(
                    id=row['id'],
                    name=row['name'],
                    description=row['description'],
                    center_lat=row['center_lat'],
                    center_lon=row['center_lon'],
                    zoom_level=row['zoom_level'],
                    created_at=datetime.fromisoformat(row['created_at']),
                    updated_at=datetime.fromisoformat(row['updated_at'])
                )
            )
        
        return projects

    def update_project(
        self,
        project_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Project]:
        """
        Update a project.
        
        Args:
            project_id (int): Project ID
            updates (Dict[str, Any]): Fields to update
        
        Returns:
            Optional[Project]: Updated project if found, None otherwise
        """
        
        allowed_fields = [
            'name',
            'description',
            'center_lat',
            'center_lon',
            'zoom_level'
        ]
        
        set_clauses = []
        values = []
        
        for field in allowed_fields:
            if field in updates:
                set_clauses.append(f"{field} = ?")
                values.append(updates[field])
        
        if not set_clauses:
            return self.get_project(project_id)
        
        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        values.append(project_id)
        
        query = f"""
            UPDATE projects
            SET {', '.join(set_clauses)}
            WHERE id = ?
        """
        
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            db_manager.update(
                query,
                tuple(values)
            )

        return self.get_project(project_id)

    def delete_project(
        self,
        project_id: int
    ) -> bool:
        """
        Delete a project.
        
        Args:
            project_id (int): Project ID
        
        Returns:
            bool: True if deleted, False if not found
        """
        
        query = "DELETE FROM projects WHERE id = ?"
        with DatabaseContext(self.db_path) as db_ctx:
            db_manager = DatabaseManager(db_ctx)
            cursor = db_manager.delete(
                query,
                (project_id,)
            )

        return cursor.rowcount > 0
