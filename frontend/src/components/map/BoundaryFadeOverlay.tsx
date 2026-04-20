/**
 * @fileoverview Component to fade the overlay outside the boundary of the map.
 * 
 * @remarks
 * Any additional comments about the file
 * 
 * @exports BoundaryFadeOverlay
 */


// External dependencies
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Types
import { BOUNDARY_FADE_COLOR, BOUNDARY_FADE_OPACITY } from '@/constants/drawing';
import type { BoundaryFadeOverlayProps } from '@/components/boundary/types';


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
        fillColor: BOUNDARY_FADE_COLOR,
        fillOpacity: BOUNDARY_FADE_OPACITY,
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

export default BoundaryFadeOverlay;
