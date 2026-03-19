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
  streetLabelOverlay?: StreetLabelOverlayOption | null;
  /** Apply zoom offset to the base tile layer itself (for all-in-one tiles without a labels-only URL) */
  baseZoomOffset?: number;
  baseTileSize?: number;
}

export interface StreetLabelOverlayOption {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
  zoomOffset?: number;
  tileSize?: number;
}

const DEFAULT_TILE_LAYER_ID = 'carto-voyager';

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
    subdomains: ['a', 'b', 'c'],
    baseZoomOffset: -1,
    baseTileSize: 512,
  },
  {
    id: 'carto-voyager',
    name: 'Carto Voyager (Readable Streets)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    description: 'Higher-contrast roads with always-on street label overlay for readability.',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
    streetLabelOverlay: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
      attribution: '',
      maxZoom: 20,
      subdomains: ['a', 'b', 'c', 'd'],
      zoomOffset: -1,
      tileSize: 512,
    }
  },
  {
    id: 'carto-light',
    name: 'Carto Light (Simplified)',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    description: 'Clean, minimal style with an always-on street label overlay.',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
    streetLabelOverlay: {
      url: 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
      attribution: '',
      maxZoom: 20,
      subdomains: ['a', 'b', 'c', 'd'],
      zoomOffset: -1,
      tileSize: 512,
    }
  },
  {
    id: 'carto-light-nolabels',
    name: 'Carto Light (No Labels)',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    description: 'Extremely minimal - roads and water only, no text labels',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
    streetLabelOverlay: null,
  },
  {
    id: 'osm-hot',
    name: 'Humanitarian OSM',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
    description: 'Cleaner style optimized for humanitarian mapping',
    maxZoom: 19,
    subdomains: ['a', 'b'],
    baseZoomOffset: -1,
    baseTileSize: 512,
  },
  {
    id: 'wikimedia',
    name: 'Wikimedia',
    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
    description: 'Clean, high-contrast style with bold road labels on a light background.',
    maxZoom: 19,
    baseZoomOffset: -1,
    baseTileSize: 512,
  },
  {
    id: 'cyclosm',
    name: 'CyclOSM',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    description: 'OSM variant with clear street/block contrast and cycling infrastructure.',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c'],
    baseZoomOffset: -1,
    baseTileSize: 512,
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
  const defaultLayer =
    TILE_LAYER_OPTIONS.find(layer => layer.id === DEFAULT_TILE_LAYER_ID)
    || TILE_LAYER_OPTIONS[0];

  if (!layerId) {
    return defaultLayer;
  }
  
  return TILE_LAYER_OPTIONS.find(layer => layer.id === layerId) 
    || defaultLayer;
}

/**
 * Get street label overlay configuration by tile layer ID.
 * Returns null for map styles that intentionally hide labels.
 */
export function getStreetLabelOverlay(
  layerId?: string | null
): StreetLabelOverlayOption | null {
  const selectedLayer = getTileLayer(layerId);
  return selectedLayer.streetLabelOverlay ?? null;
}
