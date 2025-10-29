/**
 * @file index.ts
 * 
 * @summary Type definitions for the frontend.
 * 
 * @exports Project
 * @exports MapArea
 * @exports Boundary
 * @exports Layer
 * @exports Annotation
 * @exports MapHierarchy
 */


/**
 * Represents a project containing multiple maps.
 * 
 * @remarks
 * Defines the core structure of a project.
 * 
 * @property {number} [id] - Unique identifier for the project. Optional.
 * @property {string} name - Name of the project.
 * @property {string} description - Description of the project.
 * @property {number} center_lat - Default center latitude for the project maps.
 * @property {number} center_lon - Default center longitude for the project maps.
 * @property {number} zoom_level - Default zoom level for the project maps.
 * @property {string} [tile_layer] - Optional tile layer URL template. Optional.
 * @property {string} [created_at] - Timestamp of project creation. Optional.
 * @property {string} [updated_at] - Timestamp of last project update. Optional.
 */
export interface Project {
  id?: number;
  name: string;
  description: string;
  center_lat: number;
  center_lon: number;
  zoom_level: number;
  tile_layer?: string;
  created_at?: string;
  updated_at?: string;
}

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
  tile_layer?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Boundary {
  id?: number;
  map_area_id: number;
  coordinates: [number, number][];
  created_at?: string;
  updated_at?: string;
}

export interface Layer {
  id?: number;
  map_area_id: number;
  parent_layer_id?: number;
  name: string;
  layer_type: 'annotation' | 'custom';
  visible: boolean;
  z_index: number;
  is_editable: boolean;
  config: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Annotation {
  id?: number;
  layer_id: number;
  annotation_type: 'marker' | 'line' | 'polygon' | 'text';
  coordinates: unknown;
  style: Record<string, unknown>;
  content?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MapHierarchy {
  regions: MapArea[];
  suburbs: MapArea[];
  individuals: MapArea[];
}
