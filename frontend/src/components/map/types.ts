/**
 * @file map.ts
 * 
 * @summary Type definitions for maps.
 * 
 * @exports MapArea
 * @exports MapHierarchy
 * @exports SuburbNode
 * @exports RegionNode
 */


/**
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
 * Represents a region node in the hierarchy.
 * 
 * @property {MapArea} region - The region map area.
 * @property {SuburbNode[]} suburbs - The suburbs within the region.
 */
export interface RegionNode {
  region: MapArea;
  suburbs: SuburbNode[];
}

