export interface Project {
  id?: number;
  name: string;
  description: string;
  center_lat: number;
  center_lon: number;
  zoom_level: number;
  created_at?: string;
  updated_at?: string;
}

export interface MapArea {
  id?: number;
  project_id: number;
  parent_id?: number;
  name: string;
  area_type: 'master' | 'suburb' | 'individual';
  boundary_id?: number;
  default_center_lat?: number;
  default_center_lon?: number;
  default_zoom?: number;
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
  project_id: number;
  name: string;
  layer_type: 'osm' | 'annotation' | 'custom';
  visible: boolean;
  z_index: number;
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
  master: MapArea | null;
  suburbs: MapArea[];
  individuals: MapArea[];
}
