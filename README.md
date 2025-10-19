# Printable Maps Application

A modern web application for creating, editing, and exporting printable maps with custom boundaries and annotations using OpenStreetMap data.

## Features

- **Hierarchical Project Structure**: Organize maps into Master Maps → Suburbs → Individual Maps
- **Interactive Map Editing**: Draw and edit boundaries directly on the map using Leaflet Draw
- **Multiple Map Layers**: Show/hide OpenStreetMap layers and add custom annotation layers
- **Custom Annotations**: Add markers, lines, polygons, and text annotations to maps
- **Export to PNG**: Export maps as high-quality PNG files with readable street names
- **Modern UI**: Clean, responsive interface built with React and TypeScript
- **RESTful API**: Well-structured Flask backend with full CRUD operations

## Technology Stack

### Backend
- **Python 3.x** with Flask web framework
- **SQLite** for data persistence
- **Flask-CORS** for cross-origin support
- Service-oriented architecture with clean separation of concerns

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Leaflet** and **React-Leaflet** for interactive maps
- **Leaflet Draw** for boundary editing
- **Axios** for API communication
- **Vite** for fast development and optimized builds

### Mapping
- **OpenStreetMap** tile layers
- **Leaflet.js** for map rendering
- GeoJSON support for boundaries

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn package manager

### Backend Setup

1. Create and activate a Python virtual environment (recommended):
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # Linux/Mac
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

1. **Start the Flask backend** (from project root):
   ```bash
   python app.py
   ```
   The API will be available at http://localhost:5000

2. **Start the React frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   The UI will be available at http://localhost:3000

3. Open your browser to http://localhost:3000

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
