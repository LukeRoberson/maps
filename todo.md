# To Do List

## To Fix

- [x] When in suburb view, it is possible to delete the master map boundary (this should not be possible)
- [x] When in individual map view, it is possible to delete the suburb map boundary (this should not be possible)
- [x] UI: When adding a layer, the create and cancel buttons overhang the box on the right
- [x] If a layer is not selected and I try to create a polygon, the UI lets me do it (this should be prevented if a layer is not selected)
- [x] When I click the 'eye' icon on a layer, polygons do not hide; The coloured area within the polygon fades, but the polygon and its label are still clearly visible
- [x] The 'edit annotations' button has two icons at once, the default one and a pencil
- [x] Deleting an annotation seems to work. However, after subsequent annotation edits or a refresh, the deleted annotations come back; It seems like they're initially removed from the UI, but not the database
- [x] When I add a text annotation, I get a pop up box to add the label. After entering the label, the UI still has a text box for me add the label
- [ ] On a map with no layers, I create a new layer, and it appears to be selected by default. I try to create a new annotation, but I'm told to select a layer first. A refresh fixes the issue.
- [ ] If I delete all layers, I'm still allowed to create new annotations
- [ ] When I add a marker (annotation) and label it, two labels appear in the UI. The second label disappears when the next annotation is added, when something is deleted or added, or when the page is refreshed


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
- [x] Remove the 'rotate layers' tool
- [x] Remove the 'draw circle marker' tool
- [x] When placing an annotation, press 'escape' key to cancel placement
- [x] When placing an annotation, don't ask if we want to create a label, just create one
- [x] Rename the 'Edit layers' tool to 'Edit annotations'
- [x] Edit annotations tool:
  - [x] Currently allows editing the text of a text annotation
  - [x] Enable editing the labels of any annotation
  - [x] This should only be able to edit annotations in the selected layer
- [x] Delete tool
  - [x] Currently allows deleting a text annotation
  - [x] Enable deleting any annotation
  - [x] This should only be able to delete annotations in the currently selected layer
- [ ] Set colours for each layer (eg, for polygons, which are all green otherwise)


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
