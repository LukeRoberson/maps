"""
Module: backend.project

Classes for managing projects.

Classes:
    ProjectModel:
        A data structure that represents a map project.
    ProjectService:
        Class for managing projects in the database.

Third-party modules:
    Flask:
        current_app: Access the Flask application context.

Local modules:
    database:
        DatabaseContext: Context manager for database connections.
        DatabaseManager: Manager for database operations.
"""


# Standard library imports
import logging
from datetime import (
    datetime,
    timezone
)
from typing import (
    Optional,
    List,
    Dict,
    Any,
    Union,
    overload
)

# Third-party imports
from flask import current_app

# Local imports
from database import (
    DatabaseContext,
    DatabaseManager
)


logger = logging.getLogger(__name__)


class ProjectModel:
    """
    A data structure that represents a map project.
    This reflects the 'projects' table in the database.

    Attributes:
        id (Optional[int]): Unique identifier
        name (str): Project name
        description (str): Project description
        center_lat (float): Center latitude of the map
        center_lon (float): Center longitude of the map
        zoom_level (float): Initial zoom level
        tile_layer (Optional[str]): Default tile layer ID
        created_at (datetime): Creation timestamp
        updated_at (datetime): Last update timestamp

    Methods:
        __init__:
            Initialize Project
        to_dict:
            Convert project to dictionary representation
        from_dict:
            Create project from dictionary
    """

    def __init__(
        self,
        name: str,
        description: str,
        center_lat: float,
        center_lon: float,
        zoom_level: float = 13,
        tile_layer: Optional[str] = None,
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ) -> None:
        """
        Initialize a Project.

        Args:
            name (str): Project name
            description (str): Project description
            center_lat (float): Center latitude
            center_lon (float): Center longitude
            zoom_level (float): Initial zoom level
            id (Optional[int]): Project ID
            created_at (Optional[datetime]): Creation timestamp
            updated_at (Optional[datetime]): Update timestamp

        Returns:
            None
        """

        self.id = id
        self.name = name
        self.description = description
        self.center_lat = center_lat
        self.center_lon = center_lon
        self.zoom_level = zoom_level
        self.tile_layer = tile_layer

        # Timestamps are in UTC
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def to_dict(
        self
    ) -> Dict[str, Any]:
        """
        Convert project to dictionary representation.

        Args:
            None

        Returns:
            Dict[str, Any]: Dictionary representation of the project
        """

        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'center_lat': self.center_lat,
            'center_lon': self.center_lon,
            'zoom_level': self.zoom_level,
            'tile_layer': self.tile_layer,
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
    ) -> 'ProjectModel':
        """
        Create a Project from dictionary data.
            This is an alternative constructor, rather than __init__().
            Rather than passing details in one at a time,
            we can pass a dictionary.

        Args:
            data (Dict[str, Any]): Dictionary containing project data

        Returns:
            Project: New Project instance
        """

        # Get the datetime fields if they exist
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'])

        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'])

        # Create and return the Project instance
        return cls(
            id=data.get('id'),
            name=data['name'],
            description=data['description'],
            center_lat=data['center_lat'],
            center_lon=data['center_lon'],
            zoom_level=data.get('zoom_level', 13),
            created_at=created_at,
            updated_at=updated_at
        )


class ProjectService:
    """
    Class for managing projects in the database.

    Methods:
        __init__:
            Initialize the class instance
        _row_to_model:
            Convert a database row to a ProjectModel
        create:
            Create a new project
        read:
            read one or more project entries
        update:
            Update a project
        delete:
            Delete a project
    """

    def __init__(self) -> None:
        """
        Initialize the class instance.

        Returns:
            None
        """

        # Get the config from the Flask application context
        self.db_path: str = current_app.config['DATABASE_PATH']

    def _row_to_model(
        self,
        row: Dict[str, Any]
    ) -> ProjectModel:
        """
        Convert a database row to a ProjectModel.

        Args:
            row (Dict[str, Any]): Database row

        Returns:
            ProjectModel: Project model instance
        """

        return ProjectModel(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            center_lat=row['center_lat'],
            center_lon=row['center_lon'],
            zoom_level=row['zoom_level'],
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        )

    def create(
        self,
        project: ProjectModel
    ) -> ProjectModel:
        """
        Create a new project.

        Args:
            project (Project): Project to create

        Returns:
            Project: Created project with assigned ID
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                project_id = db_manager.create(
                    table="projects",
                    params={
                        "name": project.name,
                        "description": project.description,
                        "center_lat": project.center_lat,
                        "center_lon": project.center_lon,
                        "zoom_level": project.zoom_level
                    }
                )

            # Update the project instance with the new ID
            project.id = project_id
            return project

        except Exception as e:
            logger.error(f"Error creating project: {str(e)}")
            raise

    @overload
    def read(
        self,
        project_id: int
    ) -> Optional[ProjectModel]: ...

    @overload
    def read(
        self,
        project_id: None = None
    ) -> List[ProjectModel]: ...

    def read(
        self,
        project_id: Optional[int] = None
    ) -> Union[List[ProjectModel], Optional[ProjectModel]]:
        """
        Fetch projects from the database.

        Args:
            project_id (Optional[int]):
                If provided, fetch single project.
                If None, fetch all projects.

        Returns:
            Union[List[ProjectModel], Optional[ProjectModel]]:
                Single project if project_id provided,
                list of projects otherwise
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)

                # Build query parameters
                params = {'id': project_id} if project_id else {}
                get_all = project_id is None

                rows = db_manager.read(
                    table="projects",
                    fields=['*'],
                    params=params,
                    order_by=['updated_at'] if get_all else None,
                    order_desc=True if get_all else False,
                    get_all=get_all
                )

        except Exception as e:
            logger.error(f"Error reading projects: {str(e)}")
            raise

        # Handle single project case
        if project_id:
            row_dict = {}
            if rows:
                row = rows[0] if isinstance(rows, list) else rows
                for key in row.keys():
                    row_dict[key] = row[key]
                return self._row_to_model(row_dict)
            return None

        # Handle multiple projects case
        projects = []
        if rows:
            for row in rows:
                # Convert Row to dict with proper types
                row_dict = {
                    str(key): row[key]
                    for key in row.keys()
                }
                projects.append(self._row_to_model(row_dict))

        return projects

    def update(
        self,
        project_id: int,
        updates: Dict[str, Any]
    ) -> Optional[ProjectModel]:
        """
        Update a project.

        Args:
            project_id (int): Project ID
            updates (Dict[str, Any]): Fields to update

        Returns:
            Optional[ProjectModel]: Updated project if found, None otherwise
        """

        # Fields that may appear in updates
        allowed_fields = [
            'name',
            'description',
            'center_lat',
            'center_lon',
            'zoom_level'
        ]

        # Build a dictionary of fields/values to update
        all_fields = {}
        for field in allowed_fields:
            if field in updates:
                all_fields[field] = updates[field]

        # Always update the updated_at timestamp
        all_fields["updated_at"] = "CURRENT_TIMESTAMP"

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                db_manager.update(
                    table="projects",
                    fields=all_fields,
                    parameters={
                        'id': project_id
                    },
                )
        except Exception as e:
            logger.error(f"Error updating project: {str(e)}")
            raise

        # Read the updated project from the DB
        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                row = db_manager.read(
                    table="projects",
                    fields=['*'],
                    params={
                        'id': project_id
                    }
                )

        except Exception as e:
            logger.error(f"Error reading updated project: {str(e)}")
            raise

        if row:
            # Handle the case where row might be a list
            if isinstance(row, list):
                if len(row) > 0:
                    return self._row_to_model(dict(row[0]))
                return None

            # Handle the case where row is a single row
            return self._row_to_model(dict(row))

        return None

    def delete(
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

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)
                cursor = db_manager.delete(
                    table="projects",
                    parameters={
                        'id': project_id
                    },
                )

        except Exception as e:
            logger.error(f"Error deleting project: {str(e)}")
            raise

        # True if a row was deleted
        return cursor.rowcount > 0

    def export_project(
        self,
        project_id: int
    ) -> Dict[str, Any]:
        """
        Export a project with all its data
            (map areas, boundaries, layers, annotations).

        Args:
            project_id (int): Project ID

        Returns:
            Dict[str, Any]: Complete project data structure
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)

                # Get project data
                project_row = db_manager.read(
                    table="projects",
                    fields=['*'],
                    params={'id': project_id}
                )

                if not project_row:
                    raise ValueError(f"Project {project_id} not found")

                project_dict = (
                    dict(project_row)
                    if not isinstance(project_row, list)
                    else dict(project_row[0])
                )

                # Get all map areas
                map_areas = db_manager.read(
                    table="map_areas",
                    fields=['*'],
                    params={'project_id': project_id},
                    get_all=True
                )

                map_areas_list = []
                boundaries_list = []
                layers_list = []
                annotations_list = []

                if map_areas:
                    for area_row in map_areas:
                        area_dict = dict(area_row)
                        map_areas_list.append(area_dict)

                        # Get boundary for this map area
                        boundary = db_manager.read(
                            table="boundaries",
                            fields=['*'],
                            params={'map_area_id': area_dict['id']},
                            get_all=True
                        )

                        if boundary:
                            for b in boundary:
                                boundaries_list.append(dict(b))

                        # Get layers for this map area
                        layers = db_manager.read(
                            table="layers",
                            fields=['*'],
                            params={'map_area_id': area_dict['id']},
                            get_all=True
                        )

                        if layers:
                            for layer_row in layers:
                                layer_dict = dict(layer_row)
                                layers_list.append(layer_dict)

                                # Get annotations for this layer
                                annotations = db_manager.read(
                                    table="annotations",
                                    fields=['*'],
                                    params={'layer_id': layer_dict['id']},
                                    get_all=True
                                )

                                if annotations:
                                    for ann in annotations:
                                        annotations_list.append(dict(ann))

                # Construct export data
                export_data = {
                    'version': '1.0',
                    'export_date': datetime.now(timezone.utc).isoformat(),
                    'project': project_dict,
                    'map_areas': map_areas_list,
                    'boundaries': boundaries_list,
                    'layers': layers_list,
                    'annotations': annotations_list
                }

                return export_data

        except Exception as e:
            logger.error(f"Error exporting project: {str(e)}")
            raise

    def import_project(
        self,
        import_data: Dict[str, Any]
    ) -> int:
        """
        Import a project from exported data.

        Args:
            import_data (Dict[str, Any]): Project export data

        Returns:
            int: New project ID
        """

        try:
            with DatabaseContext(self.db_path) as db_ctx:
                db_manager = DatabaseManager(db_ctx)

                # Validate import data
                if (
                    'version' not in import_data
                    or 'project' not in import_data
                ):
                    raise ValueError("Invalid import data format")

                project_data = import_data['project']

                # Create new project (without ID)
                new_project = {
                    'name': project_data['name'],
                    'description': project_data.get('description', ''),
                    'center_lat': project_data['center_lat'],
                    'center_lon': project_data['center_lon'],
                    'zoom_level': project_data.get('zoom_level', 13)
                }

                new_project_id = db_manager.create(
                    table="projects",
                    params=new_project
                )

                # Map old IDs to new IDs
                map_area_id_map = {}
                layer_id_map = {}

                # Import map areas
                if 'map_areas' in import_data:
                    for area in import_data['map_areas']:
                        old_area_id = area['id']

                        new_area = {
                            'project_id': new_project_id,
                            'parent_id': map_area_id_map.get(
                                area.get('parent_id')
                            ),
                            'name': area['name'],
                            'area_type': area['area_type'],
                            'default_center_lat': area.get(
                                'default_center_lat'
                            ),
                            'default_center_lon': area.get(
                                'default_center_lon'
                            ),
                            'default_zoom': area.get(
                                'default_zoom'
                            )
                        }

                        new_area_id = db_manager.create(
                            table="map_areas",
                            params=new_area
                        )

                        map_area_id_map[old_area_id] = new_area_id

                # Import boundaries
                if 'boundaries' in import_data:
                    for boundary in import_data['boundaries']:
                        old_map_area_id = boundary['map_area_id']
                        new_map_area_id = map_area_id_map.get(old_map_area_id)

                        if new_map_area_id:
                            new_boundary = {
                                'map_area_id': new_map_area_id,
                                'coordinates': boundary['coordinates']
                            }

                            db_manager.create(
                                table="boundaries",
                                params=new_boundary
                            )

                # Import layers
                if 'layers' in import_data:
                    for layer in import_data['layers']:
                        old_layer_id = layer['id']
                        old_map_area_id = layer['map_area_id']
                        new_map_area_id = map_area_id_map.get(old_map_area_id)

                        if new_map_area_id:
                            new_layer = {
                                'map_area_id': new_map_area_id,
                                'parent_layer_id': layer_id_map.get(
                                    layer.get('parent_layer_id')
                                ),
                                'name': layer['name'],
                                'layer_type': layer['layer_type'],
                                'visible': layer.get('visible', True),
                                'z_index': layer.get('z_index', 0),
                                'is_editable': layer.get('is_editable', True),
                                'config': layer.get('config')
                            }

                            new_layer_id = db_manager.create(
                                table="layers",
                                params=new_layer
                            )

                            layer_id_map[old_layer_id] = new_layer_id

                # Import annotations
                if 'annotations' in import_data:
                    for annotation in import_data['annotations']:
                        old_layer_id = annotation['layer_id']
                        new_layer_id = layer_id_map.get(old_layer_id)

                        if new_layer_id:
                            new_annotation = {
                                'layer_id': new_layer_id,
                                'annotation_type': annotation[
                                    'annotation_type'
                                ],
                                'coordinates': annotation['coordinates'],
                                'style': annotation.get('style'),
                                'content': annotation.get('content')
                            }

                            db_manager.create(
                                table="annotations",
                                params=new_annotation
                            )

                if new_project_id is None:
                    raise ValueError("Failed to create project")

                return new_project_id

        except Exception as e:
            logger.error(f"Error importing project: {str(e)}")
            raise
