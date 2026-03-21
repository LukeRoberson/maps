# Bugs

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
- [x] Wikimedia OSM not loading correctly in prod
  * Works fine in dev
  * Annotations are still displaying
  * Export to PNG works fine
  * This in the console: The file at 'blob:http://192.168.200.235:8081/d5d89e40-cc0a-41c9-80b9-ce3a68b31042' was loaded over an insecure connection. This file should be served over HTTPS.
    * May not be related, the whole app is http


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
  - [ ] Show/hide individual maps
- [ ] Suburb view
  - [ ] Show individual maps as layers, so we can show/hide them
  - [ ] When hovering over a map, change the mask shading so the borders are clearly visisble

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
- [ ] Edit panel
  - [ ] Create a new panel on the left, under layers
  - [ ] Make it expandable/shrinkable
  - [ ] Add the zoom, lat, lon, in here so they can be edited manually
  - [ ] Default map style
- [ ] Investigate:
  - [ ] Can we get the area of a map in meters^2?
  - [ ] Can we get street length?
  - [ ] Can we get the number of houses per block?
  - [ ] Some free-tier map styles that were previously discounted (need API key)
  - [ ] PNG exports seem to be going to an exports folder within the project
