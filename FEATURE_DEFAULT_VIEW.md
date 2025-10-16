# Default View Feature

## Overview

Each map (master, suburb, or individual) can now have its own default position and zoom level saved. This allows you to set a preferred view for each map that will be used when opening that map.

## How to Use

### Setting a Default View

1. Open any map in the map editor
2. Pan and zoom the map to your desired view
3. Click the **"Set Default View"** button in the header
4. The current center position and zoom level will be saved for this map

### Viewing Saved Defaults

When a map has a default view saved, you'll see an indicator in the map header:
```
✓ Default view set (zoom 15)
```

### How Default Views Work

- When you open a map **without** a default view, it uses the project's default center and zoom
- When you open a map **with** a default view, it uses the saved position and zoom
- Each map (master, suburb, individual) can have its own unique default view
- Default views are independent of boundaries

## Technical Details

### Database Schema

Three new columns were added to the `map_areas` table:
- `default_center_lat` (REAL) - Latitude of the default center point
- `default_center_lon` (REAL) - Longitude of the default center point
- `default_zoom` (INTEGER) - Default zoom level

### API Updates

The `/api/map-areas/<id>` PUT endpoint now accepts these additional fields:
- `default_center_lat`
- `default_center_lon`
- `default_zoom`

### Migration

If you have an existing database, run the migration script:
```bash
python migrate_add_default_view.py
```

This will safely add the new columns to your existing `map_areas` table.

## Example Use Cases

1. **Master Map**: Set a wide view showing the entire region
2. **Suburb Map**: Set a closer view focused on that suburb's boundaries
3. **Individual Map**: Set a detailed view of a specific street or area

Each level can have its own appropriate zoom and center point for quick access.

