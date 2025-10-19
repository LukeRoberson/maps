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


---
# Installation & Setup

See the `backend/docs/setup.md` and `backend/docs/setup.md` for specific details around setting up each environment.


**Step 1: Start the API:**
```bash
python -m backend.app
```


**Step 1: Start the Frontend:**
```bash
cd frontend
npm run dev
```



### Production Build

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Configure production settings**:
   - Set `FLASK_ENV=production` environment variable
   - Set a secure `SECRET_KEY` environment variable
   - Use a WSGI server like Gunicorn

## Project Structure

```
.
├── app.py                    # Flask application entry point
├── config.py                 # Configuration settings
├── requirements.txt          # Python dependencies
├── INSTALLATION.md          # Detailed installation guide
├── models/                   # Data models
│   ├── project.py           # Project model
│   ├── map_area.py          # Map area model
│   ├── boundary.py          # Boundary model
│   ├── layer.py             # Layer model
│   └── annotation.py        # Annotation model
├── services/                 # Business logic layer
│   ├── project_service.py
│   ├── map_area_service.py
│   ├── boundary_service.py
│   ├── layer_service.py
│   ├── annotation_service.py
│   └── export_service.py
├── routes/                   # API endpoints
│   ├── projects.py
│   ├── map_areas.py
│   ├── boundaries.py
│   ├── layers.py
│   ├── annotations.py
│   └── exports.py
├── database/                 # Database management
│   ├── database.py          # SQLite connection & schema
│   └── maps.db              # Database file (auto-created)
└── frontend/                 # React application
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx         # Application entry point
        ├── app.tsx          # Main app component
        ├── types/           # TypeScript type definitions
        ├── services/        # API client
        ├── components/      # Reusable UI components
        ├── pages/           # Page components
        └── styles/          # Global styles
```

## API Endpoints

- **Projects**: `/api/projects` - CRUD operations for projects
- **Map Areas**: `/api/map-areas` - Manage map areas and hierarchy
- **Boundaries**: `/api/boundaries` - Create and update boundaries
- **Layers**: `/api/layers` - Manage map layers
- **Annotations**: `/api/annotations` - Add custom annotations
- **Exports**: `/api/exports` - Export maps as PNG files

## Database Schema

The application uses SQLite with the following tables:
- `projects` - Map projects
- `map_areas` - Hierarchical map subdivisions
- `boundaries` - Geographic boundaries (stored as coordinate arrays)
- `layers` - Map layers (OSM, annotation, custom)
- `annotations` - Custom annotations (markers, lines, polygons, text)

## Usage

1. **Create a Project**: Define a geographic area with center coordinates
2. **Create Master Map**: Set up the top-level map for the project
3. **Add Boundaries**: Draw boundaries to divide maps into suburbs or sections
4. **Create Subdivisions**: Add individual maps within suburbs
5. **Add Annotations**: Place custom markers, lines, or text on maps
6. **Export**: Generate PNG files with readable street names for printing

## Development

- **Code Style**: Follows PEP 8 for Python, TypeScript best practices for frontend
- **Architecture**: Service-oriented backend, component-based frontend
- **Linting**: ESLint for TypeScript, Pylint for Python

See `.github/copilot-instructions.md` for detailed coding conventions.

## License

This project is for educational and personal use.



### Build for Production

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Configure WSGI** for production deployment

## Project Structure

```
.
├── app.py                    # Flask application entry point
├── config.py                 # Configuration settings
├── requirements.txt          # Python dependencies
├── models/                   # Data models
│   ├── __init__.py
│   ├── project.py
│   ├── map_area.py
│   ├── boundary.py
│   ├── layer.py
│   └── annotation.py
├── services/                 # Business logic
│   ├── __init__.py
│   ├── project_service.py
│   ├── map_area_service.py
│   ├── boundary_service.py
│   ├── layer_service.py
│   ├── annotation_service.py
│   └── export_service.py
├── routes/                   # API endpoints
│   ├── __init__.py
│   ├── projects.py
│   ├── map_areas.py
│   ├── boundaries.py
│   ├── layers.py
│   ├── annotations.py
│   └── exports.py
├── database/                 # Database management
│   ├── __init__.py
│   ├── database.py
│   └── maps.db (created automatically)
├── exports/                  # Exported map files (created automatically)
├── uploads/                  # Uploaded files (created automatically)
└── frontend/                 # React application
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── app.tsx
        ├── types/
        ├── services/
        ├── components/
        ├── pages/
        └── styles/
```

## Database

The application uses SQLite for data storage. The database file (`maps.db`) is created automatically in the `database/` directory when you first run the application.

## Next Steps

1. Configure Python virtual environment (recommended)
2. Install Node.js dependencies
3. Install Python dependencies
4. Run the development servers
5. Access the application at http://localhost:3000

For production deployment:
- Set `FLASK_ENV=production`
- Set a secure `SECRET_KEY` environment variable
- Build the frontend with `npm run build`
- Use a WSGI server like Gunicorn
- Consider using a reverse proxy like Nginx
