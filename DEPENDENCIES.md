# Installation Summary

## What Needs to Be Installed

### Python Packages (Backend)

Install these packages using pip:

```bash
pip install -r requirements.txt
```

**Required packages:**
1. **Flask==3.0.0** - Web framework for the backend API
2. **Flask-CORS==4.0.0** - Cross-Origin Resource Sharing support for API
3. **Werkzeug==3.0.1** - WSGI utilities (comes with Flask but specified for version control)

### Node.js Packages (Frontend)

Navigate to the `frontend/` directory and run:

```bash
cd frontend
npm install
```

**Core dependencies that will be installed:**

#### React & Core Libraries
- `react@^18.2.0` - React library
- `react-dom@^18.2.0` - React DOM rendering
- `react-router-dom@^6.21.0` - Client-side routing

#### Mapping Libraries
- `leaflet@^1.9.4` - Interactive maps library
- `react-leaflet@^4.2.1` - React components for Leaflet
- `leaflet-draw@^1.0.4` - Drawing tools for Leaflet maps

#### HTTP & API
- `axios@^1.6.2` - HTTP client for API requests

#### TypeScript & Types
- `typescript@^5.3.3` - TypeScript compiler
- `@types/react@^18.2.45` - React type definitions
- `@types/react-dom@^18.2.18` - React DOM type definitions
- `@types/leaflet@^1.9.8` - Leaflet type definitions
- `@types/node@^20.10.0` - Node.js type definitions

#### Build Tools
- `vite@^5.0.8` - Fast build tool and dev server
- `@vitejs/plugin-react@^4.2.1` - Vite plugin for React

#### Development Tools
- `eslint@^8.56.0` - JavaScript/TypeScript linter
- `@typescript-eslint/eslint-plugin@^6.15.0` - TypeScript ESLint rules
- `@typescript-eslint/parser@^6.15.0` - TypeScript parser for ESLint
- `eslint-config-prettier@^9.1.0` - Prettier integration for ESLint
- `eslint-plugin-react@^7.33.2` - React-specific linting rules
- `eslint-plugin-react-hooks@^4.6.0` - React Hooks linting rules
- `prettier@^3.1.1` - Code formatter

## Quick Start Commands

### First-Time Setup

```bash
# Backend setup
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
cd ..
```

### Running the Application

**Terminal 1 - Backend:**
```bash
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Optional: Virtual Environment

It's recommended to use a Python virtual environment:

```bash
# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Then install packages
pip install -r requirements.txt
```

## No Additional Software Required

The application uses:
- **SQLite** (included with Python, no separate installation needed)
- **OpenStreetMap tiles** (accessed via HTTP, no installation needed)

## System Requirements

- **Python**: 3.8 or higher
- **Node.js**: 18 or higher
- **npm**: 9 or higher (comes with Node.js)
- **Operating System**: Windows, Linux, or macOS
- **RAM**: 2GB minimum (4GB recommended)
- **Disk Space**: ~500MB for dependencies

## Verification

After installation, verify everything is working:

```bash
# Check Python packages
pip list | grep Flask

# Check Node packages
cd frontend
npm list --depth=0
```

## Troubleshooting

### If Flask fails to install:
```bash
pip install --upgrade pip
pip install Flask==3.0.0
```

### If npm install fails:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Known npm deprecation warnings (Safe to Ignore):
You may see these deprecation warnings during installation. **These are safe to ignore** and won't affect functionality:
- `inflight@1.0.6` - Used by older dependencies, doesn't affect the app
- `glob@7.2.3` - Used by some dev tools, upgrading would require major changes
- `rimraf@3.0.2` - Dev dependency only, not used in production
- `@humanwhocodes/config-array` and `@humanwhocodes/object-schema` - ESLint dependencies
- `eslint@8.57.1` - Still widely supported, ESLint 9 has breaking changes

These warnings appear because some of your dev tools depend on older versions of packages. Your application will work perfectly fine with these warnings.

**Note:** We use `leaflet-draw` directly instead of `react-leaflet-draw` because the React wrapper requires React 19, while our app uses React 18 for broader compatibility.

### If antivirus blocks esbuild on Windows:
```bash
# Add this folder to your antivirus/Windows Defender exclusions:
# D:\python\maps\frontend\node_modules

# Or install without running postinstall scripts:
npm install --ignore-scripts

# Or run PowerShell as Administrator and try again
```

### Database file location:
The SQLite database will be automatically created at:
`database/maps.db` when you first run the application.

## Next Steps

Once everything is installed:
1. Start both backend and frontend servers
2. Navigate to http://localhost:3000
3. Create your first project
4. Start creating maps!

For detailed usage instructions, see the main README.md file.
