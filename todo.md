# To Do List

## Layers

- [ ] Set colours for each layer (eg, for polygons, which are all green otherwise)


## Export

- [x] Functionality to export the map as an image
  - [x] Option to save as a file
  - [x] Option to export to clipboard
  - [x] Option to export current view (zoom, location) or use values defined on the map (default)
  - [x] Option to include boundaries (yes by default)
  - [x] Option to include annotations (yes by default)
- [x] Export project to file
- [x] Import project from file


# Database

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
- [ ] Find your region somehow (IP address?) and set the default lat/lon based on that?

