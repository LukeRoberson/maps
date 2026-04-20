/**
 * @fileoverview A component to render annotations on the map.
 * 
 * @remarks
 * Any additional comments about the file
 * 
 * @exports AnnotationRenderer
 */


// External dependencies
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Types
import type { Annotation, AnnotationRendererProps } from '@/components/annotation/types';
import { DEFAULT_TEXT_FONT_SIZE, SNAP_DISTANCE } from '@/constants/drawing';



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
        const fontSize = (annotation.style as any)?.fontSize || DEFAULT_TEXT_FONT_SIZE;
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
              snapDistance: SNAP_DISTANCE,
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


export default AnnotationRenderer;
