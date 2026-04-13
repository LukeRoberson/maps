# Database Structure

## Overview

The database is implemented as a local SQLite database file, `data/maps.db` by default. The location can be changed in `config.yaml`.

All database related files (python and schema) are in the `api/database/` folder.

When the app starts, it looks for the `data/maps.db` file. If it does not exist, it will be created with the correct schema.

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
</br></br>



#### initialise()

Initialise the schema of a new database.

| Parameter   | Type | Default             | Notes                                    |
| ----------- | ---- | ------------------- | ---------------------------------------- |
| schema_file | str  | database/schema.sql | The schema file to create a new database |

</br></br>



#### create()

Create a new record in the database.

| Parameter   | Type | Default | Notes                                                |
| ----------- | ---- | ------- | ---------------------------------------------------- |
| table       | str  |         | The table to create the record in                    |
| params      | dict | {}      | The column names (key) and entries (value) to create |

</br></br>



#### read()

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



#### update()

Update an existing entry.

| Parameter   | Type | Default | Notes                                                      |
| ----------- | ---- | ------- | ---------------------------------------------------------- |
| table       | str  |         | The table containing the record to be updated              |
| fields      | dict |         | The columns (key) and new entries (value); (SET)           |
| parameters  | dict |         | The columns (key) and values (value) to be updated (WHERE) |

</br></br>



#### delete()

| Parameter   | Type | Default | Notes                                                                  |
| ----------- | ---- | ------- | ---------------------------------------------------------------------- |
| table       | str  |         | The table containing the record to delete                              |
| parameters  | dict |         | Column names (key) and values (value) identifying the record to delete |

</br></br>


---
# Schema

See `api/database/schema.sql` for the schema implementation.
</br></br>



## Tables

Five tables are in use:

| Table       | Description                                                             |
| ----------- | ----------------------------------------------------------------------- |
| projects    | Project information, such as project name, description, etc             |
| map_areas   | Definitions of maps, names, parents, and other details                  |
| boundaries  | Definitions of boundaries that belong to a map. Each map has a boundary |
| layers      | Definitions of layers and the maps they belong to                       |
| annotations | Definitions of annotations, their type, and the layer they belong to    |

</br></br>


Notes:
* The project is the main *container* that everything is stored in.
* A project can contain multiple *region maps*. Each region is at the root of a map hierarchy.
* All maps belong to a project. Maps, other than region maps, all have a parent map.
* Maps have boundaries defined. Child maps are created (approximately) within these boundaries.
* Maps contain *layers*. These are the containers for annotations such as labels, POI, and polygons.
* Maps can have more than one layer, Each of which can be hidden from view.
* Annotations are extra information given to a map.

</br></br>


---
# Workflow Summary

## A new project is created

An entry is created in the `projects` table
* A unique `id` is automatically assigned
* The `created_at` and `updated_at` fields are populated automatically
* The user assigns values for `name` and `description`
* The user defines values for `center_lat`, `center_lon`, and `zoom_level`

The latitude, longitude, and zoom, are all default values for when map areas are defined.
</br></br>


## A New Region is Defined

Each project needs one or more region. These are created as a `map-area` in the database.

A new entry is added to the `map_areas` table.
* The `id` is assigned automatically
* The `project_id` references the `id` of the project (all maps must belong to a project)
* The `parent_id` is set to NULL. This is because the region is at the root of the map hierarchy
* The `name` is set by the user
* The `area_type` will be set to `region`
* The `default_center_lat`, `default_center_lon`, and `default_zoom` are set based on the default values in the project
    * These values can be changed later
* The `created_at` and `updated_at` fields are populated automatically
</br></br>


When a map (a region in this case) is defined, a 'boundary' is created. This defines the map's border.

The boundary needs to belong to a `layer`. Layers contain things like boundaries and annotations. They can be hidden from view, and editied to render differend colours, etc.

The new layer is recorded in the `layers` table.
* The `id`, `created_at`, and `updated_at` are assigned automatically
* The `map_area_id` references a map in the `map_areas` table.
    * This links a layer to a map
    * All layers must belong to a map
* Layers can have a parent layer, which is stored in `parent_layer_id`
    * A boundary layer would typically not have a parent, so this value would be NULL
* The layer name is just a friendly value stored in `name`
* The `layer_type` can be `boundary` or `annotation`
    * Of course, a map's boundary will be the `boundary` type
* A layer will be visible or not visible by default
    * This is stored in the `visible` field, as a boolean value
    * This indicates whether the maps boundary will be shown when the map is rendered on screen
    * This will be set to `true` (or `1`) by default
* As there can be multiple layers, the order in which they are applied will affect how the final rendering looks
    * Each layer has a `z_index`
    * A layer with a z_index of 0 is rendered first, '1' is next, and so on
* The `is_editable` field is a boolean value; It defines if the layer is read only or not
* The `config` field contains optional information on how a layer should be rendered
    * This is stored as a JSON string
    * This can contain `color`, which is a hex value, representing the colour of all lines, polygons, and text within the layer
    * This can contain `line_thickness`, which represents all lines and polygons in the layer

</br></br>


The boundary is a polygon, which contains three or more points. These points are identified as a list/array of coordinates (latitude and longitude).

To record this, a new entry is added to the `boundaries` table.
* The `id`, `created_at`, and `updated_at` are assigned automatically
* The `map_area_id` is a reference to a map area in the `map_areas` table
    * This links the boundary to the map
* The `coordinates` represent the vertices of the polygon.
    * The last vertex links up to the first to make a complete shape
    * This is a list of 2D coordinates, such as ```[[-37.8136, 144.9631], [-37.814, 144.964], [-37.815, 144.962]]```
* The `layer_id` is a reference to an entry in the `layers` table
    * This links the boundary to a specific layer
</br></br>


