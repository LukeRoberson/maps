"""
Quick test script to verify default view functionality.
"""

import sys
import json
from models import MapArea
from services import MapAreaService
from database import get_db


def test_default_view() -> None:
    """
    Test creating and updating map areas with default view.
    
    Returns:
        None
    """
    
    print("Testing Default View Feature")
    print("=" * 60)
    
    service = MapAreaService()
    
    # Test 1: Create a map area with default view
    print("\nTest 1: Creating map area with default view...")
    test_map = MapArea(
        project_id=1,
        name="Test Map with Default View",
        area_type="individual",
        default_center_lat=40.7128,
        default_center_lon=-74.0060,
        default_zoom=15
    )
    
    # Note: This will fail if project_id=1 doesn't exist
    # Just testing the model and serialization
    print(f"✓ MapArea created with default view")
    print(f"  Center: {test_map.default_center_lat}, "
          f"{test_map.default_center_lon}")
    print(f"  Zoom: {test_map.default_zoom}")
    
    # Test 2: Serialize to dict
    print("\nTest 2: Serializing to dict...")
    data = test_map.to_dict()
    print(f"✓ Serialized successfully")
    print(f"  Keys: {list(data.keys())}")
    assert 'default_center_lat' in data
    assert 'default_center_lon' in data
    assert 'default_zoom' in data
    print(f"✓ All default view fields present")
    
    # Test 3: Deserialize from dict
    print("\nTest 3: Deserializing from dict...")
    restored = MapArea.from_dict(data)
    print(f"✓ Deserialized successfully")
    assert restored.default_center_lat == test_map.default_center_lat
    assert restored.default_center_lon == test_map.default_center_lon
    assert restored.default_zoom == test_map.default_zoom
    print(f"✓ All default view fields match")
    
    # Test 4: Create without default view (optional fields)
    print("\nTest 4: Creating map area without default view...")
    test_map2 = MapArea(
        project_id=1,
        name="Test Map without Default View",
        area_type="suburb"
    )
    print(f"✓ MapArea created without default view")
    print(f"  default_center_lat: {test_map2.default_center_lat}")
    print(f"  default_center_lon: {test_map2.default_center_lon}")
    print(f"  default_zoom: {test_map2.default_zoom}")
    assert test_map2.default_center_lat is None
    assert test_map2.default_center_lon is None
    assert test_map2.default_zoom is None
    print(f"✓ All default view fields are None")
    
    print("\n" + "=" * 60)
    print("✓ All tests passed!")
    print("\nThe default view feature is working correctly.")
    print("Models can serialize/deserialize the new fields.")


if __name__ == '__main__':
    try:
        test_default_view()
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)

