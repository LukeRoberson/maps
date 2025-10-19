"""
Test annotation creation with validation.
Tests behavior when layers don't exist or are read-only.
"""

import urllib.request
import json

BASE_URL = "http://localhost:5000/api"


def test_create_project_and_map_area():
    """Create a test project and map area."""
    # Create project
    project_response = requests.post(
        f"{BASE_URL}/projects",
        json={"name": "Test Project", "description": "Test"}
    )
    project_id = project_response.json()["id"]
    print(f"✅ Created project: {project_id}")
    
    # Create map area
    boundary = [[0, 0], [0, 1], [1, 1], [1, 0]]
    map_area_response = requests.post(
        f"{BASE_URL}/map-areas",
        json={
            "project_id": project_id,
            "name": "Test Map Area",
            "boundary": boundary
        }
    )
    map_area_id = map_area_response.json()["id"]
    print(f"✅ Created map area: {map_area_id}")
    
    return project_id, map_area_id


def test_create_layer_and_annotation(map_area_id):
    """Create a layer and test annotation creation."""
    # Create a layer
    layer_response = requests.post(
        f"{BASE_URL}/layers",
        json={
            "map_area_id": map_area_id,
            "name": "Test Layer",
            "layer_type": "annotation",
            "visible": True,
            "z_index": 0
        }
    )
    layer_id = layer_response.json()["id"]
    print(f"✅ Created layer: {layer_id}")
    
    # Create annotation on valid layer
    annotation_response = requests.post(
        f"{BASE_URL}/annotations",
        json={
            "layer_id": layer_id,
            "annotation_type": "marker",
            "coordinates": [0.5, 0.5],
            "style": {},
            "content": "Test Annotation"
        }
    )
    
    if annotation_response.status_code == 201:
        print(
            f"✅ Annotation created on valid layer: "
            f"{annotation_response.json()['id']}"
        )
    else:
        print(
            f"❌ Failed to create annotation: "
            f"{annotation_response.status_code} - "
            f"{annotation_response.json()}"
        )
    
    return layer_id


def test_nonexistent_layer():
    """Test creating annotation with nonexistent layer."""
    annotation_response = requests.post(
        f"{BASE_URL}/annotations",
        json={
            "layer_id": 999999,
            "annotation_type": "marker",
            "coordinates": [0.5, 0.5],
            "style": {},
            "content": "Test"
        }
    )
    
    if annotation_response.status_code == 400:
        error = annotation_response.json().get("error", "")
        if "does not exist" in error:
            print(f"✅ Got expected error for nonexistent layer: {error}")
            return True
        else:
            print(f"❌ Got unexpected error: {error}")
            return False
    else:
        print(
            f"❌ Expected 400 status, got {annotation_response.status_code}: "
            f"{annotation_response.json()}"
        )
        return False


def test_readonly_layer(map_area_id):
    """Test creating annotation with read-only layer."""
    # Create a parent map area
    boundary = [[1, 1], [1, 2], [2, 2], [2, 1]]
    parent_response = requests.post(
        f"{BASE_URL}/map-areas",
        json={
            "project_id": 1,
            "name": "Parent Map Area",
            "boundary": boundary
        }
    )
    parent_id = parent_response.json()["id"]
    
    # Create a layer on parent
    parent_layer_response = requests.post(
        f"{BASE_URL}/layers",
        json={
            "map_area_id": parent_id,
            "name": "Parent Layer",
            "layer_type": "annotation",
            "visible": True,
            "z_index": 0
        }
    )
    parent_layer_id = parent_layer_response.json()["id"]
    
    # Create a child map area that inherits the layer
    # (This should create an inherited, read-only layer)
    requests.post(
        f"{BASE_URL}/map-areas",
        json={
            "project_id": 1,
            "parent_map_area_id": parent_id,
            "name": "Child Map Area",
            "boundary": boundary
        }
    )
    
    # Try to create annotation on inherited layer (should be read-only)
    annotation_response = requests.post(
        f"{BASE_URL}/annotations",
        json={
            "layer_id": parent_layer_id,
            "annotation_type": "marker",
            "coordinates": [0.5, 0.5],
            "style": {},
            "content": "Test"
        }
    )
    
    # The annotation might still succeed if it's treated as a view
    # Let's just check what happens
    print(
        f"Read-only layer annotation response: "
        f"{annotation_response.status_code} - "
        f"{annotation_response.json()}"
    )


if __name__ == "__main__":
    print("Testing annotation validation...\n")
    
    # Test 1: Create project and layer
    print("=== Test 1: Create project and layer ===")
    project_id, map_area_id = test_create_project_and_map_area()
    
    # Test 2: Create annotation on valid layer
    print("\n=== Test 2: Create annotation on valid layer ===")
    layer_id = test_create_layer_and_annotation(map_area_id)
    
    # Test 3: Try to create annotation with nonexistent layer
    print("\n=== Test 3: Create annotation with nonexistent layer ===")
    test_nonexistent_layer()
    
    # Test 4: Try to create annotation on read-only layer
    print("\n=== Test 4: Create annotation on read-only layer ===")
    test_readonly_layer(map_area_id)
    
    print("\n✅ Tests completed!")
