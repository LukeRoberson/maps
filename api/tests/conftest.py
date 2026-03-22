from pathlib import Path
from typing import Any, Dict, Callable

import pytest
from flask import Flask, jsonify

from backend.config import Config
from backend.export import ExportService
from database import DatabaseContext, DatabaseManager
from routes import (
    annotations_bp,
    boundaries_bp,
    exports_bp,
    layers_bp,
    map_areas_bp,
    projects_bp,
    tiles_bp,
)
import routes.exports as exports_routes


@pytest.fixture
def app(tmp_path: Path) -> Flask:
    db_path = tmp_path / "test.db"
    export_path = tmp_path / "exports"
    export_path.mkdir(parents=True, exist_ok=True)

    schema_path = (
        Path(__file__).resolve().parents[1] / "database" / "schema.sql"
    )

    with DatabaseContext(str(db_path)) as db_ctx:
        db_manager = DatabaseManager(db_ctx)
        db_manager.initialise(schema_file=str(schema_path))

    test_app = Flask(__name__)
    test_app.config.update(
        TESTING=True,
        SECRET_KEY="test-secret-key",
        DATABASE_PATH=str(db_path),
        EXPORT_FOLDER=str(export_path),
        CORS_ORIGINS=Config.CORS_ORIGINS,
        DEFAULT_MAP_LATITUDE=Config.DEFAULT_MAP_LATITUDE,
        DEFAULT_MAP_LONGITUDE=Config.DEFAULT_MAP_LONGITUDE,
        DEFAULT_MAP_ZOOM=Config.DEFAULT_MAP_ZOOM,
    )

    exports_routes.export_service = ExportService(str(export_path))

    test_app.register_blueprint(projects_bp)
    test_app.register_blueprint(map_areas_bp)
    test_app.register_blueprint(boundaries_bp)
    test_app.register_blueprint(layers_bp)
    test_app.register_blueprint(annotations_bp)
    test_app.register_blueprint(exports_bp)
    test_app.register_blueprint(tiles_bp)

    @test_app.route("/health")
    def health_check() -> Any:
        return jsonify({"status": "healthy"})

    @test_app.route("/api/config")
    def get_config() -> Any:
        return jsonify(
            {
                "default_map": {
                    "center_lat": Config.DEFAULT_MAP_LATITUDE,
                    "center_lon": Config.DEFAULT_MAP_LONGITUDE,
                    "zoom_level": Config.DEFAULT_MAP_ZOOM,
                }
            }
        )

    @test_app.route("/")
    def index() -> Any:
        return jsonify(
            {
                "name": "Printable Maps API",
                "version": "1.0.0",
                "endpoints": {
                    "projects": "/api/projects",
                    "map_areas": "/api/map-areas",
                    "boundaries": "/api/boundaries",
                    "layers": "/api/layers",
                    "annotations": "/api/annotations",
                    "exports": "/api/exports",
                },
            }
        )

    return test_app


@pytest.fixture
def client(app: Flask):
    return app.test_client()


@pytest.fixture
def create_project(client) -> Callable[..., Dict[str, Any]]:
    def _create(**overrides: Any) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "name": "Test Project",
            "description": "Created by endpoint test",
            "center_lat": -33.8688,
            "center_lon": 151.2093,
            "zoom_level": 11,
        }
        payload.update(overrides)

        response = client.post("/api/projects", json=payload)
        assert response.status_code == 201, response.get_json()
        body = response.get_json()
        assert isinstance(body, dict)
        return body

    return _create


@pytest.fixture
def create_map_area(client, create_project) -> Callable[..., Dict[str, Any]]:
    def _create(**overrides: Any) -> Dict[str, Any]:
        project = create_project()
        payload: Dict[str, Any] = {
            "project_id": project["id"],
            "name": "Region 1",
            "area_type": "region",
        }
        payload.update(overrides)

        response = client.post("/api/map-areas", json=payload)
        assert response.status_code == 201, response.get_json()
        body = response.get_json()
        assert isinstance(body, dict)
        return body

    return _create


@pytest.fixture
def create_layer(client, create_map_area) -> Callable[..., Dict[str, Any]]:
    def _create(**overrides: Any) -> Dict[str, Any]:
        map_area = create_map_area()
        payload: Dict[str, Any] = {
            "map_area_id": map_area["id"],
            "name": "Annotations",
            "layer_type": "annotation",
            "visible": True,
            "z_index": 1,
        }
        payload.update(overrides)

        response = client.post("/api/layers", json=payload)
        assert response.status_code == 201, response.get_json()
        body = response.get_json()
        assert isinstance(body, dict)
        return body

    return _create
