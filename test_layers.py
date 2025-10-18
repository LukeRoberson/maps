"""
Test layer management functionality.

This test verifies that the layer management system is working correctly.
Run with: python test_layers.py
"""

import requests

BASE_URL = 'http://localhost:5000/api'


def test_layer_operations():
    """
    Test layer CRUD operations.
    
    Returns:
        None
    """
    
    print("Testing Layer Management System\n")
    print("=" * 50)
    
    # Note: You'll need to replace these with actual IDs from your database
    # You can get these by creating a project and map area first
    map_area_id = 1
    
    # Test 1: Create a layer
    print("\n1. Creating a new layer...")
    layer_data = {
        'map_area_id': map_area_id,
        'name': 'Test Annotation Layer',
        'layer_type': 'annotation',
        'visible': True,
        'z_index': 0
    }
    
    try:
        response = requests.post(
            f'{BASE_URL}/layers',
            json=layer_data
        )
        
        if response.status_code == 201:
            layer = response.json()
            layer_id = layer['id']
            print(f"✓ Layer created successfully! ID: {layer_id}")
            print(f"  Name: {layer['name']}")
            print(f"  Type: {layer['layer_type']}")
        else:
            print(f"✗ Failed to create layer: {response.text}")
            return
    
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to server. Make sure Flask is running.")
        return
    
    # Test 2: List layers for map area
    print("\n2. Listing layers for map area...")
    response = requests.get(
        f'{BASE_URL}/layers',
        params={'map_area_id': map_area_id}
    )
    
    if response.status_code == 200:
        layers = response.json()['layers']
        print(f"✓ Found {len(layers)} layer(s)")
        for layer in layers:
            print(f"  - {layer['name']} (ID: {layer['id']})")
    else:
        print(f"✗ Failed to list layers: {response.text}")
    
    # Test 3: Get specific layer
    print(f"\n3. Getting layer {layer_id}...")
    response = requests.get(f'{BASE_URL}/layers/{layer_id}')
    
    if response.status_code == 200:
        layer = response.json()
        print("✓ Layer retrieved successfully!")
        print(f"  Name: {layer['name']}")
        print(f"  Visible: {layer['visible']}")
        print(f"  Editable: {layer['is_editable']}")
    else:
        print(f"✗ Failed to get layer: {response.text}")
    
    # Test 4: Update layer
    print(f"\n4. Updating layer {layer_id}...")
    update_data = {
        'name': 'Updated Test Layer',
        'visible': False
    }
    
    response = requests.put(
        f'{BASE_URL}/layers/{layer_id}',
        json=update_data
    )
    
    if response.status_code == 200:
        layer = response.json()
        print("✓ Layer updated successfully!")
        print(f"  New name: {layer['name']}")
        print(f"  Visible: {layer['visible']}")
    else:
        print(f"✗ Failed to update layer: {response.text}")
    
    # Test 5: Delete layer
    print(f"\n5. Deleting layer {layer_id}...")
    response = requests.delete(f'{BASE_URL}/layers/{layer_id}')
    
    if response.status_code == 200:
        print("✓ Layer deleted successfully!")
    else:
        print(f"✗ Failed to delete layer: {response.text}")
    
    # Verify deletion
    print(f"\n6. Verifying deletion...")
    response = requests.get(f'{BASE_URL}/layers/{layer_id}')
    
    if response.status_code == 404:
        print("✓ Layer no longer exists (as expected)")
    else:
        print(f"✗ Layer still exists (unexpected)")
    
    print("\n" + "=" * 50)
    print("Testing complete!\n")


if __name__ == '__main__':
    test_layer_operations()
