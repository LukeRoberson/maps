/*
Database schema for the mapping application.

Tables:
    - projects: Stores project metadata
    - map_areas: Hierarchical areas within projects
    - boundaries: Geographical boundaries for map areas
    - layers: Map layers within areas
    - annotations: Annotations on layers

Indexes:
    - idx_map_areas_project: Index on project_id in map_areas
    - idx_map_areas_parent: Index on parent_id in map_areas
    - idx_boundaries_map_area: Index on map_area_id in boundaries
    - idx_layers_map_area: Index on map_area_id in layers
    - idx_layers_parent: Index on parent_layer_id in layers
    - idx_annotations_layer: Index on layer_id in annotations
*/

-- Project Table
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    center_lat REAL NOT NULL,
    center_lon REAL NOT NULL,
    zoom_level REAL DEFAULT 13,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Map Areas Table
CREATE TABLE IF NOT EXISTS map_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    parent_id INTEGER,
    name TEXT NOT NULL,
    area_type TEXT NOT NULL,
    boundary_id INTEGER,
    default_center_lat REAL,
    default_center_lon REAL,
    default_zoom REAL,
    default_bearing REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES map_areas(id) ON DELETE CASCADE
);

-- Boundaries Table
CREATE TABLE IF NOT EXISTS boundaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    map_area_id INTEGER NOT NULL,
    coordinates TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (map_area_id) REFERENCES map_areas(id) ON DELETE CASCADE
);

-- Layers Table
CREATE TABLE IF NOT EXISTS layers (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (map_area_id)
        REFERENCES map_areas(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_layer_id)
        REFERENCES layers(id) ON DELETE CASCADE
);

-- Annotations Table
CREATE TABLE IF NOT EXISTS annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layer_id INTEGER NOT NULL,
    annotation_type TEXT NOT NULL,
    coordinates TEXT NOT NULL,
    style TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (layer_id) REFERENCES layers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_map_areas_project ON map_areas(project_id);
CREATE INDEX IF NOT EXISTS idx_map_areas_parent ON map_areas(parent_id);
CREATE INDEX IF NOT EXISTS idx_boundaries_map_area ON boundaries(map_area_id);
CREATE INDEX IF NOT EXISTS idx_layers_map_area ON layers(map_area_id);
CREATE INDEX IF NOT EXISTS idx_layers_parent ON layers(parent_layer_id);
CREATE INDEX IF NOT EXISTS idx_annotations_layer ON annotations(layer_id);
