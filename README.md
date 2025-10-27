# Printable Maps Application

A modern web application for creating, editing, and exporting printable maps with custom boundaries and annotations using OpenStreetMap data.

</br></br>


## Features

- **Modern UI**: Clean, responsive interface built with React and TypeScript
- **Hierarchical Project Structure**: Define regions → Suburbs → Individual Maps
- **Interactive Map Editing**: Draw and edit boundaries directly on the map in the UI
- **Multiple Map Layers**: Add layers for annotations
- **Annotations**: Add markers, lines, polygons, and text annotations to maps
- **Export to PNG**: Export maps as high-quality PNG files with readable street names
- **RESTful API**: Well-structured Flask backend with full CRUD operations

</br></br>


## Technology Stack

* A RESTful backend API built with Python and Flask
* SQLite for storing persistent data
* React and TypeScript powered frontend UI
* OpenStreetMap for mapping information

</br></br>


## Frontend and Backend

The project consists of a frontend and an API as separate components. They are in separate folders, and each contain a `docs` directory.

The REST API performs CRUD operations on the database on behalf of the frontend. The API runs on port 5000.

The frontend is all the UI components.

</br></br>


The API (backend) is based on Python and Flask.

It is in the `api` folder.

Start the API:

```bash
cd api
.venv/Scripts/activate
python app.py
```

</br></br>


The frontend (UI) is based on React, TypeScript, and Vite. The frontend runs on port 3000

It is in the `frontend` folder.

Start the frontend:

```bash
cd frontend
npm run dev
```

</br></br>
