def test_list_projects_returns_empty_array(client):
    response = client.get("/api/projects")

    assert response.status_code == 200
    assert response.get_json() == {"projects": []}


def test_create_project_requires_name(client):
    response = client.post(
        "/api/projects",
        json={"description": "Missing name field"},
    )

    assert response.status_code == 400
    assert "Missing required field: name" in response.get_json()["error"]


def test_create_and_fetch_project_by_id(client, create_project):
    created = create_project(name="Endpoint Project")

    get_response = client.get(f"/api/projects/{created['id']}")
    payload = get_response.get_json()

    assert get_response.status_code == 200
    assert payload["id"] == created["id"]
    assert payload["name"] == "Endpoint Project"
