# To Do List

## Layers

- [x] On a map with no layers, I create a new layer, and it appears to be selected by default. I try to create a new annotation, but I'm told to select a layer first. A refresh fixes the issue.
- [x] If I delete all layers, I'm still allowed to create new annotations
- [ ] Set colours for each layer (eg, for polygons, which are all green otherwise)

## Annotations

- [x] When I add a marker (annotation) and label it, two labels appear in the UI. The second label disappears when the next annotation is added, when something is deleted or added, or when the page is refreshed

# Projects

- [x] When creating a new project, it redirects to a project ID of 'null'; However, the project created just fine
- [x] Rename 'Master' map to 'Region'
- [ ] Allow multiple regions in a project

## UI

- [ ] Button to recenter the view based on map settings (location and zoom)
- [ ] An 'about' page
  - [ ] Brief project description
  - [ ] Privacy statement
  - [ ] Changelog
  - [ ] Disclaimer (use at your own risk, do your own backups, etc)
- [ ] A 'help' page
  - [ ] Show information on how the different maps work, etc


## Export

- [ ] Functionality to export the map as an image
  - [ ] Option to save as a file
  - [ ] Option to export to clipboard
  - [ ] Option to export current view (zoom, location) or use values defined on the map (default)
  - [ ] Option to include boundaries (yes by default)
  - [ ] Option to include annotations (yes by default)
- [ ] Export project to file
- [ ] Import project from file


# Database

- [ ] Is 'boundary_id' in map_areas table even used?
  - [ ] If yes, document its purpose
  - [ ] If no, clean up, and update docs
- [ ] Is 'layer_type' in layers table always 'annotation?
- [ ] Is 'config' in layers table used?
- [ ] Is 'style' in annotations table used?
- [ ] Layers include a 'config' dict (see LayerModel); Define what's allowed to be in there, and validate it
- [ ] AnnotationModel include a 'style', which seem to be the same as 'config' in LayerModel


# API

- [ ] Improve the `config.py` file
  - [ ] Load config from a YAML file
  - [ ] Set the secret key securely in prod
  - [ ] There's a lot of serializing and deserializing of config; Is this needed?


## To Investigate

- [ ] Can some of the OpenStreetMap information be hidden? Eg, bus stops, business names, other POIs
- [ ] Does OpenStreetMap include information to show hilly areas?
- [ ] Consider adding security to the API endpoints

