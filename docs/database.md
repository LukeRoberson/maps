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


