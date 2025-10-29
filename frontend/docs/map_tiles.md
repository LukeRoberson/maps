# Map Tiles

## Overview

Map views aren't 100% real-time. Mapping services like OpenStreetMap use *tiles* to display maps.

When we're scrolling around a map, we're looking at *pre-rendered* tiles (map images) that come from the map server.

This app loads the latest tiles available from these servers at runtime, so it is as up to date as possible.

### Update Frequency

Different tile providers update their cached tiles on different schedules:
- **OpenStreetMap Standard**: Updated approximately daily
- **CARTO tiles**: Updated approximately weekly
- **Humanitarian OSM**: Updated approximately daily
- **MapTiler Vector**: Varies by region, typically daily to weekly

Changes made to OpenStreetMap data will not appear immediately in the map view.

</br></br>


While the base map tiles are pre-rendered and cached, the following elements in this application are live and real-time:

- **Region boundaries**: Drawn and edited in the map editor
- **Suburb boundaries**: Created within region boundaries
- **Custom annotations**: User-created markers, polygons, and text
- **Layer visibility**: Toggle layers on/off instantly

</br></br>


These overlays are stored in the local SQLite database and rendered client-side as vector graphics on top of the tile layer.

</br></br>


---
## Leaflet

The frontend is based around **Leaflet**. This is a tile-based mapping library.

</br></br>


### Key Features Used

- **Tile layer management**: Loading and displaying tiles from multiple providers
- **Vector overlay rendering**: Drawing custom boundaries and annotations
- **Leaflet.draw**: Interactive drawing and editing tools
- **Layer control**: Managing visibility of different map layers

</br></br>


---
## How Tiles Work

### Tile Grid System

Maps are divided into a grid of 256×256 pixel images organized by zoom level:
- **Zoom level (z)**: 0 (world view) to 20+ (street level)
- **Column (x)**: Horizontal tile position
- **Row (y)**: Vertical tile position

</br></br>


Example tile URL:
```
https://a.tile.openstreetmap.org/15/12345/6789.png
                                    |   |     |
                                    z   x     y
```

</br></br>


### Load Distribution

Tile servers use **subdomains** (a, b, c, d) to distribute load across multiple servers. The Leaflet library automatically rotates between subdomains when requesting tiles.

</br></br>


### Why Tiles?

Tile-based mapping provides:
- **Performance**: Only visible tiles are loaded
- **Caching**: Browsers cache tiles for faster subsequent loads
- **Scalability**: Tile servers can distribute load globally via CDN
- **Flexibility**: Switch between different tile providers without changing application logic

</br></br>

The alternative is self-hosted rendering, but this requires more resources to implement.

</br></br>


---
## Technical Implementation

The tile layer system is implemented across several files:

### Configuration
- **`frontend/src/constants/tile-layers.ts`**: Defines available tile providers and their properties
  - URL templates
  - Attribution requirements
  - Tile type (raster vs vector)
  - Renderer specification (Leaflet vs MapLibre)

### Map Editor
- **`frontend/src/pages/map-editor.tsx`**: Main map editing interface
  - Leaflet map initialization for raster tiles
  - Tile layer selection UI
  - POI filter integration

### Components
- **`frontend/src/components/poi-filter/`**: POI filtering controls
  - Only active with vector tile providers
  - Provides checkboxes for different POI categories
  - Disabled state when using raster tiles

### Hooks
- **`frontend/src/hooks/use-maplibre.ts`**: Custom hook for MapLibre GL maps
  - Manages vector tile map instances
  - Handles POI filter state changes
  - Currently uses raster fallback (upgrade to vector tiles with API key)

</br></br>


### Tile Layer Selection

Users can switch between tile providers at runtime through the "Map Style" button in the editor. The selection is:
- Stored per map area
- Falls back to project defaults if not set
- Persists across sessions

</br></br>


---
## Limitations

### Pre-Rendered Raster Tiles
- Changes to OpenStreetMap data are not immediately visible
- Cannot customize the rendering of base map features beyond provider selection
- No granular POI filtering (show/hide specific categories)
- Dependent on third-party server availability

### Vector Tiles (Current Implementation)
- Requires API key from MapTiler (free tier available)
- Currently uses raster fallback in the hook implementation
- To enable full vector tile features, update `use-maplibre.ts` to use:
  ```
  https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=YOUR_KEY
  ```
- Higher CPU/GPU usage for client-side rendering
- May impact performance on older devices

</br></br>


---
## Alternative Approaches

### Self-Hosted Rendering
For complete control and real-time base maps, consider:
- Hosting a tile server (Mapnik, Tegola, Martin)
- Maintaining a local OSM database with PostGIS
- Implementing on-demand tile rendering
- Custom style definitions

**This is not currently implemented** due to:
- Infrastructure complexity and cost
- Maintenance overhead
- Server resource requirements
- Current pre-rendered tiles meet most use cases

</br></br>


### When to Use Each Option

| Use Case | Recommended Option |
|----------|-------------------|
| General map viewing | Raster tiles (OSM Standard or Carto Light) |
| Minimal clutter for print | Raster tiles (Carto Light No Labels) |
| Dark theme preference | Raster tiles (Carto Dark) |
| Humanitarian mapping | Raster tiles (OSM HOT) |
| Custom POI filtering | Vector tiles (MapTiler) with API key |
| Complete control | Self-hosted rendering (not implemented) |

</br></br>


---
## Themes

Other third parties have created themes based on the mapping data from OSM (OpenStreetMap). These themes adjust the view of the map to hide some details, show others, and so on.

These are also pre-rendered tiles coming from third parties.

</br></br>


### Available Tile Providers

The application supports multiple tile layer providers, configured in `frontend/src/constants/tile-layers.ts`:

#### Raster Tile Providers (Pre-rendered, Fast)
- **OpenStreetMap Standard**: Full detail with all features including POIs and bus stops
- **Carto Light**: Clean, minimal style without POI clutter
- **Carto Light (No Labels)**: Extremely minimal - roads and water only
- **Carto Dark**: Dark theme variant with simplified labeling
- **Humanitarian OSM**: Optimized for humanitarian mapping with infrastructure emphasis

#### Vector Tile Providers (Customizable, Power Users)
- **MapTiler Vector**: Advanced option with customizable POI filtering
  - Requires API key (free tier available at maptiler.com)
  - Enables granular control over POIs, bus stops, labels, etc.
  - Higher resource usage - may impact older devices
  - Recommended for power users who need fine-grained control

</br></br>


### POI Filtering (Vector Tiles Only)

When using vector tile providers, the POI Filter panel becomes active in the map editor sidebar. This allows real-time toggling of:

- General POIs (points of interest)
- Bus stops and transit markers
- Street and road labels
- Building names
- Parking locations
- Restaurants and cafes

**Important:** POI filtering only works with vector tile providers. Raster tiles are pre-rendered images and cannot be filtered.

</br></br>


Each provider serves tiles from different servers with their own update schedules and styling rules.

</br></br>


### Update Frequency

Different tile providers update their cached tiles on different schedules:
- **OpenStreetMap Standard**: Updated approximately daily
- **CARTO tiles**: Updated approximately weekly
- **Humanitarian OSM**: Updated approximately daily

</br></br>


Changes made to OpenStreetMap data will not appear immediately in the map view.

</br></br>


