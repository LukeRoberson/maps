/**
 * Module: constants/tile-layers.ts
 * 
 * Tile layer configuration for different map styles
 */

export interface TileLayerOption {
  id: string;
  name: string;
  url: string;
  attribution: string;
  description: string;
  maxZoom: number;
  subdomains?: string[];
}

/**
 * Available tile layer providers with different styles and detail levels
 */
export const TILE_LAYER_OPTIONS: TileLayerOption[] = [
  {
    id: 'osm-standard',
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    description: 'Standard OSM with all features including POIs, bus stops, etc.',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  {
    id: 'carto-light',
    name: 'Carto Light (Simplified)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    description: 'Clean, minimal style without POI labels or bus stops',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd']
  },
  {
    id: 'carto-light-nolabels',
    name: 'Carto Light (No Labels)',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    description: 'Extremely minimal - roads and water only, no text labels',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd']
  },
  {
    id: 'carto-dark',
    name: 'Carto Dark (Simplified)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    description: 'Dark theme without POI clutter',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd']
  },
  {
    id: 'osm-hot',
    name: 'Humanitarian OSM',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
    description: 'Cleaner style optimized for humanitarian mapping',
    maxZoom: 19,
    subdomains: ['a', 'b']
  }
];

/**
 * Get tile layer configuration by ID
 * 
 * @param layerId - Tile layer ID
 * @returns Tile layer configuration
 */
export function getTileLayer(
  layerId?: string | null
): TileLayerOption {
  if (!layerId) {
    return TILE_LAYER_OPTIONS[0]; // Default to OSM Standard
  }
  
  return TILE_LAYER_OPTIONS.find(layer => layer.id === layerId) 
    || TILE_LAYER_OPTIONS[0];
}
