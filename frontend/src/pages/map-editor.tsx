/**
 * @file map-editor.tsx
 * 
 * @summary Map editor page component.
 *  
 * @exports MapEditor
 */


// External dependencies
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, Pane, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// Internal dependencies
import { apiClient } from '@/services/api-client';
import { LayerManager } from '@/components/layer-manager';
import { ExportDialog, ExportOptions } from '@/components/export-dialog';
import { TILE_LAYER_OPTIONS, getStreetLabelOverlay, getTileLayer } from '@/constants/tile-layers';
import { isWithinBoundary } from '@/utils/geometry';
import { DrawControls } from '@/components/draw/draw-controls';

// Types
import type { Project } from '@/components/project/types';
import type { MapArea } from '@/components/map/types';
import type { Boundary, BoundaryFadeOverlayProps } from '@/components/boundary/types';
import type { Layer } from '@/components/layer/types';
import type { Annotation, AnnotationRendererProps } from '@/components/annotation/types';
import type { Toast, ToastType, MapViewControllerProps, ReadOnlyPolygonProps } from '@/components/map/types';

// Styles
import './map-editor.css';
import 'leaflet/dist/leaflet.css';


// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  tooltipAnchor: [0, -32],
});

// Component to render annotations on the map
const AnnotationRenderer: React.FC<AnnotationRendererProps> = ({
  annotations,
  layers,
  activeLayerId,
  onAnnotationClick,
  onAnnotationUpdated,
  onAnnotationDeleted,
  onTextAnnotationEdit,
}) => {
  const map = useMap();
  const layerRefsRef = useRef<Map<number, L.Layer>>(new Map());
  const annotationMapRef = useRef<Map<number, Annotation>>(new Map());

  useEffect(() => {
    // Clear existing annotation layers
    layerRefsRef.current.forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    layerRefsRef.current.clear();
    annotationMapRef.current.clear();

    // Create a map of layer IDs to visibility
    const layerVisibility = new Map<number, boolean>();
    layers.forEach(layer => {
      layerVisibility.set(layer.id!, layer.visible);
    });

    // Render each annotation
    annotations.forEach(annotation => {
      // Check if the layer is visible - completely skip if hidden
      const isVisible = layerVisibility.get(annotation.layer_id);
      if (isVisible === false) {
        return; // Skip hidden layers completely
      }

      let layer: L.Layer | null = null;
      const isInActiveLayer = annotation.layer_id === activeLayerId;

      // Derive the effective style: use the annotation's stored style for non-color
      // properties (weight, opacity, etc.) but always override color with the live
      // layer color so that layer color changes are reflected immediately.
      const annotationLayer = layers.find(l => l.id === annotation.layer_id);
      const layerColor = (annotationLayer?.config as any)?.color as string | undefined;
      const layerThickness = (annotationLayer?.config as any)?.line_thickness as number | undefined;
      const effectiveStyle = {
        ...(annotation.style || {}),
        ...(layerColor ? { color: layerColor, fillColor: layerColor } : {}),
        ...(layerThickness != null ? { weight: layerThickness } : {}),
      };

      if (annotation.annotation_type === 'marker') {
        const [lat, lng] = annotation.coordinates as [number, number];
        layer = L.marker([lat, lng]);
        
        if (annotation.content) {
          (layer as L.Marker).bindTooltip(annotation.content, {
            permanent: true,
            direction: 'top',
          });
        }
      } else if (annotation.annotation_type === 'line') {
        const coords = annotation.coordinates as [number, number][];
        layer = L.polyline(coords, effectiveStyle);
      } else if (annotation.annotation_type === 'polygon') {
        const coords = annotation.coordinates as [number, number][];
        layer = L.polygon(coords, effectiveStyle);
        
        if (annotation.content) {
          (layer as L.Polygon).bindTooltip(annotation.content, {
            permanent: true,
            direction: 'center',
            className: 'polygon-label',
          });
        }
      } else if (annotation.annotation_type === 'text') {
        const [lat, lng] = annotation.coordinates as [number, number];
        const fontSize = (annotation.style as any)?.fontSize || 20;
        layer = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'text-annotation',
            html: `<div style="white-space: nowrap; font-size: ${fontSize}px;">${annotation.content || ''}</div>`,
          }),
        });
      }

      if (layer) {
        // Only allow editing if in active layer
        if (isInActiveLayer) {
          // Enable Geoman editing for this layer
          (layer as any).options.pmIgnore = false;
          
          // Enable editing on the layer
          if (annotation.annotation_type !== 'text') {
            (layer as any).pm?.enable({
              allowSelfIntersection: false,
              snappable: true,
              snapDistance: 20,
            });
          }

          // Handle edit events
          layer.on('pm:edit', (e: any) => {
            if (onAnnotationUpdated) {
              const geoJSON = (layer as any).toGeoJSON();
              let newCoordinates: any;

              if (geoJSON.geometry.type === 'Point') {
                newCoordinates = [geoJSON.geometry.coordinates[1], geoJSON.geometry.coordinates[0]];
              } else if (geoJSON.geometry.type === 'LineString') {
                newCoordinates = geoJSON.geometry.coordinates.map(
                  (coord: number[]) => [coord[1], coord[0]]
                );
              } else if (geoJSON.geometry.type === 'Polygon') {
                newCoordinates = geoJSON.geometry.coordinates[0].map(
                  (coord: number[]) => [coord[1], coord[0]]
                );
              }

              onAnnotationUpdated({
                ...annotation,
                coordinates: newCoordinates,
              });
            }
          });

          // Handle remove events
          layer.on('pm:remove', (e: any) => {
            if (onAnnotationDeleted && annotation.id) {
              onAnnotationDeleted(annotation.id);
            }
          });

          // Add double-click handler to edit labels
          layer.on('dblclick', (e: any) => {
            L.DomEvent.stopPropagation(e);
            
            if (annotation.annotation_type === 'text') {
              if (onTextAnnotationEdit) {
                onTextAnnotationEdit(annotation);
              }
            } else if (annotation.annotation_type === 'marker' || annotation.annotation_type === 'polygon') {
              const currentLabel = annotation.content || '';
              const newLabel = prompt('Edit label:', currentLabel);
              if (newLabel !== null && onAnnotationUpdated) {
                onAnnotationUpdated({
                  ...annotation,
                  content: newLabel || undefined,
                });
              }
            }
          });
        } else {
          // Mark layer as read-only for Geoman
          (layer as any).options.pmIgnore = true;
        }
        
        // Add click handler
        layer.on('click', () => {
          onAnnotationClick?.(annotation);
        });

        layer.addTo(map);
        layerRefsRef.current.set(annotation.id!, layer);
        annotationMapRef.current.set(annotation.id!, annotation);
      }
    });

    // Cleanup on unmount
    return () => {
      layerRefsRef.current.forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      layerRefsRef.current.clear();
      annotationMapRef.current.clear();
    };
  }, [map, annotations, layers, activeLayerId, onAnnotationClick, onAnnotationUpdated, onAnnotationDeleted]);

  return null;
};

// Component to capture map instance for setting default view
const MapViewController: React.FC<MapViewControllerProps> = ({ onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
};

// Component to add a fade overlay outside the boundary
const BoundaryFadeOverlay: React.FC<BoundaryFadeOverlayProps> = ({ boundary }) => {
  const map = useMap();
  const overlayLayerRef = useRef<L.Polygon | null>(null);

  useEffect(() => {
    // Create a world-sized polygon with a hole for the boundary
    // This creates the inverse mask effect
    const worldBounds = [
      [-90, -180],
      [-90, 180],
      [90, 180],
      [90, -180],
      [-90, -180],
    ] as [number, number][];

    // Create a polygon with a hole (the boundary area)
    // The first array is the outer ring (world), the second is the hole (boundary)
    const polygonWithHole = L.polygon(
      [worldBounds, boundary.coordinates],
      {
        color: 'transparent',
        fillColor: '#ffffff',
        fillOpacity: 0.65,
        interactive: false,
        pane: 'overlayPane',
        pmIgnore: true, // Tell Geoman to ignore this layer completely
      }
    );

    // Add to map
    polygonWithHole.addTo(map);
    overlayLayerRef.current = polygonWithHole;
    
    // Disable Geoman for this layer to prevent deletion
    if (polygonWithHole.pm) {
      polygonWithHole.pm.disable();
      (polygonWithHole as any).pm._layerEditable = false;
    }

    // Update map events to detect when we need to update the overlay
    const updateOverlay = (): void => {
      // Force redraw if needed
      if (overlayLayerRef.current) {
        overlayLayerRef.current.redraw();
      }
    };

    map.on('zoomend moveend', updateOverlay);

    // Cleanup
    return () => {
      map.off('zoomend moveend', updateOverlay);
      if (overlayLayerRef.current) {
        map.removeLayer(overlayLayerRef.current);
        overlayLayerRef.current = null;
      }
    };
  }, [map, boundary]);

  return null;
};

// Component to render a read-only polygon that cannot be deleted
const ReadOnlyPolygon: React.FC<ReadOnlyPolygonProps> = ({ 
  positions, 
  pathOptions, 
  tooltipContent,
  onClick,
  showToast
}) => {
  const map = useMap();
  const polygonRef = useRef<L.Polygon | null>(null);

  useEffect(() => {
    const polygon = L.polygon(positions, {
      ...pathOptions,
      pmIgnore: true, // Tell Geoman to ignore this layer completely
    });
    polygon.addTo(map);
    polygonRef.current = polygon;

    // Mark this layer as non-editable for Geoman
    if (polygon.pm) {
      polygon.pm.disable();
      (polygon as any).pm._layerEditable = false;
    }

    // Prevent removal events on this layer
    const preventRemoval = (e: any) => {
      if (e.layer === polygon) {
        e.preventDefault();
        map.pm.disableGlobalRemovalMode();
        if (showToast) {
          showToast('This boundary cannot be deleted. It belongs to a parent map.', 'warning');
        }
        return false;
      }
    };

    polygon.on('pm:remove', preventRemoval);
    map.on('pm:remove', preventRemoval);

    // Add tooltip if provided
    if (tooltipContent) {
      polygon.bindTooltip(tooltipContent);
    }

    // Add click handler if provided
    if (onClick) {
      polygon.on('click', onClick);
    }

    // Cleanup
    return () => {
      polygon.off('pm:remove', preventRemoval);
      map.off('pm:remove', preventRemoval);
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
        polygonRef.current = null;
      }
    };
  }, [map, positions, pathOptions, tooltipContent, onClick]);

  return null;
};

interface AncestorBoundaryData {
  mapArea: MapArea;
  boundary: Boundary;
}

interface OpenMapTarget {
  id: number;
  name: string;
  areaType: 'suburb' | 'individual';
}

const getAreaTypeLabel = (areaType?: MapArea['area_type']): string => {
  switch (areaType) {
    case 'region':
      return 'Region';
    case 'suburb':
      return 'Suburb';
    case 'individual':
      return 'Individual';
    default:
      return '';
  }
};

const MapEditor: React.FC = () => {
  const { projectId, mapAreaId } = useParams<{
    projectId: string;
    mapAreaId: string;
  }>();
  const [project, setProject] = useState<Project | null>(null);
  const [mapArea, setMapArea] = useState<MapArea | null>(null);
  const [boundary, setBoundary] = useState<Boundary | null>(null);
  const [parentMapArea, setParentMapArea] = useState<MapArea | null>(null);
  const [parentBoundary, setParentBoundary] = useState<Boundary | null>(null);
  const [ancestorBoundaries, setAncestorBoundaries] = useState<AncestorBoundaryData[]>([]);
  const [suburbs, setSuburbs] = useState<MapArea[]>([]);
  const [suburbBoundaries, setSuburbBoundaries] = useState<Record<number, Boundary>>({});
  const [suburbIdsWithChildren, setSuburbIdsWithChildren] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef<number>(0);
  const [individuals, setIndividuals] = useState<MapArea[]>([]);
  const [individualBoundaries, setIndividualBoundaries] = useState<Record<number, Boundary>>({});
  const [hideEmptySuburbs, setHideEmptySuburbs] = useState(false);
  const [mode, setMode] = useState<'boundary' | 'annotation' | 'suburb' | 'individual'>('annotation');
  const [loading, setLoading] = useState(true);
  const [suburbName, setSuburbName] = useState('');
  const [showSuburbDialog, setShowSuburbDialog] = useState(false);
  const [pendingSuburbCoordinates, setPendingSuburbCoordinates] = useState<[number, number][] | null>(null);
  const [individualName, setIndividualName] = useState('');
  const [showIndividualDialog, setShowIndividualDialog] = useState(false);
  const [pendingIndividualCoordinates, setPendingIndividualCoordinates] = useState<[number, number][] | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [pendingBoundaryEdit, setPendingBoundaryEdit] = useState<[number, number][] | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<number | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationLayers, setAnnotationLayers] = useState<Map<number, L.Layer>>(new Map());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [editingTextAnnotation, setEditingTextAnnotation] = useState<Annotation | null>(null);
  const [editingTextContent, setEditingTextContent] = useState('');
  const [editingFontSize, setEditingFontSize] = useState<number>(20);
  const [showTileLayerSelector, setShowTileLayerSelector] = useState(false);
  const [openMapTarget, setOpenMapTarget] = useState<OpenMapTarget | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const lastCenteredMapId = useRef<string | null>(null);
  const navigate = useNavigate();

  // Toast notification helper
  const showToast = useCallback((message: string, type: ToastType = 'info'): void => {
    const id = toastIdRef.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number): void => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const handleOpenMapPrompt = useCallback(
    (id: number, name: string, areaType: OpenMapTarget['areaType']): void => {
      setOpenMapTarget({ id, name, areaType });
    },
    []
  );

  const handleCancelOpenMap = useCallback((): void => {
    setOpenMapTarget(null);
  }, []);

  const handleConfirmOpenMap = useCallback((): void => {
    if (!openMapTarget || !projectId) {
      return;
    }

    const selectedMapId = openMapTarget.id;
    setOpenMapTarget(null);
    navigate(`/projects/${projectId}/maps/${selectedMapId}`);
  }, [navigate, openMapTarget, projectId]);

  // Helper function for point-in-polygon test using ray-casting algorithm
  const isPointInPolygon = (point: L.LatLng, polygon: L.LatLng[]): boolean => {
    let inside = false;
    const x = point.lat;
    const y = point.lng;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;

      const intersect =
        ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Get current tile and label overlay configuration
  const currentTileLayerId = mapArea?.tile_layer || project?.tile_layer;
  const currentTileLayer = getTileLayer(currentTileLayerId);
  const currentStreetLabelOverlay = getStreetLabelOverlay(currentTileLayerId);

  // Handle tile layer change
  const handleTileLayerChange = async (layerId: string): Promise<void> => {
    if (!mapArea) return;
    
    try {
      await apiClient.updateMapArea(mapArea.id!, {
        tile_layer: layerId
      });
      
      setMapArea({ ...mapArea, tile_layer: layerId });
      setShowTileLayerSelector(false);
      showToast('Map style updated', 'success');
    } catch (error) {
      console.error('Failed to update tile layer:', error);
      showToast('Failed to update map style', 'error');
    }
  };

  const findInheritedBoundaryLayer = useCallback(
    (
      ancestorBoundary: Boundary,
      ancestorAreaType?: MapArea['area_type']
    ): Layer | undefined => {
      if (ancestorBoundary.layer_id) {
        const directMatch = layers.find(l =>
          l.parent_layer_id === ancestorBoundary.layer_id &&
          l.layer_type === 'boundary' &&
          !l.is_editable
        );

        if (directMatch) {
          return directMatch;
        }
      }

      const areaTypeLabel = getAreaTypeLabel(ancestorAreaType);
      if (!areaTypeLabel) {
        return undefined;
      }

      return layers.find(l =>
        l.layer_type === 'boundary' &&
        !l.is_editable &&
        l.name === `${areaTypeLabel} Boundary`
      );
    },
    [layers]
  );

  const getInheritedBoundaryPathOptions = useCallback(
    (
      ancestorBoundary: Boundary,
      ancestorAreaType?: MapArea['area_type']
    ): L.PathOptions => {
      const inheritedBoundaryLayer = findInheritedBoundaryLayer(
        ancestorBoundary,
        ancestorAreaType
      );
      const inheritedColor = inheritedBoundaryLayer?.config.color;
      const color = typeof inheritedColor === 'string'
        ? inheritedColor
        : '#e74c3c';

      return {
        color,
        weight: 3,
        fillColor: 'transparent',
        fillOpacity: 0,
        dashArray: '10, 10',
      };
    },
    [findInheritedBoundaryLayer]
  );

  const ancestorBoundariesToRender = React.useMemo(
    () => [...ancestorBoundaries].reverse(),
    [ancestorBoundaries]
  );

  const currentBoundaryPathOptions = React.useMemo(() => {
    // Get boundary layer color and thickness if available
    let color = '#e74c3c'; // Default red
    let lineThickness = 3;
    const isIndividualMap = mapArea?.area_type === 'individual';

    if (boundary?.layer_id) {
      const boundaryLayer = layers.find(l => l.id === boundary.layer_id);
      if (boundaryLayer?.config?.color) {
        color = boundaryLayer.config.color as string;
      }
      if (boundaryLayer?.config?.line_thickness) {
        lineThickness = boundaryLayer.config.line_thickness as number;
      }
    }

    return {
      color: color,
      weight: lineThickness,
      fillColor: color,
      fill: !isIndividualMap,
      fillOpacity: isIndividualMap ? 0 : 0.1,
    };
  }, [boundary, layers, mapArea?.area_type]);

  const suburbBoundaryPathOptions = React.useMemo(() => ({
    color: '#3498db',
    weight: 2,
    fillColor: '#3498db',
    fillOpacity: 0.15,
  }), []);

  const visibleSuburbBoundaryEntries = React.useMemo(() => {
    const entries = Object.entries(suburbBoundaries);
    if (!hideEmptySuburbs) {
      return entries;
    }

    return entries.filter(([suburbId]) =>
      suburbIdsWithChildren.has(parseInt(suburbId, 10))
    );
  }, [suburbBoundaries, hideEmptySuburbs, suburbIdsWithChildren]);

  const peerMapsLayerVisible = React.useMemo(() => {
    const peerMapsLayer = layers.find(l => l.id === -1);
    return peerMapsLayer?.visible ?? true;
  }, [layers]);

  const individualBoundaryPathOptions = React.useMemo(() => ({
    color: '#2ecc71',
    weight: 2,
    fillColor: '#2ecc71',
    fillOpacity: 0.15,
  }), []);

  useEffect(() => {
    loadMapData();
  }, [projectId, mapAreaId]);

  useEffect(() => {
    if (!openMapTarget) {
      return;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpenMapTarget(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [openMapTarget]);

  // Load layers after mapArea is loaded so we have the correct area_type
  useEffect(() => {
    if (mapArea) {
      loadLayers(mapArea.area_type);
    }
  }, [mapArea?.id, mapArea?.area_type]);

  // Recenter to default view when opening a new map
  useEffect(() => {
    if (!mapInstance || !mapArea) return;

    const currentMapId = String(mapArea.id ?? mapAreaId ?? '');
    if (!currentMapId || lastCenteredMapId.current === currentMapId) {
      return;
    }

    const centerLat = mapArea.default_center_lat ?? project?.center_lat;
    const centerLon = mapArea.default_center_lon ?? project?.center_lon;
    const zoom = mapArea.default_zoom ?? project?.zoom_level;

    if (centerLat != null && centerLon != null && zoom != null) {
      mapInstance.setView([centerLat, centerLon], zoom, { animate: false });
      lastCenteredMapId.current = currentMapId;
    }
  }, [mapArea, mapAreaId, mapInstance, project]);

  // Handle map resize when expanded/collapsed
  useEffect(() => {
    if (mapInstance) {
      // Use setTimeout to ensure DOM has updated before invalidating size
      const timer = setTimeout(() => {
        mapInstance.invalidateSize();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isMapExpanded, mapInstance]);

  // Animate export progress bar asymptotically toward 95% while exporting
  useEffect(() => {
    if (!isExporting) {
      setExportProgress(0);
      return;
    }
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => prev + (95 - prev) * 0.011);
    }, 1000);
    return () => clearInterval(interval);
  }, [isExporting]);

  const loadLayers = async (areaType?: string): Promise<void> => {
    if (!mapAreaId) return;

    try {
      const numericMapAreaId = parseInt(mapAreaId);
      const loadedLayers = await apiClient.listLayers(numericMapAreaId);
      
      // Add synthetic "Peer Maps" layer for individual maps
      let layersToSet = loadedLayers;
      if (areaType === 'individual') {
        // Preserve current synthetic visibility instead of resetting on every reload.
        const existingPeerMapsLayer = layers.find(
          l => l.id === -1 && l.map_area_id === numericMapAreaId
        );

        const peerMapsLayer: Layer = {
          id: -1, // Synthetic ID for peer maps layer
          map_area_id: numericMapAreaId,
          name: 'Peer Maps',
          layer_type: 'boundary',
          visible: existingPeerMapsLayer?.visible ?? true,
          z_index: 0,
          is_editable: false,
          config: { color: '#2ecc71' }, // Green to match individual map boundaries
        };
        layersToSet = [...loadedLayers, peerMapsLayer];
      }
      
      setLayers(layersToSet);
      
      // Set first editable annotation layer as active by default if no layer is currently active
      const editableLayers = layersToSet.filter(l => l.is_editable && l.layer_type === 'annotation');
      
      // Use functional update to check current state value
      setActiveLayerId(currentActiveId => {
        // If there are no editable layers, clear the active layer
        if (editableLayers.length === 0) {
          return null;
        }
        // If there's no active layer, or the active layer no longer exists, set the first editable layer as active
        const currentActiveLayerExists = editableLayers.some(l => l.id === currentActiveId);
        if (!currentActiveId || !currentActiveLayerExists) {
          return editableLayers[0].id!;
        }
        return currentActiveId;
      });

      // Load annotations for all layers (skip synthetic peer maps layer)
      await loadAllAnnotations(loadedLayers);
    } catch (error) {
      console.error('Failed to load layers:', error);
    }
  };

  const loadAllAnnotations = async (layerList: Layer[]): Promise<void> => {
    try {
      const allAnnotations: Annotation[] = [];
      await Promise.all(
        layerList.map(async (layer) => {
          try {
            const layerAnnotations = await apiClient.listAnnotations(layer.id!);
            allAnnotations.push(...layerAnnotations);
          } catch (error) {
            console.error(`Failed to load annotations for layer ${layer.id}:`, error);
          }
        })
      );
      setAnnotations(allAnnotations);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    }
  };

  const loadMapData = async (): Promise<void> => {
    if (!projectId || !mapAreaId) return;

    try {
      const [projectData, mapAreaData] = await Promise.all([
        apiClient.getProject(parseInt(projectId)),
        apiClient.getMapArea(parseInt(mapAreaId)),
      ]);
      setProject(projectData);
      setMapArea(mapAreaData);

      // Load boundary if it exists
      try {
        const boundaryData = await apiClient.getBoundaryByMapArea(
          parseInt(mapAreaId)
        );
        setBoundary(boundaryData);
      } catch (error) {
        console.error('Failed to load boundary:', error);
        setBoundary(null);
      }

      setParentMapArea(null);
      setParentBoundary(null);
      setAncestorBoundaries([]);

      // If this is a suburb or individual map, load the full parent chain and boundaries
      if (mapAreaData.parent_id) {
        const ancestorMapAreas: MapArea[] = [];
        let currentAncestorId: number | undefined = mapAreaData.parent_id;

        while (currentAncestorId) {
          try {
            const ancestorMapArea = await apiClient.getMapArea(currentAncestorId);
            ancestorMapAreas.push(ancestorMapArea);
            currentAncestorId = ancestorMapArea.parent_id;
          } catch (error) {
            console.error('Failed to load ancestor map area:', error);
            break;
          }
        }

        const immediateParent = ancestorMapAreas[0] ?? null;
        setParentMapArea(immediateParent);

        const loadedAncestorBoundaries = (
          await Promise.all(
            ancestorMapAreas.map(async (ancestorMapArea) => {
              try {
                const ancestorBoundary = await apiClient.getBoundaryByMapArea(
                  ancestorMapArea.id!
                );

                if (!ancestorBoundary) {
                  return null;
                }

                return {
                  mapArea: ancestorMapArea,
                  boundary: ancestorBoundary,
                };
              } catch (error) {
                console.error(
                  `Failed to load boundary for ancestor map area ${ancestorMapArea.id}:`,
                  error
                );
                return null;
              }
            })
          )
        ).filter(
          (
            ancestorBoundaryData
          ): ancestorBoundaryData is AncestorBoundaryData =>
            ancestorBoundaryData !== null
        );

        setAncestorBoundaries(loadedAncestorBoundaries);
        setParentBoundary(
          loadedAncestorBoundaries.find(
            ancestorBoundaryData => ancestorBoundaryData.mapArea.id === immediateParent?.id
          )?.boundary ?? null
        );
      }

      // Load child map areas based on type
      if (mapAreaData.area_type === 'region') {
        // Region view should only display suburb-level children.
        setIndividuals([]);
        setIndividualBoundaries({});

        // Load suburbs for region maps
        try {
          const [suburbsData, hierarchyData] = await Promise.all([
            apiClient.listMapAreas(
              parseInt(projectId),
              parseInt(mapAreaId)
            ),
            apiClient.getMapHierarchy(parseInt(projectId)),
          ]);

          setSuburbs(suburbsData);
          setSuburbIdsWithChildren(
            new Set(
              hierarchyData.individuals
                .map((individual) => individual.parent_id)
                .filter((parentId): parentId is number => typeof parentId === 'number')
            )
          );

          // Load boundaries for each suburb
          const boundaries: Record<number, Boundary> = {};
          await Promise.all(
            suburbsData.map(async (suburb) => {
              try {
                const suburbBoundary = await apiClient.getBoundaryByMapArea(
                  suburb.id!
                );
                if (suburbBoundary) {
                  boundaries[suburb.id!] = suburbBoundary;
                }
              } catch (error) {
                console.log(`No boundary for suburb ${suburb.id}`);
              }
            })
          );
          setSuburbBoundaries(boundaries);
        } catch (error) {
          console.error('Failed to load suburbs:', error);
          setSuburbs([]);
          setSuburbBoundaries({});
          setSuburbIdsWithChildren(new Set());
        }
      } else if (mapAreaData.area_type === 'suburb') {
        // Load individuals for suburb maps
        try {
          const individualsData = await apiClient.listMapAreas(
            parseInt(projectId),
            parseInt(mapAreaId)
          );
          setIndividuals(individualsData);

          // Load boundaries for each individual map
          const boundaries: Record<number, Boundary> = {};
          await Promise.all(
            individualsData.map(async (individual) => {
              try {
                const individualBoundary = await apiClient.getBoundaryByMapArea(
                  individual.id!
                );
                if (individualBoundary) {
                  boundaries[individual.id!] = individualBoundary;
                }
              } catch (error) {
                console.log(`No boundary for individual ${individual.id}`);
              }
            })
          );
          setIndividualBoundaries(boundaries);
        } catch (error) {
          console.error('Failed to load individuals:', error);
        }
        // Clear suburbs since we're not viewing a region
        setSuburbs([]);
        setSuburbBoundaries({});
        setSuburbIdsWithChildren(new Set());
      } else if (mapAreaData.area_type === 'individual') {
        // For individual maps, load siblings (other individuals in the same suburb)
        try {
          const siblingsData = await apiClient.listMapAreas(
            parseInt(projectId),
            mapAreaData.parent_id!
          );
          setIndividuals(siblingsData);

          // Load boundaries for each sibling individual map
          const boundaries: Record<number, Boundary> = {};
          await Promise.all(
            siblingsData.map(async (individual) => {
              try {
                const individualBoundary = await apiClient.getBoundaryByMapArea(
                  individual.id!
                );
                if (individualBoundary) {
                  boundaries[individual.id!] = individualBoundary;
                }
              } catch (error) {
                console.log(`No boundary for individual ${individual.id}`);
              }
            })
          );
          setIndividualBoundaries(boundaries);
        } catch (error) {
          console.error('Failed to load sibling individual maps:', error);
        }
        // Clear suburbs since we're not viewing a region
        setSuburbs([]);
        setSuburbBoundaries({});
        setSuburbIdsWithChildren(new Set());
      } else {
        // For region maps, clear individuals and their boundaries
        setIndividuals([]);
        setIndividualBoundaries({});
        setSuburbs([]);
        setSuburbBoundaries({});
        setSuburbIdsWithChildren(new Set());
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBoundaryCreated = useCallback(async (
    coordinates: [number, number][]
  ): Promise<void> => {
    if (!mapAreaId) return;

    if (mode === 'suburb') {
      // Validate that suburb is within region boundary
      if (boundary && !isWithinBoundary(coordinates, boundary.coordinates)) {
        showToast('Suburb boundary must be completely within the region map boundary. Please draw within the red boundary.', 'error');
        return;
      }
      // Store coordinates and show dialog to name the suburb
      setPendingSuburbCoordinates(coordinates);
      setShowSuburbDialog(true);
      return;
    }

    if (mode === 'individual') {
      // Validate that individual map is within suburb boundary
      if (boundary && !isWithinBoundary(coordinates, boundary.coordinates)) {
        showToast('Individual map boundary must be completely within the suburb boundary. Please draw within the blue boundary.', 'error');
        return;
      }
      
      // Store coordinates and show dialog to name the individual map
      setPendingIndividualCoordinates(coordinates);
      setShowIndividualDialog(true);
      return;
    }

    // In boundary mode with existing boundary, store pending edit
    if (mode === 'boundary') {
      if (boundary) {
        setPendingBoundaryEdit(coordinates);
        return;
      } else {
        // Create new boundary
        try {
          const created = await apiClient.createBoundary({
            map_area_id: parseInt(mapAreaId),
            coordinates,
          });
          setBoundary(created);
          showToast('Boundary created successfully!', 'success');
          setMode('annotation');
        } catch (error) {
          console.error('Failed to create boundary:', error);
          showToast('Failed to create boundary. Please try again.', 'error');
        }
      }
    }
  }, [mapAreaId, mode, boundary]);

  const handleCreateSuburb = async (): Promise<void> => {
    if (!projectId || !suburbName || !pendingSuburbCoordinates) return;

    try {
      // Capture the current map view to inherit from parent
      let defaultCenterLat: number | undefined;
      let defaultCenterLon: number | undefined;
      let defaultZoom: number | undefined;
      
      if (mapInstance) {
        const currentCenter = mapInstance.getCenter();
        defaultCenterLat = currentCenter.lat;
        defaultCenterLon = currentCenter.lng;
        defaultZoom = mapInstance.getZoom();
      } else {
        // Fallback to stored defaults if map instance not available
        defaultCenterLat = mapArea?.default_center_lat ?? project?.center_lat;
        defaultCenterLon = mapArea?.default_center_lon ?? project?.center_lon;
        defaultZoom = mapArea?.default_zoom ?? project?.zoom_level;
      }
      
      // Create the suburb map area with inherited default view from parent
      const suburb = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        parent_id: parseInt(mapAreaId!),
        name: suburbName,
        area_type: 'suburb',
        default_center_lat: defaultCenterLat,
        default_center_lon: defaultCenterLon,
        default_zoom: defaultZoom,
      });

      // Create the boundary for the suburb
      await apiClient.createBoundary({
        map_area_id: suburb.id!,
        coordinates: pendingSuburbCoordinates,
      });

      showToast(`Suburb "${suburbName}" created successfully!`, 'success');
      
      // Reset state
      setShowSuburbDialog(false);
      setSuburbName('');
      setPendingSuburbCoordinates(null);
      setMode('annotation');

      // Reload map data to show the new suburb
      loadMapData();
    } catch (error) {
      console.error('Failed to create suburb:', error);
      showToast('Failed to create suburb. Please try again.', 'error');
    }
  };

  const handleCancelSuburb = (): void => {
    setShowSuburbDialog(false);
    setSuburbName('');
    setPendingSuburbCoordinates(null);
    setMode('annotation');
  };

  const handleAnnotationCreated = async (
    annotation: Annotation
  ): Promise<void> => {
    try {
      const created = await apiClient.createAnnotation(annotation);
      setAnnotations(prev => [...prev, created]);
      showToast('Annotation saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to create annotation:', error);
      // Extract error message from the response if available
      let errorMessage = 'Failed to save annotation. Please try again.';
      if (error instanceof Error && 'response' in error) {
        const response = (error as any).response?.data;
        if (response?.error) {
          errorMessage = response.error;
        }
      }
      showToast(errorMessage, 'error');
    }
  };

  const handleAnnotationClick = (annotation: Annotation): void => {
    const layer = layers.find(l => l.id === annotation.layer_id);
    if (layer && !layer.is_editable) {
      showToast(`This annotation is in layer "${layer.name}" which is inherited and cannot be edited`, 'info');
    } else if (annotation.layer_id !== activeLayerId) {
      showToast('You can only edit annotations in the currently selected layer', 'warning');
    } else {
      // Annotation is in the active layer and can be edited
      console.log('Annotation clicked:', annotation);
    }
  };

  const handleAnnotationUpdated = async (annotation: Annotation): Promise<void> => {
    try {
      const updated = await apiClient.updateAnnotation(annotation.id!, {
        coordinates: annotation.coordinates,
        content: annotation.content,
        style: annotation.style,
      });
      
      // Update the annotation in state
      setAnnotations(prev => 
        prev.map(a => a.id === updated.id ? updated : a)
      );
      
      showToast('Annotation updated successfully!', 'success');
      
      // Reload to refresh the display
      await loadMapData();
    } catch (error) {
      console.error('Failed to update annotation:', error);
      showToast('Failed to update annotation. Please try again.', 'error');
    }
  };

  const handleTextAnnotationEdit = (annotation: Annotation): void => {
    setEditingTextAnnotation(annotation);
    setEditingTextContent(annotation.content || '');
    setEditingFontSize((annotation.style as any)?.fontSize || 20);
  };

  const handleTextAnnotationSave = async (): Promise<void> => {
    if (!editingTextAnnotation) return;
    try {
      const updated = await apiClient.updateAnnotation(editingTextAnnotation.id!, {
        coordinates: editingTextAnnotation.coordinates,
        content: editingTextContent,
        style: { ...editingTextAnnotation.style, fontSize: editingFontSize },
      });
      setAnnotations(prev => prev.map(a => a.id === updated.id ? updated : a));
      showToast('Text annotation updated!', 'success');
      setEditingTextAnnotation(null);
      await loadMapData();
    } catch (error) {
      console.error('Failed to update text annotation:', error);
      showToast('Failed to update text annotation. Please try again.', 'error');
    }
  };

  const handleAnnotationDeleted = async (annotationId: number): Promise<void> => {
    try {
      await apiClient.deleteAnnotation(annotationId);
      
      // Remove the annotation from state
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      
      showToast('Annotation deleted successfully!', 'success');
    } catch (error) {
      console.error('Failed to delete annotation:', error);
      showToast('Failed to delete annotation. Please try again.', 'error');
    }
  };

  const saveBoundaryEdit = async (): Promise<void> => {
    if (!boundary || !pendingBoundaryEdit) return;

    try {
      const updated = await apiClient.updateBoundary(
        boundary.id!,
        pendingBoundaryEdit
      );
      setBoundary(updated);
      setPendingBoundaryEdit(null);
      setMode('annotation');
      showToast('Boundary updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to save boundary:', error);
      showToast('Failed to save boundary. Please try again.', 'error');
    }
  };

  const cancelBoundaryEdit = (): void => {
    setPendingBoundaryEdit(null);
    setMode('annotation');
    // Reload to reset the boundary display
    loadMapData();
  };

  const handleCreateIndividual = async (): Promise<void> => {
    if (!projectId || !individualName || !pendingIndividualCoordinates) return;

    try {
      // Capture the current map view to inherit from parent
      let defaultCenterLat: number | undefined;
      let defaultCenterLon: number | undefined;
      let defaultZoom: number | undefined;
      
      if (mapInstance) {
        const currentCenter = mapInstance.getCenter();
        defaultCenterLat = currentCenter.lat;
        defaultCenterLon = currentCenter.lng;
        defaultZoom = mapInstance.getZoom();
      } else {
        // Fallback to stored defaults if map instance not available
        defaultCenterLat = mapArea?.default_center_lat ?? project?.center_lat;
        defaultCenterLon = mapArea?.default_center_lon ?? project?.center_lon;
        defaultZoom = mapArea?.default_zoom ?? project?.zoom_level;
      }
      
      // Create the individual map area with inherited default view from parent
      const individual = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        parent_id: parseInt(mapAreaId!),
        name: individualName,
        area_type: 'individual',
        default_center_lat: defaultCenterLat,
        default_center_lon: defaultCenterLon,
        default_zoom: defaultZoom,
      });

      // Create the boundary for the individual map
      await apiClient.createBoundary({
        map_area_id: individual.id!,
        coordinates: pendingIndividualCoordinates,
      });

      showToast(`Individual map "${individualName}" created successfully!`, 'success');
      
      // Reset state
      setShowIndividualDialog(false);
      setIndividualName('');
      setPendingIndividualCoordinates(null);
      setMode('annotation');

      // Reload map data to show the new individual map
      loadMapData();
    } catch (error) {
      console.error('Failed to create individual map:', error);
      showToast('Failed to create individual map. Please try again.', 'error');
    }
  };

  const handleCancelIndividual = (): void => {
    setShowIndividualDialog(false);
    setIndividualName('');
    setPendingIndividualCoordinates(null);
    setMode('annotation');
  };

  const startRenaming = (): void => {
    setIsEditingName(true);
    setEditingName(mapArea?.name || '');
  };

  const cancelRenaming = (): void => {
    setIsEditingName(false);
    setEditingName('');
  };

  const handleRename = async (): Promise<void> => {
    if (!mapAreaId || !editingName.trim()) {
      cancelRenaming();
      return;
    }

    try {
      const updated = await apiClient.updateMapArea(parseInt(mapAreaId), {
        name: editingName.trim(),
      });
      setMapArea(updated);
      cancelRenaming();
    } catch (error) {
      console.error('Failed to rename map:', error);
      showToast('Failed to rename. Please try again.', 'error');
    }
  };

  const handleExport = async (options: ExportOptions): Promise<void> => {
    if (!mapAreaId || !mapArea) return;

    setIsExporting(true);
    setShowExportDialog(false);

    try {
      const blob = await apiClient.generateExport(parseInt(mapAreaId), {
        zoom: options.zoom,
        include_annotations: options.includeAnnotations,
        include_boundary: options.includeBoundary,
        tile_layer: currentTileLayerId,
        line_width_multiplier: options.lineWidthMultiplier,
      });

      // Trigger browser download
      const filename = `${mapArea.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      showToast('Map exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export map. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSetDefaultView = async (): Promise<void> => {
    if (!mapInstance || !mapAreaId) return;

    const center = mapInstance.getCenter();
    const zoom = mapInstance.getZoom();

    try {
      const updated = await apiClient.updateMapArea(parseInt(mapAreaId), {
        default_center_lat: center.lat,
        default_center_lon: center.lng,
        default_zoom: zoom,
      });
      
      // Update the mapArea state with the new values
      // This prevents the map from jumping when the component re-renders
      setMapArea(updated);

      showToast(`Default view saved! (Zoom: ${zoom})`, 'success');
    } catch (error) {
      console.error('Failed to set default view:', error);
      showToast('Failed to save default view. Please try again.', 'error');
    }
  };

  const handleRecenterToDefault = (): void => {
    if (!mapInstance || !mapArea) return;

    // Use map's default view if set, otherwise fall back to project defaults
    const centerLat = mapArea.default_center_lat ?? project?.center_lat;
    const centerLon = mapArea.default_center_lon ?? project?.center_lon;
    const zoom = mapArea.default_zoom ?? project?.zoom_level;

    if (centerLat && centerLon && zoom) {
      mapInstance.setView([centerLat, centerLon], zoom, {
        animate: true,
        duration: 0.5,
      });
      showToast('Recentered to default view', 'info');
    } else {
      showToast('No default view has been set for this map', 'warning');
    }
  };

  if (loading) {
    return <div className="loading">Loading map...</div>;
  }

  if (!project || !mapArea) {
    return <div className="error">Map not found</div>;
  }

  return (
    <div className="map-editor-page">
      <div className="editor-header">
        <div>
          {isEditingName ? (
            <input
              type="text"
              className="editor-title-input"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                } else if (e.key === 'Escape') {
                  cancelRenaming();
                }
              }}
              onBlur={handleRename}
              autoFocus
            />
          ) : (
            <h2 onDoubleClick={startRenaming}>
              {mapArea.name}
              <button
                className="btn-icon"
                onClick={startRenaming}
                title="Rename"
              >
                ✏️
              </button>
            </h2>
          )}
          <p className="breadcrumb">
            {project.name} / {mapArea.area_type}
          </p>
        </div>
        <div className="editor-actions">
          {mode === 'boundary' && pendingBoundaryEdit ? (
            <>
              <button
                className="btn btn-success"
                onClick={saveBoundaryEdit}
              >
                Save Boundary
              </button>
              <button
                className="btn btn-outline"
                onClick={cancelBoundaryEdit}
              >
                Cancel
              </button>
              <p className="mode-hint">
                Changes detected. Click "Save Boundary" to keep your edits.
              </p>
            </>
          ) : mode === 'boundary' ? (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setMode('annotation')}
              >
                Cancel
              </button>
              <p className="mode-hint">
                {boundary
                  ? 'Click "Edit annotations" button on the map to modify the boundary'
                  : 'Draw a polygon or rectangle to define the boundary'}
              </p>
            </>
          ) : mode === 'suburb' ? (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setMode('annotation')}
              >
                Cancel
              </button>
              <p className="mode-hint">
                Draw a polygon or rectangle to define the suburb boundary
              </p>
            </>
          ) : mode === 'individual' ? (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setMode('annotation')}
              >
                Cancel
              </button>
              <p className="mode-hint">
                Draw a polygon or rectangle to define the individual map boundary
              </p>
            </>
          ) : (
            <>
              {mapArea.area_type === 'region' && (
                <button
                  className="btn btn-success"
                  onClick={() => setMode('suburb')}
                  disabled={!boundary}
                  title={!boundary ? 'Define a boundary for this region before adding suburbs' : 'Add a suburb to this region'}
                >
                  Add Suburb
                </button>
              )}
              {mapArea.area_type === 'region' && (
                <div className="suburb-filter-control">
                  <span className="suburb-filter-label">Hide Empty Suburbs</span>
                  <label className="suburb-filter-switch" title="Hide suburbs that have no child maps">
                    <input
                      type="checkbox"
                      checked={hideEmptySuburbs}
                      onChange={(e) => setHideEmptySuburbs(e.target.checked)}
                      aria-label="Hide suburbs that have no child maps"
                    />
                    <span className="suburb-filter-slider" />
                  </label>
                </div>
              )}
              {mapArea.area_type === 'suburb' && (
                <button
                  className="btn btn-success"
                  onClick={() => setMode('individual')}
                  disabled={!boundary}
                  title={!boundary ? 'Define a boundary for this suburb before adding individual maps' : 'Add an individual map to this suburb'}
                >
                  Add Individual Map
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={() => setMode('boundary')}
              >
                {boundary ? 'Edit Boundary' : 'Define Boundary'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleSetDefaultView}
                title="Set current map view as default for this map"
              >
                Set Default View
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleRecenterToDefault}
                title="Recenter map to the default view"
                disabled={!mapArea.default_center_lat && !project?.center_lat}
              >
                Recenter to Default
              </button>
              <button 
                className="btn btn-icon" 
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                title={isMapExpanded ? 'Collapse map view' : 'Expand map view'}
                style={{ fontSize: '1.25rem' }}
              >
                {isMapExpanded ? '⊡' : '⛶'}
              </button>
              <button 
                className="btn btn-info" 
                onClick={() => setShowTileLayerSelector(!showTileLayerSelector)}
                title="Change map style"
              >
                Map Style
              </button>
              <button 
                className="btn btn-success" 
                onClick={() => setShowExportDialog(true)}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export PNG'}
              </button>
              {parentMapArea && (
                <button
                  className="btn btn-outline"
                  onClick={() => navigate(`/projects/${projectId}/maps/${parentMapArea.id}`)}
                  title={`Back to ${parentMapArea.name}`}
                >
                  Back to Parent
                </button>
              )}
              <button
                className="btn btn-outline"
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                Back to Project
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`editor-content ${isMapExpanded ? 'editor-content-expanded' : ''}`}>
        {/* Sidebar for layer management */}
        <div className={`editor-sidebar ${isMapExpanded ? 'editor-sidebar-hidden' : ''}`}>
          {mapAreaId && (
            <LayerManager 
              mapAreaId={parseInt(mapAreaId)}
              areaType={mapArea?.area_type as 'region' | 'suburb' | 'individual' | undefined}
              showToast={showToast}
              activeLayerId={activeLayerId}
              onActiveLayerChange={setActiveLayerId}
              onLayersChange={() => loadLayers(mapArea?.area_type)}
              onSyntheticLayerVisibilityChange={(layerId, visible) => {
                // Update synthetic layer visibility in map-editor's layers state
                setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible } : l));
              }}
            />
          )}
        </div>

        {/* Map container */}
        <div className="map-container">
        <MapContainer
          key={`map-${mapAreaId}`}
          center={[
            mapArea.default_center_lat ?? project.center_lat,
            mapArea.default_center_lon ?? project.center_lon,
          ]}
          zoom={mapArea.default_zoom ?? project.zoom_level}
          zoomDelta={0.5}
          zoomSnap={0.5}
          wheelPxPerZoomLevel={120}
          style={{ height: '100%', width: '100%' }}
        >
          <MapViewController onMapReady={setMapInstance} />
          <TileLayer
            key={currentTileLayer.id}
            attribution={currentTileLayer.attribution}
            url={currentTileLayer.url}
            maxZoom={currentTileLayer.maxZoom}
            subdomains={currentTileLayer.subdomains ?? 'abc'}
            zoomOffset={currentTileLayer.baseZoomOffset ?? 0}
            tileSize={currentTileLayer.baseTileSize ?? 256}
          />
          {currentStreetLabelOverlay && (
            <Pane name="street-labels-pane" style={{ zIndex: 350, pointerEvents: 'none' }}>
              <TileLayer
                key={`street-labels-${currentTileLayer.id}-${currentStreetLabelOverlay.zoomOffset ?? 0}`}
                pane="street-labels-pane"
                attribution={currentStreetLabelOverlay.attribution}
                url={currentStreetLabelOverlay.url}
                maxZoom={currentStreetLabelOverlay.maxZoom}
                minZoom={1}
                subdomains={currentStreetLabelOverlay.subdomains ?? 'abc'}
                zoomOffset={currentStreetLabelOverlay.zoomOffset ?? 0}
                tileSize={currentStreetLabelOverlay.tileSize ?? 256}
              />
            </Pane>
          )}
          {boundary && mode !== 'boundary' && (mapArea.area_type === 'region' || mapArea.area_type === 'suburb' || mapArea.area_type === 'individual') && (() => {
            // Check if boundary layer is visible
            if (boundary.layer_id) {
              const boundaryLayer = layers.find(l => l.id === boundary.layer_id);
              if (boundaryLayer && !boundaryLayer.visible) {
                return null;
              }
            }
            return <BoundaryFadeOverlay boundary={boundary} />;
          })()}
          {parentBoundary &&
            mapArea.area_type === 'individual' &&
            mode !== 'individual' &&
            (() => {
              const inheritedBoundaryLayer = findInheritedBoundaryLayer(
                parentBoundary,
                parentMapArea?.area_type
              );

              if (inheritedBoundaryLayer && !inheritedBoundaryLayer.visible) {
                return null;
              }

              return <BoundaryFadeOverlay boundary={parentBoundary} />;
            })()}
          {ancestorBoundariesToRender.length > 0 &&
            mode !== 'individual' &&
            (mapArea.area_type === 'suburb' || mapArea.area_type === 'individual') &&
            ancestorBoundariesToRender.map(({ mapArea: ancestorMapArea, boundary: ancestorBoundary }) => {
              const inheritedBoundaryLayer = findInheritedBoundaryLayer(
                ancestorBoundary,
                ancestorMapArea.area_type
              );

              if (inheritedBoundaryLayer && !inheritedBoundaryLayer.visible) {
                return null;
              }

              return (
                <ReadOnlyPolygon
                  key={`ancestor-boundary-${ancestorMapArea.id}`}
                  positions={ancestorBoundary.coordinates}
                  pathOptions={getInheritedBoundaryPathOptions(
                    ancestorBoundary,
                    ancestorMapArea.area_type
                  )}
                  showToast={showToast}
                />
              );
            })}
          {boundary && mode !== 'boundary' && (() => {
            // Check if boundary layer is visible
            if (boundary.layer_id) {
              const boundaryLayer = layers.find(l => l.id === boundary.layer_id);
              if (boundaryLayer && !boundaryLayer.visible) {
                return null;
              }
            }
            return (
              <ReadOnlyPolygon
                positions={boundary.coordinates}
                pathOptions={currentBoundaryPathOptions}
                showToast={showToast}
              />
            );
          })()}
          {visibleSuburbBoundaryEntries.map(([suburbId, suburbBoundary]) => {
            const parsedSuburbId = parseInt(suburbId, 10);
            const suburb = suburbs.find(s => s.id === parsedSuburbId);
            return (
              <ReadOnlyPolygon
                key={suburbId}
                positions={suburbBoundary.coordinates}
                pathOptions={suburbBoundaryPathOptions}
                tooltipContent={suburb?.name || 'Unnamed Suburb'}
                onClick={mode === 'annotation' || mode === 'boundary' ? () => {
                  handleOpenMapPrompt(
                    parsedSuburbId,
                    suburb?.name || 'Unnamed Suburb',
                    'suburb'
                  );
                } : undefined}
                showToast={showToast}
              />
            );
          })}
          {(mapArea.area_type === 'suburb' || mapArea.area_type === 'individual') && peerMapsLayerVisible && Object.entries(individualBoundaries).map(([individualId, individualBoundary]) => {
            const parsedIndividualId = parseInt(individualId, 10);

            // Don't render the current map's boundary here - it's rendered above in red
            if (parsedIndividualId === parseInt(mapAreaId || '0', 10)) {
              return null;
            }

            const individual = individuals.find(i => i.id === parsedIndividualId);

            return (
              <ReadOnlyPolygon
                key={individualId}
                positions={individualBoundary.coordinates}
                pathOptions={individualBoundaryPathOptions}
                tooltipContent={individual?.name || 'Unnamed Map'}
                onClick={mode === 'annotation' || mode === 'boundary' || mode === 'suburb' ? () => {
                  handleOpenMapPrompt(
                    parsedIndividualId,
                    individual?.name || 'Unnamed Map',
                    'individual'
                  );
                } : undefined}
                showToast={showToast}
              />
            );
          })}
          <AnnotationRenderer
            annotations={annotations}
            layers={layers}
            activeLayerId={activeLayerId}
            onAnnotationClick={handleAnnotationClick}
            onAnnotationUpdated={handleAnnotationUpdated}
            onAnnotationDeleted={handleAnnotationDeleted}
            onTextAnnotationEdit={handleTextAnnotationEdit}
          />
          <DrawControls
            mode={mode}
            existingBoundary={
              mode === 'boundary' && boundary
                ? {
                    ...boundary,
                    coordinates: pendingBoundaryEdit || boundary.coordinates,
                  }
                : null
            }
            onBoundaryCreated={handleBoundaryCreated}
            showToast={showToast}
            activeLayerId={activeLayerId}
            onAnnotationCreated={handleAnnotationCreated}
            layers={layers}
          />
        </MapContainer>

        {/* Tile Layer Selector Panel */}
        {showTileLayerSelector && (
          <div className="tile-layer-selector">
            <div className="tile-layer-header">
              <h3>Map Style</h3>
              <button
                className="btn-close"
                onClick={() => setShowTileLayerSelector(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="tile-layer-options">
              {TILE_LAYER_OPTIONS.map(layer => (
                <div
                  key={layer.id}
                  className={`tile-layer-option ${
                    currentTileLayer.id === layer.id ? 'active' : ''
                  }`}
                  onClick={() => handleTileLayerChange(layer.id)}
                >
                  <div className="tile-layer-name">
                    {layer.name}
                    {currentTileLayer.id === layer.id && (
                      <span className="check-icon">✓</span>
                    )}
                  </div>
                  <div className="tile-layer-description">
                    {layer.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {openMapTarget && (
        <div className="dialog-overlay" onClick={handleCancelOpenMap}>
          <div
            className="dialog map-open-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="open-map-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="map-open-dialog-icon" aria-hidden="true">
              {openMapTarget.areaType === 'suburb' ? '📍' : '🗺️'}
            </div>
            <h3 id="open-map-dialog-title">Open {openMapTarget.name}?</h3>
            <p>
              You are about to switch to the {openMapTarget.areaType === 'suburb' ? 'suburb' : 'individual'} editor.
            </p>
            <div className="map-open-dialog-meta">
              <span className="map-open-dialog-badge">
                {openMapTarget.areaType === 'suburb' ? 'Suburb' : 'Individual Map'}
              </span>
              <span className="map-open-dialog-name">{openMapTarget.name}</span>
            </div>
            <div className="dialog-actions">
              <button className="btn btn-outline" onClick={handleCancelOpenMap}>
                Stay Here
              </button>
              <button className="btn btn-primary" onClick={handleConfirmOpenMap} autoFocus>
                Open Map
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuburbDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Create Suburb</h3>
            <p>Enter a name for this suburb:</p>
            <input
              type="text"
              className="input"
              placeholder="Suburb name"
              value={suburbName}
              onChange={(e) => setSuburbName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && suburbName) {
                  handleCreateSuburb();
                }
              }}
              autoFocus
            />
            <div className="dialog-actions">
              <button
                className="btn btn-outline"
                onClick={handleCancelSuburb}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateSuburb}
                disabled={!suburbName}
              >
                Create Suburb
              </button>
            </div>
          </div>
        </div>
      )}

      {showIndividualDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Create Individual Map</h3>
            <p>Enter a name for this map:</p>
            <input
              type="text"
              className="input"
              placeholder="Map name"
              value={individualName}
              onChange={(e) => setIndividualName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && individualName) {
                  handleCreateIndividual();
                }
              }}
              autoFocus
            />
            <div className="dialog-actions">
              <button
                className="btn btn-outline"
                onClick={handleCancelIndividual}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateIndividual}
                disabled={!individualName}
              >
                Create Map
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTextAnnotation && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Edit Text Annotation</h3>
            <p>Text</p>
            <input
              type="text"
              className="input"
              value={editingTextContent}
              onChange={(e) => setEditingTextContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextAnnotationSave();
                if (e.key === 'Escape') setEditingTextAnnotation(null);
              }}
              autoFocus
            />
            <p style={{ marginTop: '12px' }}>Font size (px)</p>
            <input
              type="number"
              className="input"
              min={6}
              max={96}
              value={editingFontSize}
              onChange={(e) => setEditingFontSize(Math.max(6, Math.min(96, parseInt(e.target.value) || 20)))}
            />
            <div className="dialog-actions">
              <button
                className="btn btn-outline"
                onClick={() => setEditingTextAnnotation(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleTextAnnotationSave}
                disabled={!editingTextContent.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isExporting && (
        <div className="dialog-overlay export-progress-overlay">
          <div className="export-progress-card">
            <p className="export-progress-message">Generating export…</p>
            <div className="export-progress-bar-track">
              <div
                className="export-progress-bar-fill"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="export-progress-hint">Fetching map tiles and compositing image</p>
          </div>
        </div>
      )}

      {showExportDialog && mapArea && (
        <ExportDialog
          mapAreaName={mapArea.name}
          onExport={handleExport}
          onCancel={() => setShowExportDialog(false)}
        />
      )}

      </div> {/* Close editor-content */}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            <div className="toast-content">
              <span className="toast-icon">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'info' && 'ℹ'}
              </span>
              <span className="toast-message">{toast.message}</span>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapEditor;
