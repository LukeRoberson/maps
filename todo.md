# Bugs

- [ ] Sometimes a text annotation is completed automatically without pressing enter
  * Eg, adding a new annotation, enter a number
  * Get two characters typed
  * It's like I've clicked out of the box to submit it (enter would go to a new line)
  * Has been improved, but not 100%
- [ ] Annotation colouring doesn't update
  * I have a layer set to green
  * I add a green line
  * I update the layer colour to purple
  * The existing line stays green
  * All new lines are correct


# Future Features

- [ ] Possibility to add more information to the map
  * Number of houses on the block
  * Specific POIs
- [ ] Annotation:
  - [ ] Can we add a POI marker at a given address?
    * Automatically add POIs as markers
  - [x] Option to adjust line thickness
  - [ ] Way to create an 'exclusion' zone, eg where schools or parks take up space on the map
- [ ] Region View
  - [ ] Show each suburb as a layer, so we can show and hide them
  - [ ] Show/hide individual maps
- [ ] Suburb view
  - [ ] Show individual maps as layers, so we can show/hide them
  - [ ] When hovering over a map, change the mask shading so the borders are clearly visible

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
- [ ] Edit panel
  - [ ] Create a new panel on the left, under layers
  - [ ] Make it expandable/shrinkable
  - [ ] Add the zoom, lat, lon, in here so they can be edited manually
  - [ ] Default map style


# API
  - [ ] Postman collection
  - [ ] Automated API tests with pytest
  - [ ] Swagger Documentation
  - [ ] General Cleanup
    - [ ] Consolidate project import and export into one endpoint with different methods


# Investigate

- [ ] Can we get the area of a map in meters^2?
- [ ] Can we get street length?
- [ ] Can we get the number of houses per block?
- [ ] Some free-tier map styles that were previously discounted (need API key)
- [ ] PNG exports seem to be going to an exports folder within the project
