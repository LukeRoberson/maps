def test_create_boundary_requires_coordinates(client):
    response = client.post(
        "/api/boundaries",
        json={"map_area_id": 1},
    )

    assert response.status_code == 400
    assert (
        "Missing required field: coordinates"
        in response.get_json()["error"]
    )


def test_get_boundary_for_missing_map_area_returns_404(client):
    response = client.get("/api/boundaries/map-area/9999")

    assert response.status_code == 404
    assert response.get_json()["error"] == "Boundary not found"


def test_create_and_get_boundary_for_map_area(client, create_map_area):
    map_area = create_map_area()

    create_response = client.post(
        "/api/boundaries",
        json={
            "map_area_id": map_area["id"],
            "coordinates": [
                [-33.8800, 151.2000],
                [-33.8810, 151.2100],
                [-33.8750, 151.2150],
            ],
        },
    )
    created = create_response.get_json()

    get_response = client.get(f"/api/boundaries/map-area/{map_area['id']}")
    fetched = get_response.get_json()

    assert create_response.status_code == 201
    assert created["map_area_id"] == map_area["id"]
    assert get_response.status_code == 200
    assert fetched["id"] == created["id"]
