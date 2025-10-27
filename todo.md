# To Do List

# API

- [ ] Improve the `config.py` file
  - [ ] Load config from a YAML file
  - [ ] Set the secret key securely in prod


## To Investigate

- [x] Can some of the OpenStreetMap information be hidden? Eg, bus stops, business names, other POIs
  - **✅ Implemented!** Added tile layer selector with multiple map styles:
    - OpenStreetMap Standard (full detail with all POIs)
    - Carto Light (Simplified) - Clean style without POI labels or bus stops
    - Carto Light (No Labels) - Minimal roads and water only
    - Carto Dark (Simplified) - Dark theme without clutter
    - Humanitarian OSM - Cleaner humanitarian mapping style
  - Users can switch between styles via "Map Style" button
  - Preferences saved per-map and inherited from parent/project
- [ ] Does OpenStreetMap include information to show hilly areas?
- [ ] Consider adding security to the API endpoints
- [ ] Find your region somehow (IP address?) and set the default lat/lon based on that?

