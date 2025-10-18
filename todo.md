# To Do List

## To Fix

- [x] When in suburb view, it is possible to delete the master map boundary (this should not be possible)
- [x] When in individual map view, it is possible to delete the suburb map boundary (this should not be possible)


## UI Improvements

- [x] Streamline the map view, to make it simpler
  - [x] Hide or collapse the 'boundary defined' message
  - [x] Hide or collapse the 'boundary shown (dashed lines)' message
  - [x] Hide or collapse the 'Default view set (zoom)' message
- [x] Popup messages (currently browser message with ok button); Shown when something is created or updated
  - [x] Change to a modern look
  - [x] Fade out after a few seconds
- [ ] When editing a boundary, right click a node to delete it


## Layers

- [x] Add support for text annotations
- [x] Add support to create a label for polygons
- [ ] Create a basic layer system for annotations (more functionality to be added later)
  - [ ] Create a UI tool for layer management
    - [ ] Add a layer, and give it a name
    - [ ] Edit the layer name
    - [ ] Delete a layer
  - [ ] Allow creation of multiple layers
- [ ] Expand annotation layer features
  - [ ] Select the active layer that new annotations will be added to
  - [ ] Require annotations to be created in a layer
  - [ ] Enable editing annotations in a layer
  - [ ] Option to hide or show a layer completely
- [ ] Add persistence, so annotations are saved to the database


## Export

- [ ] Functionality to export the map as an image
- [ ] Option to save as a file
- [ ] Option to export to clipboard
- [ ] Option to export current view (zoom, location) or use values defined on the map (default)
- [ ] Option to include boundaries (yes by default)
- [ ] Option to include annotations (yes by default)


# Project Layout
- [ ] Rename 'Master' map to 'Region'
- [ ] Allow multiple regions in a project


## To Investigate

- [ ] Can some of the OpenStreetMap information be hidden? Eg, bus stops, business names, other POIs
- [ ] Does OpenStreetMap include information to show hilly areas?
