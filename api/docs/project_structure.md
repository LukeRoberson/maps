# API Project Structure

This is the file structure of the API (backend) part of the project.

</br></br>


## Folder Layout

```
.
├── backend/                # Backend code, including datamodels and service classes
│   ├── __init__.py
│   ├── app.py                # Flask application entry point
│   ├── config.py             # Configuration settings
│   ├── export.py             # Class for exporting a map to a PNG file
│   ├── annotation.py         # Classes for managing annotations on a map
│   ├── boundary.py           # Classes for managing boundaries on a map
│   ├── layer.py              # Classes for managing layers on a map
│   ├── map.py                # Classes for managing maps
│   ├── project.py            # Classes for managing projects
│   ├── requirements.txt
├── database/               # Database management
│   ├── __init__.py
│   ├── database.py           # Classes for managing the database
│   ├── maps.db               # Database file (excluded from git)
│   └── schema.sql            # Schema file for creating the database
├── docs/                   # Documentation
│   ├── database.md           # Documentation on the database system
│   ├── project_structure.md  # This file
│   └── setup.md              # A simple guide to getting up and running
├── exports/                # Exported map files
└── routes/                 # API endpoints
    ├── __init__.py
    ├── projects.py
    ├── map_areas.py
    ├── boundaries.py
    ├── layers.py
    ├── annotations.py
    └── exports.py

```

</br></br>


## Configuration

Configuration is handled by `backend/config.py`. Its main tasks are:
* To set the Flask secret key (from an environment variable)
* To build the path to the database file
* To set the Flask session type
* To set the folder to export map images to
* To define CORS settings

</br></br>


CORS Origin details are important in development. This is because the API and the frontend run on the same system, just with different ports.

</br></br>


## Project Startup

The entrypoint to the project is in `app.py`. This is responsible for:
* Initializing and managing Flask, including
  * Creating the Flask app
  * Importing Flask blueprints
  * Registering the blueprints
* Configuring logging
* Loading config (from `config.py`)
* Enabling CORS (so the frontend can access the backend on the same machine)
* Initializing the database (see `database/database.py`)

</br></br>


Start the project with:

```bash
.venv/Scripts/Activate
python -m backend.app
```
</br></br>


## Modules

The API project is organised into modules.

| Module   | Description                                   | Doc file      |
| -------- | --------------------------------------------- | ------------- |
| backend  | The main app, components, and data structures | components.md |
| database | The database and related files                | database.md   |
| routes   | The routes that make up the API endpoints     | api.md        |

</br></br>


Each module has an \_\_init__.py file. These just export the classes in the module.
