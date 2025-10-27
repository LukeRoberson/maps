# App Components

## Component Hierarchy

The app consists of hierarchical components.

First, there is a project. Multiple projects can exist, but they are independant of each other.

Projects contain maps. These include:
- A master map
- Suburb maps, within the master map
- Individual maps, within suburbs

Maps contain boundaries. The master map has a boundary defined, and the suburb maps must be within this boundary.

Likewise, suburbs and individual maps also have boundaries.

Maps also contain layers. Layers are for organising annotations. All annotations must belong to a layer.

</br></br>


## Component Files

| Component   | File          |
| ----------- | ------------- |
| Project     | project.py    |
| Maps        | map.py        |
| Boundaries  | boundary.py   |
| Layers      | layer.py      |
| Annotations | annotation.py |

</br></br>


### Data Structures

These files contain data data structures to store information. These effectively mirror tables in the database.

| Class           | Usage                                         |
| --------------- | --------------------------------------------- |
| ProjectModel    | Represents the project                        |
| MapModel        | Represents a map that belongs to a project    |
| BoundaryModel   | Represents a geographical boundary in a map   |
| LayerModel      | A custom layer in a map                       |
| AnnotationModel | Store annotations, and associate with a layer |

</br></br>


These classes all come with `to_dict` and `from_dict` methods to easily convert this data into a dictionary, or from a dictionary to this data structure.

`BoundaryModel` also includes a method to convert data to the GeoJSON format.

</br></br>


#### ProjectModel

| Parameter   | Type     | Description                                            |
| ----------- | -------- | ------------------------------------------------------ |
| name        | str      | The project name, as visible on the projects page      |
| description | str      | The project position                                   |
| center_lat  | float    | Latitude of the centre of the project                  |
| center_lon  | float    | Longitude of the centre of the project                 |
| zoom_level  | int      | The default level of zoom for the project              |
| id          | int      | The ID of the project; Created automatically by SQLite |
| created_at  | datetime | The date and time the project was created              |
| updated_at  | datetime | The date and time the project was last updated         |

</br></br>


When a project is created, a centre point and a zoom level are given.

These define the default latitude and longitude of all other maps created in the project.

</br></br>


#### MapModel

| Parameter          | Type     | Description                                            |
| ------------------ | -------- | ------------------------------------------------------ |
| project_id         | int      | The ID of the project this belongs to                  |
| name               | str      | The name of the map                                    |
| area_type          | str      | The type of map                                        |
| parent_id          | int      | The ID of the parent (if there is one)                 |
| boundary_id        | int      | The ID of a boundary defined on the map                |
| default_center_lat | float    | The latitude of the centre of the map                  |
| default_center_lon | float    | The longitude of the centre of the map                 |
| default_zoom       | int      | The zoom level for the map                             |
| id                 | int      | The ID of the map. Created by SQLite                   |
| created_at         | datetime | The date and time the project was created              |
| updated_at         | datetime | The date and time the project was last updated         |

</br></br>


Maps can be:
* A master map, which is at the root of the project
* A suburb, which is a child of a master map
* An individual map, which is the child of a suburb

A master map has no parent. Other map types will all have a parent ID.

</br></br>


When a map is created, it will inherit the centre position and zoom values.

These will usually be updated with new values as needed.

</br></br>


#### BoundaryModel

| Parameter          | Type        | Description                                            |
| ------------------ | ----------- | ------------------------------------------------------ |
| map_id             | int         | The ID of the map the boundary belongs to              |
| coordinates        | list(float) | A list of coordinates that make up the boundary        |
| id                 | int         | The ID of the map. Created by SQLite                   |
| created_at         | datetime    | The date and time the project was created              |
| updated_at         | datetime    | The date and time the project was last updated         |

</br></br>


Boundaries are made from a variable number of vertices. There must be at least three vertices to make a boundary.

The vertices are stored in the `coordinates` field in order. The line from one vertex to the next forms an *edge*.

</br></br>


#### LayerModel

| Parameter          | Type     | Description                                                   |
| ------------------ | -------- | ------------------------------------------------------------- |
| map_area_id        | int      | The ID of the map the layer belongs to                        |
| name               | str      | The name of the layer                                         |
| layer_type         | str      | The type of layer                                             |
| visible            | bool     | True if the layer (and contents) are visible, False if hidden |
| z_index            | int      | The index of the layer                                        |
| is_editable        | bool     | True if the layer can be edited, False if not                 |
| parent_layer_id    | int      | Used with inherited layers. The ID of the original layer      |
| config             | dict     | Layer specific configuration                                  |
| id                 | int      | The ID of the map. Created by SQLite                          |
| created_at         | datetime | The date and time the project was created                     |
| updated_at         | datetime | The date and time the project was last updated                |

</br></br>


The type of layer is used to determine what will be stored in the layer. Currently, only 'annotation' is used, however more features may be added in the future.

As there can be several layers, there is a `z_index` that defines which layer goes on top of which. This is important if annotations overlap.

Layers that belong to a map are marked as editable. Layers that are inherited are non-editable within that map.

Currently the `config` dict can contain any key-value pairs. The API does not validate the contents, it leaves this up to the frontend.

</br></br>


#### AnnotationModel

| Parameter          | Type     | Description                                            |
| ------------------ | -------- | ------------------------------------------------------ |
| layer_id           | int      | The ID of the layer that the annotation belongs to     |
| annoation_type     | str      | The type of annotation                                 |
| coordinates        | list     | A list of coordinates for the annotation               |
| style              | dict     | Styling information for the annotation                 |
| content            | str      | The text that goes with any of the annotations         |
| id                 | int      | The ID of the map. Created by SQLite                   |
| created_at         | datetime | The date and time the project was created              |
| updated_at         | datetime | The date and time the project was last updated         |

</br></br>


Annotation types can be:
* marker - A POI type marker
* line - A straight line
* polygon - A rectangle or irregular shape (a boundary box)
* text - Standalone text

All annotation types contain a text label.

The `style` dictionary contains an undefined collection of key-value pairs. The front end validates and uses them.

</br></br>


### Service Classes

Each component type contains a *service class*. This is a class that adds CRUD functionality to this component.

The service classes are:
* ProjectService
* MapService
* BoundaryService
* LayerService
* AnnotationService

</br></br>


Each service class contains some standard methods:
* create()
* read()
* update()
* delete()

These methods provide the standard CRUD functionality, which is the main focus of these classes.

These classes have an \_\_init__() method, as well as several helper methods, which are only accessed within the class. The helper methods all start with an underscore.

</br></br>


#### Project Service

| Method | Description                           | Arguments                                                 |
| ------ | ------------------------------------- | --------------------------------------------------------- |
| create | Create a new project                  | `project`: A `ProjectModel` data structure of information |
| read   | Get information about a project       | `project_id`: The ID of a project                         |
| update | Update a project with new information | `project_id`: The ID of a project                         |
|        |                                       | `updates`: A dictionary of updated information            |
| delete | Delete a project                      | `project_id`: The ID of a project                         |

</br></br>


#### Map Service

| Method         | Description                            | Arguments                                                  |
| -------------- | -------------------------------------- | ---------------------------------------------------------- |
| create         | Create a new project                   | `map_area`: A `MapModel` data structure of information     |
| read           | Get information about a project        | `map_id`: The ID of a single map to get                    |
|                |                                        | `project_id`: The ID of a project to list maps for         |
|                |                                        | `parent_id`: The parent map to list child maps for         |
| read_hierarchy | Get the hierarchical structure of maps | `project_id`: The ID of a project to get map hierarchy for |
| update         | Update a project with new information  | `map_area_id`: The ID of the map to update                 |
|                |                                        | `updates`: A dictionary of updated values                  |
| delete         | Delete a project                       | `map_area_id`: The ID of the map to delete                 |

</br></br>


#### Boundary Service

| Method             | Description                                 | Arguments                                                   |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------- |
| is_within_boundary | Find if a coordinate with within a boundary | `coordinates`: A list of coordinates to check               |
|                    |                                             | `parent_boundary` A list of vertices defining the boundary  |
| create             | Create a new annotation                     | `boundary`: A `BoundaryModel` data structure of information |
| read               | Get information about an annotation         | `map_id`: The ID of a map that contains the boundary        |
| update             | Update an annotation with new information   | `boundary_id`: The ID of the boundary to update             |
|                    |                                             | `coordinates`: A list of updated coordinates                |
| delete             | Delete an annotation                        | `boundary_id`: The ID of the boundary to delete             |

</br></br>


#### Layer Service

| Method | Description                           | Arguments                                                |
| ------ | ------------------------------------- | -------------------------------------------------------- |
| create | Create a new layer                    | `layer`: A `LayerModel` data structure of information    |
| read   | Get information about a layer         | `layer_id`: The ID of the layer to get                   |
|        |                                       | `map_id`: The ID of the map to list layers from          |
| update | Update a layer with new information   | `layer_id`: The ID of the layer to update                |
|        |                                       | `updates`: A dictionary of updated information           |
| delete | Delete a layer                        | `layer_id`: The ID of the layer to delete                |

</br></br>


#### Annotation Service

| Method | Description                            | Arguments                                                        |
| ------ | -------------------------------------- | ---------------------------------------------------------------- |
| create | Create a new boundary                  | `annotation`: An `AnnotationModel` data structure of information |
| read   | Get information about a boundary       | `annotation_id`: The ID of an annotation to get                  |
|        |                                        | `layer_id`: The layer to list all annotations from               |
| update | Update a boundary with new information | `annotation_id`: The ID of an annotation to update               |
|        |                                        | `updates`: A dictionary of updated values                        |
| delete | Delete a boundary                      | `annotation_id`: The ID of an annotation to delete               |

</br></br>

