def test_list_map_areas_requires_project_id(client):
    response = client.get("/api/map-areas")

    assert response.status_code == 400
    assert response.get_json()["error"] == "project_id parameter required"


def test_create_map_area_requires_fields(client):
    response = client.post(
        "/api/map-areas",
        json={"project_id": 1, "name": "Missing area type"},
    )

    assert response.status_code == 400
    assert "Missing required field: area_type" in response.get_json()["error"]


def test_create_and_list_map_areas(client, create_project):
    project = create_project(name="Map Area Parent Project")

    create_response = client.post(
        "/api/map-areas",
        json={
            "project_id": project["id"],
            "name": "Sydney Region",
            "area_type": "region",
        },
    )
    created = create_response.get_json()

    list_response = client.get(f"/api/map-areas?project_id={project['id']}")
    listed = list_response.get_json()["map_areas"]

    assert create_response.status_code == 201
    assert created["name"] == "Sydney Region"
    assert list_response.status_code == 200
    assert any(area["id"] == created["id"] for area in listed)
