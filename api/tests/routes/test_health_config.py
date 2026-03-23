"""
Module: test_health_config.py

Unit tests for health and configuration-related API endpoints.

Endpoints Tested:
    - /api/health
    - /api/config

Classes:
    TestHealthConfig
        Tests for the health and config endpoints.
"""


import requests

BASE_URL = "http://localhost:5000"
API_PREFIX = "/api"


class TestHealthConfig:
    """
    Tests for the health and config endpoints.

    Methods:
        test_health
            Test the /api/health endpoint.
        test_config
            Test the /api/config endpoint.
    """

    def test_health(self):
        """
        Test the /api/health endpoint.

        Test:
            - Endpoint returns status code 200
            - Response contains a status field with value "healthy"
        """

        # Send a GET request to the health endpoint
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()

        # Confirm health status is present and correct
        assert "status" in data
        assert data["status"] == "healthy"

    def test_config(self):
        """
        Test the /api/config endpoint.

        Test:
            - Endpoint returns status code 200
            - Response contains a version field with a string value
        """

        # Send a GET request to the config endpoint
        response = requests.get(f"{BASE_URL}{API_PREFIX}/config")
        assert response.status_code == 200
        data = response.json()

        # Confirm config structure is present and correct
        assert "default_map" in data
        assert len(data["default_map"]) > 0

        default_map = data["default_map"]
        assert "center_lat" in default_map
        assert isinstance(default_map["center_lat"], (int, float)), (
            f"default_map center_lat is not a number: "
            f"{default_map.get('center_lat')!r}; full item={default_map!r}"
        )

        assert "center_lon" in default_map
        assert isinstance(default_map["center_lon"], (int, float)), (
            f"default_map center_lon is not a number: "
            f"{default_map.get('center_lon')!r}; full item={default_map!r}"
        )

        assert "zoom_level" in default_map
        assert isinstance(default_map["zoom_level"], (int, float)), (
            f"default_map zoom_level is not a number: "
            f"{default_map.get('zoom_level')!r}; full item={default_map!r}"
        )
