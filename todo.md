# Bugs

- [ ] Annotation colouring doesn't update
  * I have a layer set to green
  * I add a green line
  * I update the layer colour to purple
  * The existing line stays green
  * All new lines are correct
- [ ] Annotation colouring is not consistent
  * Looks ok on the screen, but wrong on export
  * Map 69 - Some blocks are purple, some are blue
  * Map 70 - Separate annotation layer for bushland is blue, not green
- [ ] Adding a new annotation polygon displays label twice
  * Almost overlapping
  * After a refresh it's fine
- [ ] Editing annotation polygon is problematic
  * Creating it is fine
  * Moving points later is difficult
  * I start to drag a point and it cancels


# Future Features

- [ ] Annotation:
  - [ ] Way to create an 'exclusion' zone, eg where schools or parks take up space on the map
  - [ ] Way to move a label associated with a polygon
  - [ ] Allow polygons to have no label
- [ ] Suburb view
  - [ ] Show peer maps for neighbouring suburbs
- [ ] Exporting options
  - [ ] Add Suburb name to map
  - [ ] Add map number to map
  - [ ] Default line thickness per map

- [ ] Settings
  - [ ] Add a settings page (based on config.yaml and constants in the frontend)
  - [ ] Add additional configurable features
    * Zoom increments
    * Default annotation text size
- [ ] Database
  - [ ] Allow import or export of raw DB file
  - [ ] Schema management
    * Need to tag with a version
    * When future updates are required, check schema, update, migrate data, etc
- [ ] Testing and Docs
  - [ ] Frontend testing plan
- [ ] Simple Auth
  - [ ] Allow read only users and admins
  - [ ] Admins can update maps
  - [ ] System to reset passwords
- [x] Edit panel
  - [x] Create a new panel on the left, under layers
  - [x] Make it expandable/shrinkable
  - [ ] Add the zoom, lat, lon, in here so they can be edited manually
  - [x] Default map style
- [ ] Search for a street to get the map it is on


# API
  - [ ] Postman collection
    - [x] App Health and config
    - [x] Projects
    - [x] Map Area
    - [ ] Boundary
    - [ ] Layer
    - [ ] Annotation
    - [ ] Annotation Style
  - [ ] Automated API tests with pytest
    - [x] App Health and config
    - [x] Projects
    - [ ] Map Area
    - [ ] Boundary
    - [ ] Layer
    - [ ] Annotation
    - [ ] Annotation Style
  - [ ] Swagger Documentation
    - [x] App Health and config
    - [x] Projects
    - [x] Map Area
    - [ ] Boundary
    - [ ] Layer
    - [ ] Annotation
    - [ ] Annotation Style
  - [ ] General Cleanup
    - [ ] Consolidate project import and export into one endpoint with different methods
    - [ ] Default bearing is still in the project export
    - [ ] JSON export has default zoom as either an int or a float; Just float would be better
  - [ ] Improve tests
    - [ ] Project lifecycle workflow
        1. Create a new project
        2. Update the project
        3. Delete the project
    - [ ] Test importing projects

  - [ ] Can `/api/map-areas/{map_id}` be consolidated with `/api/map-areas`?
    * GET: It just filters down to a specific map
    * PUT: Updates, but can use a parameter
    * DELETE: Can also use a parameter


# Investigate

- [ ] Can we get the area of a map in meters^2?
- [ ] Can we get street length?
- [ ] Can we get the number of houses per block?
- [ ] Some free-tier map styles that were previously discounted (need API key)
- [ ] PNG exports seem to be going to an exports folder within the project
- [ ] Addresses
  - [ ] Search for an address; Show which map this is in
  - [ ] Auto add POIs
  * This would require a 'geocoder', which turns addresses to lat/lon
  * geopy includes 'Nominatim', which is OSM's geocoder (free with rate limits)

