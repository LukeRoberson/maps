import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LeafletEvent, LeafletEventHandlerFn } from 'leaflet';

import type { Annotation } from '@/components/annotation/types';
import type { DrawControlsProps } from './types';



/**
 * Geoman drawing shape types.
 * Represents the available drawing modes in Leaflet Geoman.
 */
type DrawModeNames = 
  | 'Marker'
  | 'Line'
  | 'Polygon'
  | 'Rectangle'
  | 'Circle'
  | 'CircleMarker'
  | 'Text';

/**
 * Union type for layers that support GeoJSON conversion.
 * These layer types have the toGeoJSON() method.
 */
type GeoJSONLayer = L.Marker | L.Polyline | L.Polygon | L.Circle | L.CircleMarker;

/**
 * Geoman edit event interface.
 * Fired when a layer is edited via Geoman controls.
 */
interface PMEditEvent extends LeafletEvent {
  layer: GeoJSONLayer;
  shape: DrawModeNames;
}

interface PMRemoveEvent extends LeafletEvent {
  layer: GeoJSONLayer;
  shape: DrawModeNames;
}

interface PMCreateEvent extends LeafletEvent {
  layer: GeoJSONLayer;
  shape: DrawModeNames;
  marker?: L.Marker;
}

/**
 * Layer configuration interface for type-safe access to custom properties.
 */
interface LayerConfig {
  color?: string;
}



/**
 * Type guard to check if a layer has path options (color, fillColor, etc.).
 */
function hasPathOptions(
  layer: GeoJSONLayer
): layer is L.Circle | L.CircleMarker | L.Polyline | L.Polygon {
  return (
    layer instanceof L.Circle ||
    layer instanceof L.CircleMarker ||
    layer instanceof L.Polyline ||
    layer instanceof L.Polygon
  );
}

/**
 * Annotation style interface for type-safe style objects.
 */
interface AnnotationStyle {
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  weight?: number;
  [key: string]: string | number | undefined;
}


// Component to add drawing controls to the map using Leaflet Geoman
export const DrawControls: React.FC<DrawControlsProps> = ({
  mode,
  existingBoundary,
  onBoundaryCreated,
  showToast,
  activeLayerId,
  onAnnotationCreated,
  layers = [],
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
    const handleDrawStart: LeafletEventHandlerFn = (): void => {
      if (mode === 'annotation' && !activeLayerId) {
        if (showToast) {
          showToast(
            'Please select a layer before creating annotations',
            'warning'
          );
        }
        
        // Disable the drawing mode that just started
        map.pm.disableDraw();
      }
    };

    // Listen for draw mode enable events
    map.on('pm:drawstart', handleDrawStart);

    // Configure drawing styles based on mode and layer color
    let color: string;
    if (mode === 'boundary' || mode === 'suburb' || mode === 'individual') {
      color = '#3498db';
    } else if (mode === 'annotation' && activeLayerId) {
      // Get color from active layer with type-safe access
      const activeLayer = layers?.find(l => l.id === activeLayerId);
      const layerConfig = activeLayer?.config as LayerConfig | undefined;
      color = layerConfig?.color || '#2ecc71';
    } else {
      color = '#2ecc71';
    }

    map.pm.setGlobalOptions({
      pathOptions: {
        color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 3,
      },
    });

    // Prevent removal of protected layers (those with pmIgnore option)
    const handleRemove: LeafletEventHandlerFn = (event: LeafletEvent): void => {
      const e = event as PMRemoveEvent;
      const layer = e.layer;
      
      if (layer?.options?.pmIgnore) {
        // Prevent the removal
        if ('preventDefault' in e && typeof e.preventDefault === 'function') {
          e.preventDefault();
        }        
        // Re-add the layer if it was removed
        if (!map.hasLayer(layer)) {
          layer.addTo(map);
        }
        
        if (showToast) {
          showToast(
            'This boundary cannot be deleted. It belongs to a parent map.',
            'warning'
          );
        }
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
      polygon.on('pm:edit', (event: LeafletEvent): void => {
        const e = event as PMEditEvent;
        console.log('Boundary edited!', e);
        
        if (onBoundaryCreated) {
          const geoJSON = e.layer.toGeoJSON();
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
    const handleCreate: LeafletEventHandlerFn = (event: LeafletEvent): void => {
      const e = event as PMCreateEvent;
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
        let coordinates: [number, number] | [number, number][] = [0, 0];
        let annotationType: 'marker' | 'line' | 'polygon' | 'text' = 'marker';
        
        // Determine annotation type and extract coordinates
        if (e.shape === 'Text') {
          annotationType = 'text';
          // For text annotations, Geoman provides a UI input field
          // The text will be entered through Geoman's UI after the layer is placed
          
          // Extract coordinates [lat, lng]
          if (geoJSON.geometry.type === 'Point') {
            coordinates = [
              geoJSON.geometry.coordinates[1], 
              geoJSON.geometry.coordinates[0]
            ];
          }

          // Track if we've already saved this text annotation
          let textAnnotationSaved = false;
          
          // Listen for when text editing is complete (blur event or edit disabled)
          layer.on('pm:textblur pm:disable', (): void => {
            if (textAnnotationSaved) {
              return; // Already saved
            }

            // Type-safe access to Geoman text methods
            const geomanLayer = layer as unknown as {
              pm?: {
                getText?: () => string;
              };
              _text?: string;
            };
            
            content = geomanLayer.pm?.getText?.() || geomanLayer._text || '';

            // Only save if text was actually entered
            if (
              onAnnotationCreated && 
              coordinates && 
              activeLayerId && 
              content && 
              content.trim()
            ) {
              // Get layer color from active layer config
              const activeLayer = layers?.find(l => l.id === activeLayerId);
              const layerColor = (activeLayer?.config as LayerConfig)?.color || '#2ecc71';
              
              // Build style object with type-safe property access
              const style: AnnotationStyle = {};
              
              if (hasPathOptions(layer)) {
                style.color = layer.options.color || layerColor;
                style.fillColor = layer.options.fillColor;
                style.fillOpacity = layer.options.fillOpacity;
                style.weight = layer.options.weight;
              } else {
                // Marker layers - use default color
                style.color = layerColor;
              }
              
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
          const initialGeomanLayer = layer as unknown as {
            pm?: {
              getText?: () => string;
            };
            _text?: string;
          };
          content = initialGeomanLayer.pm?.getText?.() || initialGeomanLayer._text || '';
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
              (coord: number[]) => [coord[1], coord[0]] as [number, number]
            );
          }
        }
        
        // Get layer color from active layer config
        const activeLayer = layers?.find(l => l.id === activeLayerId);
        const layerConfig = activeLayer?.config as LayerConfig | undefined;
        const layerColor = layerConfig?.color || '#2ecc71';
        
        // Build style object with type-safe property access
        const style: AnnotationStyle = {};
        
        if (hasPathOptions(layer)) {
          // Layer has path options (color, fillColor, etc.)
          style.color = layer.options.color || layerColor;
          
          if (layer.options.fillColor) {
            style.fillColor = layer.options.fillColor;
          } else if (annotationType === 'polygon') {
            style.fillColor = layerColor;
          }
          
          if (layer.options.fillOpacity !== undefined) {
            style.fillOpacity = layer.options.fillOpacity;
          }
          
          if (layer.options.weight !== undefined) {
            style.weight = layer.options.weight;
          }
        } else {
          // Marker layer - use default color
          style.color = layerColor;
        }
        
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
  }, [map, mode, onBoundaryCreated, existingBoundary, activeLayerId, showToast, onAnnotationCreated, layers]);

  // Reset the loaded flag when existingBoundary changes
  useEffect(() => {
    boundaryLoadedRef.current = false;
  }, [existingBoundary]);

  return null;
};

