# To Do List

- [ ] Project view
  - [ ] Slider to hide suburbs with no child maps

- [ ] Suburb view
  - [ ] Fade anything outside the boundary
  - [ ] Inherited boundary layer off by default

- [ ] Layers:
  - [x] Two layer types, one for boundaries, one for annotations
  - [x] In any map type, the main boundary is a layer (show/hide, set colour)
  - [x] Upstream boundary layers should also be visible (show/hide only, no editing)
  - [x] Each boundary representing a child is also a layer
  - [ ] Add a suburb label to the suburb polygon

- [ ] Map Editor
  - [ ] When clicking a boundary area, a black selection box appears (hide this)
    * Click/drag causes this to appear too
  - [ ] When clicking a boundary to open it, there is a browser confirmation popup
    * Looks ugly, make it nicer
  - [ ] Add map expansion button in edit mode too
  - [ ] In region map, use a blue outline, but don't shade in blue (makes the individual maps hard to see)
    * Or, shade in blue if empty, no shade if there are child maps
    * Maybe use different colours, depending on whether there are child maps in existence
  - [ ] in the region map, individual maps are only visible for the last suburb we've looked at
  - [x] When clicking a suburb, it should 'recenter to default' automatically

- [ ] Annotation:
  - [ ] Change marker colour to match layer colour
  - [ ] Centre align text label to marker

- [ ] Favicon



# Bugs

- [ ] Changing bearing doesn't stick; As soon as we move the map, it resets
- [ ] Parent layers aren't being inherited


# Future

- [ ] Simple Auth
  - [ ] Allow read only users and admins
  - [ ] Admins can update maps
  - [ ] System to reset passwords

