# To Do List

## To Fix

- [x] When in suburb view, it is possible to delete the master map boundary (this should not be possible)
- [x] When in individual map view, it is possible to delete the suburb map boundary (this should not be possible)
- [ ] Layers: Let's me create an annotation without a layer being selected (however, it won't save)
- [ ] Layers: Creating a marker and labeling it creates two labels; Only one after refreshing the page
- [ ] Layers: Hiding a layer hides a marker, but not a polygon; The polygon fades a bit
- [ ] Layers: Adding a text annotation pops up a box to add the label, then requires me to add the label in the UI anyway
- [ ] UI: When adding a layer, the create and cancel buttons overhang the box on the right


## UI Improvements

- [x] Streamline the map view, to make it simpler
  - [x] Hide or collapse the 'boundary defined' message
  - [x] Hide or collapse the 'boundary shown (dashed lines)' message
  - [x] Hide or collapse the 'Default view set (zoom)' message
- [x] Popup messages (currently browser message with ok button); Shown when something is created or updated
  - [x] Change to a modern look
  - [x] Fade out after a few seconds


## Layers

- [x] Add support for text annotations
- [x] Add support to create a label for polygons
- [x] Create a basic layer system for annotations (more functionality to be added later)
  - [x] Create a UI tool for layer management
    - [x] Add a layer, and give it a name
    - [x] Edit the layer name
    - [x] Delete a layer
  - [x] Allow creation of multiple layers
- [x] Expand annotation layer features
  - [x] Select the active layer that new annotations will be added to
  - [x] Require annotations to be created in a layer
  - [x] Option to hide or show a layer completely
- [x] Add persistence, so annotations are saved to the database
- [ ] Remove the 'rotate layers' tool
- [ ] Remove the 'draw circle marker' tool
- [ ] When placing an annotation, press 'escape' key to cancel placement
- [ ] When placing an annotation, don't ask if we want to create a label, just create one
- [ ] Enable renaming an annotation (text annotation can be renamed with the 'edit layers' tool, but no other type can)
- [ ] Add a tool to delete an individual annotation within a layer


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
