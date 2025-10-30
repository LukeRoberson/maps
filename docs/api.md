# API

## Overview
The API is created as a collection of routes served by Flask.

Routes are collected into *blueprints*, which are registered in the Flask app in `app.py`.

For the most part, the API follows a CRUD-like approach, to create, read, update, and delete components.

</br></br>


## Endpoint Summary

| Endpoint                   | Method | Description                    |
| -------------------------- | ------ | ------------------------------ |
| /api/projects              | GET    | List all projects              |
| /api/projects              | POST   | Create a new project           |
| /api/projects/<project_id> | GET    | Get a specific project details |
| /api/projects/<project_id> | PUT    | Update a project               |
| /api/projects/<project_id> | DELETE | Delete a project               |

</br></br>


| Endpoint                   | Method | Description                    |
| -------------------------- | ------ | ------------------------------ |
| /api/map_areas             | GET    | List maps                      |
| /api/map_areas             | POST   | Create a map                   |
| /api/map_areas/hierarchy   | GET    | Get the map hierarchy          |
| /api/map_areas/<map_id>    | GET    | Get a specific map             |
| /api/map_areas/<map_id>    | PUT    | Update a map                   |
| /api/map_areas/<map_id>    | DELETE | Delete a map                   |
 
</br></br>


| Endpoint                     | Method | Description                  |
| ---------------------------- | ------ | ---------------------------- |
| /api/boundaries              | POST   | Create a boundary            |
| /api/boundaries<map_id>      | GET    | Get a boundary on a map      |
| /api/boundaries<boundary_id> | PUT    | Update a boundary            |
| /api/boundaries<boundary_id> | DELETE | Delete a boundary            |

</br></br>


| Endpoint                     | Method | Description                  |
| ---------------------------- | ------ | ---------------------------- |
| /api/layers/<map_id>         | GET    | List layers on a map         |
| /api/layers                  | POST   | Create a new layer           |
| /api/layers/<layer_id>       | GET    | Get a layer                  |
| /api/layers/<layer_id>       | PUT    | Update a layer               |
| /api/layers/<layer_id>       | DELETE | Delete a layer               |

</br></br>


| Endpoint                         | Method | Description                  |
| -------------------------------- | ------ | ---------------------------- |
| /api/annotations/<layer_id>      | GET    | List annotations on a layer  |
| /api/annotations                 | POST   | Create a new annotation      |
| /api/annotations/<annotation_id> | GET    | Get an annotation            |
| /api/annotations/<annotation_id> | PUT    | Update an annotation         |
| /api/annotations/<annotation_id> | DELETE | Delete an annotation         |

</br></br>


| Endpoint                         | Method | Description                  |
| -------------------------------- | ------ | ---------------------------- |
| /api/exports                     | POST   | Export a map to PNG          |
| /api/exports/<filename>          | GET    | Download a PNG               |

</br></br>


## Security

There is no explicit security on the API at this time.

</br></br>


## Blueprints

There are five blueprints defined, which group the routes into their main components:
* projects_bp
* map_areas_bp
* boundaries_bp
* layers_bp
* annotations_bp

</br></br>


## Default Responses

Unless otherwise stated, all routes return a flask `Response` object. These usually contain JSON data.

Much of the information returned as JSON data comes from the various 'model' data structures (see components.md):
* ProjectModel
* MapModel
* BoundaryModel
* LayerModel
* AnnotationModel

</br></br>


Error responses accompany a `500 Internal Server Error` response. These usually occur when an exception was raised when collecting information.

Error responses are in a JSON structure in this format:

```json
{
    "error": "error message"
}
```

</br></br>


---
# Endpoints

## Projects

**Base URL**: /api/projects

</br></br>


### `list_projects`

Returns a list of all projects.
</br></br>

**URL**: /api/projects/
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `500 Internal Server Error` if there was a problem getting the list

</br></br>

**Return Data**:
A list of dictionaries, with each dictionary containing project information in `ProjectModel` format.

```json
{
    "projects": [
        project_1,
        project_2,
        ...
    ]
}
```

</br></br>


### `create_project`

Create a new project in the database.
</br></br>

**URL**: /api/projects/
</br></br>

**Method**: POST
</br></br>

**Request Body**
The body of the post message needs to contain a JSON structure with project information.

```json
{
    "name": "Project Name",
    "description": "description",
    "center_lat": 37.7749,
    "center_lon": -122.4194,
    "zoom_level": 13
}
```

Mandatory fields:
* name
* center_lat
* center_lon
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `201 Created` if a new project was successfully created
* `400 Bad Request` if project information was not included in the request
* `500 Internal Server Error` if there was a problem getting the list

</br></br>

**Return Data**:
When successful, the created project is returned as a JSON representation of a `ProjectModel` object.

```json
{
    "id": 1,
    "name": "project name",
    "description": "optional description",
    "center_lat": 37.7749,
    "center_lon": -122.4194,
    "zoom_level": 13,
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>


### `get_project`

Get a project by its ID. The ID of the project is passed in the URL, and accessed with the `project_id` variable.
</br></br>

**URL**: /api/projects/<int:project_id>
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the project doesn't exist
* `500 Internal Server Error` if there was a problem getting the list

</br></br>

**Return Data**:
When successful, the created project is returned as a JSON representation of a `ProjectModel` object.

```json
{
    "id": 1,
    "name": "project name",
    "description": "optional description",
    "center_lat": 37.7749,
    "center_lon": -122.4194,
    "zoom_level": 13,
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>


### `update_project`

Update a project. The ID of the project is passed in the URL, and accessed with the `project_id` variable.
</br></br>

**URL**: /api/projects/<int:project_id>
</br></br>

**Method**: PUT
</br></br>

**Request Body**
The body of the post message needs to contain a JSON structure with project information.

```json
{
    "name": "Project Name",
    "description": "description",
    "center_lat": 37.7749,
    "center_lon": -122.4194,
    "zoom_level": 13
}
```

Mandatory fields:
* name
* center_lat
* center_lon

</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if there was no project to update
* `500 Internal Server Error` if there was a problem getting the list

</br></br>

**Return Data**:
When successful, the created project is returned as a JSON representation of a `ProjectModel` object.

```json
{
    "id": 1,
    "name": "project name",
    "description": "optional description",
    "center_lat": 37.7749,
    "center_lon": -122.4194,
    "zoom_level": 13,
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>


### `delete_project`

Delete a project. The ID of the project is passed in the URL, and accessed with the `project_id` variable.
</br></br>

**URL**: /api/projects/<int:project_id>
</br></br>

**Method**: DELETE
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if there was no project found to delete
* `500 Internal Server Error` if there was a problem getting the list

</br></br>

**Return Data**:
This simply returns a success message.

```json
{
    "message": "Project deleted successfully"
}
```

</br></br>


## Maps

**Base URL**: /api/map_areas

</br></br>

### `list_map_areas`

Returns a list of all map areas.
</br></br>

**URL**: /api/map_areas/
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `500 Internal Server Error` if there was a problem getting the list

</br></br>

**Return Data**:
A list of dictionaries, each containing map area information in `MapModel` format.

```json
{
    "map_areas": [
        map_area_1,
        map_area_2,
        ...
    ]
}
```

</br></br>

### `get_hierarchy`

Returns the hierarchy of map areas for a given project.
</br></br>

**URL**: /api/map_areas/hierarchy/<int:project_id>
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the project doesn't exist
* `500 Internal Server Error` if there was a problem getting the hierarchy

</br></br>

**Return Data**:
A nested structure representing the hierarchy of map areas.

```json
{
    "hierarchy": {
        "region_map": { ... },
        "suburb_maps": [ ... ],
        "smaller_maps": [ ... ]
    }
}
```

</br></br>

### `create_map_area`

Create a new map area under a project or parent map area.
</br></br>

**URL**: /api/map_areas/
</br></br>

**Method**: POST
</br></br>

**Request Body**
JSON structure with map area information.

```json
{
    "project_id": 1,
    "parent_map_area_id": 2,
    "name": "Map Area Name",
    "description": "description",
    "center_lat": 37.7749,
    "center_lon": -122.4194,
    "zoom_level": 13
}
```

Mandatory fields:
* project_id
* name
* center_lat
* center_lon

</br></br>

**Return Codes**:
* `201 Created` if a new map area was successfully created
* `400 Bad Request` if required information was missing
* `500 Internal Server Error` if there was a problem creating the map area

</br></br>

**Return Data**:
Created map area as a JSON representation of a `MapModel` object.

```json
{
    "id": 1,
    "project_id": 1,
    "parent_map_area_id": 2,
    "name": "Map Area Name",
    "description": "description",
    "center_lat": 37.7749,
    "center_lon": -122.4194,
    "zoom_level": 13,
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `get_map_area`

Get a map area by its ID.
</br></br>

**URL**: /api/map_areas/<int:map_area_id>
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the map area doesn't exist
* `500 Internal Server Error` if there was a problem getting the map area

</br></br>

**Return Data**:
Map area as a JSON representation of a `MapModel` object.

```json
{
    "id": 1,
    "project_id": 1,
    "parent_map_area_id": 2,
    "name": "Map Area Name",
    "description": "description",
    "center_lat": 37.7749,
    "center_lon": -122.4194,
    "zoom_level": 13,
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `update_map_area`

Update a map area by its ID.
</br></br>

**URL**: /api/map_areas/<int:map_area_id>
</br></br>

**Method**: PUT
</br></br>

**Request Body**
JSON structure with updated map area information.

```json
{
    "name": "Updated Name",
    "description": "Updated description",
    "center_lat": 37.7749,
    "center_lon": -122.4194,
    "zoom_level": 14
}
```

Mandatory fields:
* name
* center_lat
* center_lon

</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the map area doesn't exist
* `500 Internal Server Error` if there was a problem updating the map area

</br></br>

**Return Data**:
Updated map area as a JSON representation of a `MapModel` object.

```json
{
    "id": 1,
    "project_id": 1,
    "parent_map_area_id": 2,
    "name": "Updated Name",
    "description": "Updated description",
    "center_lat": 37.7749,
    "center_lon": -122.4194,
    "zoom_level": 14,
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `delete_map_area`

Delete a map area by its ID.
</br></br>

**URL**: /api/map_areas/<int:map_area_id>
</br></br>

**Method**: DELETE
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the map area doesn't exist
* `500 Internal Server Error` if there was a problem deleting the map area

</br></br>

**Return Data**:
Success message.

```json
{
    "message": "Map area deleted successfully"
}
```

</br></br>

## Boundaries

**Base URL**: /api/boundaries

</br></br>

### `create_boundary`

Create a new boundary for a map area.
</br></br>

**URL**: /api/boundaries/
</br></br>

**Method**: POST
</br></br>

**Request Body**
JSON structure with boundary information.

```json
{
    "map_area_id": 1,
    "coordinates": [
        [lat1, lon1],
        [lat2, lon2],
        ...
    ]
}
```

Mandatory fields:
* map_area_id
* coordinates

</br></br>

**Return Codes**:
* `201 Created` if a new boundary was successfully created
* `400 Bad Request` if required information was missing
* `500 Internal Server Error` if there was a problem creating the boundary

</br></br>

**Return Data**:
Created boundary as a JSON representation of a `BoundaryModel` object.

```json
{
    "id": 1,
    "map_area_id": 1,
    "coordinates": [
        [lat1, lon1],
        [lat2, lon2]
    ],
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `get_boundary_by_map_area`

Get the boundary for a specific map area.
</br></br>

**URL**: /api/boundaries/<int:map_area_id>
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the boundary doesn't exist
* `500 Internal Server Error` if there was a problem getting the boundary

</br></br>

**Return Data**:
Boundary as a JSON representation of a `BoundaryModel` object.

```json
{
    "id": 1,
    "map_area_id": 1,
    "coordinates": [
        [lat1, lon1],
        [lat2, lon2]
    ],
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `update_boundary`

Update a boundary by its ID.
</br></br>

**URL**: /api/boundaries/<int:boundary_id>
</br></br>

**Method**: PUT
</br></br>

**Request Body**
JSON structure with updated boundary information.

```json
{
    "coordinates": [
        [lat1, lon1],
        [lat2, lon2]
    ]
}
```

Mandatory fields:
* coordinates

</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the boundary doesn't exist
* `500 Internal Server Error` if there was a problem updating the boundary

</br></br>

**Return Data**:
Updated boundary as a JSON representation of a `BoundaryModel` object.

```json
{
    "id": 1,
    "map_area_id": 1,
    "coordinates": [
        [lat1, lon1],
        [lat2, lon2]
    ],
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `delete_boundary`

Delete a boundary by its ID.
</br></br>

**URL**: /api/boundaries/<int:boundary_id>
</br></br>

**Method**: DELETE
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the boundary doesn't exist
* `500 Internal Server Error` if there was a problem deleting the boundary

</br></br>

**Return Data**:
Success message.

```json
{
    "message": "Boundary deleted successfully"
}
```

</br></br>

## Layers

**Base URL**: /api/layers

</br></br>

### `list_layers`

Returns a list of all layers for a map area.
</br></br>

**URL**: /api/layers/<int:map_area_id>
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `500 Internal Server Error` if there was a problem getting the layers

</br></br>

**Return Data**:
A list of dictionaries, each containing layer information in `LayerModel` format.

```json
{
    "layers": [
        layer_1,
        layer_2,
        ...
    ]
}
```

</br></br>

### `create_layer`

Create a new layer for a map area.
</br></br>

**URL**: /api/layers/
</br></br>

**Method**: POST
</br></br>

**Request Body**
JSON structure with layer information.

```json
{
    "map_area_id": 1,
    "name": "Layer Name",
    "description": "description"
}
```

Mandatory fields:
* map_area_id
* name

</br></br>

**Return Codes**:
* `201 Created` if a new layer was successfully created
* `400 Bad Request` if required information was missing
* `500 Internal Server Error` if there was a problem creating the layer

</br></br>

**Return Data**:
Created layer as a JSON representation of a `LayerModel` object.

```json
{
    "id": 1,
    "map_area_id": 1,
    "name": "Layer Name",
    "description": "description",
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `get_layer`

Get a layer by its ID.
</br></br>

**URL**: /api/layers/<int:layer_id>
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the layer doesn't exist
* `500 Internal Server Error` if there was a problem getting the layer

</br></br>

**Return Data**:
Layer as a JSON representation of a `LayerModel` object.

```json
{
    "id": 1,
    "map_area_id": 1,
    "name": "Layer Name",
    "description": "description",
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `update_layer`

Update a layer by its ID.
</br></br>

**URL**: /api/layers/<int:layer_id>
</br></br>

**Method**: PUT
</br></br>

**Request Body**
JSON structure with updated layer information.

```json
{
    "name": "Updated Layer Name",
    "description": "Updated description"
}
```

Mandatory fields:
* name

</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the layer doesn't exist
* `500 Internal Server Error` if there was a problem updating the layer

</br></br>

**Return Data**:
Updated layer as a JSON representation of a `LayerModel` object.

```json
{
    "id": 1,
    "map_area_id": 1,
    "name": "Updated Layer Name",
    "description": "Updated description",
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `delete_layer`

Delete a layer by its ID.
</br></br>

**URL**: /api/layers/<int:layer_id>
</br></br>

**Method**: DELETE
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the layer doesn't exist
* `500 Internal Server Error` if there was a problem deleting the layer

</br></br>

**Return Data**:
Success message.

```json
{
    "message": "Layer deleted successfully"
}
```

</br></br>

## Annotations

**Base URL**: /api/annotations

</br></br>

### `list_annotations`

Returns a list of all annotations for a layer.
</br></br>

**URL**: /api/annotations/<int:layer_id>
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `500 Internal Server Error` if there was a problem getting the annotations

</br></br>

**Return Data**:
A list of dictionaries, each containing annotation information in `AnnotationModel` format.

```json
{
    "annotations": [
        annotation_1,
        annotation_2,
        ...
    ]
}
```

</br></br>

### `create_annotation`

Create a new annotation for a layer.
</br></br>

**URL**: /api/annotations/
</br></br>

**Method**: POST
</br></br>

**Request Body**
JSON structure with annotation information.

```json
{
    "layer_id": 1,
    "type": "text",
    "content": "Annotation content",
    "position": [lat, lon]
}
```

Mandatory fields:
* layer_id
* type
* content
* position

</br></br>

**Return Codes**:
* `201 Created` if a new annotation was successfully created
* `400 Bad Request` if required information was missing
* `500 Internal Server Error` if there was a problem creating the annotation

</br></br>

**Return Data**:
Created annotation as a JSON representation of an `AnnotationModel` object.

```json
{
    "id": 1,
    "layer_id": 1,
    "type": "text",
    "content": "Annotation content",
    "position": [lat, lon],
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `get_annotation`

Get an annotation by its ID.
</br></br>

**URL**: /api/annotations/<int:annotation_id>
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the annotation doesn't exist
* `500 Internal Server Error` if there was a problem getting the annotation

</br></br>

**Return Data**:
Annotation as a JSON representation of an `AnnotationModel` object.

```json
{
    "id": 1,
    "layer_id": 1,
    "type": "text",
    "content": "Annotation content",
    "position": [lat, lon],
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `update_annotation`

Update an annotation by its ID.
</br></br>

**URL**: /api/annotations/<int:annotation_id>
</br></br>

**Method**: PUT
</br></br>

**Request Body**
JSON structure with updated annotation information.

```json
{
    "type": "text",
    "content": "Updated annotation content",
    "position": [lat, lon]
}
```

Mandatory fields:
* type
* content
* position

</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the annotation doesn't exist
* `500 Internal Server Error` if there was a problem updating the annotation

</br></br>

**Return Data**:
Updated annotation as a JSON representation of an `AnnotationModel` object.

```json
{
    "id": 1,
    "layer_id": 1,
    "type": "text",
    "content": "Updated annotation content",
    "position": [lat, lon],
    "created_at": datestamp,
    "updated_at": datestamp
}
```

</br></br>

### `delete_annotation`

Delete an annotation by its ID.
</br></br>

**URL**: /api/annotations/<int:annotation_id>
</br></br>

**Method**: DELETE
</br></br>

**Return Codes**:
* `200 OK` if the operation was fine
* `404 Not Found` if the annotation doesn't exist
* `500 Internal Server Error` if there was a problem deleting the annotation

</br></br>

**Return Data**:
Success message.

```json
{
    "message": "Annotation deleted successfully"
}
```

</br></br>



## Exports

**Base URL**: /api/exports

</br></br>


### `export_map`

Export a map to a PNG
</br></br>

**URL**: /api/exports/
</br></br>

**Method**: POST
</br></br>

**Request Body**
JSON structure with boundary information.

```json
{
    "map_area_id": 1,
    "image_data": "xxx"
}
```

Mandatory fields:
* map_area_id
* image_data

</br></br>

**Return Codes**:
* `201 Created` if the file exported successfully
* `400 Bad Request` if required information was missing
* `500 Internal Server Error` if there was a problem exporting the image

</br></br>

**Return Data**:
File details in JSON format.

```json
{
    "filename": "file.png",
    "size": 123
}
```

</br></br>


### `download_export`

Download an exported map file
</br></br>

**URL**: /api/exports/<filename>
</br></br>

**Method**: GET
</br></br>

**Return Codes**:
* `200 OK` If the file is available
* `404 Not Found` if the file does not exist
* `500 Internal Server Error` if there was a problem downloading the file

</br></br>

**Return Data**:
File data wrapped in a Flask Response object.

</br></br>
