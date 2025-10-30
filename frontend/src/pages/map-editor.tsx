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
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { toPng } from 'html-to-image';

// Internal dependencies
import { apiClient } from '@/services/api-client';
import { LayerManager } from '@/components/layer-manager';
import { ExportDialog, ExportOptions } from '@/components/export-dialog';
import { TILE_LAYER_OPTIONS, getTileLayer } from '@/constants/tile-layers';
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
});

// Component to render annotations on the map
const AnnotationRenderer: React.FC<AnnotationRendererProps> = ({
  annotations,
  layers,
  activeLayerId,
  onAnnotationClick,
  onAnnotationUpdated,
  onAnnotationDeleted,
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
        layer = L.polyline(coords, annotation.style || {});
      } else if (annotation.annotation_type === 'polygon') {
        const coords = annotation.coordinates as [number, number][];
        layer = L.polygon(coords, annotation.style || {});
        
        if (annotation.content) {
          (layer as L.Polygon).bindTooltip(annotation.content, {
            permanent: true,
            direction: 'center',
            className: 'polygon-label',
          });
        }
      } else if (annotation.annotation_type === 'text') {
        const [lat, lng] = annotation.coordinates as [number, number];
        layer = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'text-annotation',
            html: `<div style="white-space: nowrap;">${annotation.content || ''}</div>`,
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
              const newContent = prompt('Edit text:', annotation.content || '');
              if (newContent !== null && onAnnotationUpdated) {
                onAnnotationUpdated({
                  ...annotation,
                  content: newContent,
                });
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
        fillOpacity: 0.4,
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
  const [suburbs, setSuburbs] = useState<MapArea[]>([]);
  const [suburbBoundaries, setSuburbBoundaries] = useState<Record<number, Boundary>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [statusExpanded, setStatusExpanded] = useState<boolean>(false);
  const toastIdRef = useRef<number>(0);
  const [individuals, setIndividuals] = useState<MapArea[]>([]);
  const [individualBoundaries, setIndividualBoundaries] = useState<Record<number, Boundary>>({});
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
  const [showTileLayerSelector, setShowTileLayerSelector] = useState(false);
  const [currentBearing, setCurrentBearing] = useState<number>(0);
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

  // Get current tile layer configuration
  const currentTileLayer = getTileLayer(
    mapArea?.tile_layer || project?.tile_layer
  );

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

  // Memoize path options to prevent unnecessary re-renders
  const parentBoundaryPathOptions = React.useMemo(() => ({
    color: '#e74c3c',
    weight: 3,
    fillColor: 'transparent',
    fillOpacity: 0,
    dashArray: '10, 10',
  }), []);

  const currentBoundaryPathOptions = React.useMemo(() => ({
    color: '#e74c3c',
    weight: 3,
    fillColor: '#e74c3c',
    fillOpacity: 0.1,
  }), []);

  const suburbBoundaryPathOptions = React.useMemo(() => ({
    color: '#3498db',
    weight: 2,
    fillColor: '#3498db',
    fillOpacity: 0.15,
  }), []);

  const individualBoundaryPathOptions = React.useMemo(() => ({
    color: '#2ecc71',
    weight: 2,
    fillColor: '#2ecc71',
    fillOpacity: 0.15,
  }), []);

  useEffect(() => {
    loadMapData();
    loadLayers();
  }, [projectId, mapAreaId]);

  // Apply saved bearing when map and mapArea are loaded
  useEffect(() => {
    if (mapArea && mapInstance) {
      const savedBearing = mapArea.default_bearing ?? 0;
      setCurrentBearing(savedBearing);
      applyRotation(savedBearing);
    }
  }, [mapArea, mapInstance]);

  const loadLayers = async (): Promise<void> => {
    if (!mapAreaId) return;

    try {
      const loadedLayers = await apiClient.listLayers(parseInt(mapAreaId));
      setLayers(loadedLayers);
      
      // Set first editable layer as active by default if no layer is currently active
      const editableLayers = loadedLayers.filter(l => l.is_editable);
      
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

      // Load annotations for all layers
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
        // Boundary might not exist yet, that's ok
        console.log('No boundary found for this map area');
      }

      // If this is a suburb or individual map, load the parent (region or suburb) boundary
      if (mapAreaData.parent_id) {
        try {
          const parentData = await apiClient.getMapArea(mapAreaData.parent_id);
          setParentMapArea(parentData);
          
          // Load parent boundary
          try {
            const parentBoundaryData = await apiClient.getBoundaryByMapArea(
              mapAreaData.parent_id
            );
            setParentBoundary(parentBoundaryData);
          } catch (error) {
            console.log('No boundary found for parent map area');
          }
        } catch (error) {
          console.error('Failed to load parent map area:', error);
        }
      } else {
        // Clear parent data if this is a region map
        setParentMapArea(null);
        setParentBoundary(null);
      }

      // Load child map areas based on type
      if (mapAreaData.area_type === 'region') {
        // Load suburbs for region maps
        try {
          const suburbsData = await apiClient.listMapAreas(
            parseInt(projectId),
            parseInt(mapAreaId)
          );
          setSuburbs(suburbsData);

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
      // Calculate center from boundary coordinates
      const lats = pendingSuburbCoordinates.map(coord => coord[0]);
      const lons = pendingSuburbCoordinates.map(coord => coord[1]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
      
      // Create the suburb map area with inherited default view from parent
      const suburb = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        parent_id: parseInt(mapAreaId!),
        name: suburbName,
        area_type: 'suburb',
        default_center_lat: centerLat,
        default_center_lon: centerLon,
        default_zoom: mapArea?.default_zoom ?? project?.zoom_level,
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
      // Calculate center from boundary coordinates
      const lats = pendingIndividualCoordinates.map(coord => coord[0]);
      const lons = pendingIndividualCoordinates.map(coord => coord[1]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
      
      // Create the individual map area with inherited default view from parent
      const individual = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        parent_id: parseInt(mapAreaId!),
        name: individualName,
        area_type: 'individual',
        default_center_lat: centerLat,
        default_center_lon: centerLon,
        default_zoom: mapArea?.default_zoom ?? project?.zoom_level,
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
    if (!mapInstance || !mapAreaId || !mapArea) return;

    setIsExporting(true);
    setShowExportDialog(false);

    try {
      // Store current view
      const currentCenter = mapInstance.getCenter();
      const currentZoom = mapInstance.getZoom();

      // If using default view, temporarily move to it
      if (options.useDefaultView && mapArea.default_center_lat && mapArea.default_center_lon && mapArea.default_zoom) {
        mapInstance.setView(
          [mapArea.default_center_lat, mapArea.default_center_lon],
          mapArea.default_zoom,
          { animate: false }
        );
      }

      // Wait for tiles to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the map container element
      const mapContainer = mapInstance.getContainer();

      // Temporarily hide UI controls for cleaner export
      const controls = mapContainer.querySelectorAll('.leaflet-control-container');
      controls.forEach(control => {
        (control as HTMLElement).style.display = 'none';
      });

      // Optionally hide boundaries
      if (!options.includeBoundaries) {
        const boundaries = mapContainer.querySelectorAll('.leaflet-interactive');
        boundaries.forEach(boundary => {
          const element = boundary as HTMLElement;
          // Check if it's a boundary (polygon/polyline) not an annotation marker
          if (element.tagName === 'path') {
            element.style.display = 'none';
          }
        });
      }

      // Optionally hide annotations
      if (!options.includeAnnotations) {
        const markers = mapContainer.querySelectorAll('.leaflet-marker-pane, .leaflet-tooltip-pane');
        markers.forEach(marker => {
          (marker as HTMLElement).style.display = 'none';
        });
      }

      // Capture the map as PNG
      const dataUrl = await toPng(mapContainer, {
        quality: 1.0,
        pixelRatio: 2, // Higher quality export
        cacheBust: true,
      });

      // Restore UI controls
      controls.forEach(control => {
        (control as HTMLElement).style.display = '';
      });

      // Restore boundaries if hidden
      if (!options.includeBoundaries) {
        const boundaries = mapContainer.querySelectorAll('.leaflet-interactive');
        boundaries.forEach(boundary => {
          (boundary as HTMLElement).style.display = '';
        });
      }

      // Restore annotations if hidden
      if (!options.includeAnnotations) {
        const markers = mapContainer.querySelectorAll('.leaflet-marker-pane, .leaflet-tooltip-pane');
        markers.forEach(marker => {
          (marker as HTMLElement).style.display = '';
        });
      }

      // Restore original view if we changed it
      if (options.useDefaultView && mapArea.default_center_lat && mapArea.default_center_lon && mapArea.default_zoom) {
        mapInstance.setView(currentCenter, currentZoom, { animate: false });
      }

      // Handle export based on format
      if (options.format === 'clipboard') {
        // Copy to clipboard
        try {
          const blob = await (await fetch(dataUrl)).blob();
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showToast('Map copied to clipboard!', 'success');
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError);
          showToast('Failed to copy to clipboard. Your browser may not support this feature.', 'error');
        }
      } else {
        // Download as file or save to server
        const filename = `${mapArea.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
        
        // Send to server
        try {
          await apiClient.exportMap(parseInt(mapAreaId), dataUrl, filename);
          
          // Also trigger browser download
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          link.click();
          
          showToast('Map exported successfully!', 'success');
        } catch (serverError) {
          console.error('Server export error:', serverError);
          // Still allow local download even if server fails
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          link.click();
          showToast('Map downloaded (server save failed)', 'warning');
        }
      }
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
        default_bearing: currentBearing,
      });
      setMapArea(updated);
      showToast(`Default view saved! (Zoom: ${zoom}, Rotation: ${currentBearing}°)`, 'success');
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

  const handleRotateLeft = (): void => {
    const newBearing = (currentBearing - 15 + 360) % 360;
    setCurrentBearing(newBearing);
    applyRotation(newBearing);
  };

  const handleRotateRight = (): void => {
    const newBearing = (currentBearing + 15) % 360;
    setCurrentBearing(newBearing);
    applyRotation(newBearing);
  };

  const handleResetRotation = (): void => {
    setCurrentBearing(0);
    applyRotation(0);
  };

  const applyRotation = (bearing: number): void => {
    if (!mapInstance) return;
    
    const mapContainer = mapInstance.getContainer();
    const mapPane = mapContainer.querySelector('.leaflet-map-pane') as HTMLElement;
    
    if (mapPane) {
      mapPane.style.transform = `rotate(${bearing}deg)`;
      mapPane.style.transformOrigin = 'center';
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
          <div className="status-section">
            <button 
              className="status-toggle"
              onClick={() => setStatusExpanded(!statusExpanded)}
              aria-expanded={statusExpanded}
            >
              <span>{statusExpanded ? '▼' : '▶'}</span>
              Status
            </button>
            {statusExpanded && (
              <div className="status-content">
                {boundary && (
                  <p className="boundary-status">
                    ✓ Boundary defined ({boundary.coordinates.length} points)
                  </p>
                )}
                {parentBoundary && (mapArea.area_type === 'suburb' || mapArea.area_type === 'individual') && (
                  <p className="boundary-status" style={{ color: '#e74c3c' }}>
                    ⓘ {parentMapArea?.area_type === 'region' ? 'Region' : 'Suburb'} boundary shown (dashed lines)
                  </p>
                )}
                {mapArea.default_center_lat && mapArea.default_center_lon && (
                  <p className="boundary-status">
                    ✓ Default view set ({mapArea.default_center_lat.toFixed(6)}, {mapArea.default_center_lon.toFixed(6)}, zoom {mapArea.default_zoom})
                  </p>
                )}
              </div>
            )}
          </div>
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
                >
                  Add Suburb
                </button>
              )}
              {mapArea.area_type === 'suburb' && (
                <button
                  className="btn btn-success"
                  onClick={() => setMode('individual')}
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
              <div className="rotation-controls">
                <button
                  className="btn btn-icon"
                  onClick={handleRotateLeft}
                  title="Rotate left 15°"
                >
                  ↺
                </button>
                <span className="rotation-indicator">
                  {currentBearing}°
                </span>
                <button
                  className="btn btn-icon"
                  onClick={handleRotateRight}
                  title="Rotate right 15°"
                >
                  ↻
                </button>
                {currentBearing !== 0 && (
                  <button
                    className="btn btn-icon"
                    onClick={handleResetRotation}
                    title="Reset rotation"
                  >
                    ⟲
                  </button>
                )}
              </div>
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

      <div className="editor-content">
        {/* Sidebar for layer management */}
        <div className="editor-sidebar">
          {mapAreaId && (
            <LayerManager 
              mapAreaId={parseInt(mapAreaId)}
              showToast={showToast}
              activeLayerId={activeLayerId}
              onActiveLayerChange={setActiveLayerId}
              onLayersChange={loadLayers}
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
          style={{ height: '100%', width: '100%' }}
        >
          <MapViewController onMapReady={setMapInstance} />
          <TileLayer
            key={currentTileLayer.id}
            attribution={currentTileLayer.attribution}
            url={currentTileLayer.url}
            maxZoom={currentTileLayer.maxZoom}
            subdomains={currentTileLayer.subdomains}
          />
          {boundary && mode !== 'boundary' && mapArea.area_type === 'region' && (
            <BoundaryFadeOverlay boundary={boundary} />
          )}
          {parentBoundary && mode !== 'boundary' && mode !== 'individual' && (mapArea.area_type === 'suburb' || mapArea.area_type === 'individual') && (
            <>
              <BoundaryFadeOverlay boundary={parentBoundary} />
              <ReadOnlyPolygon
                positions={parentBoundary.coordinates}
                pathOptions={parentBoundaryPathOptions}
                showToast={showToast}
              />
            </>
          )}
          {boundary && mode !== 'boundary' && (
            <ReadOnlyPolygon
              positions={boundary.coordinates}
              pathOptions={currentBoundaryPathOptions}
              showToast={showToast}
            />
          )}
          {Object.entries(suburbBoundaries).map(([suburbId, suburbBoundary]) => {
            const suburb = suburbs.find(s => s.id === parseInt(suburbId));
            return (
              <ReadOnlyPolygon
                key={suburbId}
                positions={suburbBoundary.coordinates}
                pathOptions={suburbBoundaryPathOptions}
                tooltipContent={suburb?.name || 'Unnamed Suburb'}
                onClick={mode === 'annotation' || mode === 'boundary' ? () => {
                  if (confirm(`Open ${suburb?.name || 'this suburb'}?`)) {
                    navigate(`/projects/${projectId}/maps/${suburbId}`);
                  }
                } : undefined}
                showToast={showToast}
              />
            );
          })}
          {Object.entries(individualBoundaries).map(([individualId, individualBoundary]) => {
            const individual = individuals.find(i => i.id === parseInt(individualId));
            return (
              <ReadOnlyPolygon
                key={individualId}
                positions={individualBoundary.coordinates}
                pathOptions={individualBoundaryPathOptions}
                tooltipContent={individual?.name || 'Unnamed Map'}
                onClick={mode === 'annotation' || mode === 'boundary' || mode === 'suburb' ? () => {
                  if (confirm(`Open ${individual?.name || 'this map'}?`)) {
                    navigate(`/projects/${projectId}/maps/${individualId}`);
                  }
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
