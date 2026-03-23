"""
Module: test_projects.py

Unit tests for project-related API endpoints.

Endpoints Tested:
    - /api/projects
    - /api/projects/{project_id}
    - /api/projects/{project_id}/export

Classes:
    TestGetProjects
        Tests for retrieving the list of projects.
    TestCreateProject
        Tests for creating a new project.
    TestExportProject
        Tests for exporting a project.

To Do:
    - Update project test to:
        1. Create a new project
        2. Update the project
        3. Delete the project
    - Add test for importing projects.
"""


import requests

BASE_URL = "http://localhost:5000"
API_PREFIX = "/api"


class TestGetProjects:
    """
    Tests for the /api/projects endpoint.

    Methods:
        test_list_projects
            Test retrieving the list of all projects.
        test_list_specific_project
            Test retrieving a specific project by ID.
        test_list_nonexistent_project
            Test retrieving a project that does not exist.
    """

    def test_list_projects(self) -> None:
        """
        Test retrieving the list of all projects.

        Test:
            - Endpoint returns status code 200
            - Response contains a list
            - Each project has the expected fields with correct types
        """

        url = f"{BASE_URL}{API_PREFIX}/projects"
        response = requests.get(url)

        # Validate response code
        assert response.status_code == 200

        # Validate response body
        data = response.json()
        assert "projects" in data
        assert isinstance(data["projects"], list)

        # If there are projects, validate the structure
        if len(data["projects"]) > 0:
            project_list = data["projects"]
            assert all(
                (
                    "id" in project and
                    isinstance(project["id"], int)
                ) and
                (
                    "name" in project and
                    isinstance(project["name"], str)
                ) and
                (
                    "description" in project and
                    isinstance(project["description"], str)
                ) and
                (
                    "center_lat" in project and
                    isinstance(project["center_lat"], float)
                ) and
                (
                    "center_lon" in project and
                    isinstance(project["center_lon"], float)
                ) and
                (
                    "zoom_level" in project and
                    isinstance(project["zoom_level"], int)
                )
                for project in project_list
            )

    def test_list_specific_project(self) -> None:
        """
        Test retrieving a specific project by ID.

        Tests:
            - Endpoint returns status code 200
            - Response contains the expected project data
        """

        # Get a list of projects to find a valid project ID
        url = f"{BASE_URL}{API_PREFIX}/projects"
        response = requests.get(url)
        assert response.status_code == 200
        data = response.json()

        # Get the first result by ID
        if (
            data is not None and
            "projects" in data and
            len(data["projects"]) > 0
        ):
            # Project ID
            project_id = data["projects"][0]["id"]

            # Make request
            url = f"{BASE_URL}{API_PREFIX}/projects/{project_id}"
            response = requests.get(url)

            # Validate response code and content
            assert response.status_code == 200
            project_data = response.json()
            assert len(project_data) > 0
            assert "id" in project_data and project_data["id"] == project_id

    def test_list_nonexistent_project(
        self,
        invalid_project_id: int
    ) -> None:
        """
        Test retrieving a project that does not exist.

        Tests:
            - Endpoint returns status code 404
            - Response contains error message
        """

        # Use a very large ID that is unlikely to exist
        url = f"{BASE_URL}{API_PREFIX}/projects/{invalid_project_id}"
        response = requests.get(url)

        # Validate response code and content
        assert response.status_code == 404
        data = response.json()
        assert "error" in data and isinstance(data["error"], str)


class TestCreateProject:
    """
    Tests for the /api/projects endpoint.

    Methods:
        test_create_project
            Test creating a new project with valid data.
    """

    def test_create_project(
        self,
        valid_new_project: dict
    ) -> None:
        """
        Test creating a new project with valid data.

        Test:
            - Endpoint returns status code 201
            - Response contains fields and types
        """

        url = f"{BASE_URL}{API_PREFIX}/projects"
        response = requests.post(
            url,
            json=valid_new_project
        )

        # Validate response code
        assert response.status_code == 201

        # Validate response body
        data = response.json()
        assert "id" in data and isinstance(data["id"], int)
        assert "name" in data and isinstance(data["name"], str)
        assert "description" in data and isinstance(data["description"], str)
        assert "center_lat" in data and isinstance(data["center_lat"], float)
        assert "center_lon" in data and isinstance(data["center_lon"], float)
        assert "zoom_level" in data and isinstance(data["zoom_level"], int)
        assert "created_at" in data and isinstance(data["created_at"], str)
        assert "updated_at" in data and isinstance(data["updated_at"], str)

    def test_create_project_invalid_data(
        self,
        invalid_new_project: dict
    ) -> None:
        """
        Test creating a new project with invalid data.

        Test:
            - Endpoint returns status code 400
            - Response contains error message
        """

        url = f"{BASE_URL}{API_PREFIX}/projects"
        response = requests.post(
            url,
            json=invalid_new_project
        )

        # Validate response code
        assert response.status_code == 400

        # Validate response body
        data = response.json()
        assert "error" in data and isinstance(data["error"], str)


class TestExportProject:
    """
    Tests for the /api/projects/{project_id}/export endpoint.

    Methods:
        test_export_project
            Test exporting a project with a valid project ID.
    """

    def test_export_project(
        self,
        valid_project_id: int
    ) -> None:
        """
        Test exporting a project with a valid project ID.

        Test:
            - Endpoint returns status code 200
            - Response contains expected fields and types
        """

        url = f"{BASE_URL}{API_PREFIX}/projects/{valid_project_id}/export"
        response = requests.get(url)

        # Validate response
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0

        # Check for expected main fields and types
        assert "version" in data and isinstance(data["version"], str)
        assert "export_date" in data and isinstance(data["export_date"], str)
        assert "project" in data and isinstance(data["project"], dict)
        assert "map_areas" in data and isinstance(data["map_areas"], list)
        assert "boundaries" in data and isinstance(data["boundaries"], list)
        assert "layers" in data and isinstance(data["layers"], list)
        assert "annotations" in data and isinstance(data["annotations"], list)

        # Check for expected project fields and types
        project = data["project"]
        assert "id" in project and isinstance(project["id"], int)
        assert "name" in project and isinstance(project["name"], str)
        assert (
            "description" in project and
            isinstance(project["description"], str)
        )
        assert (
            "center_lat" in project and
            isinstance(project["center_lat"], float)
        )
        assert (
            "center_lon" in project and
            isinstance(project["center_lon"], float)
        )
        assert (
            "zoom_level" in project and
            isinstance(project["zoom_level"], int)
        )
        assert (
            "created_at" in project and
            isinstance(project["created_at"], str)
        )
        assert (
            "updated_at" in project and
            isinstance(project["updated_at"], str)
        )

        # Check map areas, if any
        map_area = data["map_areas"]
        if len(map_area) > 0:
            assert all(
                (
                    "id" in area and
                    isinstance(area["id"], int)
                ) and
                (
                    "project_id" in area and
                    isinstance(area["project_id"], int)
                ) and
                (
                    "parent_id" in area and
                    (
                        isinstance(area["parent_id"], int) or
                        area["parent_id"] is None
                    )
                ) and
                (
                    "name" in area and
                    isinstance(area["name"], str)
                ) and
                (
                    "area_type" in area and
                    isinstance(area["area_type"], str) and
                    area["area_type"] in ["region", "suburb", "individual"]
                ) and
                (
                    "boundary_id" in area and
                    (
                        isinstance(area["boundary_id"], int) or
                        area["boundary_id"] is None
                    )
                ) and
                (
                    "default_center_lat" in area and
                    (
                        isinstance(area["default_center_lat"], float) or
                        area["default_center_lat"] is None
                    )
                ) and
                (
                    "default_center_lon" in area and
                    (
                        isinstance(area["default_center_lon"], float) or
                        area["default_center_lon"] is None
                    )
                ) and
                (
                    "default_zoom" in area and
                    (
                        isinstance(area["default_zoom"], int) or
                        isinstance(area["default_zoom"], float) or
                        area["default_zoom"] is None
                    )
                ) and
                (
                    "created_at" in area and
                    isinstance(area["created_at"], str)
                ) and
                (
                    "updated_at" in area and
                    isinstance(area["updated_at"], str)
                )
                for area in map_area
            )

        # Check boundaries, if any
        boundaries = data["boundaries"]
        if len(boundaries) > 0:
            for index, boundary in enumerate(boundaries):
                assert "id" in boundary, (
                    f"boundary[{index}] missing id: {boundary!r}"
                )
                assert isinstance(boundary["id"], int), (
                    f"boundary[{index}] id is not an int: "
                    f"{boundary.get('id')!r}; full item={boundary!r}"
                )

                assert "map_area_id" in boundary, (
                    f"boundary[{index}] missing map_area_id: {boundary!r}"
                )
                assert isinstance(boundary["map_area_id"], int), (
                    f"boundary[{index}] map_area_id is not an int: "
                    f"{boundary.get('map_area_id')!r}; full item={boundary!r}"
                )

                assert "layer_id" in boundary, (
                    f"boundary[{index}] missing layer_id: {boundary!r}"
                )
                assert (
                    isinstance(boundary["layer_id"], int) or
                    boundary["layer_id"] is None
                ), (
                    f"boundary[{index}] layer_id is not an int or None: "
                    f"{boundary.get('layer_id')!r}; full item={boundary!r}"
                )

                assert "coordinates" in boundary, (
                    f"boundary[{index}] missing coordinates: {boundary!r}"
                )
                assert isinstance(boundary["coordinates"], str), (
                    f"boundary[{index}] coordinates is not a string: "
                    f"{boundary.get('coordinates')!r}; full item={boundary!r}"
                )

                assert "created_at" in boundary, (
                    f"boundary[{index}] missing created_at: {boundary!r}"
                )
                assert isinstance(boundary["created_at"], str), (
                    f"boundary[{index}] created_at is not a string: "
                    f"{boundary.get('created_at')!r}; full item={boundary!r}"
                )

                assert "updated_at" in boundary, (
                    f"boundary[{index}] missing updated_at: {boundary!r}"
                )
                assert isinstance(boundary["updated_at"], str), (
                    f"boundary[{index}] updated_at is not a string: "
                    f"{boundary.get('updated_at')!r}; full item={boundary!r}"
                )

        # Check layers, if any
        layers = data["layers"]
        if len(layers) > 0:
            for index, layer in enumerate(layers):
                assert "id" in layer, (
                    f"layer[{index}] missing id: {layer!r}"
                )
                assert isinstance(layer["id"], int), (
                    f"layer[{index}] id is not an int: "
                    f"{layer.get('id')!r}; full item={layer!r}"
                )

                assert "map_area_id" in layer, (
                    f"layer[{index}] missing map_area_id: {layer!r}"
                )
                assert isinstance(layer["map_area_id"], int), (
                    f"layer[{index}] map_area_id is not an int: "
                    f"{layer.get('map_area_id')!r}; full item={layer!r}"
                )

                assert "parent_layer_id" in layer, (
                    f"layer[{index}] missing parent_layer_id: {layer!r}"
                )
                assert (
                    isinstance(layer["parent_layer_id"], int) or
                    layer["parent_layer_id"] is None
                ), (
                    f"layer[{index}] parent_layer_id is not an int or None: "
                    f"{layer.get('parent_layer_id')!r}; full item={layer!r}"
                )

                assert "name" in layer, (
                    f"layer[{index}] missing name: {layer!r}"
                )
                assert isinstance(layer["name"], str), (
                    f"layer[{index}] name is not a string: "
                    f"{layer.get('name')!r}; full item={layer!r}"
                )

                assert "layer_type" in layer, (
                    f"layer[{index}] missing layer_type: {layer!r}"
                )
                assert isinstance(layer["layer_type"], str), (
                    f"layer[{index}] layer_type is not a string: "
                    f"{layer.get('layer_type')!r}; full item={layer!r}"
                )
                assert (
                    layer["layer_type"] in ["boundary", "annotation", "custom"]
                ), (
                    f"layer[{index}] layer_type is not a valid value: "
                    f"{layer.get('layer_type')!r}; full item={layer!r}"
                )

                assert "visible" in layer, (
                    f"layer[{index}] missing visible: {layer!r}"
                )
                assert isinstance(layer["visible"], int), (
                    f"layer[{index}] visible is not an int: "
                    f"{layer.get('visible')!r}; full item={layer!r}"
                )

                assert "z_index" in layer, (
                    f"layer[{index}] missing z_index: {layer!r}"
                )
                assert isinstance(layer["z_index"], int), (
                    f"layer[{index}] z_index is not an int: "
                    f"{layer.get('z_index')!r}; full item={layer!r}"
                )

                assert "is_editable" in layer, (
                    f"layer[{index}] missing is_editable: {layer!r}"
                )
                assert isinstance(layer["is_editable"], int), (
                    f"layer[{index}] is_editable is not an int: "
                    f"{layer.get('is_editable')!r}; full item={layer!r}"
                )

                assert "config" in layer, (
                    f"layer[{index}] missing config: {layer!r}"
                )
                assert isinstance(layer["config"], str), (
                    f"layer[{index}] config is not a string: "
                    f"{layer.get('config')!r}; full item={layer!r}"
                )

                assert "created_at" in layer, (
                    f"layer[{index}] missing created_at: {layer!r}"
                )
                assert isinstance(layer["created_at"], str), (
                    f"layer[{index}] created_at is not a string: "
                    f"{layer.get('created_at')!r}; full item={layer!r}"
                )

                assert "updated_at" in layer, (
                    f"layer[{index}] missing updated_at: {layer!r}"
                )
                assert isinstance(layer["updated_at"], str), (
                    f"layer[{index}] updated_at is not a string: "
                    f"{layer.get('updated_at')!r}; full item={layer!r}"
                )

        # Check annotations, if any
        annotations = data["annotations"]
        if len(annotations) > 0:
            for index, annotation in enumerate(annotations):
                assert "id" in annotation, (
                    f"annotation[{index}] missing id: {annotation!r}"
                )
                assert isinstance(annotation["id"], int), (
                    f"annotation[{index}] id is not an int: "
                    f"{annotation.get('id')!r}; full item={annotation!r}"
                )

                assert "layer_id" in annotation, (
                    f"annotation[{index}] missing layer_id: {annotation!r}"
                )
                assert isinstance(annotation["layer_id"], int), (
                    f"annotation[{index}] layer_id is not an int: "
                    f"{annotation.get('layer_id')!r}; full item={annotation!r}"
                )

                assert "annotation_type" in annotation, (
                    f"annotation[{index}] missing annotation_type: "
                    f"{annotation!r}"
                )
                assert isinstance(annotation["annotation_type"], str), (
                    f"annotation[{index}] annotation_type is not a string: "
                    f"{annotation.get('annotation_type')!r}; "
                    f"full item={annotation!r}"
                )
                assert (
                    annotation["annotation_type"] in [
                        "marker",
                        "line",
                        "polygon",
                        "text"
                    ]
                ), (
                    f"annotation[{index}] annotation_type not a valid value: "
                    f"{annotation.get('annotation_type')!r}; "
                    f"full item={annotation!r}"
                )

                assert "content" in annotation, (
                    f"annotation[{index}] missing content: {annotation!r}"
                )
                assert (
                    isinstance(annotation["content"], str) or
                    annotation["content"] is None
                ), (
                    f"annotation[{index}] content is not a string: "
                    f"{annotation.get('content')!r}; full item={annotation!r}"
                )

                assert "created_at" in annotation, (
                    f"annotation[{index}] missing created_at: {annotation!r}"
                )
                assert isinstance(annotation["created_at"], str), (
                    f"annotation[{index}] created_at is not a string: "
                    f"{annotation.get('created_at')!r}; "
                    f"full item={annotation!r}"
                )

                assert "updated_at" in annotation, (
                    f"annotation[{index}] missing updated_at: {annotation!r}"
                )
                assert isinstance(annotation["updated_at"], str), (
                    f"annotation[{index}] updated_at is not a string: "
                    f"{annotation.get('updated_at')!r}; "
                    f"full item={annotation!r}"
                )
