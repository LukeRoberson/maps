/**
 * Module: constants/drawing.ts
 *
 * Default drawing styles, colour palette, and validation limits used by the
 * map editor, draw controls, layer manager, and export dialog.
 *
 * Adjust these values to change the look and feel of newly-created
 * annotations, boundaries, and layers across the application.
 */


// ---------------------------------------------------------------------------
// Default colours
// ---------------------------------------------------------------------------

/** Default colour for boundary outlines (blue).
 *  Used when drawing or displaying a boundary polygon. */
export const DEFAULT_BOUNDARY_COLOR = '#3498db';

/** Default colour for annotation layers (green).
 *  Applied to new annotation layers and shapes when no layer colour is set. */
export const DEFAULT_ANNOTATION_COLOR = '#2ecc71';

/** Colour palette available in the layer-manager colour picker.
 *  Add or remove entries to change the choices offered to users. */
export const COLOR_OPTIONS = [
  { value: '#2ecc71', label: 'Green' },
  { value: '#3498db', label: 'Blue' },
  { value: '#e74c3c', label: 'Red' },
  { value: '#f39c12', label: 'Orange' },
  { value: '#9b59b6', label: 'Purple' },
  { value: '#1abc9c', label: 'Turquoise' },
  { value: '#e91e63', label: 'Pink' },
  { value: '#ff5722', label: 'Deep Orange' },
] as const;


// ---------------------------------------------------------------------------
// Default drawing style values
// ---------------------------------------------------------------------------

/** Default line thickness (pixels) for boundaries and annotation shapes.
 *  Increase for bolder outlines, decrease for finer lines. */
export const DEFAULT_LINE_THICKNESS = 3;

/** Default fill opacity for drawn shapes (0 = transparent, 1 = opaque).
 *  Controls how see-through newly-drawn polygons and rectangles are. */
export const DEFAULT_FILL_OPACITY = 0.2;

/** Snap distance (pixels) when editing polygon vertices.
 *  Vertices within this many pixels of another vertex will snap together.
 *  Set to 0 to disable snapping. */
export const SNAP_DISTANCE = 20;

/** Default font size (px) for text annotations.
 *  Used when placing a new text annotation on the map. */
export const DEFAULT_TEXT_FONT_SIZE = 20;

/** Fill opacity of the boundary fade overlay that dims areas outside the boundary.
 *  0 = fully transparent (no dimming), 1 = fully opaque (area outside hidden). */
export const BOUNDARY_FADE_OPACITY = 0.65;

/** Fill colour used for the boundary fade overlay (area outside the boundary). */
export const BOUNDARY_FADE_COLOR = '#ffffff';


// ---------------------------------------------------------------------------
// Line thickness picker options
// ---------------------------------------------------------------------------

/** Thickness values (pixels) offered in the layer-manager thickness picker.
 *  Add or remove entries to change the available choices. */
export const THICKNESS_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10] as const;


// ---------------------------------------------------------------------------
// Export dialog
// ---------------------------------------------------------------------------

/** Minimum zoom level selectable in the export dialog.
 *  Lower values cover more area at lower detail. */
export const EXPORT_MIN_ZOOM = 14;

/** Maximum zoom level selectable in the export dialog.
 *  Higher values give more detail but larger file sizes. */
export const EXPORT_MAX_ZOOM = 19;

/** Default zoom level used when the export dialog's manual zoom is first shown.
 *  Must be between EXPORT_MIN_ZOOM and EXPORT_MAX_ZOOM. */
export const EXPORT_DEFAULT_ZOOM = 17;

/** Line-width multiplier options available in the export dialog.
 *  Controls how thick annotation lines appear in the exported image. */
export const EXPORT_LINE_WIDTH_OPTIONS = [
  { value: 0.5, label: '0.5× (thin)' },
  { value: 1, label: '1× (normal)' },
  { value: 1.5, label: '1.5×' },
  { value: 2, label: '2× (thick)' },
  { value: 3, label: '3× (very thick)' },
] as const;
