# Bugs

- [x] Sometimes the entire browser window goes entirely white
  * Noticed when editing a map
    * /projects/6/maps/194
    * When adding an annotation
  * Console error: Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is no longer a child of this node. Perhaps it was moved in a 'blur' event handler?
  * Fine after refresh
- [ ] Sometimes a text annotation is completed automatically without pressing enter
  * Eg, adding a new annotation, enter a number
  * Get two characters typed
  * It's like I've clicked out of the box to submit it (enter would go to a new line)
- [ ] Annotation colouring doesn't update
  * I have a layer set to green
  * I add a green line
  * I update the layer colour to purple
  * The existing line stays green
  * All new lines are correct
- [ ] Cannot export to clipboard
  * "Failed to copy to clipboard, your browser may not support this feature"
  * Failed to load resource: the server responded with a status of 413 (Request Entity Too Large)
  * installHook.js: Clipboard error: TypeError: Cannot read properties of undefined (reading 'write')
- [ ] CSS error in console:
  * Error inlining remote css file SecurityError: Failed to read the 'cssRules' property from 'CSSStyleSheet': Cannot access rules
  * Error while reading CSS rules from https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css SecurityError: Failed to read the 'cssRules' property from 'CSSStyleSheet'
- [x] Annotations are not enforced into any layer
  * Presumably they belong to the 'Boundary' layer
  * A layer should be selected first, or annotations shouldn't be allowed
- [x] New maps don't have a boundary layer
  * Old maps still have them
  * Hising the suburb boundary hides the map boundary too
  * Can still edit the boundary



# Immediate Concerns

- [ ] Map styles: Can we get more contrast between the block and the road?
  * OSM has good contrast, but tiny street names
- [ ] Map styles: Can we get darker text?
- [ ] Export to PNG
  * Investigate a different export method
  * Eg, one zoom level for the export area, another zoom level for the size of the streets
  * Or, set zoom level for export, then zoom out and draw a box to export that area



# Future

- [ ] Possibility to add more information to the map
  * Number of houses on the block
  * Specific POIs
- [ ] Annotation:
  - [ ] Can we add a POI marker at a given address?
    * Automatically add POIs as markers
  - [ ] Option to adjust line thickness
- [ ] Map Editor
  - [ ] Can we move the predefined suburb name? Sometimes its in the way (this comes from the overlay)
  - [ ] At some zoom levels the street names can be a bit blurred
- [ ] Region View
  - [ ] Show each suburb as a layer, so we can show and hide them
- [ ] Suburb view
  - [ ] Show individual maps as layers, so we can show/hide them

- [ ] Settings
  - [ ] Add a settings page (based on config.yaml)
  - [ ] Add additional configurable features
    * Zoom increments
    * Street text size
    * Default annotation text size
- [ ] Database
  - [ ] Allow import or export of raw DB file
  - [ ] Schema management
    * Need to tag with a version
    * When future updates are required, check schema, update, migrate data, etc
- [ ] Testing and Docs
  - [ ] Postman collection
  - [ ] Automated API tests with pytest
  - [ ] Frontend testing plan
- [ ] Simple Auth
  - [ ] Allow read only users and admins
  - [ ] Admins can update maps
  - [ ] System to reset passwords
