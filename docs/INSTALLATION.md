# Printable Maps - Installation Guide

## Required Software

### Backend (Python)

Install the following Python packages:

```bash
pip install -r requirements.txt
```

**Required packages:**
- Flask==3.0.0
- Flask-CORS==4.0.0
- Werkzeug==3.0.1

### Frontend (Node.js)

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

**Key packages:**
- react ^18.2.0
- react-dom ^18.2.0
- react-router-dom ^6.21.0
- react-leaflet ^4.2.1
- leaflet ^1.9.4
- leaflet-draw ^1.0.4
- axios ^1.6.2
- typescript ^5.3.3
- vite ^5.0.8

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
