/**
 * @fileoverview Component to render a read-only polygon on the map.
 * 
 * @remarks
 * Any additional comments about the file
 * 
 * @exports ReadOnlyPolygon
 */


// External dependencies
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Types
import type { ReadOnlyPolygonProps } from './types';


const ReadOnlyPolygon: React.FC<ReadOnlyPolygonProps> = ({ 
  positions, 
  pathOptions,
  hoverPathOptions,
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

    if (hoverPathOptions) {
      polygon.on('mouseover', () => polygon.setStyle(hoverPathOptions));
      polygon.on('mouseout', () => polygon.setStyle(pathOptions));
    }

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
  }, [map, positions, pathOptions, hoverPathOptions, tooltipContent, onClick]);

  return null;
};


export default ReadOnlyPolygon;
