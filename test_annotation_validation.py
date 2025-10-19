"""
Test annotation validation when layers are deleted.
"""

import sqlite3


def setup_test_db():
    """Create an in-memory database with required tables."""
    conn = sqlite3.connect(':memory:')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""
        CREATE TABLE layers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            map_area_id INTEGER NOT NULL,
            parent_layer_id INTEGER,
            name TEXT NOT NULL,
            layer_type TEXT NOT NULL,
            visible BOOLEAN DEFAULT 1,
            z_index INTEGER DEFAULT 0,
            is_editable BOOLEAN DEFAULT 1,
            config TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE annotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            layer_id INTEGER NOT NULL,
            annotation_type TEXT NOT NULL,
            coordinates TEXT NOT NULL,
            style TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (layer_id) REFERENCES layers(id)
        )
    """)
    
    conn.commit()
    return conn


def test_create_annotation_nonexistent_layer():
    """
    Test that creating an annotation with a nonexistent layer
    raises error.
    """
    from services.annotation_service import AnnotationService
    from models import Annotation
    
    # Mock database
    conn = setup_test_db()
    
    # Monkey patch get_db to use test database
    import database
    original_get_db = database.get_db
    database.get_db = lambda: conn
    
    try:
        service = AnnotationService()
        annotation = Annotation(
            layer_id=999,  # Non-existent layer ID
            annotation_type='marker',
            coordinates=[0, 0],
            style={},
            content='Test'
        )
        
        try:
            service.create_annotation(annotation)
            print("❌ FAIL: Expected ValueError for non-existent layer")
            return False
        except ValueError as e:
            if "does not exist" in str(e):
                print(f"✅ PASS: Got expected error: {e}")
                return True
            else:
                print(f"❌ FAIL: Got unexpected error: {e}")
                return False
    
    finally:
        database.get_db = original_get_db
        conn.close()


def test_create_annotation_readonly_layer():
    """
    Test that creating an annotation on read-only layer raises error.
    """
    from services.annotation_service import AnnotationService
    from models import Annotation
    
    # Mock database
    conn = setup_test_db()
    
    # Create a read-only layer
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO layers (
            map_area_id, name, layer_type, is_editable
        ) VALUES (1, 'ReadOnly', 'annotation', 0)
    """)
    conn.commit()
    layer_id = cursor.lastrowid
    if not layer_id:
        raise ValueError("Failed to create test layer")
    layer_id = int(layer_id)
    
    # Monkey patch get_db to use test database
    import database
    original_get_db = database.get_db
    database.get_db = lambda: conn
    
    try:
        service = AnnotationService()
        annotation = Annotation(
            layer_id=layer_id,
            annotation_type='marker',
            coordinates=[0, 0],
            style={},
            content='Test'
        )
        
        try:
            service.create_annotation(annotation)
            print("❌ FAIL: Expected ValueError for read-only layer")
            return False
        except ValueError as e:
            if "read-only" in str(e):
                print(f"✅ PASS: Got expected error: {e}")
                return True
            else:
                print(f"❌ FAIL: Got unexpected error: {e}")
                return False
    
    finally:
        database.get_db = original_get_db
        conn.close()


def test_create_annotation_valid_layer():
    """
    Test that creating an annotation with a valid editable layer
    succeeds.
    """
    from services.annotation_service import AnnotationService
    from models import Annotation
    
    # Mock database
    conn = setup_test_db()
    
    # Create an editable layer
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO layers (
            map_area_id, name, layer_type, is_editable
        ) VALUES (1, 'Editable', 'annotation', 1)
    """)
    conn.commit()
    layer_id = cursor.lastrowid
    if not layer_id:
        raise ValueError("Failed to create test layer")
    layer_id = int(layer_id)
    
    # Monkey patch get_db to use test database
    import database
    original_get_db = database.get_db
    database.get_db = lambda: conn
    
    try:
        service = AnnotationService()
        annotation = Annotation(
            layer_id=layer_id,
            annotation_type='marker',
            coordinates=[0, 0],
            style={},
            content='Test'
        )
        
        result = service.create_annotation(annotation)
        if result.id:
            print(f"✅ PASS: Annotation created with ID {result.id}")
            return True
        else:
            print("❌ FAIL: Annotation was not assigned an ID")
            return False
    
    except Exception as e:
        print(f"❌ FAIL: Unexpected error: {e}")
        return False
    
    finally:
        database.get_db = original_get_db
        conn.close()


if __name__ == '__main__':
    print("Running annotation validation tests...\n")
    
    results = []
    results.append(test_create_annotation_nonexistent_layer())
    print()
    results.append(test_create_annotation_readonly_layer())
    print()
    results.append(test_create_annotation_valid_layer())
    
    print(f"\n{'='*50}")
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    if all(results):
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!")
