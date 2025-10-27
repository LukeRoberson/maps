import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { apiClient } from '@/services/api-client';
import { LayerManager } from '@/components/layer-manager';
import type { MapArea, Project, Boundary, Layer, Annotation } from '@/types';
import './map-editor.css';
import 'leaflet/dist/leaflet.css';

// Toast notification types
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Utility function to check if all points are within a boundary polygon
const isWithinBoundary = (
  points: [number, number][],
  boundary: [number, number][]
): boolean => {
  // Use Leaflet's polygon contains method for accurate point-in-polygon testing
  const boundaryPolygon = L.polygon(boundary);
  
  for (const point of points) {
    const latLng = L.latLng(point[0], point[1]);
    // Check if point is inside or on the boundary
    if (!boundaryPolygon.getBounds().contains(latLng)) {
      return false;
    }
    // More precise check using ray casting
    const polygonPoints = boundary.map(coord => L.latLng(coord[0], coord[1]));
    if (!isPointInPolygon(latLng, polygonPoints)) {
      return false;
    }
  }
  
  return true;
};

// Ray casting algorithm for point-in-polygon test
const isPointInPolygon = (point: L.LatLng, polygon: L.LatLng[]): boolean => {
  let inside = false;
  const x = point.lat;
  const y = point.lng;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};

interface DrawControlsProps {
  mode: 'boundary' | 'annotation' | 'suburb' | 'individual';
  existingBoundary?: Boundary | null;
  onBoundaryCreated?: (coordinates: [number, number][]) => void;
  showToast?: (message: string, type: ToastType) => void;
  activeLayerId?: number | null;
  onAnnotationCreated?: (annotation: Annotation) => void;
}

// Component to add drawing controls to the map using Leaflet Geoman
const DrawControls: React.FC<DrawControlsProps> = ({
  mode,
  existingBoundary,
  onBoundaryCreated,
  showToast,
  activeLayerId,
  onAnnotationCreated,
}) => {
  const map = useMap();
  const editableLayerRef = useRef<L.Polygon | null>(null);
  const boundaryLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    // Store created layers for cleanup
    const createdLayers: L.Layer[] = [];

    // Initialize Geoman on the map
    map.pm.addControls({
      position: 'topright',
      drawMarker: mode === 'annotation',
      drawPolyline: mode === 'annotation',
      // Only allow drawing new boundaries if one doesn't exist
      drawRectangle: mode === 'boundary' && !existingBoundary ? true : mode !== 'boundary',
      drawPolygon: mode === 'boundary' && !existingBoundary ? true : mode !== 'boundary',
      drawCircle: false,
      drawCircleMarker: false,  // Disable circle marker tool
      drawText: mode === 'annotation',  // Enable text annotations
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      rotateMode: false,  // Disable rotate tool
      // Only enable removal mode in annotation mode to prevent deleting parent boundaries
      removalMode: mode === 'annotation',
    });

    // Customize button titles and icons
    const editButton = document.querySelector('.leaflet-pm-icon-edit');
    if (editButton) {
      editButton.setAttribute('title', 'Edit annotations');
    }

    // Handle Escape key to cancel drawing
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        // Check if any drawing mode is active
        if (map.pm.globalDrawModeEnabled()) {
          // Disable the current drawing mode
          map.pm.disableDraw();
          if (showToast) {
            showToast('Drawing cancelled', 'info');
          }
        }
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleEscapeKey);

    // Prevent drawing annotations without an active layer
    const handleDrawStart = (e: any) => {
      if (mode === 'annotation' && !activeLayerId) {
        if (showToast) {
          showToast('Please select a layer before creating annotations', 'warning');
        }
        // Disable the drawing mode that just started
        map.pm.disableDraw();
      }
    };

    // Listen for draw mode enable events
    map.on('pm:drawstart', handleDrawStart);

    // Configure drawing styles based on mode
    const color = mode === 'boundary' || mode === 'suburb' || mode === 'individual' 
      ? '#3498db' 
      : '#2ecc71';

    map.pm.setGlobalOptions({
      pathOptions: {
        color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 3,
      },
    });

    // Prevent removal of protected layers (those with pmIgnore option)
    const handleRemove = (e: any) => {
      const layer = e.layer;
      if (layer && layer.options && layer.options.pmIgnore) {
        // Prevent the removal
        e.preventDefault();
        // Re-add the layer if it was removed
        if (!map.hasLayer(layer)) {
          layer.addTo(map);
        }
        if (showToast) {
          showToast('This boundary cannot be deleted. It belongs to a parent map.', 'warning');
        }
        return false;
      }
    };

    map.on('pm:remove', handleRemove);

    // Load existing boundary into editable layer when in boundary mode
    // Only create the polygon once per boundary edit session
    if (mode === 'boundary' && existingBoundary && !boundaryLoadedRef.current) {
      const polygon = L.polygon(existingBoundary.coordinates, {
        color: '#3498db',
        weight: 3,
        fillColor: '#3498db',
        fillOpacity: 0.2,
        smoothFactor: 1,
      }).addTo(map);
      
      editableLayerRef.current = polygon;
      boundaryLoadedRef.current = true;
      createdLayers.push(polygon);
      
      // Enable editing for this layer with Geoman
      polygon.pm.enable({
        allowSelfIntersection: false,
        preventMarkerRemoval: false,
        snappable: true,
        snapDistance: 20,
      });
      
      // Listen to vertex drag events for real-time updates
      polygon.on('pm:vertexadded pm:vertexremoved pm:markerdrag pm:markerdragend', () => {
        // Force redraw during vertex manipulation
        polygon.redraw();
      });
      
      // Listen to edit events on this specific layer
      polygon.on('pm:edit', (e: any) => {
        console.log('Boundary edited!', e);
        if (onBoundaryCreated) {
          const geoJSON = polygon.toGeoJSON();
          if (geoJSON.geometry.type === 'Polygon') {
            const coordinates = geoJSON.geometry.coordinates[0].map(
              (coord: number[]) => [coord[1], coord[0]] as [number, number]
            );
            console.log('New coordinates:', coordinates);
            onBoundaryCreated(coordinates);
          }
        }
      });
    }

    // Handle shape creation
    const handleCreate = (e: any) => {
      const layer = e.layer;
      createdLayers.push(layer);

      if ((mode === 'boundary' || mode === 'suburb' || mode === 'individual') && onBoundaryCreated) {
        // Extract coordinates from the drawn shape
        const geoJSON = layer.toGeoJSON();
        let coordinates: [number, number][] = [];

        if (geoJSON.geometry.type === 'Polygon') {
          // Get the outer ring coordinates
          coordinates = geoJSON.geometry.coordinates[0].map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number]
          );
        }

        onBoundaryCreated(coordinates);
      } else if (mode === 'annotation') {
        // Handle annotation creation
        console.log('Annotation created:', e.shape, layer.toGeoJSON());
        
        let content: string | null = null;
        const geoJSON = layer.toGeoJSON();
        let coordinates: any;
        let annotationType: 'marker' | 'line' | 'polygon' | 'text' = 'marker';
        
        // Determine annotation type and extract coordinates
        if (e.shape === 'Text') {
          annotationType = 'text';
          // For text annotations, Geoman provides a UI input field
          // The text will be entered through Geoman's UI after the layer is placed
          
          // Extract coordinates [lat, lng]
          if (geoJSON.geometry.type === 'Point') {
            coordinates = [geoJSON.geometry.coordinates[1], geoJSON.geometry.coordinates[0]];
          }
          
          // Track if we've already saved this text annotation
          let textAnnotationSaved = false;
          
          // Listen for when text editing is complete (blur event or edit disabled)
          layer.on('pm:textblur pm:disable', () => {
            if (textAnnotationSaved) return; // Already saved
            
            content = (layer as any).pm?.getText?.() || (layer as any)._text || '';
            
            // Only save if text was actually entered
            if (onAnnotationCreated && coordinates && activeLayerId && content && content.trim()) {
              const style: any = {};
              if (layer.options.color) style.color = layer.options.color;
              if (layer.options.fillColor) style.fillColor = layer.options.fillColor;
              if (layer.options.fillOpacity !== undefined) style.fillOpacity = layer.options.fillOpacity;
              if (layer.options.weight) style.weight = layer.options.weight;
              
              const annotationData: Omit<Annotation, 'id' | 'created_at' | 'updated_at'> = {
                layer_id: activeLayerId,
                annotation_type: 'text',
                coordinates: coordinates,
                style: style,
                content: content,
              };
              
              onAnnotationCreated(annotationData as Annotation);
              textAnnotationSaved = true;
              
              if (showToast) {
                showToast('Text annotation created and saved!', 'success');
              }
            } else if (!content || !content.trim()) {
              // Remove the layer if no text was entered
              map.removeLayer(layer);
            }
          });
          
          // Get initial text if it exists (might be available immediately)
          content = (layer as any).pm?.getText?.() || (layer as any)._text || '';
        } else if (e.shape === 'Marker') {
          annotationType = 'marker';
          content = prompt('Enter label:');
          if (!content) {
            map.removeLayer(layer);
            return;
          }
          // Only bind tooltip if one doesn't already exist
          if (!layer.getTooltip()) {
            layer.bindTooltip(content, { permanent: true, direction: 'top' });
          }
          
          // Extract coordinates [lat, lng]
          if (geoJSON.geometry.type === 'Point') {
            coordinates = [geoJSON.geometry.coordinates[1], geoJSON.geometry.coordinates[0]];
          }
        } else if (e.shape === 'Line') {
          annotationType = 'line';
          if (geoJSON.geometry.type === 'LineString') {
            coordinates = geoJSON.geometry.coordinates.map(
              (coord: number[]) => [coord[1], coord[0]]
            );
          }
        } else if (e.shape === 'Polygon' || e.shape === 'Rectangle') {
          annotationType = 'polygon';
          content = prompt('Enter label:');
          if (content) {
            layer.bindTooltip(content, {
              permanent: true,
              direction: 'center',
              className: 'polygon-label'
            });
          }
          
          if (geoJSON.geometry.type === 'Polygon') {
            coordinates = geoJSON.geometry.coordinates[0].map(
              (coord: number[]) => [coord[1], coord[0]]
            );
          }
        }
        
        // Extract style information
        const style: any = {};
        if (layer.options.color) style.color = layer.options.color;
        if (layer.options.fillColor) style.fillColor = layer.options.fillColor;
        if (layer.options.fillOpacity !== undefined) style.fillOpacity = layer.options.fillOpacity;
        if (layer.options.weight) style.weight = layer.options.weight;
        
        // Save annotation to backend
        // For text annotations, we skip initial save and wait for pm:textchange event
        if (onAnnotationCreated && coordinates && activeLayerId && annotationType !== 'text') {
          const annotationData: Omit<Annotation, 'id' | 'created_at' | 'updated_at'> = {
            layer_id: activeLayerId,
            annotation_type: annotationType,
            coordinates: coordinates,
            style: style,
            content: content || undefined,
          };
          
          onAnnotationCreated(annotationData as Annotation);
          
          if (showToast) {
            showToast('Annotation created and saved!', 'success');
          }
        } else if (annotationType === 'text' && !content) {
          // Text annotation created, waiting for user to enter text via Geoman UI
          // The pm:textchange event handler will save it when text is entered
        }
      }
    };

    map.on('pm:create', handleCreate);

    // Cleanup on unmount or mode change
    return () => {
      map.off('pm:create', handleCreate);
      map.off('pm:remove', handleRemove);
      map.off('pm:drawstart', handleDrawStart);
      document.removeEventListener('keydown', handleEscapeKey);
      map.pm.removeControls();
      
      // Clear the refs when cleaning up
      if (editableLayerRef.current && map.hasLayer(editableLayerRef.current)) {
        map.removeLayer(editableLayerRef.current);
      }
      editableLayerRef.current = null;
      boundaryLoadedRef.current = false;
      
      // Remove all layers created by this component
      createdLayers.forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map, mode, onBoundaryCreated, existingBoundary, activeLayerId, showToast, onAnnotationCreated]);

  // Reset the loaded flag when existingBoundary changes
  useEffect(() => {
    boundaryLoadedRef.current = false;
  }, [existingBoundary]);

  return null;
};

// Component to render annotations on the map
interface AnnotationRendererProps {
  annotations: Annotation[];
  layers: Layer[];
  activeLayerId: number | null;
  onAnnotationClick?: (annotation: Annotation) => void;
  onAnnotationUpdated?: (annotation: Annotation) => void;
  onAnnotationDeleted?: (annotationId: number) => void;
}

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
interface MapViewControllerProps {
  onMapReady: (map: L.Map) => void;
}

const MapViewController: React.FC<MapViewControllerProps> = ({ onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
};

// Component to add a fade overlay outside the boundary
interface BoundaryFadeOverlayProps {
  boundary: Boundary;
}

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
interface ReadOnlyPolygonProps {
  positions: [number, number][];
  pathOptions: L.PathOptions;
  tooltipContent?: string;
  onClick?: () => void;
  showToast?: (message: string, type: ToastType) => void;
}

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
      // Create the suburb map area
      const suburb = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        parent_id: parseInt(mapAreaId!),
        name: suburbName,
        area_type: 'suburb',
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
      // Create the individual map area
      const individual = await apiClient.createMapArea({
        project_id: parseInt(projectId),
        parent_id: parseInt(mapAreaId!),
        name: individualName,
        area_type: 'individual',
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

  const handleExport = async (): Promise<void> => {
    showToast('Export functionality will capture the map as PNG', 'info');
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
      setMapArea(updated);
      showToast(`Default view saved! (Zoom: ${zoom})`, 'success');
    } catch (error) {
      console.error('Failed to set default view:', error);
      showToast('Failed to save default view. Please try again.', 'error');
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
              <button className="btn btn-success" onClick={handleExport}>
                Export PNG
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {boundary && mode !== 'boundary' && mapArea.area_type === 'region' && (
            <BoundaryFadeOverlay boundary={boundary} />
          )}
          {parentBoundary && mode !== 'boundary' && (mapArea.area_type === 'suburb' || mapArea.area_type === 'individual') && (
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
                onClick={() => {
                  if (confirm(`Open ${suburb?.name || 'this suburb'}?`)) {
                    navigate(`/projects/${projectId}/maps/${suburbId}`);
                  }
                }}
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
                onClick={() => {
                  if (confirm(`Open ${individual?.name || 'this map'}?`)) {
                    navigate(`/projects/${projectId}/maps/${individualId}`);
                  }
                }}
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
          />
        </MapContainer>
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
