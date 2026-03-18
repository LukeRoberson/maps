# To Do List

- [x] Region view
  - [x] Slider to hide suburbs with no child maps
  - [x] Hide child maps

- [x] Suburb view
  - [x] Fade anything outside the boundary

- [x] Map View
  - [x] Region Boundary says it is visible, but it is not
  - [x] Inherited layers just say 'Boundary' making it hard to tell which is which
  - [x] Everything outside the map boundary should be faded
  - [x] Option to hide peer map layers
  - [x] Toggling visibility of the region boundary also toggles the visibility of peer maps
  - [x] Street names are too small
  - [x] Switching to some map styles makes everything faded; Default works
  - [x] Parent layers aren't being inherited

- [x] Layers:
  - [x] Two layer types, one for boundaries, one for annotations
  - [x] In any map type, the main boundary is a layer (show/hide, set colour)
  - [x] Upstream boundary layers should also be visible (show/hide only, no editing)
  - [x] Each boundary representing a child is also a layer

- [x] Export
  - [x] Export to clipboard is not working
  - [x] Hide parent and peer boundaries, leave local map boundary

- [x] Map Editor
  - [x] When clicking a boundary area, a black selection box appears (hide this)
  - [x] When clicking a boundary to open it, there is a browser confirmation popup
  - [x] When clicking a suburb, it should 'recenter to default' automatically

- [x] Annotation:
  - [x] Centre align text label to marker

- [x] Favicon


# Cleanup
- [ ] Remove the bearing, as it's not used
- [x] Remove unused overlay types


# Future

- [ ] Annotation:
  - [ ] Can we add a POI marker at a given address?
    * Keep a list of special addresses, and let the app automatically add the markers
- [ ] Map Editor
  - [ ] Can we move the predefined suburb name? Sometimes its in the way (this comes from the overlay)
- [ ] Simple Auth
  - [ ] Allow read only users and admins
  - [ ] Admins can update maps
  - [ ] System to reset passwords
- [ ] API tests
- [ ] Frontend testing plan
- [ ] Settings
  - [ ] Add a settings page (based on config.yaml)
  - [ ] Add additional configurable features
    * Zoom increments
    * Street text size
    * Default annotation text size
