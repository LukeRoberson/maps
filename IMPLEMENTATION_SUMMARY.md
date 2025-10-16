# Default View Feature - Implementation Summary

## Changes Made

### 1. Database Schema (`database/database.py`)
- Added three new columns to the `map_areas` table:
  - `default_center_lat REAL` - Stores the default map center latitude
  - `default_center_lon REAL` - Stores the default map center longitude
  - `default_zoom INTEGER` - Stores the default zoom level

### 2. MapArea Model (`models/map_area.py`)
- Added three new optional attributes:
  - `default_center_lat: Optional[float]`
  - `default_center_lon: Optional[float]`
  - `default_zoom: Optional[int]`
- Updated `__init__()` method to accept these parameters
- Updated `to_dict()` to include these fields in serialization
- Updated `from_dict()` to deserialize these fields

### 3. MapArea Service (`services/map_area_service.py`)
- Updated `create_map_area()` to include default view fields in INSERT
- Updated `get_map_area()` to retrieve default view fields
- Updated `list_map_areas()` to retrieve default view fields
- Updated `update_map_area()` to allow updating default view fields
  - Added to allowed_fields: `default_center_lat`, `default_center_lon`, `default_zoom`

### 4. Frontend Types (`frontend/src/types/index.ts`)
- Added three new optional properties to MapArea interface:
  - `default_center_lat?: number`
  - `default_center_lon?: number`
  - `default_zoom?: number`

### 5. Map Editor Component (`frontend/src/pages/map-editor.tsx`)
- Added `MapViewController` component to capture the Leaflet map instance
- Added `mapInstance` state to store the map reference
- Added `handleSetDefaultView()` function to save current view as default
- Added "Set Default View" button to the editor actions
- Updated MapContainer to use default view if set, otherwise fall back to project defaults:
  ```tsx
  center={[
    mapArea.default_center_lat ?? project.center_lat,
    mapArea.default_center_lon ?? project.center_lon,
  ]}
  zoom={mapArea.default_zoom ?? project.zoom_level}
  ```
- Added status indicator showing when a default view is set

### 6. Migration Script (`migrate_add_default_view.py`)
- Created migration script to add new columns to existing databases
- Safe to run multiple times (checks if columns already exist)
- Provides clear status messages

### 7. Documentation
- Created `FEATURE_DEFAULT_VIEW.md` with user documentation
- Created this summary document

## How It Works

1. **User Action**: User pans and zooms to desired view, clicks "Set Default View"
2. **Frontend**: Captures current map center and zoom from Leaflet map instance
3. **API Call**: Sends PUT request to `/api/map-areas/{id}` with new values
4. **Backend**: Updates the map_area record with the new default view settings
5. **Next Load**: When the map is opened, it uses the saved default view instead of project defaults

## Testing Checklist

- [ ] Open a map and set a default view
- [ ] Verify the status indicator appears showing default view is set
- [ ] Navigate away and return to the map
- [ ] Verify the map opens at the saved position and zoom
- [ ] Test with master, suburb, and individual maps
- [ ] Verify maps without default views still use project defaults
- [ ] Test updating an existing default view
- [ ] Verify the migration script runs without errors

## API Endpoints Modified

### PUT `/api/map-areas/{id}`
**New accepted fields:**
- `default_center_lat` (number, optional)
- `default_center_lon` (number, optional)
- `default_zoom` (integer, optional)

**Response includes new fields:**
```json
{
  "id": 1,
  "name": "Example Map",
  "default_center_lat": 40.7128,
  "default_center_lon": -74.0060,
  "default_zoom": 15,
  ...
}
```

### GET `/api/map-areas/{id}`
**Response now includes:**
- `default_center_lat` (number | null)
- `default_center_lon` (number | null)
- `default_zoom` (integer | null)

## Files Changed

1. `database/database.py` - Schema update
2. `models/map_area.py` - Model update
3. `services/map_area_service.py` - Service layer update
4. `frontend/src/types/index.ts` - Type definition update
5. `frontend/src/pages/map-editor.tsx` - UI implementation

## Files Created

1. `migrate_add_default_view.py` - Migration script
2. `FEATURE_DEFAULT_VIEW.md` - User documentation
3. `IMPLEMENTATION_SUMMARY.md` - This file

## Notes

- Default view is completely optional - maps work fine without it
- Null/undefined default values cause the map to fall back to project defaults
- Each map type (master, suburb, individual) can have independent default views
- The feature is backward compatible - old maps without default views continue to work

