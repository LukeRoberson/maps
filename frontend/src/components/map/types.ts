/**
 * @file map/types.ts
 * 
 * @summary Type definitions for maps.
 * 
 * @exports MapArea
 * @exports MapHierarchy
 * @exports SuburbNode
 * @exports RegionNode
 * @exports Toast
 * @exports ToastType
 * @exports MapViewControllerProps
 * @exports ReadOnlyPolygonProps
 */


/**
 * @interface MapArea
 * 
 * @summary
 * Represents a map within a project.
 * 
 * @remarks
 * Defines different types of map areas such as regions, suburbs, and individual maps.
 * 
 * @property {number} [id] - Unique identifier for the map area. Optional.
 * @property {number} project_id - Identifier of the parent project.
 * @property {number} [parent_id] - Identifier of the parent map area, if applicable. Optional.
 * @property {string} name - Name of the map area.
 * @property {'region' | 'suburb' | 'individual'} area_type - Type of the map area.
 * @property {number} [boundary_id] - Identifier of the associated boundary, if applicable. Optional.
 * @property {number} [default_center_lat] - Default center latitude for the map area. Optional.
 * @property {number} [default_center_lon] - Default center longitude for the map area. Optional.
 * @property {number} [default_zoom] - Default zoom level for the map area. Optional.
 * @property {number} [default_bearing] - Default bearing for the map area. Optional.
 * @property {string} [tile_layer] - Optional tile layer URL template. Optional.
 * @property {string} [created_at] - Timestamp of map area creation. Optional.
 * @property {string} [updated_at] - Timestamp of last map area update. Optional.
 */
export interface MapArea {
  id?: number;
  project_id: number;
  parent_id?: number;
  name: string;
  area_type: 'region' | 'suburb' | 'individual';
  boundary_id?: number;
  default_center_lat?: number;
  default_center_lon?: number;
  default_zoom?: number;
  default_bearing?: number;
  tile_layer?: string;
  created_at?: string;
  updated_at?: string;
}


/**
 * @interface MapHierarchy
 * 
 * @summary
 * Represents the hierarchical structure of map areas within a project.
 * 
 * @remarks
 * Defines the hierarchy of regions, suburbs, and individual maps.
 * 
 * @property {MapArea[]} regions - Array of region map areas.
 * @property {MapArea[]} suburbs - Array of suburb map areas.
 * @property {MapArea[]} individuals - Array of individual map areas.
 */
export interface MapHierarchy {
  regions: MapArea[];
  suburbs: MapArea[];
  individuals: MapArea[];
}


/**
 * @interface SuburbNode
 * 
 * @summary
 * Represents a suburb node in the hierarchy.
 * 
 * @property {MapArea} suburb - The suburb map area.
 * @property {MapArea[]} individuals - The individual maps within the suburb.
 */
export interface SuburbNode {
  suburb: MapArea;
  individuals: MapArea[];
}


/**
 * @interface RegionNode
 * 
 * @summary
 * Represents a region node in the hierarchy.
 * 
 * @property {MapArea} region - The region map area.
 * @property {SuburbNode[]} suburbs - The suburbs within the region.
 */
export interface RegionNode {
  region: MapArea;
  suburbs: SuburbNode[];
}


/**
 * @type ToastType
 * @summary Types of toast notifications.
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';


/**
 * @interface Toast
 * 
 * @summary Represents a toast notification.
 * @property {number} id - Unique identifier for the toast.
 * @property {string} message - Message content of the toast.
 * @property {ToastType} type - Type of the toast notification.
 */
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}


/**
 * @interface MapViewControllerProps
 * 
 * @summary Props for MapViewController component.
 * @property {(map: L.Map) => void} onMapReady - Callback when the map instance is ready.
 */
export interface MapViewControllerProps {
  onMapReady: (map: L.Map) => void;
}


/**
 * @interface ReadOnlyPolygonProps
 * 
 * @summary Props for ReadOnlyPolygon component.
 * @property {[number, number][]} positions - Array of latitude and longitude pairs defining the polygon.
 * @property {L.PathOptions} pathOptions - Leaflet path options for styling the polygon.
 * @property {string} [tooltipContent] - Optional tooltip content to display on hover.
 * @property {() => void} [onClick] - Optional click handler for the polygon.
 * @property {(message: string, type: ToastType) => void} [showToast] - Function to show toast notifications.
 */
export interface ReadOnlyPolygonProps {
  positions: [number, number][];
  pathOptions: L.PathOptions;
  tooltipContent?: string;
  onClick?: () => void;
  showToast?: (message: string, type: ToastType) => void;
}
