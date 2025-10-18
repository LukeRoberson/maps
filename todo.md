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


## Layers

- [ ] Add support for text annotations
- [ ] Add support to create a label for polygons
- [ ] Allow multiple annotation layers
  - [ ] For example, one might have lines, another might have block numbers, another may have POI
  - [ ] Should be able to name the layers
  - [ ] Layers are unique per map
  - [ ] Layers are hierarchical in the order they are applied
  - [ ] Layers are inherited from parent map
  - [ ] Inherited layers are not editable
  - [ ] UI support to select a layer for editing or deleting


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
