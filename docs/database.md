# Database Structure

## Overview

The database is implemented as a local SQLite database file, `maps.db`.

All database related files are in the `database/` folder.

When the app starts, it looks for the `maps.db` file. If it does not exist, it will be created with the correct schema.

</br></br>


## File Structure

| File          | Purpose                                                  |
| ------------- | -------------------------------------------------------- |
| \_\_init__.py | Python module file. Exports the database classes         |
| database.py   | Python classes for database management                   |
| maps.db       | The database file                                        |
| schema.sql    | The schema for the database; Used when creating a new DB |

</br></br>


## Python Classes

There are two classes for managing the database. These are defined in `database.py`.

* DatabaseContext
* DatabaseManager

</br></br>


### DatabaseContext

`DatabaseContext` is the context manager for the database.

This is a simple context manager class that opens the database, creates a connection, and closes the connection when done.

</br></br>


### DatabaseManager

The `DatabaseManager` class manages CRUD operations. It is always used within the `DatabaseContext` class.

| Method     | Purpose                               |
| ---------- | ------------------------------------- |
| \_\_init__ | Initialise the class instance         |
| initialise | Initialise a new database (if needed) |
| create     | Create a new record in the database   |
| read       | Read a record                         |
| update     | Update an existing record             |
| delete     | Delete a record                       |

</br></br>


The user does not need to build an SQL query, as the methods in the class will do that.

**initialise()**

Initialise the schema of a new database.

| Parameter   | Type | Default             | Notes                                    |
| ----------- | ---- | ------------------- | ---------------------------------------- |
| schema_file | str  | database/schema.sql | The schema file to create a new database |

</br></br>


**create()**

Create a new record in the database.

| Parameter   | Type | Default | Notes                                                |
| ----------- | ---- | ------- | ---------------------------------------------------- |
| table       | str  |         | The table to create the record in                    |
| params      | dict | {}      | The column names (key) and entries (value) to create |

</br></br>


**read()**

Read one or more entries from the database.

| Parameter   | Type      | Default | Notes                                                    |
| ----------- | --------- | ------- | -------------------------------------------------------- |
| table       | str       |         | The table to read from                                   |
| fields      | list[str] |         | A list of fields to SELECT by (use '*' for all)          |
| params      | dict      | {}      | Columns (key) and entries (value) to filter by (WHERE)   |
| order_by    | list[str] | None    | Optional. A list of fields to ORDER BY                   |
| order_desc  | bool      | False   | Optional. When True, sort in descending order            |
| limit       | int       | None    | Optional. Maximum records to retrieve                    |
| get_all     | bool      | False   | Optional. When True, get all records. Otherwise, get one |

</br></br>


**update()**

Update an existing entry.

| Parameter   | Type | Default | Notes                                                      |
| ----------- | ---- | ------- | ---------------------------------------------------------- |
| table       | str  |         | The table containing the record to be updated              |
| fields      | dict |         | The columns (key) and new entries (value); (SET)           |
| parameters  | dict |         | The columns (key) and values (value) to be updated (WHERE) |

</br></br>


**delete()**

| Parameter   | Type | Default | Notes                                                                  |
| ----------- | ---- | ------- | ---------------------------------------------------------------------- |
| table       | str  |         | The table containing the record to delete                              |
| parameters  | dict |         | Column names (key) and values (value) identifying the record to delete |

</br></br>


---
# Schema

## Tables

Five tables are in use:

| Table       | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| projects    | Project information, such as project name, description, etc          |
| map_areas   | Definitions of maps, names, parents, and other details               |
| boundaries  | Definitions of boundaries that belong to a map                       |
| layers      | Definitions of layers and the maps they belong to                    |
| annotations | Definitions of annotations, their type, and the layer they belong to |

</br></br>


Notes:
* The project is the main *container* that everything is stored in.
* A project can contain multiple *region maps*. Each region is at the root of a map hierarchy.
* Maps belong to a project. Maps, other than region maps, all have a parent map.
* Maps have boundaries defined. Child maps can be created within these boundaries.
* Maps contain *layers*. These the containers for annotations such as labels, POI, and polygons.
* Maps can have more than one layer, and individual layers can be hidden from view.
* Annotations are extra information given to a map. Annotations are stored in a layer.

</br></br>


## Table Relationships Diagram

Below is a text-based diagram showing how the tables are connected via foreign keys:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         [projects]                              │
│                              │                                  │
│                              │ (project_id) FK                  │
│                              ▼                                  │
│                        [map_areas] ◄─────────────┐              │
│                         │    │                   │              │
│         (map_area_id) FK│    │(parent_id) FK     │              │
│                         │    │                   │              │
│            ┌────────────┼────┴──────────┐    (self-ref)         │
│            │            │               │                       │
│            ▼            ▼               ▼                       │
│       [boundaries]  [layers] ◄──────[map_areas]                 │
│                         │                                       │
│            (parent_layer_id) FK                                 │
│                         │                                       │
│                         ▼                                       │
│                    [layers] ◄──────┐                            │
│                         │          │                            │
│                         │      (self-ref)                       │
│            (layer_id) FK│                                       │
│                         ▼                                       │
│                   [annotations]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key:**
- `[table_name]` — Table entity
- `─────►` — Foreign key relationship direction (points to parent)
- `◄──` — Self-referencing relationship
- `FK` — Foreign key column name
- Hierarchical flow: Projects → Map Areas → Layers → Annotations

</br></br>


### Projects

**Columns**

| Name        | Type      | Default      | Constraints | Description                     |
| ----------- | --------- | ------------ | ----------- | ------------------------------- |
| id          | INTEGER   |              |             | Auto-assigned ID of the project |
| name        | TEXT      |              | Not Null    | The project name                |
| description | TEXT      |              |             | The project description         |
| center_lat  | REAL      |              |             | Latitude                        |
| center_lon  | REAL      |              |             | Longitude                       |
| zoom_level  | INTEGER   | 13           |             | Zoom level                      |
| created_at  | TIMESTAMP | Current time |             | Time the project was created    |
| updated_at  | TIMESTAMP | Current time |             | Time the project was updated    |

</br></br>


**Schema**

```sql
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    center_lat REAL NOT NULL,
    center_lon REAL NOT NULL,
    zoom_level INTEGER DEFAULT 13,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

</br></br>


### Map Areas

**Columns**

| Name               | Type      | Default      | Constraints | Description                               |
| ------------------ | --------- | ------------ | ----------- | ----------------------------------------- |
| id                 | INTEGER   |              |             | Auto-assigned ID of the map               |
| project_id         | INTEGER   |              | Not Null    | The project this map belongs to           |
| parent_id          | INTEGER   |              |             | The parent map                            |
| name               | TEXT      |              | Not Null    | The name of the map                       |
| area_type          | TEXT      |              | Not Null    | The map type (region, suburb, individual) |
| boundary_id        | INTEGER   |              |             |                                           |
| default_center_lat | REAL      |              |             | Latitude of the centre of the map         |
| default_center_lon | REAL      |              |             | Longitude of the centre of the map        |
| default_zoom       | INTEGER   |              |             | Default zoom level                        |
| default_bearing    | REAL      | 0            |             | The bearing in degrees (map rotation)     |
| created_at         | TIMESTAMP | Current Time |             | When the map was created                  |
| updated_at         | TIMESTAMP | Current Time |             | When the map was last updated             |

</br></br>


**Foreign Keys**

| Key        | References    | Delete Action |
| ---------- | ------------- | ------------- |
| project_id | projects(id)  | Cascade       |
| parent_id  | map_areas(id) | Cascade       |


</br></br>


**Schema:**

```sql
CREATE TABLE IF NOT EXISTS map_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    parent_id INTEGER,
    name TEXT NOT NULL,
    area_type TEXT NOT NULL,
    boundary_id INTEGER,
    default_center_lat REAL,
    default_center_lon REAL,
    default_zoom INTEGER,
    default_bearing REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES map_areas(id) ON DELETE CASCADE
);
```

</br></br>


### Boundaries

**Columns**

| Name        | Type      | Default      | Constraints | Description                                            |
| ----------- | --------- | ------------ | ----------- | ------------------------------------------------------ |
| id          | INTEGER   |              |             | Auto-assigned ID of the boundary                       |
| map_area_id | INTEGER   |              | Not Null    | The map this boundary belongs to                       |
| coordinates | TEXT      |              | Not Null    | A list of coordinates for the vertices of the boundary |
| created_at  | TIMESTAMP | Current Time |             | The time the boundary was created                      |
| updated_at  | TIMESTAMP | Current Time |             | The time the boundary was updated                      |

</br></br>


**Foreign Keys**

| Key         | References    | Delete Action |
| ----------- | ------------- | ------------- |
| map_area_id | map_areas(id) | Cascade       |

</br></br>


**Schema:**

```sql
CREATE TABLE IF NOT EXISTS boundaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    map_area_id INTEGER NOT NULL,
    coordinates TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (map_area_id) REFERENCES map_areas(id) ON DELETE CASCADE
);
```

</br></br>


### Layers

**Columns**

| Name            | Type      | Default      | Constraints | Description                   |
| --------------- | --------- | ------------ | ----------- | ----------------------------- |
| id              | INTEGER   |              |             | Auto-assigned ID of the layer |
| map_area_id     | INTEGER   |              | Not Null    | Parent map                    |
| parent_layer_id | INTEGER   |              |             | Parent layer                  |
| name            | TEXT      |              | Not Null    | Layer name                    |
| layer_type      | TEXT      |              | Not Null    | 'annotation', etc             |
| visible         | BOOLEAN   | 1            |             | Whether the layer is hidden   |
| z_index         | INTEGER   | 0            |             | Layer hierarchy               |
| is_editable     | BOOLEAN   | 1            |             | Whether a layer can be edited |
| config          | TEXT      |              |             |                               |
| created_at      | TIMESTAMP | Current Time |             | Time the layer was created    |
| updated_at      | TIMESTAMP | Current Time |             | Time the layer was updated    |

</br></br>


**Foreign Keys**

| Key             | References    | Delete Action |
| --------------- | ------------- | ------------- |
| map_area_id     | map_areas(id) | Cascade       |
| parent_layer_id | layers(id)    | Cascade       |

</br></br>


**Schema:**

```sql
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
```

</br></br>


### Annotations

**Columns**

| Name            | Type      | Default      | Constraints | Description                              |
| --------------- | --------- | ------------ | ----------- | ---------------------------------------- |
| id              | INTEGER   |              |             | Auto-assigned ID of the annotation       |
| layer_id        | INTEGER   |              | Not Null    | The layer this annotation belongs to     |
| annotation_type | TEXT      |              | Not Null    | 'text', etc                              |
| coordinates     | TEXT      |              | Not Null    | Coordinates of the annotation            |
| style           | TEXT      |              |             |                                          |
| content         | TEXT      |              |             | The label associated with the annotation |
| created_at      | TIMESTAMP | Current Time |             | Time the annotation was created          |
| updated_at      | TIMESTAMP | Current Time |             | Time the annotation was updated          |

</br></br>


**Foreign Keys**

| Key        | References    | Delete Action |
| ---------- | ------------- | ------------- |
| layer_id   | layers(id)    | Cascade       |

</br></br>


**Schema:**

```sql
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
```

</br></br>


## Indexes

| Index                   | Table       | Key             |
| ----------------------- | ----------- | --------------- |
| idx_map_areas_project   | map_areas   | project _id     |
| idx_map_areas_parent    | map_areas   | parent_id       |
| idx_boundaries_map_area | boundaries  | map_area_id     |
| idx_layers_map_area     | layers      | map_area_id     |
| idx_layers_parent       | layers      | parent_layer_id |
| idx_annotations_layer   | annotations | layer_id        |

</br></br>

---

